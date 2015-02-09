angular.module('account').controller('AccountInfoController', ['$scope', '$window', 'jwtHelper', 'Account',
function($scope, $window, jwtHelper, Account) {
	'use strict';

	var token = jwtHelper.decodeToken($window.localStorage.token);

	$scope.account = Account.get({ id: token.id });

	$scope.save = function () {
		Account.save(token.id, $scope.account);
	};

}]);