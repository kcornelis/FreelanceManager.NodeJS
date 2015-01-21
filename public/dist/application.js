'use strict';
// Init the application configuration module for AngularJS application
var ApplicationConfiguration = function () {
    // Init module configuration options
    var applicationModuleName = 'freelancemanager';
    var applicationModuleVendorDependencies = [
        'ngResource',
        'ngAnimate',
        'ui.router',
        'ui.bootstrap',
        'ui.utils'
      ];
    // Add a new vertical module
    var registerModule = function (moduleName) {
      // Create angular module
      angular.module(moduleName, []);
      // Add the module to the AngularJS configuration file
      angular.module(applicationModuleName).requires.push(moduleName);
    };
    return {
      applicationModuleName: applicationModuleName,
      applicationModuleVendorDependencies: applicationModuleVendorDependencies,
      registerModule: registerModule
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
});'use strict';
// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('account');'use strict';
// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('core');'use strict';
ApplicationConfiguration.registerModule('crm');'use strict';
ApplicationConfiguration.registerModule('project');'use strict';
ApplicationConfiguration.registerModule('time');'use strict';
angular.module('account', ['angular-jwt']).factory('authInterceptor', [
  '$rootScope',
  '$q',
  '$window',
  function ($rootScope, $q, $window) {
    return {
      request: function (config) {
        config.headers = config.headers || {};
        if ($window.sessionStorage.token) {
          config.headers.Authorization = 'Bearer ' + $window.sessionStorage.token;
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
    $httpProvider.interceptors.push('authInterceptor');
  }
]).run([
  '$rootScope',
  '$location',
  '$window',
  'jwtHelper',
  function ($rootScope, $location, $window, jwtHelper) {
    $rootScope.$on('$stateChangeStart', function (event, nextRoute, currentRoute) {
      var loggedIn = $window.sessionStorage.token && !jwtHelper.isTokenExpired($window.sessionStorage.token);
      if (nextRoute.access && nextRoute.access.requiredLogin && !loggedIn) {
        $location.path('/login');
      }
    });
  }
]);'use strict';
angular.module('account').config([
  '$stateProvider',
  function ($stateProvider) {
    $stateProvider.state('login', {
      url: '/login',
      templateUrl: 'modules/account/views/login.html'
    }).state('account', {
      url: '/account',
      templateUrl: 'modules/account/views/account.html',
      access: { requiredLogin: true }
    });
  }
]);'use strict';
angular.module('account').controller('AccountInfoController', [
  '$scope',
  '$window',
  'jwtHelper',
  'Account',
  function ($scope, $window, jwtHelper, Account) {
    var token = jwtHelper.decodeToken($window.sessionStorage.token);
    Account.get({ id: token.id }).$promise.then(function (response) {
      $scope.account = response;
    });
    $scope.save = function () {
      Account.save(token.id, $scope.account);
    };
  }
]);angular.module('account').controller('AuthenticateController', [
  '$scope',
  '$http',
  '$window',
  '$location',
  function ($scope, $http, $window, $location) {
    $scope.user = {
      email: '',
      password: ''
    };
    $scope.error = '';
    $scope.submit = function () {
      $http.post('/security/authenticate', $scope.user).success(function (data, status, headers, config) {
        $window.sessionStorage.token = data.token;
        $location.path('/');
      }).error(function (data, status, headers, config) {
        // Erase the token if the user fails to log in
        delete $window.sessionStorage.token;
        // Handle login errors here
        $scope.error = 'Invalid email or password';
      });
    };
  }
]);'use strict';
// Setting up route
angular.module('core').config([
  '$stateProvider',
  '$urlRouterProvider',
  function ($stateProvider, $urlRouterProvider) {
    // Redirect to home view when route not found
    $urlRouterProvider.otherwise('/');
    // Home state routing
    $stateProvider.state('home', {
      url: '/',
      templateUrl: 'modules/core/views/home.html',
      access: { requiredLogin: true }
    });
  }
]);'use strict';
angular.module('core').controller('HeaderController', [
  '$scope',
  '$window',
  'jwtHelper',
  function ($scope, $window, jwtHelper) {
    $scope.date = new Date();
    var token = jwtHelper.decodeToken($window.sessionStorage.token);
    $scope.fullName = token.fullName;
  }
]);'use strict';
angular.module('core').controller('HomeController', [
  '$scope',
  function ($scope) {
    $scope.date = new Date();
  }
]);'use strict';
// TODO unit test this directive
angular.module('core').directive('fmActiveMenuItem', [
  '$state',
  '$stateParams',
  '$interpolate',
  function ($state, $stateParams, $interpolate) {
    return {
      restrict: 'A',
      controller: [
        '$scope',
        '$element',
        '$attrs',
        function ($scope, $element, $attrs) {
          var state, params, activeClass;
          state = $attrs.fmActiveMenuItem || '';
          $scope.$on('$stateChangeSuccess', update);
          // Update route state
          function update() {
            if ($state.$current.self.name.indexOf(state) == 0) {
              $element.addClass('active');
            } else {
              $element.removeClass('active');
            }
          }
        }
      ]
    };
  }
]);'use strict';
angular.module('core').directive('autofocus', [
  '$timeout',
  function ($timeout) {
    return {
      link: function (scope, element, attrs) {
        $timeout(function () {
          element[0].focus();
        }, 100);
      }
    };
  }
]);'use strict';
angular.module('core').directive('fmClockpicker', function () {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      element.clockpicker();
    }
  };
});'use strict';
// TODO unit test this directive
angular.module('core').directive('fmDatepicker', [
  '$timeout',
  function ($timeout) {
    return {
      restrict: 'A',
      require: '?ngModel',
      scope: { fmDatepickerDatechanged: '&' },
      link: function (scope, element, attrs, ngModel, timeout) {
        if (!ngModel)
          return;
        var updateModel = function (dateTxt) {
          scope.$apply(function () {
            ngModel.$setViewValue(dateTxt);
          });
        };
        ngModel.$render = function () {
          element.datepicker('setDate', ngModel.$viewValue || '');
        };
        element.datepicker({
          format: attrs.fmDatepickerFormat || 'yyyy-mm-dd',
          autoclose: true,
          orientation: 'auto right',
          todayBtn: 'linked'
        }).on('changeDate', function (date) {
          var dateTxt = date.format(attrs.fmDatepickerFormat || 'yyyy-mm-dd');
          if (scope.$root && !scope.$root.$$phase) {
            updateModel(dateTxt);
            if (scope.fmDatepickerDatechanged) {
              scope.$apply(function () {
                scope.fmDatepickerDatechanged({ date: dateTxt });
              });
            }
          }
        });
      }
    };
  }
]);'use strict';
// TODO unit test this directive
angular.module('core').directive('piechart', function () {
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
          chart = $.plot(elem, v, options);
          elem.show();
        } else {
          chart.setData(v);
          chart.setupGrid();
          chart.draw();
        }
      });
    }
  };
});'use strict';
angular.module('core').factory('Account', [
  '$resource',
  function ($resource) {
    return $resource('/api/public/accounts/:id', { id: '@id' });
  }
]);'use strict';
angular.module('core').factory('Company', [
  '$resource',
  function ($resource) {
    return $resource('/api/public/companies/:id', { id: '@id' });
  }
]);'use strict';
angular.module('core').factory('Invoice', [
  '$resource',
  function ($resource) {
    return $resource('/api/public/invoices/:id', { id: '@id' });
  }
]);'use strict';
angular.module('core').factory('Project', [
  '$resource',
  function ($resource) {
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
]);'use strict';
angular.module('core').factory('TimeRegistration', [
  '$resource',
  function ($resource) {
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
      }
    });
  }
]);'use strict';
// TODO unit test
angular.module('core').factory('XLSXReader', [
  '$q',
  '$rootScope',
  function ($q, $rootScope) {
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
]);'use strict';
angular.module('core').filter('formatdate', function () {
  return function (a) {
    if (_.has(a, 'year') && _.has(a, 'month') && _.has(a, 'day')) {
      return a.year + '-' + ('00' + a.month).slice(-2) + '-' + ('00' + a.day).slice(-2);
    } else
      return '-';
  };
});'use strict';
angular.module('core').filter('formattime', function () {
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
});'use strict';
angular.module('core').filter('moment', function () {
  return function (date, format) {
    return date.format(format);
  };
});'use strict';
//Menu service used for managing  menus
angular.module('core').service('Menus', [function () {
    // Define a set of default roles
    this.defaultRoles = ['user'];
    // Define the menus object
    this.menus = {};
    // A private function for rendering decision
    var shouldRender = function (user) {
      if (user) {
        for (var userRoleIndex in user.roles) {
          for (var roleIndex in this.roles) {
            if (this.roles[roleIndex] === user.roles[userRoleIndex]) {
              return true;
            }
          }
        }
      } else {
        return this.isPublic;
      }
      return false;
    };
    // Validate menu existance
    this.validateMenuExistance = function (menuId) {
      if (menuId && menuId.length) {
        if (this.menus[menuId]) {
          return true;
        } else {
          throw new Error('Menu does not exists');
        }
      } else {
        throw new Error('MenuId was not provided');
      }
      return false;
    };
    // Get the menu object by menu id
    this.getMenu = function (menuId) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);
      // Return the menu object
      return this.menus[menuId];
    };
    // Add new menu object by menu id
    this.addMenu = function (menuId, isPublic, roles) {
      // Create the new menu
      this.menus[menuId] = {
        isPublic: isPublic || false,
        roles: roles || this.defaultRoles,
        items: [],
        shouldRender: shouldRender
      };
      // Return the menu object
      return this.menus[menuId];
    };
    // Remove existing menu object by menu id
    this.removeMenu = function (menuId) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);
      // Return the menu object
      delete this.menus[menuId];
    };
    // Add menu item object
    this.addMenuItem = function (menuId, menuItemTitle, menuItemURL, menuItemType, menuItemUIRoute, isPublic, roles) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);
      // Push new menu item
      this.menus[menuId].items.push({
        title: menuItemTitle,
        link: menuItemURL,
        menuItemType: menuItemType || 'item',
        menuItemClass: menuItemType,
        uiRoute: menuItemUIRoute || '/' + menuItemURL,
        isPublic: isPublic || this.menus[menuId].isPublic,
        roles: roles || this.defaultRoles,
        items: [],
        shouldRender: shouldRender
      });
      // Return the menu object
      return this.menus[menuId];
    };
    // Add submenu item object
    this.addSubMenuItem = function (menuId, rootMenuItemURL, menuItemTitle, menuItemURL, menuItemUIRoute, isPublic, roles) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);
      // Search for menu item
      for (var itemIndex in this.menus[menuId].items) {
        if (this.menus[menuId].items[itemIndex].link === rootMenuItemURL) {
          // Push new submenu item
          this.menus[menuId].items[itemIndex].items.push({
            title: menuItemTitle,
            link: menuItemURL,
            uiRoute: menuItemUIRoute || '/' + menuItemURL,
            isPublic: isPublic || this.menus[menuId].isPublic,
            roles: roles || this.defaultRoles,
            shouldRender: shouldRender
          });
        }
      }
      // Return the menu object
      return this.menus[menuId];
    };
    // Remove existing menu object by menu id
    this.removeMenuItem = function (menuId, menuItemURL) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);
      // Search for menu item to remove
      for (var itemIndex in this.menus[menuId].items) {
        if (this.menus[menuId].items[itemIndex].link === menuItemURL) {
          this.menus[menuId].items.splice(itemIndex, 1);
        }
      }
      // Return the menu object
      return this.menus[menuId];
    };
    // Remove existing menu object by menu id
    this.removeSubMenuItem = function (menuId, submenuItemURL) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);
      // Search for menu item to remove
      for (var itemIndex in this.menus[menuId].items) {
        for (var subitemIndex in this.menus[menuId].items[itemIndex].items) {
          if (this.menus[menuId].items[itemIndex].items[subitemIndex].link === submenuItemURL) {
            this.menus[menuId].items[itemIndex].items.splice(subitemIndex, 1);
          }
        }
      }
      // Return the menu object
      return this.menus[menuId];
    };
    //Adding the topbar menu
    this.addMenu('topbar');
  }]);'use strict';
// Setting up route
angular.module('crm').config([
  '$stateProvider',
  function ($stateProvider) {
    // crm state routing
    $stateProvider.state('crm', {
      templateUrl: 'modules/crm/views/crm.html',
      access: { requiredLogin: true }
    }).state('crm.companies', {
      url: '/companies',
      templateUrl: 'modules/crm/views/companies.html',
      access: { requiredLogin: true }
    });
  }
]);'use strict';
angular.module('crm').controller('CompaniesController', [
  '$scope',
  '$modal',
  'Company',
  function ($scope, $modal, Company) {
    $scope.getAllCompanies = function () {
      $scope.companies = Company.query();
    };
    $scope.openCompany = function (company) {
      var createDialog = $modal.open({
          templateUrl: '/modules/crm/views/companydialog.html',
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
]);'use strict';
angular.module('crm').controller('CompanyDialogController', [
  '$scope',
  'Company',
  'toUpdate',
  function ($scope, Company, toUpdate) {
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
]);'use strict';
// Setting up route
angular.module('project').config([
  '$stateProvider',
  function ($stateProvider) {
    // project state routing
    $stateProvider.state('project', {
      templateUrl: 'modules/project/views/project.html',
      access: { requiredLogin: true }
    }).state('project.projects', {
      url: '/projects',
      templateUrl: 'modules/project/views/projects.html',
      access: { requiredLogin: true }
    });
  }
]);'use strict';
angular.module('project').controller('ProjectDialogController', [
  '$scope',
  'Project',
  'Company',
  'toUpdate',
  function ($scope, Project, Company, toUpdate) {
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
]);'use strict';
angular.module('project').controller('ProjectsController', [
  '$scope',
  '$modal',
  'Project',
  function ($scope, $modal, Project) {
    $scope.getAllProjects = function () {
      $scope.projects = Project.query();
    };
    $scope.openProject = function (project) {
      var createDialog = $modal.open({
          templateUrl: '/modules/project/views/projectdialog.html',
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
]);'use strict';
angular.module('project').controller('ProjectTasksDialogController', [
  '$scope',
  'Project',
  'toUpdate',
  function ($scope, Project, toUpdate) {
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
]);'use strict';
// Setting up route
angular.module('time').config([
  '$stateProvider',
  '$urlRouterProvider',
  function ($stateProvider, $urlRouterProvider) {
    // time registration state routing
    $stateProvider.state('time', {
      templateUrl: 'modules/time/views/time.html',
      access: { requiredLogin: true }
    }).state('time.overview', {
      url: '/time/overview/:from/:to',
      templateUrl: 'modules/time/views/overview.html',
      access: { requiredLogin: true }
    }).state('time.registrations', {
      url: '/time/registrations/:date',
      templateUrl: 'modules/time/views/registrations.html',
      access: { requiredLogin: true }
    }).state('time.report', {
      url: '/time/report/:from/:to',
      templateUrl: 'modules/time/views/report.html',
      access: { requiredLogin: true }
    }).state('time.import', {
      url: '/time/import',
      templateUrl: 'modules/time/views/import.html',
      access: { requiredLogin: true }
    });
  }
]);'use strict';
// TODO unit test
angular.module('time').controller('ImportController', [
  '$scope',
  'XLSXReader',
  'Project',
  'TimeRegistration',
  function ($scope, XLSXReader, Project, TimeRegistration) {
    // upload, sheet, column, project, import
    $scope.wizardStep = 1;
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
        $scope.gotoStep2();
      });
    };
    $scope.gotoStep2 = function () {
      $scope.wizardStep += 1;
    };
    $scope.canGotoStep2 = function () {
      return true;
    };
    // step 2 (sheet selection)
    // ***********************
    $scope.selectedSheetName = undefined;
    $scope.selectedSheet = undefined;
    $scope.gotoStep3 = function () {
      $scope.selectedSheet = $scope.excelSheets[$scope.selectedSheetName];
      var selectedSheetHeader = [];
      for (var i = 0; i < $scope.selectedSheet.header.length; i++) {
        selectedSheetHeader.push({
          key: i,
          value: $scope.selectedSheet.header[i]
        });
      }
      $scope.selectedSheetHeader = selectedSheetHeader;
      $scope.wizardStep += 1;
    };
    $scope.canGotoStep3 = function () {
      return $scope.selectedSheetName != null;
    };
    // step 3 (column selection)
    // ***********************	
    $scope.gotoStep4 = function () {
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
      $scope.wizardStep += 1;
    };
    $scope.canGotoStep4 = function () {
      return $scope.selectedProjectColumn != null && $scope.selectedTaskColumn != null && $scope.selectedDateColumn != null && $scope.selectedFromColumn != null && $scope.selectedToColumn != null && $scope.selectedDescriptionColumn != null;
    };
    // step 4 (project mapping)
    // ***********************	
    $scope.gotoStep5 = function () {
      $scope.wizardStep += 1;
    };
    $scope.canGotoStep5 = function () {
      return _.every($scope.projectsInExcelSheet, function (p) {
        return p.mappedProjectAndTask != null;
      });
    };
    // step 5 (saving)
    // ***********************	
    $scope.import = function () {
      var registrations = [];
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
      TimeRegistration.save(registrations, function () {
        var i = 0;
      }, function () {
        var i = 0;
      });
    };
    function convertDisplayDateToNumeric(date) {
      return parseInt(date.replace(/-/g, ''), 10);
    }
    function convertDisplayTimeToNumeric(time) {
      return parseInt(time.replace(':', ''), 10);
    }
  }
]);'use strict';
angular.module('time').controller('OverviewController', [
  '$scope',
  '$location',
  '$stateParams',
  'TimeRegistration',
  function ($scope, $location, $stateParams, TimeRegistration) {
    $scope.from = new moment($stateParams.from, 'YYYYMMDD');
    $scope.to = new moment($stateParams.to, 'YYYYMMDD');
    $scope.hasTimeRegistrations = false;
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
      $location.path('/time/overview/' + $scope.from.format('YYYYMMDD') + '/' + $scope.to.format('YYYYMMDD')).replace();
    };
    $scope.refresh = function () {
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
      });
    };
  }
]);'use strict';
angular.module('time').controller('RegistrationsController', [
  '$scope',
  '$modal',
  '$location',
  '$stateParams',
  'TimeRegistration',
  function ($scope, $modal, $location, $stateParams, TimeRegistration) {
    $scope.date = new moment($stateParams.date, 'YYYYMMDD');
    $scope.hasTimeRegistrations = false;
    $scope.$watch('date', function () {
      $scope.displayDate = $scope.date.format('YYYY-MM-DD');
    });
    $scope.nextDate = function () {
      $scope.date = new moment($scope.date.add(1, 'days'));
      $location.path('/time/registrations/' + $scope.date.format('YYYYMMDD')).replace();
      $scope.refresh();
    };
    $scope.previousDate = function () {
      $scope.date = new moment($scope.date.subtract(1, 'days'));
      $location.path('/time/registrations/' + $scope.date.format('YYYYMMDD')).replace();
      $scope.refresh();
    };
    $scope.changeDate = function (date, format) {
      $scope.date = new moment(date, format);
      $location.path('/time/registrations/' + $scope.date.format('YYYYMMDD')).replace();
      $scope.refresh();
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
]);'use strict';
angular.module('time').controller('ReportController', [
  '$scope',
  '$location',
  '$stateParams',
  'TimeRegistration',
  function ($scope, $location, $stateParams, TimeRegistration) {
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
      $location.path('/time/report/' + $scope.previousFrom.format('YYYYMMDD') + '/' + $scope.previousTo.format('YYYYMMDD')).replace();
    };
    $scope.next = function () {
      $location.path('/time/report/' + $scope.nextFrom.format('YYYYMMDD') + '/' + $scope.nextTo.format('YYYYMMDD')).replace();
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
]);'use strict';
angular.module('time').controller('TimeController', [
  '$scope',
  '$location',
  '$stateParams',
  function ($scope, $location, $stateParams) {
    $scope.today = new moment();
    $scope.firstOfCurrentMonth = new moment().startOf('month');
    $scope.lastOfCurrentMonth = new moment().endOf('month');
  }
]);'use strict';
angular.module('time').controller('TimeRegistrationDialogController', [
  '$scope',
  'Project',
  'TimeRegistration',
  'toUpdate',
  'date',
  function ($scope, Project, TimeRegistration, toUpdate, date) {
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