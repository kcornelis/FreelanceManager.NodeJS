'use strict';

angular.module('config').controller('ClientDialogController',
function($scope, $http, $modalInstance, client) {

	$scope.originalClient = client;
	$scope.newClient = client == undefined;
	client = client || { };
	$scope.client =  { name: client.name || '' };
	
	$scope.isBusy = false;
	$scope.message = '';

	$scope.ok = function () {
		showMessage('Saving client...');

		if($scope.newClient) {
			$http.post('/api/write/clients/create', $scope.client)
				.success(function (data, status, headers, config) {
					hideMessage();
					$modalInstance.close();
				})
				.error(function (data, status, headers, config) {
					showMessage('An error occurred...');
				});	
		}
		else {
			$http.post('/api/write/clients/update/' + $scope.originalClient.aggregateRootId, $scope.client)
				.success(function (data, status, headers, config) {
					hideMessage();
					$modalInstance.close();
				})
				.error(function (data, status, headers, config) {
					showMessage('An error occurred...');
				});	
		}
	};

	$scope.cancel = function () {
		$modalInstance.dismiss('cancel');
	};

	function showMessage(message) {
		$scope.isBusy = true;
		$scope.message = message;
	}

	function hideMessage() {
		$scope.isBusy = false;
		$scope.message = '';
	}
});
