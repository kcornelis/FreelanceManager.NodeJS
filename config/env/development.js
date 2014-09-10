'use strict';

module.exports = {
	db: 'mongodb://localhost/mean-dev',
	mongo: {
		eventstore: {
			db: 'mongodb://localhost/mean-dev-es',
			host: 'localhost',
			port: 27017,
			name: 'mean-dev-es'
		}
	}
};
