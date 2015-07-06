(function() {
	'use strict';

	function accountPasswordController($scope, $window, jwtHelper, Account) {

		var token = jwtHelper.decodeToken($window.localStorage.token);

		$scope.password = {
			old: '',
			new: '',
			confirm: ''
		};

		$scope.save = function () {
			$scope.isSaving = true;
			$scope.hasError = false;

			Account.changePassword({ id: token.id }, { oldPassword: $scope.password.old, newPassword: $scope.password.new },
				function() {

					$scope.isSaving = false;

					$scope.password.old = '';
					$scope.password.new = '';
					$scope.password.confirm = '';

					$scope.accountPasswordForm.$setPristine();
				},
				function(err) {

					$scope.isSaving = false;
					$scope.hasError = true;
				});
		};
	}

	accountPasswordController.$inject = ['$scope', '$window', 'jwtHelper', 'Account'];

	angular.module('fmAccount').controller('AccountPasswordController', accountPasswordController);

})();
