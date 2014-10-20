'use strict';

angular.module('project').controller('ProjectDialogController',
function($scope, Project, toUpdate) {

	$scope.originalProject = toUpdate;
	$scope.newProject = toUpdate == undefined;
	toUpdate = toUpdate || { };
	$scope.project =  { 
		name: toUpdate.name || '',
		description: toUpdate.description || '' 
	};
	
	$scope.isBusy = false;
	$scope.message = '';

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
