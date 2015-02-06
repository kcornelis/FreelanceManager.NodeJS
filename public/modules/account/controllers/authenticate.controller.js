angular.module('account').controller('AuthenticateController', ['$rootScope', '$scope', '$http', '$window', '$location', 'jwtHelper',
function ($rootScope, $scope, $http, $window, $location, jwtHelper) {
	'use strict';

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
				$location.path('/');
			})
			.error(function (data, status, headers, config) {
				
				// Erase the token if the user fails to log in
				delete $window.localStorage.token;
				delete $window.localStorage.user;

				// Handle login errors here
				$scope.error = 'Invalid email or password';
			});
	};
}]);