angular.module('settings').controller('TemplatesController',
function($scope, Template) {
	'use strict';

	$scope.getAllTemplates = function() {
		$scope.templates = Template.query();
	};

	$scope.openTemplate = function(template){
		$scope.template = template || {};
		$scope.newTemplate = template === undefined;
	};

	$scope.newTemplate = true;

	$scope.saveTemplate = function(){
		
		var id = $scope.newTemplate ? {} : { id: $scope.template.id };

		Template.save(id, $scope.template,
			function(data) { 
				if($scope.newTemplate){
					$scope.templates.push(data);
					$scope.template = data;
					$scope.newTemplate = false;
				}
			},
			function(err) { 
				// TODO show toaster
				alert(err);
			});
	};
});
