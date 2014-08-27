'use strict';

var util = require('util'),
	_ = require('lodash'),
	AggregateRoot = require('./aggregateroot'),
	repository = require('./repository'),
	crypto = require('crypto');


module.exports = Account;	

function Account(id, name, firstName, lastName, email){

	this._name = '';
	this._firstName = '';
	this._lastName = '';
	this._email = '';
	this._admin = false;

	AggregateRoot.call(this, id);
	subscribeToDomainEvents(this);

	if(name && firstName && lastName && email){
		this.apply('AccountCreated', {
			name: name,
			firstName: firstName,
			lastName : lastName,
			email: email
		});	
	}
}

util.inherits(Account, AggregateRoot);

_.extend(Account.prototype, {
	getName: function(){
		return this._name;
	},
	getFirstName: function(){
		return this._firstName;
	},
	getLastName: function(){
		return this._lastName;
	},
	getFullName: function(){
		return this._firstName + ' ' + this._lastName;
	},
	getEmail: function(){
		return this._email;
	},	
	getIsAdmin: function(){
		return this._admin;
	},	
	verifyPassword: function(password){
		return this._passwordHash === hashPassword(password, this._passwordSalt);
	},		
	changePassword: function(password){
		
		var salt = new Buffer(crypto.randomBytes(16).toString('base64'), 'base64');

		this.apply('AccountPasswordChanged', {
			passwordHash: hashPassword(password, salt),
			passwordSalt: salt
		});	
	},
	makeAdmin: function(){
		this.apply('AccountMadeAdmin', { });
	},
	changeDetails: function(name, firstName, lastName, email){
		this.apply('AccountDetailsChanged', {
			name: name,
			firstName: firstName,
			lastName : lastName,
			email: email
		});			
	}
});

function hashPassword(password, salt){
	return crypto.pbkdf2Sync(password, salt, 10000, 64).toString('base64');
}

function subscribeToDomainEvents(account) {
	var _this = account;

	account.onEvent('AccountCreated', function(event) {
		_this._name = event.name;
		_this._firstName = event.firstName;
		_this._lastName = event.lastName;
		_this._email = event.email;
	});

	account.onEvent('AccountMadeAdmin', function(event) {
		_this._admin = true;
	});	

	account.onEvent('AccountPasswordChanged', function(event) {
		_this._passwordHash = event.passwordHash;
		_this._passwordSalt = event.passwordSalt;
	});		

	account.onEvent('AccountDetailsChanged', function(event) {
		_this._name = event.name;
		_this._firstName = event.firstName;
		_this._lastName = event.lastName;
		_this._email = event.email;
	});
}