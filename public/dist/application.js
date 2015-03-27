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
        'ui.bootstrap',
        'ui.router',
        'ui.utils',
        'oc.lazyLoad',
        'cfp.loadingBar',
        'ngSanitize',
        'ngResource',
        'ngTable'
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
          function ($ocLL, $q) {
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
                  return $ocLL.load(_arg);
                });
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
  }();//Start by defining the main module and adding the module dependencies
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
});ApplicationConfiguration.registerModule('account');ApplicationConfiguration.registerModule('core');ApplicationConfiguration.registerModule('crm');ApplicationConfiguration.registerModule('invoice');ApplicationConfiguration.registerModule('project');ApplicationConfiguration.registerModule('settings');ApplicationConfiguration.registerModule('time');angular.module('account', ['angular-jwt']).factory('authInterceptor', [
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
        //if (response.status === 401) {
        // handle the case where the user is not authenticated
        //}
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
    $scope.account = Account.get({ id: token.id });
    $scope.save = function () {
      Account.save(token.id, $scope.account);
    };
  }
]);angular.module('account').controller('AccountPasswordController', [
  '$scope',
  '$window',
  'jwtHelper',
  'Account',
  function ($scope, $window, jwtHelper, Account) {
    'use strict';
    var token = jwtHelper.decodeToken($window.localStorage.token);
    $scope.oldPassword = '';
    $scope.newPassword = '';
    $scope.newPasswordConfirm = '';
    $scope.save = function () {
      $scope.isSaving = true;
      $scope.hasError = false;
      Account.changePassword({ id: token.id }, {
        oldPassword: $scope.oldPassword,
        newPassword: $scope.newPassword
      }, function () {
        $scope.isSaving = false;
        $scope.oldPassword = '';
        $scope.newPassword = '';
        $scope.newPasswordConfirm = '';
        $scope.accountPasswordForm.$setPristine();
      }, function (err) {
        $scope.isSaving = false;
        $scope.hasError = true;
      });
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
    delete $window.localStorage.token;
    delete $window.localStorage.user;
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
        delete $window.localStorage.user;
        // Handle login errors here
        $scope.error = 'Invalid email or password';
      });
    };
  }
]);angular.module('core').config([
  'cfpLoadingBarProvider',
  function (cfpLoadingBarProvider) {
    'use strict';
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
    'use strict';
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
]);angular.module('core').constant('const_mediaquery', {
  'desktopLG': 1200,
  'desktop': 992,
  'tablet': 768,
  'mobile': 480
});angular.module('core').config([
  '$stateProvider',
  '$urlRouterProvider',
  function ($stateProvider, $urlRouterProvider) {
    'use strict';
    // Redirect to the dashboard view when route not found
    $urlRouterProvider.otherwise('/app/dashboard');
    $stateProvider.state('app', {
      url: '/app',
      abstract: true,
      templateUrl: 'modules/core/views/app.html',
      controller: 'AppController',
      access: { requiredLogin: true }
    }).state('app.dashboard', {
      url: '/dashboard',
      title: 'Dashboard',
      templateUrl: 'modules/core/views/dashboard.html',
      access: { requiredLogin: true }
    });
  }
]);// TODO unit test
// From the angle project
angular.module('core').controller('AppController', [
  '$rootScope',
  '$scope',
  '$state',
  '$window',
  '$localStorage',
  '$timeout',
  'toggleStateService',
  'cfpLoadingBar',
  function ($rootScope, $scope, $state, $window, $localStorage, $timeout, toggle, cfpLoadingBar) {
    'use strict';
    // Loading bar transition
    // ----------------------------------- 
    $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
      if ($('.wrapper > section').length)
        cfpLoadingBar.start();
    });
    $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
      event.targetScope.$watch('$viewContentLoaded', function () {
        cfpLoadingBar.complete();
      });
    });
    // Hook not found
    $rootScope.$on('$stateNotFound', function (event, unfoundState, fromState, fromParams) {
      console.log(unfoundState.to);
      // 'lazy.state'
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
    // Hides/show user avatar on sidebar
    $scope.toggleUserBlock = function () {
      $scope.$broadcast('toggleUserBlock');
    };
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
]);// TODO unit test
// From the angle project
angular.module('core').controller('SidebarController', [
  '$rootScope',
  '$scope',
  '$state',
  '$location',
  '$http',
  '$timeout',
  'const_mediaquery',
  function ($rootScope, $scope, $state, $location, $http, $timeout, mq) {
    'use strict';
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
      if (!item.sref || item.sref === '#') {
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
    };
    function closeAllBut(index) {
      index += '';
      for (var i in collapseList) {
        if (index < 0 || index.indexOf(i) < 0)
          collapseList[i] = true;
      }
    }
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
]);// TODO unit test
angular.module('core').directive('fmDynamic', [
  '$compile',
  function ($compile) {
    'use strict';
    return {
      restrict: 'A',
      replace: true,
      link: function (scope, ele, attrs) {
        scope.$watch(attrs.fmDynamic, function (html) {
          ele.html('<div data-fm-with=\'' + attrs.fmDynamicBind + '\'>' + html + '</div>');
          $compile(ele.contents())(scope);
        });
      }
    };
  }
]);// TODO unit test
// From the angle project
angular.module('core').directive('href', function () {
  'use strict';
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
});// TODO unit test
angular.module('core').directive('fmIframe', [
  '$compile',
  function ($compile) {
    'use strict';
    return {
      restrict: 'A',
      link: function (scope, ele, attrs) {
        scope.$watch(attrs.fmIframe, function (html) {
          var compiled = $compile(angular.element('<div data-fm-with=\'' + attrs.fmIframeBind + '\'>' + html + '</div>'))(scope);
          $(ele[0].contentDocument.body).html(compiled);
        });
      }
    };
  }
]);angular.module('core').directive('fmMatch', [
  '$parse',
  function match($parse) {
    'use strict';
    return {
      require: '?ngModel',
      restrict: 'A',
      link: function (scope, elem, attrs, ctrl) {
        if (!ctrl) {
          if (console && console.warn) {
            console.warn('Match validation requires ngModel to be on the element');
          }
          return;
        }
        var matchGetter = $parse(attrs.fmMatch);
        function getMatchValue() {
          var match = matchGetter(scope);
          if (angular.isObject(match) && match.hasOwnProperty('$viewValue')) {
            match = match.$viewValue;
          }
          return match;
        }
        scope.$watch(getMatchValue, function () {
          ctrl.$validate();
        });
        ctrl.$validators.match = function () {
          return ctrl.$viewValue === getMatchValue();
        };
      }
    };
  }
]);// TODO unit test
// From the angle project
angular.module('core').directive('now', [
  'dateFilter',
  '$interval',
  function (dateFilter, $interval) {
    'use strict';
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
                  return '<div style="font-size:8pt; text-align:center; padding:2px; color:white;">' + label + '<br/>' + Math.round(series.percent) + '%</div>';
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
});// TODO unit test
// From the angle project
angular.module('core').directive('searchOpen', [
  'navSearch',
  function (navSearch) {
    'use strict';
    return {
      restrict: 'A',
      controller: [
        '$scope',
        '$element',
        function ($scope, $element) {
          $element.on('click', function (e) {
            e.stopPropagation();
          }).on('click', navSearch.toggle);
        }
      ]
    };
  }
]).directive('searchDismiss', [
  'navSearch',
  function (navSearch) {
    'use strict';
    var inputSelector = '.navbar-form input[type="text"]';
    return {
      restrict: 'A',
      controller: [
        '$scope',
        '$element',
        function ($scope, $element) {
          $(inputSelector).on('click', function (e) {
            e.stopPropagation();
          }).on('keyup', function (e) {
            if (e.keyCode === 27)
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
      ]
    };
  }
]);// TODO unit test
// From the angle project
angular.module('core').directive('sidebar', [
  '$window',
  'const_mediaquery',
  function ($window, mq) {
    'use strict';
    var $win = $($window);
    var $html = $('html');
    var $body = $('body');
    var $scope;
    var $sidebar;
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
  }
]);// TODO unit test
// From the angle project
angular.module('core').directive('toggleFullscreen', function () {
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
});// TODO unit test
// From the angle project
angular.module('core').directive('toggleState', [
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
]);// TODO unit test
angular.module('core').directive('fmWith', function () {
  'use strict';
  return {
    restrict: 'A',
    scope: true,
    controller: [
      '$scope',
      '$attrs',
      '$parse',
      function ($scope, $attrs, $parse) {
        $scope.$parent.$watch($attrs.fmWith, function (oldVal, newVal) {
          var withObj = $scope.$parent[$attrs.fmWith];
          (function copyPropertiesToScope(withObj) {
            for (var prop in withObj) {
              if (withObj.hasOwnProperty(prop)) {
                Object.defineProperty($scope, prop, {
                  enumerable: true,
                  configurable: true,
                  get: $parse(prop).bind($scope, withObj, $scope.$parent),
                  set: $parse(prop).assign.bind($scope, withObj, $scope.$parent)
                });
              }
            }
          }(withObj));
        });
      }
    ]
  };
});angular.module('core').factory('Account', [
  '$resource',
  function ($resource) {
    'use strict';
    return $resource('/api/public/accounts/:id', { id: '@id' }, {
      changePassword: {
        method: 'POST',
        url: '/api/public/accounts/:id/changepassword',
        params: { id: '@id' }
      }
    });
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
    return $resource('/api/public/invoices/:id', { id: '@id' }, {
      preview: {
        method: 'POST',
        url: '/api/public/invoices/preview',
        isArray: false
      },
      bydate: {
        method: 'GET',
        url: '/api/public/invoices/bydate/:from/:to',
        params: {
          from: '@from',
          to: '@to'
        },
        isArray: true
      }
    });
  }
]);angular.module('core').factory('NgTableParams', [
  'ngTableParams',
  function (ngTableParams) {
    'use strict';
    return ngTableParams;
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
]);angular.module('core').factory('Template', [
  '$resource',
  function ($resource) {
    'use strict';
    return $resource('/api/public/templates/:id', { id: '@id' }, {
      active: {
        method: 'GET',
        url: '/api/public/templates/active',
        isArray: true
      },
      hide: {
        method: 'POST',
        url: '/api/public/templates/:id/hide',
        isArray: false
      },
      unhide: {
        method: 'POST',
        url: '/api/public/templates/:id/unhide',
        isArray: false
      }
    });
  }
]);angular.module('core').factory('TimeRegistration', [
  '$resource',
  function ($resource) {
    'use strict';
    return $resource('/api/public/timeregistrations/:id', { id: '@id' }, {
      search: {
        method: 'GET',
        url: '/api/public/timeregistrations/search',
        isArray: true
      },
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
      getinfoforperiod: {
        method: 'GET',
        url: '/api/public/timeregistrations/getinfoforperiod/:from/:to',
        params: {
          from: '@from',
          to: '@to'
        }
      },
      getinfoforperiodpertask: {
        method: 'GET',
        url: '/api/public/timeregistrations/getinfoforperiodpertask/:from/:to',
        params: {
          from: '@from',
          to: '@to'
        },
        isArray: true
      },
      saveMultiple: {
        method: 'POST',
        url: '/api/public/timeregistrations/multiple',
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
        if (row === 0)
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
});// TODO unit test
// From the angle project
angular.module('core').service('browser', function () {
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
});// TODO unit test
// From the angle project
angular.module('core').service('navSearch', function () {
  'use strict';
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
});// TODO unit test
// From the angle project
angular.module('core').service('toggleStateService', [
  '$rootScope',
  function ($rootScope) {
    'use strict';
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
]);// TODO unit test
// From the angle project
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
  $.support.touch = 'ontouchstart' in window && navigator.userAgent.toLowerCase().match(/mobile|tablet/) || window.DocumentTouch && document instanceof window.DocumentTouch || window.navigator.msPointerEnabled && window.navigator.msMaxTouchPoints > 0 || window.navigator.pointerEnabled && window.navigator.maxTouchPoints > 0 || false;
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
  $.Utils.events = {};
  $.Utils.events.click = $.support.touch ? 'tap' : 'click';
  $.langdirection = $html.attr('dir') === 'rtl' ? 'right' : 'left';
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
}(jQuery, window, document));angular.module('crm').config([
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
      Company.query(function (companies) {
        $scope.companies = _.sortBy(companies, 'name');
      });
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
    $scope.newCompany = toUpdate === undefined;
    toUpdate = toUpdate || {};
    $scope.company = {
      name: toUpdate.name,
      number: toUpdate.number,
      vatNumber: toUpdate.vatNumber,
      address: toUpdate.address ? {
        line1: toUpdate.address.line1,
        line2: toUpdate.address.line2,
        postalcode: toUpdate.address.postalcode,
        city: toUpdate.address.city
      } : null
    };
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
]);angular.module('crm').controller('SearchCompanyDialogController', [
  '$scope',
  'Company',
  function ($scope, Company) {
    'use strict';
    $scope.companies = Company.query();
    $scope.ok = function () {
      $scope.$close(_.first(_.where($scope.companies, function (c) {
        return c.id === $scope.selectedCompany;
      })));
    };
    $scope.cancel = function () {
      $scope.$dismiss('cancel');
    };
  }
]);angular.module('invoice').config([
  '$stateProvider',
  '$urlRouterProvider',
  function ($stateProvider, $urlRouterProvider) {
    'use strict';
    $stateProvider.state('app.invoice_create', {
      url: '/invoice/create',
      templateUrl: 'modules/invoice/views/create.html',
      controller: 'CreateController',
      access: { requiredLogin: true }
    }).state('app.invoice_overview', {
      url: '/invoice/overview/:from/:to',
      templateUrl: 'modules/invoice/views/overview.html',
      controller: 'InvoiceOverviewController',
      access: { requiredLogin: true },
      params: {
        from: function () {
          return moment().startOf('year').format('YYYYMMDD');
        },
        to: function () {
          return moment().endOf('year').format('YYYYMMDD');
        }
      }
    });
  }
]);// TODO unit test
angular.module('invoice').controller('CreateController', [
  '$scope',
  '$state',
  '$stateParams',
  '$modal',
  '$sce',
  'Project',
  'TimeRegistration',
  'Template',
  'Invoice',
  function ($scope, $state, $stateParams, $modal, $sce, Project, TimeRegistration, Template, Invoice) {
    'use strict';
    // Wizard helpers
    // **************
    var steps;
    function createsteps(q) {
      steps = [];
      for (var i = 1; i <= q; i++)
        steps[i] = false;
    }
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
    // Prefetch data
    // **************
    Project.query(function (projects) {
      $scope.projects = _.sortBy(projects, [
        'company.name',
        'name'
      ]);
    });
    $scope.templates = Template.active();
    // WIZART STEP 1 (time registrations)
    // **********************************
    $scope.search = {
      project: null,
      from: null,
      to: null,
      invoiced: false
    };
    $scope.searchTimeRegistrations = function () {
      $scope.loading = true;
      $scope.includeAllTimeRegistrations = false;
      TimeRegistration.search({
        project: $scope.search.project,
        from: $scope.search.from ? moment($scope.search.from, 'YYYY-MM-DD').format('YYYYMMDD') : null,
        to: $scope.search.to ? moment($scope.search.to, 'YYYY-MM-DD').format('YYYYMMDD') : null,
        invoiced: $scope.search.invoiced
      }, function (tr) {
        $scope.loading = false;
        $scope.searched = true;
        $scope.timeRegistrations = _.sortBy(tr, [
          'data.numeric',
          'from.numeric'
        ]);
      });
    };
    $scope.$watch('includeAllTimeRegistrations', function (v) {
      if ($scope.timeRegistrations) {
        _.forEach($scope.timeRegistrations, function (tr) {
          tr.included = v;
        });
      }
    });
    // WIZART STEP 2 (invoice lines)
    // *****************************
    $scope.invoice = { customer: { address: {} } };
    $scope.canGoto2 = function () {
      return _.some($scope.timeRegistrations, { included: true });
    };
    $scope.gobackto2 = function () {
      activate(2);
    };
    $scope.goto2 = function () {
      $scope.invoice.linkedTimeRegistrationIds = _.map($scope.timeRegistrations, function (tr) {
        return tr.id;
      });
      $scope.invoice.lines = _.map(_.groupBy(_.where($scope.timeRegistrations, { included: true }), function (tr) {
        return tr.projectId + '-' + tr.task;
      }), function (tr) {
        var totalMinutes = _.reduce(_.map(tr, 'totalMinutes'), function (sum, i) {
            return sum + i;
          });
        var quantity = Math.round(totalMinutes / 60 * 100) / 100;
        var project = _.first(_.where($scope.projects, function (p) {
            return p.id === tr[0].projectId;
          }));
        var task = project ? _.first(_.where(project.tasks, function (t) {
            return t.name === tr[0].task;
          })) : null;
        var priceInCents = task ? parseInt(task.defaultRateInCents) : 0;
        return {
          description: project.name,
          quantity: quantity,
          vatPercentage: 21,
          price: priceInCents / 100,
          priceInCents: priceInCents
        };
      }, 0);
      activate(2);
    };
    $scope.removeInvoiceLine = function (invoiceLine) {
      _.remove($scope.invoice.lines, invoiceLine);
    };
    $scope.addInvoiceLine = function () {
      $scope.invoice.lines.push({
        description: '',
        quantity: 1,
        vatPercentage: 21,
        price: 0,
        priceInCents: 0
      });
    };
    $scope.$watch('invoice.lines', function (lines) {
      _.forEach(lines, function (line) {
        line.priceInCents = Math.round(line.price * 100);
        line.totalInCents = Math.round(line.quantity * line.priceInCents);
        line.total = line.totalInCents / 100;
      });
    }, true);
    // WIZART STEP 3 (invoice info)
    // ****************************
    $scope.goto3 = function () {
      activate(3);
    };
    $scope.gobackto3 = function () {
      activate(3);
    };
    $scope.$watch('invoice.templateId', function (id) {
      var template = _.first(_.where($scope.templates, function (t) {
          return t.id === id;
        }));
      $scope.invoice.template = template ? template.content : '';
    });
    $scope.$watch('invoice.displayDate', function (date) {
      if (date) {
        $scope.invoice.displayCreditTerm = moment(date, 'YYYY-MM-DD').add(30, 'day').format('YYYY-MM-DD');
        $scope.invoice.date = moment(date, 'YYYY-MM-DD').format('YYYYMMDD');
      } else {
        $scope.invoice.displayCreditTerm = null;
        $scope.invoice.date = null;
      }
    });
    $scope.$watch('invoice.displayCreditTerm', function (date) {
      if (date) {
        $scope.invoice.creditTerm = moment(date, 'YYYY-MM-DD').format('YYYYMMDD');
      } else {
        $scope.invoice.creditTerm = null;
      }
    });
    $scope.searchCustomer = function () {
      var searchDialog = $modal.open({
          templateUrl: '/modules/crm/views/searchcompany.html',
          controller: 'SearchCompanyDialogController'
        });
      searchDialog.result.then(function (company) {
        if (company) {
          $scope.invoice.customer.name = company.name;
          $scope.invoice.customer.vatNumber = company.vatNumber;
          $scope.invoice.customer.number = company.number;
          $scope.invoice.customer.address.line1 = company.address.line1;
          $scope.invoice.customer.address.line2 = company.address.line2;
          $scope.invoice.customer.address.postalcode = company.address.postalcode;
          $scope.invoice.customer.address.city = company.address.city;
        }
      });
    };
    // WIZART STEP 4 (preview)
    // ***********************
    $scope.goto4 = function () {
      $scope.loading = true;
      Invoice.preview($scope.invoice, function (invoice) {
        $scope.invoicePreview = invoice;
        $scope.loading = false;
        $scope.previewUrl = $sce.trustAsResourceUrl('/render/#!/invoicepreview?invoice=' + window.encodeURIComponent(JSON.stringify(invoice)));
      });
      activate(4);
    };
    $scope.create = function () {
      Invoice.save($scope.invoice, function () {
        $state.go('app.invoice_overview');
      });
    };
  }
]);angular.module('invoice').controller('InvoiceOverviewController', [
  '$scope',
  'Invoice',
  '$state',
  '$stateParams',
  function ($scope, Invoice, $state, $stateParams) {
    'use strict';
    $scope.year = moment($stateParams.from, 'YYYYMMDD').year();
    $scope.getAllInvoices = function () {
      Invoice.bydate({
        from: $stateParams.from,
        to: $stateParams.to
      }, function (invoices) {
        $scope.invoices = _.sortBy(invoices, function (i) {
          return i.date.numeric;
        });
      });
    };
    $scope.previous = function () {
      $state.go('app.invoice_overview', {
        from: $scope.year - 1 + '0101',
        to: $scope.year - 1 + '1231'
      }, { location: 'replace' });
    };
    $scope.next = function () {
      $state.go('app.invoice_overview', {
        from: $scope.year + 1 + '0101',
        to: $scope.year + 1 + '1231'
      }, { location: 'replace' });
    };
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
    $scope.newProject = toUpdate === undefined;
    toUpdate = toUpdate || {};
    $scope.project = {
      companyId: toUpdate.companyId || '',
      name: toUpdate.name || '',
      description: toUpdate.description || ''
    };
    $scope.isBusy = false;
    $scope.message = '';
    Company.query(function (companies) {
      $scope.companies = _.sortBy(companies, 'name');
    });
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
      Project.query(function (projects) {
        $scope.projects = _.sortBy(projects, [
          'company.name',
          'name'
        ]);
      });
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
          defaultRateInCents: t.defaultRateInCents,
          defaultRate: t.defaultRateInCents ? t.defaultRateInCents / 100 : t.defaultRateInCents
        };
      })
    };
    $scope.$watch('project.tasks', function (tasks) {
      _.forEach(tasks, function (task) {
        task.defaultRateInCents = Math.round(task.defaultRate * 100);
      });
    }, true);
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
]);angular.module('settings').config([
  '$stateProvider',
  function ($stateProvider) {
    'use strict';
    $stateProvider.state('app.settings_templates', {
      url: '/settings/templates',
      templateUrl: 'modules/settings/views/templates.html',
      controller: 'TemplatesController',
      access: { requiredLogin: true }
    });
  }
]);angular.module('settings').controller('TemplatesController', [
  '$scope',
  'Template',
  function ($scope, Template) {
    'use strict';
    $scope.getAllTemplates = function () {
      $scope.templates = Template.query();
    };
    $scope.openTemplate = function (template) {
      $scope.template = template || {};
      $scope.newTemplate = template === undefined;
    };
    $scope.newTemplate = true;
    $scope.saveTemplate = function () {
      var id = $scope.newTemplate ? {} : { id: $scope.template.id };
      Template.save(id, $scope.template, function (data) {
        if ($scope.newTemplate) {
          $scope.templates.push(data);
          $scope.template = data;
          $scope.newTemplate = false;
        }
      }, function (err) {
        // TODO show toaster
        alert(err);
      });
    };
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
      params: {
        date: function () {
          return moment().format('YYYYMMDD');
        }
      }
    }).state('app.time_report', {
      url: '/time/report/:from/:to',
      templateUrl: 'modules/time/views/report.html',
      controller: 'ReportController',
      access: { requiredLogin: true },
      params: {
        from: function () {
          return moment().startOf('month').format('YYYYMMDD');
        },
        to: function () {
          return moment().endOf('month').format('YYYYMMDD');
        }
      }
    }).state('app.time_import', {
      url: '/time/import',
      templateUrl: 'modules/time/views/import.html',
      controller: 'ImportController',
      resolve: ApplicationConfiguration.resolve('lib/js-xlsx/dist/xlsx.core.min.js'),
      access: { requiredLogin: true }
    }).state('app.time_export', {
      url: '/time/export/:from/:to',
      templateUrl: 'modules/time/views/export.html',
      controller: 'ExportController',
      access: { requiredLogin: true },
      params: {
        from: function () {
          return moment().startOf('month').format('YYYYMMDD');
        },
        to: function () {
          return moment().endOf('month').format('YYYYMMDD');
        }
      }
    });
  }
]);angular.module('time').controller('ExportController', [
  '$scope',
  '$state',
  '$stateParams',
  'TimeRegistration',
  function ($scope, $state, $stateParams, TimeRegistration) {
    'use strict';
    $scope.from = moment($stateParams.from, 'YYYYMMDD');
    $scope.to = moment($stateParams.to, 'YYYYMMDD');
    $scope.hasTimeRegistrations = false;
    $scope.loading = false;
    $scope.from = moment($stateParams.from, 'YYYYMMDD');
    $scope.to = moment($stateParams.to, 'YYYYMMDD');
    $scope.thisWeek = moment().day(1).format('YYYYMMDD') + '/' + moment().day(7).format('YYYYMMDD');
    $scope.lastWeek = moment().day(1).subtract(7, 'days').format('YYYYMMDD') + '/' + moment().day(7).subtract(7, 'days').format('YYYYMMDD');
    $scope.thisMonth = moment().set('date', 1).format('YYYYMMDD') + '/' + moment().set('date', moment().daysInMonth()).format('YYYYMMDD');
    $scope.lastMonth = moment().set('date', 1).subtract(1, 'months').format('YYYYMMDD') + '/' + moment().subtract(1, 'months').set('date', moment().subtract(1, 'months').daysInMonth()).format('YYYYMMDD');
    $scope.thisYear = moment().set('month', 0).set('date', 1).format('YYYYMMDD') + '/' + moment().set('month', 11).set('date', 31).format('YYYYMMDD');
    $scope.lastYear = moment().set('month', 0).set('date', 1).subtract(1, 'years').format('YYYYMMDD') + '/' + moment().set('month', 11).set('date', 31).subtract(1, 'years').format('YYYYMMDD');
    $scope.$watch('from', function () {
      $scope.displayFrom = $scope.from.format('YYYY-MM-DD');
    });
    $scope.$watch('to', function () {
      $scope.displayTo = $scope.to.format('YYYY-MM-DD');
    });
    $scope.changeFrom = function (date, format) {
      $scope.from = moment(date, format);
    };
    $scope.changeTo = function (date, format) {
      $scope.to = moment(date, format);
    };
    $scope.applyDate = function () {
      $state.go('app.time_export', {
        from: $scope.from.format('YYYYMMDD'),
        to: $scope.to.format('YYYYMMDD')
      }, { location: 'replace' });
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
            items: _.sortBy(g, function (i) {
              return i.from.numeric;
            })
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
  'NgTableParams',
  '$filter',
  'Project',
  'TimeRegistration',
  function ($scope, $state, XLSXReader, NgTableParams, $filter, Project, TimeRegistration) {
    'use strict';
    // Wizard helpers
    // **************
    var steps;
    function createsteps(q) {
      steps = [];
      for (var i = 1; i <= q; i++)
        steps[i] = false;
    }
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
            display: p.company.name + ' - ' + p.name + ' - ' + t.name,
            id: id++
          });
        });
      });
      $scope.tasks = _.sortBy(tasks, 'display');
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
      return $scope.selectedSheetName !== null;
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
      return $scope.selectedProjectColumn !== null && $scope.selectedTaskColumn !== null && $scope.selectedDateColumn !== null && $scope.selectedFromColumn !== null && $scope.selectedToColumn !== null && $scope.selectedDescriptionColumn !== null;
    };
    // step 4 (project mapping)
    // ***********************	
    $scope.goto5 = function () {
      activate(5);
    };
    $scope.canGoto5 = function () {
      return _.every($scope.projectsInExcelSheet, function (p) {
        return p.mappedProjectAndTask !== null;
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
            return p.project === groupedRow[0][$scope.selectedProjectColumn] && p.task === groupedRow[0][$scope.selectedTaskColumn];
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
            to: convertDisplayTimeToNumeric(row[$scope.selectedToColumn]),
            billable: task.billable
          });
        });
      });
      TimeRegistration.saveMultiple(registrations, function (data) {
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
    $scope.summaryTableParams = new NgTableParams({
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
    $scope.date = moment($stateParams.date, 'YYYYMMDD');
    $scope.hasTimeRegistrations = false;
    $scope.$watch('date', function () {
      $scope.displayDate = $scope.date.format('YYYY-MM-DD');
    });
    $scope.nextDate = function () {
      $state.go('app.time_overview', { date: moment($scope.date.add(1, 'days')).format('YYYYMMDD') }, { location: 'replace' });
    };
    $scope.previousDate = function () {
      $state.go('app.time_overview', { date: $scope.date.subtract(1, 'days').format('YYYYMMDD') }, { location: 'replace' });
    };
    $scope.changeDate = function (date, format) {
      $state.go('app.time_overview', { date: moment(date, format).format('YYYYMMDD') }, { location: 'replace' });
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
      createDialog.result.then(function (data) {
        if (data.deleted) {
          _.remove($scope.timeRegistrations, function (item) {
            return item.id === data.deleted;
          });
        } else {
          var c = _.find($scope.timeRegistrations, { 'id': data.id });
          if (c)
            angular.copy(data, c);
          else
            $scope.timeRegistrations.push(data);
        }
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
    $scope.from = moment($stateParams.from, 'YYYYMMDD');
    $scope.to = moment($stateParams.to, 'YYYYMMDD');
    // is this a full year?
    if ($scope.from.date() === 1 && $scope.from.month() === 0 && $scope.to.date() === 31 && $scope.to.month() === 11 && $scope.from.year() === $scope.to.year()) {
      $scope.title = $scope.from.format('YYYY');
      $scope.previousFrom = moment($scope.from).subtract(1, 'year');
      $scope.previousTo = moment($scope.to).subtract(1, 'year');
      $scope.nextFrom = moment($scope.from).add(1, 'year');
      $scope.nextTo = moment($scope.to).add(1, 'year');
    }  // is this a full month?
    else if ($scope.from.date() === 1 && moment($scope.from).endOf('month').date() === $scope.to.date() && $scope.from.month() === $scope.to.month() && $scope.from.year() === $scope.to.year()) {
      $scope.title = $scope.from.format('MMMM YYYY');
      $scope.previousFrom = moment($scope.from).subtract(1, 'month').startOf('month');
      $scope.previousTo = moment($scope.from).subtract(1, 'month').endOf('month');
      $scope.nextFrom = moment($scope.from).add(1, 'month').startOf('month');
      $scope.nextTo = moment($scope.from).add(1, 'month').endOf('month');
    } else {
      $scope.title = $scope.from.format('YYYY-MM-DD') + ' - ' + $scope.to.format('YYYY-MM-DD');
      var days = $scope.to.diff($scope.from, 'days') + 1;
      $scope.previousFrom = moment($scope.from).subtract(days, 'days');
      $scope.previousTo = moment($scope.to).subtract(days, 'days');
      $scope.nextFrom = moment($scope.from).add(days, 'days');
      $scope.nextTo = moment($scope.to).add(days, 'days');
    }
    $scope.weekStart = moment().startOf('isoWeek').format('YYYYMMDD');
    $scope.weekEnd = moment().endOf('isoWeek').format('YYYYMMDD');
    $scope.monthStart = moment().startOf('month').format('YYYYMMDD');
    $scope.monthEnd = moment().endOf('month').format('YYYYMMDD');
    $scope.yearStart = moment().startOf('year').format('YYYYMMDD');
    $scope.yearEnd = moment().endOf('year').format('YYYYMMDD');
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
      TimeRegistration.getinfoforperiod({
        from: $scope.from.format('YYYYMMDD'),
        to: $scope.to.format('YYYYMMDD')
      }, function (result) {
        $scope.summary = result;
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
      TimeRegistration.getinfoforperiodpertask({
        from: $scope.from.format('YYYYMMDD'),
        to: $scope.to.format('YYYYMMDD')
      }, function (result) {
        var grouped = _.groupBy(result, function (i) {
            return JSON.stringify({
              c: i.companyId,
              p: i.projectId
            });
          });
        $scope.infoPerProject = _.sortBy(_.map(grouped, function (g) {
          return {
            companyId: g[0].companyId,
            company: g[0].company,
            projectId: g[0].projectId,
            project: g[0].project,
            tasks: g
          };
        }), [
          'company.name',
          'project.name'
        ]);
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
    // private methods
    // ---------------
    function convertNumericTimeToDisplay(time) {
      var hour = Math.floor(time / 100);
      var minutes = Math.floor(time - hour * 100);
      return ('00' + hour).slice(-2) + ':' + ('00' + minutes).slice(-2);
    }
    function showMessage(message) {
      $scope.isBusy = true;
      $scope.message = message;
    }
    function hideMessage() {
      $scope.isBusy = false;
      $scope.message = '';
    }
    function convertDisplayTimeToNumeric(time) {
      return parseInt(time.replace(':', ''), 10);
    }
    // scope watches
    // -------------
    $scope.$watch('timeRegistration.company', function (newv, oldv) {
      if (oldv && newv && oldv.id !== newv.id) {
        $scope.timeRegistration.project = null;
        $scope.timeRegistration.task = null;
      }
    });
    $scope.$watch('timeRegistration.project', function (newv, oldv) {
      if (oldv && newv && oldv.id !== newv.id) {
        $scope.timeRegistration.task = null;
      }
    });
    $scope.$watch('timeRegistration.task', function () {
      if ($scope.newTimeRegistration && $scope.timeRegistration.task) {
        $scope.timeRegistration.billable = $scope.timeRegistration.task.defaultRateInCents > 0;
      }
    });
    // scope properties
    // ----------------	
    $scope.isBusy = false;
    $scope.message = '';
    $scope.originalTimeRegistration = toUpdate;
    $scope.newTimeRegistration = toUpdate === undefined;
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
    // load all projects and convert them to companies => projects => tasks
    $scope.projects = Project.active(function () {
      $scope.companies = _.sortBy(_.map(_.groupBy($scope.projects, function (p) {
        return p.companyId;
      }), function (g) {
        return {
          id: g[0].companyId,
          name: g[0].company.name,
          projects: _.sortBy(g, 'name')
        };
      }), 'name');
      if (toUpdate.companyId)
        $scope.timeRegistration.company = _.first(_.where($scope.companies, { id: toUpdate.companyId }));
      if (toUpdate.projectId && $scope.timeRegistration.company)
        $scope.timeRegistration.project = _.first(_.where($scope.timeRegistration.company.projects, { id: toUpdate.projectId }));
      if (toUpdate.task && $scope.timeRegistration.project)
        $scope.timeRegistration.task = _.first(_.where($scope.timeRegistration.project.tasks, { name: toUpdate.task }));
      if ($scope.newTimeRegistration)
        $scope.projectEditable = true;
      else if ($scope.timeRegistration.task)
        $scope.projectEditable = true;
      else
        $scope.projectEditable = false;
    });
    // scope actions
    // -------------
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
    $scope.delete = function () {
      showMessage('Deleting time registration...');
      var id = $scope.newTimeRegistration ? {} : { id: $scope.originalTimeRegistration.id };
      TimeRegistration.delete({ id: $scope.originalTimeRegistration.id }, function (data) {
        hideMessage();
        $scope.$close(data);
      }, function (err) {
        showMessage('An error occurred...');
      });
    };
    $scope.cancel = function () {
      $scope.$dismiss('cancel');
    };
  }
]);