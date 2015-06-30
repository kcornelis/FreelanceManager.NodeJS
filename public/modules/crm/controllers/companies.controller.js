(function() {
	'use strict';

	function controller($scope, $modal, Company) {

		$scope.getAllCompanies = function() {
			Company.query(function(companies) {

				$scope.companies = _.sortBy(companies, 'name');
			});
		};

		$scope.openCompany = function(company) {


			var createDialog = $modal.open({
				templateUrl: '/modules/crm/views/editcompany.html',
				controller: 'CompanyDialogController',
				resolve: {
					toUpdate: function () {
						return company;
					}
				}
			});

			createDialog.result.then(function (company) {
				var c = _.find($scope.companies, { 'id': company.id });
				if(c) angular.copy(company, c);
				else $scope.companies.push(company);
			});		
		};
	}

	controller.$inject = ['$scope', '$modal', 'Company'];

	angular.module('fmCrm').controller('CompaniesController', controller);
})();
