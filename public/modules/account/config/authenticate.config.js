angular.module('account', ['angular-jwt'])

.factory('authInterceptor', function ($rootScope, $q, $window) {
	'use strict';

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
})

.config(function ($httpProvider) {
	'use strict';

	$httpProvider.interceptors.push('authInterceptor');
})

.run(function($rootScope, $location, $window, jwtHelper) {
	'use strict';

	$rootScope.$on('$stateChangeStart', function(event, nextRoute, currentRoute) {
			var loggedIn = $window.sessionStorage.token && !jwtHelper.isTokenExpired($window.sessionStorage.token);
			if (nextRoute.access && 
				nextRoute.access.requiredLogin && 
				!loggedIn) {
					$location.path("/login");
			}
	});
});