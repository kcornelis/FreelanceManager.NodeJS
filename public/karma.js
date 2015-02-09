ApplicationConfiguration.registerModule('karma');

angular.module('karma', [])

.config(function ($urlRouterProvider) {
	'use strict';

	$urlRouterProvider.otherwise(function(){ return false; });
})

.run(function(_$httpBackend_) {
	'use strict';

	_$httpBackend_.whenGET(/i18n*/).respond(200, '');
});