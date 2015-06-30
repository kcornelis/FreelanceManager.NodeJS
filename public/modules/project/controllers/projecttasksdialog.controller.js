(function() {
	'use strict';

	function controller($scope, Project, toUpdate) {

		$scope.originalProject = toUpdate;
		toUpdate = toUpdate || { };
		$scope.project =  { 
			tasks: _.map(toUpdate.tasks, function(t) {
				return {
					name: t.name,
					defaultRateInCents: t.defaultRateInCents,
					defaultRate: t.defaultRateInCents ? (t.defaultRateInCents) / 100 : t.defaultRateInCents
				};
			})
		};

		$scope.$watch('project.tasks', function(tasks) {
			_.forEach(tasks, function(task) {
				task.defaultRateInCents = Math.round(task.defaultRate * 100);
			});
		}, true);
		
		$scope.isBusy = false;
		$scope.message = '';

		$scope.ok = function () {
			showMessage('Saving project...');

			Project.changetasks({ id: $scope.originalProject.id }, $scope.project.tasks,
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
	}

	controller.$inject = ['$scope', 'Project', 'toUpdate'];

	angular.module('fmProject').controller('ProjectTasksDialogController', controller);
})();
