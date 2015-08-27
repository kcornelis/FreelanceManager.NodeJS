(function() {
	'use strict';

	function factory($resource) {
		return $resource('/api/public/timeregistrations/:id', { id: '@id' },
		{ 
			search: { method:'GET', url: '/api/public/timeregistrations/search', isArray: true },
			bydate: { method:'GET', url: '/api/public/timeregistrations/bydate/:date', params: { date: '@date' }, isArray: true },
			getlastgroupedbydescription: { method:'GET', url: '/api/public/timeregistrations/getlastgroupedbydescription/:amount', params: { amount: '@amount' }, isArray: true },
			getlastgroupedbytask: { method:'GET', url: '/api/public/timeregistrations/getlastgroupedbytask/:amount', params: { amount: '@amount' }, isArray: true },
			byrange: { method:'GET', url: '/api/public/timeregistrations/byrange/:from/:to', params: { from: '@from', to: '@to' }, isArray: true },
			uninvoiced: { method:'GET', url: '/api/public/timeregistrations/uninvoiced', isArray: true },
			getinfoforperiod: { method:'GET', url: '/api/public/timeregistrations/getinfoforperiod/:from/:to', params: { from: '@from', to: '@to' } },
			getinfoforperiodpertask: { method:'GET', url: '/api/public/timeregistrations/getinfoforperiodpertask/:from/:to', params: { from: '@from', to: '@to' }, isArray: true },
			saveMultiple: { method:'POST', url: '/api/public/timeregistrations/multiple', isArray: true }
		});
	}

	factory.$inject = ['$resource'];

	angular.module('fmCore').factory('TimeRegistration', factory);
})();
