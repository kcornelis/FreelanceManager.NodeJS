'use strict';

module.exports = {
	db: process.env.MongoConnectionString,
	sessionSecret: process.env.SessionSecret,
	jwtSecret: process.env.JWTSecret
};