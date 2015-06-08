(function() {
	'use strict';

	function accountInfoController($scope, $window, jwtHelper, Account) {

		var token = jwtHelper.decodeToken($window.localStorage.token);

		$scope.account = Account.get({ id: token.id });

		$scope.save = function () {
			Account.save(token.id, $scope.account);
		};
	}

	accountInfoController.$inject = ['$scope', '$window', 'jwtHelper', 'Account'];

	angular.module('account').controller('AccountInfoController', accountInfoController);

})();
