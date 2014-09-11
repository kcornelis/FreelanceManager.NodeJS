'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
	request = require('supertest'),
	controller = require('../controllers/client'),
	config = require_config(),
	Client = require_domain('client'),
	repository = require_infrastructure('repository'),
	testdata = require_infrastructure('testdata');

/**
 * Unit tests
 */
describe('API-Write: Client Controller Integration Tests:', function() {

	describe('When an client is created by an unauthenticated person', function(){
		it('should return a 401 satus code', function(done){
			request('http://localhost:' + config.port)
				.post('/api/write/clients/create')
				.send({ name: 'John Doe' })
				.expect(401)
				.end(done);
		});
	});

	describe('When creating a client', function() {

		var response;
		var body;
		var client;

		before(function(done) {
			
			request('http://localhost:' + config.port)
				.post('/api/write/clients/create')
				.set('Authorization', testdata.normalAccountToken)
				.send({ name: 'John Doe' })
				.expect('Content-Type', /json/)
				.expect(200)
				.end(function(err, res) {
					if(err)
						throw err;

					response = res;
					body = res.body;

					repository.getById(new Client(body.id), function(err, a){
						client = a;
						done();
					});
				});
		});
		
		it('should return the id of the client', function() {
			body.id.should.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
			body.id.should.eql(client.getId());
		});

		it('should create an client with the specified name', function(){
			client.getName().should.eql('John Doe');
		});			
	});
});
