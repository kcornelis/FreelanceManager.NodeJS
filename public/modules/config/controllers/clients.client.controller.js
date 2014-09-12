'use strict';

angular.module('config').controller('ClientsController',
function($scope, $http, $modal) {

	$scope.getAllClients = function() {
		$http.get('/api/read/clients')
			.success(function (data, status, headers, config) {
				$scope.clients = data;
			})
			.error(function (data, status, headers, config) {
			});	
	};

	$scope.openCreateClient = function(){

		var createDialog = $modal.open({
			templateUrl: '/modules/config/views/createclient.client.view.html',
			controller: 'CreateClientController'
		});

		createDialog.result.then(function (client) {
			
		}, function () {
			
		});		
	}
});
