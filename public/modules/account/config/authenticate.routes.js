angular.module('account').config(['$stateProvider',
	function($stateProvider) {
		'use strict';

		$stateProvider.

		// the login page does not require loggin
		state('login', {
			url: '/login',
			templateUrl: 'modules/account/views/login.html'
		}).	

		state('app.account', {
			url: '/account',
			templateUrl: 'modules/account/views/account.html',
			resolve: ApplicationConfiguration.resolve('parsley'),
			access: { requiredLogin: true }
		});
	}
]);