angular.module('core').factory('TimeRegistration', ['$resource', 
function($resource) {
	'use strict';
	
	return $resource('/api/public/timeregistrations/:id', { id: '@id' },
	{ 
		bydate: { method:'GET', url: '/api/public/timeregistrations/bydate/:date', params: { date: '@date' }, isArray: true },
		byrange: { method:'GET', url: '/api/public/timeregistrations/byrange/:from/:to', params: { from: '@from', to: '@to' }, isArray: true },
		uninvoiced: { method:'GET', url: '/api/public/timeregistrations/uninvoiced', isArray: true },
		getinfoforperiod: { method:'GET', url: '/api/public/timeregistrations/getinfoforperiod/:from/:to', params: { from: '@from', to: '@to' } },
		getinfoforperiodpertask: { method:'GET', url: '/api/public/timeregistrations/getinfoforperiodpertask/:from/:to', params: { from: '@from', to: '@to' }, isArray: true },
		saveMultiple: { method:'POST', url: '/api/public/timeregistrations/multiple', isArray: true }
	}); 
}]);