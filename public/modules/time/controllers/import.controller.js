// TODO unit test
angular.module('time').controller('ImportController',
function($scope, $state, XLSXReader, NgTableParams, $filter, Project, TimeRegistration) {
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

	// Preload data
	// ************
	Project.active(function(projects){
		var tasks = [];
		var id = 0;
		_.forEach(projects, function(p){
			_.forEach(p.tasks, function(t){
				tasks.push({
					project: p,
					task: t,
					display: p.name + ' - ' + t.name,
					id: id++
				});
			});
		});
		$scope.tasks = tasks;
	});

	// step 1 (file selection)
	// ***********************

	$scope.fileChanged = function(files) {

		$scope.excelSheets = [];
		$scope.excelFile = files[0];

		XLSXReader.readFile($scope.excelFile, $scope.showPreview).then(function(xlsxData) {
			$scope.excelSheets = xlsxData;
			activate(2);
		});
	};

	// step 2 (sheet selection)
	// ***********************

	$scope.selectedSheetName = undefined;
	$scope.selectedSheet = undefined;

	$scope.goto3 = function(){
		
		$scope.selectedSheet = $scope.excelSheets[$scope.selectedSheetName];

		var selectedSheetHeader = [];
		for(var i = 0; i < $scope.selectedSheet.header.length; i++){
			selectedSheetHeader.push({ key: i, value: $scope.selectedSheet.header[i] });
		}
		$scope.selectedSheetHeader = selectedSheetHeader;

		activate(3);
	};

	$scope.canGoto3 = function(){
		return $scope.selectedSheetName !== null;
	};

	// step 3 (column selection)
	// ***********************	

	$scope.goto4 = function(){

		$scope.groupedRows = _.groupBy($scope.selectedSheet.data, function(r){
			return r[$scope.selectedProjectColumn] + ' - ' + r[$scope.selectedTaskColumn];
		});

		$scope.projectsInExcelSheet = _.map($scope.groupedRows, function(g){
			return {
				project: g[0][$scope.selectedProjectColumn],
				task: g[0][$scope.selectedTaskColumn],
				display: g[0][$scope.selectedProjectColumn] + ' - ' + g[0][$scope.selectedTaskColumn]
			};
		});

		activate(4);
	};

	$scope.canGoto4 = function(){
		return $scope.selectedProjectColumn !== null &&
			$scope.selectedTaskColumn !== null && 
			$scope.selectedDateColumn !== null &&
			$scope.selectedFromColumn !== null && 
			$scope.selectedToColumn !== null && 
			$scope.selectedDescriptionColumn !== null;
	};

	// step 4 (project mapping)
	// ***********************	

	$scope.goto5 = function(){
		activate(5);
	};

	$scope.canGoto5 = function(){
		return _.every($scope.projectsInExcelSheet, function(p) {
			return p.mappedProjectAndTask !== null;
		});
	};

	// step 5 (saving)
	// ***********************	

	$scope.importing = false;

	$scope.import = function(){

		var registrations = [];
		$scope.importing = true;

		_.forEach($scope.groupedRows, function(groupedRow){

			var selectedProjectTask = _.first(_.where($scope.projectsInExcelSheet, function(p){
				return p.project === groupedRow[0][$scope.selectedProjectColumn] && p.task === groupedRow[0][$scope.selectedTaskColumn];
			})).mappedProjectAndTask;

			var project = $scope.tasks[selectedProjectTask].project;
			var task = $scope.tasks[selectedProjectTask].task;

			_.forEach(groupedRow, function(row){

				registrations.push({
					companyId: project.companyId,
					projectId: project.id,
					task: task.name,
					description: row[$scope.selectedDescriptionColumn],
					date: convertDisplayDateToNumeric(row[$scope.selectedDateColumn]),
					from: convertDisplayTimeToNumeric(row[$scope.selectedFromColumn]),
					to: convertDisplayTimeToNumeric(row[$scope.selectedToColumn])
				});
			});
		});

		TimeRegistration.saveMultiple(registrations, function(data){
			$scope.importing = false;
			$scope.timeRegistrationsImported = data;
			$scope.summaryTableParams.count(10);
			activate(6);
		}, function(err){
			$scope.importing = false;
		});
	};
	
	function convertDisplayDateToNumeric(date){
		return parseInt(date.replace(/-/g, ''), 10);
	}

	function convertDisplayTimeToNumeric(time){
		return parseInt(time.replace(':', ''), 10);
	}



	// step 6 (summary)
	// ***********************	

	$scope.summaryTableParams = new NgTableParams({
		page: 1,
		count: 1
	}, 
	{
		getData: function ($defer, params) {
			if(!$scope.timeRegistrationsImported)
				return;

			// use build-in angular filter
			var filteredData = params.filter() ? $filter('filter')($scope.timeRegistrationsImported, params.filter()) : $scope.timeRegistrationsImported;
			var orderedData = params.sorting() ? $filter('orderBy')(filteredData, params.orderBy()) : $scope.timeRegistrationsImported;

			params.total(orderedData.length); // set total for recalc pagination
			$defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
		}
	});
});
