'use strict';

angular.module('crm').controller('CompaniesController',
function($scope, $http, $modal) {

	$scope.getAllCompanies = function() {
		$http.get('/api/public/companies')
			.success(function (data, status, headers, crm) {
				$scope.companies = data;
			})
			.error(function (data, status, headers, crm) {
			});	
	};

	$scope.openCompany = function(company){

		var createDialog = $modal.open({
			templateUrl: '/modules/crm/views/companydialog.client.view.html',
			controller: 'CompanyDialogController',
			resolve: {
				company: function () {
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
