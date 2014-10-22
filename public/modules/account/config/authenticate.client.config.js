'use strict';

angular.module('account').factory('authInterceptor', function ($rootScope, $q, $window) {
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
        // handle the case where the user is not authenticated
      }
      return response || $q.when(response);
    }
  };
});

angular.module('account').config(function ($httpProvider) {
  $httpProvider.interceptors.push('authInterceptor');
});

angular.module('account').run(function($rootScope, $location, $window) {
    $rootScope.$on('$stateChangeStart', function(event, nextRoute, currentRoute) {
        if (nextRoute.access.requiredLogin && !$window.sessionStorage.token) {
            $location.path("/login");
        }
    });
});