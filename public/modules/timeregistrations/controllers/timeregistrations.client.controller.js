'use strict';

angular.module('timeregistrations').controller('TimeRegistrationsController', ['$scope', '$stateParams', '$location', 'Authentication',
	function($scope, $stateParams, $location, Authentication) {
// 		$scope.authentication = Authentication;

		$scope.create = function() {
// 			var timeregistration = new Timeregistrations({
// 				title: this.title,
// 				content: this.content
// 			});
// 			timeregistration.$save(function(response) {
// 				$location.path('timeregistrations/' + response._id);
// 			}, function(errorResponse) {
// 				$scope.error = errorResponse.data.message;
// 			});

// 			this.title = '';
// 			this.content = '';
		};

		$scope.remove = function(timeregistration) {
// 			if (timeregistration) {
// 				timeregistration.$remove();

// 				for (var i in $scope.timeregistrations) {
// 					if ($scope.timeregistrations[i] === timeregistration) {
// 						$scope.timeregistrations.splice(i, 1);
// 					}
// 				}
// 			} else {
// 				$scope.timeregistration.$remove(function() {
// 					$location.path('timeregistrations');
// 				});
// 			}
		};

		$scope.update = function() {
// 			var timeregistration = $scope.timeregistration;

// 			timeregistration.$update(function() {
// 				$location.path('timeregistrations/' + timeregistration._id);
// 			}, function(errorResponse) {
// 				$scope.error = errorResponse.data.message;
// 			});
		};

		$scope.find = function() {
			//$scope.timeregistrations = Timeregistrations.query();
		};

		$scope.findOne = function() {
// 			$scope.timeregistration = Timeregistrations.get({
// 				timeregistrationId: $stateParams.timeregistrationId
// 			});
		};
	}
]);
