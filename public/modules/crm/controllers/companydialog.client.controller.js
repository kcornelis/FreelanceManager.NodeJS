'use strict';

angular.module('crm').controller('CompanyDialogController',
function($scope, $http, $modalInstance, company) {

	$scope.originalCompany = company;
	$scope.newCompany = company == undefined;
	company = company || { };
	$scope.company =  { name: company.name || '' };
	
	$scope.isBusy = false;
	$scope.message = '';

	$scope.ok = function () {
		showMessage('Saving company...');

		if($scope.newCompany) {
			$http.post('/api/public/company/create', $scope.company)
				.success(function (data, status, headers, config) {
					hideMessage();
					$modalInstance.close(data);
				})
				.error(function (data, status, headers, config) {
					showMessage('An error occurred...');
				});	
		}
		else {
			$http.post('/api/public/company/update/' + $scope.originalCompany.id, $scope.company)
				.success(function (data, status, headers, config) {
					hideMessage();
					$modalInstance.close(data);
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
