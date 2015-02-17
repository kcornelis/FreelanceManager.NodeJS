angular.module('account').controller('AccountPasswordController', ['$scope', '$window', 'jwtHelper', 'Account',
function($scope, $window, jwtHelper, Account) {
	'use strict';

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
}]);