(function() {
	'use strict';

	function controller($scope, Company) {

		$scope.companies = Company.query();

		$scope.ok = function () {
			$scope.$close(_.find($scope.companies, function(c) { return c.id === $scope.selectedCompany; }));
		};

		$scope.cancel = function () {
			$scope.$dismiss('cancel');
		};
	}

	controller.$inject = ['$scope', 'Company'];

	angular.module('fmCrm').controller('SearchCompanyDialogController', controller);
})();
