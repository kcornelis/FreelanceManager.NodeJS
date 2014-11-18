'use strict';

angular.module('account').config(['$stateProvider',
	function($stateProvider) {
		$stateProvider.

		// does not require loggin
		state('login', {
			url: '/login',
			templateUrl: 'modules/account/views/login.html'
		}).

		state('account', {
			url: '/account',
			templateUrl: 'modules/account/views/account.html',
			access: { requiredLogin: true }
		});
	}
]);