(function() {
	'use strict';
	
	describe('TimeRegistration Factory Unit Tests:', function() {

		// Load the main application module
		beforeEach(module(ApplicationConfiguration.applicationModuleName));
		beforeEach(module('karma'));

		describe('Get all', function() {
			
			var TimeRegistration,
				$httpBackend,
				response;

			beforeEach(inject(function(_TimeRegistration_, _$httpBackend_) {
				TimeRegistration = _TimeRegistration_;
				$httpBackend = _$httpBackend_;

				$httpBackend.expectGET('/api/public/timeregistrations')
					.respond(200, [{ description: 'time registration 1'}, { description: 'time registration 2'}]);

				response = TimeRegistration.query();
				$httpBackend.flush();

			}));

			it('should return all timeregistrations', function() {
				expect(response[0].description).toBe('time registration 1');
				expect(response[1].description).toBe('time registration 2');
			});	
		});

		describe('Search', function() {
			
			var TimeRegistration,
				$httpBackend,
				response;

			beforeEach(inject(function(_TimeRegistration_, _$httpBackend_) {
				TimeRegistration = _TimeRegistration_;
				$httpBackend = _$httpBackend_;

				$httpBackend.expectGET('/api/public/timeregistrations/search?from=20101010')
					.respond(200, [{ description: 'time registration 1'}, { description: 'time registration 2'}]);

				response = TimeRegistration.search({ project: null, from: '20101010' });
				$httpBackend.flush();

			}));

			it('should return all timeregistrations', function() {
				expect(response[0].description).toBe('time registration 1');
				expect(response[1].description).toBe('time registration 2');
			});	
		});		

		describe('Get by date', function() {
			
			var TimeRegistration,
				$httpBackend,
				response;

			beforeEach(inject(function(_TimeRegistration_, _$httpBackend_) {
				TimeRegistration = _TimeRegistration_;
				$httpBackend = _$httpBackend_;

				$httpBackend.expectGET('/api/public/timeregistrations/bydate/20140101')
					.respond(200, [{ description: 'time registration 1'}, { description: 'time registration 2'}]);

				response = TimeRegistration.bydate({ date: 20140101 });
				$httpBackend.flush();

			}));

			it('should return all timeregistrations for the given date', function() {
				expect(response[0].description).toBe('time registration 1');
				expect(response[1].description).toBe('time registration 2');
			});	
		});		

		describe('Get by range', function() {
			
			var TimeRegistration,
				$httpBackend,
				response;

			beforeEach(inject(function(_TimeRegistration_, _$httpBackend_) {
				TimeRegistration = _TimeRegistration_;
				$httpBackend = _$httpBackend_;

				$httpBackend.expectGET('/api/public/timeregistrations/byrange/20140101/20140110')
					.respond(200, [{ description: 'time registration 1'}, { description: 'time registration 2'}]);

				response = TimeRegistration.byrange({ from: 20140101, to: 20140110 });
				$httpBackend.flush();

			}));

			it('should return all timeregistrations for the given date', function() {
				expect(response[0].description).toBe('time registration 1');
				expect(response[1].description).toBe('time registration 2');
			});	
		});		

		describe('Get uninvoiced', function() {
			
			var TimeRegistration,
				$httpBackend,
				response;

			beforeEach(inject(function(_TimeRegistration_, _$httpBackend_) {
				TimeRegistration = _TimeRegistration_;
				$httpBackend = _$httpBackend_;

				$httpBackend.expectGET('/api/public/timeregistrations/uninvoiced')
					.respond(200, [{ description: 'time registration 1'}, { description: 'time registration 2'}]);

				response = TimeRegistration.uninvoiced();
				$httpBackend.flush();

			}));

			it('should return all uninvoiced time registrations', function() {
				expect(response[0].description).toBe('time registration 1');
				expect(response[1].description).toBe('time registration 2');
			});	
		});			

		describe('Get info for period', function() {
			
			var TimeRegistration,
				$httpBackend,
				response;

			beforeEach(inject(function(_TimeRegistration_, _$httpBackend_) {
				TimeRegistration = _TimeRegistration_;
				$httpBackend = _$httpBackend_;

				$httpBackend.expectGET('/api/public/timeregistrations/getinfoforperiod/20140101/20140110')
					.respond(200, { total: 10 });

				response = TimeRegistration.getinfoforperiod({ from: 20140101, to: 20140110 });
				$httpBackend.flush();

			}));

			it('should return info about the time registrations for the given date range', function() {
				expect(response.total).toBe(10);
			});	
		});

		describe('Get info for period per task', function() {
			
			var TimeRegistration,
				$httpBackend,
				response;

			beforeEach(inject(function(_TimeRegistration_, _$httpBackend_) {
				TimeRegistration = _TimeRegistration_;
				$httpBackend = _$httpBackend_;

				$httpBackend.expectGET('/api/public/timeregistrations/getinfoforperiodpertask/20140101/20140110')
					.respond(200, [{ total: 20 }]);

				response = TimeRegistration.getinfoforperiodpertask({ from: 20140101, to: 20140110 });
				$httpBackend.flush();

			}));

			it('should return all timeregistrations for the given date', function() {
				expect(response[0].total).toBe(20);
			});	
		});						

		describe('Get by id', function() {
			
			var TimeRegistration,
				$httpBackend,
				response;

			beforeEach(inject(function(_TimeRegistration_, _$httpBackend_) {
				TimeRegistration = _TimeRegistration_;
				$httpBackend = _$httpBackend_;

				$httpBackend.expectGET('/api/public/timeregistrations/1')
					.respond(200, { description: 'time registration 1'});

				response = TimeRegistration.get({ id: 1 });
				$httpBackend.flush();

			}));

			it('should return the time registration', function() {
				expect(response.description).toBe('time registration 1');
			});	
		});	

		describe('Update', function() {
			
			var TimeRegistration,
				$httpBackend,
				response;

			beforeEach(inject(function(_TimeRegistration_, _$httpBackend_) {
				TimeRegistration = _TimeRegistration_;
				$httpBackend = _$httpBackend_;

				$httpBackend.expectPOST('/api/public/timeregistrations/1', { description: 'time registration 1'})
					.respond(200, { description: 'time registration 1'});

				response = TimeRegistration.save({ id: 1 }, { description: 'time registration 1'});
				$httpBackend.flush();

			}));

			it('should update the time registration', function() {
				$httpBackend.verifyNoOutstandingExpectation();
      			$httpBackend.verifyNoOutstandingRequest();
			});	
		});		

		describe('Create', function() {
			
			var TimeRegistration,
				$httpBackend,
				response;

			beforeEach(inject(function(_TimeRegistration_, _$httpBackend_) {
				TimeRegistration = _TimeRegistration_;
				$httpBackend = _$httpBackend_;

				$httpBackend.expectPOST('/api/public/timeregistrations', { description: 'time registration 1'})
					.respond(200, { description: 'time registration 1'});

				response = TimeRegistration.save({ description: 'time registration 1'});
				$httpBackend.flush();

			}));

			it('should create the time registration', function() {
				$httpBackend.verifyNoOutstandingExpectation();
      			$httpBackend.verifyNoOutstandingRequest();
			});	
		});	


		describe('Create Multiple', function() {
			
			var TimeRegistration,
				$httpBackend,
				response;

			beforeEach(inject(function(_TimeRegistration_, _$httpBackend_) {
				TimeRegistration = _TimeRegistration_;
				$httpBackend = _$httpBackend_;

				$httpBackend.expectPOST('/api/public/timeregistrations/multiple', [{ description: 'time registration 1'}])
					.respond(200, [{ description: 'time registration 1'}]);

				response = TimeRegistration.saveMultiple([{ description: 'time registration 1'}]);
				$httpBackend.flush();

			}));

			it('should create the time registration', function() {
				$httpBackend.verifyNoOutstandingExpectation();
      			$httpBackend.verifyNoOutstandingRequest();
			});	
		});			
	});
})();
