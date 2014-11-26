'use strict';

angular.module('project').controller('ProjectsController',
function($scope, $modal, Project) {

	$scope.getAllProjects = function() {
		$scope.projects = Project.query();
	};

	$scope.openProject = function(project){

		var createDialog = $modal.open({
			templateUrl: '/modules/project/views/projectdialog.html',
			controller: 'ProjectDialogController',
			resolve: {
				toUpdate: function () {
					return project;
				}
			}
		});

		createDialog.result.then(function (project) {
			var c = _.find($scope.projects, { 'id': project.id });
			if(c) angular.copy(project, c);
			else $scope.projects.push(project);
		});		
	}

	$scope.hideProject = function(project){
		Project.hide({ id: project.id }, function(){
			project.hidden = true;
		});
	}

	$scope.unhideProject = function(project){
		Project.unhide({ id: project.id }, function(){
			project.hidden = false;
		});
	}
});
