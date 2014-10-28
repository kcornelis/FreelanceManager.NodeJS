//'use strict';

(function() {
	describe('Project Factory Unit Tests:', function() {

		// Load the main application module
		beforeEach(module(ApplicationConfiguration.applicationModuleName));

		describe('Get all', function(){
			var Project,
				$httpBackend,
				response;

			beforeEach(inject(function(_Project_, _$httpBackend_){
				Project = _Project_;
				$httpBackend = _$httpBackend_;

				$httpBackend.expectGET('/api/public/projects')
					.respond(200, [{ name: 'project1'}, { name: 'project2'}]);

				response = Project.query();
				$httpBackend.flush();

			}));

			it('should return all projects', function(){
				expect(response[0].name).toBe('project1');
				expect(response[1].name).toBe('project2');
			});	
		});

		describe('Get by id', function(){
			var Project,
				$httpBackend,
				response;

			beforeEach(inject(function(_Project_, _$httpBackend_){
				Project = _Project_;
				$httpBackend = _$httpBackend_;

				$httpBackend.expectGET('/api/public/projects/1')
					.respond(200, { name: 'project1'});

				response = Project.get({ id: 1 });
				$httpBackend.flush();

			}));

			it('should return the project', function(){
				expect(response.name).toBe('project1');
			});	
		});	

		describe('Update', function(){
			var Project,
				$httpBackend,
				response;

			beforeEach(inject(function(_Project_, _$httpBackend_){
				Project = _Project_;
				$httpBackend = _$httpBackend_;

				$httpBackend.expectPOST('/api/public/projects/1', { name: 'project1'})
					.respond(200, { name: 'project1'});

				response = Project.save({ id: 1 }, { name: 'project1'});
				$httpBackend.flush();

			}));

			it('should update the project', function(){
				$httpBackend.verifyNoOutstandingExpectation();
      			$httpBackend.verifyNoOutstandingRequest();
			});	
		});		

		describe('Create', function(){
			var Project,
				$httpBackend,
				response;

			beforeEach(inject(function(_Project_, _$httpBackend_){
				Project = _Project_;
				$httpBackend = _$httpBackend_;

				$httpBackend.expectPOST('/api/public/projects', { name: 'project1'})
					.respond(200, { name: 'project1'});

				response = Project.save({ name: 'project1'});
				$httpBackend.flush();

			}));

			it('should create the project', function(){
				$httpBackend.verifyNoOutstandingExpectation();
      			$httpBackend.verifyNoOutstandingRequest();
			});	
		});				
	});
})();
