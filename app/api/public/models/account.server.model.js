'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	AggregateRootSchema = require('./aggregateroot'),
	crypto = require('crypto'),
	uuid = require('node-uuid');

/**
 * Account Schema
 */
var AccountSchema = new AggregateRootSchema({
  	name: {
		type: String,
		trim: true
	},
	firstName: {
		type: String,
		trim: true
	},
	lastName: {
		type: String,
		trim: true
	},
	email: {
		type: String,
		unique: true,
		trim: true,
		index: true
	},
	passwordHash: {
		type: String
	},
	passwordSalt: {
		type: String
	},
	admin: {
		type: Boolean,
		default: false
	}
});

/*
 *	Helper methods
 */

function hashPassword(password, salt){
	return crypto.pbkdf2Sync(password, new Buffer(salt, 'base64'), 10000, 64).toString('base64');
}

/*
 *	Write methods
 */

AccountSchema.statics.create = function(name, firstName, lastName, email){
	
	var account = new this();

	account.name = name;
	account.firstName = firstName;
	account.lastName = lastName;
	account.email = email;

	account.apply('AccountCreated', 
	{
		name: name,
		firstName: firstName,
		lastName : lastName,
		email: email
	});		

	return account;
};

AccountSchema.methods.changePassword = function(password){
	
	var salt = crypto.randomBytes(16).toString('base64');
	var hash = hashPassword(password, salt);

	this.passwordHash = hash;
	this.passwordSalt = salt;

	this.apply('AccountPasswordChanged', 
	{
		passwordHash: hash,
		passwordSalt: salt
	});			
};

AccountSchema.methods.makeAdmin = function(){

	if(!this.admin){
		this.admin = true;
		this.apply('AccountMadeAdmin', {});
	}
};

AccountSchema.methods.changeDetails = function(name, firstName, lastName, email){

	if( this.name != name ||
		this.firstName != firstName ||
		this.lastName != lastName ||
		this.email != email)
	{
		this.name = name;
		this.firstName = firstName;
		this.lastName = lastName;
		this.email = email;

		this.apply('AccountDetailsChanged', 
		{
			name: name,
			firstName: firstName,
			lastName : lastName,
			email: email
		});	
	}
};

/*
 *	Read methods
 */

AccountSchema.methods.authenticate = function(password) {
	return this.passwordHash === hashPassword(password, this.passwordSalt);
};

AccountSchema.virtual('fullName').get(function(){
	return this.firstName + ' ' + this.lastName;
});


mongoose.model('Account', AccountSchema);
