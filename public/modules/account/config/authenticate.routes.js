(function() {
	'use strict';

	function routeRegistration($stateProvider) {
		$stateProvider.

		// the login page does not require loggin
		state('login', {
			url: '/login?r',
			templateUrl: 'modules/account/views/login.html',
			access: { requiredLogin: false }
		}).	

		state('app.account', {
			url: '/account',
			templateUrl: 'modules/account/views/account.html',
			access: { requiredLogin: true }
		});
	}

	routeRegistration.$inject = ['$stateProvider'];

	angular.module('fmAccount').config(routeRegistration);

})();
