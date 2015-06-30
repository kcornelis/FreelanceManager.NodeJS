(function() {
	'use strict';
	
	describe('Template Factory Unit Tests:', function() {

		// Load the main application module
		beforeEach(module(ApplicationConfiguration.applicationModuleName));
		beforeEach(module('karma'));

		describe('Get all', function() {
			
			var Template,
				$httpBackend,
				response;

			beforeEach(inject(function(_Template_, _$httpBackend_) {
				Template = _Template_;
				$httpBackend = _$httpBackend_;

				$httpBackend.expectGET('/api/public/templates')
					.respond(200, [{ name: 'template1'}, { name: 'template2'}]);

				response = Template.query();
				$httpBackend.flush();

			}));

			it('should return all templates', function() {
				expect(response[0].name).toBe('template1');
				expect(response[1].name).toBe('template2');
			});	
		});

		describe('Get active', function() {
			
			var Template,
				$httpBackend,
				response;

			beforeEach(inject(function(_Template_, _$httpBackend_) {
				Template = _Template_;
				$httpBackend = _$httpBackend_;

				$httpBackend.expectGET('/api/public/templates/active')
					.respond(200, [{ name: 'template1'}, { name: 'template2'}]);

				response = Template.active();
				$httpBackend.flush();

			}));

			it('should return all active templates', function() {
				expect(response[0].name).toBe('template1');
				expect(response[1].name).toBe('template2');
			});	
		});		

		describe('Get by id', function() {
			
			var Template,
				$httpBackend,
				response;

			beforeEach(inject(function(_Template_, _$httpBackend_) {
				Template = _Template_;
				$httpBackend = _$httpBackend_;

				$httpBackend.expectGET('/api/public/templates/1')
					.respond(200, { name: 'template1'});

				response = Template.get({ id: 1 });
				$httpBackend.flush();

			}));

			it('should return the template', function() {
				expect(response.name).toBe('template1');
			});	
		});	

		describe('Update', function() {
			
			var Template,
				$httpBackend,
				response;

			beforeEach(inject(function(_Template_, _$httpBackend_) {
				Template = _Template_;
				$httpBackend = _$httpBackend_;

				$httpBackend.expectPOST('/api/public/templates/1', { name: 'template1'})
					.respond(200, { name: 'template1'});

				response = Template.save({ id: 1 }, { name: 'template1'});
				$httpBackend.flush();

			}));

			it('should update the template', function() {
				$httpBackend.verifyNoOutstandingExpectation();
      			$httpBackend.verifyNoOutstandingRequest();
			});	
		});		

		describe('Create', function() {
			
			var Template,
				$httpBackend,
				response;

			beforeEach(inject(function(_Template_, _$httpBackend_) {
				Template = _Template_;
				$httpBackend = _$httpBackend_;

				$httpBackend.expectPOST('/api/public/templates', { name: 'template1'})
					.respond(200, { name: 'template1'});

				response = Template.save({ name: 'template1'});
				$httpBackend.flush();

			}));

			it('should create the template', function() {
				$httpBackend.verifyNoOutstandingExpectation();
      			$httpBackend.verifyNoOutstandingRequest();
			});	
		});	


		describe('Hide', function() {
			
			var Template,
				$httpBackend,
				response;

			beforeEach(inject(function(_Template_, _$httpBackend_) {
				Template = _Template_;
				$httpBackend = _$httpBackend_;

				$httpBackend.expectPOST('/api/public/templates/1/hide')
					.respond(200, { name: 'template1'});

				response = Template.hide({ id: 1 });
				$httpBackend.flush();

			}));

			it('should hide the template', function() {
				$httpBackend.verifyNoOutstandingExpectation();
      			$httpBackend.verifyNoOutstandingRequest();
			});	
		});		

		describe('Unhide', function() {
			
			var Template,
				$httpBackend,
				response;

			beforeEach(inject(function(_Template_, _$httpBackend_) {
				Template = _Template_;
				$httpBackend = _$httpBackend_;

				$httpBackend.expectPOST('/api/public/templates/123/unhide')
					.respond(200, { name: 'template1'});

				response = Template.unhide({ id: 123 });
				$httpBackend.flush();

			}));

			it('should hide the template', function() {
				$httpBackend.verifyNoOutstandingExpectation();
      			$httpBackend.verifyNoOutstandingRequest();
			});	
		});							
	});
})();
