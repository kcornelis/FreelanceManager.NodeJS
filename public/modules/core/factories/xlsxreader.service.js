// TODO unit test
angular.module('core').factory('XLSXReader', ['$q', '$rootScope',
function($q, $rootScope) {
	'use strict';

	var service = function(data) {
		angular.extend(this, data);
	};

	service.readFile = function(file) {

		var deferred = $q.defer();
		var reader = new FileReader();

		reader.onload = function(e) {
			var data = e.target.result;
			var workbook = XLSX.read(data, {type: 'binary'});
			deferred.resolve(convertWorkbook(workbook));
		};

		reader.readAsBinaryString(file);

		return deferred.promise;
	};

	function convertWorkbook(workbook) {
		var sheets = {};
		_.forEachRight(workbook.SheetNames, function(sheetName) {
			var sheet = workbook.Sheets[sheetName];
			sheets[sheetName] = convertSheet(sheet);
		});

		return sheets;
	}

	function convertSheet(sheet) {

		var range = XLSX.utils.decode_range(sheet['!ref']);
		var sheetData = [], header = [];

		_.forEachRight(_.range(range.s.r, range.e.r + 1), function(row) {
			var rowData = [];
			_.forEachRight(_.range(range.s.c, range.e.c + 1), function(column) {
				var cellIndex = XLSX.utils.encode_cell({
					'c': column,
					'r': row
				});
				var cell = sheet[cellIndex];
				rowData[column] = cell ? cell.v : undefined;
			});
			if(row == 0)
				header = rowData;
			else sheetData[row - 1] = rowData;
		});

		return {
			'header': header,
			'data': sheetData,
			'name': sheet.name,
			'col_size': range.e.c + 1,
			'row_size': range.e.r
		}
	}
	return service;
}]);