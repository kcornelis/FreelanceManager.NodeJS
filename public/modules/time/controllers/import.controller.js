(function() {
	'use strict';

	function controller($scope, $state, XLSXReader, NgTableParams, $filter, Project, TimeRegistration) {

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

		function isvalid(value) {
			return value !== undefined && value !== null;
		}

		$scope.init = function() {
			createsteps(6);
			activate(1);
		};

		$scope.active = function(step) {
			return !!steps[step];
		};

		// Preload data
		// ************
		Project.active(function(projects) {
			var tasks = [];
			var id = 0;
			_.forEach(projects, function(p) {
				_.forEach(p.tasks, function(t) {
					tasks.push({
						project: p,
						company: p.company,
						task: t,
						display: p.company.name + ' - ' + p.name + ' - ' + t.name,
						id: id++
					});
				});
			});
			$scope.tasks = _.sortBy(tasks, 'display');
		});

		// step 1 (file selection)
		// ***********************

		$scope.fileChanged = function(files) {

			$scope.excel.sheets = [];
			$scope.excelFile = files[0];

			XLSXReader.readFile($scope.excelFile, false).then(function(xlsxData) {
				$scope.excel.sheets = xlsxData;
				activate(2);
			});
		};

		// step 2 (sheet selection)
		// ***********************

		$scope.excel = {};
		$scope.excel.selectedSheetName = undefined;
		$scope.excel.selectedSheet = undefined;

		$scope.goto3 = function() {
			
			$scope.excel.selectedSheet = $scope.excel.sheets[$scope.excel.selectedSheetName];

			var selectedSheetHeader = [];
			for(var i = 0; i < $scope.excel.selectedSheet.header.length; i++) {
				selectedSheetHeader.push({ key: i, value: $scope.excel.selectedSheet.header[i] });
			}
			$scope.excel.selectedSheetHeader = selectedSheetHeader;

			activate(3);
		};

		$scope.canGoto3 = function() {
			return isvalid($scope.excel.selectedSheetName);
		};

		// step 3 (column selection)
		// ***********************	

		$scope.goto4 = function() {

			$scope.excel.groupedRows = _.groupBy($scope.excel.selectedSheet.data, function(r) {
				return r[$scope.excel.selectedProjectColumn] + ' - ' + r[$scope.excel.selectedTaskColumn];
			});

			$scope.excel.projectsInSheet = _.map($scope.excel.groupedRows, function(g) {
				return {
					project: g[0][$scope.excel.selectedProjectColumn],
					task: g[0][$scope.excel.selectedTaskColumn],
					display: g[0][$scope.excel.selectedProjectColumn] + ' - ' + g[0][$scope.excel.selectedTaskColumn]
				};
			});

			activate(4);
		};

		$scope.canGoto4 = function() {
			return isvalid($scope.excel.selectedProjectColumn) &&
				isvalid($scope.excel.selectedTaskColumn) && 
				isvalid($scope.excel.selectedDateColumn) &&
				isvalid($scope.excel.selectedFromColumn) && 
				isvalid($scope.excel.selectedToColumn) && 
				isvalid($scope.excel.selectedDescriptionColumn);
		};

		// step 4 (project mapping)
		// ***********************	

		$scope.goto5 = function() {
			activate(5);
		};

		$scope.canGoto5 = function() {
			return _.every($scope.excel.projectsInSheet, function(p) {
				return isvalid(p.mappedProjectAndTask);
			});
		};

		// step 5 (saving)
		// ***********************	

		$scope.importing = false;

		$scope.import = function() {

			var registrations = [];
			$scope.importing = true;

			_.forEach($scope.excel.groupedRows, function(groupedRow) {

				var selectedProjectTask = _.find($scope.excel.projectsInSheet, function(p) {
					return p.project === groupedRow[0][$scope.excel.selectedProjectColumn] && p.task === groupedRow[0][$scope.excel.selectedTaskColumn];
				}).mappedProjectAndTask;

				var project = _.find($scope.tasks, { id: selectedProjectTask }).project;
				var task = _.find($scope.tasks, { id: selectedProjectTask }).task;

				_.forEach(groupedRow, function(row) {

					registrations.push({
						companyId: project.companyId,
						projectId: project.id,
						task: task.name,
						description: row[$scope.excel.selectedDescriptionColumn],
						date: convertDisplayDateToNumeric(row[$scope.excel.selectedDateColumn]),
						from: convertDisplayTimeToNumeric(row[$scope.excel.selectedFromColumn]),
						to: convertDisplayTimeToNumeric(row[$scope.excel.selectedToColumn]),
						billable: task.billable
					});
				});
			});

			TimeRegistration.saveMultiple(registrations, function(data) {
				$scope.importing = false;
				$scope.timeRegistrationsImported = data;
				$scope.summaryTableParams.count(10); // the number of items to show per page
				activate(6);
			}, function(err) {
				$scope.importing = false;
			});
		};
		
		function convertDisplayDateToNumeric(date) {
			return parseInt(date.replace(/-/g, ''), 10);
		}

		function convertDisplayTimeToNumeric(time) {
			return parseInt(time.replace(':', ''), 10);
		}



		// step 6 (summary)
		// ***********************	


		$scope.filterImportedTimeRegistrations = function ($defer, params) {

			if(!$scope.timeRegistrationsImported)
				return;

			// use build-in angular filter
			var filteredData = params.filter() ? $filter('filter')($scope.timeRegistrationsImported, params.filter()) : $scope.timeRegistrationsImported;
			var orderedData = params.sorting() ? $filter('orderBy')(filteredData, params.orderBy()) : filteredData;

			params.total(orderedData.length); // set total for recalc pagination
			$defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
		};

		$scope.summaryTableParams = new NgTableParams({
			page: 1,
			count: 1
		}, 
		{
			getData: $scope.filterImportedTimeRegistrations
		});
	}

	controller.$inject = ['$scope', '$state', 'XLSXReader', 'NgTableParams', '$filter', 'Project', 'TimeRegistration'];

	angular.module('fmTime').controller('TimeRegistrationImportController', controller);
})();
