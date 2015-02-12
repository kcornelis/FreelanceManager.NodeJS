angular.module('time').controller('TimeRegistrationDialogController',
function($scope, Project, TimeRegistration, toUpdate, date) {
	'use strict';

	function convertNumericTimeToDisplay(time){
		var hour = Math.floor(time / 100);
		var minutes = Math.floor(time - (hour * 100));
		return ('00' + hour).slice(-2) + ':' + ('00' + minutes).slice(-2);
	}

	$scope.originalTimeRegistration = toUpdate;
	$scope.newTimeRegistration = toUpdate === undefined;
	toUpdate = toUpdate || { };
	$scope.timeRegistration =  { 
		company: null,
		project: null,
		task: null,
		billable: toUpdate.billable || false,
		description: toUpdate.description || '',
		from: toUpdate.from ? convertNumericTimeToDisplay(toUpdate.from.numeric) : '',
		to: toUpdate.to ? convertNumericTimeToDisplay(toUpdate.to.numeric) : '',
	};

	$scope.$watch('timeRegistration.company', function (newv, oldv) {
		if(oldv && newv && oldv.id !== newv.id){
			$scope.timeRegistration.project = null;
			$scope.timeRegistration.task = null;
		}
	});

	$scope.$watch('timeRegistration.project', function (newv, oldv) {
		if(oldv && newv && oldv.id !== newv.id){
			$scope.timeRegistration.task = null;	
		}
	});

	$scope.$watch('timeRegistration.task', function () {
		if($scope.newTimeRegistration && $scope.timeRegistration.task){
			$scope.timeRegistration.billable = $scope.timeRegistration.task.defaultRateInCents > 0;
		}
	});		
	
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
			billable: $scope.timeRegistration.billable,
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

	function convertDisplayTimeToNumeric(time){
		return parseInt(time.replace(':', ''), 10);
	}
});
