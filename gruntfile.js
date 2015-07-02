'use strict';

module.exports = function(grunt) {
	
	var watchFiles = {
		serverViews: ['app/**/views/**/*.*'],
		serverJS: ['gruntfile.js', 'server.js', 'config/**/*.js', 'app/**/*.js'],
		clientViews: ['public/modules/**/views/*.html'],
		clientJS: ['public/*.js', 'public/modules/**/*.js'],
		clientCSS: ['public/modules/**/*.css'],
		mochaTests: ['app/infrastructure/testdata.server.js', 'app/**/tests/**/*.js']
	};

	// Project Configuration
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		'file-creator': {
			restart: {
				'.restart': function(fs, fd, done) {
					fs.writeSync(fd, 'update to restart');
					done();
				}
			},
			reload: {
				'.reload': function(fs, fd, done) {
					fs.writeSync(fd, 'update to reload');
					done();
				}
			}
		},
		watch: {
			reload: {
				files: ['.reload'],
				options: { livereload: true }
			},
			serverViews: {
				files: watchFiles.serverViews,
				options: {
					livereload: true
				}
			},
			serverJS: {
				files: watchFiles.serverJS,
				tasks: ['file-creator:restart', 'lint'],
				options: {
					livereload: false
				}
			},			
			clientViews: {
				files: watchFiles.clientViews,
				options: {
					livereload: true,
				}
			},
			clientJS: {
				files: watchFiles.clientJS,
				tasks: ['fmbuild', 'file-creator:reload', 'lint'],
				options: { reload: false }
			},
			clientCSS: {
				files: watchFiles.clientCSS,
				tasks: ['fmbuild', 'file-creator:reload', 'lint'],
				options: { reload: false }
			}
		},
		jshint: {
			all: {
				src: watchFiles.clientJS.concat(watchFiles.serverJS),
				options: {
					jshintrc: true
				}
			}
		},
		csslint: {
			options: {
				csslintrc: '.csslintrc',
			},
			all: {
				src: watchFiles.clientCSS
			}
		},
		concat: {
			options: {
				sourceMap: true,
			},
			lib: {
				src: '<%= libJavaScriptFiles %>',
				dest: 'public/dist/lib.js'
			},
			fm: {
				src: '<%= applicationJavaScriptFiles %>',
				dest: 'public/dist/application.js'
			}
		},
		cssmin: {
			options: {
				keepSpecialComments: 0,
				shorthandCompacting: false,
				roundingPrecision: -1,
				advanced: false,
				sourceMap: true
			},
			lib: {
				files: {
					'public/dist/lib.min.css': '<%= libCSSFiles %>'
				}
			},
			fm: {
				files: {
					'public/dist/application.min.css': '<%= applicationCSSFiles %>'
				}
			}
		},
		uglify: {
			options: {
				preserveComments: false,
				compressor: true,
				sourceMap: true
			},
			lib: {
				files: {
					'public/dist/lib.min.js': 'public/dist/lib.js'
				}
			},
			fm: {
				options: { sourceMapIn: 'public/dist/application.js.map' },
				files: {
					'public/dist/application.min.js': 'public/dist/application.js',
					'public/dist/render.min.js': 'public/dist/render.js'
				}
			}
		},
		nodemon: {
			dev: {
				script: 'server.js',
				options: {
					nodeArgs: ['--debug'],
					watch: ['.restart'],
					callback: function (nodemon) {
						nodemon.on('restart', function () {
							setTimeout(function() {
								// when nodemon is restarted reload the webpage
								require('fs').writeFileSync('.reload', 'update to reload');
							}, 1000);
						});
					}
				}
			}
		},
		'node-inspector': {
			custom: {
				options: {
					'web-port': 1337,
					'web-host': 'localhost',
					'debug-port': 5858,
					'save-live-edit': true,
					'no-preload': true,
					'stack-trace-limit': 50,
					'hidden': []
				}
			}
		},
		concurrent: {
			default: ['nodemon', 'watch'],
			debug: ['nodemon', 'watch', 'node-inspector'],
			options: {
				logConcurrentOutput: true
			}
		},
		env: {
			test: {
				NODE_ENV: 'test'
			}
		},
		mochaTest: {
			src: watchFiles.mochaTests,
			options: {
				reporter: 'spec',
				require: 'server.js'
			}
		},
		karma: {
			unit: {
				configFile: 'karma.conf.js'
			}
		}
	});

	// Load NPM tasks
	require('load-grunt-tasks')(grunt);

	// A task for loading the configuration object
	grunt.task.registerTask('loadConfig', 'Task that loads the config into a grunt option.', function() {
		var init = require('./config/init')();
		var config = require('./config/config');

		grunt.config.set('libJavaScriptFiles', config.minification.lib.js);
		grunt.config.set('libCSSFiles', config.minification.lib.css);
		grunt.config.set('applicationJavaScriptFiles', config.minification.fm.js);
		grunt.config.set('applicationCSSFiles', config.minification.fm.css);
	});

	// Lint task(s).
	grunt.registerTask('lint', ['force:jshint', 'force:csslint']);

	// Build task(s).
	grunt.registerTask('fmbuild', ['loadConfig', 'concat:fm', 'cssmin:fm', 'uglify:fm']);
	grunt.registerTask('libbuild', ['loadConfig', 'concat:lib', 'cssmin:lib', 'uglify:lib']);
	grunt.registerTask('build', ['loadConfig', 'concat', 'cssmin', 'uglify']);


	// Default task(s).
	grunt.registerTask('default', ['lint', 'fmbuild', 'concurrent:default']);

	// Debug task.
	grunt.registerTask('debug', ['lint', 'fmbuild', 'concurrent:debug']);


	// Test tasks
	grunt.registerTask('testtravis', ['env:travis', 'mochaTest', 'karma:unit']);
	grunt.registerTask('testserver', ['lint', 'env:test','fmbuild', 'mochaTest']);
	grunt.registerTask('testclient', ['lint', 'env:test','fmbuild', 'karma:unit']);
	grunt.registerTask('test', ['lint', 'env:test','fmbuild', 'mochaTest', 'karma:unit']);
};
