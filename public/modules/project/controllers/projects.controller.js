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
			var p = _.find($scope.projects, { 'id': project.id });
			if(p) angular.copy(project, p);
			else $scope.projects.push(project);
		});		
	}

	$scope.openProjectTasks = function(project){
		var createDialog = $modal.open({
			templateUrl: '/modules/project/views/projecttasksdialog.html',
			controller: 'ProjectTasksDialogController',
			resolve: {
				toUpdate: function () {
					return project;
				}
			}
		});	

		createDialog.result.then(function (project) {
			var p = _.find($scope.projects, { 'id': project.id });
			if(p) 
				angular.copy(project, p);
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
