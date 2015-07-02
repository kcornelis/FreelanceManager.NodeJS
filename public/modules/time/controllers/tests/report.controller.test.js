(function() {
	'use strict';

	describe('Time Registration Report Controller Unit Tests:', function() {

		// Load the main application module
		beforeEach(module(fm.config.moduleName));
		beforeEach(module('karma'));

		describe('Year tests:', function() {

			var scope, 
				controller;
			
			beforeEach(inject(function($controller, $rootScope, $stateParams) {
				scope = $rootScope.$new();

				$stateParams.from = '20100101';
				$stateParams.to = '20101231';

				controller = $controller('TimeRegistrationReportController', {
					$scope: scope
				});

				scope.$apply();
			}));

			describe('initial state', function() {

				it('should have a title', function() {
					expect(scope.title).toBe('2010');
				});
			
				it('should have a from date', function() {
					expect(scope.from.format('YYYY-MM-DD')).toBe('2010-01-01');
				});

				it('should have a to date', function() {
					expect(scope.to.format('YYYY-MM-DD')).toBe('2010-12-31');
				});					

				it('should have a previous from date', function() {
					expect(scope.previousFrom.format('YYYY-MM-DD')).toBe('2009-01-01');
				});

				it('should have a previous to date', function() {
					expect(scope.previousTo.format('YYYY-MM-DD')).toBe('2009-12-31');
				});

				it('should have a next from date', function() {
					expect(scope.nextFrom.format('YYYY-MM-DD')).toBe('2011-01-01');
				});

				it('should have a next to date', function() {
					expect(scope.nextTo.format('YYYY-MM-DD')).toBe('2011-12-31');
				});				
			});
		});

		describe('Month tests:', function() {

			var scope, 
				controller;			
			
			beforeEach(inject(function($controller, $rootScope, $stateParams) {
				scope = $rootScope.$new();

				$stateParams.from = '20100101';
				$stateParams.to = '20100131';

				controller = $controller('TimeRegistrationReportController', {
					$scope: scope
				});

				scope.$apply();
			}));

			describe('initial state', function() {

				it('should have a title', function() {
					expect(scope.title).toBe('January 2010');
				});
			
				it('should have a from date', function() {
					expect(scope.from.format('YYYY-MM-DD')).toBe('2010-01-01');
				});

				it('should have a to date', function() {
					expect(scope.to.format('YYYY-MM-DD')).toBe('2010-01-31');
				});					

				it('should have a previous from date', function() {
					expect(scope.previousFrom.format('YYYY-MM-DD')).toBe('2009-12-01');
				});

				it('should have a previous to date', function() {
					expect(scope.previousTo.format('YYYY-MM-DD')).toBe('2009-12-31');
				});

				it('should have a next from date', function() {
					expect(scope.nextFrom.format('YYYY-MM-DD')).toBe('2010-02-01');
				});

				it('should have a next to date', function() {
					expect(scope.nextTo.format('YYYY-MM-DD')).toBe('2010-02-28');
				});				
			});
		});

		describe('Week tests:', function() {

			var scope, 
				controller;			
			
			beforeEach(inject(function($controller, $rootScope, $stateParams) {
				scope = $rootScope.$new();

				$stateParams.from = '20100101';
				$stateParams.to = '20100107';

				controller = $controller('TimeRegistrationReportController', {
					$scope: scope
				});

				scope.$apply();
			}));

			describe('initial state', function() {

				it('should have a title', function() {
					expect(scope.title).toBe('2010-01-01 - 2010-01-07');
				});
			
				it('should have a from date', function() {
					expect(scope.from.format('YYYY-MM-DD')).toBe('2010-01-01');
				});

				it('should have a to date', function() {
					expect(scope.to.format('YYYY-MM-DD')).toBe('2010-01-07');
				});					

				it('should have a previous from date', function() {
					expect(scope.previousFrom.format('YYYY-MM-DD')).toBe('2009-12-25');
				});

				it('should have a previous to date', function() {
					expect(scope.previousTo.format('YYYY-MM-DD')).toBe('2009-12-31');
				});

				it('should have a next from date', function() {
					expect(scope.nextFrom.format('YYYY-MM-DD')).toBe('2010-01-08');
				});

				it('should have a next to date', function() {
					expect(scope.nextTo.format('YYYY-MM-DD')).toBe('2010-01-14');
				});				
			});
		});

		describe('Common tests:', function() {

			var scope, 
				controller;			
			
			beforeEach(inject(function($controller, $rootScope, $stateParams, $state, $httpBackend) {
				scope = $rootScope.$new();

				$stateParams.from = '20100101';
				$stateParams.to = '20100107';

				controller = $controller('TimeRegistrationReportController', {
					$scope: scope
				});

				scope.$apply();
			}));

			describe('initial state', function() {

				it('should have a week start', function() {
					expect(scope.weekStart).toBe(moment().startOf('isoWeek').format('YYYYMMDD'));
				});

				it('should have a week end', function() {
					expect(scope.weekEnd).toBe(moment().endOf('isoWeek').format('YYYYMMDD'));
				});	

				it('should have a month start', function() {
					expect(scope.monthStart).toBe(moment().startOf('month').format('YYYYMMDD'));
				});

				it('should have a month end', function() {
					expect(scope.monthEnd).toBe(moment().endOf('month').format('YYYYMMDD'));
				});	

				it('should have a year start', function() {
					expect(scope.yearStart).toBe(moment().startOf('year').format('YYYYMMDD'));
				});

				it('should have a year end', function() {
					expect(scope.yearEnd).toBe(moment().endOf('year').format('YYYYMMDD'));
				});												
			});

			describe('$scope.previous', function() {

				beforeEach(inject(function($state) {
					$state.expectTransitionTo('app.time_report', { from: '20091225', to: '20091231'});

					scope.previous();
					scope.$apply();
				}));				

				it('should navigate to the time report state with the new params', inject(function($state) {
					$state.ensureAllTransitionsHappened();
				}));
			});	

			describe('$scope.next', function() {

				beforeEach(inject(function($state) {
					$state.expectTransitionTo('app.time_report', { from: '20100108', to: '20100114'});

					scope.next();
					scope.$apply();
				}));				

				it('should navigate to the time report state with the new params', inject(function($state) {
					$state.ensureAllTransitionsHappened();
				}));
			});	

			describe('$scope.refresh', function() {

				beforeEach(inject(function($httpBackend) {

					$httpBackend.expectGET('/api/public/timeregistrations/getinfoforperiod/20100101/20100107').respond(
					{
						'count':4,'billableMinutes':10,'unBillableMinutes':20
					});

					$httpBackend.expectGET('/api/public/timeregistrations/getinfoforperiodpertask/20100101/20100107').respond([
						{'companyId':'companyId1','company':{ 'name':'company 1' },'projectId':'projectId1','project':{ 'name':'project 1' },'task':'Analyse','count':1,'billableMinutes':5,'unBillableMinutes':0},
						{'companyId':'companyId1','company':{ 'name':'company 1' },'projectId':'projectId1','project':{ 'name':'project 1' },'task':'Development','count':1,'billableMinutes':0,'unBillableMinutes':10},
						{'companyId':'companyId1','company':{ 'name':'companu 1' },'projectId':'projectId2','project':{ 'name':'project 2' },'task':'Development','count':1,'billableMinutes':5,'unBillableMinutes':0},
						{'companyId':'companyId2','company':{ 'name':'company 2' },'projectId':'projectId3','project':{ 'name':'project 3' },'task':'Development','count':1,'billableMinutes':0,'unBillableMinutes':10}
					]);

					scope.refresh();

					expect(scope.loading).toBe(true);		

					$httpBackend.flush();
				}));

				it('should set a summary for the period', function() {
					expect(scope.summary.count).toBe(4);
					expect(scope.summary.billableMinutes).toBe(10);
					expect(scope.summary.unBillableMinutes).toBe(20);
				});

				it('should set chart info', function() {
					expect(scope.billableUnbillableGraph[0].label).toBe('Billable');
					expect(scope.billableUnbillableGraph[0].data).toBe(10);	

					expect(scope.billableUnbillableGraph[1].label).toBe('Unbillable');
					expect(scope.billableUnbillableGraph[1].data).toBe(20);										
				});

				it('should set the has hours flag flag', function() {
					expect(scope.hasHours).toBe(true);								
				});

				it('should clear the loading flag', function() {
					expect(scope.loading).toBe(false);								
				});

				it('should group per task info per project (1)', function() {
					var info = _.first(_.where(scope.infoPerProject, { companyId: 'companyId1', projectId: 'projectId1' }));
					var task1 = _.first(_.where(info.tasks, { task: 'Analyse' }));
					var task2 = _.first(_.where(info.tasks, { task: 'Development'}));

					expect(task1.billableMinutes).toBe(5);
					expect(task2.unBillableMinutes).toBe(10);
				});

				it('should group per task info per project (2)', function() {
					var info = _.first(_.where(scope.infoPerProject, { companyId: 'companyId1', projectId: 'projectId2' }));
					var task = _.first(_.where(info.tasks, { task: 'Development'}));

					expect(task.billableMinutes).toBe(5);
				});

				it('should group per task info per project (3)', function() {
					var info = _.first(_.where(scope.infoPerProject, { companyId: 'companyId2', projectId: 'projectId3' }));
					var task = _.first(_.where(info.tasks, { task: 'Development'}));

					expect(task.unBillableMinutes).toBe(10);
				});				
			});

			describe('$scope.refresh no data', function() {

				beforeEach(inject(function($httpBackend) {

					$httpBackend.expectGET('/api/public/timeregistrations/getinfoforperiod/20100101/20100107').respond(
					{
						'count':0,'billableMinutes':0,'unBillableMinutes':0
					});

					$httpBackend.expectGET('/api/public/timeregistrations/getinfoforperiodpertask/20100101/20100107').respond([]);

					scope.refresh();

					expect(scope.loading).toBe(true);		

					$httpBackend.flush();
				}));

				it('should set the has hours flag flag', function() {
					expect(scope.hasHours).toBe(false);								
				});

				it('should clear the loading flag', function() {
					expect(scope.loading).toBe(false);								
				});			
			});
		});
	});
})();
