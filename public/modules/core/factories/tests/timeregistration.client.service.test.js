//'use strict';

(function() {
	describe('TimeRegistration Factory Unit Tests:', function() {

		// Load the main application module
		beforeEach(module(ApplicationConfiguration.applicationModuleName));

		describe('Get all', function(){
			var TimeRegistration,
				$httpBackend,
				response;

			beforeEach(inject(function(_TimeRegistration_, _$httpBackend_){
				TimeRegistration = _TimeRegistration_;
				$httpBackend = _$httpBackend_;

				$httpBackend.expectGET('/api/public/timeregistrations')
					.respond(200, [{ description: 'time registration 1'}, { description: 'time registration 2'}]);

				response = TimeRegistration.query();
				$httpBackend.flush();

			}));

			it('should return all timeregistrations', function(){
				expect(response[0].description).toBe('time registration 1');
				expect(response[1].description).toBe('time registration 2');
			});	
		});

		describe('Get by id', function(){
			var TimeRegistration,
				$httpBackend,
				response;

			beforeEach(inject(function(_TimeRegistration_, _$httpBackend_){
				TimeRegistration = _TimeRegistration_;
				$httpBackend = _$httpBackend_;

				$httpBackend.expectGET('/api/public/timeregistrations/1')
					.respond(200, { description: 'time registration 1'});

				response = TimeRegistration.get({ id: 1 });
				$httpBackend.flush();

			}));

			it('should return the time registration', function(){
				expect(response.description).toBe('time registration 1');
			});	
		});	

		describe('Update', function(){
			var TimeRegistration,
				$httpBackend,
				response;

			beforeEach(inject(function(_TimeRegistration_, _$httpBackend_){
				TimeRegistration = _TimeRegistration_;
				$httpBackend = _$httpBackend_;

				$httpBackend.expectPOST('/api/public/timeregistrations/1', { description: 'time registration 1'})
					.respond(200, { description: 'time registration 1'});

				response = TimeRegistration.save({ id: 1 }, { description: 'time registration 1'});
				$httpBackend.flush();

			}));

			it('should update the time registration', function(){
				$httpBackend.verifyNoOutstandingExpectation();
      			$httpBackend.verifyNoOutstandingRequest();
			});	
		});		

		describe('Create', function(){
			var TimeRegistration,
				$httpBackend,
				response;

			beforeEach(inject(function(_TimeRegistration_, _$httpBackend_){
				TimeRegistration = _TimeRegistration_;
				$httpBackend = _$httpBackend_;

				$httpBackend.expectPOST('/api/public/timeregistrations', { description: 'time registration 1'})
					.respond(200, { description: 'time registration 1'});

				response = TimeRegistration.save({ description: 'time registration 1'});
				$httpBackend.flush();

			}));

			it('should create the time registration', function(){
				$httpBackend.verifyNoOutstandingExpectation();
      			$httpBackend.verifyNoOutstandingRequest();
			});	
		});				
	});
})();