'use strict';

angular.module('config').controller('CreateClientController',
function($scope, $http, $modalInstance) {

	$scope.client = { name: '' };
	$scope.isBusy = false;
	$scope.message = '';

	$scope.ok = function () {
		$scope.isBusy = true;
		$scope.message = 'Saving client...';
		$http.post('/api/write/clients/create', $scope.client)
			.success(function (data, status, headers, config) {
				$modalInstance.close();
			})
			.error(function (data, status, headers, config) {
				$scope.isBusy = false;
				$scope.message = status;
			});	
	};

	$scope.cancel = function () {
		$modalInstance.dismiss('cancel');
	};
});
