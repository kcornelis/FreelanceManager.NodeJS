// TODO unit test
angular.module('invoice').controller('CreateController',
function($scope, $state, $stateParams, Project, TimeRegistration, Template, Invoice) {
	'use strict';

	// Wizard helpers
	// **************
	var steps;

	function createsteps(q) {
		steps = [];
		for(var i = 1; i <= q; i++) steps[i] = false;
	}

	function activate(step){
		for(var i in steps){
			steps[i] = false;
		}
		steps[step] = true;
	}

	$scope.init = function() {
		createsteps(4);
		activate(1);
	};

	$scope.active = function(step) {
		return !!steps[step];
	};

	// Prefetch data
	// **************

	Project.query(function(projects){
		$scope.projects = _.sortBy(projects, ['company.name', 'name']);
	});

	$scope.templates = Template.active();	

	// WIZART STEP 1 (time registrations)
	// **********************************
	
	$scope.search = {
		project: null,
		from: null,
		to: null,
		invoiced: false
	};

	$scope.searchTimeRegistrations = function(){
		$scope.loading = true;
		$scope.includeAllTimeRegistrations = false;

		TimeRegistration.search(
		{ 
			project: $scope.search.project, 
			from: $scope.search.from ? moment($scope.search.from, 'YYYY-MM-DD').format('YYYYMMDD') : null,
			to: $scope.search.to ? moment($scope.search.to, 'YYYY-MM-DD').format('YYYYMMDD')  : null,
			invoiced: $scope.search.invoiced
		}, 
		function(tr){

			$scope.loading = false;
			$scope.searched = true;
			$scope.timeRegistrations = _.sortBy(tr, ['data.numeric', 'from.numeric']);
		});
	};

	$scope.$watch('includeAllTimeRegistrations', function(v){
		if($scope.timeRegistrations){
			_.forEach($scope.timeRegistrations, function(tr){
				tr.included = v;
			});
		}
	});

	// WIZART STEP 2 (invoice lines)
	// *****************************

	$scope.invoice = {};

	$scope.canGoto2 = function(){
		return _.some($scope.timeRegistrations, { included: true });
	};		

	$scope.goto2 = function(){

		$scope.invoice.linkedTimeRegistrationIds = _.map($scope.timeRegistrations, function(tr){ return tr.id; });
		
		$scope.invoice.lines = _.map(_.groupBy(_.where($scope.timeRegistrations, { included: true }), 
			function(tr){
				return tr.projectId + '-' + tr.task;
			}),
			function(tr){
				var totalMinutes = _.reduce(_.map(tr, 'totalMinutes'), function(sum, i){ return sum + i.totalMinutes; });
				var quantity = Math.round((totalMinutes / 60) * 100) / 100;
				var project = _.first(_.where($scope.projects, function (p) { return p.id === tr[0].projectId; }));
				var task = project ? _.first(_.where(project.tasks, function(t) { return t.name === tr[0].task; })) : null;
				var priceInCents = task ? parseInt(task.defaultRateInCents) : 0;

				return { 
					description: project.name,
					quantity: quantity,
					vatPercentage: 21,
					price: priceInCents / 100,
					priceInCents: priceInCents
				};
			}, 0);

		activate(2);
	};	

	$scope.$watch('invoice.lines', function(lines) {
		_.forEach(lines, function(line){
			line.priceInCents = Math.round(line.price * 100);
			line.totalInCents = Math.round(line.quantity * line.priceInCents);
			line.total = line.totalInCents / 100;
		});
	}, true);

	// WIZART STEP 3 (invoice info)
	// ****************************

	$scope.goto3 = function(){

		activate(3);
	};

	$scope.$watch('invoice.templateId', function(id){
		var template = _.first(_.where($scope.templates, function(t) { return t.id === id; }));
		$scope.invoice.template = template ? template.content : '';
	});

	$scope.$watch('invoice.date', function(date) {
		if(date)
			$scope.invoice.creditTerm = moment(date, 'YYYY-MM-DD').add(30, 'day').format('YYYY-MM-DD');
		else $scope.invoice.creditTerm = null;
	});

	// WIZART STEP 4 (preview)
	// ***********************

	$scope.goto4 = function(){

		$scope.loading = true;

		Invoice.save($scope.invoice, function(invoice){
			$scope.invoicePreview = invoice;
			$scope.loading = false;
		});

		activate(4);
	};

	$scope.create = function(){

		Invoice.save($scope.invoice);
	};
});
