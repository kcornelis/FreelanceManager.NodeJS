(function() {
	'use strict';

	function authInterceptor($rootScope, $q, $window) {
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

	function authInterceptorConfig($httpProvider) {
		$httpProvider.interceptors.push('authInterceptor');
	}

	function authentication($rootScope, $state, $window, $location, jwtHelper) {
		$rootScope.$on('$stateChangeStart', function(event, nextRoute, currentRoute) {
				var loggedIn = $window.localStorage.token && !jwtHelper.isTokenExpired($window.localStorage.token);
				if (nextRoute.access && 
					nextRoute.access.requiredLogin && 
					!loggedIn) {
						event.preventDefault();
						$state.go('login', { r: $location.url() });
				}
		});
	}

	authInterceptor.$inject = ['$rootScope', '$q', '$window'];
	authInterceptorConfig.$inject = ['$httpProvider'];
	authentication.$inject = ['$rootScope', '$state', '$window', '$location', 'jwtHelper'];

	angular.module('account', ['angular-jwt']);

	angular.module('account').factory('authInterceptor', authInterceptor);
	angular.module('account').config(authInterceptorConfig);
	angular.module('account').run(authentication);

})();
