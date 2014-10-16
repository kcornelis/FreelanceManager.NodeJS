'use strict';

angular.module('crm').controller('CompaniesController',
function($scope, $modal, Company) {

	$scope.getAllCompanies = function() {
		$scope.companies = Company.query();
	};

	$scope.openCompany = function(company){

		var createDialog = $modal.open({
			templateUrl: '/modules/crm/views/companydialog.client.view.html',
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
	}
});
