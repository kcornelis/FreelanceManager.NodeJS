(function() {
	'use strict';
	
	describe('Time Registration Import Controller Unit Tests:', function() {

		// Load the main application module
		beforeEach(module(fm.config.moduleName));
		beforeEach(module('karma'));

		describe('initialization', function() {

			var scope, 
				controller;

			beforeEach(inject(function($controller, $rootScope, $httpBackend) {

				scope = $rootScope.$new();
				controller = $controller('TimeRegistrationImportController', {
					$scope: scope
				});

				$httpBackend.expectGET('/api/public/projects/active').respond([
					{ name: 'project1', company: { name: 'company2' }, tasks: [ { name: 'meeting' }, { name: 'development' }] }, 
					{ name: 'project3', company: { name: 'company1' }, tasks: [ { name: 'development' }, { name: 'meeting' }] },
					{ name: 'project2', company: { name: 'company1' }, tasks: [ { name: 'development' }, { name: 'meeting' }] }]);

				$httpBackend.flush();
				scope.init();
			}));

			it('should store all (active) tasks in $scope.tasks, ordered by company name, then by project name, then by task name', function() {
				expect(scope.tasks[0].display).toBe('company1 - project2 - development');
				expect(scope.tasks[1].display).toBe('company1 - project2 - meeting');
				expect(scope.tasks[2].display).toBe('company1 - project3 - development');
				expect(scope.tasks[3].display).toBe('company1 - project3 - meeting');
				expect(scope.tasks[4].display).toBe('company2 - project1 - development');
				expect(scope.tasks[5].display).toBe('company2 - project1 - meeting');
			});

			it('should add an id to each task', function() {
				expect(scope.tasks[0].id).toBe(4); // company1 - project2 - development
				expect(scope.tasks[1].id).toBe(5);
				expect(scope.tasks[2].id).toBe(2); // company1 - project3 - development
				expect(scope.tasks[3].id).toBe(3);
				expect(scope.tasks[4].id).toBe(1); // company2 - project1 - development
				expect(scope.tasks[5].id).toBe(0);
			});

			it('should add the project to each task', function() {
				expect(scope.tasks[0].project.name).toBe('project2');
				expect(scope.tasks[1].project.name).toBe('project2');
				expect(scope.tasks[2].project.name).toBe('project3');
				expect(scope.tasks[3].project.name).toBe('project3');
				expect(scope.tasks[4].project.name).toBe('project1');
				expect(scope.tasks[5].project.name).toBe('project1');
			});

			it('should add the company to each task', function() {
				expect(scope.tasks[0].company.name).toBe('company1');
				expect(scope.tasks[1].company.name).toBe('company1');
				expect(scope.tasks[2].company.name).toBe('company1');
				expect(scope.tasks[3].company.name).toBe('company1');
				expect(scope.tasks[4].company.name).toBe('company2');
				expect(scope.tasks[5].company.name).toBe('company2');
			});

			it('should show the first wizard page', function() {
				expect(scope.active(1)).toBe(true);
				expect(scope.active(2)).toBe(false);
				expect(scope.active(3)).toBe(false);
				expect(scope.active(4)).toBe(false);
				expect(scope.active(5)).toBe(false);
				expect(scope.active(6)).toBe(false);
			});
		});	

		describe('step 1 (file selection)', function() {

			var scope, 
				controller,
				readerMock;

			beforeEach(inject(function($controller, $rootScope, $httpBackend) {

				readerMock = {
					readFile: function(file, preview) {
						expect(file).toBe('the file');
						return {
							then: function(cb) {
								cb('some excel data');
							}
						};
					}
				};

				scope = $rootScope.$new();
				controller = $controller('TimeRegistrationImportController', {
					$scope: scope,
					XLSXReader: readerMock
				});
				scope.init();
			}));

			describe('$scope.fileChanged', function() {
				it('should load the excel and put the result in $scope.excel.sheets', function() {
					scope.fileChanged(['the file']);

					expect(scope.excel.sheets).toBe('some excel data');
				});

				it('should goto the next wizard page', function() {
					scope.fileChanged(['the file']);

					expect(scope.active(1)).toBe(false);
					expect(scope.active(2)).toBe(true);
				});
			});
		});

		describe('step 2 (sheet selection)', function() {

			var scope, 
				controller;

			beforeEach(inject(function($controller, $rootScope, $httpBackend) {

				scope = $rootScope.$new();
				controller = $controller('TimeRegistrationImportController', {
					$scope: scope
				});
				scope.init();
			}));

			describe('$scope.canGoto3', function() {
				it('should return false if no sheet is selected', function() {
					expect(scope.canGoto3()).toBe(false);
					scope.excel.selectedSheetName = null;
					expect(scope.canGoto3()).toBe(false);
				});

				it('should return true if a sheet is selected', function() {
					scope.excel.selectedSheetName = 'first sheet';
					expect(scope.canGoto3()).toBe(true);
				});
			});

			describe('$scope.goto3', function() {

				beforeEach(function() {
					scope.excel.selectedSheetName = 'sheet1';
					scope.excel.sheets = {
						sheet1: {
							name: 'sheet1',
							header: [ 'a', 'b', 'c' ]
						}
					};
				});

				it('should store the selected sheet in $scope.excel.selectedSheet', function() {
					scope.goto3();
					expect(scope.excel.selectedSheet.name).toBe('sheet1');
				});

				it('should store the header and indexes in $scope.excel.selectedSheetHeader', function() {
					scope.goto3();
					
					expect(scope.excel.selectedSheetHeader[0].key).toBe(0);
					expect(scope.excel.selectedSheetHeader[0].value).toBe('a');

					expect(scope.excel.selectedSheetHeader[1].key).toBe(1);
					expect(scope.excel.selectedSheetHeader[1].value).toBe('b');
				});

				it('should go to the next wizard page', function() {
					scope.goto3();

					expect(scope.active(1)).toBe(false);
					expect(scope.active(2)).toBe(false);
					expect(scope.active(3)).toBe(true);
				});
			});
		});

		describe('step 3 (column selection)', function() {

			var scope, 
				controller;

			beforeEach(inject(function($controller, $rootScope, $httpBackend) {

				scope = $rootScope.$new();
				controller = $controller('TimeRegistrationImportController', {
					$scope: scope
				});
				scope.init();
			}));

			describe('$scope.canGoto4', function() {
				it('should return false if no column is selected', function() {
					scope.excel.selectedProjectColumn = null;
					scope.excel.selectedTaskColumn = null;
					scope.excel.selectedDateColumn = null;
					scope.excel.selectedFromColumn = null;
					scope.excel.selectedToColumn = null;
					scope.excel.selectedDescriptionColumn = null;

					expect(scope.canGoto4()).toBe(false);
				});

				it('should return false if only the project column is selected', function() {
					scope.excel.selectedProjectColumn = 1;
					scope.excel.selectedTaskColumn = null;
					scope.excel.selectedDateColumn = null;
					scope.excel.selectedFromColumn = null;
					scope.excel.selectedToColumn = null;
					scope.excel.selectedDescriptionColumn = null;

					expect(scope.canGoto4()).toBe(false);
				});

				it('should return false if only the task column is selected', function() {
					scope.excel.selectedProjectColumn = null;
					scope.excel.selectedTaskColumn = 1;
					scope.excel.selectedDateColumn = null;
					scope.excel.selectedFromColumn = null;
					scope.excel.selectedToColumn = null;
					scope.excel.selectedDescriptionColumn = null;

					expect(scope.canGoto4()).toBe(false);
				});

				it('should return false if only the date column is selected', function() {
					scope.excel.selectedProjectColumn = null;
					scope.excel.selectedTaskColumn = null;
					scope.excel.selectedDateColumn = 1;
					scope.excel.selectedFromColumn = null;
					scope.excel.selectedToColumn = null;
					scope.excel.selectedDescriptionColumn = null;

					expect(scope.canGoto4()).toBe(false);
				});

				it('should return false if only the from column is selected', function() {
					scope.excel.selectedProjectColumn = null;
					scope.excel.selectedTaskColumn = null;
					scope.excel.selectedDateColumn = null;
					scope.excel.selectedFromColumn = 1;
					scope.excel.selectedToColumn = null;
					scope.excel.selectedDescriptionColumn = null;

					expect(scope.canGoto4()).toBe(false);
				});

				it('should return false if only the to column is selected', function() {
					scope.excel.selectedProjectColumn = null;
					scope.excel.selectedTaskColumn = null;
					scope.excel.selectedDateColumn = null;
					scope.excel.selectedFromColumn = null;
					scope.excel.selectedToColumn = 1;
					scope.excel.selectedDescriptionColumn = null;

					expect(scope.canGoto4()).toBe(false);
				});

				it('should return false if only the description column is selected', function() {
					scope.excel.selectedProjectColumn = null;
					scope.excel.selectedTaskColumn = null;
					scope.excel.selectedDateColumn = null;
					scope.excel.selectedFromColumn = null;
					scope.excel.selectedToColumn = null;
					scope.excel.selectedDescriptionColumn = 1;

					expect(scope.canGoto4()).toBe(false);
				});

				it('should return true if all columns are selected', function() {
					scope.excel.selectedProjectColumn = 1;
					scope.excel.selectedTaskColumn = 2;
					scope.excel.selectedDateColumn = 3;
					scope.excel.selectedFromColumn = 4;
					scope.excel.selectedToColumn = 5;
					scope.excel.selectedDescriptionColumn = 6;

					expect(scope.canGoto4()).toBe(true);
				});
			});

			describe('$scope.goto4', function() {

				beforeEach(function() {
					scope.excel.selectedSheet = {
						data: [
							[ 'a', 'p1', 'dev' ],
							[ 'a', 'p1', 'meeting' ],
							[ 'a', 'p2', 'dev' ],
							[ 'a', 'p2', 'dev' ],
							[ 'a', 'p2', 'dev' ]
						]
					};
					scope.excel.selectedProjectColumn = 1;
					scope.excel.selectedTaskColumn = 2;
				});

				it('should group the sheet data by project and task and store it in $scope.excel.groupedRows', function() {
					scope.goto4();

					expect(scope.excel.groupedRows['p1 - dev'].length).toBe(1);
					expect(scope.excel.groupedRows['p1 - meeting'].length).toBe(1);
					expect(scope.excel.groupedRows['p2 - dev'].length).toBe(3);
				});

				it('should store all the tasks and projects in $scope.excel.projectsInSheet', function() {
					scope.goto4();

					expect(scope.excel.projectsInSheet[0].project).toBe('p1');
					expect(scope.excel.projectsInSheet[0].task).toBe('dev');
					expect(scope.excel.projectsInSheet[0].display).toBe('p1 - dev');

					expect(scope.excel.projectsInSheet[1].project).toBe('p1');
					expect(scope.excel.projectsInSheet[1].task).toBe('meeting');
					expect(scope.excel.projectsInSheet[1].display).toBe('p1 - meeting');

					expect(scope.excel.projectsInSheet[2].project).toBe('p2');
					expect(scope.excel.projectsInSheet[2].task).toBe('dev');
					expect(scope.excel.projectsInSheet[2].display).toBe('p2 - dev');
				});

				it('should go to the next wizard page', function() {
					scope.goto4();

					expect(scope.active(1)).toBe(false);
					expect(scope.active(2)).toBe(false);
					expect(scope.active(3)).toBe(false);
					expect(scope.active(4)).toBe(true);
				});
			});
		});

		describe('step 4 (project mapping)', function() {

			var scope, 
				controller;

			beforeEach(inject(function($controller, $rootScope, $httpBackend) {

				scope = $rootScope.$new();
				controller = $controller('TimeRegistrationImportController', {
					$scope: scope
				});
				scope.init();
			}));

			describe('$scope.canGoto5', function() {
				it('should return false if at least one excel project has no project and task assigned', function() {
					scope.excel.projectsInSheet = [
						{ mappedProjectAndTask: 1 },
						{ mappedProjectAndTask: null }
					];

					expect(scope.canGoto5()).toBe(false);
				});

				it('should return true if all excel project have a project and task assigned', function() {
					scope.excel.projectsInSheet = [
						{ mappedProjectAndTask: 1 },
						{ mappedProjectAndTask: 2 }
					];

					expect(scope.canGoto5()).toBe(true);
				});
			});

			describe('$scope.goto5', function() {

				it('should go to the next wizard page', function() {
					scope.goto5();

					expect(scope.active(1)).toBe(false);
					expect(scope.active(2)).toBe(false);
					expect(scope.active(3)).toBe(false);
					expect(scope.active(4)).toBe(false);
					expect(scope.active(5)).toBe(true);
				});
			});
		});

		describe('step 5 (saving)', function() {

			var scope, 
				controller,
				timeRegistrationMock;

			beforeEach(inject(function($controller, $rootScope, $httpBackend) {

				scope = $rootScope.$new();

				timeRegistrationMock = {
					verifyInput: null,
					_cb: null,
					flush: function() { this._cb('imported data'); },
					saveMultiple: function(timeRegistrations, cb) {
						if(this.verifyInput) { this.verifyInput(timeRegistrations); }
						this._cb = cb;
					}
				};

				controller = $controller('TimeRegistrationImportController', {
					$scope: scope,
					TimeRegistration: timeRegistrationMock
				});
				scope.init();

				scope.excel.selectedProjectColumn = 1;
				scope.excel.selectedTaskColumn = 2;
				scope.excel.selectedDateColumn = 4;
				scope.excel.selectedFromColumn = 5;
				scope.excel.selectedToColumn = 6;
				scope.excel.selectedDescriptionColumn = 3;

				scope.excel.groupedRows = {
					'p1 - dev': [
						[ 'c1', 'p1', 'dev', 'description1', '2010-01-01', '10:10', '10:20' ],
						[ 'c1', 'p1', 'dev', 'description2', '2010-02-01', '9:00', '10:00' ]
					],
					'p1 - meeting': [
						[ 'c1', 'p1', 'meeting', 'description1', '2010-01-01', '10:10', '10:20' ],
						[ 'c1', 'p1', 'meeting', 'description2', '2010-01-01', '10:10', '10:20' ]
					],
					'p2 - dev': [
						[ 'c2', 'p2', 'dev', 'description6', '2011-01-01', '00:00', '23:59' ],
						[ 'c2', 'p2', 'dev', 'description7', '2012-01-01', '00:00', '10:00' ]
					]
				};

				scope.excel.projectsInSheet = [
					{ project: 'p1', task: 'dev', mappedProjectAndTask: 1 },
					{ project: 'p1', task: 'meeting', mappedProjectAndTask: 2 },
					{ project: 'p2', task: 'dev', mappedProjectAndTask: 3 }
				];

				scope.tasks = [ 
					{ project: { id: 11, companyId: 111, name: 'p1' }, task: { name: 'dev', billable: true }, id: 1 },
					{ project: { id: 11, companyId: 111, name: 'p1' }, task: { name: 'meeting', billable: true }, id: 2 },
					{ project: { id: 22, companyId: 222, name: 'p2' }, task: { name: 'dev', billable: false }, id: 3 } 
				];
			}));

			describe('$scope.import', function() {
				it('should send the converted time registrations to the backend', function(done) {
					timeRegistrationMock.verifyInput = function(timeRegistrations) {

						expect(timeRegistrations[0].companyId).toBe(111);
						expect(timeRegistrations[0].projectId).toBe(11);
						expect(timeRegistrations[0].task).toBe('dev');
						expect(timeRegistrations[0].description).toBe('description1');
						expect(timeRegistrations[0].date).toBe(20100101);
						expect(timeRegistrations[0].from).toBe(1010);
						expect(timeRegistrations[0].to).toBe(1020);
						expect(timeRegistrations[0].billable).toBe(true);

						expect(timeRegistrations[1].companyId).toBe(111);
						expect(timeRegistrations[1].projectId).toBe(11);
						expect(timeRegistrations[1].task).toBe('dev');
						expect(timeRegistrations[1].description).toBe('description2');
						expect(timeRegistrations[1].date).toBe(20100201);
						expect(timeRegistrations[1].from).toBe(900);
						expect(timeRegistrations[1].to).toBe(1000);
						expect(timeRegistrations[1].billable).toBe(true);

						expect(timeRegistrations[2].companyId).toBe(111);
						expect(timeRegistrations[2].projectId).toBe(11);
						expect(timeRegistrations[2].task).toBe('meeting');
						expect(timeRegistrations[2].description).toBe('description1');
						expect(timeRegistrations[2].date).toBe(20100101);
						expect(timeRegistrations[2].from).toBe(1010);
						expect(timeRegistrations[2].to).toBe(1020);
						expect(timeRegistrations[2].billable).toBe(true);

						expect(timeRegistrations[3].companyId).toBe(111);
						expect(timeRegistrations[3].projectId).toBe(11);
						expect(timeRegistrations[3].task).toBe('meeting');
						expect(timeRegistrations[3].description).toBe('description2');
						expect(timeRegistrations[3].date).toBe(20100101);
						expect(timeRegistrations[3].from).toBe(1010);
						expect(timeRegistrations[3].to).toBe(1020);
						expect(timeRegistrations[3].billable).toBe(true);

						expect(timeRegistrations[4].companyId).toBe(222);
						expect(timeRegistrations[4].projectId).toBe(22);
						expect(timeRegistrations[4].task).toBe('dev');
						expect(timeRegistrations[4].description).toBe('description6');
						expect(timeRegistrations[4].date).toBe(20110101);
						expect(timeRegistrations[4].from).toBe(0);
						expect(timeRegistrations[4].to).toBe(2359);
						expect(timeRegistrations[4].billable).toBe(false);

						expect(timeRegistrations[5].companyId).toBe(222);
						expect(timeRegistrations[5].projectId).toBe(22);
						expect(timeRegistrations[5].task).toBe('dev');
						expect(timeRegistrations[5].description).toBe('description7');
						expect(timeRegistrations[5].date).toBe(20120101);
						expect(timeRegistrations[5].from).toBe(0);
						expect(timeRegistrations[5].to).toBe(1000);
						expect(timeRegistrations[5].billable).toBe(false);

						done(); // make sure the function was executed
					};

					scope.import();
					timeRegistrationMock.flush();
				});

				it('should set $scope.importing if the data is imported', function() {
					expect(scope.importing).toBe(false);
					scope.import();
					expect(scope.importing).toBe(true);
					timeRegistrationMock.flush();
					expect(scope.importing).toBe(false);
				});

				it('should set $scope.timeRegistrationsImported with the imported time registrations', function() {
					scope.import();
					timeRegistrationMock.flush();
					expect(scope.timeRegistrationsImported).toBe('imported data');
				});

				it('should set the visible imported time registrations to 10', function() {
					scope.import();
					timeRegistrationMock.flush();
					expect(scope.summaryTableParams.count()).toBe(10);
				});

				it('should go to the next wizard page', function() {
					scope.import();
					timeRegistrationMock.flush();

					expect(scope.active(1)).toBe(false);
					expect(scope.active(2)).toBe(false);
					expect(scope.active(3)).toBe(false);
					expect(scope.active(4)).toBe(false);
					expect(scope.active(5)).toBe(false);
					expect(scope.active(6)).toBe(true);
				});
			});
		});

		describe('step 6 (summary)', function() {

			var scope, 
				controller;

			beforeEach(inject(function($controller, $rootScope, $httpBackend) {

				scope = $rootScope.$new();
				scope.timeRegistrationsImported = [
					{ foo: '1', bar: 'a' },
					{ foo: '2', bar: 'b' },
					{ foo: '3', bar: 'c' },
					{ foo: '4', bar: 'd' },
				];

				controller = $controller('TimeRegistrationImportController', {
					$scope: scope
				});
				scope.init();
			}));

			describe('$scope.summaryTableParams', function() {
				it('should resolve all items if no filter is defined', function(done) {
					var deferredMock = {
						resolve: function(data) {
							expect(data.length).toBe(4);
							done();
						}
					};
					var params = {
						count: function() { return 10; },
						page: function() { return 1; },
						filter: function() { return null; },
						sorting: function() { return null; },
						total: function(t) { }
					};
					scope.filterImportedTimeRegistrations(deferredMock, params);
				});

				it('should resolve ordered items if order by is defined', function(done) {
					var deferredMock = {
						resolve: function(data) {
							expect(data[0].bar).toBe('d');
							expect(data[1].bar).toBe('c');
							expect(data[2].bar).toBe('b');
							expect(data[3].bar).toBe('a');
							done();
						}
					};
					var params = {
						count: function() { return 10; },
						page: function() { return 1; },
						filter: function() { return null; },
						sorting: function() { return '-bar'; },
						orderBy: function() { return '-bar'; },
						total: function(t) { }
					};
					scope.filterImportedTimeRegistrations(deferredMock, params);
				});

				it('should resolve filtered items if filter is defined', function(done) {
					var deferredMock = {
						resolve: function(data) {
							expect(data[0].bar).toBe('d');
							expect(data.length).toBe(1);

							done();
						}
					};
					var params = {
						count: function() { return 10; },
						page: function() { return 1; },
						filter: function() { return { bar: 'd' }; },
						sorting: function() { return null; },
						total: function(t) { }
					};
					scope.filterImportedTimeRegistrations(deferredMock, params);
				});

				it('should resolve paged data', function(done) {
					var deferredMock = {
						resolve: function(data) {
							expect(data[0].bar).toBe('c');
							expect(data[1].bar).toBe('d');
							expect(data.length).toBe(2);

							done();
						}
					};
					var params = {
						count: function() { return 2; },
						page: function() { return 2; },
						filter: function() { return null; },
						sorting: function() { return null; },
						total: function(t) { }
					};
					scope.filterImportedTimeRegistrations(deferredMock, params);
				});
			});
		});
	});
})();
