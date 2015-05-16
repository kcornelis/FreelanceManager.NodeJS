angular.module('account').config(['$stateProvider',
	function($stateProvider) {
		'use strict';

		$stateProvider.

		// the login page does not require loggin
		state('login', {
			url: '/login?r',
			templateUrl: 'modules/account/views/login.html'
		}).	

		state('app.account', {
			url: '/account',
			templateUrl: 'modules/account/views/account.html',
			access: { requiredLogin: true }
		});
	}
]);