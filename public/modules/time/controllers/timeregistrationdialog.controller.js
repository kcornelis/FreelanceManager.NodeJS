'use strict';

angular.module('time').controller('TimeRegistrationDialogController',
function($scope, Project, TimeRegistration, toUpdate, date) {

	$scope.originalTimeRegistration = toUpdate;
	$scope.newTimeRegistration = toUpdate == undefined;
	toUpdate = toUpdate || { };
	$scope.timeRegistration =  { 
		company: null,
		project: null,
		task: null,
		description: toUpdate.description || '',
		from: toUpdate.from ? convertNumericTimeToDisplay(toUpdate.from.numeric) : '',
		to: toUpdate.to ? convertNumericTimeToDisplay(toUpdate.to.numeric) : '',
	};
	
	$scope.isBusy = false;
	$scope.message = '';

	// load all projects and convert them to companies => projects => tasks
	$scope.projects = Project.active(function(){
		$scope.companies = _.map(
			_.groupBy($scope.projects, function(p) { return p.companyId; }),
			function(g) { 
				return { 
					id: g[0].companyId, 
					name: g[0].company.name,
					projects: g
				}; 
			});	

		if(toUpdate.companyId)
			$scope.timeRegistration.company = _.first(_.where($scope.companies, { id: toUpdate.companyId }));
		
		if(toUpdate.projectId && $scope.timeRegistration.company)
			$scope.timeRegistration.project = _.first(_.where($scope.timeRegistration.company.projects, { id: toUpdate.projectId }));

		if(toUpdate.task && $scope.timeRegistration.project)
			$scope.timeRegistration.task = _.first(_.where($scope.timeRegistration.project.tasks, { name: toUpdate.task }));
	});

	$scope.ok = function () {
		showMessage('Saving time registration...');

		var id = $scope.newTimeRegistration ? {} : { id: $scope.originalTimeRegistration.id };

		TimeRegistration.save(id, 
		{
			companyId: $scope.timeRegistration.company.id,
			projectId: $scope.timeRegistration.project.id,
			task: $scope.timeRegistration.task.name,
			description: $scope.timeRegistration.description,
			date: date,
			from: convertDisplayTimeToNumeric($scope.timeRegistration.from),
			to: convertDisplayTimeToNumeric($scope.timeRegistration.to)
		},
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

	function convertNumericTimeToDisplay(time){
		var hour = Math.floor(time / 100);
		var minutes = Math.floor(time - (hour * 100));
		return ('00' + hour).slice(-2) + ':' + ('00' + minutes).slice(-2);
	}

	function convertDisplayTimeToNumeric(time){
		return parseInt(time.replace(':', ''), 10);
	}
});