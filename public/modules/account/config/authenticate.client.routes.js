'use strict';

angular.module('account').config(['$stateProvider',
	function($stateProvider) {
		$stateProvider.
		state('login', {
			url: '/login',
			templateUrl: 'modules/account/views/login.client.view.html'
		});
	}
]);