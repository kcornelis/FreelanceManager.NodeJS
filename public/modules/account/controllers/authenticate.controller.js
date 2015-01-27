angular.module('account').controller('AuthenticateController', 
function ($scope, $http, $window, $location) {
	'use strict';

	$scope.user = { email: '', password: '' };
	$scope.error = '';
	
	$scope.submit = function () {
		$http.post('/security/authenticate', $scope.user)
			.success(function (data, status, headers, config) {
				$window.sessionStorage.token = data.token;
				$location.path('/');
			})
			.error(function (data, status, headers, config) {
				// Erase the token if the user fails to log in
				delete $window.sessionStorage.token;

				// Handle login errors here
				$scope.error = 'Invalid email or password';
			});
	};
});