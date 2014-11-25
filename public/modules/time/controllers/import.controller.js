'use strict';

// TODO unit test

angular.module('time').controller('ImportController',
function($scope, XLSXReader, Project, TimeRegistration) {

	// upload, sheet, column, project, import
	$scope.wizardStep = 1;
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
			$scope.gotoStep2();
		});
	};

	$scope.gotoStep2 = function(){
		$scope.wizardStep += 1;
	};

	$scope.canGotoStep2 = function(){
		return true;
	};

	// step 2 (sheet selection)
	// ***********************

	$scope.selectedSheetName = undefined;
	$scope.selectedSheet = undefined;

	$scope.gotoStep3 = function(){
		
		$scope.selectedSheet = $scope.excelSheets[$scope.selectedSheetName];

		var selectedSheetHeader = [];
		for(var i = 0; i < $scope.selectedSheet.header.length; i++){
			selectedSheetHeader.push({ key: i, value: $scope.selectedSheet.header[i] });
		}
		$scope.selectedSheetHeader = selectedSheetHeader;

		$scope.wizardStep += 1;
	};

	$scope.canGotoStep3 = function(){
		return $scope.selectedSheetName != null;
	};

	// step 3 (column selection)
	// ***********************	

	$scope.gotoStep4 = function(){

		$scope.groupedRows = _.groupBy($scope.selectedSheet.data, function(r){
			return r[$scope.selectedProjectColumn] + ' - ' + r[$scope.selectedTaskColumn];
		});

		$scope.projectsInExcelSheet = _.map($scope.groupedRows, function(g){
			return {
				project: g[0][$scope.selectedProjectColumn],
				task: g[0][$scope.selectedTaskColumn],
				display: g[0][$scope.selectedProjectColumn] + ' - ' + g[0][$scope.selectedTaskColumn]
			}
		});

		$scope.wizardStep += 1;
	};

	$scope.canGotoStep4 = function(){
		return $scope.selectedProjectColumn != null &&
			$scope.selectedTaskColumn != null && 
			$scope.selectedDateColumn != null &&
			$scope.selectedFromColumn != null && 
			$scope.selectedToColumn != null && 
			$scope.selectedDescriptionColumn != null;
	}

	// step 4 (project mapping)
	// ***********************	

	$scope.gotoStep5 = function(){
		$scope.wizardStep += 1;
	};

	$scope.canGotoStep5 = function(){
		return _.every($scope.projectsInExcelSheet, function(p) {
			return p.mappedProjectAndTask != null;
		});
	};

	// step 5 (saving)
	// ***********************	

	$scope.import = function(){

		var registrations = [];

		_.forEach($scope.groupedRows, function(groupedRow){

			var selectedProjectTask = _.first(_.where($scope.projectsInExcelSheet, function(p){
				return p.project == groupedRow[0][$scope.selectedProjectColumn] && p.task == groupedRow[0][$scope.selectedTaskColumn];
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

		TimeRegistration.save(registrations, function(){
			var i = 0;
		}, function(){
			var i = 0;
		})
	};
	
	function convertDisplayDateToNumeric(date){
		return parseInt(date.replace(/-/g, ''), 10);
	}

	function convertDisplayTimeToNumeric(time){
		return parseInt(time.replace(':', ''), 10);
	}
});
