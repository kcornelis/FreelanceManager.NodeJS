'use strict';

module.exports = {
	db: 'mongodb://localhost/mean-tst',
	mongo: {
		eventstore: {
			host: 'localhost',
			port: 27017,
			name: 'mean-tst-es'
		}
	},
	port: 3001,
	app: {
		title: 'MEAN.JS - Test Environment'
	}
};
