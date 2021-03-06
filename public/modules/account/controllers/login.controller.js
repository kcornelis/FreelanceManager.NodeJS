(function() {
	'use strict';

	function loginController($rootScope, $scope, $http, $window, $stateParams, $location, jwtHelper) {

		delete $window.localStorage.token;
		delete $window.localStorage.user;

		$scope.user = { email: '', password: '' };
		$scope.error = '';
		
		$scope.submit = function () {
			$http.post('/security/authenticate', $scope.user)
				.success(function (data, status, headers, config) {

					var decrypted = jwtHelper.decodeToken(data.token);
					$window.localStorage.user = decrypted.fullName;

					$window.localStorage.token = data.token;
					$location.path($stateParams.r ? decodeURIComponent($stateParams.r) : '/').search({ }); // TODO unit test
				})
				.error(function (data, status, headers, config) {
					
					// Erase the token if the user fails to log in
					delete $window.localStorage.token;
					delete $window.localStorage.user;

					// Handle login errors here
					$scope.error = 'Invalid email or password';
					$scope.user.password = '';
				});
		};
	}

	loginController.$inject = ['$rootScope', '$scope', '$http', '$window', '$stateParams', '$location', 'jwtHelper'];

	angular.module('fmAccount').controller('AccountLoginController', loginController);
})();
