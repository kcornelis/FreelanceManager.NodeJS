(function() {
	'use strict';

	function accountPasswordController($scope, $window, jwtHelper, Account) {

		var token = jwtHelper.decodeToken($window.localStorage.token);

		$scope.oldPassword = '';
		$scope.newPassword = '';
		$scope.newPasswordConfirm = '';

		$scope.save = function () {
			$scope.isSaving = true;
			$scope.hasError = false;

			Account.changePassword({ id: token.id }, { oldPassword: $scope.oldPassword, newPassword: $scope.newPassword },
				function(){
					$scope.isSaving = false;

					$scope.oldPassword = '';
					$scope.newPassword = '';
					$scope.newPasswordConfirm = '';

					$scope.accountPasswordForm.$setPristine();
				},
				function(err){
					$scope.isSaving = false;
					$scope.hasError = true;
				});
		};
	}

	accountPasswordController.$inject = ['$scope', '$window', 'jwtHelper', 'Account'];

	angular.module('account').controller('AccountPasswordController', accountPasswordController);

})();
