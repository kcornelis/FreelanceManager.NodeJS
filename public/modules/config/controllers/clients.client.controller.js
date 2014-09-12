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

	$scope.openClient = function(client){

		var createDialog = $modal.open({
			templateUrl: '/modules/config/views/clientdialog.client.view.html',
			controller: 'ClientDialogController',
			resolve: {
				client: function () {
					return client;
				}
			}
		});

		createDialog.result.then(function (client) {
			
		}, function () {
			
		});		
	}
});
