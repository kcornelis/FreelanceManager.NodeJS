(function() {
	'use strict';

	function controller($scope, $state, $stateParams, $modal, $sce, Project, TimeRegistration, Template, Invoice) {

		// Wizard helpers
		// **************
		var steps;

		function createsteps(q) {
			steps = [];
			for(var i = 1; i <= q; i++) steps[i] = false;
		}

		function activate(step) {
			for(var i in steps) {
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

		Project.query(function(projects) {
			$scope.projects = _.sortByAll(projects, ['company.name', 'name']);
		});

		$scope.templates = Template.active();	

		// WIZART STEP 1 (time registrations)
		// **********************************
		
		$scope.search = {
			project: null,
			from: null,
			to: null,
			invoiced: false,
			billable: true
		};

		$scope.searchTimeRegistrations = function() {
			$scope.loading = true;
			$scope.includeAllTimeRegistrations = false;

			TimeRegistration.search(
			{ 
				project: $scope.search.project, 
				from: $scope.search.from ? moment($scope.search.from, 'YYYY-MM-DD').format('YYYYMMDD') : null,
				to: $scope.search.to ? moment($scope.search.to, 'YYYY-MM-DD').format('YYYYMMDD')  : null,
				invoiced: $scope.search.invoiced,
				billable: $scope.search.billable
			}, 
			function(tr) {

				$scope.loading = false;
				$scope.searched = true;
				$scope.timeRegistrations = _.sortByAll(tr, ['date.numeric', 'from.numeric']);
			});
		};

		$scope.$watch('includeAllTimeRegistrations', function(v) {
			if($scope.timeRegistrations) {
				_.forEach($scope.timeRegistrations, function(tr) {
					tr.included = v;
				});
			}
		});

		// WIZART STEP 2 (invoice lines)
		// *****************************

		$scope.invoice = { customer: { address: { } } };

		$scope.canGoto2 = function() {
			return _.some($scope.timeRegistrations, { included: true });
		};	

		$scope.gobackto2 = function() {
			activate(2);
		};

		$scope.goto2 = function() {

			$scope.invoice.linkedTimeRegistrationIds = _.map(_.where($scope.timeRegistrations, { included: true }), function(tr) { return tr.id; });
			
			$scope.invoice.lines = _.map(_.groupBy(_.where($scope.timeRegistrations, { included: true }), 
				function(tr) {
					return tr.projectId + '-' + tr.task;
				}),
				function(tr) {
					var totalMinutes = _.reduce(_.map(tr, 'totalMinutes'), function(sum, i) { return sum + i; });
					var quantity = Math.round((totalMinutes / 60) * 100) / 100;
					var project = _.find($scope.projects, 'id',  tr[0].projectId);
					var task = project ? _.find(project.tasks, 'name', tr[0].task) : null;
					var priceInCents = task ? parseInt(task.defaultRateInCents) : 0;

					return {
						description: project.name + ' - ' + task.name,
						quantity: quantity,
						vatPercentage: 21,
						price: priceInCents / 100,
						priceInCents: priceInCents
					};
				}, 0);

			activate(2);
		};

		$scope.removeInvoiceLine = function(invoiceLine) {
			_.remove($scope.invoice.lines, invoiceLine);
		};

		$scope.addInvoiceLine = function() {
			$scope.invoice.lines.push({
				description: '',
				quantity: 1,
				vatPercentage: 21,
				price: 0,
				priceInCents: 0			
			});
		};	

		$scope.$watch('invoice.lines', function(lines) {
			_.forEach(lines, function(line) {
				line.priceInCents = Math.round(line.price * 100);
				line.totalInCents = Math.round(line.quantity * line.priceInCents);
				line.total = line.totalInCents / 100;
			});
		}, true);

		// WIZART STEP 3 (invoice info)
		// ****************************

		$scope.goto3 = function() {

			activate(3);
		};

		$scope.gobackto3 = function() {
			activate(3);
		};

		$scope.$watch('invoice.templateId', function(id) {
			var template = _.find($scope.templates, 'id', id);
			$scope.invoice.template = template ? template.content : '';
		});

		$scope.$watch('invoice.displayDate', function(date) {
			if(date) {
				$scope.invoice.displayCreditTerm = moment(date, 'YYYY-MM-DD').add(30, 'day').format('YYYY-MM-DD');
				$scope.invoice.date = moment(date, 'YYYY-MM-DD').format('YYYYMMDD');
			}
			else { 
				$scope.invoice.displayCreditTerm = null; 
				$scope.invoice.date = null;
			}
		});

		$scope.$watch('invoice.displayCreditTerm', function(date) {
			if(date) {
				$scope.invoice.creditTerm = moment(date, 'YYYY-MM-DD').format('YYYYMMDD');
			}
			else{ 
				$scope.invoice.creditTerm = null;
			}
		});

		$scope.searchCustomer = function() {
			var searchDialog = $modal.open({
				templateUrl: '/modules/crm/views/searchcompany.html',
				controller: 'SearchCompanyDialogController'
			});

			searchDialog.result.then(function (company) {
				if(company) {
					$scope.invoice.customer.name = company.name;
					$scope.invoice.customer.vatNumber = company.vatNumber;
					$scope.invoice.customer.number = company.number;
					$scope.invoice.customer.address.line1 = company.address.line1;
					$scope.invoice.customer.address.line2 = company.address.line2;
					$scope.invoice.customer.address.postalcode = company.address.postalcode;
					$scope.invoice.customer.address.city = company.address.city;
				}
			});	
		};

		// WIZART STEP 4 (preview)
		// ***********************

		$scope.goto4 = function() {

			$scope.loading = true;

			Invoice.preview($scope.invoice, function(invoice) {
				$scope.invoicePreview = invoice;
				$scope.loading = false;
				$scope.previewUrl = $sce.trustAsResourceUrl('/render/#!/invoicepreview?invoice=' + window.encodeURIComponent(JSON.stringify(invoice)));
			});

			activate(4);
		};

		$scope.create = function() {

			Invoice.save($scope.invoice, function() {
				$state.go('app.invoice_overview');
			});
		};
	}

	controller.$inject = ['$scope', '$state', '$stateParams', '$modal', '$sce', 'Project', 'TimeRegistration', 'Template', 'Invoice'];

	angular.module('fmInvoice').controller('CreateInvoiceController', controller);
})();
