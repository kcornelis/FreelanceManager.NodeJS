// Init the application configuration module for AngularJS application
var ApplicationConfiguration = function () {
    'use strict';
    // Init module configuration options
    var applicationModuleName = 'freelancemanager';
    var applicationModuleVendorDependencies = [
        'ngRoute',
        'ngAnimate',
        'ngStorage',
        'ngCookies',
        'pascalprecht.translate',
        'ui.bootstrap',
        'ui.router',
        'ui.utils',
        'oc.lazyLoad',
        'cfp.loadingBar',
        'ngSanitize',
        'ngResource'
      ];
    // Add a new vertical module
    var registerModule = function (moduleName) {
      // Create angular module
      var m = angular.module(moduleName, []);
      // Add the module to the AngularJS configuration file
      angular.module(applicationModuleName).requires.push(moduleName);
      return m;
    };
    var resolve = function () {
      var _args = arguments;
      return {
        deps: [
          '$ocLazyLoad',
          '$q',
          'APP_REQUIRES',
          function ($ocLL, $q, appRequires) {
            // Creates a promise chain for each argument
            var promise = $q.when(1);
            // empty promise
            for (var i = 0, len = _args.length; i < len; i++) {
              promise = andThen(_args[i]);
            }
            return promise;
            // creates promise to chain dynamically
            function andThen(_arg) {
              // also support a function that returns a promise
              if (typeof _arg == 'function')
                return promise.then(_arg);
              else
                return promise.then(function () {
                  // if is a module, pass the name. If not, pass the array
                  var whatToLoad = getRequired(_arg);
                  // simple error check
                  if (!whatToLoad)
                    return $.error('Route resolve: Bad resource name [' + _arg + ']');
                  // finally, return a promise
                  return $ocLL.load(whatToLoad);
                });
            }
            // check and returns required data
            // analyze module items with the form [name: '', files: []]
            // and also simple array of script files (for not angular js)
            function getRequired(name) {
              if (appRequires.modules)
                for (var m in appRequires.modules)
                  if (appRequires.modules[m].name && appRequires.modules[m].name === name)
                    return appRequires.modules[m];
              return appRequires.scripts && appRequires.scripts[name];
            }
          }
        ]
      };
    };
    return {
      applicationModuleName: applicationModuleName,
      applicationModuleVendorDependencies: applicationModuleVendorDependencies,
      registerModule: registerModule,
      resolve: resolve
    };
  }();'use strict';
//Start by defining the main module and adding the module dependencies
angular.module(ApplicationConfiguration.applicationModuleName, ApplicationConfiguration.applicationModuleVendorDependencies);
// Setting HTML5 Location Mode
angular.module(ApplicationConfiguration.applicationModuleName).config([
  '$locationProvider',
  function ($locationProvider) {
    $locationProvider.hashPrefix('!');
  }
]);
//Then define the init function for starting up the application
angular.element(document).ready(function () {
  //Then init the app
  angular.bootstrap(document, [ApplicationConfiguration.applicationModuleName]);
});ApplicationConfiguration.registerModule('account');var App = ApplicationConfiguration.registerModule('angle');ApplicationConfiguration.registerModule('core');ApplicationConfiguration.registerModule('crm');ApplicationConfiguration.registerModule('project');ApplicationConfiguration.registerModule('time');angular.module('account', ['angular-jwt']).factory('authInterceptor', [
  '$rootScope',
  '$q',
  '$window',
  function ($rootScope, $q, $window) {
    'use strict';
    return {
      request: function (config) {
        config.headers = config.headers || {};
        if ($window.localStorage.token) {
          config.headers.Authorization = 'Bearer ' + $window.localStorage.token;
        }
        return config;
      },
      response: function (response) {
        if (response.status === 401) {
        }
        return response || $q.when(response);
      }
    };
  }
]).config([
  '$httpProvider',
  function ($httpProvider) {
    'use strict';
    $httpProvider.interceptors.push('authInterceptor');
  }
]).run([
  '$rootScope',
  '$location',
  '$window',
  'jwtHelper',
  function ($rootScope, $location, $window, jwtHelper) {
    'use strict';
    $rootScope.$on('$stateChangeStart', function (event, nextRoute, currentRoute) {
      var loggedIn = $window.localStorage.token && !jwtHelper.isTokenExpired($window.localStorage.token);
      if (nextRoute.access && nextRoute.access.requiredLogin && !loggedIn) {
        $location.path('/login');
      }
    });
  }
]);angular.module('account').config([
  '$stateProvider',
  function ($stateProvider) {
    'use strict';
    $stateProvider.state('login', {
      url: '/login',
      templateUrl: 'modules/account/views/login.html'
    }).state('app.account', {
      url: '/account',
      templateUrl: 'modules/account/views/account.html',
      access: { requiredLogin: true }
    });
  }
]);angular.module('account').controller('AccountInfoController', [
  '$scope',
  '$window',
  'jwtHelper',
  'Account',
  function ($scope, $window, jwtHelper, Account) {
    'use strict';
    var token = jwtHelper.decodeToken($window.localStorage.token);
    Account.get({ id: token.id }).$promise.then(function (response) {
      $scope.account = response;
    });
    $scope.save = function () {
      Account.save(token.id, $scope.account);
    };
  }
]);angular.module('account').controller('AuthenticateController', [
  '$rootScope',
  '$scope',
  '$http',
  '$window',
  '$location',
  'jwtHelper',
  function ($rootScope, $scope, $http, $window, $location, jwtHelper) {
    'use strict';
    $scope.user = {
      email: '',
      password: ''
    };
    $scope.error = '';
    $scope.submit = function () {
      $http.post('/security/authenticate', $scope.user).success(function (data, status, headers, config) {
        var decrypted = jwtHelper.decodeToken(data.token);
        $window.localStorage.user = decrypted.fullName;
        $window.localStorage.token = data.token;
        $location.path('/');
      }).error(function (data, status, headers, config) {
        // Erase the token if the user fails to log in
        delete $window.localStorage.token;
        delete $rootScope.$storage.user;
        // Handle login errors here
        $scope.error = 'Invalid email or password';
      });
    };
  }
]);/**=========================================================
 * Module: config.js
 * App routes and resources configuration
 =========================================================*/
App.config([
  '$stateProvider',
  '$urlRouterProvider',
  '$controllerProvider',
  '$compileProvider',
  '$filterProvider',
  '$provide',
  '$ocLazyLoadProvider',
  'APP_REQUIRES',
  function ($stateProvider, $urlRouterProvider, $controllerProvider, $compileProvider, $filterProvider, $provide, $ocLazyLoadProvider, appRequires) {
    'use strict';
    App.controller = $controllerProvider.register;
    App.directive = $compileProvider.directive;
    App.filter = $filterProvider.register;
    App.factory = $provide.factory;
    App.service = $provide.service;
    App.constant = $provide.constant;
    App.value = $provide.value;
    // LAZY MODULES
    // ----------------------------------- 
    $ocLazyLoadProvider.config({
      debug: false,
      events: true,
      modules: appRequires.modules
    });
  }
]).config([
  '$translateProvider',
  function ($translateProvider) {
    $translateProvider.useStaticFilesLoader({
      prefix: 'i18n/',
      suffix: '.json'
    });
    $translateProvider.preferredLanguage('en');
    $translateProvider.useLocalStorage();
  }
]).config([
  'cfpLoadingBarProvider',
  function (cfpLoadingBarProvider) {
    cfpLoadingBarProvider.includeBar = true;
    cfpLoadingBarProvider.includeSpinner = false;
    cfpLoadingBarProvider.latencyThreshold = 500;
    cfpLoadingBarProvider.parentSelector = '.wrapper > section';
  }
]).controller('NullController', function () {
}).run([
  '$rootScope',
  '$state',
  '$stateParams',
  '$window',
  '$templateCache',
  function ($rootScope, $state, $stateParams, $window, $templateCache) {
    // Set reference to access them from any scope
    $rootScope.$state = $state;
    $rootScope.$stateParams = $stateParams;
    $rootScope.$storage = $window.localStorage;
    // Scope Globals
    // ----------------------------------- 
    $rootScope.app = {
      name: 'Freelance Manager',
      description: 'A demo application in NodeJS',
      author: 'Kevin Cornelis',
      year: new Date().getFullYear(),
      layout: {
        isFixed: true,
        isCollapsed: false,
        isBoxed: false,
        isRTL: false
      },
      viewAnimation: 'ng-fadeInUp'
    };
  }
]);/**=========================================================
 * Module: constants.js
 * Define constants to inject across the application
 =========================================================*/
App.constant('APP_COLORS', {
  'primary': '#5d9cec',
  'success': '#27c24c',
  'info': '#23b7e5',
  'warning': '#ff902b',
  'danger': '#f05050',
  'inverse': '#131e26',
  'green': '#37bc9b',
  'pink': '#f532e5',
  'purple': '#7266ba',
  'dark': '#3a3f51',
  'yellow': '#fad732',
  'gray-darker': '#232735',
  'gray-dark': '#3a3f51',
  'gray': '#dde6e9',
  'gray-light': '#e4eaec',
  'gray-lighter': '#edf1f2'
}).constant('APP_MEDIAQUERY', {
  'desktopLG': 1200,
  'desktop': 992,
  'tablet': 768,
  'mobile': 480
}).constant('APP_REQUIRES', {
  scripts: {
    'whirl': ['lib/whirl/dist/whirl.css'],
    'classyloader': ['lib/jquery-classyloader/js/jquery.classyloader.min.js'],
    'animo': ['lib/animo.js/animo.js'],
    'fastclick': ['lib/fastclick/lib/fastclick.js'],
    'modernizr': ['lib/modernizr/modernizr.js'],
    'animate': ['lib/animate.css/animate.min.css'],
    'icons': [
      'lib/skycons/skycons.js',
      'lib/fontawesome/css/font-awesome.min.css',
      'lib/simple-line-icons/css/simple-line-icons.css',
      'lib/weather-icons/css/weather-icons.min.css'
    ],
    'sparklines': ['unmanagedbowerlib/sparklines/jquery.sparkline.min.js'],
    'slider': [
      'lib/seiyria-bootstrap-slider/dist/bootstrap-slider.min.js',
      'lib/seiyria-bootstrap-slider/dist/css/bootstrap-slider.min.css'
    ],
    'wysiwyg': [
      'lib/bootstrap-wysiwyg/bootstrap-wysiwyg.js',
      'lib/bootstrap-wysiwyg/external/jquery.hotkeys.js'
    ],
    'slimscroll': ['lib/slimScroll/jquery.slimscroll.min.js'],
    'screenfull': ['lib/screenfull/dist/screenfull.min.js'],
    'vector-map': [
      'lib/ika.jvectormap/jquery-jvectormap-1.2.2.min.js',
      'lib/ika.jvectormap/jquery-jvectormap-world-mill-en.js',
      'lib/ika.jvectormap/jquery-jvectormap-us-mill-en.js',
      'lib/ika.jvectormap/jquery-jvectormap-1.2.2.css'
    ],
    'loadGoogleMapsJS': ['unmanagedbowerlib/gmap/load-google-maps.js'],
    'google-map': ['lib/jQuery-gMap/jquery.gmap.min.js'],
    'flot-chart': ['lib/Flot/jquery.flot.js'],
    'flot-chart-plugins': [
      'lib/flot.tooltip/js/jquery.flot.tooltip.min.js',
      'lib/Flot/jquery.flot.resize.js',
      'lib/Flot/jquery.flot.pie.js',
      'lib/Flot/jquery.flot.time.js',
      'lib/Flot/jquery.flot.categories.js',
      'lib/flot-spline/js/jquery.flot.spline.min.js'
    ],
    'jquery-ui': [
      'lib/jquery-ui/ui/core.js',
      'lib/jquery-ui/ui/widget.js'
    ],
    'jquery-ui-widgets': [
      'lib/jquery-ui/ui/core.js',
      'lib/jquery-ui/ui/widget.js',
      'lib/jquery-ui/ui/mouse.js',
      'lib/jquery-ui/ui/draggable.js',
      'lib/jquery-ui/ui/droppable.js',
      'lib/jquery-ui/ui/sortable.js',
      'lib/jqueryui-touch-punch/jquery.ui.touch-punch.min.js'
    ],
    'moment': ['lib/moment/min/moment-with-locales.min.js'],
    'inputmask': ['lib/jquery.inputmask/dist/jquery.inputmask.bundle.min.js'],
    'flatdoc': ['lib/flatdoc/flatdoc.js'],
    'codemirror': [
      'lib/codemirror/lib/codemirror.js',
      'lib/codemirror/lib/codemirror.css'
    ],
    'codemirror-plugins': [
      'lib/codemirror/addon/mode/overlay.js',
      'lib/codemirror/mode/markdown/markdown.js',
      'lib/codemirror/mode/xml/xml.js',
      'lib/codemirror/mode/gfm/gfm.js',
      'lib/marked/lib/marked.js'
    ],
    'taginput': [
      'lib/bootstrap-tagsinput/dist/bootstrap-tagsinput.css',
      'lib/bootstrap-tagsinput/dist/bootstrap-tagsinput.min.js'
    ],
    'filestyle': ['lib/bootstrap-filestyle/src/bootstrap-filestyle.js'],
    'parsley': ['lib/parsleyjs/dist/parsley.min.js'],
    'datatables': [
      'lib/datatables/media/js/jquery.dataTables.min.js',
      'unmanagedbowerlib/datatable-bootstrap/css/dataTables.bootstrap.css'
    ],
    'datatables-pugins': [
      'unmanagedbowerlib/datatable-bootstrap/js/dataTables.bootstrap.js',
      'unmanagedbowerlib/datatable-bootstrap/js/dataTables.bootstrapPagination.js',
      'lib/datatables-colvis/js/dataTables.colVis.js',
      'lib/datatables-colvis/css/dataTables.colVis.css'
    ],
    'fullcalendar': [
      'lib/fullcalendar/dist/fullcalendar.min.js',
      'lib/fullcalendar/dist/fullcalendar.css'
    ],
    'gcal': ['lib/fullcalendar/dist/gcal.js'],
    'datetime': [
      'lib/clockpicker/dist/bootstrap-clockpicker.css',
      'lib/bootstrap-datepicker/css/datepicker3.css',
      'lib/clockpicker/dist/bootstrap-clockpicker.js',
      'lib/bootstrap-datepicker/js/bootstrap-datepicker.js'
    ],
    'excel': ['lib/js-xlsx/dist/xlsx.core.min.js']
  },
  modules: [
    {
      name: 'toaster',
      files: [
        'lib/angularjs-toaster/toaster.js',
        'lib/angularjs-toaster/toaster.css'
      ]
    },
    {
      name: 'localytics.directives',
      files: [
        'lib/chosen_v1.2.0/chosen.jquery.min.js',
        'lib/chosen_v1.2.0/chosen.min.css',
        'lib/angular-chosen-localytics/chosen.js'
      ]
    },
    {
      name: 'ngDialog',
      files: [
        'lib/ngDialog/js/ngDialog.min.js',
        'lib/ngDialog/css/ngDialog.min.css',
        'lib/ngDialog/css/ngDialog-theme-default.min.css'
      ]
    },
    {
      name: 'ngWig',
      files: ['lib/ngWig/dist/ng-wig.min.js']
    },
    {
      name: 'ngTable',
      files: [
        'lib/ng-table/ng-table.min.js',
        'lib/ng-table/ng-table.min.css'
      ]
    },
    {
      name: 'ngTableExport',
      files: ['lib/ng-table-export/ng-table-export.js']
    }
  ]
});
;/**=========================================================
 * Module: main.js
 * Main Application Controller
 =========================================================*/
App.controller('AppController', [
  '$rootScope',
  '$scope',
  '$state',
  '$translate',
  '$window',
  '$localStorage',
  '$timeout',
  'toggleStateService',
  'colors',
  'browser',
  'cfpLoadingBar',
  function ($rootScope, $scope, $state, $translate, $window, $localStorage, $timeout, toggle, colors, browser, cfpLoadingBar) {
    'use strict';
    // Loading bar transition
    // ----------------------------------- 
    var thBar;
    $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
      if ($('.wrapper > section').length && !thBar)
        // check if bar container exists
        //thBar = $timeout(function() {
        cfpLoadingBar.start();
      thBar = 1;  //}, 0); // sets a latency Threshold
    });
    $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
      event.targetScope.$watch('$viewContentLoaded', function () {
        //$timeout.cancel(thBar);
        cfpLoadingBar.complete();
        thBar = null;
      });
    });
    // Hook not found
    $rootScope.$on('$stateNotFound', function (event, unfoundState, fromState, fromParams) {
      console.log(unfoundState.to);
      // "lazy.state"
      console.log(unfoundState.toParams);
      // {a:1, b:2}
      console.log(unfoundState.options);  // {inherit:false} + default options
    });
    // Hook error
    $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams, error) {
      console.log(error);
    });
    // Hook success
    $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
      // display new view from top
      $window.scrollTo(0, 0);
      // Save the route title
      $rootScope.currTitle = $state.current.title;
    });
    $rootScope.currTitle = $state.current.title;
    $rootScope.pageTitle = function () {
      return $rootScope.app.name + ' - ' + ($rootScope.currTitle || $rootScope.app.description);
    };
    // iPad may presents ghost click issues
    // if( ! browser.ipad )
    // FastClick.attach(document.body);
    // Close submenu when sidebar change from collapsed to normal
    $rootScope.$watch('app.layout.isCollapsed', function (newValue, oldValue) {
      if (newValue === false)
        $rootScope.$broadcast('closeSidebarMenu');
    });
    // Restore layout settings
    if (angular.isDefined($localStorage.layout))
      $scope.app.layout = $localStorage.layout;
    else
      $localStorage.layout = $scope.app.layout;
    $rootScope.$watch('app.layout', function () {
      $localStorage.layout = $scope.app.layout;
    }, true);
    // Allows to use branding color with interpolation
    // {{ colorByName('primary') }}
    $scope.colorByName = colors.byName;
    // Hides/show user avatar on sidebar
    $scope.toggleUserBlock = function () {
      $scope.$broadcast('toggleUserBlock');
    };
    // Internationalization
    // ----------------------
    $scope.language = {
      listIsOpen: false,
      available: { 'en': 'English' },
      init: function () {
        var proposedLanguage = $translate.proposedLanguage() || $translate.use();
        var preferredLanguage = $translate.preferredLanguage();
        // we know we have set a preferred one in app.config
        $scope.language.selected = $scope.language.available[proposedLanguage || preferredLanguage];
      },
      set: function (localeId, ev) {
        // Set the new idiom
        $translate.use(localeId);
        // save a reference for the current language
        $scope.language.selected = $scope.language.available[localeId];
        // finally toggle dropdown
        $scope.language.listIsOpen = !$scope.language.listIsOpen;
      }
    };
    $scope.language.init();
    // Restore application classes state
    toggle.restoreState($(document.body));
    // Applies animation to main view for the next pages to load
    $timeout(function () {
      $rootScope.mainViewAnimation = $rootScope.app.viewAnimation;
    });
    // cancel click event easily
    $rootScope.cancel = function ($event) {
      $event.stopPropagation();
    };
  }
]);/**=========================================================
 * Module: sidebar-menu.js
 * Provides a simple way to implement bootstrap collapse plugin using a target 
 * next to the current element (sibling)
 * Targeted elements must have [data-toggle="collapse-next"]
 =========================================================*/
App.controller('SidebarController', [
  '$rootScope',
  '$scope',
  '$state',
  '$location',
  '$http',
  '$timeout',
  'APP_MEDIAQUERY',
  function ($rootScope, $scope, $state, $location, $http, $timeout, mq) {
    var currentState = $rootScope.$state.current.name;
    var $win = $(window);
    var $html = $('html');
    var $body = $('body');
    // Adjustment on route changes
    $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
      currentState = toState.name;
      // Hide sidebar automatically on mobile
      $('body.aside-toggled').removeClass('aside-toggled');
      $rootScope.$broadcast('closeSidebarMenu');
    });
    // Normalize state on resize to avoid multiple checks
    $win.on('resize', function () {
      if (isMobile())
        $body.removeClass('aside-collapsed');
      else
        $body.removeClass('aside-toggled');
    });
    // Check item and children active state
    var isActive = function (item) {
      if (!item)
        return;
      if (!item.sref || item.sref == '#') {
        var foundActive = false;
        angular.forEach(item.submenu, function (value, key) {
          if (isActive(value))
            foundActive = true;
        });
        return foundActive;
      } else
        return $state.is(item.sref) || $state.includes(item.sref);
    };
    // Load menu from json file
    // ----------------------------------- 
    $scope.getMenuItemPropClasses = function (item) {
      return (item.heading ? 'nav-heading' : '') + (isActive(item) ? ' active' : '');
    };
    $scope.loadSidebarMenu = function () {
      var menuJson = 'settings/sidebar-menu.json', menuURL = menuJson + '?v=' + new Date().getTime();
      // jumps cache
      $http.get(menuURL).success(function (items) {
        $rootScope.menuItems = items;
      }).error(function (data, status, headers, config) {
        alert('Failure loading menu');
      });
    };
    $scope.loadSidebarMenu();
    // Handle sidebar collapse items
    // ----------------------------------- 
    var collapseList = [];
    $scope.addCollapse = function ($index, item) {
      collapseList[$index] = !isActive(item);
    };
    $scope.isCollapse = function ($index) {
      return collapseList[$index];
    };
    $scope.toggleCollapse = function ($index, isParentItem) {
      // collapsed sidebar doesn't toggle drodopwn
      if (isSidebarCollapsed() && !isMobile())
        return true;
      // make sure the item index exists
      if (angular.isDefined(collapseList[$index])) {
        collapseList[$index] = !collapseList[$index];
        closeAllBut($index);
      } else if (isParentItem) {
        closeAllBut(-1);
      }
      return true;
      function closeAllBut(index) {
        index += '';
        for (var i in collapseList) {
          if (index < 0 || index.indexOf(i) < 0)
            collapseList[i] = true;
        }  // angular.forEach(collapseList, function(v, i) {
           // });
      }
    };
    // Helper checks
    // ----------------------------------- 
    function isMobile() {
      return $win.width() < mq.tablet;
    }
    function isTouch() {
      return $html.hasClass('touch');
    }
    function isSidebarCollapsed() {
      return $body.hasClass('aside-collapsed');
    }
    function isSidebarToggled() {
      return $body.hasClass('aside-toggled');
    }
  }
]);/**=========================================================
 * Module: anchor.js
 * Disables null anchor behavior
 =========================================================*/
App.directive('href', function () {
  return {
    restrict: 'A',
    compile: function (element, attr) {
      return function (scope, element) {
        if (attr.ngClick || attr.href === '' || attr.href === '#') {
          if (!element.hasClass('dropdown-toggle'))
            element.on('click', function (e) {
              e.preventDefault();
              e.stopPropagation();
            });
        }
      };
    }
  };
});/**=========================================================
 * Module: animate-enabled.js
 * Enable or disables ngAnimate for element with directive
 =========================================================*/
App.directive('animateEnabled', [
  '$animate',
  function ($animate) {
    return {
      link: function (scope, element, attrs) {
        scope.$watch(function () {
          return scope.$eval(attrs.animateEnabled, scope);
        }, function (newValue) {
          $animate.enabled(!!newValue, element);
        });
      }
    };
  }
]);/**=========================================================
 * Module: classy-loader.js
 * Enable use of classyloader directly from data attributes
 =========================================================*/
App.directive('classyloader', function ($timeout) {
  'use strict';
  var $scroller = $(window), inViewFlagClass = 'js-is-in-view';
  // a classname to detect when a chart has been triggered after scroll
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      // run after interpolation  
      $timeout(function () {
        var $element = $(element), options = $element.data();
        // At lease we need a data-percentage attribute
        if (options) {
          if (options.triggerInView) {
            $scroller.scroll(function () {
              checkLoaderInVIew($element, options);
            });
            // if the element starts already in view
            checkLoaderInVIew($element, options);
          } else
            startLoader($element, options);
        }
      }, 0);
      function checkLoaderInVIew(element, options) {
        var offset = -20;
        if (!element.hasClass(inViewFlagClass) && $.Utils.isInView(element, { topoffset: offset })) {
          startLoader(element, options);
        }
      }
      function startLoader(element, options) {
        element.ClassyLoader(options).addClass(inViewFlagClass);
      }
    }
  };
});/**=========================================================
 * Module: clear-storage.js
 * Removes a key from the browser storage via element click
 =========================================================*/
App.directive('resetKey', [
  '$state',
  '$rootScope',
  function ($state, $rootScope) {
    'use strict';
    return {
      restrict: 'A',
      scope: { resetKey: '=' },
      link: function (scope, element, attrs) {
        scope.resetKey = attrs.resetKey;
      },
      controller: function ($scope, $element) {
        $element.on('click', function (e) {
          e.preventDefault();
          if ($scope.resetKey) {
            delete $rootScope.$storage[$scope.resetKey];
            $state.go($state.current, {}, { reload: true });
          } else {
            $.error('No storage key specified for reset.');
          }
        });
      }
    };
  }
]);/**=========================================================
 * Module: filestyle.js
 * Initializes the fielstyle plugin
 =========================================================*/
App.directive('filestyle', function () {
  return {
    restrict: 'A',
    controller: function ($scope, $element) {
      var $elem = $($element);
      $elem.filestyle({ classInput: $elem.data('classinput') });
    }
  };
});/**=========================================================
 * Module: flatdoc.js
 * Creates the flatdoc markup and initializes the plugin
 =========================================================*/
App.directive('flatdoc', [
  '$location',
  function ($location) {
    return {
      restrict: 'EA',
      template: '<div role=\'flatdoc\'><div role=\'flatdoc-menu\'></div><div role=\'flatdoc-content\'></div></div>',
      link: function (scope, element, attrs) {
        Flatdoc.run({ fetcher: Flatdoc.file(attrs.src) });
        var $root = $('html, body');
        $(document).on('flatdoc:ready', function () {
          var docMenu = $('[role="flatdoc-menu"]');
          docMenu.find('a').on('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            var $this = $(this);
            docMenu.find('a.active').removeClass('active');
            $this.addClass('active');
            $root.animate({ scrollTop: $(this.getAttribute('href')).offset().top - ($('.topnavbar').height() + 10) }, 800);
          });
        });
      }
    };
  }
]);/**=========================================================
 * Module: form-wizard.js
 * Handles form wizard plugin and validation
 =========================================================*/
App.directive('formWizard', function ($parse) {
  'use strict';
  return {
    restrict: 'EA',
    scope: true,
    link: function (scope, element, attribute) {
      var validate = $parse(attribute.validateSteps)(scope), wiz = new Wizard(attribute.steps, !!validate, element);
      scope.wizard = wiz.init();
    }
  };
  function Wizard(quantity, validate, element) {
    var self = this;
    self.quantity = parseInt(quantity, 10);
    self.validate = validate;
    self.element = element;
    self.init = function () {
      self.createsteps(self.quantity);
      self.go(1);
      // always start at fist step
      return self;
    };
    self.go = function (step) {
      if (angular.isDefined(self.steps[step])) {
        if (self.validate && step !== 1) {
          var form = $(self.element), group = form.children().children('div').get(step - 2);
          if (false === form.parsley().validate(group.id)) {
            return false;
          }
        }
        self.cleanall();
        self.steps[step] = true;
      }
    };
    self.active = function (step) {
      return !!self.steps[step];
    };
    self.cleanall = function () {
      for (var i in self.steps) {
        self.steps[i] = false;
      }
    };
    self.createsteps = function (q) {
      self.steps = [];
      for (var i = 1; i <= q; i++)
        self.steps[i] = false;
    };
  }
});/**=========================================================
 * Module: fullscreen.js
 * Toggle the fullscreen mode on/off
 =========================================================*/
App.directive('toggleFullscreen', function () {
  'use strict';
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      element.on('click', function (e) {
        e.preventDefault();
        if (screenfull.enabled) {
          screenfull.toggle();
          // Switch icon indicator
          if (screenfull.isFullscreen)
            $(this).children('em').removeClass('fa-expand').addClass('fa-compress');
          else
            $(this).children('em').removeClass('fa-compress').addClass('fa-expand');
        } else {
          $.error('Fullscreen not enabled');
        }
      });
    }
  };
});/**=========================================================
 * Module: gmap.js
 * Init Google Map plugin
 =========================================================*/
App.directive('gmap', [
  '$window',
  'gmap',
  function ($window, gmap) {
    'use strict';
    // Map Style definition
    // Get more styles from http://snazzymaps.com/style/29/light-monochrome
    // - Just replace and assign to 'MapStyles' the new style array
    var MapStyles = [
        {
          featureType: 'water',
          stylers: [
            { visibility: 'on' },
            { color: '#bdd1f9' }
          ]
        },
        {
          featureType: 'all',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#334165' }]
        },
        {
          featureType: 'landscape',
          stylers: [{ color: '#e9ebf1' }]
        },
        {
          featureType: 'road.highway',
          elementType: 'geometry',
          stylers: [{ color: '#c5c6c6' }]
        },
        {
          featureType: 'road.arterial',
          elementType: 'geometry',
          stylers: [{ color: '#fff' }]
        },
        {
          featureType: 'road.local',
          elementType: 'geometry',
          stylers: [{ color: '#fff' }]
        },
        {
          featureType: 'transit',
          elementType: 'geometry',
          stylers: [{ color: '#d8dbe0' }]
        },
        {
          featureType: 'poi',
          elementType: 'geometry',
          stylers: [{ color: '#cfd5e0' }]
        },
        {
          featureType: 'administrative',
          stylers: [
            { visibility: 'on' },
            { lightness: 33 }
          ]
        },
        {
          featureType: 'poi.park',
          elementType: 'labels',
          stylers: [
            { visibility: 'on' },
            { lightness: 20 }
          ]
        },
        {
          featureType: 'road',
          stylers: [{
              color: '#d8dbe0',
              lightness: 20
            }]
        }
      ];
    gmap.setStyle(MapStyles);
    // Center Map marker on resolution change
    $($window).resize(function () {
      gmap.autocenter();
    });
    return {
      restrict: 'A',
      link: function (scope, element) {
        gmap.init(element);
      }
    };
  }
]);/**=========================================================
 * Module: load-css.js
 * Request and load into the current page a css file
 =========================================================*/
App.directive('loadCss', function () {
  'use strict';
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      element.on('click', function (e) {
        if (element.is('a'))
          e.preventDefault();
        var uri = attrs.loadCss, link;
        if (uri) {
          link = createLink(uri);
          if (!link) {
            $.error('Error creating stylesheet link element.');
          }
        } else {
          $.error('No stylesheet location defined.');
        }
      });
    }
  };
  function createLink(uri) {
    var linkId = 'autoloaded-stylesheet', oldLink = $('#' + linkId).attr('id', linkId + '-old');
    $('head').append($('<link/>').attr({
      'id': linkId,
      'rel': 'stylesheet',
      'href': uri
    }));
    if (oldLink.length) {
      oldLink.remove();
    }
    return $('#' + linkId);
  }
});/**=========================================================
 * Module: markdownarea.js
 * Markdown Editor from UIKit adapted for Bootstrap Layout.
 =========================================================*/
App.directive('markdownarea', function () {
  'use strict';
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      var area = $(element), Markdownarea = $.fn['markdownarea'], options = $.Utils.options(attrs.markdownarea);
      var obj = new Markdownarea(area, $.Utils.options(attrs.markdownarea));
    }
  };
});
// Markdown plugin defintion
// Customized to work with bootstrap 
// classnames
// ----------------------------------- 
(function ($, window, document) {
  'use strict';
  var Markdownarea = function (element, options) {
    var $element = $(element);
    if ($element.data('markdownarea'))
      return;
    this.element = $element;
    this.options = $.extend({}, Markdownarea.defaults, options);
    this.marked = this.options.marked || marked;
    this.CodeMirror = this.options.CodeMirror || CodeMirror;
    this.marked.setOptions({
      gfm: true,
      tables: true,
      breaks: true,
      pedantic: true,
      sanitize: false,
      smartLists: true,
      smartypants: false,
      langPrefix: 'lang-'
    });
    this.init();
    this.element.data('markdownarea', this);
  };
  $.extend(Markdownarea.prototype, {
    init: function () {
      var $this = this, tpl = Markdownarea.template;
      tpl = tpl.replace(/\{\:lblPreview\}/g, this.options.lblPreview);
      tpl = tpl.replace(/\{\:lblCodeview\}/g, this.options.lblCodeview);
      this.markdownarea = $(tpl);
      this.content = this.markdownarea.find('.uk-markdownarea-content');
      this.toolbar = this.markdownarea.find('.uk-markdownarea-toolbar');
      this.preview = this.markdownarea.find('.uk-markdownarea-preview').children().eq(0);
      this.code = this.markdownarea.find('.uk-markdownarea-code');
      this.element.before(this.markdownarea).appendTo(this.code);
      this.editor = this.CodeMirror.fromTextArea(this.element[0], this.options.codemirror);
      this.editor.markdownarea = this;
      this.editor.on('change', function () {
        var render = function () {
          var value = $this.editor.getValue();
          $this.currentvalue = String(value);
          $this.element.trigger('markdownarea-before', [$this]);
          $this.applyPlugins();
          $this.marked($this.currentvalue, function (err, markdown) {
            if (err)
              throw err;
            $this.preview.html(markdown);
            $this.element.val($this.editor.getValue()).trigger('markdownarea-update', [$this]);
          });
        };
        render();
        return $.Utils.debounce(render, 150);
      }());
      this.code.find('.CodeMirror').css('height', this.options.height);
      this._buildtoolbar();
      this.fit();
      $(window).on('resize', $.Utils.debounce(function () {
        $this.fit();
      }, 200));
      var previewContainer = $this.preview.parent(), codeContent = this.code.find('.CodeMirror-sizer'), codeScroll = this.code.find('.CodeMirror-scroll').on('scroll', $.Utils.debounce(function () {
          if ($this.markdownarea.attr('data-mode') == 'tab')
            return;
          // calc position
          var codeHeight = codeContent.height() - codeScroll.height(), previewHeight = previewContainer[0].scrollHeight - previewContainer.height(), ratio = previewHeight / codeHeight, previewPostition = codeScroll.scrollTop() * ratio;
          // apply new scroll
          previewContainer.scrollTop(previewPostition);
        }, 10));
      this.markdownarea.on('click', '.uk-markdown-button-markdown, .uk-markdown-button-preview', function (e) {
        e.preventDefault();
        if ($this.markdownarea.attr('data-mode') == 'tab') {
          $this.markdownarea.find('.uk-markdown-button-markdown, .uk-markdown-button-preview').removeClass('uk-active').filter(this).addClass('uk-active');
          $this.activetab = $(this).hasClass('uk-markdown-button-markdown') ? 'code' : 'preview';
          $this.markdownarea.attr('data-active-tab', $this.activetab);
        }
      });
      this.preview.parent().css('height', this.code.height());
    },
    applyPlugins: function () {
      var $this = this, plugins = Object.keys(Markdownarea.plugins), plgs = Markdownarea.plugins;
      this.markers = {};
      if (plugins.length) {
        var lines = this.currentvalue.split('\n');
        plugins.forEach(function (name) {
          this.markers[name] = [];
        }, this);
        for (var line = 0, max = lines.length; line < max; line++) {
          (function (line) {
            plugins.forEach(function (name) {
              var i = 0;
              lines[line] = lines[line].replace(plgs[name].identifier, function () {
                var replacement = plgs[name].cb({
                    'area': $this,
                    'found': arguments,
                    'line': line,
                    'pos': i++,
                    'uid': [
                      name,
                      line,
                      i,
                      new Date().getTime() + 'RAND' + Math.ceil(Math.random() * 100000)
                    ].join('-'),
                    'replace': function (strwith) {
                      var src = this.area.editor.getLine(this.line), start = src.indexOf(this.found[0]), end = start + this.found[0].length;
                      this.area.editor.replaceRange(strwith, {
                        'line': this.line,
                        'ch': start
                      }, {
                        'line': this.line,
                        'ch': end
                      });
                    }
                  });
                return replacement;
              });
            });
          }(line));
        }
        this.currentvalue = lines.join('\n');
      }
    },
    _buildtoolbar: function () {
      if (!(this.options.toolbar && this.options.toolbar.length))
        return;
      var $this = this, bar = [];
      this.options.toolbar.forEach(function (cmd) {
        if (Markdownarea.commands[cmd]) {
          var title = Markdownarea.commands[cmd].title ? Markdownarea.commands[cmd].title : cmd;
          bar.push('<li><a data-markdownarea-cmd="' + cmd + '" title="' + title + '" data-toggle="tooltip">' + Markdownarea.commands[cmd].label + '</a></li>');
          if (Markdownarea.commands[cmd].shortcut) {
            $this.registerShortcut(Markdownarea.commands[cmd].shortcut, Markdownarea.commands[cmd].action);
          }
        }
      });
      this.toolbar.html(bar.join('\n'));
      this.markdownarea.on('click', 'a[data-markdownarea-cmd]', function () {
        var cmd = $(this).data('markdownareaCmd');
        if (cmd && Markdownarea.commands[cmd] && (!$this.activetab || $this.activetab == 'code' || cmd == 'fullscreen')) {
          Markdownarea.commands[cmd].action.apply($this, [$this.editor]);
        }
      });
    },
    fit: function () {
      var mode = this.options.mode;
      if (mode == 'split' && this.markdownarea.width() < this.options.maxsplitsize) {
        mode = 'tab';
      }
      if (mode == 'tab') {
        if (!this.activetab) {
          this.activetab = 'code';
          this.markdownarea.attr('data-active-tab', this.activetab);
        }
        this.markdownarea.find('.uk-markdown-button-markdown, .uk-markdown-button-preview').removeClass('uk-active').filter(this.activetab == 'code' ? '.uk-markdown-button-markdown' : '.uk-markdown-button-preview').addClass('uk-active');
      }
      this.editor.refresh();
      this.preview.parent().css('height', this.code.height());
      this.markdownarea.attr('data-mode', mode);
    },
    registerShortcut: function (combination, callback) {
      var $this = this;
      combination = $.isArray(combination) ? combination : [combination];
      for (var i = 0, max = combination.length; i < max; i++) {
        var map = {};
        map[combination[i]] = function () {
          callback.apply($this, [$this.editor]);
        };
        $this.editor.addKeyMap(map);
      }
    },
    getMode: function () {
      var pos = this.editor.getDoc().getCursor();
      return this.editor.getTokenAt(pos).state.base.htmlState ? 'html' : 'markdown';
    }
  });
  //jQuery plugin
  $.fn.markdownarea = function (options) {
    return this.each(function () {
      var ele = $(this);
      if (!ele.data('markdownarea')) {
        var obj = new Markdownarea(ele, options);
      }
    });
  };
  var baseReplacer = function (replace, editor) {
    var text = editor.getSelection(), markdown = replace.replace('$1', text);
    editor.replaceSelection(markdown, 'end');
  };
  Markdownarea.commands = {
    'fullscreen': {
      'title': 'Fullscreen',
      'label': '<i class="fa fa-expand"></i>',
      'action': function (editor) {
        editor.markdownarea.markdownarea.toggleClass('uk-markdownarea-fullscreen');
        // dont use uk- to avoid rules declaration
        $('html').toggleClass('markdownarea-fullscreen');
        $('html, body').scrollTop(0);
        var wrap = editor.getWrapperElement();
        if (editor.markdownarea.markdownarea.hasClass('uk-markdownarea-fullscreen')) {
          editor.state.fullScreenRestore = {
            scrollTop: window.pageYOffset,
            scrollLeft: window.pageXOffset,
            width: wrap.style.width,
            height: wrap.style.height
          };
          wrap.style.width = '';
          wrap.style.height = editor.markdownarea.content.height() + 'px';
          document.documentElement.style.overflow = 'hidden';
        } else {
          document.documentElement.style.overflow = '';
          var info = editor.state.fullScreenRestore;
          wrap.style.width = info.width;
          wrap.style.height = info.height;
          window.scrollTo(info.scrollLeft, info.scrollTop);
        }
        editor.refresh();
        editor.markdownarea.preview.parent().css('height', editor.markdownarea.code.height());
      }
    },
    'bold': {
      'title': 'Bold',
      'label': '<i class="fa fa-bold"></i>',
      'shortcut': [
        'Ctrl-B',
        'Cmd-B'
      ],
      'action': function (editor) {
        baseReplacer(this.getMode() == 'html' ? '<strong>$1</strong>' : '**$1**', editor);
      }
    },
    'italic': {
      'title': 'Italic',
      'label': '<i class="fa fa-italic"></i>',
      'action': function (editor) {
        baseReplacer(this.getMode() == 'html' ? '<em>$1</em>' : '*$1*', editor);
      }
    },
    'strike': {
      'title': 'Strikethrough',
      'label': '<i class="fa fa-strikethrough"></i>',
      'action': function (editor) {
        baseReplacer(this.getMode() == 'html' ? '<del>$1</del>' : '~~$1~~', editor);
      }
    },
    'blockquote': {
      'title': 'Blockquote',
      'label': '<i class="fa fa-quote-right"></i>',
      'action': function (editor) {
        baseReplacer(this.getMode() == 'html' ? '<blockquote><p>$1</p></blockquote>' : '> $1', editor);
      }
    },
    'link': {
      'title': 'Link',
      'label': '<i class="fa fa-link"></i>',
      'action': function (editor) {
        baseReplacer(this.getMode() == 'html' ? '<a href="http://">$1</a>' : '[$1](http://)', editor);
      }
    },
    'picture': {
      'title': 'Picture',
      'label': '<i class="fa fa-picture-o"></i>',
      'action': function (editor) {
        baseReplacer(this.getMode() == 'html' ? '<img src="http://" alt="$1">' : '![$1](http://)', editor);
      }
    },
    'listUl': {
      'title': 'Unordered List',
      'label': '<i class="fa fa-list-ul"></i>',
      'action': function (editor) {
        if (this.getMode() == 'markdown')
          baseReplacer('* $1', editor);
      }
    },
    'listOl': {
      'title': 'Ordered List',
      'label': '<i class="fa fa-list-ol"></i>',
      'action': function (editor) {
        if (this.getMode() == 'markdown')
          baseReplacer('1. $1', editor);
      }
    }
  };
  Markdownarea.defaults = {
    'mode': 'split',
    'height': 500,
    'maxsplitsize': 1000,
    'codemirror': {
      mode: 'gfm',
      tabMode: 'indent',
      tabindex: '2',
      lineWrapping: true,
      dragDrop: false,
      autoCloseTags: true,
      matchTags: true
    },
    'toolbar': [
      'bold',
      'italic',
      'strike',
      'link',
      'picture',
      'blockquote',
      'listUl',
      'listOl'
    ],
    'lblPreview': 'Preview',
    'lblCodeview': 'Markdown'
  };
  Markdownarea.template = '<div class="uk-markdownarea uk-clearfix" data-mode="split">' + '<div class="uk-markdownarea-navbar">' + '<ul class="uk-markdownarea-navbar-nav uk-markdownarea-toolbar"></ul>' + '<div class="uk-markdownarea-navbar-flip">' + '<ul class="uk-markdownarea-navbar-nav">' + '<li class="uk-markdown-button-markdown"><a>{:lblCodeview}</a></li>' + '<li class="uk-markdown-button-preview"><a>{:lblPreview}</a></li>' + '<li><a data-markdownarea-cmd="fullscreen" data-toggle="tooltip" title="Zen Mode"><i class="fa fa-expand"></i></a></li>' + '</ul>' + '</div>' + '</div>' + '<div class="uk-markdownarea-content">' + '<div class="uk-markdownarea-code"></div>' + '<div class="uk-markdownarea-preview"><div></div></div>' + '</div>' + '</div>';
  Markdownarea.plugins = {};
  Markdownarea.addPlugin = function (name, identifier, callback) {
    Markdownarea.plugins[name] = {
      'identifier': identifier,
      'cb': callback
    };
  };
  $.fn['markdownarea'] = Markdownarea;
  // init code
  $(function () {
    $('textarea[data-uk-markdownarea]').each(function () {
      var area = $(this), obj;
      if (!area.data('markdownarea')) {
        obj = new Markdownarea(area, $.Utils.options(area.attr('data-uk-markdownarea')));
      }
    });
  });
  return Markdownarea;
}(jQuery, window, document));/**=========================================================
 * Module: masked,js
 * Initializes the masked inputs
 =========================================================*/
App.directive('masked', function () {
  return {
    restrict: 'A',
    controller: function ($scope, $element) {
      var $elem = $($element);
      if ($.fn.inputmask)
        $elem.inputmask();
    }
  };
});/**=========================================================
 * Module: navbar-search.js
 * Navbar search toggler * Auto dismiss on ESC key
 =========================================================*/
App.directive('searchOpen', [
  'navSearch',
  function (navSearch) {
    'use strict';
    return {
      restrict: 'A',
      controller: function ($scope, $element) {
        $element.on('click', function (e) {
          e.stopPropagation();
        }).on('click', navSearch.toggle);
      }
    };
  }
]).directive('searchDismiss', [
  'navSearch',
  function (navSearch) {
    'use strict';
    var inputSelector = '.navbar-form input[type="text"]';
    return {
      restrict: 'A',
      controller: function ($scope, $element) {
        $(inputSelector).on('click', function (e) {
          e.stopPropagation();
        }).on('keyup', function (e) {
          if (e.keyCode == 27)
            // ESC
            navSearch.dismiss();
        });
        // click anywhere closes the search
        $(document).on('click', navSearch.dismiss);
        // dismissable options
        $element.on('click', function (e) {
          e.stopPropagation();
        }).on('click', navSearch.dismiss);
      }
    };
  }
]);/**=========================================================
 * Module: notify.js
 * Create a notifications that fade out automatically.
 * Based on Notify addon from UIKit (http://getuikit.com/docs/addons_notify.html)
 =========================================================*/
App.directive('notify', function ($window) {
  return {
    restrict: 'A',
    controller: function ($scope, $element) {
      $element.on('click', function (e) {
        e.preventDefault();
        notifyNow($element);
      });
    }
  };
  function notifyNow(elem) {
    var $element = $(elem), message = $element.data('message'), options = $element.data('options');
    if (!message)
      $.error('Notify: No message specified');
    $.notify(message, options || {});
  }
});
/**
 * Notify Addon definition as jQuery plugin
 * Adapted version to work with Bootstrap classes
 * More information http://getuikit.com/docs/addons_notify.html
 */
(function ($, window, document) {
  var containers = {}, messages = {}, notify = function (options) {
      if ($.type(options) == 'string') {
        options = { message: options };
      }
      if (arguments[1]) {
        options = $.extend(options, $.type(arguments[1]) == 'string' ? { status: arguments[1] } : arguments[1]);
      }
      return new Message(options).show();
    }, closeAll = function (group, instantly) {
      if (group) {
        for (var id in messages) {
          if (group === messages[id].group)
            messages[id].close(instantly);
        }
      } else {
        for (var id in messages) {
          messages[id].close(instantly);
        }
      }
    };
  var Message = function (options) {
    var $this = this;
    this.options = $.extend({}, Message.defaults, options);
    this.uuid = 'ID' + new Date().getTime() + 'RAND' + Math.ceil(Math.random() * 100000);
    this.element = $([
      '<div class="uk-notify-message alert-dismissable">',
      '<a class="close">&times;</a>',
      '<div>' + this.options.message + '</div>',
      '</div>'
    ].join('')).data('notifyMessage', this);
    // status
    if (this.options.status) {
      this.element.addClass('alert alert-' + this.options.status);
      this.currentstatus = this.options.status;
    }
    this.group = this.options.group;
    messages[this.uuid] = this;
    if (!containers[this.options.pos]) {
      containers[this.options.pos] = $('<div class="uk-notify uk-notify-' + this.options.pos + '"></div>').appendTo('body').on('click', '.uk-notify-message', function () {
        $(this).data('notifyMessage').close();
      });
    }
  };
  $.extend(Message.prototype, {
    uuid: false,
    element: false,
    timout: false,
    currentstatus: '',
    group: false,
    show: function () {
      if (this.element.is(':visible'))
        return;
      var $this = this;
      containers[this.options.pos].show().prepend(this.element);
      var marginbottom = parseInt(this.element.css('margin-bottom'), 10);
      this.element.css({
        'opacity': 0,
        'margin-top': -1 * this.element.outerHeight(),
        'margin-bottom': 0
      }).animate({
        'opacity': 1,
        'margin-top': 0,
        'margin-bottom': marginbottom
      }, function () {
        if ($this.options.timeout) {
          var closefn = function () {
            $this.close();
          };
          $this.timeout = setTimeout(closefn, $this.options.timeout);
          $this.element.hover(function () {
            clearTimeout($this.timeout);
          }, function () {
            $this.timeout = setTimeout(closefn, $this.options.timeout);
          });
        }
      });
      return this;
    },
    close: function (instantly) {
      var $this = this, finalize = function () {
          $this.element.remove();
          if (!containers[$this.options.pos].children().length) {
            containers[$this.options.pos].hide();
          }
          delete messages[$this.uuid];
        };
      if (this.timeout)
        clearTimeout(this.timeout);
      if (instantly) {
        finalize();
      } else {
        this.element.animate({
          'opacity': 0,
          'margin-top': -1 * this.element.outerHeight(),
          'margin-bottom': 0
        }, function () {
          finalize();
        });
      }
    },
    content: function (html) {
      var container = this.element.find('>div');
      if (!html) {
        return container.html();
      }
      container.html(html);
      return this;
    },
    status: function (status) {
      if (!status) {
        return this.currentstatus;
      }
      this.element.removeClass('alert alert-' + this.currentstatus).addClass('alert alert-' + status);
      this.currentstatus = status;
      return this;
    }
  });
  Message.defaults = {
    message: '',
    status: 'normal',
    timeout: 5000,
    group: null,
    pos: 'top-center'
  };
  $['notify'] = notify;
  $['notify'].message = Message;
  $['notify'].closeAll = closeAll;
  return notify;
}(jQuery, window, document));/**=========================================================
 * Module: now.js
 * Provides a simple way to display the current time formatted
 =========================================================*/
App.directive('now', [
  'dateFilter',
  '$interval',
  function (dateFilter, $interval) {
    return {
      restrict: 'E',
      link: function (scope, element, attrs) {
        var format = attrs.format;
        function updateTime() {
          var dt = dateFilter(new Date(), format);
          element.text(dt);
        }
        updateTime();
        $interval(updateTime, 1000);
      }
    };
  }
]);/**=========================================================
 * Module panel-tools.js
 * Directive tools to control panels. 
 * Allows collapse, refresh and dismiss (remove)
 * Saves panel state in browser storage
 =========================================================*/
App.directive('paneltool', function ($compile, $timeout) {
  var templates = {
      collapse: '<a href=\'#\' panel-collapse=\'\' data-toggle=\'tooltip\' title=\'Collapse Panel\' ng-click=\'{{panelId}} = !{{panelId}}\' ng-init=\'{{panelId}}=false\'>                 <em ng-show=\'{{panelId}}\' class=\'fa fa-plus\'></em>                 <em ng-show=\'!{{panelId}}\' class=\'fa fa-minus\'></em>               </a>',
      dismiss: '<a href=\'#\' panel-dismiss=\'\' data-toggle=\'tooltip\' title=\'Close Panel\'>               <em class=\'fa fa-times\'></em>             </a>',
      refresh: '<a href=\'#\' panel-refresh=\'\' data-toggle=\'tooltip\' data-spinner=\'{{spinner}}\' title=\'Refresh Panel\'>               <em class=\'fa fa-refresh\'></em>             </a>'
    };
  function getTemplate(elem, attrs) {
    var temp = '';
    attrs = attrs || {};
    if (attrs.toolCollapse)
      temp += templates.collapse.replace(/{{panelId}}/g, elem.parent().parent().attr('id'));
    if (attrs.toolDismiss)
      temp += templates.dismiss;
    if (attrs.toolRefresh)
      temp += templates.refresh.replace(/{{spinner}}/g, attrs.toolRefresh);
    return temp;
  }
  return {
    restrict: 'E',
    link: function (scope, element, attrs) {
      var tools = scope.panelTools || attrs;
      $timeout(function () {
        element.html(getTemplate(element, tools)).show();
        $compile(element.contents())(scope);
        element.addClass('pull-right');
      });
    }
  };
}).directive('panelDismiss', function ($q) {
  'use strict';
  return {
    restrict: 'A',
    controller: function ($scope, $element) {
      var removeEvent = 'panel-remove', removedEvent = 'panel-removed';
      $element.on('click', function () {
        // find the first parent panel
        var parent = $(this).closest('.panel');
        removeElement();
        function removeElement() {
          var deferred = $q.defer();
          var promise = deferred.promise;
          // Communicate event destroying panel
          $scope.$emit(removeEvent, parent.attr('id'), deferred);
          promise.then(destroyMiddleware);
        }
        // Run the animation before destroy the panel
        function destroyMiddleware() {
          if ($.support.animation) {
            parent.animo({ animation: 'bounceOut' }, destroyPanel);
          } else
            destroyPanel();
        }
        function destroyPanel() {
          var col = parent.parent();
          parent.remove();
          // remove the parent if it is a row and is empty and not a sortable (portlet)
          col.filter(function () {
            var el = $(this);
            return el.is('[class*="col-"]:not(.sortable)') && el.children('*').length === 0;
          }).remove();
          // Communicate event destroyed panel
          $scope.$emit(removedEvent, parent.attr('id'));
        }
      });
    }
  };
}).directive('panelCollapse', [
  '$timeout',
  function ($timeout) {
    'use strict';
    var storageKeyName = 'panelState', storage;
    return {
      restrict: 'A',
      controller: function ($scope, $element) {
        // Prepare the panel to be collapsible
        var $elem = $($element), parent = $elem.closest('.panel'),
          // find the first parent panel
          panelId = parent.attr('id');
        storage = $scope.$storage;
        // Load the saved state if exists
        var currentState = loadPanelState(panelId);
        if (typeof currentState !== undefined) {
          $timeout(function () {
            $scope[panelId] = currentState;
          }, 10);
        }
        // bind events to switch icons
        $element.bind('click', function () {
          savePanelState(panelId, !$scope[panelId]);
        });
      }
    };
    function savePanelState(id, state) {
      if (!id)
        return false;
      var data = angular.fromJson(storage[storageKeyName]);
      if (!data) {
        data = {};
      }
      data[id] = state;
      storage[storageKeyName] = angular.toJson(data);
    }
    function loadPanelState(id) {
      if (!id)
        return false;
      var data = angular.fromJson(storage[storageKeyName]);
      if (data) {
        return data[id];
      }
    }
  }
]).directive('panelRefresh', function ($q) {
  'use strict';
  return {
    restrict: 'A',
    controller: function ($scope, $element) {
      var refreshEvent = 'panel-refresh', whirlClass = 'whirl', defaultSpinner = 'standard';
      // catch clicks to toggle panel refresh
      $element.on('click', function () {
        var $this = $(this), panel = $this.parents('.panel').eq(0), spinner = $this.data('spinner') || defaultSpinner;
        ;
        // start showing the spinner
        panel.addClass(whirlClass + ' ' + spinner);
        // Emit event when refresh clicked
        $scope.$emit(refreshEvent, panel.attr('id'));
      });
      // listen to remove spinner
      $scope.$on('removeSpinner', removeSpinner);
      // method to clear the spinner when done
      function removeSpinner(ev, id) {
        if (!id)
          return;
        var newid = id.charAt(0) == '#' ? id : '#' + id;
        angular.element(newid).removeClass(whirlClass);
      }
    }
  };
});/**=========================================================
 * Module: play-animation.js
 * Provides a simple way to run animation with a trigger
 * Requires animo.js
 =========================================================*/
App.directive('animate', function ($window) {
  'use strict';
  var $scroller = $(window).add('body, .wrapper');
  return {
    restrict: 'A',
    link: function (scope, elem, attrs) {
      // Parse animations params and attach trigger to scroll
      var $elem = $(elem), offset = $elem.data('offset'), delay = $elem.data('delay') || 100,
        // milliseconds
        animation = $elem.data('play') || 'bounce';
      if (typeof offset !== 'undefined') {
        // test if the element starts visible
        testAnimation($elem);
        // test on scroll
        $scroller.scroll(function () {
          testAnimation($elem);
        });
      }
      // Test an element visibilty and trigger the given animation
      function testAnimation(element) {
        if (!element.hasClass('anim-running') && $.Utils.isInView(element, { topoffset: offset })) {
          element.addClass('anim-running');
          setTimeout(function () {
            element.addClass('anim-done').animo({
              animation: animation,
              duration: 0.7
            });
          }, delay);
        }
      }
      // Run click triggered animations
      $elem.on('click', function () {
        var $elem = $(this), targetSel = $elem.data('target'), animation = $elem.data('play') || 'bounce', target = $(targetSel);
        if (target && target) {
          target.animo({ animation: animation });
        }
      });
    }
  };
});/**=========================================================
 * Module: scroll.js
 * Make a content box scrollable
 =========================================================*/
App.directive('scrollable', function () {
  return {
    restrict: 'EA',
    link: function (scope, elem, attrs) {
      var defaultHeight = 250;
      elem.slimScroll({ height: attrs.height || defaultHeight });
    }
  };
});/**=========================================================
 * Module: sidebar.js
 * Wraps the sidebar and handles collapsed state
 =========================================================*/
App.directive('sidebar', [
  '$window',
  'APP_MEDIAQUERY',
  function ($window, mq) {
    var $win = $($window);
    var $html = $('html');
    var $body = $('body');
    var $scope;
    var $sidebar;
    return {
      restrict: 'EA',
      template: '<nav class="sidebar" ng-transclude></nav>',
      transclude: true,
      replace: true,
      link: function (scope, element, attrs) {
        $scope = scope;
        $sidebar = element;
        var eventName = isTouch() ? 'click' : 'mouseenter';
        var subNav = $();
        $sidebar.on(eventName, '.nav > li', function () {
          if (isSidebarCollapsed() && !isMobile()) {
            subNav.trigger('mouseleave');
            subNav = toggleMenuItem($(this));
          }
        });
        scope.$on('closeSidebarMenu', function () {
          removeFloatingNav();
          $('.sidebar li.open').removeClass('open');
        });
      }
    };
    // Open the collapse sidebar submenu items when on touch devices 
    // - desktop only opens on hover
    function toggleTouchItem($element) {
      $element.siblings('li').removeClass('open').end().toggleClass('open');
    }
    // Handles hover to open items under collapsed menu
    // ----------------------------------- 
    function toggleMenuItem($listItem) {
      removeFloatingNav();
      var ul = $listItem.children('ul');
      if (!ul.length)
        return $();
      if ($listItem.hasClass('open')) {
        toggleTouchItem($listItem);
        return $();
      }
      var $aside = $('.aside');
      var mar = $scope.app.layout.isFixed ? parseInt($aside.css('padding-top'), 0) : 0;
      var subNav = ul.clone().appendTo($aside);
      toggleTouchItem($listItem);
      var itemTop = $listItem.position().top + mar - $sidebar.scrollTop();
      var vwHeight = $win.height();
      subNav.addClass('nav-floating').css({
        position: $scope.app.layout.isFixed ? 'fixed' : 'absolute',
        top: itemTop,
        bottom: subNav.outerHeight(true) + itemTop > vwHeight ? 0 : 'auto'
      });
      subNav.on('mouseleave', function () {
        toggleTouchItem($listItem);
        subNav.remove();
      });
      return subNav;
    }
    function removeFloatingNav() {
      $('.sidebar-subnav.nav-floating').remove();
    }
    function isTouch() {
      return $html.hasClass('touch');
    }
    function isSidebarCollapsed() {
      return $body.hasClass('aside-collapsed');
    }
    function isSidebarToggled() {
      return $body.hasClass('aside-toggled');
    }
    function isMobile() {
      return $win.width() < mq.tablet;
    }
  }
]);/**=========================================================
 * Module: skycons.js
 * Include any animated weather icon from Skycons
 =========================================================*/
App.directive('skycon', function () {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      var skycons = new Skycons({ 'color': attrs.color || 'white' });
      element.html('<canvas width="' + attrs.width + '" height="' + attrs.height + '"></canvas>');
      skycons.add(element.children()[0], attrs.skycon);
      skycons.play();
    }
  };
});/**=========================================================
 * Module: sparkline.js
 * SparkLines Mini Charts
 =========================================================*/
App.directive('sparkline', [
  '$timeout',
  '$window',
  function ($timeout, $window) {
    'use strict';
    return {
      restrict: 'EA',
      controller: function ($scope, $element) {
        var runSL = function () {
          initSparLine($element);
        };
        $timeout(runSL);
      }
    };
    function initSparLine($element) {
      var options = $element.data();
      options.type = options.type || 'bar';
      // default chart is bar
      options.disableHiddenCheck = true;
      $element.sparkline('html', options);
      if (options.resize) {
        $(window).resize(function () {
          $element.sparkline('html', options);
        });
      }
    }
  }
]);/**=========================================================
 * Module: table-checkall.js
 * Tables check all checkbox
 =========================================================*/
App.directive('checkAll', function () {
  'use strict';
  return {
    restrict: 'A',
    controller: function ($scope, $element) {
      $element.on('change', function () {
        var $this = $(this), index = $this.index() + 1, checkbox = $this.find('input[type="checkbox"]'), table = $this.parents('table');
        // Make sure to affect only the correct checkbox column
        table.find('tbody > tr > td:nth-child(' + index + ') input[type="checkbox"]').prop('checked', checkbox[0].checked);
      });
    }
  };
});/**=========================================================
 * Module: tags-input.js
 * Initializes the tag inputs plugin
 =========================================================*/
App.directive('tagsinput', function ($timeout) {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function (scope, element, attrs, ngModel) {
      element.on('itemAdded itemRemoved', function () {
        // check if view value is not empty and is a string
        // and update the view from string to an array of tags
        if (ngModel.$viewValue && ngModel.$viewValue.split) {
          ngModel.$setViewValue(ngModel.$viewValue.split(','));
          ngModel.$render();
        }
      });
      $timeout(function () {
        element.tagsinput();
      });
    }
  };
});/**=========================================================
 * Module: toggle-state.js
 * Toggle a classname from the BODY Useful to change a state that 
 * affects globally the entire layout or more than one item 
 * Targeted elements must have [toggle-state="CLASS-NAME-TO-TOGGLE"]
 * User no-persist to avoid saving the sate in browser storage
 =========================================================*/
App.directive('toggleState', [
  'toggleStateService',
  function (toggle) {
    'use strict';
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        var $body = $('body');
        $(element).on('click', function (e) {
          e.preventDefault();
          var classname = attrs.toggleState;
          if (classname) {
            if ($body.hasClass(classname)) {
              $body.removeClass(classname);
              if (!attrs.noPersist)
                toggle.removeState(classname);
            } else {
              $body.addClass(classname);
              if (!attrs.noPersist)
                toggle.addState(classname);
            }
          }
        });
      }
    };
  }
]);/**=========================================================
 * Module: masked,js
 * Initializes the jQuery UI slider controls
 =========================================================*/
App.directive('uiSlider', function () {
  return {
    restrict: 'A',
    controller: function ($scope, $element) {
      var $elem = $($element);
      if ($.fn.slider)
        $elem.slider();
    }
  };
});/**=========================================================
 * Module: validate-form.js
 * Initializes the validation plugin Parsley
 =========================================================*/
App.directive('validateForm', function () {
  return {
    restrict: 'A',
    controller: function ($scope, $element) {
      var $elem = $($element);
      if ($.fn.parsley)
        $elem.parsley();
    }
  };
});/**=========================================================
 * Module: vector-map.js.js
 * Init jQuery Vector Map plugin
 =========================================================*/
App.directive('vectorMap', [
  'vectorMap',
  function (vectorMap) {
    'use strict';
    var defaultColors = {
        markerColor: '#23b7e5',
        bgColor: 'transparent',
        scaleColors: ['#878c9a'],
        regionFill: '#bbbec6'
      };
    return {
      restrict: 'EA',
      link: function (scope, element, attrs) {
        var mapHeight = attrs.height || '300', options = {
            markerColor: attrs.markerColor || defaultColors.markerColor,
            bgColor: attrs.bgColor || defaultColors.bgColor,
            scale: attrs.scale || 1,
            scaleColors: attrs.scaleColors || defaultColors.scaleColors,
            regionFill: attrs.regionFill || defaultColors.regionFill,
            mapName: attrs.mapName || 'world_mill_en'
          };
        element.css('height', mapHeight);
        vectorMap.init(element, options, scope.seriesData, scope.markersData);
      }
    };
  }
]);App.service('browser', function () {
  'use strict';
  var matched, browser;
  var uaMatch = function (ua) {
    ua = ua.toLowerCase();
    var match = /(opr)[\/]([\w.]+)/.exec(ua) || /(chrome)[ \/]([\w.]+)/.exec(ua) || /(version)[ \/]([\w.]+).*(safari)[ \/]([\w.]+)/.exec(ua) || /(webkit)[ \/]([\w.]+)/.exec(ua) || /(opera)(?:.*version|)[ \/]([\w.]+)/.exec(ua) || /(msie) ([\w.]+)/.exec(ua) || ua.indexOf('trident') >= 0 && /(rv)(?::| )([\w.]+)/.exec(ua) || ua.indexOf('compatible') < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua) || [];
    var platform_match = /(ipad)/.exec(ua) || /(iphone)/.exec(ua) || /(android)/.exec(ua) || /(windows phone)/.exec(ua) || /(win)/.exec(ua) || /(mac)/.exec(ua) || /(linux)/.exec(ua) || /(cros)/i.exec(ua) || [];
    return {
      browser: match[3] || match[1] || '',
      version: match[2] || '0',
      platform: platform_match[0] || ''
    };
  };
  matched = uaMatch(window.navigator.userAgent);
  browser = {};
  if (matched.browser) {
    browser[matched.browser] = true;
    browser.version = matched.version;
    browser.versionNumber = parseInt(matched.version);
  }
  if (matched.platform) {
    browser[matched.platform] = true;
  }
  // These are all considered mobile platforms, meaning they run a mobile browser
  if (browser.android || browser.ipad || browser.iphone || browser['windows phone']) {
    browser.mobile = true;
  }
  // These are all considered desktop platforms, meaning they run a desktop browser
  if (browser.cros || browser.mac || browser.linux || browser.win) {
    browser.desktop = true;
  }
  // Chrome, Opera 15+ and Safari are webkit based browsers
  if (browser.chrome || browser.opr || browser.safari) {
    browser.webkit = true;
  }
  // IE11 has a new token so we will assign it msie to avoid breaking changes
  if (browser.rv) {
    var ie = 'msie';
    matched.browser = ie;
    browser[ie] = true;
  }
  // Opera 15+ are identified as opr
  if (browser.opr) {
    var opera = 'opera';
    matched.browser = opera;
    browser[opera] = true;
  }
  // Stock Android browsers are marked as Safari on Android.
  if (browser.safari && browser.android) {
    var android = 'android';
    matched.browser = android;
    browser[android] = true;
  }
  // Assign the name and platform variable
  browser.name = matched.browser;
  browser.platform = matched.platform;
  return browser;
});/**=========================================================
 * Module: colors.js
 * Services to retrieve global colors
 =========================================================*/
App.factory('colors', [
  'APP_COLORS',
  function (colors) {
    return {
      byName: function (name) {
        return colors[name] || '#fff';
      }
    };
  }
]);/**=========================================================
 * Module: google-map.js
 * Services to share gmap functions
 =========================================================*/
App.service('gmap', function () {
  return {
    setStyle: function (style) {
      this.MapStyles = style;
    },
    autocenter: function () {
      var refs = this.gMapRefs;
      if (refs && refs.length) {
        for (var r in refs) {
          var mapRef = refs[r];
          var currMapCenter = mapRef.getCenter();
          if (mapRef && currMapCenter) {
            google.maps.event.trigger(mapRef, 'resize');
            mapRef.setCenter(currMapCenter);
          }
        }
      }
    },
    init: function (element) {
      //initGmap
      var self = this, $element = $(element), addresses = $element.data('address') && $element.data('address').split(';'), titles = $element.data('title') && $element.data('title').split(';'), zoom = $element.data('zoom') || 14, maptype = $element.data('maptype') || 'ROADMAP',
        // or 'TERRAIN'
        markers = [];
      if (addresses) {
        for (var a in addresses) {
          if (typeof addresses[a] == 'string') {
            markers.push({
              address: addresses[a],
              html: titles && titles[a] || '',
              popup: true
            });
          }
        }
        var options = {
            controls: {
              panControl: true,
              zoomControl: true,
              mapTypeControl: true,
              scaleControl: true,
              streetViewControl: true,
              overviewMapControl: true
            },
            scrollwheel: false,
            maptype: maptype,
            markers: markers,
            zoom: zoom
          };
        var gMap = $element.gMap(options);
        var ref = gMap.data('gMap.reference');
        // save in the map references list
        if (!self.gMapRefs)
          self.gMapRefs = [];
        self.gMapRefs.push(ref);
        // set the styles
        if ($element.data('styled') !== undefined) {
          ref.setOptions({ styles: self.MapStyles });
        }
      }
    }
  };
});/**=========================================================
 * Module: nav-search.js
 * Services to share navbar search functions
 =========================================================*/
App.service('navSearch', function () {
  var navbarFormSelector = 'form.navbar-form';
  return {
    toggle: function () {
      var navbarForm = $(navbarFormSelector);
      navbarForm.toggleClass('open');
      var isOpen = navbarForm.hasClass('open');
      navbarForm.find('input')[isOpen ? 'focus' : 'blur']();
    },
    dismiss: function () {
      $(navbarFormSelector).removeClass('open').find('input[type="text"]').blur().val('');
      // Empty input
      ;
    }
  };
});/**=========================================================
 * Module: toggle-state.js
 * Services to share toggle state functionality
 =========================================================*/
App.service('toggleStateService', [
  '$rootScope',
  function ($rootScope) {
    var storageKeyName = 'toggleState';
    // Helper object to check for words in a phrase //
    var WordChecker = {
        hasWord: function (phrase, word) {
          return new RegExp('(^|\\s)' + word + '(\\s|$)').test(phrase);
        },
        addWord: function (phrase, word) {
          if (!this.hasWord(phrase, word)) {
            return phrase + (phrase ? ' ' : '') + word;
          }
        },
        removeWord: function (phrase, word) {
          if (this.hasWord(phrase, word)) {
            return phrase.replace(new RegExp('(^|\\s)*' + word + '(\\s|$)*', 'g'), '');
          }
        }
      };
    // Return service public methods
    return {
      addState: function (classname) {
        var data = angular.fromJson($rootScope.$storage[storageKeyName]);
        if (!data) {
          data = classname;
        } else {
          data = WordChecker.addWord(data, classname);
        }
        $rootScope.$storage[storageKeyName] = angular.toJson(data);
      },
      removeState: function (classname) {
        var data = $rootScope.$storage[storageKeyName];
        // nothing to remove
        if (!data)
          return;
        data = WordChecker.removeWord(data, classname);
        $rootScope.$storage[storageKeyName] = angular.toJson(data);
      },
      restoreState: function ($elem) {
        var data = angular.fromJson($rootScope.$storage[storageKeyName]);
        // nothing to restore
        if (!data)
          return;
        $elem.addClass(data);
      }
    };
  }
]);/**=========================================================
 * Module: utils.js
 * jQuery Utility functions library 
 * adapted from the core of UIKit
 =========================================================*/
(function ($, window, doc) {
  'use strict';
  var $html = $('html'), $win = $(window);
  $.support.transition = function () {
    var transitionEnd = function () {
        var element = doc.body || doc.documentElement, transEndEventNames = {
            WebkitTransition: 'webkitTransitionEnd',
            MozTransition: 'transitionend',
            OTransition: 'oTransitionEnd otransitionend',
            transition: 'transitionend'
          }, name;
        for (name in transEndEventNames) {
          if (element.style[name] !== undefined)
            return transEndEventNames[name];
        }
      }();
    return transitionEnd && { end: transitionEnd };
  }();
  $.support.animation = function () {
    var animationEnd = function () {
        var element = doc.body || doc.documentElement, animEndEventNames = {
            WebkitAnimation: 'webkitAnimationEnd',
            MozAnimation: 'animationend',
            OAnimation: 'oAnimationEnd oanimationend',
            animation: 'animationend'
          }, name;
        for (name in animEndEventNames) {
          if (element.style[name] !== undefined)
            return animEndEventNames[name];
        }
      }();
    return animationEnd && { end: animationEnd };
  }();
  $.support.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame || window.oRequestAnimationFrame || function (callback) {
    window.setTimeout(callback, 1000 / 60);
  };
  $.support.touch = 'ontouchstart' in window && navigator.userAgent.toLowerCase().match(/mobile|tablet/) || window.DocumentTouch && document instanceof window.DocumentTouch || window.navigator['msPointerEnabled'] && window.navigator['msMaxTouchPoints'] > 0 || window.navigator['pointerEnabled'] && window.navigator['maxTouchPoints'] > 0 || false;
  $.support.mutationobserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver || null;
  $.Utils = {};
  $.Utils.debounce = function (func, wait, immediate) {
    var timeout;
    return function () {
      var context = this, args = arguments;
      var later = function () {
        timeout = null;
        if (!immediate)
          func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow)
        func.apply(context, args);
    };
  };
  $.Utils.removeCssRules = function (selectorRegEx) {
    var idx, idxs, stylesheet, _i, _j, _k, _len, _len1, _len2, _ref;
    if (!selectorRegEx)
      return;
    setTimeout(function () {
      try {
        _ref = document.styleSheets;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          stylesheet = _ref[_i];
          idxs = [];
          stylesheet.cssRules = stylesheet.cssRules;
          for (idx = _j = 0, _len1 = stylesheet.cssRules.length; _j < _len1; idx = ++_j) {
            if (stylesheet.cssRules[idx].type === CSSRule.STYLE_RULE && selectorRegEx.test(stylesheet.cssRules[idx].selectorText)) {
              idxs.unshift(idx);
            }
          }
          for (_k = 0, _len2 = idxs.length; _k < _len2; _k++) {
            stylesheet.deleteRule(idxs[_k]);
          }
        }
      } catch (_error) {
      }
    }, 0);
  };
  $.Utils.isInView = function (element, options) {
    var $element = $(element);
    if (!$element.is(':visible')) {
      return false;
    }
    var window_left = $win.scrollLeft(), window_top = $win.scrollTop(), offset = $element.offset(), left = offset.left, top = offset.top;
    options = $.extend({
      topoffset: 0,
      leftoffset: 0
    }, options);
    if (top + $element.height() >= window_top && top - options.topoffset <= window_top + $win.height() && left + $element.width() >= window_left && left - options.leftoffset <= window_left + $win.width()) {
      return true;
    } else {
      return false;
    }
  };
  $.Utils.options = function (string) {
    if ($.isPlainObject(string))
      return string;
    var start = string ? string.indexOf('{') : -1, options = {};
    if (start != -1) {
      try {
        options = new Function('', 'var json = ' + string.substr(start) + '; return JSON.parse(JSON.stringify(json));')();
      } catch (e) {
      }
    }
    return options;
  };
  $.Utils.events = {};
  $.Utils.events.click = $.support.touch ? 'tap' : 'click';
  $.langdirection = $html.attr('dir') == 'rtl' ? 'right' : 'left';
  $(function () {
    // Check for dom modifications
    if (!$.support.mutationobserver)
      return;
    // Install an observer for custom needs of dom changes
    var observer = new $.support.mutationobserver($.Utils.debounce(function (mutations) {
        $(doc).trigger('domready');
      }, 300));
    // pass in the target node, as well as the observer options
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
  // add touch identifier class
  $html.addClass($.support.touch ? 'touch' : 'no-touch');
}(jQuery, window, document));/**=========================================================
 * Module: vector-map.js
 * Services to initialize vector map plugin
 =========================================================*/
App.service('vectorMap', function () {
  'use strict';
  return {
    init: function ($element, opts, series, markers) {
      $element.vectorMap({
        map: opts.mapName,
        backgroundColor: opts.bgColor,
        zoomMin: 2,
        zoomMax: 8,
        zoomOnScroll: false,
        regionStyle: {
          initial: {
            'fill': opts.regionFill,
            'fill-opacity': 1,
            'stroke': 'none',
            'stroke-width': 1.5,
            'stroke-opacity': 1
          },
          hover: { 'fill-opacity': 0.8 },
          selected: { fill: 'blue' },
          selectedHover: {}
        },
        focusOn: {
          x: 0.4,
          y: 0.6,
          scale: opts.scale
        },
        markerStyle: {
          initial: {
            fill: opts.markerColor,
            stroke: opts.markerColor
          }
        },
        onRegionLabelShow: function (e, el, code) {
          if (series && series[code])
            el.html(el.html() + ': ' + series[code] + ' visitors');
        },
        markers: markers,
        series: {
          regions: [{
              values: series,
              scale: opts.scaleColors,
              normalizeFunction: 'polynomial'
            }]
        }
      });
    }
  };
});angular.module('core').config([
  '$stateProvider',
  '$urlRouterProvider',
  'APP_REQUIRES',
  function ($stateProvider, $urlRouterProvider, appRequires) {
    'use strict';
    // Redirect to the dashboard view when route not found
    $urlRouterProvider.otherwise('/app/dashboard');
    $stateProvider.state('app', {
      url: '/app',
      abstract: true,
      templateUrl: 'modules/core/views/app.html',
      controller: 'AppController',
      resolve: ApplicationConfiguration.resolve('fastclick', 'modernizr', 'icons', 'screenfull', 'animo', 'sparklines', 'slimscroll', 'classyloader', 'toaster', 'whirl'),
      access: { requiredLogin: true }
    }).state('app.dashboard', {
      url: '/dashboard',
      title: 'Dashboard',
      templateUrl: 'modules/core/views/dashboard.html',
      access: { requiredLogin: true }
    });
  }
]);// TODO unit test
angular.module('core').directive('fmAddErrorFor', function () {
  'use strict';
  return {
    link: function (scope, element, attrs) {
      scope.$watch(attrs.fmAddErrorFor, function (formValue) {
        scope.$watch(attrs.fmAddErrorFor + '.$invalid', function () {
          if (formValue.$touched && formValue.$invalid && !formValue.$pristine)
            element.addClass('has-error');
          else
            element.removeClass('has-error');
        });
        scope.$watch(attrs.fmAddErrorFor + '.$touched', function () {
          if (formValue.$touched && formValue.$invalid && !formValue.$pristine)
            element.addClass('has-error');
          else
            element.removeClass('has-error');
        });
      });
    }
  };
});angular.module('core').directive('autofocus', [
  '$timeout',
  function ($timeout) {
    'use strict';
    return {
      link: function (scope, element, attrs) {
        $timeout(function () {
          element[0].focus();
        }, 100);
      }
    };
  }
]);angular.module('core').directive('fmClockpicker', function () {
  'use strict';
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      element.clockpicker();
    }
  };
});// TODO unit test this directive
angular.module('core').directive('fmDatepicker', [
  '$timeout',
  function ($timeout) {
    'use strict';
    return {
      restrict: 'A',
      require: '?ngModel',
      scope: { fmDatepickerDatechanged: '&' },
      link: function (scope, element, attrs, ngModel, timeout) {
        var position = attrs.fmDatepickerHPosition || 'right';
        element.datepicker({
          format: attrs.fmDatepickerFormat || 'yyyy-mm-dd',
          autoclose: true,
          orientation: 'auto ' + position,
          todayBtn: 'linked'
        }).on('changeDate', function (date) {
          var dateTxt = date.format(attrs.fmDatepickerFormat || 'yyyy-mm-dd');
          if (scope.fmDatepickerDatechanged) {
            scope.$apply(function () {
              scope.fmDatepickerDatechanged({ date: dateTxt });
            });
          }
        });
      }
    };
  }
]);// TODO unit test this directive
angular.module('core').directive('piechart', function () {
  'use strict';
  return {
    restrict: 'E',
    link: function (scope, elem, attrs) {
      var chart = null, options = {
          series: {
            pie: {
              show: true,
              radius: 1,
              label: {
                show: true,
                radius: 2 / 3,
                formatter: function (label, series) {
                  return '<div style=\'font-size:8pt; text-align:center; padding:2px; color:white;\'>' + label + '<br/>' + Math.round(series.percent) + '%</div>';
                },
                threshold: 0.1
              }
            }
          },
          legend: { show: false }
        };
      scope.$watch(attrs.ngModel, function (v) {
        if (!chart) {
          if (v) {
            chart = $.plot(elem, v, options);
            elem.show();
          }
        } else {
          chart.setData(v);
          chart.setupGrid();
          chart.draw();
        }
      });
    }
  };
});angular.module('core').factory('Account', [
  '$resource',
  function ($resource) {
    'use strict';
    return $resource('/api/public/accounts/:id', { id: '@id' });
  }
]);angular.module('core').factory('Company', [
  '$resource',
  function ($resource) {
    'use strict';
    return $resource('/api/public/companies/:id', { id: '@id' });
  }
]);angular.module('core').factory('Invoice', [
  '$resource',
  function ($resource) {
    'use strict';
    return $resource('/api/public/invoices/:id', { id: '@id' });
  }
]);angular.module('core').factory('Project', [
  '$resource',
  function ($resource) {
    'use strict';
    return $resource('/api/public/projects/:id', { id: '@id' }, {
      active: {
        method: 'GET',
        url: '/api/public/projects/active',
        isArray: true
      },
      hide: {
        method: 'POST',
        url: '/api/public/projects/:id/hide',
        isArray: false
      },
      unhide: {
        method: 'POST',
        url: '/api/public/projects/:id/unhide',
        isArray: false
      },
      changetasks: {
        method: 'POST',
        url: '/api/public/projects/:id/changetasks',
        isArray: false
      }
    });
  }
]);angular.module('core').factory('TimeRegistration', [
  '$resource',
  function ($resource) {
    'use strict';
    return $resource('/api/public/timeregistrations/:id', { id: '@id' }, {
      bydate: {
        method: 'GET',
        url: '/api/public/timeregistrations/bydate/:date',
        params: { date: '@date' },
        isArray: true
      },
      byrange: {
        method: 'GET',
        url: '/api/public/timeregistrations/byrange/:from/:to',
        params: {
          from: '@from',
          to: '@to'
        },
        isArray: true
      },
      uninvoiced: {
        method: 'GET',
        url: '/api/public/timeregistrations/uninvoiced',
        isArray: true
      },
      getinfo: {
        method: 'GET',
        url: '/api/public/timeregistrations/getinfo/:from/:to',
        params: {
          from: '@from',
          to: '@to'
        }
      },
      save: {
        method: 'POST',
        url: '/api/public/timeregistrations',
        isArray: true
      }
    });
  }
]);// TODO unit test
angular.module('core').factory('XLSXReader', [
  '$q',
  '$rootScope',
  function ($q, $rootScope) {
    'use strict';
    var service = function (data) {
      angular.extend(this, data);
    };
    service.readFile = function (file) {
      var deferred = $q.defer();
      var reader = new FileReader();
      reader.onload = function (e) {
        var data = e.target.result;
        var workbook = XLSX.read(data, { type: 'binary' });
        deferred.resolve(convertWorkbook(workbook));
      };
      reader.readAsBinaryString(file);
      return deferred.promise;
    };
    function convertWorkbook(workbook) {
      var sheets = {};
      _.forEachRight(workbook.SheetNames, function (sheetName) {
        var sheet = workbook.Sheets[sheetName];
        sheets[sheetName] = convertSheet(sheet);
      });
      return sheets;
    }
    function convertSheet(sheet) {
      var range = XLSX.utils.decode_range(sheet['!ref']);
      var sheetData = [], header = [];
      _.forEachRight(_.range(range.s.r, range.e.r + 1), function (row) {
        var rowData = [];
        _.forEachRight(_.range(range.s.c, range.e.c + 1), function (column) {
          var cellIndex = XLSX.utils.encode_cell({
              'c': column,
              'r': row
            });
          var cell = sheet[cellIndex];
          rowData[column] = cell ? cell.v : undefined;
        });
        if (row == 0)
          header = rowData;
        else
          sheetData[row - 1] = rowData;
      });
      return {
        'header': header,
        'data': sheetData,
        'name': sheet.name,
        'col_size': range.e.c + 1,
        'row_size': range.e.r
      };
    }
    return service;
  }
]);angular.module('core').filter('formatdate', function () {
  'use strict';
  return function (a) {
    if (_.has(a, 'year') && _.has(a, 'month') && _.has(a, 'day')) {
      return a.year + '-' + ('00' + a.month).slice(-2) + '-' + ('00' + a.day).slice(-2);
    } else
      return '-';
  };
});angular.module('core').filter('formattime', function () {
  'use strict';
  return function (a) {
    if (_.has(a, 'hour') && _.has(a, 'minutes')) {
      return ('00' + a.hour).slice(-2) + ':' + ('00' + a.minutes).slice(-2);
    } else if (_.isNumber(a)) {
      var hour = Math.floor(a / 60);
      var minutes = Math.floor(a - hour * 60);
      if (hour > 99) {
        return hour + ':' + ('00' + minutes).slice(-2);
      } else {
        return ('00' + hour).slice(-2) + ':' + ('00' + minutes).slice(-2);
      }
    } else
      return '-';
  };
});angular.module('core').filter('moment', function () {
  'use strict';
  return function (date, format) {
    return date.format(format);
  };
});angular.module('crm').config([
  '$stateProvider',
  function ($stateProvider) {
    'use strict';
    $stateProvider.state('app.companies', {
      url: '/crm/companies',
      templateUrl: 'modules/crm/views/companies.html',
      controller: 'CompaniesController',
      access: { requiredLogin: true }
    });
  }
]);angular.module('crm').controller('CompaniesController', [
  '$scope',
  '$modal',
  'Company',
  function ($scope, $modal, Company) {
    'use strict';
    $scope.getAllCompanies = function () {
      $scope.companies = Company.query();
    };
    $scope.openCompany = function (company) {
      var createDialog = $modal.open({
          templateUrl: '/modules/crm/views/editcompany.html',
          controller: 'CompanyDialogController',
          resolve: {
            toUpdate: function () {
              return company;
            }
          }
        });
      createDialog.result.then(function (company) {
        var c = _.find($scope.companies, { 'id': company.id });
        if (c)
          angular.copy(company, c);
        else
          $scope.companies.push(company);
      });
    };
  }
]);angular.module('crm').controller('CompanyDialogController', [
  '$scope',
  'Company',
  'toUpdate',
  function ($scope, Company, toUpdate) {
    'use strict';
    $scope.originalCompany = toUpdate;
    $scope.newCompany = toUpdate == undefined;
    toUpdate = toUpdate || {};
    $scope.company = { name: toUpdate.name || '' };
    $scope.isBusy = false;
    $scope.message = '';
    $scope.ok = function () {
      showMessage('Saving company...');
      var id = $scope.newCompany ? {} : { id: $scope.originalCompany.id };
      Company.save(id, $scope.company, function (data) {
        hideMessage();
        $scope.$close(data);
      }, function (err) {
        showMessage('An error occurred...');
      });
    };
    $scope.cancel = function () {
      $scope.$dismiss('cancel');
    };
    function showMessage(message) {
      $scope.isBusy = true;
      $scope.message = message;
    }
    function hideMessage() {
      $scope.isBusy = false;
      $scope.message = '';
    }
  }
]);angular.module('project').config([
  '$stateProvider',
  function ($stateProvider) {
    'use strict';
    $stateProvider.state('app.projects', {
      url: '/projects/overview',
      templateUrl: 'modules/project/views/projects.html',
      controller: 'ProjectsController',
      access: { requiredLogin: true }
    });
  }
]);angular.module('project').controller('ProjectDialogController', [
  '$scope',
  'Project',
  'Company',
  'toUpdate',
  function ($scope, Project, Company, toUpdate) {
    'use strict';
    $scope.originalProject = toUpdate;
    $scope.newProject = toUpdate == undefined;
    toUpdate = toUpdate || {};
    $scope.project = {
      companyId: toUpdate.companyId || '',
      name: toUpdate.name || '',
      description: toUpdate.description || ''
    };
    $scope.isBusy = false;
    $scope.message = '';
    $scope.companies = Company.query();
    $scope.ok = function () {
      showMessage('Saving project...');
      var id = $scope.newProject ? {} : { id: $scope.originalProject.id };
      Project.save(id, $scope.project, function (data) {
        hideMessage();
        $scope.$close(data);
      }, function (err) {
        showMessage('An error occurred...');
      });
    };
    $scope.cancel = function () {
      $scope.$dismiss('cancel');
    };
    function showMessage(message) {
      $scope.isBusy = true;
      $scope.message = message;
    }
    function hideMessage() {
      $scope.isBusy = false;
      $scope.message = '';
    }
  }
]);angular.module('project').controller('ProjectsController', [
  '$scope',
  '$modal',
  'Project',
  function ($scope, $modal, Project) {
    'use strict';
    $scope.getAllProjects = function () {
      $scope.projects = Project.query();
    };
    $scope.openProject = function (project) {
      var createDialog = $modal.open({
          templateUrl: '/modules/project/views/editproject.html',
          controller: 'ProjectDialogController',
          resolve: {
            toUpdate: function () {
              return project;
            }
          }
        });
      createDialog.result.then(function (project) {
        var p = _.find($scope.projects, { 'id': project.id });
        if (p)
          angular.copy(project, p);
        else
          $scope.projects.push(project);
      });
    };
    $scope.openProjectTasks = function (project) {
      var createDialog = $modal.open({
          templateUrl: '/modules/project/views/projecttasksdialog.html',
          controller: 'ProjectTasksDialogController',
          resolve: {
            toUpdate: function () {
              return project;
            }
          }
        });
      createDialog.result.then(function (project) {
        var p = _.find($scope.projects, { 'id': project.id });
        if (p)
          angular.copy(project, p);
      });
    };
    $scope.hideProject = function (project) {
      Project.hide({ id: project.id }, function () {
        project.hidden = true;
      });
    };
    $scope.unhideProject = function (project) {
      Project.unhide({ id: project.id }, function () {
        project.hidden = false;
      });
    };
  }
]);angular.module('project').controller('ProjectTasksDialogController', [
  '$scope',
  'Project',
  'toUpdate',
  function ($scope, Project, toUpdate) {
    'use strict';
    $scope.originalProject = toUpdate;
    toUpdate = toUpdate || {};
    $scope.project = {
      tasks: _.map(toUpdate.tasks, function (t) {
        return {
          name: t.name,
          defaultRateInCents: t.defaultRateInCents
        };
      })
    };
    $scope.isBusy = false;
    $scope.message = '';
    $scope.ok = function () {
      showMessage('Saving project...');
      Project.changetasks({ id: $scope.originalProject.id }, $scope.project.tasks, function (data) {
        hideMessage();
        $scope.$close(data);
      }, function (err) {
        showMessage('An error occurred...');
      });
    };
    $scope.cancel = function () {
      $scope.$dismiss('cancel');
    };
    function showMessage(message) {
      $scope.isBusy = true;
      $scope.message = message;
    }
    function hideMessage() {
      $scope.isBusy = false;
      $scope.message = '';
    }
  }
]);angular.module('time').config([
  '$stateProvider',
  '$urlRouterProvider',
  function ($stateProvider, $urlRouterProvider) {
    'use strict';
    $stateProvider.state('app.time_overview', {
      url: '/time/overview/:date',
      templateUrl: 'modules/time/views/overview.html',
      controller: 'OverviewController',
      access: { requiredLogin: true },
      resolve: ApplicationConfiguration.resolve('datetime'),
      onEnter: function ($state, $stateParams) {
        if (!$stateParams.date) {
          $state.go('app.time_overview', { date: new moment().format('YYYYMMDD') }, { location: 'replace' });
        }
      }
    }).state('app.time_report', {
      url: '/time/report/:from/:to',
      templateUrl: 'modules/time/views/report.html',
      controller: 'ReportController',
      access: { requiredLogin: true },
      resolve: ApplicationConfiguration.resolve('flot-chart', 'flot-chart-plugins'),
      onEnter: function ($state, $stateParams) {
        if (!$stateParams.from || !$stateParams.to) {
          $state.go('app.time_report', {
            from: new moment().startOf('month').format('YYYYMMDD'),
            to: new moment().endOf('month').format('YYYYMMDD')
          }, { location: 'replace' });
        }
      }
    }).state('app.time_import', {
      url: '/time/import',
      templateUrl: 'modules/time/views/import.html',
      controller: 'ImportController',
      resolve: ApplicationConfiguration.resolve('excel', 'ngTable'),
      access: { requiredLogin: true }
    }).state('app.time_export', {
      url: '/time/export/:from/:to',
      templateUrl: 'modules/time/views/export.html',
      controller: 'ExportController',
      access: { requiredLogin: true },
      resolve: ApplicationConfiguration.resolve('ngTable', 'datetime'),
      onEnter: function ($state, $stateParams) {
        if (!$stateParams.from || !$stateParams.to) {
          $state.go('app.time_export', {
            from: new moment().startOf('month').format('YYYYMMDD'),
            to: new moment().endOf('month').format('YYYYMMDD')
          }, { location: 'replace' });
        }
      }
    });
  }
]);angular.module('time').controller('ExportController', [
  '$scope',
  '$location',
  '$stateParams',
  'TimeRegistration',
  function ($scope, $location, $stateParams, TimeRegistration) {
    'use strict';
    $scope.from = new moment($stateParams.from, 'YYYYMMDD');
    $scope.to = new moment($stateParams.to, 'YYYYMMDD');
    $scope.hasTimeRegistrations = false;
    $scope.loading = false;
    $scope.from = new moment($stateParams.from, 'YYYYMMDD');
    $scope.to = new moment($stateParams.to, 'YYYYMMDD');
    $scope.thisWeek = new moment().day(1).format('YYYYMMDD') + '/' + new moment().day(7).format('YYYYMMDD');
    $scope.lastWeek = new moment().day(1).subtract('days', 7).format('YYYYMMDD') + '/' + new moment().day(7).subtract('days', 7).format('YYYYMMDD');
    $scope.thisMonth = new moment().set('date', 1).format('YYYYMMDD') + '/' + new moment().set('date', new moment().daysInMonth()).format('YYYYMMDD');
    $scope.lastMonth = new moment().set('date', 1).subtract('months', 1).format('YYYYMMDD') + '/' + new moment().subtract('months', 1).set('date', new moment().subtract('months', 1).daysInMonth()).format('YYYYMMDD');
    $scope.thisYear = new moment().set('month', 0).set('date', 1).format('YYYYMMDD') + '/' + new moment().set('month', 11).set('date', 31).format('YYYYMMDD');
    $scope.lastYear = new moment().set('month', 0).set('date', 1).subtract('years', 1).format('YYYYMMDD') + '/' + new moment().set('month', 11).set('date', 31).subtract('years', 1).format('YYYYMMDD');
    $scope.$watch('from', function () {
      $scope.displayFrom = $scope.from.format('YYYY-MM-DD');
    });
    $scope.$watch('to', function () {
      $scope.displayTo = $scope.to.format('YYYY-MM-DD');
    });
    $scope.changeFrom = function (date, format) {
      $scope.from = new moment(date, format);
    };
    $scope.changeTo = function (date, format) {
      $scope.to = new moment(date, format);
    };
    $scope.applyDate = function () {
      $location.path('/app/time/export/' + $scope.from.format('YYYYMMDD') + '/' + $scope.to.format('YYYYMMDD')).replace();
    };
    $scope.refresh = function () {
      $scope.loading = true;
      TimeRegistration.byrange({
        from: $scope.from.format('YYYYMMDD'),
        to: $scope.to.format('YYYYMMDD')
      }, function (tr) {
        var grouped = _.groupBy(tr, function (i) {
            return i.date.numeric;
          });
        $scope.timeRegistrations = _.sortBy(_.map(grouped, function (g) {
          return {
            date: _.first(g).date,
            items: g
          };
        }), function (i) {
          return i.date.numeric;
        });
        $scope.hasTimeRegistrations = $scope.timeRegistrations.length > 0;
        $scope.loading = false;
      });
    };
  }
]);// TODO unit test
angular.module('time').controller('ImportController', [
  '$scope',
  '$state',
  'XLSXReader',
  'ngTableParams',
  '$filter',
  'Project',
  'TimeRegistration',
  function ($scope, $state, XLSXReader, ngTableParams, $filter, Project, TimeRegistration) {
    'use strict';
    // Wizard helpers
    // **************
    var steps;
    function createsteps(q) {
      steps = [];
      for (var i = 1; i <= q; i++)
        steps[i] = false;
    }
    ;
    function activate(step) {
      for (var i in steps) {
        steps[i] = false;
      }
      steps[step] = true;
    }
    $scope.init = function () {
      createsteps(4);
      activate(1);
    };
    $scope.active = function (step) {
      return !!steps[step];
    };
    // Preload data
    // ************
    Project.active(function (projects) {
      var tasks = [];
      var id = 0;
      _.forEach(projects, function (p) {
        _.forEach(p.tasks, function (t) {
          tasks.push({
            project: p,
            task: t,
            display: p.name + ' - ' + t.name,
            id: id++
          });
        });
      });
      $scope.tasks = tasks;
    });
    // step 1 (file selection)
    // ***********************
    $scope.fileChanged = function (files) {
      $scope.excelSheets = [];
      $scope.excelFile = files[0];
      XLSXReader.readFile($scope.excelFile, $scope.showPreview).then(function (xlsxData) {
        $scope.excelSheets = xlsxData;
        activate(2);
      });
    };
    // step 2 (sheet selection)
    // ***********************
    $scope.selectedSheetName = undefined;
    $scope.selectedSheet = undefined;
    $scope.goto3 = function () {
      $scope.selectedSheet = $scope.excelSheets[$scope.selectedSheetName];
      var selectedSheetHeader = [];
      for (var i = 0; i < $scope.selectedSheet.header.length; i++) {
        selectedSheetHeader.push({
          key: i,
          value: $scope.selectedSheet.header[i]
        });
      }
      $scope.selectedSheetHeader = selectedSheetHeader;
      activate(3);
    };
    $scope.canGoto3 = function () {
      return $scope.selectedSheetName != null;
    };
    // step 3 (column selection)
    // ***********************	
    $scope.goto4 = function () {
      $scope.groupedRows = _.groupBy($scope.selectedSheet.data, function (r) {
        return r[$scope.selectedProjectColumn] + ' - ' + r[$scope.selectedTaskColumn];
      });
      $scope.projectsInExcelSheet = _.map($scope.groupedRows, function (g) {
        return {
          project: g[0][$scope.selectedProjectColumn],
          task: g[0][$scope.selectedTaskColumn],
          display: g[0][$scope.selectedProjectColumn] + ' - ' + g[0][$scope.selectedTaskColumn]
        };
      });
      activate(4);
    };
    $scope.canGoto4 = function () {
      return $scope.selectedProjectColumn != null && $scope.selectedTaskColumn != null && $scope.selectedDateColumn != null && $scope.selectedFromColumn != null && $scope.selectedToColumn != null && $scope.selectedDescriptionColumn != null;
    };
    // step 4 (project mapping)
    // ***********************	
    $scope.goto5 = function () {
      activate(5);
    };
    $scope.canGoto5 = function () {
      return _.every($scope.projectsInExcelSheet, function (p) {
        return p.mappedProjectAndTask != null;
      });
    };
    // step 5 (saving)
    // ***********************	
    $scope.importing = false;
    $scope.import = function () {
      var registrations = [];
      $scope.importing = true;
      _.forEach($scope.groupedRows, function (groupedRow) {
        var selectedProjectTask = _.first(_.where($scope.projectsInExcelSheet, function (p) {
            return p.project == groupedRow[0][$scope.selectedProjectColumn] && p.task == groupedRow[0][$scope.selectedTaskColumn];
          })).mappedProjectAndTask;
        var project = $scope.tasks[selectedProjectTask].project;
        var task = $scope.tasks[selectedProjectTask].task;
        _.forEach(groupedRow, function (row) {
          registrations.push({
            companyId: project.companyId,
            projectId: project.id,
            task: task.name,
            description: row[$scope.selectedDescriptionColumn],
            date: convertDisplayDateToNumeric(row[$scope.selectedDateColumn]),
            from: convertDisplayTimeToNumeric(row[$scope.selectedFromColumn]),
            to: convertDisplayTimeToNumeric(row[$scope.selectedToColumn])
          });
        });
      });
      TimeRegistration.save(registrations, function (data) {
        $scope.importing = false;
        $scope.timeRegistrationsImported = data;
        $scope.summaryTableParams.count(10);
        activate(6);
      }, function (err) {
        $scope.importing = false;
      });
    };
    function convertDisplayDateToNumeric(date) {
      return parseInt(date.replace(/-/g, ''), 10);
    }
    function convertDisplayTimeToNumeric(time) {
      return parseInt(time.replace(':', ''), 10);
    }
    // step 6 (summary)
    // ***********************	
    $scope.summaryTableParams = new ngTableParams({
      page: 1,
      count: 1
    }, {
      getData: function ($defer, params) {
        if (!$scope.timeRegistrationsImported)
          return;
        // use build-in angular filter
        var filteredData = params.filter() ? $filter('filter')($scope.timeRegistrationsImported, params.filter()) : $scope.timeRegistrationsImported;
        var orderedData = params.sorting() ? $filter('orderBy')(filteredData, params.orderBy()) : $scope.timeRegistrationsImported;
        params.total(orderedData.length);
        // set total for recalc pagination
        $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
      }
    });
  }
]);angular.module('time').controller('OverviewController', [
  '$scope',
  '$modal',
  '$location',
  '$state',
  '$stateParams',
  'TimeRegistration',
  function ($scope, $modal, $location, $state, $stateParams, TimeRegistration) {
    'use strict';
    $scope.date = new moment($stateParams.date, 'YYYYMMDD');
    $scope.hasTimeRegistrations = false;
    $scope.$watch('date', function () {
      $scope.displayDate = $scope.date.format('YYYY-MM-DD');
    });
    $scope.nextDate = function () {
      $scope.date = new moment($scope.date.add(1, 'days'));
      $state.go('app.time_overview', { date: $scope.date.format('YYYYMMDD') }, { location: 'replace' });
    };
    $scope.previousDate = function () {
      $scope.date = new moment($scope.date.subtract(1, 'days'));
      $state.go('app.time_overview', { date: $scope.date.format('YYYYMMDD') }, { location: 'replace' });
    };
    $scope.changeDate = function (date, format) {
      $scope.date = new moment(date, format);
      $state.go('app.time_overview', { date: $scope.date.format('YYYYMMDD') }, { location: 'replace' });
    };
    $scope.refresh = function () {
      TimeRegistration.bydate({ date: $scope.date.format('YYYYMMDD') }, function (timeRegistrations) {
        $scope.hasTimeRegistrations = timeRegistrations.length > 0;
        $scope.timeRegistrations = _.sortBy(timeRegistrations, function (i) {
          return i.from.numeric;
        });
      });
    };
    $scope.openTimeRegistration = function (timeRegistration) {
      var createDialog = $modal.open({
          templateUrl: '/modules/time/views/timeregistrationdialog.html',
          controller: 'TimeRegistrationDialogController',
          size: 'lg',
          resolve: {
            toUpdate: function () {
              return timeRegistration;
            },
            date: function () {
              return $scope.date.format('YYYYMMDD');
            }
          }
        });
      createDialog.result.then(function (timeRegistration) {
        var c = _.find($scope.timeRegistrations, { 'id': timeRegistration.id });
        if (c)
          angular.copy(timeRegistration, c);
        else
          $scope.timeRegistrations.push(timeRegistration);
        $scope.hasTimeRegistrations = $scope.timeRegistrations.length > 0;
      });
    };
  }
]);angular.module('time').controller('ReportController', [
  '$scope',
  '$location',
  '$state',
  '$stateParams',
  'TimeRegistration',
  function ($scope, $location, $state, $stateParams, TimeRegistration) {
    'use strict';
    $scope.from = new moment($stateParams.from, 'YYYYMMDD');
    $scope.to = new moment($stateParams.to, 'YYYYMMDD');
    // is this a full year?
    if ($scope.from.date() == 1 && $scope.from.month() == 0 && $scope.to.date() == 31 && $scope.to.month() == 11 && $scope.from.year() == $scope.to.year()) {
      $scope.title = $scope.from.format('YYYY');
      $scope.previousFrom = new moment($scope.from).subtract(1, 'year');
      $scope.previousTo = new moment($scope.to).subtract(1, 'year');
      $scope.nextFrom = new moment($scope.from).add(1, 'year');
      $scope.nextTo = new moment($scope.to).add(1, 'year');
    }  // is this a full month?
    else if ($scope.from.date() == 1 && new moment($scope.from).endOf('month').date() == $scope.to.date() && $scope.from.month() == $scope.to.month() && $scope.from.year() == $scope.to.year()) {
      $scope.title = $scope.from.format('MMMM YYYY');
      $scope.previousFrom = new moment($scope.from).subtract(1, 'month').startOf('month');
      $scope.previousTo = new moment($scope.from).subtract(1, 'month').endOf('month');
      $scope.nextFrom = new moment($scope.from).add(1, 'month').startOf('month');
      $scope.nextTo = new moment($scope.from).add(1, 'month').endOf('month');
    } else {
      $scope.title = $scope.from.format('YYYY-MM-DD') + ' - ' + $scope.to.format('YYYY-MM-DD');
      var days = $scope.to.diff($scope.from, 'days') + 1;
      $scope.previousFrom = new moment($scope.from).subtract(days, 'days');
      $scope.previousTo = new moment($scope.to).subtract(days, 'days');
      $scope.nextFrom = new moment($scope.from).add(days, 'days');
      $scope.nextTo = new moment($scope.to).add(days, 'days');
    }
    $scope.weekStart = new moment().startOf('isoWeek').format('YYYYMMDD');
    $scope.weekEnd = new moment().endOf('isoWeek').format('YYYYMMDD');
    $scope.monthStart = new moment().startOf('month').format('YYYYMMDD');
    $scope.monthEnd = new moment().endOf('month').format('YYYYMMDD');
    $scope.yearStart = new moment().startOf('year').format('YYYYMMDD');
    $scope.yearEnd = new moment().endOf('year').format('YYYYMMDD');
    $scope.previous = function () {
      $state.go('app.time_report', {
        from: $scope.previousFrom.format('YYYYMMDD'),
        to: $scope.previousTo.format('YYYYMMDD')
      }, { location: 'replace' });
    };
    $scope.next = function () {
      $state.go('app.time_report', {
        from: $scope.nextFrom.format('YYYYMMDD'),
        to: $scope.nextTo.format('YYYYMMDD')
      }, { location: 'replace' });
    };
    $scope.refresh = function () {
      $scope.loading = true;
      TimeRegistration.getinfo({
        from: $scope.from.format('YYYYMMDD'),
        to: $scope.to.format('YYYYMMDD')
      }).$promise.then(function (b) {
        $scope.summary = b.summary;
        var grouped = _.groupBy(b.perTask, function (i) {
            return JSON.stringify({
              c: i.companyId,
              p: i.projectId
            });
          });
        $scope.infoPerProject = _.map(grouped, function (g) {
          return {
            companyId: g[0].companyId,
            company: g[0].company,
            projectId: g[0].projectId,
            project: g[0].project,
            tasks: g
          };
        });
      }).finally(function () {
        $scope.billableUnbillableGraph = [
          {
            label: 'Billable',
            data: $scope.summary.billableMinutes,
            color: '#7266BA'
          },
          {
            label: 'Unbillable',
            data: $scope.summary.unBillableMinutes,
            color: '#5D9CEC'
          }
        ];
        if ($scope.summary.unBillableMinutes || $scope.summary.billableMinutes)
          $scope.hasHours = true;
        else
          $scope.hasHours = false;
        $scope.loading = false;
      });
    };
  }
]);angular.module('time').controller('TimeRegistrationDialogController', [
  '$scope',
  'Project',
  'TimeRegistration',
  'toUpdate',
  'date',
  function ($scope, Project, TimeRegistration, toUpdate, date) {
    'use strict';
    $scope.originalTimeRegistration = toUpdate;
    $scope.newTimeRegistration = toUpdate == undefined;
    toUpdate = toUpdate || {};
    $scope.timeRegistration = {
      company: null,
      project: null,
      task: null,
      billable: toUpdate.billable || false,
      description: toUpdate.description || '',
      from: toUpdate.from ? convertNumericTimeToDisplay(toUpdate.from.numeric) : '',
      to: toUpdate.to ? convertNumericTimeToDisplay(toUpdate.to.numeric) : ''
    };
    $scope.$watch('timeRegistration.company', function (newv, oldv) {
      if (oldv && newv && oldv.id != newv.id) {
        $scope.timeRegistration.project = null;
        $scope.timeRegistration.task = null;
      }
    });
    $scope.$watch('timeRegistration.project', function (newv, oldv) {
      if (oldv && newv && oldv.id != newv.id) {
        $scope.timeRegistration.task = null;
      }
    });
    $scope.$watch('timeRegistration.task', function () {
      if ($scope.newTimeRegistration && $scope.timeRegistration.task) {
        $scope.timeRegistration.billable = $scope.timeRegistration.task.defaultRateInCents > 0;
      }
    });
    $scope.isBusy = false;
    $scope.message = '';
    // load all projects and convert them to companies => projects => tasks
    $scope.projects = Project.active(function () {
      $scope.companies = _.map(_.groupBy($scope.projects, function (p) {
        return p.companyId;
      }), function (g) {
        return {
          id: g[0].companyId,
          name: g[0].company.name,
          projects: g
        };
      });
      if (toUpdate.companyId)
        $scope.timeRegistration.company = _.first(_.where($scope.companies, { id: toUpdate.companyId }));
      if (toUpdate.projectId && $scope.timeRegistration.company)
        $scope.timeRegistration.project = _.first(_.where($scope.timeRegistration.company.projects, { id: toUpdate.projectId }));
      if (toUpdate.task && $scope.timeRegistration.project)
        $scope.timeRegistration.task = _.first(_.where($scope.timeRegistration.project.tasks, { name: toUpdate.task }));
      $scope.$apply();
    });
    $scope.ok = function () {
      showMessage('Saving time registration...');
      var id = $scope.newTimeRegistration ? {} : { id: $scope.originalTimeRegistration.id };
      TimeRegistration.save(id, {
        companyId: $scope.timeRegistration.company.id,
        projectId: $scope.timeRegistration.project.id,
        task: $scope.timeRegistration.task.name,
        description: $scope.timeRegistration.description,
        billable: $scope.timeRegistration.billable,
        date: date,
        from: convertDisplayTimeToNumeric($scope.timeRegistration.from),
        to: convertDisplayTimeToNumeric($scope.timeRegistration.to)
      }, function (data) {
        hideMessage();
        $scope.$close(data);
      }, function (err) {
        showMessage('An error occurred...');
      });
    };
    $scope.cancel = function () {
      $scope.$dismiss('cancel');
    };
    function showMessage(message) {
      $scope.isBusy = true;
      $scope.message = message;
    }
    function hideMessage() {
      $scope.isBusy = false;
      $scope.message = '';
    }
    function convertNumericTimeToDisplay(time) {
      var hour = Math.floor(time / 100);
      var minutes = Math.floor(time - hour * 100);
      return ('00' + hour).slice(-2) + ':' + ('00' + minutes).slice(-2);
    }
    function convertDisplayTimeToNumeric(time) {
      return parseInt(time.replace(':', ''), 10);
    }
  }
]);