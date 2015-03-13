angular.module('crm').controller('SearchCompanyDialogController',
function($scope, Company) {
	'use strict';

	$scope.companies = Company.query();

	$scope.ok = function () {
		$scope.$close(_.first(_.where($scope.companies, function(c) { return c.id === $scope.selectedCompany; })));
	};

	$scope.cancel = function () {
		$scope.$dismiss('cancel');
	};
});
