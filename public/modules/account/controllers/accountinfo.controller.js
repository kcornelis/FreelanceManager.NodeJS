angular.module('account').controller('AccountInfoController', ['$scope', '$window', 'jwtHelper', 'Account',
function($scope, $window, jwtHelper, Account) {
	'use strict';

	var token = jwtHelper.decodeToken($window.sessionStorage.token);

	Account.get({ id: token.id }).$promise.then(function(response){
		$scope.account = response;
	});

	$scope.save = function () {
		Account.save(token.id, $scope.account);
	};

}]);