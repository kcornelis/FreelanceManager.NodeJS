(function() {
	'use strict';

	function accountInfoController($scope, $window, jwtHelper, Account) {

		var token = jwtHelper.decodeToken($window.localStorage.token);

		$scope.account = Account.get({ id: token.id });

		$scope.save = function () {
			$scope.isSaving = true;

			Account.save(token.id, $scope.account, function() {
				$scope.isSaving = false;
			}, 
			function(err) {
				$scope.isSaving = false;
			});
		};
	}

	accountInfoController.$inject = ['$scope', '$window', 'jwtHelper', 'Account'];

	angular.module('fmAccount').controller('AccountInfoController', accountInfoController);

})();
