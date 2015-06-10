(function() {
	'use strict';

	function controller($scope, $modal, Project) {

		$scope.getAllProjects = function() {
			Project.query(function(projects) {
					$scope.projects = _.sortByAll(projects, ['company.name', 'name']);
			});
		};

		$scope.openProject = function(project){

			var createDialog = $modal.open({
				templateUrl: '/modules/project/views/editproject.html',
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
		};

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
		};

		$scope.hideProject = function(project){
			Project.hide({ id: project.id }, function(){
				project.hidden = true;
			});
		};

		$scope.unhideProject = function(project){
			Project.unhide({ id: project.id }, function(){
				project.hidden = false;
			});
		};
	}

	controller.$inject = ['$scope', '$modal', 'Project'];

	angular.module('project').controller('ProjectsController', controller);
})();
