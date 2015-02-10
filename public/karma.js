ApplicationConfiguration.registerModule('karma');

angular.module('karma', [])

.config(function ($urlRouterProvider) {
	'use strict';

	$urlRouterProvider.otherwise(function(){ return false; });
});