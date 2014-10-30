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
      if (nextRoute.access.requiredLogin && !loggedIn) {
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
      templateUrl: 'modules/account/views/login.client.view.html'
    });
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
      templateUrl: 'modules/core/views/home.client.view.html',
      access: { requiredLogin: true }
    });
  }
]);'use strict';
angular.module('core').controller('HeaderController', [
  '$scope',
  function ($scope) {
    $scope.date = new Date();
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
angular.module('core').factory('Company', [
  '$resource',
  function ($resource) {
    return $resource('/api/public/companies/:id', { id: '@id' });
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
      }
    });
  }
]);'use strict';
angular.module('core').filter('formattime', function () {
  return function (a) {
    return ('00' + a).slice(-2);
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
      templateUrl: 'modules/crm/views/crm.client.view.html',
      access: { requiredLogin: true }
    }).state('crm.companies', {
      url: '/companies',
      templateUrl: 'modules/crm/views/companies.client.view.html',
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
          templateUrl: '/modules/crm/views/companydialog.client.view.html',
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
      templateUrl: 'modules/project/views/project.client.view.html',
      access: { requiredLogin: true }
    }).state('project.projects', {
      url: '/projects',
      templateUrl: 'modules/project/views/projects.client.view.html',
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
          templateUrl: '/modules/project/views/projectdialog.client.view.html',
          controller: 'ProjectDialogController',
          resolve: {
            toUpdate: function () {
              return project;
            }
          }
        });
      createDialog.result.then(function (project) {
        var c = _.find($scope.projects, { 'id': project.id });
        if (c)
          angular.copy(project, c);
        else
          $scope.projects.push(project);
      });
    };
  }
]);'use strict';
// Setting up route
angular.module('time').config([
  '$stateProvider',
  '$urlRouterProvider',
  function ($stateProvider, $urlRouterProvider) {
    // time registration state routing
    $stateProvider.state('time', {
      templateUrl: 'modules/time/views/timeregistration.client.view.html',
      access: { requiredLogin: true }
    }).state('time.timeregistrations', {
      url: '/time/:date',
      templateUrl: 'modules/time/views/timeregistrations.client.view.html',
      access: { requiredLogin: true }
    });
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
      description: toUpdate.description || '',
      from: toUpdate.from ? convertNumericTimeToDisplay(toUpdate.from.numeric) : '',
      to: toUpdate.to ? convertNumericTimeToDisplay(toUpdate.to.numeric) : ''
    };
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
      $scope.timeRegistration.company = _.first(_.where($scope.companies, { id: toUpdate.companyId }));
      $scope.timeRegistration.project = _.first(_.where($scope.timeRegistration.company.projects, { id: toUpdate.projectId }));
      $scope.timeRegistration.task = _.first(_.where($scope.timeRegistration.project.tasks, { name: toUpdate.task }));
    });
    $scope.ok = function () {
      showMessage('Saving time registration...');
      var id = $scope.newTimeRegistration ? {} : { id: $scope.originalTimeRegistration.id };
      TimeRegistration.save(id, {
        companyId: $scope.timeRegistration.company.id,
        projectId: $scope.timeRegistration.project.id,
        task: $scope.timeRegistration.task.name,
        description: $scope.timeRegistration.description,
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
      return parseInt(time.replace(':', ''));
    }
  }
]);'use strict';
angular.module('time').controller('TimeRegistrationsController', [
  '$scope',
  '$modal',
  '$location',
  '$stateParams',
  'TimeRegistration',
  function ($scope, $modal, $location, $stateParams, TimeRegistration) {
    $scope.date = new moment($stateParams.date, 'YYYYMMDD');
    $scope.hasTimeRegistrations = false;
    $scope.nextDate = function () {
      $location.path('/time/' + $scope.date.add('days', 1).format('YYYYMMDD'));
    };
    $scope.previousDate = function () {
      $location.path('/time/' + $scope.date.subtract('days', 1).format('YYYYMMDD'));
    };
    $scope.refresh = function () {
      $scope.timeRegistrations = TimeRegistration.bydate({ date: $scope.date.format('YYYYMMDD') }, function () {
        $scope.hasTimeRegistrations = $scope.timeRegistrations.length > 0;
      });
    };
    $scope.openTimeRegistration = function (timeRegistration) {
      var createDialog = $modal.open({
          templateUrl: '/modules/time/views/timeregistrationdialog.client.view.html',
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
]);