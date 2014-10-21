'use strict';

angular.module('project').controller('ProjectDialogController',
function($scope, Project, Company, toUpdate) {

	$scope.originalProject = toUpdate;
	$scope.newProject = toUpdate == undefined;
	toUpdate = toUpdate || { };
	$scope.project =  { 
		companyId: toUpdate.companyId || '',
		name: toUpdate.name || '',
		description: toUpdate.description || '' 
	};
	
	$scope.isBusy = false;
	$scope.message = '';
	$scope.companies = Company.query();

	$scope.ok = function () {
		showMessage('Saving project...');

		var id = $scope.newProject ? {} : { id: $scope.originalProject.id };

		Project.save(id, $scope.project,
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
