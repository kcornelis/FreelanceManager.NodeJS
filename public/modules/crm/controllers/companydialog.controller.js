'use strict';

angular.module('crm').controller('CompanyDialogController',
function($scope, Company, toUpdate) {

	$scope.originalCompany = toUpdate;
	$scope.newCompany = toUpdate == undefined;
	toUpdate = toUpdate || { };
	$scope.company =  { name: toUpdate.name || '' };
	
	$scope.isBusy = false;
	$scope.message = '';

	$scope.ok = function () {
		showMessage('Saving company...');

		var id = $scope.newCompany ? {} : { id: $scope.originalCompany.id };

		Company.save(id, $scope.company,
			function(data) { 
				hideMessage();
				$scope.$close(data);
			},
			function(err) { 
				showMessage('An error occurred...'); 
			});
	};

	$scope.cancel = function () {
		$scope.$dismiss('cancel');
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
