'use strict';
(function () {
  /**
     * @ngdoc overview
     * @name ngStorage
     */
  angular.module('ngStorage', []).factory('$localStorage', _storageFactory('localStorage')).factory('$sessionStorage', _storageFactory('sessionStorage'));
  function _storageFactory(storageType) {
    return [
      '$rootScope',
      '$window',
      function ($rootScope, $window) {
        // #9: Assign a placeholder object if Web Storage is unavailable to prevent breaking the entire AngularJS app
        var webStorage = $window[storageType] || (console.warn('This browser does not support Web Storage!'), {}), $storage = {
            $default: function (items) {
              for (var k in items) {
                angular.isDefined($storage[k]) || ($storage[k] = items[k]);
              }
              return $storage;
            },
            $reset: function (items) {
              for (var k in $storage) {
                '$' === k[0] || delete $storage[k];
              }
              return $storage.$default(items);
            }
          }, _last$storage, _debounce;
        for (var i = 0, k; i < webStorage.length; i++) {
          // #8, #10: `webStorage.key(i)` may be an empty string (or throw an exception in IE9 if `webStorage` is empty)
          (k = webStorage.key(i)) && 'ngStorage-' === k.slice(0, 10) && ($storage[k.slice(10)] = angular.fromJson(webStorage.getItem(k)));
        }
        _last$storage = angular.copy($storage);
        $rootScope.$watch(function () {
          _debounce || (_debounce = setTimeout(function () {
            _debounce = null;
            if (!angular.equals($storage, _last$storage)) {
              angular.forEach($storage, function (v, k) {
                angular.isDefined(v) && '$' !== k[0] && webStorage.setItem('ngStorage-' + k, angular.toJson(v));
                delete _last$storage[k];
              });
              for (var k in _last$storage) {
                webStorage.removeItem('ngStorage-' + k);
              }
              _last$storage = angular.copy($storage);
            }
          }, 100));
        });
        // #6: Use `$window.addEventListener` instead of `angular.element` to avoid the jQuery-specific `event.originalEvent`
        'localStorage' === storageType && $window.addEventListener && $window.addEventListener('storage', function (event) {
          if ('ngStorage-' === event.key.slice(0, 10)) {
            event.newValue ? $storage[event.key.slice(10)] = angular.fromJson(event.newValue) : delete $storage[event.key.slice(10)];
            _last$storage = angular.copy($storage);
            $rootScope.$apply();
          }
        });
        return $storage;
      }
    ];
  }
}());/**
 * oclazyload - Load modules on demand (lazy load) with angularJS
 * @version v0.5.1
 * @link https://github.com/ocombe/ocLazyLoad
 * @license MIT
 * @author Olivier Combe <olivier.combe@gmail.com>
 */
(function () {
  'use strict';
  var regModules = ['ng'], regInvokes = {}, regConfigs = [], justLoaded = [], runBlocks = {}, ocLazyLoad = angular.module('oc.lazyLoad', ['ng']), broadcast = angular.noop;
  ocLazyLoad.provider('$ocLazyLoad', [
    '$controllerProvider',
    '$provide',
    '$compileProvider',
    '$filterProvider',
    '$injector',
    '$animateProvider',
    function ($controllerProvider, $provide, $compileProvider, $filterProvider, $injector, $animateProvider) {
      var modules = {}, providers = {
          $controllerProvider: $controllerProvider,
          $compileProvider: $compileProvider,
          $filterProvider: $filterProvider,
          $provide: $provide,
          $injector: $injector,
          $animateProvider: $animateProvider
        }, anchor = document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0], jsLoader, cssLoader, templatesLoader, debug = false, events = false;
      // Let's get the list of loaded modules & components
      init(angular.element(window.document));
      this.$get = [
        '$log',
        '$q',
        '$templateCache',
        '$http',
        '$rootElement',
        '$rootScope',
        '$cacheFactory',
        '$interval',
        function ($log, $q, $templateCache, $http, $rootElement, $rootScope, $cacheFactory, $interval) {
          var instanceInjector, filesCache = $cacheFactory('ocLazyLoad'), uaCssChecked = false, useCssLoadPatch = false;
          if (!debug) {
            $log = {};
            $log['error'] = angular.noop;
            $log['warn'] = angular.noop;
            $log['info'] = angular.noop;
          }
          // Make this lazy because at the moment that $get() is called the instance injector hasn't been assigned to the rootElement yet
          providers.getInstanceInjector = function () {
            return instanceInjector ? instanceInjector : instanceInjector = $rootElement.data('$injector') || angular.injector();
          };
          broadcast = function broadcast(eventName, params) {
            if (events) {
              $rootScope.$broadcast(eventName, params);
            }
            if (debug) {
              $log.info(eventName, params);
            }
          };
          /**
         * Load a js/css file
         * @param type
         * @param path
         * @returns promise
         */
          var buildElement = function buildElement(type, path, params) {
            var deferred = $q.defer(), el, loaded, cacheBuster = function cacheBuster(url) {
                var dc = new Date().getTime();
                if (url.indexOf('?') >= 0) {
                  if (url.substring(0, url.length - 1) === '&') {
                    return url + '_dc=' + dc;
                  }
                  return url + '&_dc=' + dc;
                } else {
                  return url + '?_dc=' + dc;
                }
              };
            // Store the promise early so the file load can be detected by other parallel lazy loads
            // (ie: multiple routes on one page) a 'true' value isn't sufficient
            // as it causes false positive load results.
            if (angular.isUndefined(filesCache.get(path))) {
              filesCache.put(path, deferred.promise);
            }
            // Switch in case more content types are added later
            switch (type) {
            case 'css':
              el = document.createElement('link');
              el.type = 'text/css';
              el.rel = 'stylesheet';
              el.href = params.cache === false ? cacheBuster(path) : path;
              break;
            case 'js':
              el = document.createElement('script');
              el.src = params.cache === false ? cacheBuster(path) : path;
              break;
            default:
              deferred.reject(new Error('Requested type "' + type + '" is not known. Could not inject "' + path + '"'));
              break;
            }
            el.onload = el['onreadystatechange'] = function (e) {
              if (el['readyState'] && !/^c|loade/.test(el['readyState']) || loaded)
                return;
              el.onload = el['onreadystatechange'] = null;
              loaded = 1;
              broadcast('ocLazyLoad.fileLoaded', path);
              deferred.resolve();
            };
            el.onerror = function (e) {
              deferred.reject(new Error('Unable to load ' + path));
            };
            el.async = params.serie ? 0 : 1;
            var insertBeforeElem = anchor.lastChild;
            if (params.insertBefore) {
              var element = angular.element(params.insertBefore);
              if (element && element.length > 0) {
                insertBeforeElem = element[0];
              }
            }
            anchor.insertBefore(el, insertBeforeElem);
            /*
           The event load or readystatechange doesn't fire in:
           - iOS < 6       (default mobile browser)
           - Android < 4.4 (default mobile browser)
           - Safari < 6    (desktop browser)
           */
            if (type == 'css') {
              if (!uaCssChecked) {
                var ua = navigator.userAgent.toLowerCase();
                // iOS < 6
                if (/iP(hone|od|ad)/.test(navigator.platform)) {
                  var v = navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/);
                  var iOSVersion = parseFloat([
                      parseInt(v[1], 10),
                      parseInt(v[2], 10),
                      parseInt(v[3] || 0, 10)
                    ].join('.'));
                  useCssLoadPatch = iOSVersion < 6;
                } else if (ua.indexOf('android') > -1) {
                  // Android < 4.4
                  var androidVersion = parseFloat(ua.slice(ua.indexOf('android') + 8));
                  useCssLoadPatch = androidVersion < 4.4;
                } else if (ua.indexOf('safari') > -1 && ua.indexOf('chrome') == -1) {
                  var safariVersion = parseFloat(ua.match(/version\/([\.\d]+)/i)[1]);
                  useCssLoadPatch = safariVersion < 6;
                }
              }
              if (useCssLoadPatch) {
                var tries = 1000;
                // * 20 = 20000 miliseconds
                var interval = $interval(function () {
                    try {
                      el.sheet.cssRules;
                      $interval.cancel(interval);
                      el.onload();
                    } catch (e) {
                      if (--tries <= 0) {
                        el.onerror();
                      }
                    }
                  }, 20);
              }
            }
            return deferred.promise;
          };
          if (angular.isUndefined(jsLoader)) {
            /**
           * jsLoader function
           * @type Function
           * @param paths array list of js files to load
           * @param callback to call when everything is loaded. We use a callback and not a promise
           * @param params object config parameters
           * because the user can overwrite jsLoader and it will probably not use promises :(
           */
            jsLoader = function (paths, callback, params) {
              var promises = [];
              angular.forEach(paths, function loading(path) {
                promises.push(buildElement('js', path, params));
              });
              $q.all(promises).then(function success() {
                callback();
              }, function error(err) {
                callback(err);
              });
            };
            jsLoader.ocLazyLoadLoader = true;
          }
          if (angular.isUndefined(cssLoader)) {
            /**
           * cssLoader function
           * @type Function
           * @param paths array list of css files to load
           * @param callback to call when everything is loaded. We use a callback and not a promise
           * @param params object config parameters
           * because the user can overwrite cssLoader and it will probably not use promises :(
           */
            cssLoader = function (paths, callback, params) {
              var promises = [];
              angular.forEach(paths, function loading(path) {
                promises.push(buildElement('css', path, params));
              });
              $q.all(promises).then(function success() {
                callback();
              }, function error(err) {
                callback(err);
              });
            };
            cssLoader.ocLazyLoadLoader = true;
          }
          if (angular.isUndefined(templatesLoader)) {
            /**
           * templatesLoader function
           * @type Function
           * @param paths array list of css files to load
           * @param callback to call when everything is loaded. We use a callback and not a promise
           * @param params object config parameters for $http
           * because the user can overwrite templatesLoader and it will probably not use promises :(
           */
            templatesLoader = function (paths, callback, params) {
              var promises = [];
              angular.forEach(paths, function (url) {
                var deferred = $q.defer();
                promises.push(deferred.promise);
                $http.get(url, params).success(function (data) {
                  if (angular.isString(data) && data.length > 0) {
                    angular.forEach(angular.element(data), function (node) {
                      if (node.nodeName === 'SCRIPT' && node.type === 'text/ng-template') {
                        $templateCache.put(node.id, node.innerHTML);
                      }
                    });
                  }
                  if (angular.isUndefined(filesCache.get(url))) {
                    filesCache.put(url, true);
                  }
                  deferred.resolve();
                }).error(function (err) {
                  deferred.reject(new Error('Unable to load template file "' + url + '": ' + err));
                });
              });
              return $q.all(promises).then(function success() {
                callback();
              }, function error(err) {
                callback(err);
              });
            };
            templatesLoader.ocLazyLoadLoader = true;
          }
          var filesLoader = function (config, params) {
            var cssFiles = [], templatesFiles = [], jsFiles = [], promises = [], cachePromise = null;
            angular.extend(params || {}, config);
            var pushFile = function (path) {
              cachePromise = filesCache.get(path);
              if (angular.isUndefined(cachePromise) || params.cache === false) {
                if (/\.css[^\.]*$/.test(path) && cssFiles.indexOf(path) === -1) {
                  cssFiles.push(path);
                } else if (/\.(htm|html)[^\.]*$/.test(path) && templatesFiles.indexOf(path) === -1) {
                  templatesFiles.push(path);
                } else if (jsFiles.indexOf(path) === -1) {
                  jsFiles.push(path);
                }
              } else if (cachePromise) {
                promises.push(cachePromise);
              }
            };
            if (params.serie) {
              pushFile(params.files.shift());
            } else {
              angular.forEach(params.files, function (path) {
                pushFile(path);
              });
            }
            if (cssFiles.length > 0) {
              var cssDeferred = $q.defer();
              cssLoader(cssFiles, function (err) {
                if (angular.isDefined(err) && cssLoader.hasOwnProperty('ocLazyLoadLoader')) {
                  $log.error(err);
                  cssDeferred.reject(err);
                } else {
                  cssDeferred.resolve();
                }
              }, params);
              promises.push(cssDeferred.promise);
            }
            if (templatesFiles.length > 0) {
              var templatesDeferred = $q.defer();
              templatesLoader(templatesFiles, function (err) {
                if (angular.isDefined(err) && templatesLoader.hasOwnProperty('ocLazyLoadLoader')) {
                  $log.error(err);
                  templatesDeferred.reject(err);
                } else {
                  templatesDeferred.resolve();
                }
              }, params);
              promises.push(templatesDeferred.promise);
            }
            if (jsFiles.length > 0) {
              var jsDeferred = $q.defer();
              jsLoader(jsFiles, function (err) {
                if (angular.isDefined(err) && jsLoader.hasOwnProperty('ocLazyLoadLoader')) {
                  $log.error(err);
                  jsDeferred.reject(err);
                } else {
                  jsDeferred.resolve();
                }
              }, params);
              promises.push(jsDeferred.promise);
            }
            if (params.serie && params.files.length > 0) {
              return $q.all(promises).then(function success() {
                return filesLoader(config, params);
              });
            } else {
              return $q.all(promises);
            }
          };
          return {
            getModuleConfig: function (moduleName) {
              if (!angular.isString(moduleName)) {
                throw new Error('You need to give the name of the module to get');
              }
              if (!modules[moduleName]) {
                return null;
              }
              return modules[moduleName];
            },
            setModuleConfig: function (moduleConfig) {
              if (!angular.isObject(moduleConfig)) {
                throw new Error('You need to give the module config object to set');
              }
              modules[moduleConfig.name] = moduleConfig;
              return moduleConfig;
            },
            getModules: function () {
              return regModules;
            },
            isLoaded: function (modulesNames) {
              var moduleLoaded = function (module) {
                var isLoaded = regModules.indexOf(module) > -1;
                if (!isLoaded) {
                  isLoaded = !!moduleExists(module);
                }
                return isLoaded;
              };
              if (angular.isString(modulesNames)) {
                modulesNames = [modulesNames];
              }
              if (angular.isArray(modulesNames)) {
                var i, len;
                for (i = 0, len = modulesNames.length; i < len; i++) {
                  if (!moduleLoaded(modulesNames[i])) {
                    return false;
                  }
                }
                return true;
              } else {
                throw new Error('You need to define the module(s) name(s)');
              }
            },
            load: function (module, params) {
              var self = this, config = null, moduleCache = [], deferredList = [], deferred = $q.defer(), moduleName, errText;
              if (angular.isUndefined(params)) {
                params = {};
              }
              // If module is an array, break it down
              if (angular.isArray(module)) {
                // Resubmit each entry as a single module
                angular.forEach(module, function (m) {
                  if (m) {
                    deferredList.push(self.load(m, params));
                  }
                });
                // Resolve the promise once everything has loaded
                $q.all(deferredList).then(function success() {
                  deferred.resolve(module);
                }, function error(err) {
                  deferred.reject(err);
                });
                return deferred.promise;
              }
              moduleName = getModuleName(module);
              // Get or Set a configuration depending on what was passed in
              if (typeof module === 'string') {
                config = self.getModuleConfig(module);
                if (!config) {
                  config = { files: [module] };
                  moduleName = null;
                }
              } else if (typeof module === 'object') {
                config = self.setModuleConfig(module);
              }
              if (config === null) {
                errText = 'Module "' + moduleName + '" is not configured, cannot load.';
                $log.error(errText);
                deferred.reject(new Error(errText));
              } else {
                // deprecated
                if (angular.isDefined(config.template)) {
                  if (angular.isUndefined(config.files)) {
                    config.files = [];
                  }
                  if (angular.isString(config.template)) {
                    config.files.push(config.template);
                  } else if (angular.isArray(config.template)) {
                    config.files.concat(config.template);
                  }
                }
              }
              moduleCache.push = function (value) {
                if (this.indexOf(value) === -1) {
                  Array.prototype.push.apply(this, arguments);
                }
              };
              // If this module has been loaded before, re-use it.
              if (angular.isDefined(moduleName) && moduleExists(moduleName) && regModules.indexOf(moduleName) !== -1) {
                moduleCache.push(moduleName);
                // if we don't want to load new files, resolve here
                if (angular.isUndefined(config.files)) {
                  deferred.resolve();
                  return deferred.promise;
                }
              }
              var localParams = {};
              angular.extend(localParams, params, config);
              var loadDependencies = function loadDependencies(module) {
                var moduleName, loadedModule, requires, diff, promisesList = [];
                moduleName = getModuleName(module);
                if (moduleName === null) {
                  return $q.when();
                } else {
                  try {
                    loadedModule = getModule(moduleName);
                  } catch (e) {
                    var deferred = $q.defer();
                    $log.error(e.message);
                    deferred.reject(e);
                    return deferred.promise;
                  }
                  requires = getRequires(loadedModule);
                }
                angular.forEach(requires, function (requireEntry) {
                  // If no configuration is provided, try and find one from a previous load.
                  // If there isn't one, bail and let the normal flow run
                  if (typeof requireEntry === 'string') {
                    var config = self.getModuleConfig(requireEntry);
                    if (config === null) {
                      moduleCache.push(requireEntry);
                      // We don't know about this module, but something else might, so push it anyway.
                      return;
                    }
                    requireEntry = config;
                  }
                  // Check if this dependency has been loaded previously
                  if (moduleExists(requireEntry.name)) {
                    if (typeof module !== 'string') {
                      // compare against the already loaded module to see if the new definition adds any new files
                      diff = requireEntry.files.filter(function (n) {
                        return self.getModuleConfig(requireEntry.name).files.indexOf(n) < 0;
                      });
                      // If the module was redefined, advise via the console
                      if (diff.length !== 0) {
                        $log.warn('Module "', moduleName, '" attempted to redefine configuration for dependency. "', requireEntry.name, '"\n Additional Files Loaded:', diff);
                      }
                      // Push everything to the file loader, it will weed out the duplicates.
                      promisesList.push(filesLoader(requireEntry.files, localParams).then(function () {
                        return loadDependencies(requireEntry);
                      }));
                    }
                    return;
                  } else if (typeof requireEntry === 'object') {
                    if (requireEntry.hasOwnProperty('name') && requireEntry['name']) {
                      // The dependency doesn't exist in the module cache and is a new configuration, so store and push it.
                      self.setModuleConfig(requireEntry);
                      moduleCache.push(requireEntry['name']);
                    }
                    // CSS Loading Handler
                    if (requireEntry.hasOwnProperty('css') && requireEntry['css'].length !== 0) {
                      // Locate the document insertion point
                      angular.forEach(requireEntry['css'], function (path) {
                        buildElement('css', path, localParams);
                      });
                    }  // CSS End.
                  }
                  // Check if the dependency has any files that need to be loaded. If there are, push a new promise to the promise list.
                  if (requireEntry.hasOwnProperty('files') && requireEntry.files.length !== 0) {
                    if (requireEntry.files) {
                      promisesList.push(filesLoader(requireEntry, localParams).then(function () {
                        return loadDependencies(requireEntry);
                      }));
                    }
                  }
                });
                // Create a wrapper promise to watch the promise list and resolve it once everything is done.
                return $q.all(promisesList);
              };
              filesLoader(config, localParams).then(function success() {
                if (moduleName === null) {
                  deferred.resolve(module);
                } else {
                  moduleCache.push(moduleName);
                  loadDependencies(moduleName).then(function success() {
                    try {
                      justLoaded = [];
                      register(providers, moduleCache, localParams);
                    } catch (e) {
                      $log.error(e.message);
                      deferred.reject(e);
                      return;
                    }
                    deferred.resolve(module);
                  }, function error(err) {
                    deferred.reject(err);
                  });
                }
              }, function error(err) {
                deferred.reject(err);
              });
              return deferred.promise;
            }
          };
        }
      ];
      this.config = function (config) {
        if (angular.isDefined(config.jsLoader) || angular.isDefined(config.asyncLoader)) {
          if (!angular.isFunction(config.jsLoader || config.asyncLoader)) {
            throw 'The js loader needs to be a function';
          }
          jsLoader = config.jsLoader || config.asyncLoader;
        }
        if (angular.isDefined(config.cssLoader)) {
          if (!angular.isFunction(config.cssLoader)) {
            throw 'The css loader needs to be a function';
          }
          cssLoader = config.cssLoader;
        }
        if (angular.isDefined(config.templatesLoader)) {
          if (!angular.isFunction(config.templatesLoader)) {
            throw 'The template loader needs to be a function';
          }
          templatesLoader = config.templatesLoader;
        }
        // for bootstrap apps, we need to define the main module name
        if (angular.isDefined(config.loadedModules)) {
          var addRegModule = function (loadedModule) {
            if (regModules.indexOf(loadedModule) < 0) {
              regModules.push(loadedModule);
              angular.forEach(angular.module(loadedModule).requires, addRegModule);
            }
          };
          angular.forEach(config.loadedModules, addRegModule);
        }
        // If we want to define modules configs
        if (angular.isDefined(config.modules)) {
          if (angular.isArray(config.modules)) {
            angular.forEach(config.modules, function (moduleConfig) {
              modules[moduleConfig.name] = moduleConfig;
            });
          } else {
            modules[config.modules.name] = config.modules;
          }
        }
        if (angular.isDefined(config.debug)) {
          debug = config.debug;
        }
        if (angular.isDefined(config.events)) {
          events = config.events;
        }
      };
    }
  ]);
  ocLazyLoad.directive('ocLazyLoad', [
    '$ocLazyLoad',
    '$compile',
    '$animate',
    '$parse',
    function ($ocLazyLoad, $compile, $animate, $parse) {
      return {
        restrict: 'A',
        terminal: true,
        priority: 1000,
        compile: function (element, attrs) {
          // we store the content and remove it before compilation
          var content = element[0].innerHTML;
          element.html('');
          return function ($scope, $element, $attr) {
            var model = $parse($attr.ocLazyLoad);
            $scope.$watch(function () {
              // it can be a module name (string), an object, an array, or a scope reference to any of this
              return model($scope) || $attr.ocLazyLoad;
            }, function (moduleName) {
              if (angular.isDefined(moduleName)) {
                $ocLazyLoad.load(moduleName).then(function success(moduleConfig) {
                  $animate.enter($compile(content)($scope), null, $element);
                });
              }
            }, true);
          };
        }
      };
    }
  ]);
  /**
   * Get the list of required modules/services/... for this module
   * @param module
   * @returns {Array}
   */
  function getRequires(module) {
    var requires = [];
    angular.forEach(module.requires, function (requireModule) {
      if (regModules.indexOf(requireModule) === -1) {
        requires.push(requireModule);
      }
    });
    return requires;
  }
  /**
   * Check if a module exists and returns it if it does
   * @param moduleName
   * @returns {boolean}
   */
  function moduleExists(moduleName) {
    try {
      return angular.module(moduleName);
    } catch (e) {
      if (/No module/.test(e) || e.message.indexOf('$injector:nomod') > -1) {
        return false;
      }
    }
  }
  function getModule(moduleName) {
    try {
      return angular.module(moduleName);
    } catch (e) {
      // this error message really suxx
      if (/No module/.test(e) || e.message.indexOf('$injector:nomod') > -1) {
        e.message = 'The module "' + moduleName + '" that you are trying to load does not exist. ' + e.message;
      }
      throw e;
    }
  }
  function invokeQueue(providers, queue, moduleName, reconfig) {
    if (!queue) {
      return;
    }
    var i, len, args, provider;
    for (i = 0, len = queue.length; i < len; i++) {
      args = queue[i];
      if (angular.isArray(args)) {
        if (providers !== null) {
          if (providers.hasOwnProperty(args[0])) {
            provider = providers[args[0]];
          } else {
            throw new Error('unsupported provider ' + args[0]);
          }
        }
        var isNew = registerInvokeList(args, moduleName);
        if (args[1] !== 'invoke') {
          if (isNew && angular.isDefined(provider)) {
            provider[args[1]].apply(provider, args[2]);
          }
        } else {
          // config block
          var callInvoke = function (fct) {
            var invoked = regConfigs.indexOf(moduleName + '-' + fct);
            if (invoked === -1 || reconfig) {
              if (invoked === -1) {
                regConfigs.push(moduleName + '-' + fct);
              }
              if (angular.isDefined(provider)) {
                provider[args[1]].apply(provider, args[2]);
              }
            }
          };
          if (angular.isFunction(args[2][0])) {
            callInvoke(args[2][0]);
          } else if (angular.isArray(args[2][0])) {
            for (var j = 0, jlen = args[2][0].length; j < jlen; j++) {
              if (angular.isFunction(args[2][0][j])) {
                callInvoke(args[2][0][j]);
              }
            }
          }
        }
      }
    }
  }
  /**
   * Register a new module and load it
   * @param providers
   * @param registerModules
   * @returns {*}
   */
  function register(providers, registerModules, params) {
    if (registerModules) {
      var k, r, moduleName, moduleFn, tempRunBlocks = [];
      for (k = registerModules.length - 1; k >= 0; k--) {
        moduleName = registerModules[k];
        if (typeof moduleName !== 'string') {
          moduleName = getModuleName(moduleName);
        }
        if (!moduleName || justLoaded.indexOf(moduleName) !== -1) {
          continue;
        }
        var newModule = regModules.indexOf(moduleName) === -1;
        moduleFn = angular.module(moduleName);
        if (newModule) {
          // new module
          regModules.push(moduleName);
          register(providers, moduleFn.requires, params);
        }
        if (moduleFn._runBlocks.length > 0) {
          // new run blocks detected! Replace the old ones (if existing)
          runBlocks[moduleName] = [];
          while (moduleFn._runBlocks.length > 0) {
            runBlocks[moduleName].push(moduleFn._runBlocks.shift());
          }
        }
        if (angular.isDefined(runBlocks[moduleName]) && (newModule || params.rerun)) {
          tempRunBlocks = tempRunBlocks.concat(runBlocks[moduleName]);
        }
        invokeQueue(providers, moduleFn._invokeQueue, moduleName, params.reconfig);
        invokeQueue(providers, moduleFn._configBlocks, moduleName, params.reconfig);
        // angular 1.3+
        broadcast(newModule ? 'ocLazyLoad.moduleLoaded' : 'ocLazyLoad.moduleReloaded', moduleName);
        registerModules.pop();
        justLoaded.push(moduleName);
      }
      // execute the run blocks at the end
      var instanceInjector = providers.getInstanceInjector();
      angular.forEach(tempRunBlocks, function (fn) {
        instanceInjector.invoke(fn);
      });
    }
  }
  /**
   * Register an invoke
   * @param args
   * @returns {*}
   */
  function registerInvokeList(args, moduleName) {
    var invokeList = args[2][0], type = args[1], newInvoke = false;
    if (angular.isUndefined(regInvokes[moduleName])) {
      regInvokes[moduleName] = {};
    }
    if (angular.isUndefined(regInvokes[moduleName][type])) {
      regInvokes[moduleName][type] = [];
    }
    var onInvoke = function (invokeName) {
      newInvoke = true;
      regInvokes[moduleName][type].push(invokeName);
      broadcast('ocLazyLoad.componentLoaded', [
        moduleName,
        type,
        invokeName
      ]);
    };
    if (angular.isString(invokeList) && regInvokes[moduleName][type].indexOf(invokeList) === -1) {
      onInvoke(invokeList);
    } else if (angular.isObject(invokeList)) {
      angular.forEach(invokeList, function (invoke) {
        if (angular.isString(invoke) && regInvokes[moduleName][type].indexOf(invoke) === -1) {
          onInvoke(invoke);
        }
      });
    } else {
      return false;
    }
    return newInvoke;
  }
  function getModuleName(module) {
    var moduleName = null;
    if (angular.isString(module)) {
      moduleName = module;
    } else if (angular.isObject(module) && module.hasOwnProperty('name') && angular.isString(module.name)) {
      moduleName = module.name;
    }
    return moduleName;
  }
  /**
   * Get the list of existing registered modules
   * @param element
   */
  function init(element) {
    var elements = [element], appElement, moduleName, names = [
        'ng:app',
        'ng-app',
        'x-ng-app',
        'data-ng-app'
      ], NG_APP_CLASS_REGEXP = /\sng[:\-]app(:\s*([\w\d_]+);?)?\s/;
    function append(elm) {
      return elm && elements.push(elm);
    }
    angular.forEach(names, function (name) {
      names[name] = true;
      append(document.getElementById(name));
      name = name.replace(':', '\\:');
      if (element[0].querySelectorAll) {
        angular.forEach(element[0].querySelectorAll('.' + name), append);
        angular.forEach(element[0].querySelectorAll('.' + name + '\\:'), append);
        angular.forEach(element[0].querySelectorAll('[' + name + ']'), append);
      }
    });
    //TODO: search the script tags for angular.bootstrap
    angular.forEach(elements, function (elm) {
      if (!appElement) {
        var className = ' ' + element.className + ' ';
        var match = NG_APP_CLASS_REGEXP.exec(className);
        if (match) {
          appElement = elm;
          moduleName = (match[2] || '').replace(/\s+/g, ',');
        } else {
          angular.forEach(elm.attributes, function (attr) {
            if (!appElement && names[attr.name]) {
              appElement = elm;
              moduleName = attr.value;
            }
          });
        }
      }
    });
    if (appElement) {
      (function addReg(moduleName) {
        if (regModules.indexOf(moduleName) === -1) {
          // register existing modules
          regModules.push(moduleName);
          var mainModule = angular.module(moduleName);
          // register existing components (directives, services, ...)
          invokeQueue(null, mainModule._invokeQueue, moduleName);
          invokeQueue(null, mainModule._configBlocks, moduleName);
          // angular 1.3+
          angular.forEach(mainModule.requires, addReg);
        }
      }(moduleName));
    }
  }
  // Array.indexOf polyfill for IE8
  if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (searchElement, fromIndex) {
      var k;
      // 1. Let O be the result of calling ToObject passing
      //    the this value as the argument.
      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }
      var O = Object(this);
      // 2. Let lenValue be the result of calling the Get
      //    internal method of O with the argument "length".
      // 3. Let len be ToUint32(lenValue).
      var len = O.length >>> 0;
      // 4. If len is 0, return -1.
      if (len === 0) {
        return -1;
      }
      // 5. If argument fromIndex was passed let n be
      //    ToInteger(fromIndex); else let n be 0.
      var n = +fromIndex || 0;
      if (Math.abs(n) === Infinity) {
        n = 0;
      }
      // 6. If n >= len, return -1.
      if (n >= len) {
        return -1;
      }
      // 7. If n >= 0, then Let k be n.
      // 8. Else, n<0, Let k be len - abs(n).
      //    If k is less than 0, then let k be 0.
      k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
      // 9. Repeat, while k < len
      while (k < len) {
        // a. Let Pk be ToString(k).
        //   This is implicit for LHS operands of the in operator
        // b. Let kPresent be the result of calling the
        //    HasProperty internal method of O with argument Pk.
        //   This step can be combined with c
        // c. If kPresent is true, then
        //    i.  Let elementK be the result of calling the Get
        //        internal method of O with the argument ToString(k).
        //   ii.  Let same be the result of applying the
        //        Strict Equality Comparison Algorithm to
        //        searchElement and elementK.
        //  iii.  If same is true, return k.
        if (k in O && O[k] === searchElement) {
          return k;
        }
        k++;
      }
      return -1;
    };
  }
}());/*
 * angular-ui-bootstrap
 * http://angular-ui.github.io/bootstrap/

 * Version: 0.12.0 - 2014-11-16
 * License: MIT
 */
angular.module('ui.bootstrap', [
  'ui.bootstrap.tpls',
  'ui.bootstrap.transition',
  'ui.bootstrap.collapse',
  'ui.bootstrap.accordion',
  'ui.bootstrap.alert',
  'ui.bootstrap.bindHtml',
  'ui.bootstrap.buttons',
  'ui.bootstrap.carousel',
  'ui.bootstrap.dateparser',
  'ui.bootstrap.position',
  'ui.bootstrap.datepicker',
  'ui.bootstrap.dropdown',
  'ui.bootstrap.modal',
  'ui.bootstrap.pagination',
  'ui.bootstrap.tooltip',
  'ui.bootstrap.popover',
  'ui.bootstrap.progressbar',
  'ui.bootstrap.rating',
  'ui.bootstrap.tabs',
  'ui.bootstrap.timepicker',
  'ui.bootstrap.typeahead'
]);
angular.module('ui.bootstrap.tpls', [
  'template/accordion/accordion-group.html',
  'template/accordion/accordion.html',
  'template/alert/alert.html',
  'template/carousel/carousel.html',
  'template/carousel/slide.html',
  'template/datepicker/datepicker.html',
  'template/datepicker/day.html',
  'template/datepicker/month.html',
  'template/datepicker/popup.html',
  'template/datepicker/year.html',
  'template/modal/backdrop.html',
  'template/modal/window.html',
  'template/pagination/pager.html',
  'template/pagination/pagination.html',
  'template/tooltip/tooltip-html-unsafe-popup.html',
  'template/tooltip/tooltip-popup.html',
  'template/popover/popover.html',
  'template/progressbar/bar.html',
  'template/progressbar/progress.html',
  'template/progressbar/progressbar.html',
  'template/rating/rating.html',
  'template/tabs/tab.html',
  'template/tabs/tabset.html',
  'template/timepicker/timepicker.html',
  'template/typeahead/typeahead-match.html',
  'template/typeahead/typeahead-popup.html'
]);
angular.module('ui.bootstrap.transition', []).factory('$transition', [
  '$q',
  '$timeout',
  '$rootScope',
  function ($q, $timeout, $rootScope) {
    var $transition = function (element, trigger, options) {
      options = options || {};
      var deferred = $q.defer();
      var endEventName = $transition[options.animation ? 'animationEndEventName' : 'transitionEndEventName'];
      var transitionEndHandler = function (event) {
        $rootScope.$apply(function () {
          element.unbind(endEventName, transitionEndHandler);
          deferred.resolve(element);
        });
      };
      if (endEventName) {
        element.bind(endEventName, transitionEndHandler);
      }
      // Wrap in a timeout to allow the browser time to update the DOM before the transition is to occur
      $timeout(function () {
        if (angular.isString(trigger)) {
          element.addClass(trigger);
        } else if (angular.isFunction(trigger)) {
          trigger(element);
        } else if (angular.isObject(trigger)) {
          element.css(trigger);
        }
        //If browser does not support transitions, instantly resolve
        if (!endEventName) {
          deferred.resolve(element);
        }
      });
      // Add our custom cancel function to the promise that is returned
      // We can call this if we are about to run a new transition, which we know will prevent this transition from ending,
      // i.e. it will therefore never raise a transitionEnd event for that transition
      deferred.promise.cancel = function () {
        if (endEventName) {
          element.unbind(endEventName, transitionEndHandler);
        }
        deferred.reject('Transition cancelled');
      };
      return deferred.promise;
    };
    // Work out the name of the transitionEnd event
    var transElement = document.createElement('trans');
    var transitionEndEventNames = {
        'WebkitTransition': 'webkitTransitionEnd',
        'MozTransition': 'transitionend',
        'OTransition': 'oTransitionEnd',
        'transition': 'transitionend'
      };
    var animationEndEventNames = {
        'WebkitTransition': 'webkitAnimationEnd',
        'MozTransition': 'animationend',
        'OTransition': 'oAnimationEnd',
        'transition': 'animationend'
      };
    function findEndEventName(endEventNames) {
      for (var name in endEventNames) {
        if (transElement.style[name] !== undefined) {
          return endEventNames[name];
        }
      }
    }
    $transition.transitionEndEventName = findEndEventName(transitionEndEventNames);
    $transition.animationEndEventName = findEndEventName(animationEndEventNames);
    return $transition;
  }
]);
angular.module('ui.bootstrap.collapse', ['ui.bootstrap.transition']).directive('collapse', [
  '$transition',
  function ($transition) {
    return {
      link: function (scope, element, attrs) {
        var initialAnimSkip = true;
        var currentTransition;
        function doTransition(change) {
          var newTransition = $transition(element, change);
          if (currentTransition) {
            currentTransition.cancel();
          }
          currentTransition = newTransition;
          newTransition.then(newTransitionDone, newTransitionDone);
          return newTransition;
          function newTransitionDone() {
            // Make sure it's this transition, otherwise, leave it alone.
            if (currentTransition === newTransition) {
              currentTransition = undefined;
            }
          }
        }
        function expand() {
          if (initialAnimSkip) {
            initialAnimSkip = false;
            expandDone();
          } else {
            element.removeClass('collapse').addClass('collapsing');
            doTransition({ height: element[0].scrollHeight + 'px' }).then(expandDone);
          }
        }
        function expandDone() {
          element.removeClass('collapsing');
          element.addClass('collapse in');
          element.css({ height: 'auto' });
        }
        function collapse() {
          if (initialAnimSkip) {
            initialAnimSkip = false;
            collapseDone();
            element.css({ height: 0 });
          } else {
            // CSS transitions don't work with height: auto, so we have to manually change the height to a specific value
            element.css({ height: element[0].scrollHeight + 'px' });
            //trigger reflow so a browser realizes that height was updated from auto to a specific value
            var x = element[0].offsetWidth;
            element.removeClass('collapse in').addClass('collapsing');
            doTransition({ height: 0 }).then(collapseDone);
          }
        }
        function collapseDone() {
          element.removeClass('collapsing');
          element.addClass('collapse');
        }
        scope.$watch(attrs.collapse, function (shouldCollapse) {
          if (shouldCollapse) {
            collapse();
          } else {
            expand();
          }
        });
      }
    };
  }
]);
angular.module('ui.bootstrap.accordion', ['ui.bootstrap.collapse']).constant('accordionConfig', { closeOthers: true }).controller('AccordionController', [
  '$scope',
  '$attrs',
  'accordionConfig',
  function ($scope, $attrs, accordionConfig) {
    // This array keeps track of the accordion groups
    this.groups = [];
    // Ensure that all the groups in this accordion are closed, unless close-others explicitly says not to
    this.closeOthers = function (openGroup) {
      var closeOthers = angular.isDefined($attrs.closeOthers) ? $scope.$eval($attrs.closeOthers) : accordionConfig.closeOthers;
      if (closeOthers) {
        angular.forEach(this.groups, function (group) {
          if (group !== openGroup) {
            group.isOpen = false;
          }
        });
      }
    };
    // This is called from the accordion-group directive to add itself to the accordion
    this.addGroup = function (groupScope) {
      var that = this;
      this.groups.push(groupScope);
      groupScope.$on('$destroy', function (event) {
        that.removeGroup(groupScope);
      });
    };
    // This is called from the accordion-group directive when to remove itself
    this.removeGroup = function (group) {
      var index = this.groups.indexOf(group);
      if (index !== -1) {
        this.groups.splice(index, 1);
      }
    };
  }
]).directive('accordion', function () {
  return {
    restrict: 'EA',
    controller: 'AccordionController',
    transclude: true,
    replace: false,
    templateUrl: 'template/accordion/accordion.html'
  };
}).directive('accordionGroup', function () {
  return {
    require: '^accordion',
    restrict: 'EA',
    transclude: true,
    replace: true,
    templateUrl: 'template/accordion/accordion-group.html',
    scope: {
      heading: '@',
      isOpen: '=?',
      isDisabled: '=?'
    },
    controller: function () {
      this.setHeading = function (element) {
        this.heading = element;
      };
    },
    link: function (scope, element, attrs, accordionCtrl) {
      accordionCtrl.addGroup(scope);
      scope.$watch('isOpen', function (value) {
        if (value) {
          accordionCtrl.closeOthers(scope);
        }
      });
      scope.toggleOpen = function () {
        if (!scope.isDisabled) {
          scope.isOpen = !scope.isOpen;
        }
      };
    }
  };
}).directive('accordionHeading', function () {
  return {
    restrict: 'EA',
    transclude: true,
    template: '',
    replace: true,
    require: '^accordionGroup',
    link: function (scope, element, attr, accordionGroupCtrl, transclude) {
      // Pass the heading to the accordion-group controller
      // so that it can be transcluded into the right place in the template
      // [The second parameter to transclude causes the elements to be cloned so that they work in ng-repeat]
      accordionGroupCtrl.setHeading(transclude(scope, function () {
      }));
    }
  };
}).directive('accordionTransclude', function () {
  return {
    require: '^accordionGroup',
    link: function (scope, element, attr, controller) {
      scope.$watch(function () {
        return controller[attr.accordionTransclude];
      }, function (heading) {
        if (heading) {
          element.html('');
          element.append(heading);
        }
      });
    }
  };
});
angular.module('ui.bootstrap.alert', []).controller('AlertController', [
  '$scope',
  '$attrs',
  function ($scope, $attrs) {
    $scope.closeable = 'close' in $attrs;
    this.close = $scope.close;
  }
]).directive('alert', function () {
  return {
    restrict: 'EA',
    controller: 'AlertController',
    templateUrl: 'template/alert/alert.html',
    transclude: true,
    replace: true,
    scope: {
      type: '@',
      close: '&'
    }
  };
}).directive('dismissOnTimeout', [
  '$timeout',
  function ($timeout) {
    return {
      require: 'alert',
      link: function (scope, element, attrs, alertCtrl) {
        $timeout(function () {
          alertCtrl.close();
        }, parseInt(attrs.dismissOnTimeout, 10));
      }
    };
  }
]);
angular.module('ui.bootstrap.bindHtml', []).directive('bindHtmlUnsafe', function () {
  return function (scope, element, attr) {
    element.addClass('ng-binding').data('$binding', attr.bindHtmlUnsafe);
    scope.$watch(attr.bindHtmlUnsafe, function bindHtmlUnsafeWatchAction(value) {
      element.html(value || '');
    });
  };
});
angular.module('ui.bootstrap.buttons', []).constant('buttonConfig', {
  activeClass: 'active',
  toggleEvent: 'click'
}).controller('ButtonsController', [
  'buttonConfig',
  function (buttonConfig) {
    this.activeClass = buttonConfig.activeClass || 'active';
    this.toggleEvent = buttonConfig.toggleEvent || 'click';
  }
]).directive('btnRadio', function () {
  return {
    require: [
      'btnRadio',
      'ngModel'
    ],
    controller: 'ButtonsController',
    link: function (scope, element, attrs, ctrls) {
      var buttonsCtrl = ctrls[0], ngModelCtrl = ctrls[1];
      //model -> UI
      ngModelCtrl.$render = function () {
        element.toggleClass(buttonsCtrl.activeClass, angular.equals(ngModelCtrl.$modelValue, scope.$eval(attrs.btnRadio)));
      };
      //ui->model
      element.bind(buttonsCtrl.toggleEvent, function () {
        var isActive = element.hasClass(buttonsCtrl.activeClass);
        if (!isActive || angular.isDefined(attrs.uncheckable)) {
          scope.$apply(function () {
            ngModelCtrl.$setViewValue(isActive ? null : scope.$eval(attrs.btnRadio));
            ngModelCtrl.$render();
          });
        }
      });
    }
  };
}).directive('btnCheckbox', function () {
  return {
    require: [
      'btnCheckbox',
      'ngModel'
    ],
    controller: 'ButtonsController',
    link: function (scope, element, attrs, ctrls) {
      var buttonsCtrl = ctrls[0], ngModelCtrl = ctrls[1];
      function getTrueValue() {
        return getCheckboxValue(attrs.btnCheckboxTrue, true);
      }
      function getFalseValue() {
        return getCheckboxValue(attrs.btnCheckboxFalse, false);
      }
      function getCheckboxValue(attributeValue, defaultValue) {
        var val = scope.$eval(attributeValue);
        return angular.isDefined(val) ? val : defaultValue;
      }
      //model -> UI
      ngModelCtrl.$render = function () {
        element.toggleClass(buttonsCtrl.activeClass, angular.equals(ngModelCtrl.$modelValue, getTrueValue()));
      };
      //ui->model
      element.bind(buttonsCtrl.toggleEvent, function () {
        scope.$apply(function () {
          ngModelCtrl.$setViewValue(element.hasClass(buttonsCtrl.activeClass) ? getFalseValue() : getTrueValue());
          ngModelCtrl.$render();
        });
      });
    }
  };
});
/**
* @ngdoc overview
* @name ui.bootstrap.carousel
*
* @description
* AngularJS version of an image carousel.
*
*/
angular.module('ui.bootstrap.carousel', ['ui.bootstrap.transition']).controller('CarouselController', [
  '$scope',
  '$timeout',
  '$interval',
  '$transition',
  function ($scope, $timeout, $interval, $transition) {
    var self = this, slides = self.slides = $scope.slides = [], currentIndex = -1, currentInterval, isPlaying;
    self.currentSlide = null;
    var destroyed = false;
    /* direction: "prev" or "next" */
    self.select = $scope.select = function (nextSlide, direction) {
      var nextIndex = slides.indexOf(nextSlide);
      //Decide direction if it's not given
      if (direction === undefined) {
        direction = nextIndex > currentIndex ? 'next' : 'prev';
      }
      if (nextSlide && nextSlide !== self.currentSlide) {
        if ($scope.$currentTransition) {
          $scope.$currentTransition.cancel();
          //Timeout so ng-class in template has time to fix classes for finished slide
          $timeout(goNext);
        } else {
          goNext();
        }
      }
      function goNext() {
        // Scope has been destroyed, stop here.
        if (destroyed) {
          return;
        }
        //If we have a slide to transition from and we have a transition type and we're allowed, go
        if (self.currentSlide && angular.isString(direction) && !$scope.noTransition && nextSlide.$element) {
          //We shouldn't do class manip in here, but it's the same weird thing bootstrap does. need to fix sometime
          nextSlide.$element.addClass(direction);
          var reflow = nextSlide.$element[0].offsetWidth;
          //force reflow
          //Set all other slides to stop doing their stuff for the new transition
          angular.forEach(slides, function (slide) {
            angular.extend(slide, {
              direction: '',
              entering: false,
              leaving: false,
              active: false
            });
          });
          angular.extend(nextSlide, {
            direction: direction,
            active: true,
            entering: true
          });
          angular.extend(self.currentSlide || {}, {
            direction: direction,
            leaving: true
          });
          $scope.$currentTransition = $transition(nextSlide.$element, {});
          //We have to create new pointers inside a closure since next & current will change
          (function (next, current) {
            $scope.$currentTransition.then(function () {
              transitionDone(next, current);
            }, function () {
              transitionDone(next, current);
            });
          }(nextSlide, self.currentSlide));
        } else {
          transitionDone(nextSlide, self.currentSlide);
        }
        self.currentSlide = nextSlide;
        currentIndex = nextIndex;
        //every time you change slides, reset the timer
        restartTimer();
      }
      function transitionDone(next, current) {
        angular.extend(next, {
          direction: '',
          active: true,
          leaving: false,
          entering: false
        });
        angular.extend(current || {}, {
          direction: '',
          active: false,
          leaving: false,
          entering: false
        });
        $scope.$currentTransition = null;
      }
    };
    $scope.$on('$destroy', function () {
      destroyed = true;
    });
    /* Allow outside people to call indexOf on slides array */
    self.indexOfSlide = function (slide) {
      return slides.indexOf(slide);
    };
    $scope.next = function () {
      var newIndex = (currentIndex + 1) % slides.length;
      //Prevent this user-triggered transition from occurring if there is already one in progress
      if (!$scope.$currentTransition) {
        return self.select(slides[newIndex], 'next');
      }
    };
    $scope.prev = function () {
      var newIndex = currentIndex - 1 < 0 ? slides.length - 1 : currentIndex - 1;
      //Prevent this user-triggered transition from occurring if there is already one in progress
      if (!$scope.$currentTransition) {
        return self.select(slides[newIndex], 'prev');
      }
    };
    $scope.isActive = function (slide) {
      return self.currentSlide === slide;
    };
    $scope.$watch('interval', restartTimer);
    $scope.$on('$destroy', resetTimer);
    function restartTimer() {
      resetTimer();
      var interval = +$scope.interval;
      if (!isNaN(interval) && interval > 0) {
        currentInterval = $interval(timerFn, interval);
      }
    }
    function resetTimer() {
      if (currentInterval) {
        $interval.cancel(currentInterval);
        currentInterval = null;
      }
    }
    function timerFn() {
      var interval = +$scope.interval;
      if (isPlaying && !isNaN(interval) && interval > 0) {
        $scope.next();
      } else {
        $scope.pause();
      }
    }
    $scope.play = function () {
      if (!isPlaying) {
        isPlaying = true;
        restartTimer();
      }
    };
    $scope.pause = function () {
      if (!$scope.noPause) {
        isPlaying = false;
        resetTimer();
      }
    };
    self.addSlide = function (slide, element) {
      slide.$element = element;
      slides.push(slide);
      //if this is the first slide or the slide is set to active, select it
      if (slides.length === 1 || slide.active) {
        self.select(slides[slides.length - 1]);
        if (slides.length == 1) {
          $scope.play();
        }
      } else {
        slide.active = false;
      }
    };
    self.removeSlide = function (slide) {
      //get the index of the slide inside the carousel
      var index = slides.indexOf(slide);
      slides.splice(index, 1);
      if (slides.length > 0 && slide.active) {
        if (index >= slides.length) {
          self.select(slides[index - 1]);
        } else {
          self.select(slides[index]);
        }
      } else if (currentIndex > index) {
        currentIndex--;
      }
    };
  }
]).directive('carousel', [function () {
    return {
      restrict: 'EA',
      transclude: true,
      replace: true,
      controller: 'CarouselController',
      require: 'carousel',
      templateUrl: 'template/carousel/carousel.html',
      scope: {
        interval: '=',
        noTransition: '=',
        noPause: '='
      }
    };
  }]).directive('slide', function () {
  return {
    require: '^carousel',
    restrict: 'EA',
    transclude: true,
    replace: true,
    templateUrl: 'template/carousel/slide.html',
    scope: { active: '=?' },
    link: function (scope, element, attrs, carouselCtrl) {
      carouselCtrl.addSlide(scope, element);
      //when the scope is destroyed then remove the slide from the current slides array
      scope.$on('$destroy', function () {
        carouselCtrl.removeSlide(scope);
      });
      scope.$watch('active', function (active) {
        if (active) {
          carouselCtrl.select(scope);
        }
      });
    }
  };
});
angular.module('ui.bootstrap.dateparser', []).service('dateParser', [
  '$locale',
  'orderByFilter',
  function ($locale, orderByFilter) {
    this.parsers = {};
    var formatCodeToRegex = {
        'yyyy': {
          regex: '\\d{4}',
          apply: function (value) {
            this.year = +value;
          }
        },
        'yy': {
          regex: '\\d{2}',
          apply: function (value) {
            this.year = +value + 2000;
          }
        },
        'y': {
          regex: '\\d{1,4}',
          apply: function (value) {
            this.year = +value;
          }
        },
        'MMMM': {
          regex: $locale.DATETIME_FORMATS.MONTH.join('|'),
          apply: function (value) {
            this.month = $locale.DATETIME_FORMATS.MONTH.indexOf(value);
          }
        },
        'MMM': {
          regex: $locale.DATETIME_FORMATS.SHORTMONTH.join('|'),
          apply: function (value) {
            this.month = $locale.DATETIME_FORMATS.SHORTMONTH.indexOf(value);
          }
        },
        'MM': {
          regex: '0[1-9]|1[0-2]',
          apply: function (value) {
            this.month = value - 1;
          }
        },
        'M': {
          regex: '[1-9]|1[0-2]',
          apply: function (value) {
            this.month = value - 1;
          }
        },
        'dd': {
          regex: '[0-2][0-9]{1}|3[0-1]{1}',
          apply: function (value) {
            this.date = +value;
          }
        },
        'd': {
          regex: '[1-2]?[0-9]{1}|3[0-1]{1}',
          apply: function (value) {
            this.date = +value;
          }
        },
        'EEEE': { regex: $locale.DATETIME_FORMATS.DAY.join('|') },
        'EEE': { regex: $locale.DATETIME_FORMATS.SHORTDAY.join('|') }
      };
    function createParser(format) {
      var map = [], regex = format.split('');
      angular.forEach(formatCodeToRegex, function (data, code) {
        var index = format.indexOf(code);
        if (index > -1) {
          format = format.split('');
          regex[index] = '(' + data.regex + ')';
          format[index] = '$';
          // Custom symbol to define consumed part of format
          for (var i = index + 1, n = index + code.length; i < n; i++) {
            regex[i] = '';
            format[i] = '$';
          }
          format = format.join('');
          map.push({
            index: index,
            apply: data.apply
          });
        }
      });
      return {
        regex: new RegExp('^' + regex.join('') + '$'),
        map: orderByFilter(map, 'index')
      };
    }
    this.parse = function (input, format) {
      if (!angular.isString(input) || !format) {
        return input;
      }
      format = $locale.DATETIME_FORMATS[format] || format;
      if (!this.parsers[format]) {
        this.parsers[format] = createParser(format);
      }
      var parser = this.parsers[format], regex = parser.regex, map = parser.map, results = input.match(regex);
      if (results && results.length) {
        var fields = {
            year: 1900,
            month: 0,
            date: 1,
            hours: 0
          }, dt;
        for (var i = 1, n = results.length; i < n; i++) {
          var mapper = map[i - 1];
          if (mapper.apply) {
            mapper.apply.call(fields, results[i]);
          }
        }
        if (isValid(fields.year, fields.month, fields.date)) {
          dt = new Date(fields.year, fields.month, fields.date, fields.hours);
        }
        return dt;
      }
    };
    // Check if date is valid for specific month (and year for February).
    // Month: 0 = Jan, 1 = Feb, etc
    function isValid(year, month, date) {
      if (month === 1 && date > 28) {
        return date === 29 && (year % 4 === 0 && year % 100 !== 0 || year % 400 === 0);
      }
      if (month === 3 || month === 5 || month === 8 || month === 10) {
        return date < 31;
      }
      return true;
    }
  }
]);
angular.module('ui.bootstrap.position', []).factory('$position', [
  '$document',
  '$window',
  function ($document, $window) {
    function getStyle(el, cssprop) {
      if (el.currentStyle) {
        //IE
        return el.currentStyle[cssprop];
      } else if ($window.getComputedStyle) {
        return $window.getComputedStyle(el)[cssprop];
      }
      // finally try and get inline style
      return el.style[cssprop];
    }
    /**
     * Checks if a given element is statically positioned
     * @param element - raw DOM element
     */
    function isStaticPositioned(element) {
      return (getStyle(element, 'position') || 'static') === 'static';
    }
    /**
     * returns the closest, non-statically positioned parentOffset of a given element
     * @param element
     */
    var parentOffsetEl = function (element) {
      var docDomEl = $document[0];
      var offsetParent = element.offsetParent || docDomEl;
      while (offsetParent && offsetParent !== docDomEl && isStaticPositioned(offsetParent)) {
        offsetParent = offsetParent.offsetParent;
      }
      return offsetParent || docDomEl;
    };
    return {
      position: function (element) {
        var elBCR = this.offset(element);
        var offsetParentBCR = {
            top: 0,
            left: 0
          };
        var offsetParentEl = parentOffsetEl(element[0]);
        if (offsetParentEl != $document[0]) {
          offsetParentBCR = this.offset(angular.element(offsetParentEl));
          offsetParentBCR.top += offsetParentEl.clientTop - offsetParentEl.scrollTop;
          offsetParentBCR.left += offsetParentEl.clientLeft - offsetParentEl.scrollLeft;
        }
        var boundingClientRect = element[0].getBoundingClientRect();
        return {
          width: boundingClientRect.width || element.prop('offsetWidth'),
          height: boundingClientRect.height || element.prop('offsetHeight'),
          top: elBCR.top - offsetParentBCR.top,
          left: elBCR.left - offsetParentBCR.left
        };
      },
      offset: function (element) {
        var boundingClientRect = element[0].getBoundingClientRect();
        return {
          width: boundingClientRect.width || element.prop('offsetWidth'),
          height: boundingClientRect.height || element.prop('offsetHeight'),
          top: boundingClientRect.top + ($window.pageYOffset || $document[0].documentElement.scrollTop),
          left: boundingClientRect.left + ($window.pageXOffset || $document[0].documentElement.scrollLeft)
        };
      },
      positionElements: function (hostEl, targetEl, positionStr, appendToBody) {
        var positionStrParts = positionStr.split('-');
        var pos0 = positionStrParts[0], pos1 = positionStrParts[1] || 'center';
        var hostElPos, targetElWidth, targetElHeight, targetElPos;
        hostElPos = appendToBody ? this.offset(hostEl) : this.position(hostEl);
        targetElWidth = targetEl.prop('offsetWidth');
        targetElHeight = targetEl.prop('offsetHeight');
        var shiftWidth = {
            center: function () {
              return hostElPos.left + hostElPos.width / 2 - targetElWidth / 2;
            },
            left: function () {
              return hostElPos.left;
            },
            right: function () {
              return hostElPos.left + hostElPos.width;
            }
          };
        var shiftHeight = {
            center: function () {
              return hostElPos.top + hostElPos.height / 2 - targetElHeight / 2;
            },
            top: function () {
              return hostElPos.top;
            },
            bottom: function () {
              return hostElPos.top + hostElPos.height;
            }
          };
        switch (pos0) {
        case 'right':
          targetElPos = {
            top: shiftHeight[pos1](),
            left: shiftWidth[pos0]()
          };
          break;
        case 'left':
          targetElPos = {
            top: shiftHeight[pos1](),
            left: hostElPos.left - targetElWidth
          };
          break;
        case 'bottom':
          targetElPos = {
            top: shiftHeight[pos0](),
            left: shiftWidth[pos1]()
          };
          break;
        default:
          targetElPos = {
            top: hostElPos.top - targetElHeight,
            left: shiftWidth[pos1]()
          };
          break;
        }
        return targetElPos;
      }
    };
  }
]);
angular.module('ui.bootstrap.datepicker', [
  'ui.bootstrap.dateparser',
  'ui.bootstrap.position'
]).constant('datepickerConfig', {
  formatDay: 'dd',
  formatMonth: 'MMMM',
  formatYear: 'yyyy',
  formatDayHeader: 'EEE',
  formatDayTitle: 'MMMM yyyy',
  formatMonthTitle: 'yyyy',
  datepickerMode: 'day',
  minMode: 'day',
  maxMode: 'year',
  showWeeks: true,
  startingDay: 0,
  yearRange: 20,
  minDate: null,
  maxDate: null
}).controller('DatepickerController', [
  '$scope',
  '$attrs',
  '$parse',
  '$interpolate',
  '$timeout',
  '$log',
  'dateFilter',
  'datepickerConfig',
  function ($scope, $attrs, $parse, $interpolate, $timeout, $log, dateFilter, datepickerConfig) {
    var self = this, ngModelCtrl = { $setViewValue: angular.noop };
    // nullModelCtrl;
    // Modes chain
    this.modes = [
      'day',
      'month',
      'year'
    ];
    // Configuration attributes
    angular.forEach([
      'formatDay',
      'formatMonth',
      'formatYear',
      'formatDayHeader',
      'formatDayTitle',
      'formatMonthTitle',
      'minMode',
      'maxMode',
      'showWeeks',
      'startingDay',
      'yearRange'
    ], function (key, index) {
      self[key] = angular.isDefined($attrs[key]) ? index < 8 ? $interpolate($attrs[key])($scope.$parent) : $scope.$parent.$eval($attrs[key]) : datepickerConfig[key];
    });
    // Watchable date attributes
    angular.forEach([
      'minDate',
      'maxDate'
    ], function (key) {
      if ($attrs[key]) {
        $scope.$parent.$watch($parse($attrs[key]), function (value) {
          self[key] = value ? new Date(value) : null;
          self.refreshView();
        });
      } else {
        self[key] = datepickerConfig[key] ? new Date(datepickerConfig[key]) : null;
      }
    });
    $scope.datepickerMode = $scope.datepickerMode || datepickerConfig.datepickerMode;
    $scope.uniqueId = 'datepicker-' + $scope.$id + '-' + Math.floor(Math.random() * 10000);
    this.activeDate = angular.isDefined($attrs.initDate) ? $scope.$parent.$eval($attrs.initDate) : new Date();
    $scope.isActive = function (dateObject) {
      if (self.compare(dateObject.date, self.activeDate) === 0) {
        $scope.activeDateId = dateObject.uid;
        return true;
      }
      return false;
    };
    this.init = function (ngModelCtrl_) {
      ngModelCtrl = ngModelCtrl_;
      ngModelCtrl.$render = function () {
        self.render();
      };
    };
    this.render = function () {
      if (ngModelCtrl.$modelValue) {
        var date = new Date(ngModelCtrl.$modelValue), isValid = !isNaN(date);
        if (isValid) {
          this.activeDate = date;
        } else {
          $log.error('Datepicker directive: "ng-model" value must be a Date object, a number of milliseconds since 01.01.1970 or a string representing an RFC2822 or ISO 8601 date.');
        }
        ngModelCtrl.$setValidity('date', isValid);
      }
      this.refreshView();
    };
    this.refreshView = function () {
      if (this.element) {
        this._refreshView();
        var date = ngModelCtrl.$modelValue ? new Date(ngModelCtrl.$modelValue) : null;
        ngModelCtrl.$setValidity('date-disabled', !date || this.element && !this.isDisabled(date));
      }
    };
    this.createDateObject = function (date, format) {
      var model = ngModelCtrl.$modelValue ? new Date(ngModelCtrl.$modelValue) : null;
      return {
        date: date,
        label: dateFilter(date, format),
        selected: model && this.compare(date, model) === 0,
        disabled: this.isDisabled(date),
        current: this.compare(date, new Date()) === 0
      };
    };
    this.isDisabled = function (date) {
      return this.minDate && this.compare(date, this.minDate) < 0 || this.maxDate && this.compare(date, this.maxDate) > 0 || $attrs.dateDisabled && $scope.dateDisabled({
        date: date,
        mode: $scope.datepickerMode
      });
    };
    // Split array into smaller arrays
    this.split = function (arr, size) {
      var arrays = [];
      while (arr.length > 0) {
        arrays.push(arr.splice(0, size));
      }
      return arrays;
    };
    $scope.select = function (date) {
      if ($scope.datepickerMode === self.minMode) {
        var dt = ngModelCtrl.$modelValue ? new Date(ngModelCtrl.$modelValue) : new Date(0, 0, 0, 0, 0, 0, 0);
        dt.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
        ngModelCtrl.$setViewValue(dt);
        ngModelCtrl.$render();
      } else {
        self.activeDate = date;
        $scope.datepickerMode = self.modes[self.modes.indexOf($scope.datepickerMode) - 1];
      }
    };
    $scope.move = function (direction) {
      var year = self.activeDate.getFullYear() + direction * (self.step.years || 0), month = self.activeDate.getMonth() + direction * (self.step.months || 0);
      self.activeDate.setFullYear(year, month, 1);
      self.refreshView();
    };
    $scope.toggleMode = function (direction) {
      direction = direction || 1;
      if ($scope.datepickerMode === self.maxMode && direction === 1 || $scope.datepickerMode === self.minMode && direction === -1) {
        return;
      }
      $scope.datepickerMode = self.modes[self.modes.indexOf($scope.datepickerMode) + direction];
    };
    // Key event mapper
    $scope.keys = {
      13: 'enter',
      32: 'space',
      33: 'pageup',
      34: 'pagedown',
      35: 'end',
      36: 'home',
      37: 'left',
      38: 'up',
      39: 'right',
      40: 'down'
    };
    var focusElement = function () {
      $timeout(function () {
        self.element[0].focus();
      }, 0, false);
    };
    // Listen for focus requests from popup directive
    $scope.$on('datepicker.focus', focusElement);
    $scope.keydown = function (evt) {
      var key = $scope.keys[evt.which];
      if (!key || evt.shiftKey || evt.altKey) {
        return;
      }
      evt.preventDefault();
      evt.stopPropagation();
      if (key === 'enter' || key === 'space') {
        if (self.isDisabled(self.activeDate)) {
          return;  // do nothing
        }
        $scope.select(self.activeDate);
        focusElement();
      } else if (evt.ctrlKey && (key === 'up' || key === 'down')) {
        $scope.toggleMode(key === 'up' ? 1 : -1);
        focusElement();
      } else {
        self.handleKeyDown(key, evt);
        self.refreshView();
      }
    };
  }
]).directive('datepicker', function () {
  return {
    restrict: 'EA',
    replace: true,
    templateUrl: 'template/datepicker/datepicker.html',
    scope: {
      datepickerMode: '=?',
      dateDisabled: '&'
    },
    require: [
      'datepicker',
      '?^ngModel'
    ],
    controller: 'DatepickerController',
    link: function (scope, element, attrs, ctrls) {
      var datepickerCtrl = ctrls[0], ngModelCtrl = ctrls[1];
      if (ngModelCtrl) {
        datepickerCtrl.init(ngModelCtrl);
      }
    }
  };
}).directive('daypicker', [
  'dateFilter',
  function (dateFilter) {
    return {
      restrict: 'EA',
      replace: true,
      templateUrl: 'template/datepicker/day.html',
      require: '^datepicker',
      link: function (scope, element, attrs, ctrl) {
        scope.showWeeks = ctrl.showWeeks;
        ctrl.step = { months: 1 };
        ctrl.element = element;
        var DAYS_IN_MONTH = [
            31,
            28,
            31,
            30,
            31,
            30,
            31,
            31,
            30,
            31,
            30,
            31
          ];
        function getDaysInMonth(year, month) {
          return month === 1 && year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : DAYS_IN_MONTH[month];
        }
        function getDates(startDate, n) {
          var dates = new Array(n), current = new Date(startDate), i = 0;
          current.setHours(12);
          // Prevent repeated dates because of timezone bug
          while (i < n) {
            dates[i++] = new Date(current);
            current.setDate(current.getDate() + 1);
          }
          return dates;
        }
        ctrl._refreshView = function () {
          var year = ctrl.activeDate.getFullYear(), month = ctrl.activeDate.getMonth(), firstDayOfMonth = new Date(year, month, 1), difference = ctrl.startingDay - firstDayOfMonth.getDay(), numDisplayedFromPreviousMonth = difference > 0 ? 7 - difference : -difference, firstDate = new Date(firstDayOfMonth);
          if (numDisplayedFromPreviousMonth > 0) {
            firstDate.setDate(-numDisplayedFromPreviousMonth + 1);
          }
          // 42 is the number of days on a six-month calendar
          var days = getDates(firstDate, 42);
          for (var i = 0; i < 42; i++) {
            days[i] = angular.extend(ctrl.createDateObject(days[i], ctrl.formatDay), {
              secondary: days[i].getMonth() !== month,
              uid: scope.uniqueId + '-' + i
            });
          }
          scope.labels = new Array(7);
          for (var j = 0; j < 7; j++) {
            scope.labels[j] = {
              abbr: dateFilter(days[j].date, ctrl.formatDayHeader),
              full: dateFilter(days[j].date, 'EEEE')
            };
          }
          scope.title = dateFilter(ctrl.activeDate, ctrl.formatDayTitle);
          scope.rows = ctrl.split(days, 7);
          if (scope.showWeeks) {
            scope.weekNumbers = [];
            var weekNumber = getISO8601WeekNumber(scope.rows[0][0].date), numWeeks = scope.rows.length;
            while (scope.weekNumbers.push(weekNumber++) < numWeeks) {
            }
          }
        };
        ctrl.compare = function (date1, date2) {
          return new Date(date1.getFullYear(), date1.getMonth(), date1.getDate()) - new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
        };
        function getISO8601WeekNumber(date) {
          var checkDate = new Date(date);
          checkDate.setDate(checkDate.getDate() + 4 - (checkDate.getDay() || 7));
          // Thursday
          var time = checkDate.getTime();
          checkDate.setMonth(0);
          // Compare with Jan 1
          checkDate.setDate(1);
          return Math.floor(Math.round((time - checkDate) / 86400000) / 7) + 1;
        }
        ctrl.handleKeyDown = function (key, evt) {
          var date = ctrl.activeDate.getDate();
          if (key === 'left') {
            date = date - 1;  // up
          } else if (key === 'up') {
            date = date - 7;  // down
          } else if (key === 'right') {
            date = date + 1;  // down
          } else if (key === 'down') {
            date = date + 7;
          } else if (key === 'pageup' || key === 'pagedown') {
            var month = ctrl.activeDate.getMonth() + (key === 'pageup' ? -1 : 1);
            ctrl.activeDate.setMonth(month, 1);
            date = Math.min(getDaysInMonth(ctrl.activeDate.getFullYear(), ctrl.activeDate.getMonth()), date);
          } else if (key === 'home') {
            date = 1;
          } else if (key === 'end') {
            date = getDaysInMonth(ctrl.activeDate.getFullYear(), ctrl.activeDate.getMonth());
          }
          ctrl.activeDate.setDate(date);
        };
        ctrl.refreshView();
      }
    };
  }
]).directive('monthpicker', [
  'dateFilter',
  function (dateFilter) {
    return {
      restrict: 'EA',
      replace: true,
      templateUrl: 'template/datepicker/month.html',
      require: '^datepicker',
      link: function (scope, element, attrs, ctrl) {
        ctrl.step = { years: 1 };
        ctrl.element = element;
        ctrl._refreshView = function () {
          var months = new Array(12), year = ctrl.activeDate.getFullYear();
          for (var i = 0; i < 12; i++) {
            months[i] = angular.extend(ctrl.createDateObject(new Date(year, i, 1), ctrl.formatMonth), { uid: scope.uniqueId + '-' + i });
          }
          scope.title = dateFilter(ctrl.activeDate, ctrl.formatMonthTitle);
          scope.rows = ctrl.split(months, 3);
        };
        ctrl.compare = function (date1, date2) {
          return new Date(date1.getFullYear(), date1.getMonth()) - new Date(date2.getFullYear(), date2.getMonth());
        };
        ctrl.handleKeyDown = function (key, evt) {
          var date = ctrl.activeDate.getMonth();
          if (key === 'left') {
            date = date - 1;  // up
          } else if (key === 'up') {
            date = date - 3;  // down
          } else if (key === 'right') {
            date = date + 1;  // down
          } else if (key === 'down') {
            date = date + 3;
          } else if (key === 'pageup' || key === 'pagedown') {
            var year = ctrl.activeDate.getFullYear() + (key === 'pageup' ? -1 : 1);
            ctrl.activeDate.setFullYear(year);
          } else if (key === 'home') {
            date = 0;
          } else if (key === 'end') {
            date = 11;
          }
          ctrl.activeDate.setMonth(date);
        };
        ctrl.refreshView();
      }
    };
  }
]).directive('yearpicker', [
  'dateFilter',
  function (dateFilter) {
    return {
      restrict: 'EA',
      replace: true,
      templateUrl: 'template/datepicker/year.html',
      require: '^datepicker',
      link: function (scope, element, attrs, ctrl) {
        var range = ctrl.yearRange;
        ctrl.step = { years: range };
        ctrl.element = element;
        function getStartingYear(year) {
          return parseInt((year - 1) / range, 10) * range + 1;
        }
        ctrl._refreshView = function () {
          var years = new Array(range);
          for (var i = 0, start = getStartingYear(ctrl.activeDate.getFullYear()); i < range; i++) {
            years[i] = angular.extend(ctrl.createDateObject(new Date(start + i, 0, 1), ctrl.formatYear), { uid: scope.uniqueId + '-' + i });
          }
          scope.title = [
            years[0].label,
            years[range - 1].label
          ].join(' - ');
          scope.rows = ctrl.split(years, 5);
        };
        ctrl.compare = function (date1, date2) {
          return date1.getFullYear() - date2.getFullYear();
        };
        ctrl.handleKeyDown = function (key, evt) {
          var date = ctrl.activeDate.getFullYear();
          if (key === 'left') {
            date = date - 1;  // up
          } else if (key === 'up') {
            date = date - 5;  // down
          } else if (key === 'right') {
            date = date + 1;  // down
          } else if (key === 'down') {
            date = date + 5;
          } else if (key === 'pageup' || key === 'pagedown') {
            date += (key === 'pageup' ? -1 : 1) * ctrl.step.years;
          } else if (key === 'home') {
            date = getStartingYear(ctrl.activeDate.getFullYear());
          } else if (key === 'end') {
            date = getStartingYear(ctrl.activeDate.getFullYear()) + range - 1;
          }
          ctrl.activeDate.setFullYear(date);
        };
        ctrl.refreshView();
      }
    };
  }
]).constant('datepickerPopupConfig', {
  datepickerPopup: 'yyyy-MM-dd',
  currentText: 'Today',
  clearText: 'Clear',
  closeText: 'Done',
  closeOnDateSelection: true,
  appendToBody: false,
  showButtonBar: true
}).directive('datepickerPopup', [
  '$compile',
  '$parse',
  '$document',
  '$position',
  'dateFilter',
  'dateParser',
  'datepickerPopupConfig',
  function ($compile, $parse, $document, $position, dateFilter, dateParser, datepickerPopupConfig) {
    return {
      restrict: 'EA',
      require: 'ngModel',
      scope: {
        isOpen: '=?',
        currentText: '@',
        clearText: '@',
        closeText: '@',
        dateDisabled: '&'
      },
      link: function (scope, element, attrs, ngModel) {
        var dateFormat, closeOnDateSelection = angular.isDefined(attrs.closeOnDateSelection) ? scope.$parent.$eval(attrs.closeOnDateSelection) : datepickerPopupConfig.closeOnDateSelection, appendToBody = angular.isDefined(attrs.datepickerAppendToBody) ? scope.$parent.$eval(attrs.datepickerAppendToBody) : datepickerPopupConfig.appendToBody;
        scope.showButtonBar = angular.isDefined(attrs.showButtonBar) ? scope.$parent.$eval(attrs.showButtonBar) : datepickerPopupConfig.showButtonBar;
        scope.getText = function (key) {
          return scope[key + 'Text'] || datepickerPopupConfig[key + 'Text'];
        };
        attrs.$observe('datepickerPopup', function (value) {
          dateFormat = value || datepickerPopupConfig.datepickerPopup;
          ngModel.$render();
        });
        // popup element used to display calendar
        var popupEl = angular.element('<div datepicker-popup-wrap><div datepicker></div></div>');
        popupEl.attr({
          'ng-model': 'date',
          'ng-change': 'dateSelection()'
        });
        function cameltoDash(string) {
          return string.replace(/([A-Z])/g, function ($1) {
            return '-' + $1.toLowerCase();
          });
        }
        // datepicker element
        var datepickerEl = angular.element(popupEl.children()[0]);
        if (attrs.datepickerOptions) {
          angular.forEach(scope.$parent.$eval(attrs.datepickerOptions), function (value, option) {
            datepickerEl.attr(cameltoDash(option), value);
          });
        }
        scope.watchData = {};
        angular.forEach([
          'minDate',
          'maxDate',
          'datepickerMode'
        ], function (key) {
          if (attrs[key]) {
            var getAttribute = $parse(attrs[key]);
            scope.$parent.$watch(getAttribute, function (value) {
              scope.watchData[key] = value;
            });
            datepickerEl.attr(cameltoDash(key), 'watchData.' + key);
            // Propagate changes from datepicker to outside
            if (key === 'datepickerMode') {
              var setAttribute = getAttribute.assign;
              scope.$watch('watchData.' + key, function (value, oldvalue) {
                if (value !== oldvalue) {
                  setAttribute(scope.$parent, value);
                }
              });
            }
          }
        });
        if (attrs.dateDisabled) {
          datepickerEl.attr('date-disabled', 'dateDisabled({ date: date, mode: mode })');
        }
        function parseDate(viewValue) {
          if (!viewValue) {
            ngModel.$setValidity('date', true);
            return null;
          } else if (angular.isDate(viewValue) && !isNaN(viewValue)) {
            ngModel.$setValidity('date', true);
            return viewValue;
          } else if (angular.isString(viewValue)) {
            var date = dateParser.parse(viewValue, dateFormat) || new Date(viewValue);
            if (isNaN(date)) {
              ngModel.$setValidity('date', false);
              return undefined;
            } else {
              ngModel.$setValidity('date', true);
              return date;
            }
          } else {
            ngModel.$setValidity('date', false);
            return undefined;
          }
        }
        ngModel.$parsers.unshift(parseDate);
        // Inner change
        scope.dateSelection = function (dt) {
          if (angular.isDefined(dt)) {
            scope.date = dt;
          }
          ngModel.$setViewValue(scope.date);
          ngModel.$render();
          if (closeOnDateSelection) {
            scope.isOpen = false;
            element[0].focus();
          }
        };
        element.bind('input change keyup', function () {
          scope.$apply(function () {
            scope.date = ngModel.$modelValue;
          });
        });
        // Outter change
        ngModel.$render = function () {
          var date = ngModel.$viewValue ? dateFilter(ngModel.$viewValue, dateFormat) : '';
          element.val(date);
          scope.date = parseDate(ngModel.$modelValue);
        };
        var documentClickBind = function (event) {
          if (scope.isOpen && event.target !== element[0]) {
            scope.$apply(function () {
              scope.isOpen = false;
            });
          }
        };
        var keydown = function (evt, noApply) {
          scope.keydown(evt);
        };
        element.bind('keydown', keydown);
        scope.keydown = function (evt) {
          if (evt.which === 27) {
            evt.preventDefault();
            evt.stopPropagation();
            scope.close();
          } else if (evt.which === 40 && !scope.isOpen) {
            scope.isOpen = true;
          }
        };
        scope.$watch('isOpen', function (value) {
          if (value) {
            scope.$broadcast('datepicker.focus');
            scope.position = appendToBody ? $position.offset(element) : $position.position(element);
            scope.position.top = scope.position.top + element.prop('offsetHeight');
            $document.bind('click', documentClickBind);
          } else {
            $document.unbind('click', documentClickBind);
          }
        });
        scope.select = function (date) {
          if (date === 'today') {
            var today = new Date();
            if (angular.isDate(ngModel.$modelValue)) {
              date = new Date(ngModel.$modelValue);
              date.setFullYear(today.getFullYear(), today.getMonth(), today.getDate());
            } else {
              date = new Date(today.setHours(0, 0, 0, 0));
            }
          }
          scope.dateSelection(date);
        };
        scope.close = function () {
          scope.isOpen = false;
          element[0].focus();
        };
        var $popup = $compile(popupEl)(scope);
        // Prevent jQuery cache memory leak (template is now redundant after linking)
        popupEl.remove();
        if (appendToBody) {
          $document.find('body').append($popup);
        } else {
          element.after($popup);
        }
        scope.$on('$destroy', function () {
          $popup.remove();
          element.unbind('keydown', keydown);
          $document.unbind('click', documentClickBind);
        });
      }
    };
  }
]).directive('datepickerPopupWrap', function () {
  return {
    restrict: 'EA',
    replace: true,
    transclude: true,
    templateUrl: 'template/datepicker/popup.html',
    link: function (scope, element, attrs) {
      element.bind('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
      });
    }
  };
});
angular.module('ui.bootstrap.dropdown', []).constant('dropdownConfig', { openClass: 'open' }).service('dropdownService', [
  '$document',
  function ($document) {
    var openScope = null;
    this.open = function (dropdownScope) {
      if (!openScope) {
        $document.bind('click', closeDropdown);
        $document.bind('keydown', escapeKeyBind);
      }
      if (openScope && openScope !== dropdownScope) {
        openScope.isOpen = false;
      }
      openScope = dropdownScope;
    };
    this.close = function (dropdownScope) {
      if (openScope === dropdownScope) {
        openScope = null;
        $document.unbind('click', closeDropdown);
        $document.unbind('keydown', escapeKeyBind);
      }
    };
    var closeDropdown = function (evt) {
      // This method may still be called during the same mouse event that
      // unbound this event handler. So check openScope before proceeding.
      if (!openScope) {
        return;
      }
      var toggleElement = openScope.getToggleElement();
      if (evt && toggleElement && toggleElement[0].contains(evt.target)) {
        return;
      }
      openScope.$apply(function () {
        openScope.isOpen = false;
      });
    };
    var escapeKeyBind = function (evt) {
      if (evt.which === 27) {
        openScope.focusToggleElement();
        closeDropdown();
      }
    };
  }
]).controller('DropdownController', [
  '$scope',
  '$attrs',
  '$parse',
  'dropdownConfig',
  'dropdownService',
  '$animate',
  function ($scope, $attrs, $parse, dropdownConfig, dropdownService, $animate) {
    var self = this, scope = $scope.$new(),
      // create a child scope so we are not polluting original one
      openClass = dropdownConfig.openClass, getIsOpen, setIsOpen = angular.noop, toggleInvoker = $attrs.onToggle ? $parse($attrs.onToggle) : angular.noop;
    this.init = function (element) {
      self.$element = element;
      if ($attrs.isOpen) {
        getIsOpen = $parse($attrs.isOpen);
        setIsOpen = getIsOpen.assign;
        $scope.$watch(getIsOpen, function (value) {
          scope.isOpen = !!value;
        });
      }
    };
    this.toggle = function (open) {
      return scope.isOpen = arguments.length ? !!open : !scope.isOpen;
    };
    // Allow other directives to watch status
    this.isOpen = function () {
      return scope.isOpen;
    };
    scope.getToggleElement = function () {
      return self.toggleElement;
    };
    scope.focusToggleElement = function () {
      if (self.toggleElement) {
        self.toggleElement[0].focus();
      }
    };
    scope.$watch('isOpen', function (isOpen, wasOpen) {
      $animate[isOpen ? 'addClass' : 'removeClass'](self.$element, openClass);
      if (isOpen) {
        scope.focusToggleElement();
        dropdownService.open(scope);
      } else {
        dropdownService.close(scope);
      }
      setIsOpen($scope, isOpen);
      if (angular.isDefined(isOpen) && isOpen !== wasOpen) {
        toggleInvoker($scope, { open: !!isOpen });
      }
    });
    $scope.$on('$locationChangeSuccess', function () {
      scope.isOpen = false;
    });
    $scope.$on('$destroy', function () {
      scope.$destroy();
    });
  }
]).directive('dropdown', function () {
  return {
    controller: 'DropdownController',
    link: function (scope, element, attrs, dropdownCtrl) {
      dropdownCtrl.init(element);
    }
  };
}).directive('dropdownToggle', function () {
  return {
    require: '?^dropdown',
    link: function (scope, element, attrs, dropdownCtrl) {
      if (!dropdownCtrl) {
        return;
      }
      dropdownCtrl.toggleElement = element;
      var toggleDropdown = function (event) {
        event.preventDefault();
        if (!element.hasClass('disabled') && !attrs.disabled) {
          scope.$apply(function () {
            dropdownCtrl.toggle();
          });
        }
      };
      element.bind('click', toggleDropdown);
      // WAI-ARIA
      element.attr({
        'aria-haspopup': true,
        'aria-expanded': false
      });
      scope.$watch(dropdownCtrl.isOpen, function (isOpen) {
        element.attr('aria-expanded', !!isOpen);
      });
      scope.$on('$destroy', function () {
        element.unbind('click', toggleDropdown);
      });
    }
  };
});
angular.module('ui.bootstrap.modal', ['ui.bootstrap.transition']).factory('$$stackedMap', function () {
  return {
    createNew: function () {
      var stack = [];
      return {
        add: function (key, value) {
          stack.push({
            key: key,
            value: value
          });
        },
        get: function (key) {
          for (var i = 0; i < stack.length; i++) {
            if (key == stack[i].key) {
              return stack[i];
            }
          }
        },
        keys: function () {
          var keys = [];
          for (var i = 0; i < stack.length; i++) {
            keys.push(stack[i].key);
          }
          return keys;
        },
        top: function () {
          return stack[stack.length - 1];
        },
        remove: function (key) {
          var idx = -1;
          for (var i = 0; i < stack.length; i++) {
            if (key == stack[i].key) {
              idx = i;
              break;
            }
          }
          return stack.splice(idx, 1)[0];
        },
        removeTop: function () {
          return stack.splice(stack.length - 1, 1)[0];
        },
        length: function () {
          return stack.length;
        }
      };
    }
  };
}).directive('modalBackdrop', [
  '$timeout',
  function ($timeout) {
    return {
      restrict: 'EA',
      replace: true,
      templateUrl: 'template/modal/backdrop.html',
      link: function (scope, element, attrs) {
        scope.backdropClass = attrs.backdropClass || '';
        scope.animate = false;
        //trigger CSS transitions
        $timeout(function () {
          scope.animate = true;
        });
      }
    };
  }
]).directive('modalWindow', [
  '$modalStack',
  '$timeout',
  function ($modalStack, $timeout) {
    return {
      restrict: 'EA',
      scope: {
        index: '@',
        animate: '='
      },
      replace: true,
      transclude: true,
      templateUrl: function (tElement, tAttrs) {
        return tAttrs.templateUrl || 'template/modal/window.html';
      },
      link: function (scope, element, attrs) {
        element.addClass(attrs.windowClass || '');
        scope.size = attrs.size;
        $timeout(function () {
          // trigger CSS transitions
          scope.animate = true;
          /**
           * Auto-focusing of a freshly-opened modal element causes any child elements
           * with the autofocus attribute to lose focus. This is an issue on touch
           * based devices which will show and then hide the onscreen keyboard.
           * Attempts to refocus the autofocus element via JavaScript will not reopen
           * the onscreen keyboard. Fixed by updated the focusing logic to only autofocus
           * the modal element if the modal does not contain an autofocus element.
           */
          if (!element[0].querySelectorAll('[autofocus]').length) {
            element[0].focus();
          }
        });
        scope.close = function (evt) {
          var modal = $modalStack.getTop();
          if (modal && modal.value.backdrop && modal.value.backdrop != 'static' && evt.target === evt.currentTarget) {
            evt.preventDefault();
            evt.stopPropagation();
            $modalStack.dismiss(modal.key, 'backdrop click');
          }
        };
      }
    };
  }
]).directive('modalTransclude', function () {
  return {
    link: function ($scope, $element, $attrs, controller, $transclude) {
      $transclude($scope.$parent, function (clone) {
        $element.empty();
        $element.append(clone);
      });
    }
  };
}).factory('$modalStack', [
  '$transition',
  '$timeout',
  '$document',
  '$compile',
  '$rootScope',
  '$$stackedMap',
  function ($transition, $timeout, $document, $compile, $rootScope, $$stackedMap) {
    var OPENED_MODAL_CLASS = 'modal-open';
    var backdropDomEl, backdropScope;
    var openedWindows = $$stackedMap.createNew();
    var $modalStack = {};
    function backdropIndex() {
      var topBackdropIndex = -1;
      var opened = openedWindows.keys();
      for (var i = 0; i < opened.length; i++) {
        if (openedWindows.get(opened[i]).value.backdrop) {
          topBackdropIndex = i;
        }
      }
      return topBackdropIndex;
    }
    $rootScope.$watch(backdropIndex, function (newBackdropIndex) {
      if (backdropScope) {
        backdropScope.index = newBackdropIndex;
      }
    });
    function removeModalWindow(modalInstance) {
      var body = $document.find('body').eq(0);
      var modalWindow = openedWindows.get(modalInstance).value;
      //clean up the stack
      openedWindows.remove(modalInstance);
      //remove window DOM element
      removeAfterAnimate(modalWindow.modalDomEl, modalWindow.modalScope, 300, function () {
        modalWindow.modalScope.$destroy();
        body.toggleClass(OPENED_MODAL_CLASS, openedWindows.length() > 0);
        checkRemoveBackdrop();
      });
    }
    function checkRemoveBackdrop() {
      //remove backdrop if no longer needed
      if (backdropDomEl && backdropIndex() == -1) {
        var backdropScopeRef = backdropScope;
        removeAfterAnimate(backdropDomEl, backdropScope, 150, function () {
          backdropScopeRef.$destroy();
          backdropScopeRef = null;
        });
        backdropDomEl = undefined;
        backdropScope = undefined;
      }
    }
    function removeAfterAnimate(domEl, scope, emulateTime, done) {
      // Closing animation
      scope.animate = false;
      var transitionEndEventName = $transition.transitionEndEventName;
      if (transitionEndEventName) {
        // transition out
        var timeout = $timeout(afterAnimating, emulateTime);
        domEl.bind(transitionEndEventName, function () {
          $timeout.cancel(timeout);
          afterAnimating();
          scope.$apply();
        });
      } else {
        // Ensure this call is async
        $timeout(afterAnimating);
      }
      function afterAnimating() {
        if (afterAnimating.done) {
          return;
        }
        afterAnimating.done = true;
        domEl.remove();
        if (done) {
          done();
        }
      }
    }
    $document.bind('keydown', function (evt) {
      var modal;
      if (evt.which === 27) {
        modal = openedWindows.top();
        if (modal && modal.value.keyboard) {
          evt.preventDefault();
          $rootScope.$apply(function () {
            $modalStack.dismiss(modal.key, 'escape key press');
          });
        }
      }
    });
    $modalStack.open = function (modalInstance, modal) {
      openedWindows.add(modalInstance, {
        deferred: modal.deferred,
        modalScope: modal.scope,
        backdrop: modal.backdrop,
        keyboard: modal.keyboard
      });
      var body = $document.find('body').eq(0), currBackdropIndex = backdropIndex();
      if (currBackdropIndex >= 0 && !backdropDomEl) {
        backdropScope = $rootScope.$new(true);
        backdropScope.index = currBackdropIndex;
        var angularBackgroundDomEl = angular.element('<div modal-backdrop></div>');
        angularBackgroundDomEl.attr('backdrop-class', modal.backdropClass);
        backdropDomEl = $compile(angularBackgroundDomEl)(backdropScope);
        body.append(backdropDomEl);
      }
      var angularDomEl = angular.element('<div modal-window></div>');
      angularDomEl.attr({
        'template-url': modal.windowTemplateUrl,
        'window-class': modal.windowClass,
        'size': modal.size,
        'index': openedWindows.length() - 1,
        'animate': 'animate'
      }).html(modal.content);
      var modalDomEl = $compile(angularDomEl)(modal.scope);
      openedWindows.top().value.modalDomEl = modalDomEl;
      body.append(modalDomEl);
      body.addClass(OPENED_MODAL_CLASS);
    };
    $modalStack.close = function (modalInstance, result) {
      var modalWindow = openedWindows.get(modalInstance);
      if (modalWindow) {
        modalWindow.value.deferred.resolve(result);
        removeModalWindow(modalInstance);
      }
    };
    $modalStack.dismiss = function (modalInstance, reason) {
      var modalWindow = openedWindows.get(modalInstance);
      if (modalWindow) {
        modalWindow.value.deferred.reject(reason);
        removeModalWindow(modalInstance);
      }
    };
    $modalStack.dismissAll = function (reason) {
      var topModal = this.getTop();
      while (topModal) {
        this.dismiss(topModal.key, reason);
        topModal = this.getTop();
      }
    };
    $modalStack.getTop = function () {
      return openedWindows.top();
    };
    return $modalStack;
  }
]).provider('$modal', function () {
  var $modalProvider = {
      options: {
        backdrop: true,
        keyboard: true
      },
      $get: [
        '$injector',
        '$rootScope',
        '$q',
        '$http',
        '$templateCache',
        '$controller',
        '$modalStack',
        function ($injector, $rootScope, $q, $http, $templateCache, $controller, $modalStack) {
          var $modal = {};
          function getTemplatePromise(options) {
            return options.template ? $q.when(options.template) : $http.get(angular.isFunction(options.templateUrl) ? options.templateUrl() : options.templateUrl, { cache: $templateCache }).then(function (result) {
              return result.data;
            });
          }
          function getResolvePromises(resolves) {
            var promisesArr = [];
            angular.forEach(resolves, function (value) {
              if (angular.isFunction(value) || angular.isArray(value)) {
                promisesArr.push($q.when($injector.invoke(value)));
              }
            });
            return promisesArr;
          }
          $modal.open = function (modalOptions) {
            var modalResultDeferred = $q.defer();
            var modalOpenedDeferred = $q.defer();
            //prepare an instance of a modal to be injected into controllers and returned to a caller
            var modalInstance = {
                result: modalResultDeferred.promise,
                opened: modalOpenedDeferred.promise,
                close: function (result) {
                  $modalStack.close(modalInstance, result);
                },
                dismiss: function (reason) {
                  $modalStack.dismiss(modalInstance, reason);
                }
              };
            //merge and clean up options
            modalOptions = angular.extend({}, $modalProvider.options, modalOptions);
            modalOptions.resolve = modalOptions.resolve || {};
            //verify options
            if (!modalOptions.template && !modalOptions.templateUrl) {
              throw new Error('One of template or templateUrl options is required.');
            }
            var templateAndResolvePromise = $q.all([getTemplatePromise(modalOptions)].concat(getResolvePromises(modalOptions.resolve)));
            templateAndResolvePromise.then(function resolveSuccess(tplAndVars) {
              var modalScope = (modalOptions.scope || $rootScope).$new();
              modalScope.$close = modalInstance.close;
              modalScope.$dismiss = modalInstance.dismiss;
              var ctrlInstance, ctrlLocals = {};
              var resolveIter = 1;
              //controllers
              if (modalOptions.controller) {
                ctrlLocals.$scope = modalScope;
                ctrlLocals.$modalInstance = modalInstance;
                angular.forEach(modalOptions.resolve, function (value, key) {
                  ctrlLocals[key] = tplAndVars[resolveIter++];
                });
                ctrlInstance = $controller(modalOptions.controller, ctrlLocals);
                if (modalOptions.controllerAs) {
                  modalScope[modalOptions.controllerAs] = ctrlInstance;
                }
              }
              $modalStack.open(modalInstance, {
                scope: modalScope,
                deferred: modalResultDeferred,
                content: tplAndVars[0],
                backdrop: modalOptions.backdrop,
                keyboard: modalOptions.keyboard,
                backdropClass: modalOptions.backdropClass,
                windowClass: modalOptions.windowClass,
                windowTemplateUrl: modalOptions.windowTemplateUrl,
                size: modalOptions.size
              });
            }, function resolveError(reason) {
              modalResultDeferred.reject(reason);
            });
            templateAndResolvePromise.then(function () {
              modalOpenedDeferred.resolve(true);
            }, function () {
              modalOpenedDeferred.reject(false);
            });
            return modalInstance;
          };
          return $modal;
        }
      ]
    };
  return $modalProvider;
});
angular.module('ui.bootstrap.pagination', []).controller('PaginationController', [
  '$scope',
  '$attrs',
  '$parse',
  function ($scope, $attrs, $parse) {
    var self = this, ngModelCtrl = { $setViewValue: angular.noop },
      // nullModelCtrl
      setNumPages = $attrs.numPages ? $parse($attrs.numPages).assign : angular.noop;
    this.init = function (ngModelCtrl_, config) {
      ngModelCtrl = ngModelCtrl_;
      this.config = config;
      ngModelCtrl.$render = function () {
        self.render();
      };
      if ($attrs.itemsPerPage) {
        $scope.$parent.$watch($parse($attrs.itemsPerPage), function (value) {
          self.itemsPerPage = parseInt(value, 10);
          $scope.totalPages = self.calculateTotalPages();
        });
      } else {
        this.itemsPerPage = config.itemsPerPage;
      }
    };
    this.calculateTotalPages = function () {
      var totalPages = this.itemsPerPage < 1 ? 1 : Math.ceil($scope.totalItems / this.itemsPerPage);
      return Math.max(totalPages || 0, 1);
    };
    this.render = function () {
      $scope.page = parseInt(ngModelCtrl.$viewValue, 10) || 1;
    };
    $scope.selectPage = function (page) {
      if ($scope.page !== page && page > 0 && page <= $scope.totalPages) {
        ngModelCtrl.$setViewValue(page);
        ngModelCtrl.$render();
      }
    };
    $scope.getText = function (key) {
      return $scope[key + 'Text'] || self.config[key + 'Text'];
    };
    $scope.noPrevious = function () {
      return $scope.page === 1;
    };
    $scope.noNext = function () {
      return $scope.page === $scope.totalPages;
    };
    $scope.$watch('totalItems', function () {
      $scope.totalPages = self.calculateTotalPages();
    });
    $scope.$watch('totalPages', function (value) {
      setNumPages($scope.$parent, value);
      // Readonly variable
      if ($scope.page > value) {
        $scope.selectPage(value);
      } else {
        ngModelCtrl.$render();
      }
    });
  }
]).constant('paginationConfig', {
  itemsPerPage: 10,
  boundaryLinks: false,
  directionLinks: true,
  firstText: 'First',
  previousText: 'Previous',
  nextText: 'Next',
  lastText: 'Last',
  rotate: true
}).directive('pagination', [
  '$parse',
  'paginationConfig',
  function ($parse, paginationConfig) {
    return {
      restrict: 'EA',
      scope: {
        totalItems: '=',
        firstText: '@',
        previousText: '@',
        nextText: '@',
        lastText: '@'
      },
      require: [
        'pagination',
        '?ngModel'
      ],
      controller: 'PaginationController',
      templateUrl: 'template/pagination/pagination.html',
      replace: true,
      link: function (scope, element, attrs, ctrls) {
        var paginationCtrl = ctrls[0], ngModelCtrl = ctrls[1];
        if (!ngModelCtrl) {
          return;  // do nothing if no ng-model
        }
        // Setup configuration parameters
        var maxSize = angular.isDefined(attrs.maxSize) ? scope.$parent.$eval(attrs.maxSize) : paginationConfig.maxSize, rotate = angular.isDefined(attrs.rotate) ? scope.$parent.$eval(attrs.rotate) : paginationConfig.rotate;
        scope.boundaryLinks = angular.isDefined(attrs.boundaryLinks) ? scope.$parent.$eval(attrs.boundaryLinks) : paginationConfig.boundaryLinks;
        scope.directionLinks = angular.isDefined(attrs.directionLinks) ? scope.$parent.$eval(attrs.directionLinks) : paginationConfig.directionLinks;
        paginationCtrl.init(ngModelCtrl, paginationConfig);
        if (attrs.maxSize) {
          scope.$parent.$watch($parse(attrs.maxSize), function (value) {
            maxSize = parseInt(value, 10);
            paginationCtrl.render();
          });
        }
        // Create page object used in template
        function makePage(number, text, isActive) {
          return {
            number: number,
            text: text,
            active: isActive
          };
        }
        function getPages(currentPage, totalPages) {
          var pages = [];
          // Default page limits
          var startPage = 1, endPage = totalPages;
          var isMaxSized = angular.isDefined(maxSize) && maxSize < totalPages;
          // recompute if maxSize
          if (isMaxSized) {
            if (rotate) {
              // Current page is displayed in the middle of the visible ones
              startPage = Math.max(currentPage - Math.floor(maxSize / 2), 1);
              endPage = startPage + maxSize - 1;
              // Adjust if limit is exceeded
              if (endPage > totalPages) {
                endPage = totalPages;
                startPage = endPage - maxSize + 1;
              }
            } else {
              // Visible pages are paginated with maxSize
              startPage = (Math.ceil(currentPage / maxSize) - 1) * maxSize + 1;
              // Adjust last page if limit is exceeded
              endPage = Math.min(startPage + maxSize - 1, totalPages);
            }
          }
          // Add page number links
          for (var number = startPage; number <= endPage; number++) {
            var page = makePage(number, number, number === currentPage);
            pages.push(page);
          }
          // Add links to move between page sets
          if (isMaxSized && !rotate) {
            if (startPage > 1) {
              var previousPageSet = makePage(startPage - 1, '...', false);
              pages.unshift(previousPageSet);
            }
            if (endPage < totalPages) {
              var nextPageSet = makePage(endPage + 1, '...', false);
              pages.push(nextPageSet);
            }
          }
          return pages;
        }
        var originalRender = paginationCtrl.render;
        paginationCtrl.render = function () {
          originalRender();
          if (scope.page > 0 && scope.page <= scope.totalPages) {
            scope.pages = getPages(scope.page, scope.totalPages);
          }
        };
      }
    };
  }
]).constant('pagerConfig', {
  itemsPerPage: 10,
  previousText: '\xab Previous',
  nextText: 'Next \xbb',
  align: true
}).directive('pager', [
  'pagerConfig',
  function (pagerConfig) {
    return {
      restrict: 'EA',
      scope: {
        totalItems: '=',
        previousText: '@',
        nextText: '@'
      },
      require: [
        'pager',
        '?ngModel'
      ],
      controller: 'PaginationController',
      templateUrl: 'template/pagination/pager.html',
      replace: true,
      link: function (scope, element, attrs, ctrls) {
        var paginationCtrl = ctrls[0], ngModelCtrl = ctrls[1];
        if (!ngModelCtrl) {
          return;  // do nothing if no ng-model
        }
        scope.align = angular.isDefined(attrs.align) ? scope.$parent.$eval(attrs.align) : pagerConfig.align;
        paginationCtrl.init(ngModelCtrl, pagerConfig);
      }
    };
  }
]);
/**
 * The following features are still outstanding: animation as a
 * function, placement as a function, inside, support for more triggers than
 * just mouse enter/leave, html tooltips, and selector delegation.
 */
angular.module('ui.bootstrap.tooltip', [
  'ui.bootstrap.position',
  'ui.bootstrap.bindHtml'
]).provider('$tooltip', function () {
  // The default options tooltip and popover.
  var defaultOptions = {
      placement: 'top',
      animation: true,
      popupDelay: 0
    };
  // Default hide triggers for each show trigger
  var triggerMap = {
      'mouseenter': 'mouseleave',
      'click': 'click',
      'focus': 'blur'
    };
  // The options specified to the provider globally.
  var globalOptions = {};
  /**
   * `options({})` allows global configuration of all tooltips in the
   * application.
   *
   *   var app = angular.module( 'App', ['ui.bootstrap.tooltip'], function( $tooltipProvider ) {
   *     // place tooltips left instead of top by default
   *     $tooltipProvider.options( { placement: 'left' } );
   *   });
   */
  this.options = function (value) {
    angular.extend(globalOptions, value);
  };
  /**
   * This allows you to extend the set of trigger mappings available. E.g.:
   *
   *   $tooltipProvider.setTriggers( 'openTrigger': 'closeTrigger' );
   */
  this.setTriggers = function setTriggers(triggers) {
    angular.extend(triggerMap, triggers);
  };
  /**
   * This is a helper function for translating camel-case to snake-case.
   */
  function snake_case(name) {
    var regexp = /[A-Z]/g;
    var separator = '-';
    return name.replace(regexp, function (letter, pos) {
      return (pos ? separator : '') + letter.toLowerCase();
    });
  }
  /**
   * Returns the actual instance of the $tooltip service.
   * TODO support multiple triggers
   */
  this.$get = [
    '$window',
    '$compile',
    '$timeout',
    '$document',
    '$position',
    '$interpolate',
    function ($window, $compile, $timeout, $document, $position, $interpolate) {
      return function $tooltip(type, prefix, defaultTriggerShow) {
        var options = angular.extend({}, defaultOptions, globalOptions);
        /**
       * Returns an object of show and hide triggers.
       *
       * If a trigger is supplied,
       * it is used to show the tooltip; otherwise, it will use the `trigger`
       * option passed to the `$tooltipProvider.options` method; else it will
       * default to the trigger supplied to this directive factory.
       *
       * The hide trigger is based on the show trigger. If the `trigger` option
       * was passed to the `$tooltipProvider.options` method, it will use the
       * mapped trigger from `triggerMap` or the passed trigger if the map is
       * undefined; otherwise, it uses the `triggerMap` value of the show
       * trigger; else it will just use the show trigger.
       */
        function getTriggers(trigger) {
          var show = trigger || options.trigger || defaultTriggerShow;
          var hide = triggerMap[show] || show;
          return {
            show: show,
            hide: hide
          };
        }
        var directiveName = snake_case(type);
        var startSym = $interpolate.startSymbol();
        var endSym = $interpolate.endSymbol();
        var template = '<div ' + directiveName + '-popup ' + 'title="' + startSym + 'title' + endSym + '" ' + 'content="' + startSym + 'content' + endSym + '" ' + 'placement="' + startSym + 'placement' + endSym + '" ' + 'animation="animation" ' + 'is-open="isOpen"' + '>' + '</div>';
        return {
          restrict: 'EA',
          compile: function (tElem, tAttrs) {
            var tooltipLinker = $compile(template);
            return function link(scope, element, attrs) {
              var tooltip;
              var tooltipLinkedScope;
              var transitionTimeout;
              var popupTimeout;
              var appendToBody = angular.isDefined(options.appendToBody) ? options.appendToBody : false;
              var triggers = getTriggers(undefined);
              var hasEnableExp = angular.isDefined(attrs[prefix + 'Enable']);
              var ttScope = scope.$new(true);
              var positionTooltip = function () {
                var ttPosition = $position.positionElements(element, tooltip, ttScope.placement, appendToBody);
                ttPosition.top += 'px';
                ttPosition.left += 'px';
                // Now set the calculated positioning.
                tooltip.css(ttPosition);
              };
              // By default, the tooltip is not open.
              // TODO add ability to start tooltip opened
              ttScope.isOpen = false;
              function toggleTooltipBind() {
                if (!ttScope.isOpen) {
                  showTooltipBind();
                } else {
                  hideTooltipBind();
                }
              }
              // Show the tooltip with delay if specified, otherwise show it immediately
              function showTooltipBind() {
                if (hasEnableExp && !scope.$eval(attrs[prefix + 'Enable'])) {
                  return;
                }
                prepareTooltip();
                if (ttScope.popupDelay) {
                  // Do nothing if the tooltip was already scheduled to pop-up.
                  // This happens if show is triggered multiple times before any hide is triggered.
                  if (!popupTimeout) {
                    popupTimeout = $timeout(show, ttScope.popupDelay, false);
                    popupTimeout.then(function (reposition) {
                      reposition();
                    });
                  }
                } else {
                  show()();
                }
              }
              function hideTooltipBind() {
                scope.$apply(function () {
                  hide();
                });
              }
              // Show the tooltip popup element.
              function show() {
                popupTimeout = null;
                // If there is a pending remove transition, we must cancel it, lest the
                // tooltip be mysteriously removed.
                if (transitionTimeout) {
                  $timeout.cancel(transitionTimeout);
                  transitionTimeout = null;
                }
                // Don't show empty tooltips.
                if (!ttScope.content) {
                  return angular.noop;
                }
                createTooltip();
                // Set the initial positioning.
                tooltip.css({
                  top: 0,
                  left: 0,
                  display: 'block'
                });
                // Now we add it to the DOM because need some info about it. But it's not
                // visible yet anyway.
                if (appendToBody) {
                  $document.find('body').append(tooltip);
                } else {
                  element.after(tooltip);
                }
                positionTooltip();
                // And show the tooltip.
                ttScope.isOpen = true;
                ttScope.$digest();
                // digest required as $apply is not called
                // Return positioning function as promise callback for correct
                // positioning after draw.
                return positionTooltip;
              }
              // Hide the tooltip popup element.
              function hide() {
                // First things first: we don't show it anymore.
                ttScope.isOpen = false;
                //if tooltip is going to be shown after delay, we must cancel this
                $timeout.cancel(popupTimeout);
                popupTimeout = null;
                // And now we remove it from the DOM. However, if we have animation, we
                // need to wait for it to expire beforehand.
                // FIXME: this is a placeholder for a port of the transitions library.
                if (ttScope.animation) {
                  if (!transitionTimeout) {
                    transitionTimeout = $timeout(removeTooltip, 500);
                  }
                } else {
                  removeTooltip();
                }
              }
              function createTooltip() {
                // There can only be one tooltip element per directive shown at once.
                if (tooltip) {
                  removeTooltip();
                }
                tooltipLinkedScope = ttScope.$new();
                tooltip = tooltipLinker(tooltipLinkedScope, angular.noop);
              }
              function removeTooltip() {
                transitionTimeout = null;
                if (tooltip) {
                  tooltip.remove();
                  tooltip = null;
                }
                if (tooltipLinkedScope) {
                  tooltipLinkedScope.$destroy();
                  tooltipLinkedScope = null;
                }
              }
              function prepareTooltip() {
                prepPlacement();
                prepPopupDelay();
              }
              /**
             * Observe the relevant attributes.
             */
              attrs.$observe(type, function (val) {
                ttScope.content = val;
                if (!val && ttScope.isOpen) {
                  hide();
                }
              });
              attrs.$observe(prefix + 'Title', function (val) {
                ttScope.title = val;
              });
              function prepPlacement() {
                var val = attrs[prefix + 'Placement'];
                ttScope.placement = angular.isDefined(val) ? val : options.placement;
              }
              function prepPopupDelay() {
                var val = attrs[prefix + 'PopupDelay'];
                var delay = parseInt(val, 10);
                ttScope.popupDelay = !isNaN(delay) ? delay : options.popupDelay;
              }
              var unregisterTriggers = function () {
                element.unbind(triggers.show, showTooltipBind);
                element.unbind(triggers.hide, hideTooltipBind);
              };
              function prepTriggers() {
                var val = attrs[prefix + 'Trigger'];
                unregisterTriggers();
                triggers = getTriggers(val);
                if (triggers.show === triggers.hide) {
                  element.bind(triggers.show, toggleTooltipBind);
                } else {
                  element.bind(triggers.show, showTooltipBind);
                  element.bind(triggers.hide, hideTooltipBind);
                }
              }
              prepTriggers();
              var animation = scope.$eval(attrs[prefix + 'Animation']);
              ttScope.animation = angular.isDefined(animation) ? !!animation : options.animation;
              var appendToBodyVal = scope.$eval(attrs[prefix + 'AppendToBody']);
              appendToBody = angular.isDefined(appendToBodyVal) ? appendToBodyVal : appendToBody;
              // if a tooltip is attached to <body> we need to remove it on
              // location change as its parent scope will probably not be destroyed
              // by the change.
              if (appendToBody) {
                scope.$on('$locationChangeSuccess', function closeTooltipOnLocationChangeSuccess() {
                  if (ttScope.isOpen) {
                    hide();
                  }
                });
              }
              // Make sure tooltip is destroyed and removed.
              scope.$on('$destroy', function onDestroyTooltip() {
                $timeout.cancel(transitionTimeout);
                $timeout.cancel(popupTimeout);
                unregisterTriggers();
                removeTooltip();
                ttScope = null;
              });
            };
          }
        };
      };
    }
  ];
}).directive('tooltipPopup', function () {
  return {
    restrict: 'EA',
    replace: true,
    scope: {
      content: '@',
      placement: '@',
      animation: '&',
      isOpen: '&'
    },
    templateUrl: 'template/tooltip/tooltip-popup.html'
  };
}).directive('tooltip', [
  '$tooltip',
  function ($tooltip) {
    return $tooltip('tooltip', 'tooltip', 'mouseenter');
  }
]).directive('tooltipHtmlUnsafePopup', function () {
  return {
    restrict: 'EA',
    replace: true,
    scope: {
      content: '@',
      placement: '@',
      animation: '&',
      isOpen: '&'
    },
    templateUrl: 'template/tooltip/tooltip-html-unsafe-popup.html'
  };
}).directive('tooltipHtmlUnsafe', [
  '$tooltip',
  function ($tooltip) {
    return $tooltip('tooltipHtmlUnsafe', 'tooltip', 'mouseenter');
  }
]);
/**
 * The following features are still outstanding: popup delay, animation as a
 * function, placement as a function, inside, support for more triggers than
 * just mouse enter/leave, html popovers, and selector delegatation.
 */
angular.module('ui.bootstrap.popover', ['ui.bootstrap.tooltip']).directive('popoverPopup', function () {
  return {
    restrict: 'EA',
    replace: true,
    scope: {
      title: '@',
      content: '@',
      placement: '@',
      animation: '&',
      isOpen: '&'
    },
    templateUrl: 'template/popover/popover.html'
  };
}).directive('popover', [
  '$tooltip',
  function ($tooltip) {
    return $tooltip('popover', 'popover', 'click');
  }
]);
angular.module('ui.bootstrap.progressbar', []).constant('progressConfig', {
  animate: true,
  max: 100
}).controller('ProgressController', [
  '$scope',
  '$attrs',
  'progressConfig',
  function ($scope, $attrs, progressConfig) {
    var self = this, animate = angular.isDefined($attrs.animate) ? $scope.$parent.$eval($attrs.animate) : progressConfig.animate;
    this.bars = [];
    $scope.max = angular.isDefined($attrs.max) ? $scope.$parent.$eval($attrs.max) : progressConfig.max;
    this.addBar = function (bar, element) {
      if (!animate) {
        element.css({ 'transition': 'none' });
      }
      this.bars.push(bar);
      bar.$watch('value', function (value) {
        bar.percent = +(100 * value / $scope.max).toFixed(2);
      });
      bar.$on('$destroy', function () {
        element = null;
        self.removeBar(bar);
      });
    };
    this.removeBar = function (bar) {
      this.bars.splice(this.bars.indexOf(bar), 1);
    };
  }
]).directive('progress', function () {
  return {
    restrict: 'EA',
    replace: true,
    transclude: true,
    controller: 'ProgressController',
    require: 'progress',
    scope: {},
    templateUrl: 'template/progressbar/progress.html'
  };
}).directive('bar', function () {
  return {
    restrict: 'EA',
    replace: true,
    transclude: true,
    require: '^progress',
    scope: {
      value: '=',
      type: '@'
    },
    templateUrl: 'template/progressbar/bar.html',
    link: function (scope, element, attrs, progressCtrl) {
      progressCtrl.addBar(scope, element);
    }
  };
}).directive('progressbar', function () {
  return {
    restrict: 'EA',
    replace: true,
    transclude: true,
    controller: 'ProgressController',
    scope: {
      value: '=',
      type: '@'
    },
    templateUrl: 'template/progressbar/progressbar.html',
    link: function (scope, element, attrs, progressCtrl) {
      progressCtrl.addBar(scope, angular.element(element.children()[0]));
    }
  };
});
angular.module('ui.bootstrap.rating', []).constant('ratingConfig', {
  max: 5,
  stateOn: null,
  stateOff: null
}).controller('RatingController', [
  '$scope',
  '$attrs',
  'ratingConfig',
  function ($scope, $attrs, ratingConfig) {
    var ngModelCtrl = { $setViewValue: angular.noop };
    this.init = function (ngModelCtrl_) {
      ngModelCtrl = ngModelCtrl_;
      ngModelCtrl.$render = this.render;
      this.stateOn = angular.isDefined($attrs.stateOn) ? $scope.$parent.$eval($attrs.stateOn) : ratingConfig.stateOn;
      this.stateOff = angular.isDefined($attrs.stateOff) ? $scope.$parent.$eval($attrs.stateOff) : ratingConfig.stateOff;
      var ratingStates = angular.isDefined($attrs.ratingStates) ? $scope.$parent.$eval($attrs.ratingStates) : new Array(angular.isDefined($attrs.max) ? $scope.$parent.$eval($attrs.max) : ratingConfig.max);
      $scope.range = this.buildTemplateObjects(ratingStates);
    };
    this.buildTemplateObjects = function (states) {
      for (var i = 0, n = states.length; i < n; i++) {
        states[i] = angular.extend({ index: i }, {
          stateOn: this.stateOn,
          stateOff: this.stateOff
        }, states[i]);
      }
      return states;
    };
    $scope.rate = function (value) {
      if (!$scope.readonly && value >= 0 && value <= $scope.range.length) {
        ngModelCtrl.$setViewValue(value);
        ngModelCtrl.$render();
      }
    };
    $scope.enter = function (value) {
      if (!$scope.readonly) {
        $scope.value = value;
      }
      $scope.onHover({ value: value });
    };
    $scope.reset = function () {
      $scope.value = ngModelCtrl.$viewValue;
      $scope.onLeave();
    };
    $scope.onKeydown = function (evt) {
      if (/(37|38|39|40)/.test(evt.which)) {
        evt.preventDefault();
        evt.stopPropagation();
        $scope.rate($scope.value + (evt.which === 38 || evt.which === 39 ? 1 : -1));
      }
    };
    this.render = function () {
      $scope.value = ngModelCtrl.$viewValue;
    };
  }
]).directive('rating', function () {
  return {
    restrict: 'EA',
    require: [
      'rating',
      'ngModel'
    ],
    scope: {
      readonly: '=?',
      onHover: '&',
      onLeave: '&'
    },
    controller: 'RatingController',
    templateUrl: 'template/rating/rating.html',
    replace: true,
    link: function (scope, element, attrs, ctrls) {
      var ratingCtrl = ctrls[0], ngModelCtrl = ctrls[1];
      if (ngModelCtrl) {
        ratingCtrl.init(ngModelCtrl);
      }
    }
  };
});
/**
 * @ngdoc overview
 * @name ui.bootstrap.tabs
 *
 * @description
 * AngularJS version of the tabs directive.
 */
angular.module('ui.bootstrap.tabs', []).controller('TabsetController', [
  '$scope',
  function TabsetCtrl($scope) {
    var ctrl = this, tabs = ctrl.tabs = $scope.tabs = [];
    ctrl.select = function (selectedTab) {
      angular.forEach(tabs, function (tab) {
        if (tab.active && tab !== selectedTab) {
          tab.active = false;
          tab.onDeselect();
        }
      });
      selectedTab.active = true;
      selectedTab.onSelect();
    };
    ctrl.addTab = function addTab(tab) {
      tabs.push(tab);
      // we can't run the select function on the first tab
      // since that would select it twice
      if (tabs.length === 1) {
        tab.active = true;
      } else if (tab.active) {
        ctrl.select(tab);
      }
    };
    ctrl.removeTab = function removeTab(tab) {
      var index = tabs.indexOf(tab);
      //Select a new tab if the tab to be removed is selected and not destroyed
      if (tab.active && tabs.length > 1 && !destroyed) {
        //If this is the last tab, select the previous tab. else, the next tab.
        var newActiveIndex = index == tabs.length - 1 ? index - 1 : index + 1;
        ctrl.select(tabs[newActiveIndex]);
      }
      tabs.splice(index, 1);
    };
    var destroyed;
    $scope.$on('$destroy', function () {
      destroyed = true;
    });
  }
]).directive('tabset', function () {
  return {
    restrict: 'EA',
    transclude: true,
    replace: true,
    scope: { type: '@' },
    controller: 'TabsetController',
    templateUrl: 'template/tabs/tabset.html',
    link: function (scope, element, attrs) {
      scope.vertical = angular.isDefined(attrs.vertical) ? scope.$parent.$eval(attrs.vertical) : false;
      scope.justified = angular.isDefined(attrs.justified) ? scope.$parent.$eval(attrs.justified) : false;
    }
  };
}).directive('tab', [
  '$parse',
  function ($parse) {
    return {
      require: '^tabset',
      restrict: 'EA',
      replace: true,
      templateUrl: 'template/tabs/tab.html',
      transclude: true,
      scope: {
        active: '=?',
        heading: '@',
        onSelect: '&select',
        onDeselect: '&deselect'
      },
      controller: function () {
      },
      compile: function (elm, attrs, transclude) {
        return function postLink(scope, elm, attrs, tabsetCtrl) {
          scope.$watch('active', function (active) {
            if (active) {
              tabsetCtrl.select(scope);
            }
          });
          scope.disabled = false;
          if (attrs.disabled) {
            scope.$parent.$watch($parse(attrs.disabled), function (value) {
              scope.disabled = !!value;
            });
          }
          scope.select = function () {
            if (!scope.disabled) {
              scope.active = true;
            }
          };
          tabsetCtrl.addTab(scope);
          scope.$on('$destroy', function () {
            tabsetCtrl.removeTab(scope);
          });
          //We need to transclude later, once the content container is ready.
          //when this link happens, we're inside a tab heading.
          scope.$transcludeFn = transclude;
        };
      }
    };
  }
]).directive('tabHeadingTransclude', [function () {
    return {
      restrict: 'A',
      require: '^tab',
      link: function (scope, elm, attrs, tabCtrl) {
        scope.$watch('headingElement', function updateHeadingElement(heading) {
          if (heading) {
            elm.html('');
            elm.append(heading);
          }
        });
      }
    };
  }]).directive('tabContentTransclude', function () {
  return {
    restrict: 'A',
    require: '^tabset',
    link: function (scope, elm, attrs) {
      var tab = scope.$eval(attrs.tabContentTransclude);
      //Now our tab is ready to be transcluded: both the tab heading area
      //and the tab content area are loaded.  Transclude 'em both.
      tab.$transcludeFn(tab.$parent, function (contents) {
        angular.forEach(contents, function (node) {
          if (isTabHeading(node)) {
            //Let tabHeadingTransclude know.
            tab.headingElement = node;
          } else {
            elm.append(node);
          }
        });
      });
    }
  };
  function isTabHeading(node) {
    return node.tagName && (node.hasAttribute('tab-heading') || node.hasAttribute('data-tab-heading') || node.tagName.toLowerCase() === 'tab-heading' || node.tagName.toLowerCase() === 'data-tab-heading');
  }
});
;
angular.module('ui.bootstrap.timepicker', []).constant('timepickerConfig', {
  hourStep: 1,
  minuteStep: 1,
  showMeridian: true,
  meridians: null,
  readonlyInput: false,
  mousewheel: true
}).controller('TimepickerController', [
  '$scope',
  '$attrs',
  '$parse',
  '$log',
  '$locale',
  'timepickerConfig',
  function ($scope, $attrs, $parse, $log, $locale, timepickerConfig) {
    var selected = new Date(), ngModelCtrl = { $setViewValue: angular.noop },
      // nullModelCtrl
      meridians = angular.isDefined($attrs.meridians) ? $scope.$parent.$eval($attrs.meridians) : timepickerConfig.meridians || $locale.DATETIME_FORMATS.AMPMS;
    this.init = function (ngModelCtrl_, inputs) {
      ngModelCtrl = ngModelCtrl_;
      ngModelCtrl.$render = this.render;
      var hoursInputEl = inputs.eq(0), minutesInputEl = inputs.eq(1);
      var mousewheel = angular.isDefined($attrs.mousewheel) ? $scope.$parent.$eval($attrs.mousewheel) : timepickerConfig.mousewheel;
      if (mousewheel) {
        this.setupMousewheelEvents(hoursInputEl, minutesInputEl);
      }
      $scope.readonlyInput = angular.isDefined($attrs.readonlyInput) ? $scope.$parent.$eval($attrs.readonlyInput) : timepickerConfig.readonlyInput;
      this.setupInputEvents(hoursInputEl, minutesInputEl);
    };
    var hourStep = timepickerConfig.hourStep;
    if ($attrs.hourStep) {
      $scope.$parent.$watch($parse($attrs.hourStep), function (value) {
        hourStep = parseInt(value, 10);
      });
    }
    var minuteStep = timepickerConfig.minuteStep;
    if ($attrs.minuteStep) {
      $scope.$parent.$watch($parse($attrs.minuteStep), function (value) {
        minuteStep = parseInt(value, 10);
      });
    }
    // 12H / 24H mode
    $scope.showMeridian = timepickerConfig.showMeridian;
    if ($attrs.showMeridian) {
      $scope.$parent.$watch($parse($attrs.showMeridian), function (value) {
        $scope.showMeridian = !!value;
        if (ngModelCtrl.$error.time) {
          // Evaluate from template
          var hours = getHoursFromTemplate(), minutes = getMinutesFromTemplate();
          if (angular.isDefined(hours) && angular.isDefined(minutes)) {
            selected.setHours(hours);
            refresh();
          }
        } else {
          updateTemplate();
        }
      });
    }
    // Get $scope.hours in 24H mode if valid
    function getHoursFromTemplate() {
      var hours = parseInt($scope.hours, 10);
      var valid = $scope.showMeridian ? hours > 0 && hours < 13 : hours >= 0 && hours < 24;
      if (!valid) {
        return undefined;
      }
      if ($scope.showMeridian) {
        if (hours === 12) {
          hours = 0;
        }
        if ($scope.meridian === meridians[1]) {
          hours = hours + 12;
        }
      }
      return hours;
    }
    function getMinutesFromTemplate() {
      var minutes = parseInt($scope.minutes, 10);
      return minutes >= 0 && minutes < 60 ? minutes : undefined;
    }
    function pad(value) {
      return angular.isDefined(value) && value.toString().length < 2 ? '0' + value : value;
    }
    // Respond on mousewheel spin
    this.setupMousewheelEvents = function (hoursInputEl, minutesInputEl) {
      var isScrollingUp = function (e) {
        if (e.originalEvent) {
          e = e.originalEvent;
        }
        //pick correct delta variable depending on event
        var delta = e.wheelDelta ? e.wheelDelta : -e.deltaY;
        return e.detail || delta > 0;
      };
      hoursInputEl.bind('mousewheel wheel', function (e) {
        $scope.$apply(isScrollingUp(e) ? $scope.incrementHours() : $scope.decrementHours());
        e.preventDefault();
      });
      minutesInputEl.bind('mousewheel wheel', function (e) {
        $scope.$apply(isScrollingUp(e) ? $scope.incrementMinutes() : $scope.decrementMinutes());
        e.preventDefault();
      });
    };
    this.setupInputEvents = function (hoursInputEl, minutesInputEl) {
      if ($scope.readonlyInput) {
        $scope.updateHours = angular.noop;
        $scope.updateMinutes = angular.noop;
        return;
      }
      var invalidate = function (invalidHours, invalidMinutes) {
        ngModelCtrl.$setViewValue(null);
        ngModelCtrl.$setValidity('time', false);
        if (angular.isDefined(invalidHours)) {
          $scope.invalidHours = invalidHours;
        }
        if (angular.isDefined(invalidMinutes)) {
          $scope.invalidMinutes = invalidMinutes;
        }
      };
      $scope.updateHours = function () {
        var hours = getHoursFromTemplate();
        if (angular.isDefined(hours)) {
          selected.setHours(hours);
          refresh('h');
        } else {
          invalidate(true);
        }
      };
      hoursInputEl.bind('blur', function (e) {
        if (!$scope.invalidHours && $scope.hours < 10) {
          $scope.$apply(function () {
            $scope.hours = pad($scope.hours);
          });
        }
      });
      $scope.updateMinutes = function () {
        var minutes = getMinutesFromTemplate();
        if (angular.isDefined(minutes)) {
          selected.setMinutes(minutes);
          refresh('m');
        } else {
          invalidate(undefined, true);
        }
      };
      minutesInputEl.bind('blur', function (e) {
        if (!$scope.invalidMinutes && $scope.minutes < 10) {
          $scope.$apply(function () {
            $scope.minutes = pad($scope.minutes);
          });
        }
      });
    };
    this.render = function () {
      var date = ngModelCtrl.$modelValue ? new Date(ngModelCtrl.$modelValue) : null;
      if (isNaN(date)) {
        ngModelCtrl.$setValidity('time', false);
        $log.error('Timepicker directive: "ng-model" value must be a Date object, a number of milliseconds since 01.01.1970 or a string representing an RFC2822 or ISO 8601 date.');
      } else {
        if (date) {
          selected = date;
        }
        makeValid();
        updateTemplate();
      }
    };
    // Call internally when we know that model is valid.
    function refresh(keyboardChange) {
      makeValid();
      ngModelCtrl.$setViewValue(new Date(selected));
      updateTemplate(keyboardChange);
    }
    function makeValid() {
      ngModelCtrl.$setValidity('time', true);
      $scope.invalidHours = false;
      $scope.invalidMinutes = false;
    }
    function updateTemplate(keyboardChange) {
      var hours = selected.getHours(), minutes = selected.getMinutes();
      if ($scope.showMeridian) {
        hours = hours === 0 || hours === 12 ? 12 : hours % 12;  // Convert 24 to 12 hour system
      }
      $scope.hours = keyboardChange === 'h' ? hours : pad(hours);
      $scope.minutes = keyboardChange === 'm' ? minutes : pad(minutes);
      $scope.meridian = selected.getHours() < 12 ? meridians[0] : meridians[1];
    }
    function addMinutes(minutes) {
      var dt = new Date(selected.getTime() + minutes * 60000);
      selected.setHours(dt.getHours(), dt.getMinutes());
      refresh();
    }
    $scope.incrementHours = function () {
      addMinutes(hourStep * 60);
    };
    $scope.decrementHours = function () {
      addMinutes(-hourStep * 60);
    };
    $scope.incrementMinutes = function () {
      addMinutes(minuteStep);
    };
    $scope.decrementMinutes = function () {
      addMinutes(-minuteStep);
    };
    $scope.toggleMeridian = function () {
      addMinutes(12 * 60 * (selected.getHours() < 12 ? 1 : -1));
    };
  }
]).directive('timepicker', function () {
  return {
    restrict: 'EA',
    require: [
      'timepicker',
      '?^ngModel'
    ],
    controller: 'TimepickerController',
    replace: true,
    scope: {},
    templateUrl: 'template/timepicker/timepicker.html',
    link: function (scope, element, attrs, ctrls) {
      var timepickerCtrl = ctrls[0], ngModelCtrl = ctrls[1];
      if (ngModelCtrl) {
        timepickerCtrl.init(ngModelCtrl, element.find('input'));
      }
    }
  };
});
angular.module('ui.bootstrap.typeahead', [
  'ui.bootstrap.position',
  'ui.bootstrap.bindHtml'
]).factory('typeaheadParser', [
  '$parse',
  function ($parse) {
    //                      00000111000000000000022200000000000000003333333333333330000000000044000
    var TYPEAHEAD_REGEXP = /^\s*([\s\S]+?)(?:\s+as\s+([\s\S]+?))?\s+for\s+(?:([\$\w][\$\w\d]*))\s+in\s+([\s\S]+?)$/;
    return {
      parse: function (input) {
        var match = input.match(TYPEAHEAD_REGEXP);
        if (!match) {
          throw new Error('Expected typeahead specification in form of "_modelValue_ (as _label_)? for _item_ in _collection_"' + ' but got "' + input + '".');
        }
        return {
          itemName: match[3],
          source: $parse(match[4]),
          viewMapper: $parse(match[2] || match[1]),
          modelMapper: $parse(match[1])
        };
      }
    };
  }
]).directive('typeahead', [
  '$compile',
  '$parse',
  '$q',
  '$timeout',
  '$document',
  '$position',
  'typeaheadParser',
  function ($compile, $parse, $q, $timeout, $document, $position, typeaheadParser) {
    var HOT_KEYS = [
        9,
        13,
        27,
        38,
        40
      ];
    return {
      require: 'ngModel',
      link: function (originalScope, element, attrs, modelCtrl) {
        //SUPPORTED ATTRIBUTES (OPTIONS)
        //minimal no of characters that needs to be entered before typeahead kicks-in
        var minSearch = originalScope.$eval(attrs.typeaheadMinLength) || 1;
        //minimal wait time after last character typed before typehead kicks-in
        var waitTime = originalScope.$eval(attrs.typeaheadWaitMs) || 0;
        //should it restrict model values to the ones selected from the popup only?
        var isEditable = originalScope.$eval(attrs.typeaheadEditable) !== false;
        //binding to a variable that indicates if matches are being retrieved asynchronously
        var isLoadingSetter = $parse(attrs.typeaheadLoading).assign || angular.noop;
        //a callback executed when a match is selected
        var onSelectCallback = $parse(attrs.typeaheadOnSelect);
        var inputFormatter = attrs.typeaheadInputFormatter ? $parse(attrs.typeaheadInputFormatter) : undefined;
        var appendToBody = attrs.typeaheadAppendToBody ? originalScope.$eval(attrs.typeaheadAppendToBody) : false;
        var focusFirst = originalScope.$eval(attrs.typeaheadFocusFirst) !== false;
        //INTERNAL VARIABLES
        //model setter executed upon match selection
        var $setModelValue = $parse(attrs.ngModel).assign;
        //expressions used by typeahead
        var parserResult = typeaheadParser.parse(attrs.typeahead);
        var hasFocus;
        //create a child scope for the typeahead directive so we are not polluting original scope
        //with typeahead-specific data (matches, query etc.)
        var scope = originalScope.$new();
        originalScope.$on('$destroy', function () {
          scope.$destroy();
        });
        // WAI-ARIA
        var popupId = 'typeahead-' + scope.$id + '-' + Math.floor(Math.random() * 10000);
        element.attr({
          'aria-autocomplete': 'list',
          'aria-expanded': false,
          'aria-owns': popupId
        });
        //pop-up element used to display matches
        var popUpEl = angular.element('<div typeahead-popup></div>');
        popUpEl.attr({
          id: popupId,
          matches: 'matches',
          active: 'activeIdx',
          select: 'select(activeIdx)',
          query: 'query',
          position: 'position'
        });
        //custom item template
        if (angular.isDefined(attrs.typeaheadTemplateUrl)) {
          popUpEl.attr('template-url', attrs.typeaheadTemplateUrl);
        }
        var resetMatches = function () {
          scope.matches = [];
          scope.activeIdx = -1;
          element.attr('aria-expanded', false);
        };
        var getMatchId = function (index) {
          return popupId + '-option-' + index;
        };
        // Indicate that the specified match is the active (pre-selected) item in the list owned by this typeahead.
        // This attribute is added or removed automatically when the `activeIdx` changes.
        scope.$watch('activeIdx', function (index) {
          if (index < 0) {
            element.removeAttr('aria-activedescendant');
          } else {
            element.attr('aria-activedescendant', getMatchId(index));
          }
        });
        var getMatchesAsync = function (inputValue) {
          var locals = { $viewValue: inputValue };
          isLoadingSetter(originalScope, true);
          $q.when(parserResult.source(originalScope, locals)).then(function (matches) {
            //it might happen that several async queries were in progress if a user were typing fast
            //but we are interested only in responses that correspond to the current view value
            var onCurrentRequest = inputValue === modelCtrl.$viewValue;
            if (onCurrentRequest && hasFocus) {
              if (matches.length > 0) {
                scope.activeIdx = focusFirst ? 0 : -1;
                scope.matches.length = 0;
                //transform labels
                for (var i = 0; i < matches.length; i++) {
                  locals[parserResult.itemName] = matches[i];
                  scope.matches.push({
                    id: getMatchId(i),
                    label: parserResult.viewMapper(scope, locals),
                    model: matches[i]
                  });
                }
                scope.query = inputValue;
                //position pop-up with matches - we need to re-calculate its position each time we are opening a window
                //with matches as a pop-up might be absolute-positioned and position of an input might have changed on a page
                //due to other elements being rendered
                scope.position = appendToBody ? $position.offset(element) : $position.position(element);
                scope.position.top = scope.position.top + element.prop('offsetHeight');
                element.attr('aria-expanded', true);
              } else {
                resetMatches();
              }
            }
            if (onCurrentRequest) {
              isLoadingSetter(originalScope, false);
            }
          }, function () {
            resetMatches();
            isLoadingSetter(originalScope, false);
          });
        };
        resetMatches();
        //we need to propagate user's query so we can higlight matches
        scope.query = undefined;
        //Declare the timeout promise var outside the function scope so that stacked calls can be cancelled later 
        var timeoutPromise;
        var scheduleSearchWithTimeout = function (inputValue) {
          timeoutPromise = $timeout(function () {
            getMatchesAsync(inputValue);
          }, waitTime);
        };
        var cancelPreviousTimeout = function () {
          if (timeoutPromise) {
            $timeout.cancel(timeoutPromise);
          }
        };
        //plug into $parsers pipeline to open a typeahead on view changes initiated from DOM
        //$parsers kick-in on all the changes coming from the view as well as manually triggered by $setViewValue
        modelCtrl.$parsers.unshift(function (inputValue) {
          hasFocus = true;
          if (inputValue && inputValue.length >= minSearch) {
            if (waitTime > 0) {
              cancelPreviousTimeout();
              scheduleSearchWithTimeout(inputValue);
            } else {
              getMatchesAsync(inputValue);
            }
          } else {
            isLoadingSetter(originalScope, false);
            cancelPreviousTimeout();
            resetMatches();
          }
          if (isEditable) {
            return inputValue;
          } else {
            if (!inputValue) {
              // Reset in case user had typed something previously.
              modelCtrl.$setValidity('editable', true);
              return inputValue;
            } else {
              modelCtrl.$setValidity('editable', false);
              return undefined;
            }
          }
        });
        modelCtrl.$formatters.push(function (modelValue) {
          var candidateViewValue, emptyViewValue;
          var locals = {};
          if (inputFormatter) {
            locals.$model = modelValue;
            return inputFormatter(originalScope, locals);
          } else {
            //it might happen that we don't have enough info to properly render input value
            //we need to check for this situation and simply return model value if we can't apply custom formatting
            locals[parserResult.itemName] = modelValue;
            candidateViewValue = parserResult.viewMapper(originalScope, locals);
            locals[parserResult.itemName] = undefined;
            emptyViewValue = parserResult.viewMapper(originalScope, locals);
            return candidateViewValue !== emptyViewValue ? candidateViewValue : modelValue;
          }
        });
        scope.select = function (activeIdx) {
          //called from within the $digest() cycle
          var locals = {};
          var model, item;
          locals[parserResult.itemName] = item = scope.matches[activeIdx].model;
          model = parserResult.modelMapper(originalScope, locals);
          $setModelValue(originalScope, model);
          modelCtrl.$setValidity('editable', true);
          onSelectCallback(originalScope, {
            $item: item,
            $model: model,
            $label: parserResult.viewMapper(originalScope, locals)
          });
          resetMatches();
          //return focus to the input element if a match was selected via a mouse click event
          // use timeout to avoid $rootScope:inprog error
          $timeout(function () {
            element[0].focus();
          }, 0, false);
        };
        //bind keyboard events: arrows up(38) / down(40), enter(13) and tab(9), esc(27)
        element.bind('keydown', function (evt) {
          //typeahead is open and an "interesting" key was pressed
          if (scope.matches.length === 0 || HOT_KEYS.indexOf(evt.which) === -1) {
            return;
          }
          // if there's nothing selected (i.e. focusFirst) and enter is hit, don't do anything
          if (scope.activeIdx == -1 && (evt.which === 13 || evt.which === 9)) {
            return;
          }
          evt.preventDefault();
          if (evt.which === 40) {
            scope.activeIdx = (scope.activeIdx + 1) % scope.matches.length;
            scope.$digest();
          } else if (evt.which === 38) {
            scope.activeIdx = (scope.activeIdx > 0 ? scope.activeIdx : scope.matches.length) - 1;
            scope.$digest();
          } else if (evt.which === 13 || evt.which === 9) {
            scope.$apply(function () {
              scope.select(scope.activeIdx);
            });
          } else if (evt.which === 27) {
            evt.stopPropagation();
            resetMatches();
            scope.$digest();
          }
        });
        element.bind('blur', function (evt) {
          hasFocus = false;
        });
        // Keep reference to click handler to unbind it.
        var dismissClickHandler = function (evt) {
          if (element[0] !== evt.target) {
            resetMatches();
            scope.$digest();
          }
        };
        $document.bind('click', dismissClickHandler);
        originalScope.$on('$destroy', function () {
          $document.unbind('click', dismissClickHandler);
          if (appendToBody) {
            $popup.remove();
          }
        });
        var $popup = $compile(popUpEl)(scope);
        if (appendToBody) {
          $document.find('body').append($popup);
        } else {
          element.after($popup);
        }
      }
    };
  }
]).directive('typeaheadPopup', function () {
  return {
    restrict: 'EA',
    scope: {
      matches: '=',
      query: '=',
      active: '=',
      position: '=',
      select: '&'
    },
    replace: true,
    templateUrl: 'template/typeahead/typeahead-popup.html',
    link: function (scope, element, attrs) {
      scope.templateUrl = attrs.templateUrl;
      scope.isOpen = function () {
        return scope.matches.length > 0;
      };
      scope.isActive = function (matchIdx) {
        return scope.active == matchIdx;
      };
      scope.selectActive = function (matchIdx) {
        scope.active = matchIdx;
      };
      scope.selectMatch = function (activeIdx) {
        scope.select({ activeIdx: activeIdx });
      };
    }
  };
}).directive('typeaheadMatch', [
  '$http',
  '$templateCache',
  '$compile',
  '$parse',
  function ($http, $templateCache, $compile, $parse) {
    return {
      restrict: 'EA',
      scope: {
        index: '=',
        match: '=',
        query: '='
      },
      link: function (scope, element, attrs) {
        var tplUrl = $parse(attrs.templateUrl)(scope.$parent) || 'template/typeahead/typeahead-match.html';
        $http.get(tplUrl, { cache: $templateCache }).success(function (tplContent) {
          element.replaceWith($compile(tplContent.trim())(scope));
        });
      }
    };
  }
]).filter('typeaheadHighlight', function () {
  function escapeRegexp(queryToEscape) {
    return queryToEscape.replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1');
  }
  return function (matchItem, query) {
    return query ? ('' + matchItem).replace(new RegExp(escapeRegexp(query), 'gi'), '<strong>$&</strong>') : matchItem;
  };
});
angular.module('template/accordion/accordion-group.html', []).run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('template/accordion/accordion-group.html', '<div class="panel panel-default">\n' + '  <div class="panel-heading">\n' + '    <h4 class="panel-title">\n' + '      <a href class="accordion-toggle" ng-click="toggleOpen()" accordion-transclude="heading"><span ng-class="{\'text-muted\': isDisabled}">{{heading}}</span></a>\n' + '    </h4>\n' + '  </div>\n' + '  <div class="panel-collapse" collapse="!isOpen">\n' + '\t  <div class="panel-body" ng-transclude></div>\n' + '  </div>\n' + '</div>\n' + '');
  }
]);
angular.module('template/accordion/accordion.html', []).run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('template/accordion/accordion.html', '<div class="panel-group" ng-transclude></div>');
  }
]);
angular.module('template/alert/alert.html', []).run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('template/alert/alert.html', '<div class="alert" ng-class="[\'alert-\' + (type || \'warning\'), closeable ? \'alert-dismissable\' : null]" role="alert">\n' + '    <button ng-show="closeable" type="button" class="close" ng-click="close()">\n' + '        <span aria-hidden="true">&times;</span>\n' + '        <span class="sr-only">Close</span>\n' + '    </button>\n' + '    <div ng-transclude></div>\n' + '</div>\n' + '');
  }
]);
angular.module('template/carousel/carousel.html', []).run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('template/carousel/carousel.html', '<div ng-mouseenter="pause()" ng-mouseleave="play()" class="carousel" ng-swipe-right="prev()" ng-swipe-left="next()">\n' + '    <ol class="carousel-indicators" ng-show="slides.length > 1">\n' + '        <li ng-repeat="slide in slides track by $index" ng-class="{active: isActive(slide)}" ng-click="select(slide)"></li>\n' + '    </ol>\n' + '    <div class="carousel-inner" ng-transclude></div>\n' + '    <a class="left carousel-control" ng-click="prev()" ng-show="slides.length > 1"><span class="glyphicon glyphicon-chevron-left"></span></a>\n' + '    <a class="right carousel-control" ng-click="next()" ng-show="slides.length > 1"><span class="glyphicon glyphicon-chevron-right"></span></a>\n' + '</div>\n' + '');
  }
]);
angular.module('template/carousel/slide.html', []).run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('template/carousel/slide.html', '<div ng-class="{\n' + '    \'active\': leaving || (active && !entering),\n' + '    \'prev\': (next || active) && direction==\'prev\',\n' + '    \'next\': (next || active) && direction==\'next\',\n' + '    \'right\': direction==\'prev\',\n' + '    \'left\': direction==\'next\'\n' + '  }" class="item text-center" ng-transclude></div>\n' + '');
  }
]);
angular.module('template/datepicker/datepicker.html', []).run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('template/datepicker/datepicker.html', '<div ng-switch="datepickerMode" role="application" ng-keydown="keydown($event)">\n' + '  <daypicker ng-switch-when="day" tabindex="0"></daypicker>\n' + '  <monthpicker ng-switch-when="month" tabindex="0"></monthpicker>\n' + '  <yearpicker ng-switch-when="year" tabindex="0"></yearpicker>\n' + '</div>');
  }
]);
angular.module('template/datepicker/day.html', []).run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('template/datepicker/day.html', '<table role="grid" aria-labelledby="{{uniqueId}}-title" aria-activedescendant="{{activeDateId}}">\n' + '  <thead>\n' + '    <tr>\n' + '      <th><button type="button" class="btn btn-default btn-sm pull-left" ng-click="move(-1)" tabindex="-1"><i class="glyphicon glyphicon-chevron-left"></i></button></th>\n' + '      <th colspan="{{5 + showWeeks}}"><button id="{{uniqueId}}-title" role="heading" aria-live="assertive" aria-atomic="true" type="button" class="btn btn-default btn-sm" ng-click="toggleMode()" tabindex="-1" style="width:100%;"><strong>{{title}}</strong></button></th>\n' + '      <th><button type="button" class="btn btn-default btn-sm pull-right" ng-click="move(1)" tabindex="-1"><i class="glyphicon glyphicon-chevron-right"></i></button></th>\n' + '    </tr>\n' + '    <tr>\n' + '      <th ng-show="showWeeks" class="text-center"></th>\n' + '      <th ng-repeat="label in labels track by $index" class="text-center"><small aria-label="{{label.full}}">{{label.abbr}}</small></th>\n' + '    </tr>\n' + '  </thead>\n' + '  <tbody>\n' + '    <tr ng-repeat="row in rows track by $index">\n' + '      <td ng-show="showWeeks" class="text-center h6"><em>{{ weekNumbers[$index] }}</em></td>\n' + '      <td ng-repeat="dt in row track by dt.date" class="text-center" role="gridcell" id="{{dt.uid}}" aria-disabled="{{!!dt.disabled}}">\n' + '        <button type="button" style="width:100%;" class="btn btn-default btn-sm" ng-class="{\'btn-info\': dt.selected, active: isActive(dt)}" ng-click="select(dt.date)" ng-disabled="dt.disabled" tabindex="-1"><span ng-class="{\'text-muted\': dt.secondary, \'text-info\': dt.current}">{{dt.label}}</span></button>\n' + '      </td>\n' + '    </tr>\n' + '  </tbody>\n' + '</table>\n' + '');
  }
]);
angular.module('template/datepicker/month.html', []).run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('template/datepicker/month.html', '<table role="grid" aria-labelledby="{{uniqueId}}-title" aria-activedescendant="{{activeDateId}}">\n' + '  <thead>\n' + '    <tr>\n' + '      <th><button type="button" class="btn btn-default btn-sm pull-left" ng-click="move(-1)" tabindex="-1"><i class="glyphicon glyphicon-chevron-left"></i></button></th>\n' + '      <th><button id="{{uniqueId}}-title" role="heading" aria-live="assertive" aria-atomic="true" type="button" class="btn btn-default btn-sm" ng-click="toggleMode()" tabindex="-1" style="width:100%;"><strong>{{title}}</strong></button></th>\n' + '      <th><button type="button" class="btn btn-default btn-sm pull-right" ng-click="move(1)" tabindex="-1"><i class="glyphicon glyphicon-chevron-right"></i></button></th>\n' + '    </tr>\n' + '  </thead>\n' + '  <tbody>\n' + '    <tr ng-repeat="row in rows track by $index">\n' + '      <td ng-repeat="dt in row track by dt.date" class="text-center" role="gridcell" id="{{dt.uid}}" aria-disabled="{{!!dt.disabled}}">\n' + '        <button type="button" style="width:100%;" class="btn btn-default" ng-class="{\'btn-info\': dt.selected, active: isActive(dt)}" ng-click="select(dt.date)" ng-disabled="dt.disabled" tabindex="-1"><span ng-class="{\'text-info\': dt.current}">{{dt.label}}</span></button>\n' + '      </td>\n' + '    </tr>\n' + '  </tbody>\n' + '</table>\n' + '');
  }
]);
angular.module('template/datepicker/popup.html', []).run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('template/datepicker/popup.html', '<ul class="dropdown-menu" ng-style="{display: (isOpen && \'block\') || \'none\', top: position.top+\'px\', left: position.left+\'px\'}" ng-keydown="keydown($event)">\n' + '\t<li ng-transclude></li>\n' + '\t<li ng-if="showButtonBar" style="padding:10px 9px 2px">\n' + '\t\t<span class="btn-group pull-left">\n' + '\t\t\t<button type="button" class="btn btn-sm btn-info" ng-click="select(\'today\')">{{ getText(\'current\') }}</button>\n' + '\t\t\t<button type="button" class="btn btn-sm btn-danger" ng-click="select(null)">{{ getText(\'clear\') }}</button>\n' + '\t\t</span>\n' + '\t\t<button type="button" class="btn btn-sm btn-success pull-right" ng-click="close()">{{ getText(\'close\') }}</button>\n' + '\t</li>\n' + '</ul>\n' + '');
  }
]);
angular.module('template/datepicker/year.html', []).run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('template/datepicker/year.html', '<table role="grid" aria-labelledby="{{uniqueId}}-title" aria-activedescendant="{{activeDateId}}">\n' + '  <thead>\n' + '    <tr>\n' + '      <th><button type="button" class="btn btn-default btn-sm pull-left" ng-click="move(-1)" tabindex="-1"><i class="glyphicon glyphicon-chevron-left"></i></button></th>\n' + '      <th colspan="3"><button id="{{uniqueId}}-title" role="heading" aria-live="assertive" aria-atomic="true" type="button" class="btn btn-default btn-sm" ng-click="toggleMode()" tabindex="-1" style="width:100%;"><strong>{{title}}</strong></button></th>\n' + '      <th><button type="button" class="btn btn-default btn-sm pull-right" ng-click="move(1)" tabindex="-1"><i class="glyphicon glyphicon-chevron-right"></i></button></th>\n' + '    </tr>\n' + '  </thead>\n' + '  <tbody>\n' + '    <tr ng-repeat="row in rows track by $index">\n' + '      <td ng-repeat="dt in row track by dt.date" class="text-center" role="gridcell" id="{{dt.uid}}" aria-disabled="{{!!dt.disabled}}">\n' + '        <button type="button" style="width:100%;" class="btn btn-default" ng-class="{\'btn-info\': dt.selected, active: isActive(dt)}" ng-click="select(dt.date)" ng-disabled="dt.disabled" tabindex="-1"><span ng-class="{\'text-info\': dt.current}">{{dt.label}}</span></button>\n' + '      </td>\n' + '    </tr>\n' + '  </tbody>\n' + '</table>\n' + '');
  }
]);
angular.module('template/modal/backdrop.html', []).run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('template/modal/backdrop.html', '<div class="modal-backdrop fade {{ backdropClass }}"\n' + '     ng-class="{in: animate}"\n' + '     ng-style="{\'z-index\': 1040 + (index && 1 || 0) + index*10}"\n' + '></div>\n' + '');
  }
]);
angular.module('template/modal/window.html', []).run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('template/modal/window.html', '<div tabindex="-1" role="dialog" class="modal fade" ng-class="{in: animate}" ng-style="{\'z-index\': 1050 + index*10, display: \'block\'}" ng-click="close($event)">\n' + '    <div class="modal-dialog" ng-class="{\'modal-sm\': size == \'sm\', \'modal-lg\': size == \'lg\'}"><div class="modal-content" modal-transclude></div></div>\n' + '</div>');
  }
]);
angular.module('template/pagination/pager.html', []).run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('template/pagination/pager.html', '<ul class="pager">\n' + '  <li ng-class="{disabled: noPrevious(), previous: align}"><a href ng-click="selectPage(page - 1)">{{getText(\'previous\')}}</a></li>\n' + '  <li ng-class="{disabled: noNext(), next: align}"><a href ng-click="selectPage(page + 1)">{{getText(\'next\')}}</a></li>\n' + '</ul>');
  }
]);
angular.module('template/pagination/pagination.html', []).run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('template/pagination/pagination.html', '<ul class="pagination">\n' + '  <li ng-if="boundaryLinks" ng-class="{disabled: noPrevious()}"><a href ng-click="selectPage(1)">{{getText(\'first\')}}</a></li>\n' + '  <li ng-if="directionLinks" ng-class="{disabled: noPrevious()}"><a href ng-click="selectPage(page - 1)">{{getText(\'previous\')}}</a></li>\n' + '  <li ng-repeat="page in pages track by $index" ng-class="{active: page.active}"><a href ng-click="selectPage(page.number)">{{page.text}}</a></li>\n' + '  <li ng-if="directionLinks" ng-class="{disabled: noNext()}"><a href ng-click="selectPage(page + 1)">{{getText(\'next\')}}</a></li>\n' + '  <li ng-if="boundaryLinks" ng-class="{disabled: noNext()}"><a href ng-click="selectPage(totalPages)">{{getText(\'last\')}}</a></li>\n' + '</ul>');
  }
]);
angular.module('template/tooltip/tooltip-html-unsafe-popup.html', []).run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('template/tooltip/tooltip-html-unsafe-popup.html', '<div class="tooltip {{placement}}" ng-class="{ in: isOpen(), fade: animation() }">\n' + '  <div class="tooltip-arrow"></div>\n' + '  <div class="tooltip-inner" bind-html-unsafe="content"></div>\n' + '</div>\n' + '');
  }
]);
angular.module('template/tooltip/tooltip-popup.html', []).run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('template/tooltip/tooltip-popup.html', '<div class="tooltip {{placement}}" ng-class="{ in: isOpen(), fade: animation() }">\n' + '  <div class="tooltip-arrow"></div>\n' + '  <div class="tooltip-inner" ng-bind="content"></div>\n' + '</div>\n' + '');
  }
]);
angular.module('template/popover/popover.html', []).run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('template/popover/popover.html', '<div class="popover {{placement}}" ng-class="{ in: isOpen(), fade: animation() }">\n' + '  <div class="arrow"></div>\n' + '\n' + '  <div class="popover-inner">\n' + '      <h3 class="popover-title" ng-bind="title" ng-show="title"></h3>\n' + '      <div class="popover-content" ng-bind="content"></div>\n' + '  </div>\n' + '</div>\n' + '');
  }
]);
angular.module('template/progressbar/bar.html', []).run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('template/progressbar/bar.html', '<div class="progress-bar" ng-class="type && \'progress-bar-\' + type" role="progressbar" aria-valuenow="{{value}}" aria-valuemin="0" aria-valuemax="{{max}}" ng-style="{width: percent + \'%\'}" aria-valuetext="{{percent | number:0}}%" ng-transclude></div>');
  }
]);
angular.module('template/progressbar/progress.html', []).run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('template/progressbar/progress.html', '<div class="progress" ng-transclude></div>');
  }
]);
angular.module('template/progressbar/progressbar.html', []).run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('template/progressbar/progressbar.html', '<div class="progress">\n' + '  <div class="progress-bar" ng-class="type && \'progress-bar-\' + type" role="progressbar" aria-valuenow="{{value}}" aria-valuemin="0" aria-valuemax="{{max}}" ng-style="{width: percent + \'%\'}" aria-valuetext="{{percent | number:0}}%" ng-transclude></div>\n' + '</div>');
  }
]);
angular.module('template/rating/rating.html', []).run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('template/rating/rating.html', '<span ng-mouseleave="reset()" ng-keydown="onKeydown($event)" tabindex="0" role="slider" aria-valuemin="0" aria-valuemax="{{range.length}}" aria-valuenow="{{value}}">\n' + '    <i ng-repeat="r in range track by $index" ng-mouseenter="enter($index + 1)" ng-click="rate($index + 1)" class="glyphicon" ng-class="$index < value && (r.stateOn || \'glyphicon-star\') || (r.stateOff || \'glyphicon-star-empty\')">\n' + '        <span class="sr-only">({{ $index < value ? \'*\' : \' \' }})</span>\n' + '    </i>\n' + '</span>');
  }
]);
angular.module('template/tabs/tab.html', []).run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('template/tabs/tab.html', '<li ng-class="{active: active, disabled: disabled}">\n' + '  <a href ng-click="select()" tab-heading-transclude>{{heading}}</a>\n' + '</li>\n' + '');
  }
]);
angular.module('template/tabs/tabset.html', []).run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('template/tabs/tabset.html', '<div>\n' + '  <ul class="nav nav-{{type || \'tabs\'}}" ng-class="{\'nav-stacked\': vertical, \'nav-justified\': justified}" ng-transclude></ul>\n' + '  <div class="tab-content">\n' + '    <div class="tab-pane" \n' + '         ng-repeat="tab in tabs" \n' + '         ng-class="{active: tab.active}"\n' + '         tab-content-transclude="tab">\n' + '    </div>\n' + '  </div>\n' + '</div>\n' + '');
  }
]);
angular.module('template/timepicker/timepicker.html', []).run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('template/timepicker/timepicker.html', '<table>\n' + '\t<tbody>\n' + '\t\t<tr class="text-center">\n' + '\t\t\t<td><a ng-click="incrementHours()" class="btn btn-link"><span class="glyphicon glyphicon-chevron-up"></span></a></td>\n' + '\t\t\t<td>&nbsp;</td>\n' + '\t\t\t<td><a ng-click="incrementMinutes()" class="btn btn-link"><span class="glyphicon glyphicon-chevron-up"></span></a></td>\n' + '\t\t\t<td ng-show="showMeridian"></td>\n' + '\t\t</tr>\n' + '\t\t<tr>\n' + '\t\t\t<td style="width:50px;" class="form-group" ng-class="{\'has-error\': invalidHours}">\n' + '\t\t\t\t<input type="text" ng-model="hours" ng-change="updateHours()" class="form-control text-center" ng-mousewheel="incrementHours()" ng-readonly="readonlyInput" maxlength="2">\n' + '\t\t\t</td>\n' + '\t\t\t<td>:</td>\n' + '\t\t\t<td style="width:50px;" class="form-group" ng-class="{\'has-error\': invalidMinutes}">\n' + '\t\t\t\t<input type="text" ng-model="minutes" ng-change="updateMinutes()" class="form-control text-center" ng-readonly="readonlyInput" maxlength="2">\n' + '\t\t\t</td>\n' + '\t\t\t<td ng-show="showMeridian"><button type="button" class="btn btn-default text-center" ng-click="toggleMeridian()">{{meridian}}</button></td>\n' + '\t\t</tr>\n' + '\t\t<tr class="text-center">\n' + '\t\t\t<td><a ng-click="decrementHours()" class="btn btn-link"><span class="glyphicon glyphicon-chevron-down"></span></a></td>\n' + '\t\t\t<td>&nbsp;</td>\n' + '\t\t\t<td><a ng-click="decrementMinutes()" class="btn btn-link"><span class="glyphicon glyphicon-chevron-down"></span></a></td>\n' + '\t\t\t<td ng-show="showMeridian"></td>\n' + '\t\t</tr>\n' + '\t</tbody>\n' + '</table>\n' + '');
  }
]);
angular.module('template/typeahead/typeahead-match.html', []).run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('template/typeahead/typeahead-match.html', '<a tabindex="-1" bind-html-unsafe="match.label | typeaheadHighlight:query"></a>');
  }
]);
angular.module('template/typeahead/typeahead-popup.html', []).run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('template/typeahead/typeahead-popup.html', '<ul class="dropdown-menu" ng-show="isOpen()" ng-style="{top: position.top+\'px\', left: position.left+\'px\'}" style="display: block;" role="listbox" aria-hidden="{{!isOpen()}}">\n' + '    <li ng-repeat="match in matches track by $index" ng-class="{active: isActive($index) }" ng-mouseenter="selectActive($index)" ng-click="selectMatch($index)" role="option" id="{{match.id}}">\n' + '        <div typeahead-match index="$index" match="match" query="query" template-url="templateUrl"></div>\n' + '    </li>\n' + '</ul>\n' + '');
  }
]);/*! 
 * angular-loading-bar v0.6.0
 * https://chieffancypants.github.io/angular-loading-bar
 * Copyright (c) 2014 Wes Cruver
 * License: MIT
 */
/*
 * angular-loading-bar
 *
 * intercepts XHR requests and creates a loading bar.
 * Based on the excellent nprogress work by rstacruz (more info in readme)
 *
 * (c) 2013 Wes Cruver
 * License: MIT
 */
(function () {
  'use strict';
  // Alias the loading bar for various backwards compatibilities since the project has matured:
  angular.module('angular-loading-bar', ['cfp.loadingBarInterceptor']);
  angular.module('chieffancypants.loadingBar', ['cfp.loadingBarInterceptor']);
  /**
 * loadingBarInterceptor service
 *
 * Registers itself as an Angular interceptor and listens for XHR requests.
 */
  angular.module('cfp.loadingBarInterceptor', ['cfp.loadingBar']).config([
    '$httpProvider',
    function ($httpProvider) {
      var interceptor = [
          '$q',
          '$cacheFactory',
          '$timeout',
          '$rootScope',
          'cfpLoadingBar',
          function ($q, $cacheFactory, $timeout, $rootScope, cfpLoadingBar) {
            /**
       * The total number of requests made
       */
            var reqsTotal = 0;
            /**
       * The number of requests completed (either successfully or not)
       */
            var reqsCompleted = 0;
            /**
       * The amount of time spent fetching before showing the loading bar
       */
            var latencyThreshold = cfpLoadingBar.latencyThreshold;
            /**
       * $timeout handle for latencyThreshold
       */
            var startTimeout;
            /**
       * calls cfpLoadingBar.complete() which removes the
       * loading bar from the DOM.
       */
            function setComplete() {
              $timeout.cancel(startTimeout);
              cfpLoadingBar.complete();
              reqsCompleted = 0;
              reqsTotal = 0;
            }
            /**
       * Determine if the response has already been cached
       * @param  {Object}  config the config option from the request
       * @return {Boolean} retrns true if cached, otherwise false
       */
            function isCached(config) {
              var cache;
              var defaultCache = $cacheFactory.get('$http');
              var defaults = $httpProvider.defaults;
              // Choose the proper cache source. Borrowed from angular: $http service
              if ((config.cache || defaults.cache) && config.cache !== false && (config.method === 'GET' || config.method === 'JSONP')) {
                cache = angular.isObject(config.cache) ? config.cache : angular.isObject(defaults.cache) ? defaults.cache : defaultCache;
              }
              var cached = cache !== undefined ? cache.get(config.url) !== undefined : false;
              if (config.cached !== undefined && cached !== config.cached) {
                return config.cached;
              }
              config.cached = cached;
              return cached;
            }
            return {
              'request': function (config) {
                // Check to make sure this request hasn't already been cached and that
                // the requester didn't explicitly ask us to ignore this request:
                if (!config.ignoreLoadingBar && !isCached(config)) {
                  $rootScope.$broadcast('cfpLoadingBar:loading', { url: config.url });
                  if (reqsTotal === 0) {
                    startTimeout = $timeout(function () {
                      cfpLoadingBar.start();
                    }, latencyThreshold);
                  }
                  reqsTotal++;
                  cfpLoadingBar.set(reqsCompleted / reqsTotal);
                }
                return config;
              },
              'response': function (response) {
                if (!response.config.ignoreLoadingBar && !isCached(response.config)) {
                  reqsCompleted++;
                  $rootScope.$broadcast('cfpLoadingBar:loaded', { url: response.config.url });
                  if (reqsCompleted >= reqsTotal) {
                    setComplete();
                  } else {
                    cfpLoadingBar.set(reqsCompleted / reqsTotal);
                  }
                }
                return response;
              },
              'responseError': function (rejection) {
                if (!rejection.config.ignoreLoadingBar && !isCached(rejection.config)) {
                  reqsCompleted++;
                  $rootScope.$broadcast('cfpLoadingBar:loaded', { url: rejection.config.url });
                  if (reqsCompleted >= reqsTotal) {
                    setComplete();
                  } else {
                    cfpLoadingBar.set(reqsCompleted / reqsTotal);
                  }
                }
                return $q.reject(rejection);
              }
            };
          }
        ];
      $httpProvider.interceptors.push(interceptor);
    }
  ]);
  /**
 * Loading Bar
 *
 * This service handles adding and removing the actual element in the DOM.
 * Generally, best practices for DOM manipulation is to take place in a
 * directive, but because the element itself is injected in the DOM only upon
 * XHR requests, and it's likely needed on every view, the best option is to
 * use a service.
 */
  angular.module('cfp.loadingBar', []).provider('cfpLoadingBar', function () {
    this.includeSpinner = true;
    this.includeBar = true;
    this.latencyThreshold = 100;
    this.startSize = 0.02;
    this.parentSelector = 'body';
    this.spinnerTemplate = '<div id="loading-bar-spinner"><div class="spinner-icon"></div></div>';
    this.loadingBarTemplate = '<div id="loading-bar"><div class="bar"><div class="peg"></div></div></div>';
    this.$get = [
      '$injector',
      '$document',
      '$timeout',
      '$rootScope',
      function ($injector, $document, $timeout, $rootScope) {
        var $animate;
        var $parentSelector = this.parentSelector, loadingBarContainer = angular.element(this.loadingBarTemplate), loadingBar = loadingBarContainer.find('div').eq(0), spinner = angular.element(this.spinnerTemplate);
        var incTimeout, completeTimeout, started = false, status = 0;
        var includeSpinner = this.includeSpinner;
        var includeBar = this.includeBar;
        var startSize = this.startSize;
        /**
       * Inserts the loading bar element into the dom, and sets it to 2%
       */
        function _start() {
          if (!$animate) {
            $animate = $injector.get('$animate');
          }
          var $parent = $document.find($parentSelector).eq(0);
          $timeout.cancel(completeTimeout);
          // do not continually broadcast the started event:
          if (started) {
            return;
          }
          $rootScope.$broadcast('cfpLoadingBar:started');
          started = true;
          if (includeBar) {
            $animate.enter(loadingBarContainer, $parent);
          }
          if (includeSpinner) {
            $animate.enter(spinner, $parent);
          }
          _set(startSize);
        }
        /**
       * Set the loading bar's width to a certain percent.
       *
       * @param n any value between 0 and 1
       */
        function _set(n) {
          if (!started) {
            return;
          }
          var pct = n * 100 + '%';
          loadingBar.css('width', pct);
          status = n;
          // increment loadingbar to give the illusion that there is always
          // progress but make sure to cancel the previous timeouts so we don't
          // have multiple incs running at the same time.
          $timeout.cancel(incTimeout);
          incTimeout = $timeout(function () {
            _inc();
          }, 250);
        }
        /**
       * Increments the loading bar by a random amount
       * but slows down as it progresses
       */
        function _inc() {
          if (_status() >= 1) {
            return;
          }
          var rnd = 0;
          // TODO: do this mathmatically instead of through conditions
          var stat = _status();
          if (stat >= 0 && stat < 0.25) {
            // Start out between 3 - 6% increments
            rnd = (Math.random() * (5 - 3 + 1) + 3) / 100;
          } else if (stat >= 0.25 && stat < 0.65) {
            // increment between 0 - 3%
            rnd = Math.random() * 3 / 100;
          } else if (stat >= 0.65 && stat < 0.9) {
            // increment between 0 - 2%
            rnd = Math.random() * 2 / 100;
          } else if (stat >= 0.9 && stat < 0.99) {
            // finally, increment it .5 %
            rnd = 0.005;
          } else {
            // after 99%, don't increment:
            rnd = 0;
          }
          var pct = _status() + rnd;
          _set(pct);
        }
        function _status() {
          return status;
        }
        function _completeAnimation() {
          status = 0;
          started = false;
        }
        function _complete() {
          if (!$animate) {
            $animate = $injector.get('$animate');
          }
          $rootScope.$broadcast('cfpLoadingBar:completed');
          _set(1);
          $timeout.cancel(completeTimeout);
          // Attempt to aggregate any start/complete calls within 500ms:
          completeTimeout = $timeout(function () {
            var promise = $animate.leave(loadingBarContainer, _completeAnimation);
            if (promise && promise.then) {
              promise.then(_completeAnimation);
            }
            $animate.leave(spinner);
          }, 500);
        }
        return {
          start: _start,
          set: _set,
          status: _status,
          inc: _inc,
          complete: _complete,
          includeSpinner: this.includeSpinner,
          latencyThreshold: this.latencyThreshold,
          parentSelector: this.parentSelector,
          startSize: this.startSize
        };
      }
    ];  //
  });  // wtf javascript. srsly
}());  //
/*!
 * Bootstrap v3.3.2 (http://getbootstrap.com)
 * Copyright 2011-2015 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 */
if (typeof jQuery === 'undefined') {
  throw new Error('Bootstrap\'s JavaScript requires jQuery');
}
+function ($) {
  'use strict';
  var version = $.fn.jquery.split(' ')[0].split('.');
  if (version[0] < 2 && version[1] < 9 || version[0] == 1 && version[1] == 9 && version[2] < 1) {
    throw new Error('Bootstrap\'s JavaScript requires jQuery version 1.9.1 or higher');
  }
}(jQuery);
/* ========================================================================
 * Bootstrap: transition.js v3.3.2
 * http://getbootstrap.com/javascript/#transitions
 * ========================================================================
 * Copyright 2011-2015 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */
+function ($) {
  'use strict';
  // CSS TRANSITION SUPPORT (Shoutout: http://www.modernizr.com/)
  // ============================================================
  function transitionEnd() {
    var el = document.createElement('bootstrap');
    var transEndEventNames = {
        WebkitTransition: 'webkitTransitionEnd',
        MozTransition: 'transitionend',
        OTransition: 'oTransitionEnd otransitionend',
        transition: 'transitionend'
      };
    for (var name in transEndEventNames) {
      if (el.style[name] !== undefined) {
        return { end: transEndEventNames[name] };
      }
    }
    return false;
  }
  // http://blog.alexmaccaw.com/css-transitions
  $.fn.emulateTransitionEnd = function (duration) {
    var called = false;
    var $el = this;
    $(this).one('bsTransitionEnd', function () {
      called = true;
    });
    var callback = function () {
      if (!called)
        $($el).trigger($.support.transition.end);
    };
    setTimeout(callback, duration);
    return this;
  };
  $(function () {
    $.support.transition = transitionEnd();
    if (!$.support.transition)
      return;
    $.event.special.bsTransitionEnd = {
      bindType: $.support.transition.end,
      delegateType: $.support.transition.end,
      handle: function (e) {
        if ($(e.target).is(this))
          return e.handleObj.handler.apply(this, arguments);
      }
    };
  });
}(jQuery);
/* ========================================================================
 * Bootstrap: alert.js v3.3.2
 * http://getbootstrap.com/javascript/#alerts
 * ========================================================================
 * Copyright 2011-2015 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */
+function ($) {
  'use strict';
  // ALERT CLASS DEFINITION
  // ======================
  var dismiss = '[data-dismiss="alert"]';
  var Alert = function (el) {
    $(el).on('click', dismiss, this.close);
  };
  Alert.VERSION = '3.3.2';
  Alert.TRANSITION_DURATION = 150;
  Alert.prototype.close = function (e) {
    var $this = $(this);
    var selector = $this.attr('data-target');
    if (!selector) {
      selector = $this.attr('href');
      selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '');
    }
    var $parent = $(selector);
    if (e)
      e.preventDefault();
    if (!$parent.length) {
      $parent = $this.closest('.alert');
    }
    $parent.trigger(e = $.Event('close.bs.alert'));
    if (e.isDefaultPrevented())
      return;
    $parent.removeClass('in');
    function removeElement() {
      // detach from parent, fire event then clean up data
      $parent.detach().trigger('closed.bs.alert').remove();
    }
    $.support.transition && $parent.hasClass('fade') ? $parent.one('bsTransitionEnd', removeElement).emulateTransitionEnd(Alert.TRANSITION_DURATION) : removeElement();
  };
  // ALERT PLUGIN DEFINITION
  // =======================
  function Plugin(option) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data('bs.alert');
      if (!data)
        $this.data('bs.alert', data = new Alert(this));
      if (typeof option == 'string')
        data[option].call($this);
    });
  }
  var old = $.fn.alert;
  $.fn.alert = Plugin;
  $.fn.alert.Constructor = Alert;
  // ALERT NO CONFLICT
  // =================
  $.fn.alert.noConflict = function () {
    $.fn.alert = old;
    return this;
  };
  // ALERT DATA-API
  // ==============
  $(document).on('click.bs.alert.data-api', dismiss, Alert.prototype.close);
}(jQuery);
/* ========================================================================
 * Bootstrap: button.js v3.3.2
 * http://getbootstrap.com/javascript/#buttons
 * ========================================================================
 * Copyright 2011-2015 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */
+function ($) {
  'use strict';
  // BUTTON PUBLIC CLASS DEFINITION
  // ==============================
  var Button = function (element, options) {
    this.$element = $(element);
    this.options = $.extend({}, Button.DEFAULTS, options);
    this.isLoading = false;
  };
  Button.VERSION = '3.3.2';
  Button.DEFAULTS = { loadingText: 'loading...' };
  Button.prototype.setState = function (state) {
    var d = 'disabled';
    var $el = this.$element;
    var val = $el.is('input') ? 'val' : 'html';
    var data = $el.data();
    state = state + 'Text';
    if (data.resetText == null)
      $el.data('resetText', $el[val]());
    // push to event loop to allow forms to submit
    setTimeout($.proxy(function () {
      $el[val](data[state] == null ? this.options[state] : data[state]);
      if (state == 'loadingText') {
        this.isLoading = true;
        $el.addClass(d).attr(d, d);
      } else if (this.isLoading) {
        this.isLoading = false;
        $el.removeClass(d).removeAttr(d);
      }
    }, this), 0);
  };
  Button.prototype.toggle = function () {
    var changed = true;
    var $parent = this.$element.closest('[data-toggle="buttons"]');
    if ($parent.length) {
      var $input = this.$element.find('input');
      if ($input.prop('type') == 'radio') {
        if ($input.prop('checked') && this.$element.hasClass('active'))
          changed = false;
        else
          $parent.find('.active').removeClass('active');
      }
      if (changed)
        $input.prop('checked', !this.$element.hasClass('active')).trigger('change');
    } else {
      this.$element.attr('aria-pressed', !this.$element.hasClass('active'));
    }
    if (changed)
      this.$element.toggleClass('active');
  };
  // BUTTON PLUGIN DEFINITION
  // ========================
  function Plugin(option) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data('bs.button');
      var options = typeof option == 'object' && option;
      if (!data)
        $this.data('bs.button', data = new Button(this, options));
      if (option == 'toggle')
        data.toggle();
      else if (option)
        data.setState(option);
    });
  }
  var old = $.fn.button;
  $.fn.button = Plugin;
  $.fn.button.Constructor = Button;
  // BUTTON NO CONFLICT
  // ==================
  $.fn.button.noConflict = function () {
    $.fn.button = old;
    return this;
  };
  // BUTTON DATA-API
  // ===============
  $(document).on('click.bs.button.data-api', '[data-toggle^="button"]', function (e) {
    var $btn = $(e.target);
    if (!$btn.hasClass('btn'))
      $btn = $btn.closest('.btn');
    Plugin.call($btn, 'toggle');
    e.preventDefault();
  }).on('focus.bs.button.data-api blur.bs.button.data-api', '[data-toggle^="button"]', function (e) {
    $(e.target).closest('.btn').toggleClass('focus', /^focus(in)?$/.test(e.type));
  });
}(jQuery);
/* ========================================================================
 * Bootstrap: carousel.js v3.3.2
 * http://getbootstrap.com/javascript/#carousel
 * ========================================================================
 * Copyright 2011-2015 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */
+function ($) {
  'use strict';
  // CAROUSEL CLASS DEFINITION
  // =========================
  var Carousel = function (element, options) {
    this.$element = $(element);
    this.$indicators = this.$element.find('.carousel-indicators');
    this.options = options;
    this.paused = this.sliding = this.interval = this.$active = this.$items = null;
    this.options.keyboard && this.$element.on('keydown.bs.carousel', $.proxy(this.keydown, this));
    this.options.pause == 'hover' && !('ontouchstart' in document.documentElement) && this.$element.on('mouseenter.bs.carousel', $.proxy(this.pause, this)).on('mouseleave.bs.carousel', $.proxy(this.cycle, this));
  };
  Carousel.VERSION = '3.3.2';
  Carousel.TRANSITION_DURATION = 600;
  Carousel.DEFAULTS = {
    interval: 5000,
    pause: 'hover',
    wrap: true,
    keyboard: true
  };
  Carousel.prototype.keydown = function (e) {
    if (/input|textarea/i.test(e.target.tagName))
      return;
    switch (e.which) {
    case 37:
      this.prev();
      break;
    case 39:
      this.next();
      break;
    default:
      return;
    }
    e.preventDefault();
  };
  Carousel.prototype.cycle = function (e) {
    e || (this.paused = false);
    this.interval && clearInterval(this.interval);
    this.options.interval && !this.paused && (this.interval = setInterval($.proxy(this.next, this), this.options.interval));
    return this;
  };
  Carousel.prototype.getItemIndex = function (item) {
    this.$items = item.parent().children('.item');
    return this.$items.index(item || this.$active);
  };
  Carousel.prototype.getItemForDirection = function (direction, active) {
    var activeIndex = this.getItemIndex(active);
    var willWrap = direction == 'prev' && activeIndex === 0 || direction == 'next' && activeIndex == this.$items.length - 1;
    if (willWrap && !this.options.wrap)
      return active;
    var delta = direction == 'prev' ? -1 : 1;
    var itemIndex = (activeIndex + delta) % this.$items.length;
    return this.$items.eq(itemIndex);
  };
  Carousel.prototype.to = function (pos) {
    var that = this;
    var activeIndex = this.getItemIndex(this.$active = this.$element.find('.item.active'));
    if (pos > this.$items.length - 1 || pos < 0)
      return;
    if (this.sliding)
      return this.$element.one('slid.bs.carousel', function () {
        that.to(pos);
      });
    // yes, "slid"
    if (activeIndex == pos)
      return this.pause().cycle();
    return this.slide(pos > activeIndex ? 'next' : 'prev', this.$items.eq(pos));
  };
  Carousel.prototype.pause = function (e) {
    e || (this.paused = true);
    if (this.$element.find('.next, .prev').length && $.support.transition) {
      this.$element.trigger($.support.transition.end);
      this.cycle(true);
    }
    this.interval = clearInterval(this.interval);
    return this;
  };
  Carousel.prototype.next = function () {
    if (this.sliding)
      return;
    return this.slide('next');
  };
  Carousel.prototype.prev = function () {
    if (this.sliding)
      return;
    return this.slide('prev');
  };
  Carousel.prototype.slide = function (type, next) {
    var $active = this.$element.find('.item.active');
    var $next = next || this.getItemForDirection(type, $active);
    var isCycling = this.interval;
    var direction = type == 'next' ? 'left' : 'right';
    var that = this;
    if ($next.hasClass('active'))
      return this.sliding = false;
    var relatedTarget = $next[0];
    var slideEvent = $.Event('slide.bs.carousel', {
        relatedTarget: relatedTarget,
        direction: direction
      });
    this.$element.trigger(slideEvent);
    if (slideEvent.isDefaultPrevented())
      return;
    this.sliding = true;
    isCycling && this.pause();
    if (this.$indicators.length) {
      this.$indicators.find('.active').removeClass('active');
      var $nextIndicator = $(this.$indicators.children()[this.getItemIndex($next)]);
      $nextIndicator && $nextIndicator.addClass('active');
    }
    var slidEvent = $.Event('slid.bs.carousel', {
        relatedTarget: relatedTarget,
        direction: direction
      });
    // yes, "slid"
    if ($.support.transition && this.$element.hasClass('slide')) {
      $next.addClass(type);
      $next[0].offsetWidth;
      // force reflow
      $active.addClass(direction);
      $next.addClass(direction);
      $active.one('bsTransitionEnd', function () {
        $next.removeClass([
          type,
          direction
        ].join(' ')).addClass('active');
        $active.removeClass([
          'active',
          direction
        ].join(' '));
        that.sliding = false;
        setTimeout(function () {
          that.$element.trigger(slidEvent);
        }, 0);
      }).emulateTransitionEnd(Carousel.TRANSITION_DURATION);
    } else {
      $active.removeClass('active');
      $next.addClass('active');
      this.sliding = false;
      this.$element.trigger(slidEvent);
    }
    isCycling && this.cycle();
    return this;
  };
  // CAROUSEL PLUGIN DEFINITION
  // ==========================
  function Plugin(option) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data('bs.carousel');
      var options = $.extend({}, Carousel.DEFAULTS, $this.data(), typeof option == 'object' && option);
      var action = typeof option == 'string' ? option : options.slide;
      if (!data)
        $this.data('bs.carousel', data = new Carousel(this, options));
      if (typeof option == 'number')
        data.to(option);
      else if (action)
        data[action]();
      else if (options.interval)
        data.pause().cycle();
    });
  }
  var old = $.fn.carousel;
  $.fn.carousel = Plugin;
  $.fn.carousel.Constructor = Carousel;
  // CAROUSEL NO CONFLICT
  // ====================
  $.fn.carousel.noConflict = function () {
    $.fn.carousel = old;
    return this;
  };
  // CAROUSEL DATA-API
  // =================
  var clickHandler = function (e) {
    var href;
    var $this = $(this);
    var $target = $($this.attr('data-target') || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, ''));
    // strip for ie7
    if (!$target.hasClass('carousel'))
      return;
    var options = $.extend({}, $target.data(), $this.data());
    var slideIndex = $this.attr('data-slide-to');
    if (slideIndex)
      options.interval = false;
    Plugin.call($target, options);
    if (slideIndex) {
      $target.data('bs.carousel').to(slideIndex);
    }
    e.preventDefault();
  };
  $(document).on('click.bs.carousel.data-api', '[data-slide]', clickHandler).on('click.bs.carousel.data-api', '[data-slide-to]', clickHandler);
  $(window).on('load', function () {
    $('[data-ride="carousel"]').each(function () {
      var $carousel = $(this);
      Plugin.call($carousel, $carousel.data());
    });
  });
}(jQuery);
/* ========================================================================
 * Bootstrap: collapse.js v3.3.2
 * http://getbootstrap.com/javascript/#collapse
 * ========================================================================
 * Copyright 2011-2015 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */
+function ($) {
  'use strict';
  // COLLAPSE PUBLIC CLASS DEFINITION
  // ================================
  var Collapse = function (element, options) {
    this.$element = $(element);
    this.options = $.extend({}, Collapse.DEFAULTS, options);
    this.$trigger = $(this.options.trigger).filter('[href="#' + element.id + '"], [data-target="#' + element.id + '"]');
    this.transitioning = null;
    if (this.options.parent) {
      this.$parent = this.getParent();
    } else {
      this.addAriaAndCollapsedClass(this.$element, this.$trigger);
    }
    if (this.options.toggle)
      this.toggle();
  };
  Collapse.VERSION = '3.3.2';
  Collapse.TRANSITION_DURATION = 350;
  Collapse.DEFAULTS = {
    toggle: true,
    trigger: '[data-toggle="collapse"]'
  };
  Collapse.prototype.dimension = function () {
    var hasWidth = this.$element.hasClass('width');
    return hasWidth ? 'width' : 'height';
  };
  Collapse.prototype.show = function () {
    if (this.transitioning || this.$element.hasClass('in'))
      return;
    var activesData;
    var actives = this.$parent && this.$parent.children('.panel').children('.in, .collapsing');
    if (actives && actives.length) {
      activesData = actives.data('bs.collapse');
      if (activesData && activesData.transitioning)
        return;
    }
    var startEvent = $.Event('show.bs.collapse');
    this.$element.trigger(startEvent);
    if (startEvent.isDefaultPrevented())
      return;
    if (actives && actives.length) {
      Plugin.call(actives, 'hide');
      activesData || actives.data('bs.collapse', null);
    }
    var dimension = this.dimension();
    this.$element.removeClass('collapse').addClass('collapsing')[dimension](0).attr('aria-expanded', true);
    this.$trigger.removeClass('collapsed').attr('aria-expanded', true);
    this.transitioning = 1;
    var complete = function () {
      this.$element.removeClass('collapsing').addClass('collapse in')[dimension]('');
      this.transitioning = 0;
      this.$element.trigger('shown.bs.collapse');
    };
    if (!$.support.transition)
      return complete.call(this);
    var scrollSize = $.camelCase([
        'scroll',
        dimension
      ].join('-'));
    this.$element.one('bsTransitionEnd', $.proxy(complete, this)).emulateTransitionEnd(Collapse.TRANSITION_DURATION)[dimension](this.$element[0][scrollSize]);
  };
  Collapse.prototype.hide = function () {
    if (this.transitioning || !this.$element.hasClass('in'))
      return;
    var startEvent = $.Event('hide.bs.collapse');
    this.$element.trigger(startEvent);
    if (startEvent.isDefaultPrevented())
      return;
    var dimension = this.dimension();
    this.$element[dimension](this.$element[dimension]())[0].offsetHeight;
    this.$element.addClass('collapsing').removeClass('collapse in').attr('aria-expanded', false);
    this.$trigger.addClass('collapsed').attr('aria-expanded', false);
    this.transitioning = 1;
    var complete = function () {
      this.transitioning = 0;
      this.$element.removeClass('collapsing').addClass('collapse').trigger('hidden.bs.collapse');
    };
    if (!$.support.transition)
      return complete.call(this);
    this.$element[dimension](0).one('bsTransitionEnd', $.proxy(complete, this)).emulateTransitionEnd(Collapse.TRANSITION_DURATION);
  };
  Collapse.prototype.toggle = function () {
    this[this.$element.hasClass('in') ? 'hide' : 'show']();
  };
  Collapse.prototype.getParent = function () {
    return $(this.options.parent).find('[data-toggle="collapse"][data-parent="' + this.options.parent + '"]').each($.proxy(function (i, element) {
      var $element = $(element);
      this.addAriaAndCollapsedClass(getTargetFromTrigger($element), $element);
    }, this)).end();
  };
  Collapse.prototype.addAriaAndCollapsedClass = function ($element, $trigger) {
    var isOpen = $element.hasClass('in');
    $element.attr('aria-expanded', isOpen);
    $trigger.toggleClass('collapsed', !isOpen).attr('aria-expanded', isOpen);
  };
  function getTargetFromTrigger($trigger) {
    var href;
    var target = $trigger.attr('data-target') || (href = $trigger.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '');
    // strip for ie7
    return $(target);
  }
  // COLLAPSE PLUGIN DEFINITION
  // ==========================
  function Plugin(option) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data('bs.collapse');
      var options = $.extend({}, Collapse.DEFAULTS, $this.data(), typeof option == 'object' && option);
      if (!data && options.toggle && option == 'show')
        options.toggle = false;
      if (!data)
        $this.data('bs.collapse', data = new Collapse(this, options));
      if (typeof option == 'string')
        data[option]();
    });
  }
  var old = $.fn.collapse;
  $.fn.collapse = Plugin;
  $.fn.collapse.Constructor = Collapse;
  // COLLAPSE NO CONFLICT
  // ====================
  $.fn.collapse.noConflict = function () {
    $.fn.collapse = old;
    return this;
  };
  // COLLAPSE DATA-API
  // =================
  $(document).on('click.bs.collapse.data-api', '[data-toggle="collapse"]', function (e) {
    var $this = $(this);
    if (!$this.attr('data-target'))
      e.preventDefault();
    var $target = getTargetFromTrigger($this);
    var data = $target.data('bs.collapse');
    var option = data ? 'toggle' : $.extend({}, $this.data(), { trigger: this });
    Plugin.call($target, option);
  });
}(jQuery);
/* ========================================================================
 * Bootstrap: dropdown.js v3.3.2
 * http://getbootstrap.com/javascript/#dropdowns
 * ========================================================================
 * Copyright 2011-2015 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */
+function ($) {
  'use strict';
  // DROPDOWN CLASS DEFINITION
  // =========================
  var backdrop = '.dropdown-backdrop';
  var toggle = '[data-toggle="dropdown"]';
  var Dropdown = function (element) {
    $(element).on('click.bs.dropdown', this.toggle);
  };
  Dropdown.VERSION = '3.3.2';
  Dropdown.prototype.toggle = function (e) {
    var $this = $(this);
    if ($this.is('.disabled, :disabled'))
      return;
    var $parent = getParent($this);
    var isActive = $parent.hasClass('open');
    clearMenus();
    if (!isActive) {
      if ('ontouchstart' in document.documentElement && !$parent.closest('.navbar-nav').length) {
        // if mobile we use a backdrop because click events don't delegate
        $('<div class="dropdown-backdrop"/>').insertAfter($(this)).on('click', clearMenus);
      }
      var relatedTarget = { relatedTarget: this };
      $parent.trigger(e = $.Event('show.bs.dropdown', relatedTarget));
      if (e.isDefaultPrevented())
        return;
      $this.trigger('focus').attr('aria-expanded', 'true');
      $parent.toggleClass('open').trigger('shown.bs.dropdown', relatedTarget);
    }
    return false;
  };
  Dropdown.prototype.keydown = function (e) {
    if (!/(38|40|27|32)/.test(e.which) || /input|textarea/i.test(e.target.tagName))
      return;
    var $this = $(this);
    e.preventDefault();
    e.stopPropagation();
    if ($this.is('.disabled, :disabled'))
      return;
    var $parent = getParent($this);
    var isActive = $parent.hasClass('open');
    if (!isActive && e.which != 27 || isActive && e.which == 27) {
      if (e.which == 27)
        $parent.find(toggle).trigger('focus');
      return $this.trigger('click');
    }
    var desc = ' li:not(.divider):visible a';
    var $items = $parent.find('[role="menu"]' + desc + ', [role="listbox"]' + desc);
    if (!$items.length)
      return;
    var index = $items.index(e.target);
    if (e.which == 38 && index > 0)
      index--;
    // up
    if (e.which == 40 && index < $items.length - 1)
      index++;
    // down
    if (!~index)
      index = 0;
    $items.eq(index).trigger('focus');
  };
  function clearMenus(e) {
    if (e && e.which === 3)
      return;
    $(backdrop).remove();
    $(toggle).each(function () {
      var $this = $(this);
      var $parent = getParent($this);
      var relatedTarget = { relatedTarget: this };
      if (!$parent.hasClass('open'))
        return;
      $parent.trigger(e = $.Event('hide.bs.dropdown', relatedTarget));
      if (e.isDefaultPrevented())
        return;
      $this.attr('aria-expanded', 'false');
      $parent.removeClass('open').trigger('hidden.bs.dropdown', relatedTarget);
    });
  }
  function getParent($this) {
    var selector = $this.attr('data-target');
    if (!selector) {
      selector = $this.attr('href');
      selector = selector && /#[A-Za-z]/.test(selector) && selector.replace(/.*(?=#[^\s]*$)/, '');
    }
    var $parent = selector && $(selector);
    return $parent && $parent.length ? $parent : $this.parent();
  }
  // DROPDOWN PLUGIN DEFINITION
  // ==========================
  function Plugin(option) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data('bs.dropdown');
      if (!data)
        $this.data('bs.dropdown', data = new Dropdown(this));
      if (typeof option == 'string')
        data[option].call($this);
    });
  }
  var old = $.fn.dropdown;
  $.fn.dropdown = Plugin;
  $.fn.dropdown.Constructor = Dropdown;
  // DROPDOWN NO CONFLICT
  // ====================
  $.fn.dropdown.noConflict = function () {
    $.fn.dropdown = old;
    return this;
  };
  // APPLY TO STANDARD DROPDOWN ELEMENTS
  // ===================================
  $(document).on('click.bs.dropdown.data-api', clearMenus).on('click.bs.dropdown.data-api', '.dropdown form', function (e) {
    e.stopPropagation();
  }).on('click.bs.dropdown.data-api', toggle, Dropdown.prototype.toggle).on('keydown.bs.dropdown.data-api', toggle, Dropdown.prototype.keydown).on('keydown.bs.dropdown.data-api', '[role="menu"]', Dropdown.prototype.keydown).on('keydown.bs.dropdown.data-api', '[role="listbox"]', Dropdown.prototype.keydown);
}(jQuery);
/* ========================================================================
 * Bootstrap: modal.js v3.3.2
 * http://getbootstrap.com/javascript/#modals
 * ========================================================================
 * Copyright 2011-2015 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */
+function ($) {
  'use strict';
  // MODAL CLASS DEFINITION
  // ======================
  var Modal = function (element, options) {
    this.options = options;
    this.$body = $(document.body);
    this.$element = $(element);
    this.$backdrop = this.isShown = null;
    this.scrollbarWidth = 0;
    if (this.options.remote) {
      this.$element.find('.modal-content').load(this.options.remote, $.proxy(function () {
        this.$element.trigger('loaded.bs.modal');
      }, this));
    }
  };
  Modal.VERSION = '3.3.2';
  Modal.TRANSITION_DURATION = 300;
  Modal.BACKDROP_TRANSITION_DURATION = 150;
  Modal.DEFAULTS = {
    backdrop: true,
    keyboard: true,
    show: true
  };
  Modal.prototype.toggle = function (_relatedTarget) {
    return this.isShown ? this.hide() : this.show(_relatedTarget);
  };
  Modal.prototype.show = function (_relatedTarget) {
    var that = this;
    var e = $.Event('show.bs.modal', { relatedTarget: _relatedTarget });
    this.$element.trigger(e);
    if (this.isShown || e.isDefaultPrevented())
      return;
    this.isShown = true;
    this.checkScrollbar();
    this.setScrollbar();
    this.$body.addClass('modal-open');
    this.escape();
    this.resize();
    this.$element.on('click.dismiss.bs.modal', '[data-dismiss="modal"]', $.proxy(this.hide, this));
    this.backdrop(function () {
      var transition = $.support.transition && that.$element.hasClass('fade');
      if (!that.$element.parent().length) {
        that.$element.appendTo(that.$body);
      }
      that.$element.show().scrollTop(0);
      if (that.options.backdrop)
        that.adjustBackdrop();
      that.adjustDialog();
      if (transition) {
        that.$element[0].offsetWidth;
      }
      that.$element.addClass('in').attr('aria-hidden', false);
      that.enforceFocus();
      var e = $.Event('shown.bs.modal', { relatedTarget: _relatedTarget });
      transition ? that.$element.find('.modal-dialog').one('bsTransitionEnd', function () {
        that.$element.trigger('focus').trigger(e);
      }).emulateTransitionEnd(Modal.TRANSITION_DURATION) : that.$element.trigger('focus').trigger(e);
    });
  };
  Modal.prototype.hide = function (e) {
    if (e)
      e.preventDefault();
    e = $.Event('hide.bs.modal');
    this.$element.trigger(e);
    if (!this.isShown || e.isDefaultPrevented())
      return;
    this.isShown = false;
    this.escape();
    this.resize();
    $(document).off('focusin.bs.modal');
    this.$element.removeClass('in').attr('aria-hidden', true).off('click.dismiss.bs.modal');
    $.support.transition && this.$element.hasClass('fade') ? this.$element.one('bsTransitionEnd', $.proxy(this.hideModal, this)).emulateTransitionEnd(Modal.TRANSITION_DURATION) : this.hideModal();
  };
  Modal.prototype.enforceFocus = function () {
    $(document).off('focusin.bs.modal').on('focusin.bs.modal', $.proxy(function (e) {
      if (this.$element[0] !== e.target && !this.$element.has(e.target).length) {
        this.$element.trigger('focus');
      }
    }, this));
  };
  Modal.prototype.escape = function () {
    if (this.isShown && this.options.keyboard) {
      this.$element.on('keydown.dismiss.bs.modal', $.proxy(function (e) {
        e.which == 27 && this.hide();
      }, this));
    } else if (!this.isShown) {
      this.$element.off('keydown.dismiss.bs.modal');
    }
  };
  Modal.prototype.resize = function () {
    if (this.isShown) {
      $(window).on('resize.bs.modal', $.proxy(this.handleUpdate, this));
    } else {
      $(window).off('resize.bs.modal');
    }
  };
  Modal.prototype.hideModal = function () {
    var that = this;
    this.$element.hide();
    this.backdrop(function () {
      that.$body.removeClass('modal-open');
      that.resetAdjustments();
      that.resetScrollbar();
      that.$element.trigger('hidden.bs.modal');
    });
  };
  Modal.prototype.removeBackdrop = function () {
    this.$backdrop && this.$backdrop.remove();
    this.$backdrop = null;
  };
  Modal.prototype.backdrop = function (callback) {
    var that = this;
    var animate = this.$element.hasClass('fade') ? 'fade' : '';
    if (this.isShown && this.options.backdrop) {
      var doAnimate = $.support.transition && animate;
      this.$backdrop = $('<div class="modal-backdrop ' + animate + '" />').prependTo(this.$element).on('click.dismiss.bs.modal', $.proxy(function (e) {
        if (e.target !== e.currentTarget)
          return;
        this.options.backdrop == 'static' ? this.$element[0].focus.call(this.$element[0]) : this.hide.call(this);
      }, this));
      if (doAnimate)
        this.$backdrop[0].offsetWidth;
      // force reflow
      this.$backdrop.addClass('in');
      if (!callback)
        return;
      doAnimate ? this.$backdrop.one('bsTransitionEnd', callback).emulateTransitionEnd(Modal.BACKDROP_TRANSITION_DURATION) : callback();
    } else if (!this.isShown && this.$backdrop) {
      this.$backdrop.removeClass('in');
      var callbackRemove = function () {
        that.removeBackdrop();
        callback && callback();
      };
      $.support.transition && this.$element.hasClass('fade') ? this.$backdrop.one('bsTransitionEnd', callbackRemove).emulateTransitionEnd(Modal.BACKDROP_TRANSITION_DURATION) : callbackRemove();
    } else if (callback) {
      callback();
    }
  };
  // these following methods are used to handle overflowing modals
  Modal.prototype.handleUpdate = function () {
    if (this.options.backdrop)
      this.adjustBackdrop();
    this.adjustDialog();
  };
  Modal.prototype.adjustBackdrop = function () {
    this.$backdrop.css('height', 0).css('height', this.$element[0].scrollHeight);
  };
  Modal.prototype.adjustDialog = function () {
    var modalIsOverflowing = this.$element[0].scrollHeight > document.documentElement.clientHeight;
    this.$element.css({
      paddingLeft: !this.bodyIsOverflowing && modalIsOverflowing ? this.scrollbarWidth : '',
      paddingRight: this.bodyIsOverflowing && !modalIsOverflowing ? this.scrollbarWidth : ''
    });
  };
  Modal.prototype.resetAdjustments = function () {
    this.$element.css({
      paddingLeft: '',
      paddingRight: ''
    });
  };
  Modal.prototype.checkScrollbar = function () {
    this.bodyIsOverflowing = document.body.scrollHeight > document.documentElement.clientHeight;
    this.scrollbarWidth = this.measureScrollbar();
  };
  Modal.prototype.setScrollbar = function () {
    var bodyPad = parseInt(this.$body.css('padding-right') || 0, 10);
    if (this.bodyIsOverflowing)
      this.$body.css('padding-right', bodyPad + this.scrollbarWidth);
  };
  Modal.prototype.resetScrollbar = function () {
    this.$body.css('padding-right', '');
  };
  Modal.prototype.measureScrollbar = function () {
    // thx walsh
    var scrollDiv = document.createElement('div');
    scrollDiv.className = 'modal-scrollbar-measure';
    this.$body.append(scrollDiv);
    var scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
    this.$body[0].removeChild(scrollDiv);
    return scrollbarWidth;
  };
  // MODAL PLUGIN DEFINITION
  // =======================
  function Plugin(option, _relatedTarget) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data('bs.modal');
      var options = $.extend({}, Modal.DEFAULTS, $this.data(), typeof option == 'object' && option);
      if (!data)
        $this.data('bs.modal', data = new Modal(this, options));
      if (typeof option == 'string')
        data[option](_relatedTarget);
      else if (options.show)
        data.show(_relatedTarget);
    });
  }
  var old = $.fn.modal;
  $.fn.modal = Plugin;
  $.fn.modal.Constructor = Modal;
  // MODAL NO CONFLICT
  // =================
  $.fn.modal.noConflict = function () {
    $.fn.modal = old;
    return this;
  };
  // MODAL DATA-API
  // ==============
  $(document).on('click.bs.modal.data-api', '[data-toggle="modal"]', function (e) {
    var $this = $(this);
    var href = $this.attr('href');
    var $target = $($this.attr('data-target') || href && href.replace(/.*(?=#[^\s]+$)/, ''));
    // strip for ie7
    var option = $target.data('bs.modal') ? 'toggle' : $.extend({ remote: !/#/.test(href) && href }, $target.data(), $this.data());
    if ($this.is('a'))
      e.preventDefault();
    $target.one('show.bs.modal', function (showEvent) {
      if (showEvent.isDefaultPrevented())
        return;
      // only register focus restorer if modal will actually get shown
      $target.one('hidden.bs.modal', function () {
        $this.is(':visible') && $this.trigger('focus');
      });
    });
    Plugin.call($target, option, this);
  });
}(jQuery);
/* ========================================================================
 * Bootstrap: tooltip.js v3.3.2
 * http://getbootstrap.com/javascript/#tooltip
 * Inspired by the original jQuery.tipsy by Jason Frame
 * ========================================================================
 * Copyright 2011-2015 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */
+function ($) {
  'use strict';
  // TOOLTIP PUBLIC CLASS DEFINITION
  // ===============================
  var Tooltip = function (element, options) {
    this.type = this.options = this.enabled = this.timeout = this.hoverState = this.$element = null;
    this.init('tooltip', element, options);
  };
  Tooltip.VERSION = '3.3.2';
  Tooltip.TRANSITION_DURATION = 150;
  Tooltip.DEFAULTS = {
    animation: true,
    placement: 'top',
    selector: false,
    template: '<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',
    trigger: 'hover focus',
    title: '',
    delay: 0,
    html: false,
    container: false,
    viewport: {
      selector: 'body',
      padding: 0
    }
  };
  Tooltip.prototype.init = function (type, element, options) {
    this.enabled = true;
    this.type = type;
    this.$element = $(element);
    this.options = this.getOptions(options);
    this.$viewport = this.options.viewport && $(this.options.viewport.selector || this.options.viewport);
    var triggers = this.options.trigger.split(' ');
    for (var i = triggers.length; i--;) {
      var trigger = triggers[i];
      if (trigger == 'click') {
        this.$element.on('click.' + this.type, this.options.selector, $.proxy(this.toggle, this));
      } else if (trigger != 'manual') {
        var eventIn = trigger == 'hover' ? 'mouseenter' : 'focusin';
        var eventOut = trigger == 'hover' ? 'mouseleave' : 'focusout';
        this.$element.on(eventIn + '.' + this.type, this.options.selector, $.proxy(this.enter, this));
        this.$element.on(eventOut + '.' + this.type, this.options.selector, $.proxy(this.leave, this));
      }
    }
    this.options.selector ? this._options = $.extend({}, this.options, {
      trigger: 'manual',
      selector: ''
    }) : this.fixTitle();
  };
  Tooltip.prototype.getDefaults = function () {
    return Tooltip.DEFAULTS;
  };
  Tooltip.prototype.getOptions = function (options) {
    options = $.extend({}, this.getDefaults(), this.$element.data(), options);
    if (options.delay && typeof options.delay == 'number') {
      options.delay = {
        show: options.delay,
        hide: options.delay
      };
    }
    return options;
  };
  Tooltip.prototype.getDelegateOptions = function () {
    var options = {};
    var defaults = this.getDefaults();
    this._options && $.each(this._options, function (key, value) {
      if (defaults[key] != value)
        options[key] = value;
    });
    return options;
  };
  Tooltip.prototype.enter = function (obj) {
    var self = obj instanceof this.constructor ? obj : $(obj.currentTarget).data('bs.' + this.type);
    if (self && self.$tip && self.$tip.is(':visible')) {
      self.hoverState = 'in';
      return;
    }
    if (!self) {
      self = new this.constructor(obj.currentTarget, this.getDelegateOptions());
      $(obj.currentTarget).data('bs.' + this.type, self);
    }
    clearTimeout(self.timeout);
    self.hoverState = 'in';
    if (!self.options.delay || !self.options.delay.show)
      return self.show();
    self.timeout = setTimeout(function () {
      if (self.hoverState == 'in')
        self.show();
    }, self.options.delay.show);
  };
  Tooltip.prototype.leave = function (obj) {
    var self = obj instanceof this.constructor ? obj : $(obj.currentTarget).data('bs.' + this.type);
    if (!self) {
      self = new this.constructor(obj.currentTarget, this.getDelegateOptions());
      $(obj.currentTarget).data('bs.' + this.type, self);
    }
    clearTimeout(self.timeout);
    self.hoverState = 'out';
    if (!self.options.delay || !self.options.delay.hide)
      return self.hide();
    self.timeout = setTimeout(function () {
      if (self.hoverState == 'out')
        self.hide();
    }, self.options.delay.hide);
  };
  Tooltip.prototype.show = function () {
    var e = $.Event('show.bs.' + this.type);
    if (this.hasContent() && this.enabled) {
      this.$element.trigger(e);
      var inDom = $.contains(this.$element[0].ownerDocument.documentElement, this.$element[0]);
      if (e.isDefaultPrevented() || !inDom)
        return;
      var that = this;
      var $tip = this.tip();
      var tipId = this.getUID(this.type);
      this.setContent();
      $tip.attr('id', tipId);
      this.$element.attr('aria-describedby', tipId);
      if (this.options.animation)
        $tip.addClass('fade');
      var placement = typeof this.options.placement == 'function' ? this.options.placement.call(this, $tip[0], this.$element[0]) : this.options.placement;
      var autoToken = /\s?auto?\s?/i;
      var autoPlace = autoToken.test(placement);
      if (autoPlace)
        placement = placement.replace(autoToken, '') || 'top';
      $tip.detach().css({
        top: 0,
        left: 0,
        display: 'block'
      }).addClass(placement).data('bs.' + this.type, this);
      this.options.container ? $tip.appendTo(this.options.container) : $tip.insertAfter(this.$element);
      var pos = this.getPosition();
      var actualWidth = $tip[0].offsetWidth;
      var actualHeight = $tip[0].offsetHeight;
      if (autoPlace) {
        var orgPlacement = placement;
        var $container = this.options.container ? $(this.options.container) : this.$element.parent();
        var containerDim = this.getPosition($container);
        placement = placement == 'bottom' && pos.bottom + actualHeight > containerDim.bottom ? 'top' : placement == 'top' && pos.top - actualHeight < containerDim.top ? 'bottom' : placement == 'right' && pos.right + actualWidth > containerDim.width ? 'left' : placement == 'left' && pos.left - actualWidth < containerDim.left ? 'right' : placement;
        $tip.removeClass(orgPlacement).addClass(placement);
      }
      var calculatedOffset = this.getCalculatedOffset(placement, pos, actualWidth, actualHeight);
      this.applyPlacement(calculatedOffset, placement);
      var complete = function () {
        var prevHoverState = that.hoverState;
        that.$element.trigger('shown.bs.' + that.type);
        that.hoverState = null;
        if (prevHoverState == 'out')
          that.leave(that);
      };
      $.support.transition && this.$tip.hasClass('fade') ? $tip.one('bsTransitionEnd', complete).emulateTransitionEnd(Tooltip.TRANSITION_DURATION) : complete();
    }
  };
  Tooltip.prototype.applyPlacement = function (offset, placement) {
    var $tip = this.tip();
    var width = $tip[0].offsetWidth;
    var height = $tip[0].offsetHeight;
    // manually read margins because getBoundingClientRect includes difference
    var marginTop = parseInt($tip.css('margin-top'), 10);
    var marginLeft = parseInt($tip.css('margin-left'), 10);
    // we must check for NaN for ie 8/9
    if (isNaN(marginTop))
      marginTop = 0;
    if (isNaN(marginLeft))
      marginLeft = 0;
    offset.top = offset.top + marginTop;
    offset.left = offset.left + marginLeft;
    // $.fn.offset doesn't round pixel values
    // so we use setOffset directly with our own function B-0
    $.offset.setOffset($tip[0], $.extend({
      using: function (props) {
        $tip.css({
          top: Math.round(props.top),
          left: Math.round(props.left)
        });
      }
    }, offset), 0);
    $tip.addClass('in');
    // check to see if placing tip in new offset caused the tip to resize itself
    var actualWidth = $tip[0].offsetWidth;
    var actualHeight = $tip[0].offsetHeight;
    if (placement == 'top' && actualHeight != height) {
      offset.top = offset.top + height - actualHeight;
    }
    var delta = this.getViewportAdjustedDelta(placement, offset, actualWidth, actualHeight);
    if (delta.left)
      offset.left += delta.left;
    else
      offset.top += delta.top;
    var isVertical = /top|bottom/.test(placement);
    var arrowDelta = isVertical ? delta.left * 2 - width + actualWidth : delta.top * 2 - height + actualHeight;
    var arrowOffsetPosition = isVertical ? 'offsetWidth' : 'offsetHeight';
    $tip.offset(offset);
    this.replaceArrow(arrowDelta, $tip[0][arrowOffsetPosition], isVertical);
  };
  Tooltip.prototype.replaceArrow = function (delta, dimension, isHorizontal) {
    this.arrow().css(isHorizontal ? 'left' : 'top', 50 * (1 - delta / dimension) + '%').css(isHorizontal ? 'top' : 'left', '');
  };
  Tooltip.prototype.setContent = function () {
    var $tip = this.tip();
    var title = this.getTitle();
    $tip.find('.tooltip-inner')[this.options.html ? 'html' : 'text'](title);
    $tip.removeClass('fade in top bottom left right');
  };
  Tooltip.prototype.hide = function (callback) {
    var that = this;
    var $tip = this.tip();
    var e = $.Event('hide.bs.' + this.type);
    function complete() {
      if (that.hoverState != 'in')
        $tip.detach();
      that.$element.removeAttr('aria-describedby').trigger('hidden.bs.' + that.type);
      callback && callback();
    }
    this.$element.trigger(e);
    if (e.isDefaultPrevented())
      return;
    $tip.removeClass('in');
    $.support.transition && this.$tip.hasClass('fade') ? $tip.one('bsTransitionEnd', complete).emulateTransitionEnd(Tooltip.TRANSITION_DURATION) : complete();
    this.hoverState = null;
    return this;
  };
  Tooltip.prototype.fixTitle = function () {
    var $e = this.$element;
    if ($e.attr('title') || typeof $e.attr('data-original-title') != 'string') {
      $e.attr('data-original-title', $e.attr('title') || '').attr('title', '');
    }
  };
  Tooltip.prototype.hasContent = function () {
    return this.getTitle();
  };
  Tooltip.prototype.getPosition = function ($element) {
    $element = $element || this.$element;
    var el = $element[0];
    var isBody = el.tagName == 'BODY';
    var elRect = el.getBoundingClientRect();
    if (elRect.width == null) {
      // width and height are missing in IE8, so compute them manually; see https://github.com/twbs/bootstrap/issues/14093
      elRect = $.extend({}, elRect, {
        width: elRect.right - elRect.left,
        height: elRect.bottom - elRect.top
      });
    }
    var elOffset = isBody ? {
        top: 0,
        left: 0
      } : $element.offset();
    var scroll = { scroll: isBody ? document.documentElement.scrollTop || document.body.scrollTop : $element.scrollTop() };
    var outerDims = isBody ? {
        width: $(window).width(),
        height: $(window).height()
      } : null;
    return $.extend({}, elRect, scroll, outerDims, elOffset);
  };
  Tooltip.prototype.getCalculatedOffset = function (placement, pos, actualWidth, actualHeight) {
    return placement == 'bottom' ? {
      top: pos.top + pos.height,
      left: pos.left + pos.width / 2 - actualWidth / 2
    } : placement == 'top' ? {
      top: pos.top - actualHeight,
      left: pos.left + pos.width / 2 - actualWidth / 2
    } : placement == 'left' ? {
      top: pos.top + pos.height / 2 - actualHeight / 2,
      left: pos.left - actualWidth
    } : {
      top: pos.top + pos.height / 2 - actualHeight / 2,
      left: pos.left + pos.width
    };
  };
  Tooltip.prototype.getViewportAdjustedDelta = function (placement, pos, actualWidth, actualHeight) {
    var delta = {
        top: 0,
        left: 0
      };
    if (!this.$viewport)
      return delta;
    var viewportPadding = this.options.viewport && this.options.viewport.padding || 0;
    var viewportDimensions = this.getPosition(this.$viewport);
    if (/right|left/.test(placement)) {
      var topEdgeOffset = pos.top - viewportPadding - viewportDimensions.scroll;
      var bottomEdgeOffset = pos.top + viewportPadding - viewportDimensions.scroll + actualHeight;
      if (topEdgeOffset < viewportDimensions.top) {
        // top overflow
        delta.top = viewportDimensions.top - topEdgeOffset;
      } else if (bottomEdgeOffset > viewportDimensions.top + viewportDimensions.height) {
        // bottom overflow
        delta.top = viewportDimensions.top + viewportDimensions.height - bottomEdgeOffset;
      }
    } else {
      var leftEdgeOffset = pos.left - viewportPadding;
      var rightEdgeOffset = pos.left + viewportPadding + actualWidth;
      if (leftEdgeOffset < viewportDimensions.left) {
        // left overflow
        delta.left = viewportDimensions.left - leftEdgeOffset;
      } else if (rightEdgeOffset > viewportDimensions.width) {
        // right overflow
        delta.left = viewportDimensions.left + viewportDimensions.width - rightEdgeOffset;
      }
    }
    return delta;
  };
  Tooltip.prototype.getTitle = function () {
    var title;
    var $e = this.$element;
    var o = this.options;
    title = $e.attr('data-original-title') || (typeof o.title == 'function' ? o.title.call($e[0]) : o.title);
    return title;
  };
  Tooltip.prototype.getUID = function (prefix) {
    do
      prefix += ~~(Math.random() * 1000000);
    while (document.getElementById(prefix));
    return prefix;
  };
  Tooltip.prototype.tip = function () {
    return this.$tip = this.$tip || $(this.options.template);
  };
  Tooltip.prototype.arrow = function () {
    return this.$arrow = this.$arrow || this.tip().find('.tooltip-arrow');
  };
  Tooltip.prototype.enable = function () {
    this.enabled = true;
  };
  Tooltip.prototype.disable = function () {
    this.enabled = false;
  };
  Tooltip.prototype.toggleEnabled = function () {
    this.enabled = !this.enabled;
  };
  Tooltip.prototype.toggle = function (e) {
    var self = this;
    if (e) {
      self = $(e.currentTarget).data('bs.' + this.type);
      if (!self) {
        self = new this.constructor(e.currentTarget, this.getDelegateOptions());
        $(e.currentTarget).data('bs.' + this.type, self);
      }
    }
    self.tip().hasClass('in') ? self.leave(self) : self.enter(self);
  };
  Tooltip.prototype.destroy = function () {
    var that = this;
    clearTimeout(this.timeout);
    this.hide(function () {
      that.$element.off('.' + that.type).removeData('bs.' + that.type);
    });
  };
  // TOOLTIP PLUGIN DEFINITION
  // =========================
  function Plugin(option) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data('bs.tooltip');
      var options = typeof option == 'object' && option;
      if (!data && option == 'destroy')
        return;
      if (!data)
        $this.data('bs.tooltip', data = new Tooltip(this, options));
      if (typeof option == 'string')
        data[option]();
    });
  }
  var old = $.fn.tooltip;
  $.fn.tooltip = Plugin;
  $.fn.tooltip.Constructor = Tooltip;
  // TOOLTIP NO CONFLICT
  // ===================
  $.fn.tooltip.noConflict = function () {
    $.fn.tooltip = old;
    return this;
  };
}(jQuery);
/* ========================================================================
 * Bootstrap: popover.js v3.3.2
 * http://getbootstrap.com/javascript/#popovers
 * ========================================================================
 * Copyright 2011-2015 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */
+function ($) {
  'use strict';
  // POPOVER PUBLIC CLASS DEFINITION
  // ===============================
  var Popover = function (element, options) {
    this.init('popover', element, options);
  };
  if (!$.fn.tooltip)
    throw new Error('Popover requires tooltip.js');
  Popover.VERSION = '3.3.2';
  Popover.DEFAULTS = $.extend({}, $.fn.tooltip.Constructor.DEFAULTS, {
    placement: 'right',
    trigger: 'click',
    content: '',
    template: '<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>'
  });
  // NOTE: POPOVER EXTENDS tooltip.js
  // ================================
  Popover.prototype = $.extend({}, $.fn.tooltip.Constructor.prototype);
  Popover.prototype.constructor = Popover;
  Popover.prototype.getDefaults = function () {
    return Popover.DEFAULTS;
  };
  Popover.prototype.setContent = function () {
    var $tip = this.tip();
    var title = this.getTitle();
    var content = this.getContent();
    $tip.find('.popover-title')[this.options.html ? 'html' : 'text'](title);
    $tip.find('.popover-content').children().detach().end()[this.options.html ? typeof content == 'string' ? 'html' : 'append' : 'text'](content);
    $tip.removeClass('fade top bottom left right in');
    // IE8 doesn't accept hiding via the `:empty` pseudo selector, we have to do
    // this manually by checking the contents.
    if (!$tip.find('.popover-title').html())
      $tip.find('.popover-title').hide();
  };
  Popover.prototype.hasContent = function () {
    return this.getTitle() || this.getContent();
  };
  Popover.prototype.getContent = function () {
    var $e = this.$element;
    var o = this.options;
    return $e.attr('data-content') || (typeof o.content == 'function' ? o.content.call($e[0]) : o.content);
  };
  Popover.prototype.arrow = function () {
    return this.$arrow = this.$arrow || this.tip().find('.arrow');
  };
  Popover.prototype.tip = function () {
    if (!this.$tip)
      this.$tip = $(this.options.template);
    return this.$tip;
  };
  // POPOVER PLUGIN DEFINITION
  // =========================
  function Plugin(option) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data('bs.popover');
      var options = typeof option == 'object' && option;
      if (!data && option == 'destroy')
        return;
      if (!data)
        $this.data('bs.popover', data = new Popover(this, options));
      if (typeof option == 'string')
        data[option]();
    });
  }
  var old = $.fn.popover;
  $.fn.popover = Plugin;
  $.fn.popover.Constructor = Popover;
  // POPOVER NO CONFLICT
  // ===================
  $.fn.popover.noConflict = function () {
    $.fn.popover = old;
    return this;
  };
}(jQuery);
/* ========================================================================
 * Bootstrap: scrollspy.js v3.3.2
 * http://getbootstrap.com/javascript/#scrollspy
 * ========================================================================
 * Copyright 2011-2015 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */
+function ($) {
  'use strict';
  // SCROLLSPY CLASS DEFINITION
  // ==========================
  function ScrollSpy(element, options) {
    var process = $.proxy(this.process, this);
    this.$body = $('body');
    this.$scrollElement = $(element).is('body') ? $(window) : $(element);
    this.options = $.extend({}, ScrollSpy.DEFAULTS, options);
    this.selector = (this.options.target || '') + ' .nav li > a';
    this.offsets = [];
    this.targets = [];
    this.activeTarget = null;
    this.scrollHeight = 0;
    this.$scrollElement.on('scroll.bs.scrollspy', process);
    this.refresh();
    this.process();
  }
  ScrollSpy.VERSION = '3.3.2';
  ScrollSpy.DEFAULTS = { offset: 10 };
  ScrollSpy.prototype.getScrollHeight = function () {
    return this.$scrollElement[0].scrollHeight || Math.max(this.$body[0].scrollHeight, document.documentElement.scrollHeight);
  };
  ScrollSpy.prototype.refresh = function () {
    var offsetMethod = 'offset';
    var offsetBase = 0;
    if (!$.isWindow(this.$scrollElement[0])) {
      offsetMethod = 'position';
      offsetBase = this.$scrollElement.scrollTop();
    }
    this.offsets = [];
    this.targets = [];
    this.scrollHeight = this.getScrollHeight();
    var self = this;
    this.$body.find(this.selector).map(function () {
      var $el = $(this);
      var href = $el.data('target') || $el.attr('href');
      var $href = /^#./.test(href) && $(href);
      return $href && $href.length && $href.is(':visible') && [[
          $href[offsetMethod]().top + offsetBase,
          href
        ]] || null;
    }).sort(function (a, b) {
      return a[0] - b[0];
    }).each(function () {
      self.offsets.push(this[0]);
      self.targets.push(this[1]);
    });
  };
  ScrollSpy.prototype.process = function () {
    var scrollTop = this.$scrollElement.scrollTop() + this.options.offset;
    var scrollHeight = this.getScrollHeight();
    var maxScroll = this.options.offset + scrollHeight - this.$scrollElement.height();
    var offsets = this.offsets;
    var targets = this.targets;
    var activeTarget = this.activeTarget;
    var i;
    if (this.scrollHeight != scrollHeight) {
      this.refresh();
    }
    if (scrollTop >= maxScroll) {
      return activeTarget != (i = targets[targets.length - 1]) && this.activate(i);
    }
    if (activeTarget && scrollTop < offsets[0]) {
      this.activeTarget = null;
      return this.clear();
    }
    for (i = offsets.length; i--;) {
      activeTarget != targets[i] && scrollTop >= offsets[i] && (!offsets[i + 1] || scrollTop <= offsets[i + 1]) && this.activate(targets[i]);
    }
  };
  ScrollSpy.prototype.activate = function (target) {
    this.activeTarget = target;
    this.clear();
    var selector = this.selector + '[data-target="' + target + '"],' + this.selector + '[href="' + target + '"]';
    var active = $(selector).parents('li').addClass('active');
    if (active.parent('.dropdown-menu').length) {
      active = active.closest('li.dropdown').addClass('active');
    }
    active.trigger('activate.bs.scrollspy');
  };
  ScrollSpy.prototype.clear = function () {
    $(this.selector).parentsUntil(this.options.target, '.active').removeClass('active');
  };
  // SCROLLSPY PLUGIN DEFINITION
  // ===========================
  function Plugin(option) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data('bs.scrollspy');
      var options = typeof option == 'object' && option;
      if (!data)
        $this.data('bs.scrollspy', data = new ScrollSpy(this, options));
      if (typeof option == 'string')
        data[option]();
    });
  }
  var old = $.fn.scrollspy;
  $.fn.scrollspy = Plugin;
  $.fn.scrollspy.Constructor = ScrollSpy;
  // SCROLLSPY NO CONFLICT
  // =====================
  $.fn.scrollspy.noConflict = function () {
    $.fn.scrollspy = old;
    return this;
  };
  // SCROLLSPY DATA-API
  // ==================
  $(window).on('load.bs.scrollspy.data-api', function () {
    $('[data-spy="scroll"]').each(function () {
      var $spy = $(this);
      Plugin.call($spy, $spy.data());
    });
  });
}(jQuery);
/* ========================================================================
 * Bootstrap: tab.js v3.3.2
 * http://getbootstrap.com/javascript/#tabs
 * ========================================================================
 * Copyright 2011-2015 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */
+function ($) {
  'use strict';
  // TAB CLASS DEFINITION
  // ====================
  var Tab = function (element) {
    this.element = $(element);
  };
  Tab.VERSION = '3.3.2';
  Tab.TRANSITION_DURATION = 150;
  Tab.prototype.show = function () {
    var $this = this.element;
    var $ul = $this.closest('ul:not(.dropdown-menu)');
    var selector = $this.data('target');
    if (!selector) {
      selector = $this.attr('href');
      selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '');
    }
    if ($this.parent('li').hasClass('active'))
      return;
    var $previous = $ul.find('.active:last a');
    var hideEvent = $.Event('hide.bs.tab', { relatedTarget: $this[0] });
    var showEvent = $.Event('show.bs.tab', { relatedTarget: $previous[0] });
    $previous.trigger(hideEvent);
    $this.trigger(showEvent);
    if (showEvent.isDefaultPrevented() || hideEvent.isDefaultPrevented())
      return;
    var $target = $(selector);
    this.activate($this.closest('li'), $ul);
    this.activate($target, $target.parent(), function () {
      $previous.trigger({
        type: 'hidden.bs.tab',
        relatedTarget: $this[0]
      });
      $this.trigger({
        type: 'shown.bs.tab',
        relatedTarget: $previous[0]
      });
    });
  };
  Tab.prototype.activate = function (element, container, callback) {
    var $active = container.find('> .active');
    var transition = callback && $.support.transition && ($active.length && $active.hasClass('fade') || !!container.find('> .fade').length);
    function next() {
      $active.removeClass('active').find('> .dropdown-menu > .active').removeClass('active').end().find('[data-toggle="tab"]').attr('aria-expanded', false);
      element.addClass('active').find('[data-toggle="tab"]').attr('aria-expanded', true);
      if (transition) {
        element[0].offsetWidth;
        // reflow for transition
        element.addClass('in');
      } else {
        element.removeClass('fade');
      }
      if (element.parent('.dropdown-menu')) {
        element.closest('li.dropdown').addClass('active').end().find('[data-toggle="tab"]').attr('aria-expanded', true);
      }
      callback && callback();
    }
    $active.length && transition ? $active.one('bsTransitionEnd', next).emulateTransitionEnd(Tab.TRANSITION_DURATION) : next();
    $active.removeClass('in');
  };
  // TAB PLUGIN DEFINITION
  // =====================
  function Plugin(option) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data('bs.tab');
      if (!data)
        $this.data('bs.tab', data = new Tab(this));
      if (typeof option == 'string')
        data[option]();
    });
  }
  var old = $.fn.tab;
  $.fn.tab = Plugin;
  $.fn.tab.Constructor = Tab;
  // TAB NO CONFLICT
  // ===============
  $.fn.tab.noConflict = function () {
    $.fn.tab = old;
    return this;
  };
  // TAB DATA-API
  // ============
  var clickHandler = function (e) {
    e.preventDefault();
    Plugin.call($(this), 'show');
  };
  $(document).on('click.bs.tab.data-api', '[data-toggle="tab"]', clickHandler).on('click.bs.tab.data-api', '[data-toggle="pill"]', clickHandler);
}(jQuery);
/* ========================================================================
 * Bootstrap: affix.js v3.3.2
 * http://getbootstrap.com/javascript/#affix
 * ========================================================================
 * Copyright 2011-2015 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */
+function ($) {
  'use strict';
  // AFFIX CLASS DEFINITION
  // ======================
  var Affix = function (element, options) {
    this.options = $.extend({}, Affix.DEFAULTS, options);
    this.$target = $(this.options.target).on('scroll.bs.affix.data-api', $.proxy(this.checkPosition, this)).on('click.bs.affix.data-api', $.proxy(this.checkPositionWithEventLoop, this));
    this.$element = $(element);
    this.affixed = this.unpin = this.pinnedOffset = null;
    this.checkPosition();
  };
  Affix.VERSION = '3.3.2';
  Affix.RESET = 'affix affix-top affix-bottom';
  Affix.DEFAULTS = {
    offset: 0,
    target: window
  };
  Affix.prototype.getState = function (scrollHeight, height, offsetTop, offsetBottom) {
    var scrollTop = this.$target.scrollTop();
    var position = this.$element.offset();
    var targetHeight = this.$target.height();
    if (offsetTop != null && this.affixed == 'top')
      return scrollTop < offsetTop ? 'top' : false;
    if (this.affixed == 'bottom') {
      if (offsetTop != null)
        return scrollTop + this.unpin <= position.top ? false : 'bottom';
      return scrollTop + targetHeight <= scrollHeight - offsetBottom ? false : 'bottom';
    }
    var initializing = this.affixed == null;
    var colliderTop = initializing ? scrollTop : position.top;
    var colliderHeight = initializing ? targetHeight : height;
    if (offsetTop != null && scrollTop <= offsetTop)
      return 'top';
    if (offsetBottom != null && colliderTop + colliderHeight >= scrollHeight - offsetBottom)
      return 'bottom';
    return false;
  };
  Affix.prototype.getPinnedOffset = function () {
    if (this.pinnedOffset)
      return this.pinnedOffset;
    this.$element.removeClass(Affix.RESET).addClass('affix');
    var scrollTop = this.$target.scrollTop();
    var position = this.$element.offset();
    return this.pinnedOffset = position.top - scrollTop;
  };
  Affix.prototype.checkPositionWithEventLoop = function () {
    setTimeout($.proxy(this.checkPosition, this), 1);
  };
  Affix.prototype.checkPosition = function () {
    if (!this.$element.is(':visible'))
      return;
    var height = this.$element.height();
    var offset = this.options.offset;
    var offsetTop = offset.top;
    var offsetBottom = offset.bottom;
    var scrollHeight = $('body').height();
    if (typeof offset != 'object')
      offsetBottom = offsetTop = offset;
    if (typeof offsetTop == 'function')
      offsetTop = offset.top(this.$element);
    if (typeof offsetBottom == 'function')
      offsetBottom = offset.bottom(this.$element);
    var affix = this.getState(scrollHeight, height, offsetTop, offsetBottom);
    if (this.affixed != affix) {
      if (this.unpin != null)
        this.$element.css('top', '');
      var affixType = 'affix' + (affix ? '-' + affix : '');
      var e = $.Event(affixType + '.bs.affix');
      this.$element.trigger(e);
      if (e.isDefaultPrevented())
        return;
      this.affixed = affix;
      this.unpin = affix == 'bottom' ? this.getPinnedOffset() : null;
      this.$element.removeClass(Affix.RESET).addClass(affixType).trigger(affixType.replace('affix', 'affixed') + '.bs.affix');
    }
    if (affix == 'bottom') {
      this.$element.offset({ top: scrollHeight - height - offsetBottom });
    }
  };
  // AFFIX PLUGIN DEFINITION
  // =======================
  function Plugin(option) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data('bs.affix');
      var options = typeof option == 'object' && option;
      if (!data)
        $this.data('bs.affix', data = new Affix(this, options));
      if (typeof option == 'string')
        data[option]();
    });
  }
  var old = $.fn.affix;
  $.fn.affix = Plugin;
  $.fn.affix.Constructor = Affix;
  // AFFIX NO CONFLICT
  // =================
  $.fn.affix.noConflict = function () {
    $.fn.affix = old;
    return this;
  };
  // AFFIX DATA-API
  // ==============
  $(window).on('load', function () {
    $('[data-spy="affix"]').each(function () {
      var $spy = $(this);
      var data = $spy.data();
      data.offset = data.offset || {};
      if (data.offsetBottom != null)
        data.offset.bottom = data.offsetBottom;
      if (data.offsetTop != null)
        data.offset.top = data.offsetTop;
      Plugin.call($spy, data);
    });
  });
}(jQuery);/**
 * @license
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modern -o ./dist/lodash.js`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
;
(function () {
  /** Used as a safe reference for `undefined` in pre ES5 environments */
  var undefined;
  /** Used to pool arrays and objects used internally */
  var arrayPool = [], objectPool = [];
  /** Used to generate unique IDs */
  var idCounter = 0;
  /** Used to prefix keys to avoid issues with `__proto__` and properties on `Object.prototype` */
  var keyPrefix = +new Date() + '';
  /** Used as the size when optimizations are enabled for large arrays */
  var largeArraySize = 75;
  /** Used as the max size of the `arrayPool` and `objectPool` */
  var maxPoolSize = 40;
  /** Used to detect and test whitespace */
  var whitespace = ' \t\x0B\f\xa0\ufeff' + '\n\r\u2028\u2029' + '\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000';
  /** Used to match empty string literals in compiled template source */
  var reEmptyStringLeading = /\b__p \+= '';/g, reEmptyStringMiddle = /\b(__p \+=) '' \+/g, reEmptyStringTrailing = /(__e\(.*?\)|\b__t\)) \+\n'';/g;
  /**
   * Used to match ES6 template delimiters
   * http://people.mozilla.org/~jorendorff/es6-draft.html#sec-literals-string-literals
   */
  var reEsTemplate = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g;
  /** Used to match regexp flags from their coerced string values */
  var reFlags = /\w*$/;
  /** Used to detected named functions */
  var reFuncName = /^\s*function[ \n\r\t]+\w/;
  /** Used to match "interpolate" template delimiters */
  var reInterpolate = /<%=([\s\S]+?)%>/g;
  /** Used to match leading whitespace and zeros to be removed */
  var reLeadingSpacesAndZeros = RegExp('^[' + whitespace + ']*0+(?=.$)');
  /** Used to ensure capturing order of template delimiters */
  var reNoMatch = /($^)/;
  /** Used to detect functions containing a `this` reference */
  var reThis = /\bthis\b/;
  /** Used to match unescaped characters in compiled string literals */
  var reUnescapedString = /['\n\r\t\u2028\u2029\\]/g;
  /** Used to assign default `context` object properties */
  var contextProps = [
      'Array',
      'Boolean',
      'Date',
      'Function',
      'Math',
      'Number',
      'Object',
      'RegExp',
      'String',
      '_',
      'attachEvent',
      'clearTimeout',
      'isFinite',
      'isNaN',
      'parseInt',
      'setTimeout'
    ];
  /** Used to make template sourceURLs easier to identify */
  var templateCounter = 0;
  /** `Object#toString` result shortcuts */
  var argsClass = '[object Arguments]', arrayClass = '[object Array]', boolClass = '[object Boolean]', dateClass = '[object Date]', funcClass = '[object Function]', numberClass = '[object Number]', objectClass = '[object Object]', regexpClass = '[object RegExp]', stringClass = '[object String]';
  /** Used to identify object classifications that `_.clone` supports */
  var cloneableClasses = {};
  cloneableClasses[funcClass] = false;
  cloneableClasses[argsClass] = cloneableClasses[arrayClass] = cloneableClasses[boolClass] = cloneableClasses[dateClass] = cloneableClasses[numberClass] = cloneableClasses[objectClass] = cloneableClasses[regexpClass] = cloneableClasses[stringClass] = true;
  /** Used as an internal `_.debounce` options object */
  var debounceOptions = {
      'leading': false,
      'maxWait': 0,
      'trailing': false
    };
  /** Used as the property descriptor for `__bindData__` */
  var descriptor = {
      'configurable': false,
      'enumerable': false,
      'value': null,
      'writable': false
    };
  /** Used to determine if values are of the language type Object */
  var objectTypes = {
      'boolean': false,
      'function': true,
      'object': true,
      'number': false,
      'string': false,
      'undefined': false
    };
  /** Used to escape characters for inclusion in compiled string literals */
  var stringEscapes = {
      '\\': '\\',
      '\'': '\'',
      '\n': 'n',
      '\r': 'r',
      '\t': 't',
      '\u2028': 'u2028',
      '\u2029': 'u2029'
    };
  /** Used as a reference to the global object */
  var root = objectTypes[typeof window] && window || this;
  /** Detect free variable `exports` */
  var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;
  /** Detect free variable `module` */
  var freeModule = objectTypes[typeof module] && module && !module.nodeType && module;
  /** Detect the popular CommonJS extension `module.exports` */
  var moduleExports = freeModule && freeModule.exports === freeExports && freeExports;
  /** Detect free variable `global` from Node.js or Browserified code and use it as `root` */
  var freeGlobal = objectTypes[typeof global] && global;
  if (freeGlobal && (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal)) {
    root = freeGlobal;
  }
  /*--------------------------------------------------------------------------*/
  /**
   * The base implementation of `_.indexOf` without support for binary searches
   * or `fromIndex` constraints.
   *
   * @private
   * @param {Array} array The array to search.
   * @param {*} value The value to search for.
   * @param {number} [fromIndex=0] The index to search from.
   * @returns {number} Returns the index of the matched value or `-1`.
   */
  function baseIndexOf(array, value, fromIndex) {
    var index = (fromIndex || 0) - 1, length = array ? array.length : 0;
    while (++index < length) {
      if (array[index] === value) {
        return index;
      }
    }
    return -1;
  }
  /**
   * An implementation of `_.contains` for cache objects that mimics the return
   * signature of `_.indexOf` by returning `0` if the value is found, else `-1`.
   *
   * @private
   * @param {Object} cache The cache object to inspect.
   * @param {*} value The value to search for.
   * @returns {number} Returns `0` if `value` is found, else `-1`.
   */
  function cacheIndexOf(cache, value) {
    var type = typeof value;
    cache = cache.cache;
    if (type == 'boolean' || value == null) {
      return cache[value] ? 0 : -1;
    }
    if (type != 'number' && type != 'string') {
      type = 'object';
    }
    var key = type == 'number' ? value : keyPrefix + value;
    cache = (cache = cache[type]) && cache[key];
    return type == 'object' ? cache && baseIndexOf(cache, value) > -1 ? 0 : -1 : cache ? 0 : -1;
  }
  /**
   * Adds a given value to the corresponding cache object.
   *
   * @private
   * @param {*} value The value to add to the cache.
   */
  function cachePush(value) {
    var cache = this.cache, type = typeof value;
    if (type == 'boolean' || value == null) {
      cache[value] = true;
    } else {
      if (type != 'number' && type != 'string') {
        type = 'object';
      }
      var key = type == 'number' ? value : keyPrefix + value, typeCache = cache[type] || (cache[type] = {});
      if (type == 'object') {
        (typeCache[key] || (typeCache[key] = [])).push(value);
      } else {
        typeCache[key] = true;
      }
    }
  }
  /**
   * Used by `_.max` and `_.min` as the default callback when a given
   * collection is a string value.
   *
   * @private
   * @param {string} value The character to inspect.
   * @returns {number} Returns the code unit of given character.
   */
  function charAtCallback(value) {
    return value.charCodeAt(0);
  }
  /**
   * Used by `sortBy` to compare transformed `collection` elements, stable sorting
   * them in ascending order.
   *
   * @private
   * @param {Object} a The object to compare to `b`.
   * @param {Object} b The object to compare to `a`.
   * @returns {number} Returns the sort order indicator of `1` or `-1`.
   */
  function compareAscending(a, b) {
    var ac = a.criteria, bc = b.criteria, index = -1, length = ac.length;
    while (++index < length) {
      var value = ac[index], other = bc[index];
      if (value !== other) {
        if (value > other || typeof value == 'undefined') {
          return 1;
        }
        if (value < other || typeof other == 'undefined') {
          return -1;
        }
      }
    }
    // Fixes an `Array#sort` bug in the JS engine embedded in Adobe applications
    // that causes it, under certain circumstances, to return the same value for
    // `a` and `b`. See https://github.com/jashkenas/underscore/pull/1247
    //
    // This also ensures a stable sort in V8 and other engines.
    // See http://code.google.com/p/v8/issues/detail?id=90
    return a.index - b.index;
  }
  /**
   * Creates a cache object to optimize linear searches of large arrays.
   *
   * @private
   * @param {Array} [array=[]] The array to search.
   * @returns {null|Object} Returns the cache object or `null` if caching should not be used.
   */
  function createCache(array) {
    var index = -1, length = array.length, first = array[0], mid = array[length / 2 | 0], last = array[length - 1];
    if (first && typeof first == 'object' && mid && typeof mid == 'object' && last && typeof last == 'object') {
      return false;
    }
    var cache = getObject();
    cache['false'] = cache['null'] = cache['true'] = cache['undefined'] = false;
    var result = getObject();
    result.array = array;
    result.cache = cache;
    result.push = cachePush;
    while (++index < length) {
      result.push(array[index]);
    }
    return result;
  }
  /**
   * Used by `template` to escape characters for inclusion in compiled
   * string literals.
   *
   * @private
   * @param {string} match The matched character to escape.
   * @returns {string} Returns the escaped character.
   */
  function escapeStringChar(match) {
    return '\\' + stringEscapes[match];
  }
  /**
   * Gets an array from the array pool or creates a new one if the pool is empty.
   *
   * @private
   * @returns {Array} The array from the pool.
   */
  function getArray() {
    return arrayPool.pop() || [];
  }
  /**
   * Gets an object from the object pool or creates a new one if the pool is empty.
   *
   * @private
   * @returns {Object} The object from the pool.
   */
  function getObject() {
    return objectPool.pop() || {
      'array': null,
      'cache': null,
      'criteria': null,
      'false': false,
      'index': 0,
      'null': false,
      'number': null,
      'object': null,
      'push': null,
      'string': null,
      'true': false,
      'undefined': false,
      'value': null
    };
  }
  /**
   * Releases the given array back to the array pool.
   *
   * @private
   * @param {Array} [array] The array to release.
   */
  function releaseArray(array) {
    array.length = 0;
    if (arrayPool.length < maxPoolSize) {
      arrayPool.push(array);
    }
  }
  /**
   * Releases the given object back to the object pool.
   *
   * @private
   * @param {Object} [object] The object to release.
   */
  function releaseObject(object) {
    var cache = object.cache;
    if (cache) {
      releaseObject(cache);
    }
    object.array = object.cache = object.criteria = object.object = object.number = object.string = object.value = null;
    if (objectPool.length < maxPoolSize) {
      objectPool.push(object);
    }
  }
  /**
   * Slices the `collection` from the `start` index up to, but not including,
   * the `end` index.
   *
   * Note: This function is used instead of `Array#slice` to support node lists
   * in IE < 9 and to ensure dense arrays are returned.
   *
   * @private
   * @param {Array|Object|string} collection The collection to slice.
   * @param {number} start The start index.
   * @param {number} end The end index.
   * @returns {Array} Returns the new array.
   */
  function slice(array, start, end) {
    start || (start = 0);
    if (typeof end == 'undefined') {
      end = array ? array.length : 0;
    }
    var index = -1, length = end - start || 0, result = Array(length < 0 ? 0 : length);
    while (++index < length) {
      result[index] = array[start + index];
    }
    return result;
  }
  /*--------------------------------------------------------------------------*/
  /**
   * Create a new `lodash` function using the given context object.
   *
   * @static
   * @memberOf _
   * @category Utilities
   * @param {Object} [context=root] The context object.
   * @returns {Function} Returns the `lodash` function.
   */
  function runInContext(context) {
    // Avoid issues with some ES3 environments that attempt to use values, named
    // after built-in constructors like `Object`, for the creation of literals.
    // ES5 clears this up by stating that literals must use built-in constructors.
    // See http://es5.github.io/#x11.1.5.
    context = context ? _.defaults(root.Object(), context, _.pick(root, contextProps)) : root;
    /** Native constructor references */
    var Array = context.Array, Boolean = context.Boolean, Date = context.Date, Function = context.Function, Math = context.Math, Number = context.Number, Object = context.Object, RegExp = context.RegExp, String = context.String, TypeError = context.TypeError;
    /**
     * Used for `Array` method references.
     *
     * Normally `Array.prototype` would suffice, however, using an array literal
     * avoids issues in Narwhal.
     */
    var arrayRef = [];
    /** Used for native method references */
    var objectProto = Object.prototype;
    /** Used to restore the original `_` reference in `noConflict` */
    var oldDash = context._;
    /** Used to resolve the internal [[Class]] of values */
    var toString = objectProto.toString;
    /** Used to detect if a method is native */
    var reNative = RegExp('^' + String(toString).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/toString| for [^\]]+/g, '.*?') + '$');
    /** Native method shortcuts */
    var ceil = Math.ceil, clearTimeout = context.clearTimeout, floor = Math.floor, fnToString = Function.prototype.toString, getPrototypeOf = isNative(getPrototypeOf = Object.getPrototypeOf) && getPrototypeOf, hasOwnProperty = objectProto.hasOwnProperty, push = arrayRef.push, setTimeout = context.setTimeout, splice = arrayRef.splice, unshift = arrayRef.unshift;
    /** Used to set meta data on functions */
    var defineProperty = function () {
        // IE 8 only accepts DOM elements
        try {
          var o = {}, func = isNative(func = Object.defineProperty) && func, result = func(o, o, o) && func;
        } catch (e) {
        }
        return result;
      }();
    /* Native method shortcuts for methods with the same name as other `lodash` methods */
    var nativeCreate = isNative(nativeCreate = Object.create) && nativeCreate, nativeIsArray = isNative(nativeIsArray = Array.isArray) && nativeIsArray, nativeIsFinite = context.isFinite, nativeIsNaN = context.isNaN, nativeKeys = isNative(nativeKeys = Object.keys) && nativeKeys, nativeMax = Math.max, nativeMin = Math.min, nativeParseInt = context.parseInt, nativeRandom = Math.random;
    /** Used to lookup a built-in constructor by [[Class]] */
    var ctorByClass = {};
    ctorByClass[arrayClass] = Array;
    ctorByClass[boolClass] = Boolean;
    ctorByClass[dateClass] = Date;
    ctorByClass[funcClass] = Function;
    ctorByClass[objectClass] = Object;
    ctorByClass[numberClass] = Number;
    ctorByClass[regexpClass] = RegExp;
    ctorByClass[stringClass] = String;
    /*--------------------------------------------------------------------------*/
    /**
     * Creates a `lodash` object which wraps the given value to enable intuitive
     * method chaining.
     *
     * In addition to Lo-Dash methods, wrappers also have the following `Array` methods:
     * `concat`, `join`, `pop`, `push`, `reverse`, `shift`, `slice`, `sort`, `splice`,
     * and `unshift`
     *
     * Chaining is supported in custom builds as long as the `value` method is
     * implicitly or explicitly included in the build.
     *
     * The chainable wrapper functions are:
     * `after`, `assign`, `bind`, `bindAll`, `bindKey`, `chain`, `compact`,
     * `compose`, `concat`, `countBy`, `create`, `createCallback`, `curry`,
     * `debounce`, `defaults`, `defer`, `delay`, `difference`, `filter`, `flatten`,
     * `forEach`, `forEachRight`, `forIn`, `forInRight`, `forOwn`, `forOwnRight`,
     * `functions`, `groupBy`, `indexBy`, `initial`, `intersection`, `invert`,
     * `invoke`, `keys`, `map`, `max`, `memoize`, `merge`, `min`, `object`, `omit`,
     * `once`, `pairs`, `partial`, `partialRight`, `pick`, `pluck`, `pull`, `push`,
     * `range`, `reject`, `remove`, `rest`, `reverse`, `shuffle`, `slice`, `sort`,
     * `sortBy`, `splice`, `tap`, `throttle`, `times`, `toArray`, `transform`,
     * `union`, `uniq`, `unshift`, `unzip`, `values`, `where`, `without`, `wrap`,
     * and `zip`
     *
     * The non-chainable wrapper functions are:
     * `clone`, `cloneDeep`, `contains`, `escape`, `every`, `find`, `findIndex`,
     * `findKey`, `findLast`, `findLastIndex`, `findLastKey`, `has`, `identity`,
     * `indexOf`, `isArguments`, `isArray`, `isBoolean`, `isDate`, `isElement`,
     * `isEmpty`, `isEqual`, `isFinite`, `isFunction`, `isNaN`, `isNull`, `isNumber`,
     * `isObject`, `isPlainObject`, `isRegExp`, `isString`, `isUndefined`, `join`,
     * `lastIndexOf`, `mixin`, `noConflict`, `parseInt`, `pop`, `random`, `reduce`,
     * `reduceRight`, `result`, `shift`, `size`, `some`, `sortedIndex`, `runInContext`,
     * `template`, `unescape`, `uniqueId`, and `value`
     *
     * The wrapper functions `first` and `last` return wrapped values when `n` is
     * provided, otherwise they return unwrapped values.
     *
     * Explicit chaining can be enabled by using the `_.chain` method.
     *
     * @name _
     * @constructor
     * @category Chaining
     * @param {*} value The value to wrap in a `lodash` instance.
     * @returns {Object} Returns a `lodash` instance.
     * @example
     *
     * var wrapped = _([1, 2, 3]);
     *
     * // returns an unwrapped value
     * wrapped.reduce(function(sum, num) {
     *   return sum + num;
     * });
     * // => 6
     *
     * // returns a wrapped value
     * var squares = wrapped.map(function(num) {
     *   return num * num;
     * });
     *
     * _.isArray(squares);
     * // => false
     *
     * _.isArray(squares.value());
     * // => true
     */
    function lodash(value) {
      // don't wrap if already wrapped, even if wrapped by a different `lodash` constructor
      return value && typeof value == 'object' && !isArray(value) && hasOwnProperty.call(value, '__wrapped__') ? value : new lodashWrapper(value);
    }
    /**
     * A fast path for creating `lodash` wrapper objects.
     *
     * @private
     * @param {*} value The value to wrap in a `lodash` instance.
     * @param {boolean} chainAll A flag to enable chaining for all methods
     * @returns {Object} Returns a `lodash` instance.
     */
    function lodashWrapper(value, chainAll) {
      this.__chain__ = !!chainAll;
      this.__wrapped__ = value;
    }
    // ensure `new lodashWrapper` is an instance of `lodash`
    lodashWrapper.prototype = lodash.prototype;
    /**
     * An object used to flag environments features.
     *
     * @static
     * @memberOf _
     * @type Object
     */
    var support = lodash.support = {};
    /**
     * Detect if functions can be decompiled by `Function#toString`
     * (all but PS3 and older Opera mobile browsers & avoided in Windows 8 apps).
     *
     * @memberOf _.support
     * @type boolean
     */
    support.funcDecomp = !isNative(context.WinRTError) && reThis.test(runInContext);
    /**
     * Detect if `Function#name` is supported (all but IE).
     *
     * @memberOf _.support
     * @type boolean
     */
    support.funcNames = typeof Function.name == 'string';
    /**
     * By default, the template delimiters used by Lo-Dash are similar to those in
     * embedded Ruby (ERB). Change the following template settings to use alternative
     * delimiters.
     *
     * @static
     * @memberOf _
     * @type Object
     */
    lodash.templateSettings = {
      'escape': /<%-([\s\S]+?)%>/g,
      'evaluate': /<%([\s\S]+?)%>/g,
      'interpolate': reInterpolate,
      'variable': '',
      'imports': { '_': lodash }
    };
    /*--------------------------------------------------------------------------*/
    /**
     * The base implementation of `_.bind` that creates the bound function and
     * sets its meta data.
     *
     * @private
     * @param {Array} bindData The bind data array.
     * @returns {Function} Returns the new bound function.
     */
    function baseBind(bindData) {
      var func = bindData[0], partialArgs = bindData[2], thisArg = bindData[4];
      function bound() {
        // `Function#bind` spec
        // http://es5.github.io/#x15.3.4.5
        if (partialArgs) {
          // avoid `arguments` object deoptimizations by using `slice` instead
          // of `Array.prototype.slice.call` and not assigning `arguments` to a
          // variable as a ternary expression
          var args = slice(partialArgs);
          push.apply(args, arguments);
        }
        // mimic the constructor's `return` behavior
        // http://es5.github.io/#x13.2.2
        if (this instanceof bound) {
          // ensure `new bound` is an instance of `func`
          var thisBinding = baseCreate(func.prototype), result = func.apply(thisBinding, args || arguments);
          return isObject(result) ? result : thisBinding;
        }
        return func.apply(thisArg, args || arguments);
      }
      setBindData(bound, bindData);
      return bound;
    }
    /**
     * The base implementation of `_.clone` without argument juggling or support
     * for `thisArg` binding.
     *
     * @private
     * @param {*} value The value to clone.
     * @param {boolean} [isDeep=false] Specify a deep clone.
     * @param {Function} [callback] The function to customize cloning values.
     * @param {Array} [stackA=[]] Tracks traversed source objects.
     * @param {Array} [stackB=[]] Associates clones with source counterparts.
     * @returns {*} Returns the cloned value.
     */
    function baseClone(value, isDeep, callback, stackA, stackB) {
      if (callback) {
        var result = callback(value);
        if (typeof result != 'undefined') {
          return result;
        }
      }
      // inspect [[Class]]
      var isObj = isObject(value);
      if (isObj) {
        var className = toString.call(value);
        if (!cloneableClasses[className]) {
          return value;
        }
        var ctor = ctorByClass[className];
        switch (className) {
        case boolClass:
        case dateClass:
          return new ctor(+value);
        case numberClass:
        case stringClass:
          return new ctor(value);
        case regexpClass:
          result = ctor(value.source, reFlags.exec(value));
          result.lastIndex = value.lastIndex;
          return result;
        }
      } else {
        return value;
      }
      var isArr = isArray(value);
      if (isDeep) {
        // check for circular references and return corresponding clone
        var initedStack = !stackA;
        stackA || (stackA = getArray());
        stackB || (stackB = getArray());
        var length = stackA.length;
        while (length--) {
          if (stackA[length] == value) {
            return stackB[length];
          }
        }
        result = isArr ? ctor(value.length) : {};
      } else {
        result = isArr ? slice(value) : assign({}, value);
      }
      // add array properties assigned by `RegExp#exec`
      if (isArr) {
        if (hasOwnProperty.call(value, 'index')) {
          result.index = value.index;
        }
        if (hasOwnProperty.call(value, 'input')) {
          result.input = value.input;
        }
      }
      // exit for shallow clone
      if (!isDeep) {
        return result;
      }
      // add the source value to the stack of traversed objects
      // and associate it with its clone
      stackA.push(value);
      stackB.push(result);
      // recursively populate clone (susceptible to call stack limits)
      (isArr ? forEach : forOwn)(value, function (objValue, key) {
        result[key] = baseClone(objValue, isDeep, callback, stackA, stackB);
      });
      if (initedStack) {
        releaseArray(stackA);
        releaseArray(stackB);
      }
      return result;
    }
    /**
     * The base implementation of `_.create` without support for assigning
     * properties to the created object.
     *
     * @private
     * @param {Object} prototype The object to inherit from.
     * @returns {Object} Returns the new object.
     */
    function baseCreate(prototype, properties) {
      return isObject(prototype) ? nativeCreate(prototype) : {};
    }
    // fallback for browsers without `Object.create`
    if (!nativeCreate) {
      baseCreate = function () {
        function Object() {
        }
        return function (prototype) {
          if (isObject(prototype)) {
            Object.prototype = prototype;
            var result = new Object();
            Object.prototype = null;
          }
          return result || context.Object();
        };
      }();
    }
    /**
     * The base implementation of `_.createCallback` without support for creating
     * "_.pluck" or "_.where" style callbacks.
     *
     * @private
     * @param {*} [func=identity] The value to convert to a callback.
     * @param {*} [thisArg] The `this` binding of the created callback.
     * @param {number} [argCount] The number of arguments the callback accepts.
     * @returns {Function} Returns a callback function.
     */
    function baseCreateCallback(func, thisArg, argCount) {
      if (typeof func != 'function') {
        return identity;
      }
      // exit early for no `thisArg` or already bound by `Function#bind`
      if (typeof thisArg == 'undefined' || !('prototype' in func)) {
        return func;
      }
      var bindData = func.__bindData__;
      if (typeof bindData == 'undefined') {
        if (support.funcNames) {
          bindData = !func.name;
        }
        bindData = bindData || !support.funcDecomp;
        if (!bindData) {
          var source = fnToString.call(func);
          if (!support.funcNames) {
            bindData = !reFuncName.test(source);
          }
          if (!bindData) {
            // checks if `func` references the `this` keyword and stores the result
            bindData = reThis.test(source);
            setBindData(func, bindData);
          }
        }
      }
      // exit early if there are no `this` references or `func` is bound
      if (bindData === false || bindData !== true && bindData[1] & 1) {
        return func;
      }
      switch (argCount) {
      case 1:
        return function (value) {
          return func.call(thisArg, value);
        };
      case 2:
        return function (a, b) {
          return func.call(thisArg, a, b);
        };
      case 3:
        return function (value, index, collection) {
          return func.call(thisArg, value, index, collection);
        };
      case 4:
        return function (accumulator, value, index, collection) {
          return func.call(thisArg, accumulator, value, index, collection);
        };
      }
      return bind(func, thisArg);
    }
    /**
     * The base implementation of `createWrapper` that creates the wrapper and
     * sets its meta data.
     *
     * @private
     * @param {Array} bindData The bind data array.
     * @returns {Function} Returns the new function.
     */
    function baseCreateWrapper(bindData) {
      var func = bindData[0], bitmask = bindData[1], partialArgs = bindData[2], partialRightArgs = bindData[3], thisArg = bindData[4], arity = bindData[5];
      var isBind = bitmask & 1, isBindKey = bitmask & 2, isCurry = bitmask & 4, isCurryBound = bitmask & 8, key = func;
      function bound() {
        var thisBinding = isBind ? thisArg : this;
        if (partialArgs) {
          var args = slice(partialArgs);
          push.apply(args, arguments);
        }
        if (partialRightArgs || isCurry) {
          args || (args = slice(arguments));
          if (partialRightArgs) {
            push.apply(args, partialRightArgs);
          }
          if (isCurry && args.length < arity) {
            bitmask |= 16 & ~32;
            return baseCreateWrapper([
              func,
              isCurryBound ? bitmask : bitmask & ~3,
              args,
              null,
              thisArg,
              arity
            ]);
          }
        }
        args || (args = arguments);
        if (isBindKey) {
          func = thisBinding[key];
        }
        if (this instanceof bound) {
          thisBinding = baseCreate(func.prototype);
          var result = func.apply(thisBinding, args);
          return isObject(result) ? result : thisBinding;
        }
        return func.apply(thisBinding, args);
      }
      setBindData(bound, bindData);
      return bound;
    }
    /**
     * The base implementation of `_.difference` that accepts a single array
     * of values to exclude.
     *
     * @private
     * @param {Array} array The array to process.
     * @param {Array} [values] The array of values to exclude.
     * @returns {Array} Returns a new array of filtered values.
     */
    function baseDifference(array, values) {
      var index = -1, indexOf = getIndexOf(), length = array ? array.length : 0, isLarge = length >= largeArraySize && indexOf === baseIndexOf, result = [];
      if (isLarge) {
        var cache = createCache(values);
        if (cache) {
          indexOf = cacheIndexOf;
          values = cache;
        } else {
          isLarge = false;
        }
      }
      while (++index < length) {
        var value = array[index];
        if (indexOf(values, value) < 0) {
          result.push(value);
        }
      }
      if (isLarge) {
        releaseObject(values);
      }
      return result;
    }
    /**
     * The base implementation of `_.flatten` without support for callback
     * shorthands or `thisArg` binding.
     *
     * @private
     * @param {Array} array The array to flatten.
     * @param {boolean} [isShallow=false] A flag to restrict flattening to a single level.
     * @param {boolean} [isStrict=false] A flag to restrict flattening to arrays and `arguments` objects.
     * @param {number} [fromIndex=0] The index to start from.
     * @returns {Array} Returns a new flattened array.
     */
    function baseFlatten(array, isShallow, isStrict, fromIndex) {
      var index = (fromIndex || 0) - 1, length = array ? array.length : 0, result = [];
      while (++index < length) {
        var value = array[index];
        if (value && typeof value == 'object' && typeof value.length == 'number' && (isArray(value) || isArguments(value))) {
          // recursively flatten arrays (susceptible to call stack limits)
          if (!isShallow) {
            value = baseFlatten(value, isShallow, isStrict);
          }
          var valIndex = -1, valLength = value.length, resIndex = result.length;
          result.length += valLength;
          while (++valIndex < valLength) {
            result[resIndex++] = value[valIndex];
          }
        } else if (!isStrict) {
          result.push(value);
        }
      }
      return result;
    }
    /**
     * The base implementation of `_.isEqual`, without support for `thisArg` binding,
     * that allows partial "_.where" style comparisons.
     *
     * @private
     * @param {*} a The value to compare.
     * @param {*} b The other value to compare.
     * @param {Function} [callback] The function to customize comparing values.
     * @param {Function} [isWhere=false] A flag to indicate performing partial comparisons.
     * @param {Array} [stackA=[]] Tracks traversed `a` objects.
     * @param {Array} [stackB=[]] Tracks traversed `b` objects.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     */
    function baseIsEqual(a, b, callback, isWhere, stackA, stackB) {
      // used to indicate that when comparing objects, `a` has at least the properties of `b`
      if (callback) {
        var result = callback(a, b);
        if (typeof result != 'undefined') {
          return !!result;
        }
      }
      // exit early for identical values
      if (a === b) {
        // treat `+0` vs. `-0` as not equal
        return a !== 0 || 1 / a == 1 / b;
      }
      var type = typeof a, otherType = typeof b;
      // exit early for unlike primitive values
      if (a === a && !(a && objectTypes[type]) && !(b && objectTypes[otherType])) {
        return false;
      }
      // exit early for `null` and `undefined` avoiding ES3's Function#call behavior
      // http://es5.github.io/#x15.3.4.4
      if (a == null || b == null) {
        return a === b;
      }
      // compare [[Class]] names
      var className = toString.call(a), otherClass = toString.call(b);
      if (className == argsClass) {
        className = objectClass;
      }
      if (otherClass == argsClass) {
        otherClass = objectClass;
      }
      if (className != otherClass) {
        return false;
      }
      switch (className) {
      case boolClass:
      case dateClass:
        // coerce dates and booleans to numbers, dates to milliseconds and booleans
        // to `1` or `0` treating invalid dates coerced to `NaN` as not equal
        return +a == +b;
      case numberClass:
        // treat `NaN` vs. `NaN` as equal
        return a != +a ? b != +b : a == 0 ? 1 / a == 1 / b : a == +b;
      case regexpClass:
      case stringClass:
        // coerce regexes to strings (http://es5.github.io/#x15.10.6.4)
        // treat string primitives and their corresponding object instances as equal
        return a == String(b);
      }
      var isArr = className == arrayClass;
      if (!isArr) {
        // unwrap any `lodash` wrapped values
        var aWrapped = hasOwnProperty.call(a, '__wrapped__'), bWrapped = hasOwnProperty.call(b, '__wrapped__');
        if (aWrapped || bWrapped) {
          return baseIsEqual(aWrapped ? a.__wrapped__ : a, bWrapped ? b.__wrapped__ : b, callback, isWhere, stackA, stackB);
        }
        // exit for functions and DOM nodes
        if (className != objectClass) {
          return false;
        }
        // in older versions of Opera, `arguments` objects have `Array` constructors
        var ctorA = a.constructor, ctorB = b.constructor;
        // non `Object` object instances with different constructors are not equal
        if (ctorA != ctorB && !(isFunction(ctorA) && ctorA instanceof ctorA && isFunction(ctorB) && ctorB instanceof ctorB) && ('constructor' in a && 'constructor' in b)) {
          return false;
        }
      }
      // assume cyclic structures are equal
      // the algorithm for detecting cyclic structures is adapted from ES 5.1
      // section 15.12.3, abstract operation `JO` (http://es5.github.io/#x15.12.3)
      var initedStack = !stackA;
      stackA || (stackA = getArray());
      stackB || (stackB = getArray());
      var length = stackA.length;
      while (length--) {
        if (stackA[length] == a) {
          return stackB[length] == b;
        }
      }
      var size = 0;
      result = true;
      // add `a` and `b` to the stack of traversed objects
      stackA.push(a);
      stackB.push(b);
      // recursively compare objects and arrays (susceptible to call stack limits)
      if (isArr) {
        // compare lengths to determine if a deep comparison is necessary
        length = a.length;
        size = b.length;
        result = size == length;
        if (result || isWhere) {
          // deep compare the contents, ignoring non-numeric properties
          while (size--) {
            var index = length, value = b[size];
            if (isWhere) {
              while (index--) {
                if (result = baseIsEqual(a[index], value, callback, isWhere, stackA, stackB)) {
                  break;
                }
              }
            } else if (!(result = baseIsEqual(a[size], value, callback, isWhere, stackA, stackB))) {
              break;
            }
          }
        }
      } else {
        // deep compare objects using `forIn`, instead of `forOwn`, to avoid `Object.keys`
        // which, in this case, is more costly
        forIn(b, function (value, key, b) {
          if (hasOwnProperty.call(b, key)) {
            // count the number of properties.
            size++;
            // deep compare each property value.
            return result = hasOwnProperty.call(a, key) && baseIsEqual(a[key], value, callback, isWhere, stackA, stackB);
          }
        });
        if (result && !isWhere) {
          // ensure both objects have the same number of properties
          forIn(a, function (value, key, a) {
            if (hasOwnProperty.call(a, key)) {
              // `size` will be `-1` if `a` has more properties than `b`
              return result = --size > -1;
            }
          });
        }
      }
      stackA.pop();
      stackB.pop();
      if (initedStack) {
        releaseArray(stackA);
        releaseArray(stackB);
      }
      return result;
    }
    /**
     * The base implementation of `_.merge` without argument juggling or support
     * for `thisArg` binding.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @param {Function} [callback] The function to customize merging properties.
     * @param {Array} [stackA=[]] Tracks traversed source objects.
     * @param {Array} [stackB=[]] Associates values with source counterparts.
     */
    function baseMerge(object, source, callback, stackA, stackB) {
      (isArray(source) ? forEach : forOwn)(source, function (source, key) {
        var found, isArr, result = source, value = object[key];
        if (source && ((isArr = isArray(source)) || isPlainObject(source))) {
          // avoid merging previously merged cyclic sources
          var stackLength = stackA.length;
          while (stackLength--) {
            if (found = stackA[stackLength] == source) {
              value = stackB[stackLength];
              break;
            }
          }
          if (!found) {
            var isShallow;
            if (callback) {
              result = callback(value, source);
              if (isShallow = typeof result != 'undefined') {
                value = result;
              }
            }
            if (!isShallow) {
              value = isArr ? isArray(value) ? value : [] : isPlainObject(value) ? value : {};
            }
            // add `source` and associated `value` to the stack of traversed objects
            stackA.push(source);
            stackB.push(value);
            // recursively merge objects and arrays (susceptible to call stack limits)
            if (!isShallow) {
              baseMerge(value, source, callback, stackA, stackB);
            }
          }
        } else {
          if (callback) {
            result = callback(value, source);
            if (typeof result == 'undefined') {
              result = source;
            }
          }
          if (typeof result != 'undefined') {
            value = result;
          }
        }
        object[key] = value;
      });
    }
    /**
     * The base implementation of `_.random` without argument juggling or support
     * for returning floating-point numbers.
     *
     * @private
     * @param {number} min The minimum possible value.
     * @param {number} max The maximum possible value.
     * @returns {number} Returns a random number.
     */
    function baseRandom(min, max) {
      return min + floor(nativeRandom() * (max - min + 1));
    }
    /**
     * The base implementation of `_.uniq` without support for callback shorthands
     * or `thisArg` binding.
     *
     * @private
     * @param {Array} array The array to process.
     * @param {boolean} [isSorted=false] A flag to indicate that `array` is sorted.
     * @param {Function} [callback] The function called per iteration.
     * @returns {Array} Returns a duplicate-value-free array.
     */
    function baseUniq(array, isSorted, callback) {
      var index = -1, indexOf = getIndexOf(), length = array ? array.length : 0, result = [];
      var isLarge = !isSorted && length >= largeArraySize && indexOf === baseIndexOf, seen = callback || isLarge ? getArray() : result;
      if (isLarge) {
        var cache = createCache(seen);
        indexOf = cacheIndexOf;
        seen = cache;
      }
      while (++index < length) {
        var value = array[index], computed = callback ? callback(value, index, array) : value;
        if (isSorted ? !index || seen[seen.length - 1] !== computed : indexOf(seen, computed) < 0) {
          if (callback || isLarge) {
            seen.push(computed);
          }
          result.push(value);
        }
      }
      if (isLarge) {
        releaseArray(seen.array);
        releaseObject(seen);
      } else if (callback) {
        releaseArray(seen);
      }
      return result;
    }
    /**
     * Creates a function that aggregates a collection, creating an object composed
     * of keys generated from the results of running each element of the collection
     * through a callback. The given `setter` function sets the keys and values
     * of the composed object.
     *
     * @private
     * @param {Function} setter The setter function.
     * @returns {Function} Returns the new aggregator function.
     */
    function createAggregator(setter) {
      return function (collection, callback, thisArg) {
        var result = {};
        callback = lodash.createCallback(callback, thisArg, 3);
        var index = -1, length = collection ? collection.length : 0;
        if (typeof length == 'number') {
          while (++index < length) {
            var value = collection[index];
            setter(result, value, callback(value, index, collection), collection);
          }
        } else {
          forOwn(collection, function (value, key, collection) {
            setter(result, value, callback(value, key, collection), collection);
          });
        }
        return result;
      };
    }
    /**
     * Creates a function that, when called, either curries or invokes `func`
     * with an optional `this` binding and partially applied arguments.
     *
     * @private
     * @param {Function|string} func The function or method name to reference.
     * @param {number} bitmask The bitmask of method flags to compose.
     *  The bitmask may be composed of the following flags:
     *  1 - `_.bind`
     *  2 - `_.bindKey`
     *  4 - `_.curry`
     *  8 - `_.curry` (bound)
     *  16 - `_.partial`
     *  32 - `_.partialRight`
     * @param {Array} [partialArgs] An array of arguments to prepend to those
     *  provided to the new function.
     * @param {Array} [partialRightArgs] An array of arguments to append to those
     *  provided to the new function.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {number} [arity] The arity of `func`.
     * @returns {Function} Returns the new function.
     */
    function createWrapper(func, bitmask, partialArgs, partialRightArgs, thisArg, arity) {
      var isBind = bitmask & 1, isBindKey = bitmask & 2, isCurry = bitmask & 4, isCurryBound = bitmask & 8, isPartial = bitmask & 16, isPartialRight = bitmask & 32;
      if (!isBindKey && !isFunction(func)) {
        throw new TypeError();
      }
      if (isPartial && !partialArgs.length) {
        bitmask &= ~16;
        isPartial = partialArgs = false;
      }
      if (isPartialRight && !partialRightArgs.length) {
        bitmask &= ~32;
        isPartialRight = partialRightArgs = false;
      }
      var bindData = func && func.__bindData__;
      if (bindData && bindData !== true) {
        // clone `bindData`
        bindData = slice(bindData);
        if (bindData[2]) {
          bindData[2] = slice(bindData[2]);
        }
        if (bindData[3]) {
          bindData[3] = slice(bindData[3]);
        }
        // set `thisBinding` is not previously bound
        if (isBind && !(bindData[1] & 1)) {
          bindData[4] = thisArg;
        }
        // set if previously bound but not currently (subsequent curried functions)
        if (!isBind && bindData[1] & 1) {
          bitmask |= 8;
        }
        // set curried arity if not yet set
        if (isCurry && !(bindData[1] & 4)) {
          bindData[5] = arity;
        }
        // append partial left arguments
        if (isPartial) {
          push.apply(bindData[2] || (bindData[2] = []), partialArgs);
        }
        // append partial right arguments
        if (isPartialRight) {
          unshift.apply(bindData[3] || (bindData[3] = []), partialRightArgs);
        }
        // merge flags
        bindData[1] |= bitmask;
        return createWrapper.apply(null, bindData);
      }
      // fast path for `_.bind`
      var creater = bitmask == 1 || bitmask === 17 ? baseBind : baseCreateWrapper;
      return creater([
        func,
        bitmask,
        partialArgs,
        partialRightArgs,
        thisArg,
        arity
      ]);
    }
    /**
     * Used by `escape` to convert characters to HTML entities.
     *
     * @private
     * @param {string} match The matched character to escape.
     * @returns {string} Returns the escaped character.
     */
    function escapeHtmlChar(match) {
      return htmlEscapes[match];
    }
    /**
     * Gets the appropriate "indexOf" function. If the `_.indexOf` method is
     * customized, this method returns the custom method, otherwise it returns
     * the `baseIndexOf` function.
     *
     * @private
     * @returns {Function} Returns the "indexOf" function.
     */
    function getIndexOf() {
      var result = (result = lodash.indexOf) === indexOf ? baseIndexOf : result;
      return result;
    }
    /**
     * Checks if `value` is a native function.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a native function, else `false`.
     */
    function isNative(value) {
      return typeof value == 'function' && reNative.test(value);
    }
    /**
     * Sets `this` binding data on a given function.
     *
     * @private
     * @param {Function} func The function to set data on.
     * @param {Array} value The data array to set.
     */
    var setBindData = !defineProperty ? noop : function (func, value) {
        descriptor.value = value;
        defineProperty(func, '__bindData__', descriptor);
      };
    /**
     * A fallback implementation of `isPlainObject` which checks if a given value
     * is an object created by the `Object` constructor, assuming objects created
     * by the `Object` constructor have no inherited enumerable properties and that
     * there are no `Object.prototype` extensions.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
     */
    function shimIsPlainObject(value) {
      var ctor, result;
      // avoid non Object objects, `arguments` objects, and DOM elements
      if (!(value && toString.call(value) == objectClass) || (ctor = value.constructor, isFunction(ctor) && !(ctor instanceof ctor))) {
        return false;
      }
      // In most environments an object's own properties are iterated before
      // its inherited properties. If the last iterated property is an object's
      // own property then there are no inherited enumerable properties.
      forIn(value, function (value, key) {
        result = key;
      });
      return typeof result == 'undefined' || hasOwnProperty.call(value, result);
    }
    /**
     * Used by `unescape` to convert HTML entities to characters.
     *
     * @private
     * @param {string} match The matched character to unescape.
     * @returns {string} Returns the unescaped character.
     */
    function unescapeHtmlChar(match) {
      return htmlUnescapes[match];
    }
    /*--------------------------------------------------------------------------*/
    /**
     * Checks if `value` is an `arguments` object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is an `arguments` object, else `false`.
     * @example
     *
     * (function() { return _.isArguments(arguments); })(1, 2, 3);
     * // => true
     *
     * _.isArguments([1, 2, 3]);
     * // => false
     */
    function isArguments(value) {
      return value && typeof value == 'object' && typeof value.length == 'number' && toString.call(value) == argsClass || false;
    }
    /**
     * Checks if `value` is an array.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is an array, else `false`.
     * @example
     *
     * (function() { return _.isArray(arguments); })();
     * // => false
     *
     * _.isArray([1, 2, 3]);
     * // => true
     */
    var isArray = nativeIsArray || function (value) {
        return value && typeof value == 'object' && typeof value.length == 'number' && toString.call(value) == arrayClass || false;
      };
    /**
     * A fallback implementation of `Object.keys` which produces an array of the
     * given object's own enumerable property names.
     *
     * @private
     * @type Function
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property names.
     */
    var shimKeys = function (object) {
      var index, iterable = object, result = [];
      if (!iterable)
        return result;
      if (!objectTypes[typeof object])
        return result;
      for (index in iterable) {
        if (hasOwnProperty.call(iterable, index)) {
          result.push(index);
        }
      }
      return result;
    };
    /**
     * Creates an array composed of the own enumerable property names of an object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property names.
     * @example
     *
     * _.keys({ 'one': 1, 'two': 2, 'three': 3 });
     * // => ['one', 'two', 'three'] (property order is not guaranteed across environments)
     */
    var keys = !nativeKeys ? shimKeys : function (object) {
        if (!isObject(object)) {
          return [];
        }
        return nativeKeys(object);
      };
    /**
     * Used to convert characters to HTML entities:
     *
     * Though the `>` character is escaped for symmetry, characters like `>` and `/`
     * don't require escaping in HTML and have no special meaning unless they're part
     * of a tag or an unquoted attribute value.
     * http://mathiasbynens.be/notes/ambiguous-ampersands (under "semi-related fun fact")
     */
    var htmlEscapes = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        '\'': '&#39;'
      };
    /** Used to convert HTML entities to characters */
    var htmlUnescapes = invert(htmlEscapes);
    /** Used to match HTML entities and HTML characters */
    var reEscapedHtml = RegExp('(' + keys(htmlUnescapes).join('|') + ')', 'g'), reUnescapedHtml = RegExp('[' + keys(htmlEscapes).join('') + ']', 'g');
    /*--------------------------------------------------------------------------*/
    /**
     * Assigns own enumerable properties of source object(s) to the destination
     * object. Subsequent sources will overwrite property assignments of previous
     * sources. If a callback is provided it will be executed to produce the
     * assigned values. The callback is bound to `thisArg` and invoked with two
     * arguments; (objectValue, sourceValue).
     *
     * @static
     * @memberOf _
     * @type Function
     * @alias extend
     * @category Objects
     * @param {Object} object The destination object.
     * @param {...Object} [source] The source objects.
     * @param {Function} [callback] The function to customize assigning values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the destination object.
     * @example
     *
     * _.assign({ 'name': 'fred' }, { 'employer': 'slate' });
     * // => { 'name': 'fred', 'employer': 'slate' }
     *
     * var defaults = _.partialRight(_.assign, function(a, b) {
     *   return typeof a == 'undefined' ? b : a;
     * });
     *
     * var object = { 'name': 'barney' };
     * defaults(object, { 'name': 'fred', 'employer': 'slate' });
     * // => { 'name': 'barney', 'employer': 'slate' }
     */
    var assign = function (object, source, guard) {
      var index, iterable = object, result = iterable;
      if (!iterable)
        return result;
      var args = arguments, argsIndex = 0, argsLength = typeof guard == 'number' ? 2 : args.length;
      if (argsLength > 3 && typeof args[argsLength - 2] == 'function') {
        var callback = baseCreateCallback(args[--argsLength - 1], args[argsLength--], 2);
      } else if (argsLength > 2 && typeof args[argsLength - 1] == 'function') {
        callback = args[--argsLength];
      }
      while (++argsIndex < argsLength) {
        iterable = args[argsIndex];
        if (iterable && objectTypes[typeof iterable]) {
          var ownIndex = -1, ownProps = objectTypes[typeof iterable] && keys(iterable), length = ownProps ? ownProps.length : 0;
          while (++ownIndex < length) {
            index = ownProps[ownIndex];
            result[index] = callback ? callback(result[index], iterable[index]) : iterable[index];
          }
        }
      }
      return result;
    };
    /**
     * Creates a clone of `value`. If `isDeep` is `true` nested objects will also
     * be cloned, otherwise they will be assigned by reference. If a callback
     * is provided it will be executed to produce the cloned values. If the
     * callback returns `undefined` cloning will be handled by the method instead.
     * The callback is bound to `thisArg` and invoked with one argument; (value).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to clone.
     * @param {boolean} [isDeep=false] Specify a deep clone.
     * @param {Function} [callback] The function to customize cloning values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the cloned value.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * var shallow = _.clone(characters);
     * shallow[0] === characters[0];
     * // => true
     *
     * var deep = _.clone(characters, true);
     * deep[0] === characters[0];
     * // => false
     *
     * _.mixin({
     *   'clone': _.partialRight(_.clone, function(value) {
     *     return _.isElement(value) ? value.cloneNode(false) : undefined;
     *   })
     * });
     *
     * var clone = _.clone(document.body);
     * clone.childNodes.length;
     * // => 0
     */
    function clone(value, isDeep, callback, thisArg) {
      // allows working with "Collections" methods without using their `index`
      // and `collection` arguments for `isDeep` and `callback`
      if (typeof isDeep != 'boolean' && isDeep != null) {
        thisArg = callback;
        callback = isDeep;
        isDeep = false;
      }
      return baseClone(value, isDeep, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 1));
    }
    /**
     * Creates a deep clone of `value`. If a callback is provided it will be
     * executed to produce the cloned values. If the callback returns `undefined`
     * cloning will be handled by the method instead. The callback is bound to
     * `thisArg` and invoked with one argument; (value).
     *
     * Note: This method is loosely based on the structured clone algorithm. Functions
     * and DOM nodes are **not** cloned. The enumerable properties of `arguments` objects and
     * objects created by constructors other than `Object` are cloned to plain `Object` objects.
     * See http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to deep clone.
     * @param {Function} [callback] The function to customize cloning values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the deep cloned value.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * var deep = _.cloneDeep(characters);
     * deep[0] === characters[0];
     * // => false
     *
     * var view = {
     *   'label': 'docs',
     *   'node': element
     * };
     *
     * var clone = _.cloneDeep(view, function(value) {
     *   return _.isElement(value) ? value.cloneNode(true) : undefined;
     * });
     *
     * clone.node == view.node;
     * // => false
     */
    function cloneDeep(value, callback, thisArg) {
      return baseClone(value, true, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 1));
    }
    /**
     * Creates an object that inherits from the given `prototype` object. If a
     * `properties` object is provided its own enumerable properties are assigned
     * to the created object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} prototype The object to inherit from.
     * @param {Object} [properties] The properties to assign to the object.
     * @returns {Object} Returns the new object.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * function Circle() {
     *   Shape.call(this);
     * }
     *
     * Circle.prototype = _.create(Shape.prototype, { 'constructor': Circle });
     *
     * var circle = new Circle;
     * circle instanceof Circle;
     * // => true
     *
     * circle instanceof Shape;
     * // => true
     */
    function create(prototype, properties) {
      var result = baseCreate(prototype);
      return properties ? assign(result, properties) : result;
    }
    /**
     * Assigns own enumerable properties of source object(s) to the destination
     * object for all destination properties that resolve to `undefined`. Once a
     * property is set, additional defaults of the same property will be ignored.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {Object} object The destination object.
     * @param {...Object} [source] The source objects.
     * @param- {Object} [guard] Allows working with `_.reduce` without using its
     *  `key` and `object` arguments as sources.
     * @returns {Object} Returns the destination object.
     * @example
     *
     * var object = { 'name': 'barney' };
     * _.defaults(object, { 'name': 'fred', 'employer': 'slate' });
     * // => { 'name': 'barney', 'employer': 'slate' }
     */
    var defaults = function (object, source, guard) {
      var index, iterable = object, result = iterable;
      if (!iterable)
        return result;
      var args = arguments, argsIndex = 0, argsLength = typeof guard == 'number' ? 2 : args.length;
      while (++argsIndex < argsLength) {
        iterable = args[argsIndex];
        if (iterable && objectTypes[typeof iterable]) {
          var ownIndex = -1, ownProps = objectTypes[typeof iterable] && keys(iterable), length = ownProps ? ownProps.length : 0;
          while (++ownIndex < length) {
            index = ownProps[ownIndex];
            if (typeof result[index] == 'undefined')
              result[index] = iterable[index];
          }
        }
      }
      return result;
    };
    /**
     * This method is like `_.findIndex` except that it returns the key of the
     * first element that passes the callback check, instead of the element itself.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to search.
     * @param {Function|Object|string} [callback=identity] The function called per
     *  iteration. If a property name or object is provided it will be used to
     *  create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {string|undefined} Returns the key of the found element, else `undefined`.
     * @example
     *
     * var characters = {
     *   'barney': {  'age': 36, 'blocked': false },
     *   'fred': {    'age': 40, 'blocked': true },
     *   'pebbles': { 'age': 1,  'blocked': false }
     * };
     *
     * _.findKey(characters, function(chr) {
     *   return chr.age < 40;
     * });
     * // => 'barney' (property order is not guaranteed across environments)
     *
     * // using "_.where" callback shorthand
     * _.findKey(characters, { 'age': 1 });
     * // => 'pebbles'
     *
     * // using "_.pluck" callback shorthand
     * _.findKey(characters, 'blocked');
     * // => 'fred'
     */
    function findKey(object, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);
      forOwn(object, function (value, key, object) {
        if (callback(value, key, object)) {
          result = key;
          return false;
        }
      });
      return result;
    }
    /**
     * This method is like `_.findKey` except that it iterates over elements
     * of a `collection` in the opposite order.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to search.
     * @param {Function|Object|string} [callback=identity] The function called per
     *  iteration. If a property name or object is provided it will be used to
     *  create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {string|undefined} Returns the key of the found element, else `undefined`.
     * @example
     *
     * var characters = {
     *   'barney': {  'age': 36, 'blocked': true },
     *   'fred': {    'age': 40, 'blocked': false },
     *   'pebbles': { 'age': 1,  'blocked': true }
     * };
     *
     * _.findLastKey(characters, function(chr) {
     *   return chr.age < 40;
     * });
     * // => returns `pebbles`, assuming `_.findKey` returns `barney`
     *
     * // using "_.where" callback shorthand
     * _.findLastKey(characters, { 'age': 40 });
     * // => 'fred'
     *
     * // using "_.pluck" callback shorthand
     * _.findLastKey(characters, 'blocked');
     * // => 'pebbles'
     */
    function findLastKey(object, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);
      forOwnRight(object, function (value, key, object) {
        if (callback(value, key, object)) {
          result = key;
          return false;
        }
      });
      return result;
    }
    /**
     * Iterates over own and inherited enumerable properties of an object,
     * executing the callback for each property. The callback is bound to `thisArg`
     * and invoked with three arguments; (value, key, object). Callbacks may exit
     * iteration early by explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * Shape.prototype.move = function(x, y) {
     *   this.x += x;
     *   this.y += y;
     * };
     *
     * _.forIn(new Shape, function(value, key) {
     *   console.log(key);
     * });
     * // => logs 'x', 'y', and 'move' (property order is not guaranteed across environments)
     */
    var forIn = function (collection, callback, thisArg) {
      var index, iterable = collection, result = iterable;
      if (!iterable)
        return result;
      if (!objectTypes[typeof iterable])
        return result;
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
      for (index in iterable) {
        if (callback(iterable[index], index, collection) === false)
          return result;
      }
      return result;
    };
    /**
     * This method is like `_.forIn` except that it iterates over elements
     * of a `collection` in the opposite order.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * Shape.prototype.move = function(x, y) {
     *   this.x += x;
     *   this.y += y;
     * };
     *
     * _.forInRight(new Shape, function(value, key) {
     *   console.log(key);
     * });
     * // => logs 'move', 'y', and 'x' assuming `_.forIn ` logs 'x', 'y', and 'move'
     */
    function forInRight(object, callback, thisArg) {
      var pairs = [];
      forIn(object, function (value, key) {
        pairs.push(key, value);
      });
      var length = pairs.length;
      callback = baseCreateCallback(callback, thisArg, 3);
      while (length--) {
        if (callback(pairs[length--], pairs[length], object) === false) {
          break;
        }
      }
      return object;
    }
    /**
     * Iterates over own enumerable properties of an object, executing the callback
     * for each property. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, key, object). Callbacks may exit iteration early by
     * explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * _.forOwn({ '0': 'zero', '1': 'one', 'length': 2 }, function(num, key) {
     *   console.log(key);
     * });
     * // => logs '0', '1', and 'length' (property order is not guaranteed across environments)
     */
    var forOwn = function (collection, callback, thisArg) {
      var index, iterable = collection, result = iterable;
      if (!iterable)
        return result;
      if (!objectTypes[typeof iterable])
        return result;
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
      var ownIndex = -1, ownProps = objectTypes[typeof iterable] && keys(iterable), length = ownProps ? ownProps.length : 0;
      while (++ownIndex < length) {
        index = ownProps[ownIndex];
        if (callback(iterable[index], index, collection) === false)
          return result;
      }
      return result;
    };
    /**
     * This method is like `_.forOwn` except that it iterates over elements
     * of a `collection` in the opposite order.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * _.forOwnRight({ '0': 'zero', '1': 'one', 'length': 2 }, function(num, key) {
     *   console.log(key);
     * });
     * // => logs 'length', '1', and '0' assuming `_.forOwn` logs '0', '1', and 'length'
     */
    function forOwnRight(object, callback, thisArg) {
      var props = keys(object), length = props.length;
      callback = baseCreateCallback(callback, thisArg, 3);
      while (length--) {
        var key = props[length];
        if (callback(object[key], key, object) === false) {
          break;
        }
      }
      return object;
    }
    /**
     * Creates a sorted array of property names of all enumerable properties,
     * own and inherited, of `object` that have function values.
     *
     * @static
     * @memberOf _
     * @alias methods
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property names that have function values.
     * @example
     *
     * _.functions(_);
     * // => ['all', 'any', 'bind', 'bindAll', 'clone', 'compact', 'compose', ...]
     */
    function functions(object) {
      var result = [];
      forIn(object, function (value, key) {
        if (isFunction(value)) {
          result.push(key);
        }
      });
      return result.sort();
    }
    /**
     * Checks if the specified property name exists as a direct property of `object`,
     * instead of an inherited property.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @param {string} key The name of the property to check.
     * @returns {boolean} Returns `true` if key is a direct property, else `false`.
     * @example
     *
     * _.has({ 'a': 1, 'b': 2, 'c': 3 }, 'b');
     * // => true
     */
    function has(object, key) {
      return object ? hasOwnProperty.call(object, key) : false;
    }
    /**
     * Creates an object composed of the inverted keys and values of the given object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to invert.
     * @returns {Object} Returns the created inverted object.
     * @example
     *
     * _.invert({ 'first': 'fred', 'second': 'barney' });
     * // => { 'fred': 'first', 'barney': 'second' }
     */
    function invert(object) {
      var index = -1, props = keys(object), length = props.length, result = {};
      while (++index < length) {
        var key = props[index];
        result[object[key]] = key;
      }
      return result;
    }
    /**
     * Checks if `value` is a boolean value.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a boolean value, else `false`.
     * @example
     *
     * _.isBoolean(null);
     * // => false
     */
    function isBoolean(value) {
      return value === true || value === false || value && typeof value == 'object' && toString.call(value) == boolClass || false;
    }
    /**
     * Checks if `value` is a date.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a date, else `false`.
     * @example
     *
     * _.isDate(new Date);
     * // => true
     */
    function isDate(value) {
      return value && typeof value == 'object' && toString.call(value) == dateClass || false;
    }
    /**
     * Checks if `value` is a DOM element.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a DOM element, else `false`.
     * @example
     *
     * _.isElement(document.body);
     * // => true
     */
    function isElement(value) {
      return value && value.nodeType === 1 || false;
    }
    /**
     * Checks if `value` is empty. Arrays, strings, or `arguments` objects with a
     * length of `0` and objects with no own enumerable properties are considered
     * "empty".
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Array|Object|string} value The value to inspect.
     * @returns {boolean} Returns `true` if the `value` is empty, else `false`.
     * @example
     *
     * _.isEmpty([1, 2, 3]);
     * // => false
     *
     * _.isEmpty({});
     * // => true
     *
     * _.isEmpty('');
     * // => true
     */
    function isEmpty(value) {
      var result = true;
      if (!value) {
        return result;
      }
      var className = toString.call(value), length = value.length;
      if (className == arrayClass || className == stringClass || className == argsClass || className == objectClass && typeof length == 'number' && isFunction(value.splice)) {
        return !length;
      }
      forOwn(value, function () {
        return result = false;
      });
      return result;
    }
    /**
     * Performs a deep comparison between two values to determine if they are
     * equivalent to each other. If a callback is provided it will be executed
     * to compare values. If the callback returns `undefined` comparisons will
     * be handled by the method instead. The callback is bound to `thisArg` and
     * invoked with two arguments; (a, b).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} a The value to compare.
     * @param {*} b The other value to compare.
     * @param {Function} [callback] The function to customize comparing values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     * @example
     *
     * var object = { 'name': 'fred' };
     * var copy = { 'name': 'fred' };
     *
     * object == copy;
     * // => false
     *
     * _.isEqual(object, copy);
     * // => true
     *
     * var words = ['hello', 'goodbye'];
     * var otherWords = ['hi', 'goodbye'];
     *
     * _.isEqual(words, otherWords, function(a, b) {
     *   var reGreet = /^(?:hello|hi)$/i,
     *       aGreet = _.isString(a) && reGreet.test(a),
     *       bGreet = _.isString(b) && reGreet.test(b);
     *
     *   return (aGreet || bGreet) ? (aGreet == bGreet) : undefined;
     * });
     * // => true
     */
    function isEqual(a, b, callback, thisArg) {
      return baseIsEqual(a, b, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 2));
    }
    /**
     * Checks if `value` is, or can be coerced to, a finite number.
     *
     * Note: This is not the same as native `isFinite` which will return true for
     * booleans and empty strings. See http://es5.github.io/#x15.1.2.5.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is finite, else `false`.
     * @example
     *
     * _.isFinite(-101);
     * // => true
     *
     * _.isFinite('10');
     * // => true
     *
     * _.isFinite(true);
     * // => false
     *
     * _.isFinite('');
     * // => false
     *
     * _.isFinite(Infinity);
     * // => false
     */
    function isFinite(value) {
      return nativeIsFinite(value) && !nativeIsNaN(parseFloat(value));
    }
    /**
     * Checks if `value` is a function.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a function, else `false`.
     * @example
     *
     * _.isFunction(_);
     * // => true
     */
    function isFunction(value) {
      return typeof value == 'function';
    }
    /**
     * Checks if `value` is the language type of Object.
     * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(1);
     * // => false
     */
    function isObject(value) {
      // check if the value is the ECMAScript language type of Object
      // http://es5.github.io/#x8
      // and avoid a V8 bug
      // http://code.google.com/p/v8/issues/detail?id=2291
      return !!(value && objectTypes[typeof value]);
    }
    /**
     * Checks if `value` is `NaN`.
     *
     * Note: This is not the same as native `isNaN` which will return `true` for
     * `undefined` and other non-numeric values. See http://es5.github.io/#x15.1.2.4.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is `NaN`, else `false`.
     * @example
     *
     * _.isNaN(NaN);
     * // => true
     *
     * _.isNaN(new Number(NaN));
     * // => true
     *
     * isNaN(undefined);
     * // => true
     *
     * _.isNaN(undefined);
     * // => false
     */
    function isNaN(value) {
      // `NaN` as a primitive is the only value that is not equal to itself
      // (perform the [[Class]] check first to avoid errors with some host objects in IE)
      return isNumber(value) && value != +value;
    }
    /**
     * Checks if `value` is `null`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is `null`, else `false`.
     * @example
     *
     * _.isNull(null);
     * // => true
     *
     * _.isNull(undefined);
     * // => false
     */
    function isNull(value) {
      return value === null;
    }
    /**
     * Checks if `value` is a number.
     *
     * Note: `NaN` is considered a number. See http://es5.github.io/#x8.5.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a number, else `false`.
     * @example
     *
     * _.isNumber(8.4 * 5);
     * // => true
     */
    function isNumber(value) {
      return typeof value == 'number' || value && typeof value == 'object' && toString.call(value) == numberClass || false;
    }
    /**
     * Checks if `value` is an object created by the `Object` constructor.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * _.isPlainObject(new Shape);
     * // => false
     *
     * _.isPlainObject([1, 2, 3]);
     * // => false
     *
     * _.isPlainObject({ 'x': 0, 'y': 0 });
     * // => true
     */
    var isPlainObject = !getPrototypeOf ? shimIsPlainObject : function (value) {
        if (!(value && toString.call(value) == objectClass)) {
          return false;
        }
        var valueOf = value.valueOf, objProto = isNative(valueOf) && (objProto = getPrototypeOf(valueOf)) && getPrototypeOf(objProto);
        return objProto ? value == objProto || getPrototypeOf(value) == objProto : shimIsPlainObject(value);
      };
    /**
     * Checks if `value` is a regular expression.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a regular expression, else `false`.
     * @example
     *
     * _.isRegExp(/fred/);
     * // => true
     */
    function isRegExp(value) {
      return value && typeof value == 'object' && toString.call(value) == regexpClass || false;
    }
    /**
     * Checks if `value` is a string.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a string, else `false`.
     * @example
     *
     * _.isString('fred');
     * // => true
     */
    function isString(value) {
      return typeof value == 'string' || value && typeof value == 'object' && toString.call(value) == stringClass || false;
    }
    /**
     * Checks if `value` is `undefined`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is `undefined`, else `false`.
     * @example
     *
     * _.isUndefined(void 0);
     * // => true
     */
    function isUndefined(value) {
      return typeof value == 'undefined';
    }
    /**
     * Creates an object with the same keys as `object` and values generated by
     * running each own enumerable property of `object` through the callback.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, key, object).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new object with values of the results of each `callback` execution.
     * @example
     *
     * _.mapValues({ 'a': 1, 'b': 2, 'c': 3} , function(num) { return num * 3; });
     * // => { 'a': 3, 'b': 6, 'c': 9 }
     *
     * var characters = {
     *   'fred': { 'name': 'fred', 'age': 40 },
     *   'pebbles': { 'name': 'pebbles', 'age': 1 }
     * };
     *
     * // using "_.pluck" callback shorthand
     * _.mapValues(characters, 'age');
     * // => { 'fred': 40, 'pebbles': 1 }
     */
    function mapValues(object, callback, thisArg) {
      var result = {};
      callback = lodash.createCallback(callback, thisArg, 3);
      forOwn(object, function (value, key, object) {
        result[key] = callback(value, key, object);
      });
      return result;
    }
    /**
     * Recursively merges own enumerable properties of the source object(s), that
     * don't resolve to `undefined` into the destination object. Subsequent sources
     * will overwrite property assignments of previous sources. If a callback is
     * provided it will be executed to produce the merged values of the destination
     * and source properties. If the callback returns `undefined` merging will
     * be handled by the method instead. The callback is bound to `thisArg` and
     * invoked with two arguments; (objectValue, sourceValue).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The destination object.
     * @param {...Object} [source] The source objects.
     * @param {Function} [callback] The function to customize merging properties.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the destination object.
     * @example
     *
     * var names = {
     *   'characters': [
     *     { 'name': 'barney' },
     *     { 'name': 'fred' }
     *   ]
     * };
     *
     * var ages = {
     *   'characters': [
     *     { 'age': 36 },
     *     { 'age': 40 }
     *   ]
     * };
     *
     * _.merge(names, ages);
     * // => { 'characters': [{ 'name': 'barney', 'age': 36 }, { 'name': 'fred', 'age': 40 }] }
     *
     * var food = {
     *   'fruits': ['apple'],
     *   'vegetables': ['beet']
     * };
     *
     * var otherFood = {
     *   'fruits': ['banana'],
     *   'vegetables': ['carrot']
     * };
     *
     * _.merge(food, otherFood, function(a, b) {
     *   return _.isArray(a) ? a.concat(b) : undefined;
     * });
     * // => { 'fruits': ['apple', 'banana'], 'vegetables': ['beet', 'carrot] }
     */
    function merge(object) {
      var args = arguments, length = 2;
      if (!isObject(object)) {
        return object;
      }
      // allows working with `_.reduce` and `_.reduceRight` without using
      // their `index` and `collection` arguments
      if (typeof args[2] != 'number') {
        length = args.length;
      }
      if (length > 3 && typeof args[length - 2] == 'function') {
        var callback = baseCreateCallback(args[--length - 1], args[length--], 2);
      } else if (length > 2 && typeof args[length - 1] == 'function') {
        callback = args[--length];
      }
      var sources = slice(arguments, 1, length), index = -1, stackA = getArray(), stackB = getArray();
      while (++index < length) {
        baseMerge(object, sources[index], callback, stackA, stackB);
      }
      releaseArray(stackA);
      releaseArray(stackB);
      return object;
    }
    /**
     * Creates a shallow clone of `object` excluding the specified properties.
     * Property names may be specified as individual arguments or as arrays of
     * property names. If a callback is provided it will be executed for each
     * property of `object` omitting the properties the callback returns truey
     * for. The callback is bound to `thisArg` and invoked with three arguments;
     * (value, key, object).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The source object.
     * @param {Function|...string|string[]} [callback] The properties to omit or the
     *  function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns an object without the omitted properties.
     * @example
     *
     * _.omit({ 'name': 'fred', 'age': 40 }, 'age');
     * // => { 'name': 'fred' }
     *
     * _.omit({ 'name': 'fred', 'age': 40 }, function(value) {
     *   return typeof value == 'number';
     * });
     * // => { 'name': 'fred' }
     */
    function omit(object, callback, thisArg) {
      var result = {};
      if (typeof callback != 'function') {
        var props = [];
        forIn(object, function (value, key) {
          props.push(key);
        });
        props = baseDifference(props, baseFlatten(arguments, true, false, 1));
        var index = -1, length = props.length;
        while (++index < length) {
          var key = props[index];
          result[key] = object[key];
        }
      } else {
        callback = lodash.createCallback(callback, thisArg, 3);
        forIn(object, function (value, key, object) {
          if (!callback(value, key, object)) {
            result[key] = value;
          }
        });
      }
      return result;
    }
    /**
     * Creates a two dimensional array of an object's key-value pairs,
     * i.e. `[[key1, value1], [key2, value2]]`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns new array of key-value pairs.
     * @example
     *
     * _.pairs({ 'barney': 36, 'fred': 40 });
     * // => [['barney', 36], ['fred', 40]] (property order is not guaranteed across environments)
     */
    function pairs(object) {
      var index = -1, props = keys(object), length = props.length, result = Array(length);
      while (++index < length) {
        var key = props[index];
        result[index] = [
          key,
          object[key]
        ];
      }
      return result;
    }
    /**
     * Creates a shallow clone of `object` composed of the specified properties.
     * Property names may be specified as individual arguments or as arrays of
     * property names. If a callback is provided it will be executed for each
     * property of `object` picking the properties the callback returns truey
     * for. The callback is bound to `thisArg` and invoked with three arguments;
     * (value, key, object).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The source object.
     * @param {Function|...string|string[]} [callback] The function called per
     *  iteration or property names to pick, specified as individual property
     *  names or arrays of property names.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns an object composed of the picked properties.
     * @example
     *
     * _.pick({ 'name': 'fred', '_userid': 'fred1' }, 'name');
     * // => { 'name': 'fred' }
     *
     * _.pick({ 'name': 'fred', '_userid': 'fred1' }, function(value, key) {
     *   return key.charAt(0) != '_';
     * });
     * // => { 'name': 'fred' }
     */
    function pick(object, callback, thisArg) {
      var result = {};
      if (typeof callback != 'function') {
        var index = -1, props = baseFlatten(arguments, true, false, 1), length = isObject(object) ? props.length : 0;
        while (++index < length) {
          var key = props[index];
          if (key in object) {
            result[key] = object[key];
          }
        }
      } else {
        callback = lodash.createCallback(callback, thisArg, 3);
        forIn(object, function (value, key, object) {
          if (callback(value, key, object)) {
            result[key] = value;
          }
        });
      }
      return result;
    }
    /**
     * An alternative to `_.reduce` this method transforms `object` to a new
     * `accumulator` object which is the result of running each of its own
     * enumerable properties through a callback, with each callback execution
     * potentially mutating the `accumulator` object. The callback is bound to
     * `thisArg` and invoked with four arguments; (accumulator, value, key, object).
     * Callbacks may exit iteration early by explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Array|Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [accumulator] The custom accumulator value.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var squares = _.transform([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], function(result, num) {
     *   num *= num;
     *   if (num % 2) {
     *     return result.push(num) < 3;
     *   }
     * });
     * // => [1, 9, 25]
     *
     * var mapped = _.transform({ 'a': 1, 'b': 2, 'c': 3 }, function(result, num, key) {
     *   result[key] = num * 3;
     * });
     * // => { 'a': 3, 'b': 6, 'c': 9 }
     */
    function transform(object, callback, accumulator, thisArg) {
      var isArr = isArray(object);
      if (accumulator == null) {
        if (isArr) {
          accumulator = [];
        } else {
          var ctor = object && object.constructor, proto = ctor && ctor.prototype;
          accumulator = baseCreate(proto);
        }
      }
      if (callback) {
        callback = lodash.createCallback(callback, thisArg, 4);
        (isArr ? forEach : forOwn)(object, function (value, index, object) {
          return callback(accumulator, value, index, object);
        });
      }
      return accumulator;
    }
    /**
     * Creates an array composed of the own enumerable property values of `object`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property values.
     * @example
     *
     * _.values({ 'one': 1, 'two': 2, 'three': 3 });
     * // => [1, 2, 3] (property order is not guaranteed across environments)
     */
    function values(object) {
      var index = -1, props = keys(object), length = props.length, result = Array(length);
      while (++index < length) {
        result[index] = object[props[index]];
      }
      return result;
    }
    /*--------------------------------------------------------------------------*/
    /**
     * Creates an array of elements from the specified indexes, or keys, of the
     * `collection`. Indexes may be specified as individual arguments or as arrays
     * of indexes.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {...(number|number[]|string|string[])} [index] The indexes of `collection`
     *   to retrieve, specified as individual indexes or arrays of indexes.
     * @returns {Array} Returns a new array of elements corresponding to the
     *  provided indexes.
     * @example
     *
     * _.at(['a', 'b', 'c', 'd', 'e'], [0, 2, 4]);
     * // => ['a', 'c', 'e']
     *
     * _.at(['fred', 'barney', 'pebbles'], 0, 2);
     * // => ['fred', 'pebbles']
     */
    function at(collection) {
      var args = arguments, index = -1, props = baseFlatten(args, true, false, 1), length = args[2] && args[2][args[1]] === collection ? 1 : props.length, result = Array(length);
      while (++index < length) {
        result[index] = collection[props[index]];
      }
      return result;
    }
    /**
     * Checks if a given value is present in a collection using strict equality
     * for comparisons, i.e. `===`. If `fromIndex` is negative, it is used as the
     * offset from the end of the collection.
     *
     * @static
     * @memberOf _
     * @alias include
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {*} target The value to check for.
     * @param {number} [fromIndex=0] The index to search from.
     * @returns {boolean} Returns `true` if the `target` element is found, else `false`.
     * @example
     *
     * _.contains([1, 2, 3], 1);
     * // => true
     *
     * _.contains([1, 2, 3], 1, 2);
     * // => false
     *
     * _.contains({ 'name': 'fred', 'age': 40 }, 'fred');
     * // => true
     *
     * _.contains('pebbles', 'eb');
     * // => true
     */
    function contains(collection, target, fromIndex) {
      var index = -1, indexOf = getIndexOf(), length = collection ? collection.length : 0, result = false;
      fromIndex = (fromIndex < 0 ? nativeMax(0, length + fromIndex) : fromIndex) || 0;
      if (isArray(collection)) {
        result = indexOf(collection, target, fromIndex) > -1;
      } else if (typeof length == 'number') {
        result = (isString(collection) ? collection.indexOf(target, fromIndex) : indexOf(collection, target, fromIndex)) > -1;
      } else {
        forOwn(collection, function (value) {
          if (++index >= fromIndex) {
            return !(result = value === target);
          }
        });
      }
      return result;
    }
    /**
     * Creates an object composed of keys generated from the results of running
     * each element of `collection` through the callback. The corresponding value
     * of each key is the number of times the key was returned by the callback.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * _.countBy([4.3, 6.1, 6.4], function(num) { return Math.floor(num); });
     * // => { '4': 1, '6': 2 }
     *
     * _.countBy([4.3, 6.1, 6.4], function(num) { return this.floor(num); }, Math);
     * // => { '4': 1, '6': 2 }
     *
     * _.countBy(['one', 'two', 'three'], 'length');
     * // => { '3': 2, '5': 1 }
     */
    var countBy = createAggregator(function (result, value, key) {
        hasOwnProperty.call(result, key) ? result[key]++ : result[key] = 1;
      });
    /**
     * Checks if the given callback returns truey value for **all** elements of
     * a collection. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias all
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {boolean} Returns `true` if all elements passed the callback check,
     *  else `false`.
     * @example
     *
     * _.every([true, 1, null, 'yes']);
     * // => false
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.every(characters, 'age');
     * // => true
     *
     * // using "_.where" callback shorthand
     * _.every(characters, { 'age': 36 });
     * // => false
     */
    function every(collection, callback, thisArg) {
      var result = true;
      callback = lodash.createCallback(callback, thisArg, 3);
      var index = -1, length = collection ? collection.length : 0;
      if (typeof length == 'number') {
        while (++index < length) {
          if (!(result = !!callback(collection[index], index, collection))) {
            break;
          }
        }
      } else {
        forOwn(collection, function (value, index, collection) {
          return result = !!callback(value, index, collection);
        });
      }
      return result;
    }
    /**
     * Iterates over elements of a collection, returning an array of all elements
     * the callback returns truey for. The callback is bound to `thisArg` and
     * invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias select
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of elements that passed the callback check.
     * @example
     *
     * var evens = _.filter([1, 2, 3, 4, 5, 6], function(num) { return num % 2 == 0; });
     * // => [2, 4, 6]
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'blocked': false },
     *   { 'name': 'fred',   'age': 40, 'blocked': true }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.filter(characters, 'blocked');
     * // => [{ 'name': 'fred', 'age': 40, 'blocked': true }]
     *
     * // using "_.where" callback shorthand
     * _.filter(characters, { 'age': 36 });
     * // => [{ 'name': 'barney', 'age': 36, 'blocked': false }]
     */
    function filter(collection, callback, thisArg) {
      var result = [];
      callback = lodash.createCallback(callback, thisArg, 3);
      var index = -1, length = collection ? collection.length : 0;
      if (typeof length == 'number') {
        while (++index < length) {
          var value = collection[index];
          if (callback(value, index, collection)) {
            result.push(value);
          }
        }
      } else {
        forOwn(collection, function (value, index, collection) {
          if (callback(value, index, collection)) {
            result.push(value);
          }
        });
      }
      return result;
    }
    /**
     * Iterates over elements of a collection, returning the first element that
     * the callback returns truey for. The callback is bound to `thisArg` and
     * invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias detect, findWhere
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the found element, else `undefined`.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36, 'blocked': false },
     *   { 'name': 'fred',    'age': 40, 'blocked': true },
     *   { 'name': 'pebbles', 'age': 1,  'blocked': false }
     * ];
     *
     * _.find(characters, function(chr) {
     *   return chr.age < 40;
     * });
     * // => { 'name': 'barney', 'age': 36, 'blocked': false }
     *
     * // using "_.where" callback shorthand
     * _.find(characters, { 'age': 1 });
     * // =>  { 'name': 'pebbles', 'age': 1, 'blocked': false }
     *
     * // using "_.pluck" callback shorthand
     * _.find(characters, 'blocked');
     * // => { 'name': 'fred', 'age': 40, 'blocked': true }
     */
    function find(collection, callback, thisArg) {
      callback = lodash.createCallback(callback, thisArg, 3);
      var index = -1, length = collection ? collection.length : 0;
      if (typeof length == 'number') {
        while (++index < length) {
          var value = collection[index];
          if (callback(value, index, collection)) {
            return value;
          }
        }
      } else {
        var result;
        forOwn(collection, function (value, index, collection) {
          if (callback(value, index, collection)) {
            result = value;
            return false;
          }
        });
        return result;
      }
    }
    /**
     * This method is like `_.find` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the found element, else `undefined`.
     * @example
     *
     * _.findLast([1, 2, 3, 4], function(num) {
     *   return num % 2 == 1;
     * });
     * // => 3
     */
    function findLast(collection, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);
      forEachRight(collection, function (value, index, collection) {
        if (callback(value, index, collection)) {
          result = value;
          return false;
        }
      });
      return result;
    }
    /**
     * Iterates over elements of a collection, executing the callback for each
     * element. The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection). Callbacks may exit iteration early by
     * explicitly returning `false`.
     *
     * Note: As with other "Collections" methods, objects with a `length` property
     * are iterated like arrays. To avoid this behavior `_.forIn` or `_.forOwn`
     * may be used for object iteration.
     *
     * @static
     * @memberOf _
     * @alias each
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array|Object|string} Returns `collection`.
     * @example
     *
     * _([1, 2, 3]).forEach(function(num) { console.log(num); }).join(',');
     * // => logs each number and returns '1,2,3'
     *
     * _.forEach({ 'one': 1, 'two': 2, 'three': 3 }, function(num) { console.log(num); });
     * // => logs each number and returns the object (property order is not guaranteed across environments)
     */
    function forEach(collection, callback, thisArg) {
      var index = -1, length = collection ? collection.length : 0;
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
      if (typeof length == 'number') {
        while (++index < length) {
          if (callback(collection[index], index, collection) === false) {
            break;
          }
        }
      } else {
        forOwn(collection, callback);
      }
      return collection;
    }
    /**
     * This method is like `_.forEach` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @alias eachRight
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array|Object|string} Returns `collection`.
     * @example
     *
     * _([1, 2, 3]).forEachRight(function(num) { console.log(num); }).join(',');
     * // => logs each number from right to left and returns '3,2,1'
     */
    function forEachRight(collection, callback, thisArg) {
      var length = collection ? collection.length : 0;
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
      if (typeof length == 'number') {
        while (length--) {
          if (callback(collection[length], length, collection) === false) {
            break;
          }
        }
      } else {
        var props = keys(collection);
        length = props.length;
        forOwn(collection, function (value, key, collection) {
          key = props ? props[--length] : --length;
          return callback(collection[key], key, collection);
        });
      }
      return collection;
    }
    /**
     * Creates an object composed of keys generated from the results of running
     * each element of a collection through the callback. The corresponding value
     * of each key is an array of the elements responsible for generating the key.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * _.groupBy([4.2, 6.1, 6.4], function(num) { return Math.floor(num); });
     * // => { '4': [4.2], '6': [6.1, 6.4] }
     *
     * _.groupBy([4.2, 6.1, 6.4], function(num) { return this.floor(num); }, Math);
     * // => { '4': [4.2], '6': [6.1, 6.4] }
     *
     * // using "_.pluck" callback shorthand
     * _.groupBy(['one', 'two', 'three'], 'length');
     * // => { '3': ['one', 'two'], '5': ['three'] }
     */
    var groupBy = createAggregator(function (result, value, key) {
        (hasOwnProperty.call(result, key) ? result[key] : result[key] = []).push(value);
      });
    /**
     * Creates an object composed of keys generated from the results of running
     * each element of the collection through the given callback. The corresponding
     * value of each key is the last element responsible for generating the key.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * var keys = [
     *   { 'dir': 'left', 'code': 97 },
     *   { 'dir': 'right', 'code': 100 }
     * ];
     *
     * _.indexBy(keys, 'dir');
     * // => { 'left': { 'dir': 'left', 'code': 97 }, 'right': { 'dir': 'right', 'code': 100 } }
     *
     * _.indexBy(keys, function(key) { return String.fromCharCode(key.code); });
     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
     *
     * _.indexBy(characters, function(key) { this.fromCharCode(key.code); }, String);
     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
     */
    var indexBy = createAggregator(function (result, value, key) {
        result[key] = value;
      });
    /**
     * Invokes the method named by `methodName` on each element in the `collection`
     * returning an array of the results of each invoked method. Additional arguments
     * will be provided to each invoked method. If `methodName` is a function it
     * will be invoked for, and `this` bound to, each element in the `collection`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|string} methodName The name of the method to invoke or
     *  the function invoked per iteration.
     * @param {...*} [arg] Arguments to invoke the method with.
     * @returns {Array} Returns a new array of the results of each invoked method.
     * @example
     *
     * _.invoke([[5, 1, 7], [3, 2, 1]], 'sort');
     * // => [[1, 5, 7], [1, 2, 3]]
     *
     * _.invoke([123, 456], String.prototype.split, '');
     * // => [['1', '2', '3'], ['4', '5', '6']]
     */
    function invoke(collection, methodName) {
      var args = slice(arguments, 2), index = -1, isFunc = typeof methodName == 'function', length = collection ? collection.length : 0, result = Array(typeof length == 'number' ? length : 0);
      forEach(collection, function (value) {
        result[++index] = (isFunc ? methodName : value[methodName]).apply(value, args);
      });
      return result;
    }
    /**
     * Creates an array of values by running each element in the collection
     * through the callback. The callback is bound to `thisArg` and invoked with
     * three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias collect
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of the results of each `callback` execution.
     * @example
     *
     * _.map([1, 2, 3], function(num) { return num * 3; });
     * // => [3, 6, 9]
     *
     * _.map({ 'one': 1, 'two': 2, 'three': 3 }, function(num) { return num * 3; });
     * // => [3, 6, 9] (property order is not guaranteed across environments)
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.map(characters, 'name');
     * // => ['barney', 'fred']
     */
    function map(collection, callback, thisArg) {
      var index = -1, length = collection ? collection.length : 0;
      callback = lodash.createCallback(callback, thisArg, 3);
      if (typeof length == 'number') {
        var result = Array(length);
        while (++index < length) {
          result[index] = callback(collection[index], index, collection);
        }
      } else {
        result = [];
        forOwn(collection, function (value, key, collection) {
          result[++index] = callback(value, key, collection);
        });
      }
      return result;
    }
    /**
     * Retrieves the maximum value of a collection. If the collection is empty or
     * falsey `-Infinity` is returned. If a callback is provided it will be executed
     * for each value in the collection to generate the criterion by which the value
     * is ranked. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the maximum value.
     * @example
     *
     * _.max([4, 2, 8, 6]);
     * // => 8
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * _.max(characters, function(chr) { return chr.age; });
     * // => { 'name': 'fred', 'age': 40 };
     *
     * // using "_.pluck" callback shorthand
     * _.max(characters, 'age');
     * // => { 'name': 'fred', 'age': 40 };
     */
    function max(collection, callback, thisArg) {
      var computed = -Infinity, result = computed;
      // allows working with functions like `_.map` without using
      // their `index` argument as a callback
      if (typeof callback != 'function' && thisArg && thisArg[callback] === collection) {
        callback = null;
      }
      if (callback == null && isArray(collection)) {
        var index = -1, length = collection.length;
        while (++index < length) {
          var value = collection[index];
          if (value > result) {
            result = value;
          }
        }
      } else {
        callback = callback == null && isString(collection) ? charAtCallback : lodash.createCallback(callback, thisArg, 3);
        forEach(collection, function (value, index, collection) {
          var current = callback(value, index, collection);
          if (current > computed) {
            computed = current;
            result = value;
          }
        });
      }
      return result;
    }
    /**
     * Retrieves the minimum value of a collection. If the collection is empty or
     * falsey `Infinity` is returned. If a callback is provided it will be executed
     * for each value in the collection to generate the criterion by which the value
     * is ranked. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the minimum value.
     * @example
     *
     * _.min([4, 2, 8, 6]);
     * // => 2
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * _.min(characters, function(chr) { return chr.age; });
     * // => { 'name': 'barney', 'age': 36 };
     *
     * // using "_.pluck" callback shorthand
     * _.min(characters, 'age');
     * // => { 'name': 'barney', 'age': 36 };
     */
    function min(collection, callback, thisArg) {
      var computed = Infinity, result = computed;
      // allows working with functions like `_.map` without using
      // their `index` argument as a callback
      if (typeof callback != 'function' && thisArg && thisArg[callback] === collection) {
        callback = null;
      }
      if (callback == null && isArray(collection)) {
        var index = -1, length = collection.length;
        while (++index < length) {
          var value = collection[index];
          if (value < result) {
            result = value;
          }
        }
      } else {
        callback = callback == null && isString(collection) ? charAtCallback : lodash.createCallback(callback, thisArg, 3);
        forEach(collection, function (value, index, collection) {
          var current = callback(value, index, collection);
          if (current < computed) {
            computed = current;
            result = value;
          }
        });
      }
      return result;
    }
    /**
     * Retrieves the value of a specified property from all elements in the collection.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {string} property The name of the property to pluck.
     * @returns {Array} Returns a new array of property values.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * _.pluck(characters, 'name');
     * // => ['barney', 'fred']
     */
    var pluck = map;
    /**
     * Reduces a collection to a value which is the accumulated result of running
     * each element in the collection through the callback, where each successive
     * callback execution consumes the return value of the previous execution. If
     * `accumulator` is not provided the first element of the collection will be
     * used as the initial `accumulator` value. The callback is bound to `thisArg`
     * and invoked with four arguments; (accumulator, value, index|key, collection).
     *
     * @static
     * @memberOf _
     * @alias foldl, inject
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [accumulator] Initial value of the accumulator.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var sum = _.reduce([1, 2, 3], function(sum, num) {
     *   return sum + num;
     * });
     * // => 6
     *
     * var mapped = _.reduce({ 'a': 1, 'b': 2, 'c': 3 }, function(result, num, key) {
     *   result[key] = num * 3;
     *   return result;
     * }, {});
     * // => { 'a': 3, 'b': 6, 'c': 9 }
     */
    function reduce(collection, callback, accumulator, thisArg) {
      if (!collection)
        return accumulator;
      var noaccum = arguments.length < 3;
      callback = lodash.createCallback(callback, thisArg, 4);
      var index = -1, length = collection.length;
      if (typeof length == 'number') {
        if (noaccum) {
          accumulator = collection[++index];
        }
        while (++index < length) {
          accumulator = callback(accumulator, collection[index], index, collection);
        }
      } else {
        forOwn(collection, function (value, index, collection) {
          accumulator = noaccum ? (noaccum = false, value) : callback(accumulator, value, index, collection);
        });
      }
      return accumulator;
    }
    /**
     * This method is like `_.reduce` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @alias foldr
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [accumulator] Initial value of the accumulator.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var list = [[0, 1], [2, 3], [4, 5]];
     * var flat = _.reduceRight(list, function(a, b) { return a.concat(b); }, []);
     * // => [4, 5, 2, 3, 0, 1]
     */
    function reduceRight(collection, callback, accumulator, thisArg) {
      var noaccum = arguments.length < 3;
      callback = lodash.createCallback(callback, thisArg, 4);
      forEachRight(collection, function (value, index, collection) {
        accumulator = noaccum ? (noaccum = false, value) : callback(accumulator, value, index, collection);
      });
      return accumulator;
    }
    /**
     * The opposite of `_.filter` this method returns the elements of a
     * collection that the callback does **not** return truey for.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of elements that failed the callback check.
     * @example
     *
     * var odds = _.reject([1, 2, 3, 4, 5, 6], function(num) { return num % 2 == 0; });
     * // => [1, 3, 5]
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'blocked': false },
     *   { 'name': 'fred',   'age': 40, 'blocked': true }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.reject(characters, 'blocked');
     * // => [{ 'name': 'barney', 'age': 36, 'blocked': false }]
     *
     * // using "_.where" callback shorthand
     * _.reject(characters, { 'age': 36 });
     * // => [{ 'name': 'fred', 'age': 40, 'blocked': true }]
     */
    function reject(collection, callback, thisArg) {
      callback = lodash.createCallback(callback, thisArg, 3);
      return filter(collection, function (value, index, collection) {
        return !callback(value, index, collection);
      });
    }
    /**
     * Retrieves a random element or `n` random elements from a collection.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to sample.
     * @param {number} [n] The number of elements to sample.
     * @param- {Object} [guard] Allows working with functions like `_.map`
     *  without using their `index` arguments as `n`.
     * @returns {Array} Returns the random sample(s) of `collection`.
     * @example
     *
     * _.sample([1, 2, 3, 4]);
     * // => 2
     *
     * _.sample([1, 2, 3, 4], 2);
     * // => [3, 1]
     */
    function sample(collection, n, guard) {
      if (collection && typeof collection.length != 'number') {
        collection = values(collection);
      }
      if (n == null || guard) {
        return collection ? collection[baseRandom(0, collection.length - 1)] : undefined;
      }
      var result = shuffle(collection);
      result.length = nativeMin(nativeMax(0, n), result.length);
      return result;
    }
    /**
     * Creates an array of shuffled values, using a version of the Fisher-Yates
     * shuffle. See http://en.wikipedia.org/wiki/Fisher-Yates_shuffle.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to shuffle.
     * @returns {Array} Returns a new shuffled collection.
     * @example
     *
     * _.shuffle([1, 2, 3, 4, 5, 6]);
     * // => [4, 1, 6, 3, 5, 2]
     */
    function shuffle(collection) {
      var index = -1, length = collection ? collection.length : 0, result = Array(typeof length == 'number' ? length : 0);
      forEach(collection, function (value) {
        var rand = baseRandom(0, ++index);
        result[index] = result[rand];
        result[rand] = value;
      });
      return result;
    }
    /**
     * Gets the size of the `collection` by returning `collection.length` for arrays
     * and array-like objects or the number of own enumerable properties for objects.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to inspect.
     * @returns {number} Returns `collection.length` or number of own enumerable properties.
     * @example
     *
     * _.size([1, 2]);
     * // => 2
     *
     * _.size({ 'one': 1, 'two': 2, 'three': 3 });
     * // => 3
     *
     * _.size('pebbles');
     * // => 7
     */
    function size(collection) {
      var length = collection ? collection.length : 0;
      return typeof length == 'number' ? length : keys(collection).length;
    }
    /**
     * Checks if the callback returns a truey value for **any** element of a
     * collection. The function returns as soon as it finds a passing value and
     * does not iterate over the entire collection. The callback is bound to
     * `thisArg` and invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias any
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {boolean} Returns `true` if any element passed the callback check,
     *  else `false`.
     * @example
     *
     * _.some([null, 0, 'yes', false], Boolean);
     * // => true
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'blocked': false },
     *   { 'name': 'fred',   'age': 40, 'blocked': true }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.some(characters, 'blocked');
     * // => true
     *
     * // using "_.where" callback shorthand
     * _.some(characters, { 'age': 1 });
     * // => false
     */
    function some(collection, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);
      var index = -1, length = collection ? collection.length : 0;
      if (typeof length == 'number') {
        while (++index < length) {
          if (result = callback(collection[index], index, collection)) {
            break;
          }
        }
      } else {
        forOwn(collection, function (value, index, collection) {
          return !(result = callback(value, index, collection));
        });
      }
      return !!result;
    }
    /**
     * Creates an array of elements, sorted in ascending order by the results of
     * running each element in a collection through the callback. This method
     * performs a stable sort, that is, it will preserve the original sort order
     * of equal elements. The callback is bound to `thisArg` and invoked with
     * three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an array of property names is provided for `callback` the collection
     * will be sorted by each property value.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Array|Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of sorted elements.
     * @example
     *
     * _.sortBy([1, 2, 3], function(num) { return Math.sin(num); });
     * // => [3, 1, 2]
     *
     * _.sortBy([1, 2, 3], function(num) { return this.sin(num); }, Math);
     * // => [3, 1, 2]
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36 },
     *   { 'name': 'fred',    'age': 40 },
     *   { 'name': 'barney',  'age': 26 },
     *   { 'name': 'fred',    'age': 30 }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.map(_.sortBy(characters, 'age'), _.values);
     * // => [['barney', 26], ['fred', 30], ['barney', 36], ['fred', 40]]
     *
     * // sorting by multiple properties
     * _.map(_.sortBy(characters, ['name', 'age']), _.values);
     * // = > [['barney', 26], ['barney', 36], ['fred', 30], ['fred', 40]]
     */
    function sortBy(collection, callback, thisArg) {
      var index = -1, isArr = isArray(callback), length = collection ? collection.length : 0, result = Array(typeof length == 'number' ? length : 0);
      if (!isArr) {
        callback = lodash.createCallback(callback, thisArg, 3);
      }
      forEach(collection, function (value, key, collection) {
        var object = result[++index] = getObject();
        if (isArr) {
          object.criteria = map(callback, function (key) {
            return value[key];
          });
        } else {
          (object.criteria = getArray())[0] = callback(value, key, collection);
        }
        object.index = index;
        object.value = value;
      });
      length = result.length;
      result.sort(compareAscending);
      while (length--) {
        var object = result[length];
        result[length] = object.value;
        if (!isArr) {
          releaseArray(object.criteria);
        }
        releaseObject(object);
      }
      return result;
    }
    /**
     * Converts the `collection` to an array.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to convert.
     * @returns {Array} Returns the new converted array.
     * @example
     *
     * (function() { return _.toArray(arguments).slice(1); })(1, 2, 3, 4);
     * // => [2, 3, 4]
     */
    function toArray(collection) {
      if (collection && typeof collection.length == 'number') {
        return slice(collection);
      }
      return values(collection);
    }
    /**
     * Performs a deep comparison of each element in a `collection` to the given
     * `properties` object, returning an array of all elements that have equivalent
     * property values.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Object} props The object of property values to filter by.
     * @returns {Array} Returns a new array of elements that have the given properties.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'pets': ['hoppy'] },
     *   { 'name': 'fred',   'age': 40, 'pets': ['baby puss', 'dino'] }
     * ];
     *
     * _.where(characters, { 'age': 36 });
     * // => [{ 'name': 'barney', 'age': 36, 'pets': ['hoppy'] }]
     *
     * _.where(characters, { 'pets': ['dino'] });
     * // => [{ 'name': 'fred', 'age': 40, 'pets': ['baby puss', 'dino'] }]
     */
    var where = filter;
    /*--------------------------------------------------------------------------*/
    /**
     * Creates an array with all falsey values removed. The values `false`, `null`,
     * `0`, `""`, `undefined`, and `NaN` are all falsey.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to compact.
     * @returns {Array} Returns a new array of filtered values.
     * @example
     *
     * _.compact([0, 1, false, 2, '', 3]);
     * // => [1, 2, 3]
     */
    function compact(array) {
      var index = -1, length = array ? array.length : 0, result = [];
      while (++index < length) {
        var value = array[index];
        if (value) {
          result.push(value);
        }
      }
      return result;
    }
    /**
     * Creates an array excluding all values of the provided arrays using strict
     * equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to process.
     * @param {...Array} [values] The arrays of values to exclude.
     * @returns {Array} Returns a new array of filtered values.
     * @example
     *
     * _.difference([1, 2, 3, 4, 5], [5, 2, 10]);
     * // => [1, 3, 4]
     */
    function difference(array) {
      return baseDifference(array, baseFlatten(arguments, true, true, 1));
    }
    /**
     * This method is like `_.find` except that it returns the index of the first
     * element that passes the callback check, instead of the element itself.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {number} Returns the index of the found element, else `-1`.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36, 'blocked': false },
     *   { 'name': 'fred',    'age': 40, 'blocked': true },
     *   { 'name': 'pebbles', 'age': 1,  'blocked': false }
     * ];
     *
     * _.findIndex(characters, function(chr) {
     *   return chr.age < 20;
     * });
     * // => 2
     *
     * // using "_.where" callback shorthand
     * _.findIndex(characters, { 'age': 36 });
     * // => 0
     *
     * // using "_.pluck" callback shorthand
     * _.findIndex(characters, 'blocked');
     * // => 1
     */
    function findIndex(array, callback, thisArg) {
      var index = -1, length = array ? array.length : 0;
      callback = lodash.createCallback(callback, thisArg, 3);
      while (++index < length) {
        if (callback(array[index], index, array)) {
          return index;
        }
      }
      return -1;
    }
    /**
     * This method is like `_.findIndex` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {number} Returns the index of the found element, else `-1`.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36, 'blocked': true },
     *   { 'name': 'fred',    'age': 40, 'blocked': false },
     *   { 'name': 'pebbles', 'age': 1,  'blocked': true }
     * ];
     *
     * _.findLastIndex(characters, function(chr) {
     *   return chr.age > 30;
     * });
     * // => 1
     *
     * // using "_.where" callback shorthand
     * _.findLastIndex(characters, { 'age': 36 });
     * // => 0
     *
     * // using "_.pluck" callback shorthand
     * _.findLastIndex(characters, 'blocked');
     * // => 2
     */
    function findLastIndex(array, callback, thisArg) {
      var length = array ? array.length : 0;
      callback = lodash.createCallback(callback, thisArg, 3);
      while (length--) {
        if (callback(array[length], length, array)) {
          return length;
        }
      }
      return -1;
    }
    /**
     * Gets the first element or first `n` elements of an array. If a callback
     * is provided elements at the beginning of the array are returned as long
     * as the callback returns truey. The callback is bound to `thisArg` and
     * invoked with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias head, take
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback] The function called
     *  per element or the number of elements to return. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the first element(s) of `array`.
     * @example
     *
     * _.first([1, 2, 3]);
     * // => 1
     *
     * _.first([1, 2, 3], 2);
     * // => [1, 2]
     *
     * _.first([1, 2, 3], function(num) {
     *   return num < 3;
     * });
     * // => [1, 2]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': true,  'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': false, 'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.first(characters, 'blocked');
     * // => [{ 'name': 'barney', 'blocked': true, 'employer': 'slate' }]
     *
     * // using "_.where" callback shorthand
     * _.pluck(_.first(characters, { 'employer': 'slate' }), 'name');
     * // => ['barney', 'fred']
     */
    function first(array, callback, thisArg) {
      var n = 0, length = array ? array.length : 0;
      if (typeof callback != 'number' && callback != null) {
        var index = -1;
        callback = lodash.createCallback(callback, thisArg, 3);
        while (++index < length && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = callback;
        if (n == null || thisArg) {
          return array ? array[0] : undefined;
        }
      }
      return slice(array, 0, nativeMin(nativeMax(0, n), length));
    }
    /**
     * Flattens a nested array (the nesting can be to any depth). If `isShallow`
     * is truey, the array will only be flattened a single level. If a callback
     * is provided each element of the array is passed through the callback before
     * flattening. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to flatten.
     * @param {boolean} [isShallow=false] A flag to restrict flattening to a single level.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new flattened array.
     * @example
     *
     * _.flatten([1, [2], [3, [[4]]]]);
     * // => [1, 2, 3, 4];
     *
     * _.flatten([1, [2], [3, [[4]]]], true);
     * // => [1, 2, 3, [[4]]];
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 30, 'pets': ['hoppy'] },
     *   { 'name': 'fred',   'age': 40, 'pets': ['baby puss', 'dino'] }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.flatten(characters, 'pets');
     * // => ['hoppy', 'baby puss', 'dino']
     */
    function flatten(array, isShallow, callback, thisArg) {
      // juggle arguments
      if (typeof isShallow != 'boolean' && isShallow != null) {
        thisArg = callback;
        callback = typeof isShallow != 'function' && thisArg && thisArg[isShallow] === array ? null : isShallow;
        isShallow = false;
      }
      if (callback != null) {
        array = map(array, callback, thisArg);
      }
      return baseFlatten(array, isShallow);
    }
    /**
     * Gets the index at which the first occurrence of `value` is found using
     * strict equality for comparisons, i.e. `===`. If the array is already sorted
     * providing `true` for `fromIndex` will run a faster binary search.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {*} value The value to search for.
     * @param {boolean|number} [fromIndex=0] The index to search from or `true`
     *  to perform a binary search on a sorted array.
     * @returns {number} Returns the index of the matched value or `-1`.
     * @example
     *
     * _.indexOf([1, 2, 3, 1, 2, 3], 2);
     * // => 1
     *
     * _.indexOf([1, 2, 3, 1, 2, 3], 2, 3);
     * // => 4
     *
     * _.indexOf([1, 1, 2, 2, 3, 3], 2, true);
     * // => 2
     */
    function indexOf(array, value, fromIndex) {
      if (typeof fromIndex == 'number') {
        var length = array ? array.length : 0;
        fromIndex = fromIndex < 0 ? nativeMax(0, length + fromIndex) : fromIndex || 0;
      } else if (fromIndex) {
        var index = sortedIndex(array, value);
        return array[index] === value ? index : -1;
      }
      return baseIndexOf(array, value, fromIndex);
    }
    /**
     * Gets all but the last element or last `n` elements of an array. If a
     * callback is provided elements at the end of the array are excluded from
     * the result as long as the callback returns truey. The callback is bound
     * to `thisArg` and invoked with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback=1] The function called
     *  per element or the number of elements to exclude. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a slice of `array`.
     * @example
     *
     * _.initial([1, 2, 3]);
     * // => [1, 2]
     *
     * _.initial([1, 2, 3], 2);
     * // => [1]
     *
     * _.initial([1, 2, 3], function(num) {
     *   return num > 1;
     * });
     * // => [1]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': false, 'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': true,  'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.initial(characters, 'blocked');
     * // => [{ 'name': 'barney',  'blocked': false, 'employer': 'slate' }]
     *
     * // using "_.where" callback shorthand
     * _.pluck(_.initial(characters, { 'employer': 'na' }), 'name');
     * // => ['barney', 'fred']
     */
    function initial(array, callback, thisArg) {
      var n = 0, length = array ? array.length : 0;
      if (typeof callback != 'number' && callback != null) {
        var index = length;
        callback = lodash.createCallback(callback, thisArg, 3);
        while (index-- && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = callback == null || thisArg ? 1 : callback || n;
      }
      return slice(array, 0, nativeMin(nativeMax(0, length - n), length));
    }
    /**
     * Creates an array of unique values present in all provided arrays using
     * strict equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {...Array} [array] The arrays to inspect.
     * @returns {Array} Returns an array of shared values.
     * @example
     *
     * _.intersection([1, 2, 3], [5, 2, 1, 4], [2, 1]);
     * // => [1, 2]
     */
    function intersection() {
      var args = [], argsIndex = -1, argsLength = arguments.length, caches = getArray(), indexOf = getIndexOf(), trustIndexOf = indexOf === baseIndexOf, seen = getArray();
      while (++argsIndex < argsLength) {
        var value = arguments[argsIndex];
        if (isArray(value) || isArguments(value)) {
          args.push(value);
          caches.push(trustIndexOf && value.length >= largeArraySize && createCache(argsIndex ? args[argsIndex] : seen));
        }
      }
      var array = args[0], index = -1, length = array ? array.length : 0, result = [];
      outer:
        while (++index < length) {
          var cache = caches[0];
          value = array[index];
          if ((cache ? cacheIndexOf(cache, value) : indexOf(seen, value)) < 0) {
            argsIndex = argsLength;
            (cache || seen).push(value);
            while (--argsIndex) {
              cache = caches[argsIndex];
              if ((cache ? cacheIndexOf(cache, value) : indexOf(args[argsIndex], value)) < 0) {
                continue outer;
              }
            }
            result.push(value);
          }
        }
      while (argsLength--) {
        cache = caches[argsLength];
        if (cache) {
          releaseObject(cache);
        }
      }
      releaseArray(caches);
      releaseArray(seen);
      return result;
    }
    /**
     * Gets the last element or last `n` elements of an array. If a callback is
     * provided elements at the end of the array are returned as long as the
     * callback returns truey. The callback is bound to `thisArg` and invoked
     * with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback] The function called
     *  per element or the number of elements to return. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the last element(s) of `array`.
     * @example
     *
     * _.last([1, 2, 3]);
     * // => 3
     *
     * _.last([1, 2, 3], 2);
     * // => [2, 3]
     *
     * _.last([1, 2, 3], function(num) {
     *   return num > 1;
     * });
     * // => [2, 3]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': false, 'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': true,  'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.pluck(_.last(characters, 'blocked'), 'name');
     * // => ['fred', 'pebbles']
     *
     * // using "_.where" callback shorthand
     * _.last(characters, { 'employer': 'na' });
     * // => [{ 'name': 'pebbles', 'blocked': true, 'employer': 'na' }]
     */
    function last(array, callback, thisArg) {
      var n = 0, length = array ? array.length : 0;
      if (typeof callback != 'number' && callback != null) {
        var index = length;
        callback = lodash.createCallback(callback, thisArg, 3);
        while (index-- && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = callback;
        if (n == null || thisArg) {
          return array ? array[length - 1] : undefined;
        }
      }
      return slice(array, nativeMax(0, length - n));
    }
    /**
     * Gets the index at which the last occurrence of `value` is found using strict
     * equality for comparisons, i.e. `===`. If `fromIndex` is negative, it is used
     * as the offset from the end of the collection.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {*} value The value to search for.
     * @param {number} [fromIndex=array.length-1] The index to search from.
     * @returns {number} Returns the index of the matched value or `-1`.
     * @example
     *
     * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2);
     * // => 4
     *
     * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2, 3);
     * // => 1
     */
    function lastIndexOf(array, value, fromIndex) {
      var index = array ? array.length : 0;
      if (typeof fromIndex == 'number') {
        index = (fromIndex < 0 ? nativeMax(0, index + fromIndex) : nativeMin(fromIndex, index - 1)) + 1;
      }
      while (index--) {
        if (array[index] === value) {
          return index;
        }
      }
      return -1;
    }
    /**
     * Removes all provided values from the given array using strict equality for
     * comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to modify.
     * @param {...*} [value] The values to remove.
     * @returns {Array} Returns `array`.
     * @example
     *
     * var array = [1, 2, 3, 1, 2, 3];
     * _.pull(array, 2, 3);
     * console.log(array);
     * // => [1, 1]
     */
    function pull(array) {
      var args = arguments, argsIndex = 0, argsLength = args.length, length = array ? array.length : 0;
      while (++argsIndex < argsLength) {
        var index = -1, value = args[argsIndex];
        while (++index < length) {
          if (array[index] === value) {
            splice.call(array, index--, 1);
            length--;
          }
        }
      }
      return array;
    }
    /**
     * Creates an array of numbers (positive and/or negative) progressing from
     * `start` up to but not including `end`. If `start` is less than `stop` a
     * zero-length range is created unless a negative `step` is specified.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {number} [start=0] The start of the range.
     * @param {number} end The end of the range.
     * @param {number} [step=1] The value to increment or decrement by.
     * @returns {Array} Returns a new range array.
     * @example
     *
     * _.range(4);
     * // => [0, 1, 2, 3]
     *
     * _.range(1, 5);
     * // => [1, 2, 3, 4]
     *
     * _.range(0, 20, 5);
     * // => [0, 5, 10, 15]
     *
     * _.range(0, -4, -1);
     * // => [0, -1, -2, -3]
     *
     * _.range(1, 4, 0);
     * // => [1, 1, 1]
     *
     * _.range(0);
     * // => []
     */
    function range(start, end, step) {
      start = +start || 0;
      step = typeof step == 'number' ? step : +step || 1;
      if (end == null) {
        end = start;
        start = 0;
      }
      // use `Array(length)` so engines like Chakra and V8 avoid slower modes
      // http://youtu.be/XAqIpGU8ZZk#t=17m25s
      var index = -1, length = nativeMax(0, ceil((end - start) / (step || 1))), result = Array(length);
      while (++index < length) {
        result[index] = start;
        start += step;
      }
      return result;
    }
    /**
     * Removes all elements from an array that the callback returns truey for
     * and returns an array of removed elements. The callback is bound to `thisArg`
     * and invoked with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to modify.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of removed elements.
     * @example
     *
     * var array = [1, 2, 3, 4, 5, 6];
     * var evens = _.remove(array, function(num) { return num % 2 == 0; });
     *
     * console.log(array);
     * // => [1, 3, 5]
     *
     * console.log(evens);
     * // => [2, 4, 6]
     */
    function remove(array, callback, thisArg) {
      var index = -1, length = array ? array.length : 0, result = [];
      callback = lodash.createCallback(callback, thisArg, 3);
      while (++index < length) {
        var value = array[index];
        if (callback(value, index, array)) {
          result.push(value);
          splice.call(array, index--, 1);
          length--;
        }
      }
      return result;
    }
    /**
     * The opposite of `_.initial` this method gets all but the first element or
     * first `n` elements of an array. If a callback function is provided elements
     * at the beginning of the array are excluded from the result as long as the
     * callback returns truey. The callback is bound to `thisArg` and invoked
     * with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias drop, tail
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback=1] The function called
     *  per element or the number of elements to exclude. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a slice of `array`.
     * @example
     *
     * _.rest([1, 2, 3]);
     * // => [2, 3]
     *
     * _.rest([1, 2, 3], 2);
     * // => [3]
     *
     * _.rest([1, 2, 3], function(num) {
     *   return num < 3;
     * });
     * // => [3]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': true,  'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': false,  'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true, 'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.pluck(_.rest(characters, 'blocked'), 'name');
     * // => ['fred', 'pebbles']
     *
     * // using "_.where" callback shorthand
     * _.rest(characters, { 'employer': 'slate' });
     * // => [{ 'name': 'pebbles', 'blocked': true, 'employer': 'na' }]
     */
    function rest(array, callback, thisArg) {
      if (typeof callback != 'number' && callback != null) {
        var n = 0, index = -1, length = array ? array.length : 0;
        callback = lodash.createCallback(callback, thisArg, 3);
        while (++index < length && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = callback == null || thisArg ? 1 : nativeMax(0, callback);
      }
      return slice(array, n);
    }
    /**
     * Uses a binary search to determine the smallest index at which a value
     * should be inserted into a given sorted array in order to maintain the sort
     * order of the array. If a callback is provided it will be executed for
     * `value` and each element of `array` to compute their sort ranking. The
     * callback is bound to `thisArg` and invoked with one argument; (value).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to inspect.
     * @param {*} value The value to evaluate.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {number} Returns the index at which `value` should be inserted
     *  into `array`.
     * @example
     *
     * _.sortedIndex([20, 30, 50], 40);
     * // => 2
     *
     * // using "_.pluck" callback shorthand
     * _.sortedIndex([{ 'x': 20 }, { 'x': 30 }, { 'x': 50 }], { 'x': 40 }, 'x');
     * // => 2
     *
     * var dict = {
     *   'wordToNumber': { 'twenty': 20, 'thirty': 30, 'fourty': 40, 'fifty': 50 }
     * };
     *
     * _.sortedIndex(['twenty', 'thirty', 'fifty'], 'fourty', function(word) {
     *   return dict.wordToNumber[word];
     * });
     * // => 2
     *
     * _.sortedIndex(['twenty', 'thirty', 'fifty'], 'fourty', function(word) {
     *   return this.wordToNumber[word];
     * }, dict);
     * // => 2
     */
    function sortedIndex(array, value, callback, thisArg) {
      var low = 0, high = array ? array.length : low;
      // explicitly reference `identity` for better inlining in Firefox
      callback = callback ? lodash.createCallback(callback, thisArg, 1) : identity;
      value = callback(value);
      while (low < high) {
        var mid = low + high >>> 1;
        callback(array[mid]) < value ? low = mid + 1 : high = mid;
      }
      return low;
    }
    /**
     * Creates an array of unique values, in order, of the provided arrays using
     * strict equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {...Array} [array] The arrays to inspect.
     * @returns {Array} Returns an array of combined values.
     * @example
     *
     * _.union([1, 2, 3], [5, 2, 1, 4], [2, 1]);
     * // => [1, 2, 3, 5, 4]
     */
    function union() {
      return baseUniq(baseFlatten(arguments, true, true));
    }
    /**
     * Creates a duplicate-value-free version of an array using strict equality
     * for comparisons, i.e. `===`. If the array is sorted, providing
     * `true` for `isSorted` will use a faster algorithm. If a callback is provided
     * each element of `array` is passed through the callback before uniqueness
     * is computed. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias unique
     * @category Arrays
     * @param {Array} array The array to process.
     * @param {boolean} [isSorted=false] A flag to indicate that `array` is sorted.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a duplicate-value-free array.
     * @example
     *
     * _.uniq([1, 2, 1, 3, 1]);
     * // => [1, 2, 3]
     *
     * _.uniq([1, 1, 2, 2, 3], true);
     * // => [1, 2, 3]
     *
     * _.uniq(['A', 'b', 'C', 'a', 'B', 'c'], function(letter) { return letter.toLowerCase(); });
     * // => ['A', 'b', 'C']
     *
     * _.uniq([1, 2.5, 3, 1.5, 2, 3.5], function(num) { return this.floor(num); }, Math);
     * // => [1, 2.5, 3]
     *
     * // using "_.pluck" callback shorthand
     * _.uniq([{ 'x': 1 }, { 'x': 2 }, { 'x': 1 }], 'x');
     * // => [{ 'x': 1 }, { 'x': 2 }]
     */
    function uniq(array, isSorted, callback, thisArg) {
      // juggle arguments
      if (typeof isSorted != 'boolean' && isSorted != null) {
        thisArg = callback;
        callback = typeof isSorted != 'function' && thisArg && thisArg[isSorted] === array ? null : isSorted;
        isSorted = false;
      }
      if (callback != null) {
        callback = lodash.createCallback(callback, thisArg, 3);
      }
      return baseUniq(array, isSorted, callback);
    }
    /**
     * Creates an array excluding all provided values using strict equality for
     * comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to filter.
     * @param {...*} [value] The values to exclude.
     * @returns {Array} Returns a new array of filtered values.
     * @example
     *
     * _.without([1, 2, 1, 0, 3, 1, 4], 0, 1);
     * // => [2, 3, 4]
     */
    function without(array) {
      return baseDifference(array, slice(arguments, 1));
    }
    /**
     * Creates an array that is the symmetric difference of the provided arrays.
     * See http://en.wikipedia.org/wiki/Symmetric_difference.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {...Array} [array] The arrays to inspect.
     * @returns {Array} Returns an array of values.
     * @example
     *
     * _.xor([1, 2, 3], [5, 2, 1, 4]);
     * // => [3, 5, 4]
     *
     * _.xor([1, 2, 5], [2, 3, 5], [3, 4, 5]);
     * // => [1, 4, 5]
     */
    function xor() {
      var index = -1, length = arguments.length;
      while (++index < length) {
        var array = arguments[index];
        if (isArray(array) || isArguments(array)) {
          var result = result ? baseUniq(baseDifference(result, array).concat(baseDifference(array, result))) : array;
        }
      }
      return result || [];
    }
    /**
     * Creates an array of grouped elements, the first of which contains the first
     * elements of the given arrays, the second of which contains the second
     * elements of the given arrays, and so on.
     *
     * @static
     * @memberOf _
     * @alias unzip
     * @category Arrays
     * @param {...Array} [array] Arrays to process.
     * @returns {Array} Returns a new array of grouped elements.
     * @example
     *
     * _.zip(['fred', 'barney'], [30, 40], [true, false]);
     * // => [['fred', 30, true], ['barney', 40, false]]
     */
    function zip() {
      var array = arguments.length > 1 ? arguments : arguments[0], index = -1, length = array ? max(pluck(array, 'length')) : 0, result = Array(length < 0 ? 0 : length);
      while (++index < length) {
        result[index] = pluck(array, index);
      }
      return result;
    }
    /**
     * Creates an object composed from arrays of `keys` and `values`. Provide
     * either a single two dimensional array, i.e. `[[key1, value1], [key2, value2]]`
     * or two arrays, one of `keys` and one of corresponding `values`.
     *
     * @static
     * @memberOf _
     * @alias object
     * @category Arrays
     * @param {Array} keys The array of keys.
     * @param {Array} [values=[]] The array of values.
     * @returns {Object} Returns an object composed of the given keys and
     *  corresponding values.
     * @example
     *
     * _.zipObject(['fred', 'barney'], [30, 40]);
     * // => { 'fred': 30, 'barney': 40 }
     */
    function zipObject(keys, values) {
      var index = -1, length = keys ? keys.length : 0, result = {};
      if (!values && length && !isArray(keys[0])) {
        values = [];
      }
      while (++index < length) {
        var key = keys[index];
        if (values) {
          result[key] = values[index];
        } else if (key) {
          result[key[0]] = key[1];
        }
      }
      return result;
    }
    /*--------------------------------------------------------------------------*/
    /**
     * Creates a function that executes `func`, with  the `this` binding and
     * arguments of the created function, only after being called `n` times.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {number} n The number of times the function must be called before
     *  `func` is executed.
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * var saves = ['profile', 'settings'];
     *
     * var done = _.after(saves.length, function() {
     *   console.log('Done saving!');
     * });
     *
     * _.forEach(saves, function(type) {
     *   asyncSave({ 'type': type, 'complete': done });
     * });
     * // => logs 'Done saving!', after all saves have completed
     */
    function after(n, func) {
      if (!isFunction(func)) {
        throw new TypeError();
      }
      return function () {
        if (--n < 1) {
          return func.apply(this, arguments);
        }
      };
    }
    /**
     * Creates a function that, when called, invokes `func` with the `this`
     * binding of `thisArg` and prepends any additional `bind` arguments to those
     * provided to the bound function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to bind.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new bound function.
     * @example
     *
     * var func = function(greeting) {
     *   return greeting + ' ' + this.name;
     * };
     *
     * func = _.bind(func, { 'name': 'fred' }, 'hi');
     * func();
     * // => 'hi fred'
     */
    function bind(func, thisArg) {
      return arguments.length > 2 ? createWrapper(func, 17, slice(arguments, 2), null, thisArg) : createWrapper(func, 1, null, null, thisArg);
    }
    /**
     * Binds methods of an object to the object itself, overwriting the existing
     * method. Method names may be specified as individual arguments or as arrays
     * of method names. If no method names are provided all the function properties
     * of `object` will be bound.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Object} object The object to bind and assign the bound methods to.
     * @param {...string} [methodName] The object method names to
     *  bind, specified as individual method names or arrays of method names.
     * @returns {Object} Returns `object`.
     * @example
     *
     * var view = {
     *   'label': 'docs',
     *   'onClick': function() { console.log('clicked ' + this.label); }
     * };
     *
     * _.bindAll(view);
     * jQuery('#docs').on('click', view.onClick);
     * // => logs 'clicked docs', when the button is clicked
     */
    function bindAll(object) {
      var funcs = arguments.length > 1 ? baseFlatten(arguments, true, false, 1) : functions(object), index = -1, length = funcs.length;
      while (++index < length) {
        var key = funcs[index];
        object[key] = createWrapper(object[key], 1, null, null, object);
      }
      return object;
    }
    /**
     * Creates a function that, when called, invokes the method at `object[key]`
     * and prepends any additional `bindKey` arguments to those provided to the bound
     * function. This method differs from `_.bind` by allowing bound functions to
     * reference methods that will be redefined or don't yet exist.
     * See http://michaux.ca/articles/lazy-function-definition-pattern.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Object} object The object the method belongs to.
     * @param {string} key The key of the method.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new bound function.
     * @example
     *
     * var object = {
     *   'name': 'fred',
     *   'greet': function(greeting) {
     *     return greeting + ' ' + this.name;
     *   }
     * };
     *
     * var func = _.bindKey(object, 'greet', 'hi');
     * func();
     * // => 'hi fred'
     *
     * object.greet = function(greeting) {
     *   return greeting + 'ya ' + this.name + '!';
     * };
     *
     * func();
     * // => 'hiya fred!'
     */
    function bindKey(object, key) {
      return arguments.length > 2 ? createWrapper(key, 19, slice(arguments, 2), null, object) : createWrapper(key, 3, null, null, object);
    }
    /**
     * Creates a function that is the composition of the provided functions,
     * where each function consumes the return value of the function that follows.
     * For example, composing the functions `f()`, `g()`, and `h()` produces `f(g(h()))`.
     * Each function is executed with the `this` binding of the composed function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {...Function} [func] Functions to compose.
     * @returns {Function} Returns the new composed function.
     * @example
     *
     * var realNameMap = {
     *   'pebbles': 'penelope'
     * };
     *
     * var format = function(name) {
     *   name = realNameMap[name.toLowerCase()] || name;
     *   return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
     * };
     *
     * var greet = function(formatted) {
     *   return 'Hiya ' + formatted + '!';
     * };
     *
     * var welcome = _.compose(greet, format);
     * welcome('pebbles');
     * // => 'Hiya Penelope!'
     */
    function compose() {
      var funcs = arguments, length = funcs.length;
      while (length--) {
        if (!isFunction(funcs[length])) {
          throw new TypeError();
        }
      }
      return function () {
        var args = arguments, length = funcs.length;
        while (length--) {
          args = [funcs[length].apply(this, args)];
        }
        return args[0];
      };
    }
    /**
     * Creates a function which accepts one or more arguments of `func` that when
     * invoked either executes `func` returning its result, if all `func` arguments
     * have been provided, or returns a function that accepts one or more of the
     * remaining `func` arguments, and so on. The arity of `func` can be specified
     * if `func.length` is not sufficient.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to curry.
     * @param {number} [arity=func.length] The arity of `func`.
     * @returns {Function} Returns the new curried function.
     * @example
     *
     * var curried = _.curry(function(a, b, c) {
     *   console.log(a + b + c);
     * });
     *
     * curried(1)(2)(3);
     * // => 6
     *
     * curried(1, 2)(3);
     * // => 6
     *
     * curried(1, 2, 3);
     * // => 6
     */
    function curry(func, arity) {
      arity = typeof arity == 'number' ? arity : +arity || func.length;
      return createWrapper(func, 4, null, null, null, arity);
    }
    /**
     * Creates a function that will delay the execution of `func` until after
     * `wait` milliseconds have elapsed since the last time it was invoked.
     * Provide an options object to indicate that `func` should be invoked on
     * the leading and/or trailing edge of the `wait` timeout. Subsequent calls
     * to the debounced function will return the result of the last `func` call.
     *
     * Note: If `leading` and `trailing` options are `true` `func` will be called
     * on the trailing edge of the timeout only if the the debounced function is
     * invoked more than once during the `wait` timeout.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to debounce.
     * @param {number} wait The number of milliseconds to delay.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.leading=false] Specify execution on the leading edge of the timeout.
     * @param {number} [options.maxWait] The maximum time `func` is allowed to be delayed before it's called.
     * @param {boolean} [options.trailing=true] Specify execution on the trailing edge of the timeout.
     * @returns {Function} Returns the new debounced function.
     * @example
     *
     * // avoid costly calculations while the window size is in flux
     * var lazyLayout = _.debounce(calculateLayout, 150);
     * jQuery(window).on('resize', lazyLayout);
     *
     * // execute `sendMail` when the click event is fired, debouncing subsequent calls
     * jQuery('#postbox').on('click', _.debounce(sendMail, 300, {
     *   'leading': true,
     *   'trailing': false
     * });
     *
     * // ensure `batchLog` is executed once after 1 second of debounced calls
     * var source = new EventSource('/stream');
     * source.addEventListener('message', _.debounce(batchLog, 250, {
     *   'maxWait': 1000
     * }, false);
     */
    function debounce(func, wait, options) {
      var args, maxTimeoutId, result, stamp, thisArg, timeoutId, trailingCall, lastCalled = 0, maxWait = false, trailing = true;
      if (!isFunction(func)) {
        throw new TypeError();
      }
      wait = nativeMax(0, wait) || 0;
      if (options === true) {
        var leading = true;
        trailing = false;
      } else if (isObject(options)) {
        leading = options.leading;
        maxWait = 'maxWait' in options && (nativeMax(wait, options.maxWait) || 0);
        trailing = 'trailing' in options ? options.trailing : trailing;
      }
      var delayed = function () {
        var remaining = wait - (now() - stamp);
        if (remaining <= 0) {
          if (maxTimeoutId) {
            clearTimeout(maxTimeoutId);
          }
          var isCalled = trailingCall;
          maxTimeoutId = timeoutId = trailingCall = undefined;
          if (isCalled) {
            lastCalled = now();
            result = func.apply(thisArg, args);
            if (!timeoutId && !maxTimeoutId) {
              args = thisArg = null;
            }
          }
        } else {
          timeoutId = setTimeout(delayed, remaining);
        }
      };
      var maxDelayed = function () {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        maxTimeoutId = timeoutId = trailingCall = undefined;
        if (trailing || maxWait !== wait) {
          lastCalled = now();
          result = func.apply(thisArg, args);
          if (!timeoutId && !maxTimeoutId) {
            args = thisArg = null;
          }
        }
      };
      return function () {
        args = arguments;
        stamp = now();
        thisArg = this;
        trailingCall = trailing && (timeoutId || !leading);
        if (maxWait === false) {
          var leadingCall = leading && !timeoutId;
        } else {
          if (!maxTimeoutId && !leading) {
            lastCalled = stamp;
          }
          var remaining = maxWait - (stamp - lastCalled), isCalled = remaining <= 0;
          if (isCalled) {
            if (maxTimeoutId) {
              maxTimeoutId = clearTimeout(maxTimeoutId);
            }
            lastCalled = stamp;
            result = func.apply(thisArg, args);
          } else if (!maxTimeoutId) {
            maxTimeoutId = setTimeout(maxDelayed, remaining);
          }
        }
        if (isCalled && timeoutId) {
          timeoutId = clearTimeout(timeoutId);
        } else if (!timeoutId && wait !== maxWait) {
          timeoutId = setTimeout(delayed, wait);
        }
        if (leadingCall) {
          isCalled = true;
          result = func.apply(thisArg, args);
        }
        if (isCalled && !timeoutId && !maxTimeoutId) {
          args = thisArg = null;
        }
        return result;
      };
    }
    /**
     * Defers executing the `func` function until the current call stack has cleared.
     * Additional arguments will be provided to `func` when it is invoked.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to defer.
     * @param {...*} [arg] Arguments to invoke the function with.
     * @returns {number} Returns the timer id.
     * @example
     *
     * _.defer(function(text) { console.log(text); }, 'deferred');
     * // logs 'deferred' after one or more milliseconds
     */
    function defer(func) {
      if (!isFunction(func)) {
        throw new TypeError();
      }
      var args = slice(arguments, 1);
      return setTimeout(function () {
        func.apply(undefined, args);
      }, 1);
    }
    /**
     * Executes the `func` function after `wait` milliseconds. Additional arguments
     * will be provided to `func` when it is invoked.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to delay.
     * @param {number} wait The number of milliseconds to delay execution.
     * @param {...*} [arg] Arguments to invoke the function with.
     * @returns {number} Returns the timer id.
     * @example
     *
     * _.delay(function(text) { console.log(text); }, 1000, 'later');
     * // => logs 'later' after one second
     */
    function delay(func, wait) {
      if (!isFunction(func)) {
        throw new TypeError();
      }
      var args = slice(arguments, 2);
      return setTimeout(function () {
        func.apply(undefined, args);
      }, wait);
    }
    /**
     * Creates a function that memoizes the result of `func`. If `resolver` is
     * provided it will be used to determine the cache key for storing the result
     * based on the arguments provided to the memoized function. By default, the
     * first argument provided to the memoized function is used as the cache key.
     * The `func` is executed with the `this` binding of the memoized function.
     * The result cache is exposed as the `cache` property on the memoized function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to have its output memoized.
     * @param {Function} [resolver] A function used to resolve the cache key.
     * @returns {Function} Returns the new memoizing function.
     * @example
     *
     * var fibonacci = _.memoize(function(n) {
     *   return n < 2 ? n : fibonacci(n - 1) + fibonacci(n - 2);
     * });
     *
     * fibonacci(9)
     * // => 34
     *
     * var data = {
     *   'fred': { 'name': 'fred', 'age': 40 },
     *   'pebbles': { 'name': 'pebbles', 'age': 1 }
     * };
     *
     * // modifying the result cache
     * var get = _.memoize(function(name) { return data[name]; }, _.identity);
     * get('pebbles');
     * // => { 'name': 'pebbles', 'age': 1 }
     *
     * get.cache.pebbles.name = 'penelope';
     * get('pebbles');
     * // => { 'name': 'penelope', 'age': 1 }
     */
    function memoize(func, resolver) {
      if (!isFunction(func)) {
        throw new TypeError();
      }
      var memoized = function () {
        var cache = memoized.cache, key = resolver ? resolver.apply(this, arguments) : keyPrefix + arguments[0];
        return hasOwnProperty.call(cache, key) ? cache[key] : cache[key] = func.apply(this, arguments);
      };
      memoized.cache = {};
      return memoized;
    }
    /**
     * Creates a function that is restricted to execute `func` once. Repeat calls to
     * the function will return the value of the first call. The `func` is executed
     * with the `this` binding of the created function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * var initialize = _.once(createApplication);
     * initialize();
     * initialize();
     * // `initialize` executes `createApplication` once
     */
    function once(func) {
      var ran, result;
      if (!isFunction(func)) {
        throw new TypeError();
      }
      return function () {
        if (ran) {
          return result;
        }
        ran = true;
        result = func.apply(this, arguments);
        // clear the `func` variable so the function may be garbage collected
        func = null;
        return result;
      };
    }
    /**
     * Creates a function that, when called, invokes `func` with any additional
     * `partial` arguments prepended to those provided to the new function. This
     * method is similar to `_.bind` except it does **not** alter the `this` binding.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to partially apply arguments to.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new partially applied function.
     * @example
     *
     * var greet = function(greeting, name) { return greeting + ' ' + name; };
     * var hi = _.partial(greet, 'hi');
     * hi('fred');
     * // => 'hi fred'
     */
    function partial(func) {
      return createWrapper(func, 16, slice(arguments, 1));
    }
    /**
     * This method is like `_.partial` except that `partial` arguments are
     * appended to those provided to the new function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to partially apply arguments to.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new partially applied function.
     * @example
     *
     * var defaultsDeep = _.partialRight(_.merge, _.defaults);
     *
     * var options = {
     *   'variable': 'data',
     *   'imports': { 'jq': $ }
     * };
     *
     * defaultsDeep(options, _.templateSettings);
     *
     * options.variable
     * // => 'data'
     *
     * options.imports
     * // => { '_': _, 'jq': $ }
     */
    function partialRight(func) {
      return createWrapper(func, 32, null, slice(arguments, 1));
    }
    /**
     * Creates a function that, when executed, will only call the `func` function
     * at most once per every `wait` milliseconds. Provide an options object to
     * indicate that `func` should be invoked on the leading and/or trailing edge
     * of the `wait` timeout. Subsequent calls to the throttled function will
     * return the result of the last `func` call.
     *
     * Note: If `leading` and `trailing` options are `true` `func` will be called
     * on the trailing edge of the timeout only if the the throttled function is
     * invoked more than once during the `wait` timeout.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to throttle.
     * @param {number} wait The number of milliseconds to throttle executions to.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.leading=true] Specify execution on the leading edge of the timeout.
     * @param {boolean} [options.trailing=true] Specify execution on the trailing edge of the timeout.
     * @returns {Function} Returns the new throttled function.
     * @example
     *
     * // avoid excessively updating the position while scrolling
     * var throttled = _.throttle(updatePosition, 100);
     * jQuery(window).on('scroll', throttled);
     *
     * // execute `renewToken` when the click event is fired, but not more than once every 5 minutes
     * jQuery('.interactive').on('click', _.throttle(renewToken, 300000, {
     *   'trailing': false
     * }));
     */
    function throttle(func, wait, options) {
      var leading = true, trailing = true;
      if (!isFunction(func)) {
        throw new TypeError();
      }
      if (options === false) {
        leading = false;
      } else if (isObject(options)) {
        leading = 'leading' in options ? options.leading : leading;
        trailing = 'trailing' in options ? options.trailing : trailing;
      }
      debounceOptions.leading = leading;
      debounceOptions.maxWait = wait;
      debounceOptions.trailing = trailing;
      return debounce(func, wait, debounceOptions);
    }
    /**
     * Creates a function that provides `value` to the wrapper function as its
     * first argument. Additional arguments provided to the function are appended
     * to those provided to the wrapper function. The wrapper is executed with
     * the `this` binding of the created function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {*} value The value to wrap.
     * @param {Function} wrapper The wrapper function.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var p = _.wrap(_.escape, function(func, text) {
     *   return '<p>' + func(text) + '</p>';
     * });
     *
     * p('Fred, Wilma, & Pebbles');
     * // => '<p>Fred, Wilma, &amp; Pebbles</p>'
     */
    function wrap(value, wrapper) {
      return createWrapper(wrapper, 16, [value]);
    }
    /*--------------------------------------------------------------------------*/
    /**
     * Creates a function that returns `value`.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {*} value The value to return from the new function.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var object = { 'name': 'fred' };
     * var getter = _.constant(object);
     * getter() === object;
     * // => true
     */
    function constant(value) {
      return function () {
        return value;
      };
    }
    /**
     * Produces a callback bound to an optional `thisArg`. If `func` is a property
     * name the created callback will return the property value for a given element.
     * If `func` is an object the created callback will return `true` for elements
     * that contain the equivalent object properties, otherwise it will return `false`.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {*} [func=identity] The value to convert to a callback.
     * @param {*} [thisArg] The `this` binding of the created callback.
     * @param {number} [argCount] The number of arguments the callback accepts.
     * @returns {Function} Returns a callback function.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // wrap to create custom callback shorthands
     * _.createCallback = _.wrap(_.createCallback, function(func, callback, thisArg) {
     *   var match = /^(.+?)__([gl]t)(.+)$/.exec(callback);
     *   return !match ? func(callback, thisArg) : function(object) {
     *     return match[2] == 'gt' ? object[match[1]] > match[3] : object[match[1]] < match[3];
     *   };
     * });
     *
     * _.filter(characters, 'age__gt38');
     * // => [{ 'name': 'fred', 'age': 40 }]
     */
    function createCallback(func, thisArg, argCount) {
      var type = typeof func;
      if (func == null || type == 'function') {
        return baseCreateCallback(func, thisArg, argCount);
      }
      // handle "_.pluck" style callback shorthands
      if (type != 'object') {
        return property(func);
      }
      var props = keys(func), key = props[0], a = func[key];
      // handle "_.where" style callback shorthands
      if (props.length == 1 && a === a && !isObject(a)) {
        // fast path the common case of providing an object with a single
        // property containing a primitive value
        return function (object) {
          var b = object[key];
          return a === b && (a !== 0 || 1 / a == 1 / b);
        };
      }
      return function (object) {
        var length = props.length, result = false;
        while (length--) {
          if (!(result = baseIsEqual(object[props[length]], func[props[length]], null, true))) {
            break;
          }
        }
        return result;
      };
    }
    /**
     * Converts the characters `&`, `<`, `>`, `"`, and `'` in `string` to their
     * corresponding HTML entities.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} string The string to escape.
     * @returns {string} Returns the escaped string.
     * @example
     *
     * _.escape('Fred, Wilma, & Pebbles');
     * // => 'Fred, Wilma, &amp; Pebbles'
     */
    function escape(string) {
      return string == null ? '' : String(string).replace(reUnescapedHtml, escapeHtmlChar);
    }
    /**
     * This method returns the first argument provided to it.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {*} value Any value.
     * @returns {*} Returns `value`.
     * @example
     *
     * var object = { 'name': 'fred' };
     * _.identity(object) === object;
     * // => true
     */
    function identity(value) {
      return value;
    }
    /**
     * Adds function properties of a source object to the destination object.
     * If `object` is a function methods will be added to its prototype as well.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {Function|Object} [object=lodash] object The destination object.
     * @param {Object} source The object of functions to add.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.chain=true] Specify whether the functions added are chainable.
     * @example
     *
     * function capitalize(string) {
     *   return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
     * }
     *
     * _.mixin({ 'capitalize': capitalize });
     * _.capitalize('fred');
     * // => 'Fred'
     *
     * _('fred').capitalize().value();
     * // => 'Fred'
     *
     * _.mixin({ 'capitalize': capitalize }, { 'chain': false });
     * _('fred').capitalize();
     * // => 'Fred'
     */
    function mixin(object, source, options) {
      var chain = true, methodNames = source && functions(source);
      if (!source || !options && !methodNames.length) {
        if (options == null) {
          options = source;
        }
        ctor = lodashWrapper;
        source = object;
        object = lodash;
        methodNames = functions(source);
      }
      if (options === false) {
        chain = false;
      } else if (isObject(options) && 'chain' in options) {
        chain = options.chain;
      }
      var ctor = object, isFunc = isFunction(ctor);
      forEach(methodNames, function (methodName) {
        var func = object[methodName] = source[methodName];
        if (isFunc) {
          ctor.prototype[methodName] = function () {
            var chainAll = this.__chain__, value = this.__wrapped__, args = [value];
            push.apply(args, arguments);
            var result = func.apply(object, args);
            if (chain || chainAll) {
              if (value === result && isObject(result)) {
                return this;
              }
              result = new ctor(result);
              result.__chain__ = chainAll;
            }
            return result;
          };
        }
      });
    }
    /**
     * Reverts the '_' variable to its previous value and returns a reference to
     * the `lodash` function.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @returns {Function} Returns the `lodash` function.
     * @example
     *
     * var lodash = _.noConflict();
     */
    function noConflict() {
      context._ = oldDash;
      return this;
    }
    /**
     * A no-operation function.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @example
     *
     * var object = { 'name': 'fred' };
     * _.noop(object) === undefined;
     * // => true
     */
    function noop() {
    }
    /**
     * Gets the number of milliseconds that have elapsed since the Unix epoch
     * (1 January 1970 00:00:00 UTC).
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @example
     *
     * var stamp = _.now();
     * _.defer(function() { console.log(_.now() - stamp); });
     * // => logs the number of milliseconds it took for the deferred function to be called
     */
    var now = isNative(now = Date.now) && now || function () {
        return new Date().getTime();
      };
    /**
     * Converts the given value into an integer of the specified radix.
     * If `radix` is `undefined` or `0` a `radix` of `10` is used unless the
     * `value` is a hexadecimal, in which case a `radix` of `16` is used.
     *
     * Note: This method avoids differences in native ES3 and ES5 `parseInt`
     * implementations. See http://es5.github.io/#E.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} value The value to parse.
     * @param {number} [radix] The radix used to interpret the value to parse.
     * @returns {number} Returns the new integer value.
     * @example
     *
     * _.parseInt('08');
     * // => 8
     */
    var parseInt = nativeParseInt(whitespace + '08') == 8 ? nativeParseInt : function (value, radix) {
        // Firefox < 21 and Opera < 15 follow the ES3 specified implementation of `parseInt`
        return nativeParseInt(isString(value) ? value.replace(reLeadingSpacesAndZeros, '') : value, radix || 0);
      };
    /**
     * Creates a "_.pluck" style function, which returns the `key` value of a
     * given object.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} key The name of the property to retrieve.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var characters = [
     *   { 'name': 'fred',   'age': 40 },
     *   { 'name': 'barney', 'age': 36 }
     * ];
     *
     * var getName = _.property('name');
     *
     * _.map(characters, getName);
     * // => ['barney', 'fred']
     *
     * _.sortBy(characters, getName);
     * // => [{ 'name': 'barney', 'age': 36 }, { 'name': 'fred',   'age': 40 }]
     */
    function property(key) {
      return function (object) {
        return object[key];
      };
    }
    /**
     * Produces a random number between `min` and `max` (inclusive). If only one
     * argument is provided a number between `0` and the given number will be
     * returned. If `floating` is truey or either `min` or `max` are floats a
     * floating-point number will be returned instead of an integer.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {number} [min=0] The minimum possible value.
     * @param {number} [max=1] The maximum possible value.
     * @param {boolean} [floating=false] Specify returning a floating-point number.
     * @returns {number} Returns a random number.
     * @example
     *
     * _.random(0, 5);
     * // => an integer between 0 and 5
     *
     * _.random(5);
     * // => also an integer between 0 and 5
     *
     * _.random(5, true);
     * // => a floating-point number between 0 and 5
     *
     * _.random(1.2, 5.2);
     * // => a floating-point number between 1.2 and 5.2
     */
    function random(min, max, floating) {
      var noMin = min == null, noMax = max == null;
      if (floating == null) {
        if (typeof min == 'boolean' && noMax) {
          floating = min;
          min = 1;
        } else if (!noMax && typeof max == 'boolean') {
          floating = max;
          noMax = true;
        }
      }
      if (noMin && noMax) {
        max = 1;
      }
      min = +min || 0;
      if (noMax) {
        max = min;
        min = 0;
      } else {
        max = +max || 0;
      }
      if (floating || min % 1 || max % 1) {
        var rand = nativeRandom();
        return nativeMin(min + rand * (max - min + parseFloat('1e-' + ((rand + '').length - 1))), max);
      }
      return baseRandom(min, max);
    }
    /**
     * Resolves the value of property `key` on `object`. If `key` is a function
     * it will be invoked with the `this` binding of `object` and its result returned,
     * else the property value is returned. If `object` is falsey then `undefined`
     * is returned.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {Object} object The object to inspect.
     * @param {string} key The name of the property to resolve.
     * @returns {*} Returns the resolved value.
     * @example
     *
     * var object = {
     *   'cheese': 'crumpets',
     *   'stuff': function() {
     *     return 'nonsense';
     *   }
     * };
     *
     * _.result(object, 'cheese');
     * // => 'crumpets'
     *
     * _.result(object, 'stuff');
     * // => 'nonsense'
     */
    function result(object, key) {
      if (object) {
        var value = object[key];
        return isFunction(value) ? object[key]() : value;
      }
    }
    /**
     * A micro-templating method that handles arbitrary delimiters, preserves
     * whitespace, and correctly escapes quotes within interpolated code.
     *
     * Note: In the development build, `_.template` utilizes sourceURLs for easier
     * debugging. See http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl
     *
     * For more information on precompiling templates see:
     * http://lodash.com/custom-builds
     *
     * For more information on Chrome extension sandboxes see:
     * http://developer.chrome.com/stable/extensions/sandboxingEval.html
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} text The template text.
     * @param {Object} data The data object used to populate the text.
     * @param {Object} [options] The options object.
     * @param {RegExp} [options.escape] The "escape" delimiter.
     * @param {RegExp} [options.evaluate] The "evaluate" delimiter.
     * @param {Object} [options.imports] An object to import into the template as local variables.
     * @param {RegExp} [options.interpolate] The "interpolate" delimiter.
     * @param {string} [sourceURL] The sourceURL of the template's compiled source.
     * @param {string} [variable] The data object variable name.
     * @returns {Function|string} Returns a compiled function when no `data` object
     *  is given, else it returns the interpolated text.
     * @example
     *
     * // using the "interpolate" delimiter to create a compiled template
     * var compiled = _.template('hello <%= name %>');
     * compiled({ 'name': 'fred' });
     * // => 'hello fred'
     *
     * // using the "escape" delimiter to escape HTML in data property values
     * _.template('<b><%- value %></b>', { 'value': '<script>' });
     * // => '<b>&lt;script&gt;</b>'
     *
     * // using the "evaluate" delimiter to generate HTML
     * var list = '<% _.forEach(people, function(name) { %><li><%- name %></li><% }); %>';
     * _.template(list, { 'people': ['fred', 'barney'] });
     * // => '<li>fred</li><li>barney</li>'
     *
     * // using the ES6 delimiter as an alternative to the default "interpolate" delimiter
     * _.template('hello ${ name }', { 'name': 'pebbles' });
     * // => 'hello pebbles'
     *
     * // using the internal `print` function in "evaluate" delimiters
     * _.template('<% print("hello " + name); %>!', { 'name': 'barney' });
     * // => 'hello barney!'
     *
     * // using a custom template delimiters
     * _.templateSettings = {
     *   'interpolate': /{{([\s\S]+?)}}/g
     * };
     *
     * _.template('hello {{ name }}!', { 'name': 'mustache' });
     * // => 'hello mustache!'
     *
     * // using the `imports` option to import jQuery
     * var list = '<% jq.each(people, function(name) { %><li><%- name %></li><% }); %>';
     * _.template(list, { 'people': ['fred', 'barney'] }, { 'imports': { 'jq': jQuery } });
     * // => '<li>fred</li><li>barney</li>'
     *
     * // using the `sourceURL` option to specify a custom sourceURL for the template
     * var compiled = _.template('hello <%= name %>', null, { 'sourceURL': '/basic/greeting.jst' });
     * compiled(data);
     * // => find the source of "greeting.jst" under the Sources tab or Resources panel of the web inspector
     *
     * // using the `variable` option to ensure a with-statement isn't used in the compiled template
     * var compiled = _.template('hi <%= data.name %>!', null, { 'variable': 'data' });
     * compiled.source;
     * // => function(data) {
     *   var __t, __p = '', __e = _.escape;
     *   __p += 'hi ' + ((__t = ( data.name )) == null ? '' : __t) + '!';
     *   return __p;
     * }
     *
     * // using the `source` property to inline compiled templates for meaningful
     * // line numbers in error messages and a stack trace
     * fs.writeFileSync(path.join(cwd, 'jst.js'), '\
     *   var JST = {\
     *     "main": ' + _.template(mainText).source + '\
     *   };\
     * ');
     */
    function template(text, data, options) {
      // based on John Resig's `tmpl` implementation
      // http://ejohn.org/blog/javascript-micro-templating/
      // and Laura Doktorova's doT.js
      // https://github.com/olado/doT
      var settings = lodash.templateSettings;
      text = String(text || '');
      // avoid missing dependencies when `iteratorTemplate` is not defined
      options = defaults({}, options, settings);
      var imports = defaults({}, options.imports, settings.imports), importsKeys = keys(imports), importsValues = values(imports);
      var isEvaluating, index = 0, interpolate = options.interpolate || reNoMatch, source = '__p += \'';
      // compile the regexp to match each delimiter
      var reDelimiters = RegExp((options.escape || reNoMatch).source + '|' + interpolate.source + '|' + (interpolate === reInterpolate ? reEsTemplate : reNoMatch).source + '|' + (options.evaluate || reNoMatch).source + '|$', 'g');
      text.replace(reDelimiters, function (match, escapeValue, interpolateValue, esTemplateValue, evaluateValue, offset) {
        interpolateValue || (interpolateValue = esTemplateValue);
        // escape characters that cannot be included in string literals
        source += text.slice(index, offset).replace(reUnescapedString, escapeStringChar);
        // replace delimiters with snippets
        if (escapeValue) {
          source += '\' +\n__e(' + escapeValue + ') +\n\'';
        }
        if (evaluateValue) {
          isEvaluating = true;
          source += '\';\n' + evaluateValue + ';\n__p += \'';
        }
        if (interpolateValue) {
          source += '\' +\n((__t = (' + interpolateValue + ')) == null ? \'\' : __t) +\n\'';
        }
        index = offset + match.length;
        // the JS engine embedded in Adobe products requires returning the `match`
        // string in order to produce the correct `offset` value
        return match;
      });
      source += '\';\n';
      // if `variable` is not specified, wrap a with-statement around the generated
      // code to add the data object to the top of the scope chain
      var variable = options.variable, hasVariable = variable;
      if (!hasVariable) {
        variable = 'obj';
        source = 'with (' + variable + ') {\n' + source + '\n}\n';
      }
      // cleanup code by stripping empty strings
      source = (isEvaluating ? source.replace(reEmptyStringLeading, '') : source).replace(reEmptyStringMiddle, '$1').replace(reEmptyStringTrailing, '$1;');
      // frame code as the function body
      source = 'function(' + variable + ') {\n' + (hasVariable ? '' : variable + ' || (' + variable + ' = {});\n') + 'var __t, __p = \'\', __e = _.escape' + (isEvaluating ? ', __j = Array.prototype.join;\n' + 'function print() { __p += __j.call(arguments, \'\') }\n' : ';\n') + source + 'return __p\n}';
      // Use a sourceURL for easier debugging.
      // http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl
      var sourceURL = '\n/*\n//# sourceURL=' + (options.sourceURL || '/lodash/template/source[' + templateCounter++ + ']') + '\n*/';
      try {
        var result = Function(importsKeys, 'return ' + source + sourceURL).apply(undefined, importsValues);
      } catch (e) {
        e.source = source;
        throw e;
      }
      if (data) {
        return result(data);
      }
      // provide the compiled function's source by its `toString` method, in
      // supported environments, or the `source` property as a convenience for
      // inlining compiled templates during the build process
      result.source = source;
      return result;
    }
    /**
     * Executes the callback `n` times, returning an array of the results
     * of each callback execution. The callback is bound to `thisArg` and invoked
     * with one argument; (index).
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {number} n The number of times to execute the callback.
     * @param {Function} callback The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns an array of the results of each `callback` execution.
     * @example
     *
     * var diceRolls = _.times(3, _.partial(_.random, 1, 6));
     * // => [3, 6, 4]
     *
     * _.times(3, function(n) { mage.castSpell(n); });
     * // => calls `mage.castSpell(n)` three times, passing `n` of `0`, `1`, and `2` respectively
     *
     * _.times(3, function(n) { this.cast(n); }, mage);
     * // => also calls `mage.castSpell(n)` three times
     */
    function times(n, callback, thisArg) {
      n = (n = +n) > -1 ? n : 0;
      var index = -1, result = Array(n);
      callback = baseCreateCallback(callback, thisArg, 1);
      while (++index < n) {
        result[index] = callback(index);
      }
      return result;
    }
    /**
     * The inverse of `_.escape` this method converts the HTML entities
     * `&amp;`, `&lt;`, `&gt;`, `&quot;`, and `&#39;` in `string` to their
     * corresponding characters.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} string The string to unescape.
     * @returns {string} Returns the unescaped string.
     * @example
     *
     * _.unescape('Fred, Barney &amp; Pebbles');
     * // => 'Fred, Barney & Pebbles'
     */
    function unescape(string) {
      return string == null ? '' : String(string).replace(reEscapedHtml, unescapeHtmlChar);
    }
    /**
     * Generates a unique ID. If `prefix` is provided the ID will be appended to it.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} [prefix] The value to prefix the ID with.
     * @returns {string} Returns the unique ID.
     * @example
     *
     * _.uniqueId('contact_');
     * // => 'contact_104'
     *
     * _.uniqueId();
     * // => '105'
     */
    function uniqueId(prefix) {
      var id = ++idCounter;
      return String(prefix == null ? '' : prefix) + id;
    }
    /*--------------------------------------------------------------------------*/
    /**
     * Creates a `lodash` object that wraps the given value with explicit
     * method chaining enabled.
     *
     * @static
     * @memberOf _
     * @category Chaining
     * @param {*} value The value to wrap.
     * @returns {Object} Returns the wrapper object.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36 },
     *   { 'name': 'fred',    'age': 40 },
     *   { 'name': 'pebbles', 'age': 1 }
     * ];
     *
     * var youngest = _.chain(characters)
     *     .sortBy('age')
     *     .map(function(chr) { return chr.name + ' is ' + chr.age; })
     *     .first()
     *     .value();
     * // => 'pebbles is 1'
     */
    function chain(value) {
      value = new lodashWrapper(value);
      value.__chain__ = true;
      return value;
    }
    /**
     * Invokes `interceptor` with the `value` as the first argument and then
     * returns `value`. The purpose of this method is to "tap into" a method
     * chain in order to perform operations on intermediate results within
     * the chain.
     *
     * @static
     * @memberOf _
     * @category Chaining
     * @param {*} value The value to provide to `interceptor`.
     * @param {Function} interceptor The function to invoke.
     * @returns {*} Returns `value`.
     * @example
     *
     * _([1, 2, 3, 4])
     *  .tap(function(array) { array.pop(); })
     *  .reverse()
     *  .value();
     * // => [3, 2, 1]
     */
    function tap(value, interceptor) {
      interceptor(value);
      return value;
    }
    /**
     * Enables explicit method chaining on the wrapper object.
     *
     * @name chain
     * @memberOf _
     * @category Chaining
     * @returns {*} Returns the wrapper object.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // without explicit chaining
     * _(characters).first();
     * // => { 'name': 'barney', 'age': 36 }
     *
     * // with explicit chaining
     * _(characters).chain()
     *   .first()
     *   .pick('age')
     *   .value();
     * // => { 'age': 36 }
     */
    function wrapperChain() {
      this.__chain__ = true;
      return this;
    }
    /**
     * Produces the `toString` result of the wrapped value.
     *
     * @name toString
     * @memberOf _
     * @category Chaining
     * @returns {string} Returns the string result.
     * @example
     *
     * _([1, 2, 3]).toString();
     * // => '1,2,3'
     */
    function wrapperToString() {
      return String(this.__wrapped__);
    }
    /**
     * Extracts the wrapped value.
     *
     * @name valueOf
     * @memberOf _
     * @alias value
     * @category Chaining
     * @returns {*} Returns the wrapped value.
     * @example
     *
     * _([1, 2, 3]).valueOf();
     * // => [1, 2, 3]
     */
    function wrapperValueOf() {
      return this.__wrapped__;
    }
    /*--------------------------------------------------------------------------*/
    // add functions that return wrapped values when chaining
    lodash.after = after;
    lodash.assign = assign;
    lodash.at = at;
    lodash.bind = bind;
    lodash.bindAll = bindAll;
    lodash.bindKey = bindKey;
    lodash.chain = chain;
    lodash.compact = compact;
    lodash.compose = compose;
    lodash.constant = constant;
    lodash.countBy = countBy;
    lodash.create = create;
    lodash.createCallback = createCallback;
    lodash.curry = curry;
    lodash.debounce = debounce;
    lodash.defaults = defaults;
    lodash.defer = defer;
    lodash.delay = delay;
    lodash.difference = difference;
    lodash.filter = filter;
    lodash.flatten = flatten;
    lodash.forEach = forEach;
    lodash.forEachRight = forEachRight;
    lodash.forIn = forIn;
    lodash.forInRight = forInRight;
    lodash.forOwn = forOwn;
    lodash.forOwnRight = forOwnRight;
    lodash.functions = functions;
    lodash.groupBy = groupBy;
    lodash.indexBy = indexBy;
    lodash.initial = initial;
    lodash.intersection = intersection;
    lodash.invert = invert;
    lodash.invoke = invoke;
    lodash.keys = keys;
    lodash.map = map;
    lodash.mapValues = mapValues;
    lodash.max = max;
    lodash.memoize = memoize;
    lodash.merge = merge;
    lodash.min = min;
    lodash.omit = omit;
    lodash.once = once;
    lodash.pairs = pairs;
    lodash.partial = partial;
    lodash.partialRight = partialRight;
    lodash.pick = pick;
    lodash.pluck = pluck;
    lodash.property = property;
    lodash.pull = pull;
    lodash.range = range;
    lodash.reject = reject;
    lodash.remove = remove;
    lodash.rest = rest;
    lodash.shuffle = shuffle;
    lodash.sortBy = sortBy;
    lodash.tap = tap;
    lodash.throttle = throttle;
    lodash.times = times;
    lodash.toArray = toArray;
    lodash.transform = transform;
    lodash.union = union;
    lodash.uniq = uniq;
    lodash.values = values;
    lodash.where = where;
    lodash.without = without;
    lodash.wrap = wrap;
    lodash.xor = xor;
    lodash.zip = zip;
    lodash.zipObject = zipObject;
    // add aliases
    lodash.collect = map;
    lodash.drop = rest;
    lodash.each = forEach;
    lodash.eachRight = forEachRight;
    lodash.extend = assign;
    lodash.methods = functions;
    lodash.object = zipObject;
    lodash.select = filter;
    lodash.tail = rest;
    lodash.unique = uniq;
    lodash.unzip = zip;
    // add functions to `lodash.prototype`
    mixin(lodash);
    /*--------------------------------------------------------------------------*/
    // add functions that return unwrapped values when chaining
    lodash.clone = clone;
    lodash.cloneDeep = cloneDeep;
    lodash.contains = contains;
    lodash.escape = escape;
    lodash.every = every;
    lodash.find = find;
    lodash.findIndex = findIndex;
    lodash.findKey = findKey;
    lodash.findLast = findLast;
    lodash.findLastIndex = findLastIndex;
    lodash.findLastKey = findLastKey;
    lodash.has = has;
    lodash.identity = identity;
    lodash.indexOf = indexOf;
    lodash.isArguments = isArguments;
    lodash.isArray = isArray;
    lodash.isBoolean = isBoolean;
    lodash.isDate = isDate;
    lodash.isElement = isElement;
    lodash.isEmpty = isEmpty;
    lodash.isEqual = isEqual;
    lodash.isFinite = isFinite;
    lodash.isFunction = isFunction;
    lodash.isNaN = isNaN;
    lodash.isNull = isNull;
    lodash.isNumber = isNumber;
    lodash.isObject = isObject;
    lodash.isPlainObject = isPlainObject;
    lodash.isRegExp = isRegExp;
    lodash.isString = isString;
    lodash.isUndefined = isUndefined;
    lodash.lastIndexOf = lastIndexOf;
    lodash.mixin = mixin;
    lodash.noConflict = noConflict;
    lodash.noop = noop;
    lodash.now = now;
    lodash.parseInt = parseInt;
    lodash.random = random;
    lodash.reduce = reduce;
    lodash.reduceRight = reduceRight;
    lodash.result = result;
    lodash.runInContext = runInContext;
    lodash.size = size;
    lodash.some = some;
    lodash.sortedIndex = sortedIndex;
    lodash.template = template;
    lodash.unescape = unescape;
    lodash.uniqueId = uniqueId;
    // add aliases
    lodash.all = every;
    lodash.any = some;
    lodash.detect = find;
    lodash.findWhere = find;
    lodash.foldl = reduce;
    lodash.foldr = reduceRight;
    lodash.include = contains;
    lodash.inject = reduce;
    mixin(function () {
      var source = {};
      forOwn(lodash, function (func, methodName) {
        if (!lodash.prototype[methodName]) {
          source[methodName] = func;
        }
      });
      return source;
    }(), false);
    /*--------------------------------------------------------------------------*/
    // add functions capable of returning wrapped and unwrapped values when chaining
    lodash.first = first;
    lodash.last = last;
    lodash.sample = sample;
    // add aliases
    lodash.take = first;
    lodash.head = first;
    forOwn(lodash, function (func, methodName) {
      var callbackable = methodName !== 'sample';
      if (!lodash.prototype[methodName]) {
        lodash.prototype[methodName] = function (n, guard) {
          var chainAll = this.__chain__, result = func(this.__wrapped__, n, guard);
          return !chainAll && (n == null || guard && !(callbackable && typeof n == 'function')) ? result : new lodashWrapper(result, chainAll);
        };
      }
    });
    /*--------------------------------------------------------------------------*/
    /**
     * The semantic version number.
     *
     * @static
     * @memberOf _
     * @type string
     */
    lodash.VERSION = '2.4.1';
    // add "Chaining" functions to the wrapper
    lodash.prototype.chain = wrapperChain;
    lodash.prototype.toString = wrapperToString;
    lodash.prototype.value = wrapperValueOf;
    lodash.prototype.valueOf = wrapperValueOf;
    // add `Array` functions that return unwrapped values
    forEach([
      'join',
      'pop',
      'shift'
    ], function (methodName) {
      var func = arrayRef[methodName];
      lodash.prototype[methodName] = function () {
        var chainAll = this.__chain__, result = func.apply(this.__wrapped__, arguments);
        return chainAll ? new lodashWrapper(result, chainAll) : result;
      };
    });
    // add `Array` functions that return the existing wrapped value
    forEach([
      'push',
      'reverse',
      'sort',
      'unshift'
    ], function (methodName) {
      var func = arrayRef[methodName];
      lodash.prototype[methodName] = function () {
        func.apply(this.__wrapped__, arguments);
        return this;
      };
    });
    // add `Array` functions that return new wrapped values
    forEach([
      'concat',
      'slice',
      'splice'
    ], function (methodName) {
      var func = arrayRef[methodName];
      lodash.prototype[methodName] = function () {
        return new lodashWrapper(func.apply(this.__wrapped__, arguments), this.__chain__);
      };
    });
    return lodash;
  }
  /*--------------------------------------------------------------------------*/
  // expose Lo-Dash
  var _ = runInContext();
  // some AMD build optimizers like r.js check for condition patterns like the following:
  if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
    // Expose Lo-Dash to the global object even when an AMD loader is present in
    // case Lo-Dash is loaded with a RequireJS shim config.
    // See http://requirejs.org/docs/api.html#config-shim
    root._ = _;
    // define as an anonymous module so, through path mapping, it can be
    // referenced as the "underscore" module
    define(function () {
      return _;
    });
  }  // check for `exports` after `define` in case a build optimizer adds an `exports` object
  else if (freeExports && freeModule) {
    // in Node.js or RingoJS
    if (moduleExports) {
      (freeModule.exports = _)._ = _;
    }  // in Narwhal or Rhino -require
    else {
      freeExports._ = _;
    }
  } else {
    // in a browser or Rhino
    root._ = _;
  }
}.call(this));//! moment.js
//! version : 2.8.3
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com
(function (undefined) {
  /************************************
        Constants
    ************************************/
  var moment, VERSION = '2.8.3',
    // the global-scope this is NOT the global object in Node.js
    globalScope = typeof global !== 'undefined' ? global : this, oldGlobalMoment, round = Math.round, hasOwnProperty = Object.prototype.hasOwnProperty, i, YEAR = 0, MONTH = 1, DATE = 2, HOUR = 3, MINUTE = 4, SECOND = 5, MILLISECOND = 6,
    // internal storage for locale config files
    locales = {},
    // extra moment internal properties (plugins register props here)
    momentProperties = [],
    // check for nodeJS
    hasModule = typeof module !== 'undefined' && module.exports,
    // ASP.NET json date format regex
    aspNetJsonRegex = /^\/?Date\((\-?\d+)/i, aspNetTimeSpanJsonRegex = /(\-)?(?:(\d*)\.)?(\d+)\:(\d+)(?:\:(\d+)\.?(\d{3})?)?/,
    // from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
    // somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
    isoDurationRegex = /^(-)?P(?:(?:([0-9,.]*)Y)?(?:([0-9,.]*)M)?(?:([0-9,.]*)D)?(?:T(?:([0-9,.]*)H)?(?:([0-9,.]*)M)?(?:([0-9,.]*)S)?)?|([0-9,.]*)W)$/,
    // format tokens
    formattingTokens = /(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Q|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|mm?|ss?|S{1,4}|X|zz?|ZZ?|.)/g, localFormattingTokens = /(\[[^\[]*\])|(\\)?(LT|LL?L?L?|l{1,4})/g,
    // parsing token regexes
    parseTokenOneOrTwoDigits = /\d\d?/,
    // 0 - 99
    parseTokenOneToThreeDigits = /\d{1,3}/,
    // 0 - 999
    parseTokenOneToFourDigits = /\d{1,4}/,
    // 0 - 9999
    parseTokenOneToSixDigits = /[+\-]?\d{1,6}/,
    // -999,999 - 999,999
    parseTokenDigits = /\d+/,
    // nonzero number of digits
    parseTokenWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i,
    // any word (or two) characters or numbers including two/three word month in arabic.
    parseTokenTimezone = /Z|[\+\-]\d\d:?\d\d/gi,
    // +00:00 -00:00 +0000 -0000 or Z
    parseTokenT = /T/i,
    // T (ISO separator)
    parseTokenTimestampMs = /[\+\-]?\d+(\.\d{1,3})?/,
    // 123456789 123456789.123
    parseTokenOrdinal = /\d{1,2}/,
    //strict parsing regexes
    parseTokenOneDigit = /\d/,
    // 0 - 9
    parseTokenTwoDigits = /\d\d/,
    // 00 - 99
    parseTokenThreeDigits = /\d{3}/,
    // 000 - 999
    parseTokenFourDigits = /\d{4}/,
    // 0000 - 9999
    parseTokenSixDigits = /[+-]?\d{6}/,
    // -999,999 - 999,999
    parseTokenSignedNumber = /[+-]?\d+/,
    // -inf - inf
    // iso 8601 regex
    // 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
    isoRegex = /^\s*(?:[+-]\d{6}|\d{4})-(?:(\d\d-\d\d)|(W\d\d$)|(W\d\d-\d)|(\d\d\d))((T| )(\d\d(:\d\d(:\d\d(\.\d+)?)?)?)?([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/, isoFormat = 'YYYY-MM-DDTHH:mm:ssZ', isoDates = [
      [
        'YYYYYY-MM-DD',
        /[+-]\d{6}-\d{2}-\d{2}/
      ],
      [
        'YYYY-MM-DD',
        /\d{4}-\d{2}-\d{2}/
      ],
      [
        'GGGG-[W]WW-E',
        /\d{4}-W\d{2}-\d/
      ],
      [
        'GGGG-[W]WW',
        /\d{4}-W\d{2}/
      ],
      [
        'YYYY-DDD',
        /\d{4}-\d{3}/
      ]
    ],
    // iso time formats and regexes
    isoTimes = [
      [
        'HH:mm:ss.SSSS',
        /(T| )\d\d:\d\d:\d\d\.\d+/
      ],
      [
        'HH:mm:ss',
        /(T| )\d\d:\d\d:\d\d/
      ],
      [
        'HH:mm',
        /(T| )\d\d:\d\d/
      ],
      [
        'HH',
        /(T| )\d\d/
      ]
    ],
    // timezone chunker '+10:00' > ['10', '00'] or '-1530' > ['-15', '30']
    parseTimezoneChunker = /([\+\-]|\d\d)/gi,
    // getter and setter names
    proxyGettersAndSetters = 'Date|Hours|Minutes|Seconds|Milliseconds'.split('|'), unitMillisecondFactors = {
      'Milliseconds': 1,
      'Seconds': 1000,
      'Minutes': 60000,
      'Hours': 3600000,
      'Days': 86400000,
      'Months': 2592000000,
      'Years': 31536000000
    }, unitAliases = {
      ms: 'millisecond',
      s: 'second',
      m: 'minute',
      h: 'hour',
      d: 'day',
      D: 'date',
      w: 'week',
      W: 'isoWeek',
      M: 'month',
      Q: 'quarter',
      y: 'year',
      DDD: 'dayOfYear',
      e: 'weekday',
      E: 'isoWeekday',
      gg: 'weekYear',
      GG: 'isoWeekYear'
    }, camelFunctions = {
      dayofyear: 'dayOfYear',
      isoweekday: 'isoWeekday',
      isoweek: 'isoWeek',
      weekyear: 'weekYear',
      isoweekyear: 'isoWeekYear'
    },
    // format function strings
    formatFunctions = {},
    // default relative time thresholds
    relativeTimeThresholds = {
      s: 45,
      m: 45,
      h: 22,
      d: 26,
      M: 11
    },
    // tokens to ordinalize and pad
    ordinalizeTokens = 'DDD w W M D d'.split(' '), paddedTokens = 'M D H h m s w W'.split(' '), formatTokenFunctions = {
      M: function () {
        return this.month() + 1;
      },
      MMM: function (format) {
        return this.localeData().monthsShort(this, format);
      },
      MMMM: function (format) {
        return this.localeData().months(this, format);
      },
      D: function () {
        return this.date();
      },
      DDD: function () {
        return this.dayOfYear();
      },
      d: function () {
        return this.day();
      },
      dd: function (format) {
        return this.localeData().weekdaysMin(this, format);
      },
      ddd: function (format) {
        return this.localeData().weekdaysShort(this, format);
      },
      dddd: function (format) {
        return this.localeData().weekdays(this, format);
      },
      w: function () {
        return this.week();
      },
      W: function () {
        return this.isoWeek();
      },
      YY: function () {
        return leftZeroFill(this.year() % 100, 2);
      },
      YYYY: function () {
        return leftZeroFill(this.year(), 4);
      },
      YYYYY: function () {
        return leftZeroFill(this.year(), 5);
      },
      YYYYYY: function () {
        var y = this.year(), sign = y >= 0 ? '+' : '-';
        return sign + leftZeroFill(Math.abs(y), 6);
      },
      gg: function () {
        return leftZeroFill(this.weekYear() % 100, 2);
      },
      gggg: function () {
        return leftZeroFill(this.weekYear(), 4);
      },
      ggggg: function () {
        return leftZeroFill(this.weekYear(), 5);
      },
      GG: function () {
        return leftZeroFill(this.isoWeekYear() % 100, 2);
      },
      GGGG: function () {
        return leftZeroFill(this.isoWeekYear(), 4);
      },
      GGGGG: function () {
        return leftZeroFill(this.isoWeekYear(), 5);
      },
      e: function () {
        return this.weekday();
      },
      E: function () {
        return this.isoWeekday();
      },
      a: function () {
        return this.localeData().meridiem(this.hours(), this.minutes(), true);
      },
      A: function () {
        return this.localeData().meridiem(this.hours(), this.minutes(), false);
      },
      H: function () {
        return this.hours();
      },
      h: function () {
        return this.hours() % 12 || 12;
      },
      m: function () {
        return this.minutes();
      },
      s: function () {
        return this.seconds();
      },
      S: function () {
        return toInt(this.milliseconds() / 100);
      },
      SS: function () {
        return leftZeroFill(toInt(this.milliseconds() / 10), 2);
      },
      SSS: function () {
        return leftZeroFill(this.milliseconds(), 3);
      },
      SSSS: function () {
        return leftZeroFill(this.milliseconds(), 3);
      },
      Z: function () {
        var a = -this.zone(), b = '+';
        if (a < 0) {
          a = -a;
          b = '-';
        }
        return b + leftZeroFill(toInt(a / 60), 2) + ':' + leftZeroFill(toInt(a) % 60, 2);
      },
      ZZ: function () {
        var a = -this.zone(), b = '+';
        if (a < 0) {
          a = -a;
          b = '-';
        }
        return b + leftZeroFill(toInt(a / 60), 2) + leftZeroFill(toInt(a) % 60, 2);
      },
      z: function () {
        return this.zoneAbbr();
      },
      zz: function () {
        return this.zoneName();
      },
      X: function () {
        return this.unix();
      },
      Q: function () {
        return this.quarter();
      }
    }, deprecations = {}, lists = [
      'months',
      'monthsShort',
      'weekdays',
      'weekdaysShort',
      'weekdaysMin'
    ];
  // Pick the first defined of two or three arguments. dfl comes from
  // default.
  function dfl(a, b, c) {
    switch (arguments.length) {
    case 2:
      return a != null ? a : b;
    case 3:
      return a != null ? a : b != null ? b : c;
    default:
      throw new Error('Implement me');
    }
  }
  function hasOwnProp(a, b) {
    return hasOwnProperty.call(a, b);
  }
  function defaultParsingFlags() {
    // We need to deep clone this object, and es5 standard is not very
    // helpful.
    return {
      empty: false,
      unusedTokens: [],
      unusedInput: [],
      overflow: -2,
      charsLeftOver: 0,
      nullInput: false,
      invalidMonth: null,
      invalidFormat: false,
      userInvalidated: false,
      iso: false
    };
  }
  function printMsg(msg) {
    if (moment.suppressDeprecationWarnings === false && typeof console !== 'undefined' && console.warn) {
      console.warn('Deprecation warning: ' + msg);
    }
  }
  function deprecate(msg, fn) {
    var firstTime = true;
    return extend(function () {
      if (firstTime) {
        printMsg(msg);
        firstTime = false;
      }
      return fn.apply(this, arguments);
    }, fn);
  }
  function deprecateSimple(name, msg) {
    if (!deprecations[name]) {
      printMsg(msg);
      deprecations[name] = true;
    }
  }
  function padToken(func, count) {
    return function (a) {
      return leftZeroFill(func.call(this, a), count);
    };
  }
  function ordinalizeToken(func, period) {
    return function (a) {
      return this.localeData().ordinal(func.call(this, a), period);
    };
  }
  while (ordinalizeTokens.length) {
    i = ordinalizeTokens.pop();
    formatTokenFunctions[i + 'o'] = ordinalizeToken(formatTokenFunctions[i], i);
  }
  while (paddedTokens.length) {
    i = paddedTokens.pop();
    formatTokenFunctions[i + i] = padToken(formatTokenFunctions[i], 2);
  }
  formatTokenFunctions.DDDD = padToken(formatTokenFunctions.DDD, 3);
  /************************************
        Constructors
    ************************************/
  function Locale() {
  }
  // Moment prototype object
  function Moment(config, skipOverflow) {
    if (skipOverflow !== false) {
      checkOverflow(config);
    }
    copyConfig(this, config);
    this._d = new Date(+config._d);
  }
  // Duration Constructor
  function Duration(duration) {
    var normalizedInput = normalizeObjectUnits(duration), years = normalizedInput.year || 0, quarters = normalizedInput.quarter || 0, months = normalizedInput.month || 0, weeks = normalizedInput.week || 0, days = normalizedInput.day || 0, hours = normalizedInput.hour || 0, minutes = normalizedInput.minute || 0, seconds = normalizedInput.second || 0, milliseconds = normalizedInput.millisecond || 0;
    // representation for dateAddRemove
    this._milliseconds = +milliseconds + seconds * 1000 + minutes * 60000 + hours * 3600000;
    // 1000 * 60 * 60
    // Because of dateAddRemove treats 24 hours as different from a
    // day when working around DST, we need to store them separately
    this._days = +days + weeks * 7;
    // It is impossible translate months into days without knowing
    // which months you are are talking about, so we have to store
    // it separately.
    this._months = +months + quarters * 3 + years * 12;
    this._data = {};
    this._locale = moment.localeData();
    this._bubble();
  }
  /************************************
        Helpers
    ************************************/
  function extend(a, b) {
    for (var i in b) {
      if (hasOwnProp(b, i)) {
        a[i] = b[i];
      }
    }
    if (hasOwnProp(b, 'toString')) {
      a.toString = b.toString;
    }
    if (hasOwnProp(b, 'valueOf')) {
      a.valueOf = b.valueOf;
    }
    return a;
  }
  function copyConfig(to, from) {
    var i, prop, val;
    if (typeof from._isAMomentObject !== 'undefined') {
      to._isAMomentObject = from._isAMomentObject;
    }
    if (typeof from._i !== 'undefined') {
      to._i = from._i;
    }
    if (typeof from._f !== 'undefined') {
      to._f = from._f;
    }
    if (typeof from._l !== 'undefined') {
      to._l = from._l;
    }
    if (typeof from._strict !== 'undefined') {
      to._strict = from._strict;
    }
    if (typeof from._tzm !== 'undefined') {
      to._tzm = from._tzm;
    }
    if (typeof from._isUTC !== 'undefined') {
      to._isUTC = from._isUTC;
    }
    if (typeof from._offset !== 'undefined') {
      to._offset = from._offset;
    }
    if (typeof from._pf !== 'undefined') {
      to._pf = from._pf;
    }
    if (typeof from._locale !== 'undefined') {
      to._locale = from._locale;
    }
    if (momentProperties.length > 0) {
      for (i in momentProperties) {
        prop = momentProperties[i];
        val = from[prop];
        if (typeof val !== 'undefined') {
          to[prop] = val;
        }
      }
    }
    return to;
  }
  function absRound(number) {
    if (number < 0) {
      return Math.ceil(number);
    } else {
      return Math.floor(number);
    }
  }
  // left zero fill a number
  // see http://jsperf.com/left-zero-filling for performance comparison
  function leftZeroFill(number, targetLength, forceSign) {
    var output = '' + Math.abs(number), sign = number >= 0;
    while (output.length < targetLength) {
      output = '0' + output;
    }
    return (sign ? forceSign ? '+' : '' : '-') + output;
  }
  function positiveMomentsDifference(base, other) {
    var res = {
        milliseconds: 0,
        months: 0
      };
    res.months = other.month() - base.month() + (other.year() - base.year()) * 12;
    if (base.clone().add(res.months, 'M').isAfter(other)) {
      --res.months;
    }
    res.milliseconds = +other - +base.clone().add(res.months, 'M');
    return res;
  }
  function momentsDifference(base, other) {
    var res;
    other = makeAs(other, base);
    if (base.isBefore(other)) {
      res = positiveMomentsDifference(base, other);
    } else {
      res = positiveMomentsDifference(other, base);
      res.milliseconds = -res.milliseconds;
      res.months = -res.months;
    }
    return res;
  }
  // TODO: remove 'name' arg after deprecation is removed
  function createAdder(direction, name) {
    return function (val, period) {
      var dur, tmp;
      //invert the arguments, but complain about it
      if (period !== null && !isNaN(+period)) {
        deprecateSimple(name, 'moment().' + name + '(period, number) is deprecated. Please use moment().' + name + '(number, period).');
        tmp = val;
        val = period;
        period = tmp;
      }
      val = typeof val === 'string' ? +val : val;
      dur = moment.duration(val, period);
      addOrSubtractDurationFromMoment(this, dur, direction);
      return this;
    };
  }
  function addOrSubtractDurationFromMoment(mom, duration, isAdding, updateOffset) {
    var milliseconds = duration._milliseconds, days = duration._days, months = duration._months;
    updateOffset = updateOffset == null ? true : updateOffset;
    if (milliseconds) {
      mom._d.setTime(+mom._d + milliseconds * isAdding);
    }
    if (days) {
      rawSetter(mom, 'Date', rawGetter(mom, 'Date') + days * isAdding);
    }
    if (months) {
      rawMonthSetter(mom, rawGetter(mom, 'Month') + months * isAdding);
    }
    if (updateOffset) {
      moment.updateOffset(mom, days || months);
    }
  }
  // check if is an array
  function isArray(input) {
    return Object.prototype.toString.call(input) === '[object Array]';
  }
  function isDate(input) {
    return Object.prototype.toString.call(input) === '[object Date]' || input instanceof Date;
  }
  // compare two arrays, return the number of differences
  function compareArrays(array1, array2, dontConvert) {
    var len = Math.min(array1.length, array2.length), lengthDiff = Math.abs(array1.length - array2.length), diffs = 0, i;
    for (i = 0; i < len; i++) {
      if (dontConvert && array1[i] !== array2[i] || !dontConvert && toInt(array1[i]) !== toInt(array2[i])) {
        diffs++;
      }
    }
    return diffs + lengthDiff;
  }
  function normalizeUnits(units) {
    if (units) {
      var lowered = units.toLowerCase().replace(/(.)s$/, '$1');
      units = unitAliases[units] || camelFunctions[lowered] || lowered;
    }
    return units;
  }
  function normalizeObjectUnits(inputObject) {
    var normalizedInput = {}, normalizedProp, prop;
    for (prop in inputObject) {
      if (hasOwnProp(inputObject, prop)) {
        normalizedProp = normalizeUnits(prop);
        if (normalizedProp) {
          normalizedInput[normalizedProp] = inputObject[prop];
        }
      }
    }
    return normalizedInput;
  }
  function makeList(field) {
    var count, setter;
    if (field.indexOf('week') === 0) {
      count = 7;
      setter = 'day';
    } else if (field.indexOf('month') === 0) {
      count = 12;
      setter = 'month';
    } else {
      return;
    }
    moment[field] = function (format, index) {
      var i, getter, method = moment._locale[field], results = [];
      if (typeof format === 'number') {
        index = format;
        format = undefined;
      }
      getter = function (i) {
        var m = moment().utc().set(setter, i);
        return method.call(moment._locale, m, format || '');
      };
      if (index != null) {
        return getter(index);
      } else {
        for (i = 0; i < count; i++) {
          results.push(getter(i));
        }
        return results;
      }
    };
  }
  function toInt(argumentForCoercion) {
    var coercedNumber = +argumentForCoercion, value = 0;
    if (coercedNumber !== 0 && isFinite(coercedNumber)) {
      if (coercedNumber >= 0) {
        value = Math.floor(coercedNumber);
      } else {
        value = Math.ceil(coercedNumber);
      }
    }
    return value;
  }
  function daysInMonth(year, month) {
    return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  }
  function weeksInYear(year, dow, doy) {
    return weekOfYear(moment([
      year,
      11,
      31 + dow - doy
    ]), dow, doy).week;
  }
  function daysInYear(year) {
    return isLeapYear(year) ? 366 : 365;
  }
  function isLeapYear(year) {
    return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
  }
  function checkOverflow(m) {
    var overflow;
    if (m._a && m._pf.overflow === -2) {
      overflow = m._a[MONTH] < 0 || m._a[MONTH] > 11 ? MONTH : m._a[DATE] < 1 || m._a[DATE] > daysInMonth(m._a[YEAR], m._a[MONTH]) ? DATE : m._a[HOUR] < 0 || m._a[HOUR] > 23 ? HOUR : m._a[MINUTE] < 0 || m._a[MINUTE] > 59 ? MINUTE : m._a[SECOND] < 0 || m._a[SECOND] > 59 ? SECOND : m._a[MILLISECOND] < 0 || m._a[MILLISECOND] > 999 ? MILLISECOND : -1;
      if (m._pf._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
        overflow = DATE;
      }
      m._pf.overflow = overflow;
    }
  }
  function isValid(m) {
    if (m._isValid == null) {
      m._isValid = !isNaN(m._d.getTime()) && m._pf.overflow < 0 && !m._pf.empty && !m._pf.invalidMonth && !m._pf.nullInput && !m._pf.invalidFormat && !m._pf.userInvalidated;
      if (m._strict) {
        m._isValid = m._isValid && m._pf.charsLeftOver === 0 && m._pf.unusedTokens.length === 0;
      }
    }
    return m._isValid;
  }
  function normalizeLocale(key) {
    return key ? key.toLowerCase().replace('_', '-') : key;
  }
  // pick the locale from the array
  // try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
  // substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
  function chooseLocale(names) {
    var i = 0, j, next, locale, split;
    while (i < names.length) {
      split = normalizeLocale(names[i]).split('-');
      j = split.length;
      next = normalizeLocale(names[i + 1]);
      next = next ? next.split('-') : null;
      while (j > 0) {
        locale = loadLocale(split.slice(0, j).join('-'));
        if (locale) {
          return locale;
        }
        if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
          //the next array item is better than a shallower substring of this one
          break;
        }
        j--;
      }
      i++;
    }
    return null;
  }
  function loadLocale(name) {
    var oldLocale = null;
    if (!locales[name] && hasModule) {
      try {
        oldLocale = moment.locale();
        require('./locale/' + name);
        // because defineLocale currently also sets the global locale, we want to undo that for lazy loaded locales
        moment.locale(oldLocale);
      } catch (e) {
      }
    }
    return locales[name];
  }
  // Return a moment from input, that is local/utc/zone equivalent to model.
  function makeAs(input, model) {
    return model._isUTC ? moment(input).zone(model._offset || 0) : moment(input).local();
  }
  /************************************
        Locale
    ************************************/
  extend(Locale.prototype, {
    set: function (config) {
      var prop, i;
      for (i in config) {
        prop = config[i];
        if (typeof prop === 'function') {
          this[i] = prop;
        } else {
          this['_' + i] = prop;
        }
      }
    },
    _months: 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_'),
    months: function (m) {
      return this._months[m.month()];
    },
    _monthsShort: 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
    monthsShort: function (m) {
      return this._monthsShort[m.month()];
    },
    monthsParse: function (monthName) {
      var i, mom, regex;
      if (!this._monthsParse) {
        this._monthsParse = [];
      }
      for (i = 0; i < 12; i++) {
        // make the regex if we don't have it already
        if (!this._monthsParse[i]) {
          mom = moment.utc([
            2000,
            i
          ]);
          regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
          this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
        }
        // test the regex
        if (this._monthsParse[i].test(monthName)) {
          return i;
        }
      }
    },
    _weekdays: 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
    weekdays: function (m) {
      return this._weekdays[m.day()];
    },
    _weekdaysShort: 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
    weekdaysShort: function (m) {
      return this._weekdaysShort[m.day()];
    },
    _weekdaysMin: 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
    weekdaysMin: function (m) {
      return this._weekdaysMin[m.day()];
    },
    weekdaysParse: function (weekdayName) {
      var i, mom, regex;
      if (!this._weekdaysParse) {
        this._weekdaysParse = [];
      }
      for (i = 0; i < 7; i++) {
        // make the regex if we don't have it already
        if (!this._weekdaysParse[i]) {
          mom = moment([
            2000,
            1
          ]).day(i);
          regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
          this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
        }
        // test the regex
        if (this._weekdaysParse[i].test(weekdayName)) {
          return i;
        }
      }
    },
    _longDateFormat: {
      LT: 'h:mm A',
      L: 'MM/DD/YYYY',
      LL: 'MMMM D, YYYY',
      LLL: 'MMMM D, YYYY LT',
      LLLL: 'dddd, MMMM D, YYYY LT'
    },
    longDateFormat: function (key) {
      var output = this._longDateFormat[key];
      if (!output && this._longDateFormat[key.toUpperCase()]) {
        output = this._longDateFormat[key.toUpperCase()].replace(/MMMM|MM|DD|dddd/g, function (val) {
          return val.slice(1);
        });
        this._longDateFormat[key] = output;
      }
      return output;
    },
    isPM: function (input) {
      // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
      // Using charAt should be more compatible.
      return (input + '').toLowerCase().charAt(0) === 'p';
    },
    _meridiemParse: /[ap]\.?m?\.?/i,
    meridiem: function (hours, minutes, isLower) {
      if (hours > 11) {
        return isLower ? 'pm' : 'PM';
      } else {
        return isLower ? 'am' : 'AM';
      }
    },
    _calendar: {
      sameDay: '[Today at] LT',
      nextDay: '[Tomorrow at] LT',
      nextWeek: 'dddd [at] LT',
      lastDay: '[Yesterday at] LT',
      lastWeek: '[Last] dddd [at] LT',
      sameElse: 'L'
    },
    calendar: function (key, mom) {
      var output = this._calendar[key];
      return typeof output === 'function' ? output.apply(mom) : output;
    },
    _relativeTime: {
      future: 'in %s',
      past: '%s ago',
      s: 'a few seconds',
      m: 'a minute',
      mm: '%d minutes',
      h: 'an hour',
      hh: '%d hours',
      d: 'a day',
      dd: '%d days',
      M: 'a month',
      MM: '%d months',
      y: 'a year',
      yy: '%d years'
    },
    relativeTime: function (number, withoutSuffix, string, isFuture) {
      var output = this._relativeTime[string];
      return typeof output === 'function' ? output(number, withoutSuffix, string, isFuture) : output.replace(/%d/i, number);
    },
    pastFuture: function (diff, output) {
      var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
      return typeof format === 'function' ? format(output) : format.replace(/%s/i, output);
    },
    ordinal: function (number) {
      return this._ordinal.replace('%d', number);
    },
    _ordinal: '%d',
    preparse: function (string) {
      return string;
    },
    postformat: function (string) {
      return string;
    },
    week: function (mom) {
      return weekOfYear(mom, this._week.dow, this._week.doy).week;
    },
    _week: {
      dow: 0,
      doy: 6
    },
    _invalidDate: 'Invalid date',
    invalidDate: function () {
      return this._invalidDate;
    }
  });
  /************************************
        Formatting
    ************************************/
  function removeFormattingTokens(input) {
    if (input.match(/\[[\s\S]/)) {
      return input.replace(/^\[|\]$/g, '');
    }
    return input.replace(/\\/g, '');
  }
  function makeFormatFunction(format) {
    var array = format.match(formattingTokens), i, length;
    for (i = 0, length = array.length; i < length; i++) {
      if (formatTokenFunctions[array[i]]) {
        array[i] = formatTokenFunctions[array[i]];
      } else {
        array[i] = removeFormattingTokens(array[i]);
      }
    }
    return function (mom) {
      var output = '';
      for (i = 0; i < length; i++) {
        output += array[i] instanceof Function ? array[i].call(mom, format) : array[i];
      }
      return output;
    };
  }
  // format date using native date object
  function formatMoment(m, format) {
    if (!m.isValid()) {
      return m.localeData().invalidDate();
    }
    format = expandFormat(format, m.localeData());
    if (!formatFunctions[format]) {
      formatFunctions[format] = makeFormatFunction(format);
    }
    return formatFunctions[format](m);
  }
  function expandFormat(format, locale) {
    var i = 5;
    function replaceLongDateFormatTokens(input) {
      return locale.longDateFormat(input) || input;
    }
    localFormattingTokens.lastIndex = 0;
    while (i >= 0 && localFormattingTokens.test(format)) {
      format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
      localFormattingTokens.lastIndex = 0;
      i -= 1;
    }
    return format;
  }
  /************************************
        Parsing
    ************************************/
  // get the regex to find the next token
  function getParseRegexForToken(token, config) {
    var a, strict = config._strict;
    switch (token) {
    case 'Q':
      return parseTokenOneDigit;
    case 'DDDD':
      return parseTokenThreeDigits;
    case 'YYYY':
    case 'GGGG':
    case 'gggg':
      return strict ? parseTokenFourDigits : parseTokenOneToFourDigits;
    case 'Y':
    case 'G':
    case 'g':
      return parseTokenSignedNumber;
    case 'YYYYYY':
    case 'YYYYY':
    case 'GGGGG':
    case 'ggggg':
      return strict ? parseTokenSixDigits : parseTokenOneToSixDigits;
    case 'S':
      if (strict) {
        return parseTokenOneDigit;
      }
    /* falls through */
    case 'SS':
      if (strict) {
        return parseTokenTwoDigits;
      }
    /* falls through */
    case 'SSS':
      if (strict) {
        return parseTokenThreeDigits;
      }
    /* falls through */
    case 'DDD':
      return parseTokenOneToThreeDigits;
    case 'MMM':
    case 'MMMM':
    case 'dd':
    case 'ddd':
    case 'dddd':
      return parseTokenWord;
    case 'a':
    case 'A':
      return config._locale._meridiemParse;
    case 'X':
      return parseTokenTimestampMs;
    case 'Z':
    case 'ZZ':
      return parseTokenTimezone;
    case 'T':
      return parseTokenT;
    case 'SSSS':
      return parseTokenDigits;
    case 'MM':
    case 'DD':
    case 'YY':
    case 'GG':
    case 'gg':
    case 'HH':
    case 'hh':
    case 'mm':
    case 'ss':
    case 'ww':
    case 'WW':
      return strict ? parseTokenTwoDigits : parseTokenOneOrTwoDigits;
    case 'M':
    case 'D':
    case 'd':
    case 'H':
    case 'h':
    case 'm':
    case 's':
    case 'w':
    case 'W':
    case 'e':
    case 'E':
      return parseTokenOneOrTwoDigits;
    case 'Do':
      return parseTokenOrdinal;
    default:
      a = new RegExp(regexpEscape(unescapeFormat(token.replace('\\', '')), 'i'));
      return a;
    }
  }
  function timezoneMinutesFromString(string) {
    string = string || '';
    var possibleTzMatches = string.match(parseTokenTimezone) || [], tzChunk = possibleTzMatches[possibleTzMatches.length - 1] || [], parts = (tzChunk + '').match(parseTimezoneChunker) || [
        '-',
        0,
        0
      ], minutes = +(parts[1] * 60) + toInt(parts[2]);
    return parts[0] === '+' ? -minutes : minutes;
  }
  // function to convert string input to date
  function addTimeToArrayFromToken(token, input, config) {
    var a, datePartArray = config._a;
    switch (token) {
    // QUARTER
    case 'Q':
      if (input != null) {
        datePartArray[MONTH] = (toInt(input) - 1) * 3;
      }
      break;
    // MONTH
    case 'M':
    // fall through to MM
    case 'MM':
      if (input != null) {
        datePartArray[MONTH] = toInt(input) - 1;
      }
      break;
    case 'MMM':
    // fall through to MMMM
    case 'MMMM':
      a = config._locale.monthsParse(input);
      // if we didn't find a month name, mark the date as invalid.
      if (a != null) {
        datePartArray[MONTH] = a;
      } else {
        config._pf.invalidMonth = input;
      }
      break;
    // DAY OF MONTH
    case 'D':
    // fall through to DD
    case 'DD':
      if (input != null) {
        datePartArray[DATE] = toInt(input);
      }
      break;
    case 'Do':
      if (input != null) {
        datePartArray[DATE] = toInt(parseInt(input, 10));
      }
      break;
    // DAY OF YEAR
    case 'DDD':
    // fall through to DDDD
    case 'DDDD':
      if (input != null) {
        config._dayOfYear = toInt(input);
      }
      break;
    // YEAR
    case 'YY':
      datePartArray[YEAR] = moment.parseTwoDigitYear(input);
      break;
    case 'YYYY':
    case 'YYYYY':
    case 'YYYYYY':
      datePartArray[YEAR] = toInt(input);
      break;
    // AM / PM
    case 'a':
    // fall through to A
    case 'A':
      config._isPm = config._locale.isPM(input);
      break;
    // 24 HOUR
    case 'H':
    // fall through to hh
    case 'HH':
    // fall through to hh
    case 'h':
    // fall through to hh
    case 'hh':
      datePartArray[HOUR] = toInt(input);
      break;
    // MINUTE
    case 'm':
    // fall through to mm
    case 'mm':
      datePartArray[MINUTE] = toInt(input);
      break;
    // SECOND
    case 's':
    // fall through to ss
    case 'ss':
      datePartArray[SECOND] = toInt(input);
      break;
    // MILLISECOND
    case 'S':
    case 'SS':
    case 'SSS':
    case 'SSSS':
      datePartArray[MILLISECOND] = toInt(('0.' + input) * 1000);
      break;
    // UNIX TIMESTAMP WITH MS
    case 'X':
      config._d = new Date(parseFloat(input) * 1000);
      break;
    // TIMEZONE
    case 'Z':
    // fall through to ZZ
    case 'ZZ':
      config._useUTC = true;
      config._tzm = timezoneMinutesFromString(input);
      break;
    // WEEKDAY - human
    case 'dd':
    case 'ddd':
    case 'dddd':
      a = config._locale.weekdaysParse(input);
      // if we didn't get a weekday name, mark the date as invalid
      if (a != null) {
        config._w = config._w || {};
        config._w['d'] = a;
      } else {
        config._pf.invalidWeekday = input;
      }
      break;
    // WEEK, WEEK DAY - numeric
    case 'w':
    case 'ww':
    case 'W':
    case 'WW':
    case 'd':
    case 'e':
    case 'E':
      token = token.substr(0, 1);
    /* falls through */
    case 'gggg':
    case 'GGGG':
    case 'GGGGG':
      token = token.substr(0, 2);
      if (input) {
        config._w = config._w || {};
        config._w[token] = toInt(input);
      }
      break;
    case 'gg':
    case 'GG':
      config._w = config._w || {};
      config._w[token] = moment.parseTwoDigitYear(input);
    }
  }
  function dayOfYearFromWeekInfo(config) {
    var w, weekYear, week, weekday, dow, doy, temp;
    w = config._w;
    if (w.GG != null || w.W != null || w.E != null) {
      dow = 1;
      doy = 4;
      // TODO: We need to take the current isoWeekYear, but that depends on
      // how we interpret now (local, utc, fixed offset). So create
      // a now version of current config (take local/utc/offset flags, and
      // create now).
      weekYear = dfl(w.GG, config._a[YEAR], weekOfYear(moment(), 1, 4).year);
      week = dfl(w.W, 1);
      weekday = dfl(w.E, 1);
    } else {
      dow = config._locale._week.dow;
      doy = config._locale._week.doy;
      weekYear = dfl(w.gg, config._a[YEAR], weekOfYear(moment(), dow, doy).year);
      week = dfl(w.w, 1);
      if (w.d != null) {
        // weekday -- low day numbers are considered next week
        weekday = w.d;
        if (weekday < dow) {
          ++week;
        }
      } else if (w.e != null) {
        // local weekday -- counting starts from begining of week
        weekday = w.e + dow;
      } else {
        // default to begining of week
        weekday = dow;
      }
    }
    temp = dayOfYearFromWeeks(weekYear, week, weekday, doy, dow);
    config._a[YEAR] = temp.year;
    config._dayOfYear = temp.dayOfYear;
  }
  // convert an array to a date.
  // the array should mirror the parameters below
  // note: all values past the year are optional and will default to the lowest possible value.
  // [year, month, day , hour, minute, second, millisecond]
  function dateFromConfig(config) {
    var i, date, input = [], currentDate, yearToUse;
    if (config._d) {
      return;
    }
    currentDate = currentDateArray(config);
    //compute day of the year from weeks and weekdays
    if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
      dayOfYearFromWeekInfo(config);
    }
    //if the day of the year is set, figure out what it is
    if (config._dayOfYear) {
      yearToUse = dfl(config._a[YEAR], currentDate[YEAR]);
      if (config._dayOfYear > daysInYear(yearToUse)) {
        config._pf._overflowDayOfYear = true;
      }
      date = makeUTCDate(yearToUse, 0, config._dayOfYear);
      config._a[MONTH] = date.getUTCMonth();
      config._a[DATE] = date.getUTCDate();
    }
    // Default to current date.
    // * if no year, month, day of month are given, default to today
    // * if day of month is given, default month and year
    // * if month is given, default only year
    // * if year is given, don't default anything
    for (i = 0; i < 3 && config._a[i] == null; ++i) {
      config._a[i] = input[i] = currentDate[i];
    }
    // Zero out whatever was not defaulted, including time
    for (; i < 7; i++) {
      config._a[i] = input[i] = config._a[i] == null ? i === 2 ? 1 : 0 : config._a[i];
    }
    config._d = (config._useUTC ? makeUTCDate : makeDate).apply(null, input);
    // Apply timezone offset from input. The actual zone can be changed
    // with parseZone.
    if (config._tzm != null) {
      config._d.setUTCMinutes(config._d.getUTCMinutes() + config._tzm);
    }
  }
  function dateFromObject(config) {
    var normalizedInput;
    if (config._d) {
      return;
    }
    normalizedInput = normalizeObjectUnits(config._i);
    config._a = [
      normalizedInput.year,
      normalizedInput.month,
      normalizedInput.day,
      normalizedInput.hour,
      normalizedInput.minute,
      normalizedInput.second,
      normalizedInput.millisecond
    ];
    dateFromConfig(config);
  }
  function currentDateArray(config) {
    var now = new Date();
    if (config._useUTC) {
      return [
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate()
      ];
    } else {
      return [
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      ];
    }
  }
  // date from string and format string
  function makeDateFromStringAndFormat(config) {
    if (config._f === moment.ISO_8601) {
      parseISO(config);
      return;
    }
    config._a = [];
    config._pf.empty = true;
    // This array is used to make a Date, either with `new Date` or `Date.UTC`
    var string = '' + config._i, i, parsedInput, tokens, token, skipped, stringLength = string.length, totalParsedInputLength = 0;
    tokens = expandFormat(config._f, config._locale).match(formattingTokens) || [];
    for (i = 0; i < tokens.length; i++) {
      token = tokens[i];
      parsedInput = (string.match(getParseRegexForToken(token, config)) || [])[0];
      if (parsedInput) {
        skipped = string.substr(0, string.indexOf(parsedInput));
        if (skipped.length > 0) {
          config._pf.unusedInput.push(skipped);
        }
        string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
        totalParsedInputLength += parsedInput.length;
      }
      // don't parse if it's not a known token
      if (formatTokenFunctions[token]) {
        if (parsedInput) {
          config._pf.empty = false;
        } else {
          config._pf.unusedTokens.push(token);
        }
        addTimeToArrayFromToken(token, parsedInput, config);
      } else if (config._strict && !parsedInput) {
        config._pf.unusedTokens.push(token);
      }
    }
    // add remaining unparsed input length to the string
    config._pf.charsLeftOver = stringLength - totalParsedInputLength;
    if (string.length > 0) {
      config._pf.unusedInput.push(string);
    }
    // handle am pm
    if (config._isPm && config._a[HOUR] < 12) {
      config._a[HOUR] += 12;
    }
    // if is 12 am, change hours to 0
    if (config._isPm === false && config._a[HOUR] === 12) {
      config._a[HOUR] = 0;
    }
    dateFromConfig(config);
    checkOverflow(config);
  }
  function unescapeFormat(s) {
    return s.replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (matched, p1, p2, p3, p4) {
      return p1 || p2 || p3 || p4;
    });
  }
  // Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
  function regexpEscape(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  }
  // date from string and array of format strings
  function makeDateFromStringAndArray(config) {
    var tempConfig, bestMoment, scoreToBeat, i, currentScore;
    if (config._f.length === 0) {
      config._pf.invalidFormat = true;
      config._d = new Date(NaN);
      return;
    }
    for (i = 0; i < config._f.length; i++) {
      currentScore = 0;
      tempConfig = copyConfig({}, config);
      if (config._useUTC != null) {
        tempConfig._useUTC = config._useUTC;
      }
      tempConfig._pf = defaultParsingFlags();
      tempConfig._f = config._f[i];
      makeDateFromStringAndFormat(tempConfig);
      if (!isValid(tempConfig)) {
        continue;
      }
      // if there is any input that was not parsed add a penalty for that format
      currentScore += tempConfig._pf.charsLeftOver;
      //or tokens
      currentScore += tempConfig._pf.unusedTokens.length * 10;
      tempConfig._pf.score = currentScore;
      if (scoreToBeat == null || currentScore < scoreToBeat) {
        scoreToBeat = currentScore;
        bestMoment = tempConfig;
      }
    }
    extend(config, bestMoment || tempConfig);
  }
  // date from iso format
  function parseISO(config) {
    var i, l, string = config._i, match = isoRegex.exec(string);
    if (match) {
      config._pf.iso = true;
      for (i = 0, l = isoDates.length; i < l; i++) {
        if (isoDates[i][1].exec(string)) {
          // match[5] should be 'T' or undefined
          config._f = isoDates[i][0] + (match[6] || ' ');
          break;
        }
      }
      for (i = 0, l = isoTimes.length; i < l; i++) {
        if (isoTimes[i][1].exec(string)) {
          config._f += isoTimes[i][0];
          break;
        }
      }
      if (string.match(parseTokenTimezone)) {
        config._f += 'Z';
      }
      makeDateFromStringAndFormat(config);
    } else {
      config._isValid = false;
    }
  }
  // date from iso format or fallback
  function makeDateFromString(config) {
    parseISO(config);
    if (config._isValid === false) {
      delete config._isValid;
      moment.createFromInputFallback(config);
    }
  }
  function map(arr, fn) {
    var res = [], i;
    for (i = 0; i < arr.length; ++i) {
      res.push(fn(arr[i], i));
    }
    return res;
  }
  function makeDateFromInput(config) {
    var input = config._i, matched;
    if (input === undefined) {
      config._d = new Date();
    } else if (isDate(input)) {
      config._d = new Date(+input);
    } else if ((matched = aspNetJsonRegex.exec(input)) !== null) {
      config._d = new Date(+matched[1]);
    } else if (typeof input === 'string') {
      makeDateFromString(config);
    } else if (isArray(input)) {
      config._a = map(input.slice(0), function (obj) {
        return parseInt(obj, 10);
      });
      dateFromConfig(config);
    } else if (typeof input === 'object') {
      dateFromObject(config);
    } else if (typeof input === 'number') {
      // from milliseconds
      config._d = new Date(input);
    } else {
      moment.createFromInputFallback(config);
    }
  }
  function makeDate(y, m, d, h, M, s, ms) {
    //can't just apply() to create a date:
    //http://stackoverflow.com/questions/181348/instantiating-a-javascript-object-by-calling-prototype-constructor-apply
    var date = new Date(y, m, d, h, M, s, ms);
    //the date constructor doesn't accept years < 1970
    if (y < 1970) {
      date.setFullYear(y);
    }
    return date;
  }
  function makeUTCDate(y) {
    var date = new Date(Date.UTC.apply(null, arguments));
    if (y < 1970) {
      date.setUTCFullYear(y);
    }
    return date;
  }
  function parseWeekday(input, locale) {
    if (typeof input === 'string') {
      if (!isNaN(input)) {
        input = parseInt(input, 10);
      } else {
        input = locale.weekdaysParse(input);
        if (typeof input !== 'number') {
          return null;
        }
      }
    }
    return input;
  }
  /************************************
        Relative Time
    ************************************/
  // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
  function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
    return locale.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
  }
  function relativeTime(posNegDuration, withoutSuffix, locale) {
    var duration = moment.duration(posNegDuration).abs(), seconds = round(duration.as('s')), minutes = round(duration.as('m')), hours = round(duration.as('h')), days = round(duration.as('d')), months = round(duration.as('M')), years = round(duration.as('y')), args = seconds < relativeTimeThresholds.s && [
        's',
        seconds
      ] || minutes === 1 && ['m'] || minutes < relativeTimeThresholds.m && [
        'mm',
        minutes
      ] || hours === 1 && ['h'] || hours < relativeTimeThresholds.h && [
        'hh',
        hours
      ] || days === 1 && ['d'] || days < relativeTimeThresholds.d && [
        'dd',
        days
      ] || months === 1 && ['M'] || months < relativeTimeThresholds.M && [
        'MM',
        months
      ] || years === 1 && ['y'] || [
        'yy',
        years
      ];
    args[2] = withoutSuffix;
    args[3] = +posNegDuration > 0;
    args[4] = locale;
    return substituteTimeAgo.apply({}, args);
  }
  /************************************
        Week of Year
    ************************************/
  // firstDayOfWeek       0 = sun, 6 = sat
  //                      the day of the week that starts the week
  //                      (usually sunday or monday)
  // firstDayOfWeekOfYear 0 = sun, 6 = sat
  //                      the first week is the week that contains the first
  //                      of this day of the week
  //                      (eg. ISO weeks use thursday (4))
  function weekOfYear(mom, firstDayOfWeek, firstDayOfWeekOfYear) {
    var end = firstDayOfWeekOfYear - firstDayOfWeek, daysToDayOfWeek = firstDayOfWeekOfYear - mom.day(), adjustedMoment;
    if (daysToDayOfWeek > end) {
      daysToDayOfWeek -= 7;
    }
    if (daysToDayOfWeek < end - 7) {
      daysToDayOfWeek += 7;
    }
    adjustedMoment = moment(mom).add(daysToDayOfWeek, 'd');
    return {
      week: Math.ceil(adjustedMoment.dayOfYear() / 7),
      year: adjustedMoment.year()
    };
  }
  //http://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
  function dayOfYearFromWeeks(year, week, weekday, firstDayOfWeekOfYear, firstDayOfWeek) {
    var d = makeUTCDate(year, 0, 1).getUTCDay(), daysToAdd, dayOfYear;
    d = d === 0 ? 7 : d;
    weekday = weekday != null ? weekday : firstDayOfWeek;
    daysToAdd = firstDayOfWeek - d + (d > firstDayOfWeekOfYear ? 7 : 0) - (d < firstDayOfWeek ? 7 : 0);
    dayOfYear = 7 * (week - 1) + (weekday - firstDayOfWeek) + daysToAdd + 1;
    return {
      year: dayOfYear > 0 ? year : year - 1,
      dayOfYear: dayOfYear > 0 ? dayOfYear : daysInYear(year - 1) + dayOfYear
    };
  }
  /************************************
        Top Level Functions
    ************************************/
  function makeMoment(config) {
    var input = config._i, format = config._f;
    config._locale = config._locale || moment.localeData(config._l);
    if (input === null || format === undefined && input === '') {
      return moment.invalid({ nullInput: true });
    }
    if (typeof input === 'string') {
      config._i = input = config._locale.preparse(input);
    }
    if (moment.isMoment(input)) {
      return new Moment(input, true);
    } else if (format) {
      if (isArray(format)) {
        makeDateFromStringAndArray(config);
      } else {
        makeDateFromStringAndFormat(config);
      }
    } else {
      makeDateFromInput(config);
    }
    return new Moment(config);
  }
  moment = function (input, format, locale, strict) {
    var c;
    if (typeof locale === 'boolean') {
      strict = locale;
      locale = undefined;
    }
    // object construction must be done this way.
    // https://github.com/moment/moment/issues/1423
    c = {};
    c._isAMomentObject = true;
    c._i = input;
    c._f = format;
    c._l = locale;
    c._strict = strict;
    c._isUTC = false;
    c._pf = defaultParsingFlags();
    return makeMoment(c);
  };
  moment.suppressDeprecationWarnings = false;
  moment.createFromInputFallback = deprecate('moment construction falls back to js Date. This is ' + 'discouraged and will be removed in upcoming major ' + 'release. Please refer to ' + 'https://github.com/moment/moment/issues/1407 for more info.', function (config) {
    config._d = new Date(config._i);
  });
  // Pick a moment m from moments so that m[fn](other) is true for all
  // other. This relies on the function fn to be transitive.
  //
  // moments should either be an array of moment objects or an array, whose
  // first element is an array of moment objects.
  function pickBy(fn, moments) {
    var res, i;
    if (moments.length === 1 && isArray(moments[0])) {
      moments = moments[0];
    }
    if (!moments.length) {
      return moment();
    }
    res = moments[0];
    for (i = 1; i < moments.length; ++i) {
      if (moments[i][fn](res)) {
        res = moments[i];
      }
    }
    return res;
  }
  moment.min = function () {
    var args = [].slice.call(arguments, 0);
    return pickBy('isBefore', args);
  };
  moment.max = function () {
    var args = [].slice.call(arguments, 0);
    return pickBy('isAfter', args);
  };
  // creating with utc
  moment.utc = function (input, format, locale, strict) {
    var c;
    if (typeof locale === 'boolean') {
      strict = locale;
      locale = undefined;
    }
    // object construction must be done this way.
    // https://github.com/moment/moment/issues/1423
    c = {};
    c._isAMomentObject = true;
    c._useUTC = true;
    c._isUTC = true;
    c._l = locale;
    c._i = input;
    c._f = format;
    c._strict = strict;
    c._pf = defaultParsingFlags();
    return makeMoment(c).utc();
  };
  // creating with unix timestamp (in seconds)
  moment.unix = function (input) {
    return moment(input * 1000);
  };
  // duration
  moment.duration = function (input, key) {
    var duration = input,
      // matching against regexp is expensive, do it on demand
      match = null, sign, ret, parseIso, diffRes;
    if (moment.isDuration(input)) {
      duration = {
        ms: input._milliseconds,
        d: input._days,
        M: input._months
      };
    } else if (typeof input === 'number') {
      duration = {};
      if (key) {
        duration[key] = input;
      } else {
        duration.milliseconds = input;
      }
    } else if (!!(match = aspNetTimeSpanJsonRegex.exec(input))) {
      sign = match[1] === '-' ? -1 : 1;
      duration = {
        y: 0,
        d: toInt(match[DATE]) * sign,
        h: toInt(match[HOUR]) * sign,
        m: toInt(match[MINUTE]) * sign,
        s: toInt(match[SECOND]) * sign,
        ms: toInt(match[MILLISECOND]) * sign
      };
    } else if (!!(match = isoDurationRegex.exec(input))) {
      sign = match[1] === '-' ? -1 : 1;
      parseIso = function (inp) {
        // We'd normally use ~~inp for this, but unfortunately it also
        // converts floats to ints.
        // inp may be undefined, so careful calling replace on it.
        var res = inp && parseFloat(inp.replace(',', '.'));
        // apply sign while we're at it
        return (isNaN(res) ? 0 : res) * sign;
      };
      duration = {
        y: parseIso(match[2]),
        M: parseIso(match[3]),
        d: parseIso(match[4]),
        h: parseIso(match[5]),
        m: parseIso(match[6]),
        s: parseIso(match[7]),
        w: parseIso(match[8])
      };
    } else if (typeof duration === 'object' && ('from' in duration || 'to' in duration)) {
      diffRes = momentsDifference(moment(duration.from), moment(duration.to));
      duration = {};
      duration.ms = diffRes.milliseconds;
      duration.M = diffRes.months;
    }
    ret = new Duration(duration);
    if (moment.isDuration(input) && hasOwnProp(input, '_locale')) {
      ret._locale = input._locale;
    }
    return ret;
  };
  // version number
  moment.version = VERSION;
  // default format
  moment.defaultFormat = isoFormat;
  // constant that refers to the ISO standard
  moment.ISO_8601 = function () {
  };
  // Plugins that add properties should also add the key here (null value),
  // so we can properly clone ourselves.
  moment.momentProperties = momentProperties;
  // This function will be called whenever a moment is mutated.
  // It is intended to keep the offset in sync with the timezone.
  moment.updateOffset = function () {
  };
  // This function allows you to set a threshold for relative time strings
  moment.relativeTimeThreshold = function (threshold, limit) {
    if (relativeTimeThresholds[threshold] === undefined) {
      return false;
    }
    if (limit === undefined) {
      return relativeTimeThresholds[threshold];
    }
    relativeTimeThresholds[threshold] = limit;
    return true;
  };
  moment.lang = deprecate('moment.lang is deprecated. Use moment.locale instead.', function (key, value) {
    return moment.locale(key, value);
  });
  // This function will load locale and then set the global locale.  If
  // no arguments are passed in, it will simply return the current global
  // locale key.
  moment.locale = function (key, values) {
    var data;
    if (key) {
      if (typeof values !== 'undefined') {
        data = moment.defineLocale(key, values);
      } else {
        data = moment.localeData(key);
      }
      if (data) {
        moment.duration._locale = moment._locale = data;
      }
    }
    return moment._locale._abbr;
  };
  moment.defineLocale = function (name, values) {
    if (values !== null) {
      values.abbr = name;
      if (!locales[name]) {
        locales[name] = new Locale();
      }
      locales[name].set(values);
      // backwards compat for now: also set the locale
      moment.locale(name);
      return locales[name];
    } else {
      // useful for testing
      delete locales[name];
      return null;
    }
  };
  moment.langData = deprecate('moment.langData is deprecated. Use moment.localeData instead.', function (key) {
    return moment.localeData(key);
  });
  // returns locale data
  moment.localeData = function (key) {
    var locale;
    if (key && key._locale && key._locale._abbr) {
      key = key._locale._abbr;
    }
    if (!key) {
      return moment._locale;
    }
    if (!isArray(key)) {
      //short-circuit everything else
      locale = loadLocale(key);
      if (locale) {
        return locale;
      }
      key = [key];
    }
    return chooseLocale(key);
  };
  // compare moment object
  moment.isMoment = function (obj) {
    return obj instanceof Moment || obj != null && hasOwnProp(obj, '_isAMomentObject');
  };
  // for typechecking Duration objects
  moment.isDuration = function (obj) {
    return obj instanceof Duration;
  };
  for (i = lists.length - 1; i >= 0; --i) {
    makeList(lists[i]);
  }
  moment.normalizeUnits = function (units) {
    return normalizeUnits(units);
  };
  moment.invalid = function (flags) {
    var m = moment.utc(NaN);
    if (flags != null) {
      extend(m._pf, flags);
    } else {
      m._pf.userInvalidated = true;
    }
    return m;
  };
  moment.parseZone = function () {
    return moment.apply(null, arguments).parseZone();
  };
  moment.parseTwoDigitYear = function (input) {
    return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
  };
  /************************************
        Moment Prototype
    ************************************/
  extend(moment.fn = Moment.prototype, {
    clone: function () {
      return moment(this);
    },
    valueOf: function () {
      return +this._d + (this._offset || 0) * 60000;
    },
    unix: function () {
      return Math.floor(+this / 1000);
    },
    toString: function () {
      return this.clone().locale('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
    },
    toDate: function () {
      return this._offset ? new Date(+this) : this._d;
    },
    toISOString: function () {
      var m = moment(this).utc();
      if (0 < m.year() && m.year() <= 9999) {
        return formatMoment(m, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
      } else {
        return formatMoment(m, 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
      }
    },
    toArray: function () {
      var m = this;
      return [
        m.year(),
        m.month(),
        m.date(),
        m.hours(),
        m.minutes(),
        m.seconds(),
        m.milliseconds()
      ];
    },
    isValid: function () {
      return isValid(this);
    },
    isDSTShifted: function () {
      if (this._a) {
        return this.isValid() && compareArrays(this._a, (this._isUTC ? moment.utc(this._a) : moment(this._a)).toArray()) > 0;
      }
      return false;
    },
    parsingFlags: function () {
      return extend({}, this._pf);
    },
    invalidAt: function () {
      return this._pf.overflow;
    },
    utc: function (keepLocalTime) {
      return this.zone(0, keepLocalTime);
    },
    local: function (keepLocalTime) {
      if (this._isUTC) {
        this.zone(0, keepLocalTime);
        this._isUTC = false;
        if (keepLocalTime) {
          this.add(this._dateTzOffset(), 'm');
        }
      }
      return this;
    },
    format: function (inputString) {
      var output = formatMoment(this, inputString || moment.defaultFormat);
      return this.localeData().postformat(output);
    },
    add: createAdder(1, 'add'),
    subtract: createAdder(-1, 'subtract'),
    diff: function (input, units, asFloat) {
      var that = makeAs(input, this), zoneDiff = (this.zone() - that.zone()) * 60000, diff, output, daysAdjust;
      units = normalizeUnits(units);
      if (units === 'year' || units === 'month') {
        // average number of days in the months in the given dates
        diff = (this.daysInMonth() + that.daysInMonth()) * 43200000;
        // 24 * 60 * 60 * 1000 / 2
        // difference in months
        output = (this.year() - that.year()) * 12 + (this.month() - that.month());
        // adjust by taking difference in days, average number of days
        // and dst in the given months.
        daysAdjust = this - moment(this).startOf('month') - (that - moment(that).startOf('month'));
        // same as above but with zones, to negate all dst
        daysAdjust -= (this.zone() - moment(this).startOf('month').zone() - (that.zone() - moment(that).startOf('month').zone())) * 60000;
        output += daysAdjust / diff;
        if (units === 'year') {
          output = output / 12;
        }
      } else {
        diff = this - that;
        output = units === 'second' ? diff / 1000 : units === 'minute' ? diff / 60000 : units === 'hour' ? diff / 3600000 : units === 'day' ? (diff - zoneDiff) / 86400000 : units === 'week' ? (diff - zoneDiff) / 604800000 : diff;
      }
      return asFloat ? output : absRound(output);
    },
    from: function (time, withoutSuffix) {
      return moment.duration({
        to: this,
        from: time
      }).locale(this.locale()).humanize(!withoutSuffix);
    },
    fromNow: function (withoutSuffix) {
      return this.from(moment(), withoutSuffix);
    },
    calendar: function (time) {
      // We want to compare the start of today, vs this.
      // Getting start-of-today depends on whether we're zone'd or not.
      var now = time || moment(), sod = makeAs(now, this).startOf('day'), diff = this.diff(sod, 'days', true), format = diff < -6 ? 'sameElse' : diff < -1 ? 'lastWeek' : diff < 0 ? 'lastDay' : diff < 1 ? 'sameDay' : diff < 2 ? 'nextDay' : diff < 7 ? 'nextWeek' : 'sameElse';
      return this.format(this.localeData().calendar(format, this));
    },
    isLeapYear: function () {
      return isLeapYear(this.year());
    },
    isDST: function () {
      return this.zone() < this.clone().month(0).zone() || this.zone() < this.clone().month(5).zone();
    },
    day: function (input) {
      var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
      if (input != null) {
        input = parseWeekday(input, this.localeData());
        return this.add(input - day, 'd');
      } else {
        return day;
      }
    },
    month: makeAccessor('Month', true),
    startOf: function (units) {
      units = normalizeUnits(units);
      // the following switch intentionally omits break keywords
      // to utilize falling through the cases.
      switch (units) {
      case 'year':
        this.month(0);
      /* falls through */
      case 'quarter':
      case 'month':
        this.date(1);
      /* falls through */
      case 'week':
      case 'isoWeek':
      case 'day':
        this.hours(0);
      /* falls through */
      case 'hour':
        this.minutes(0);
      /* falls through */
      case 'minute':
        this.seconds(0);
      /* falls through */
      case 'second':
        this.milliseconds(0);  /* falls through */
      }
      // weeks are a special case
      if (units === 'week') {
        this.weekday(0);
      } else if (units === 'isoWeek') {
        this.isoWeekday(1);
      }
      // quarters are also special
      if (units === 'quarter') {
        this.month(Math.floor(this.month() / 3) * 3);
      }
      return this;
    },
    endOf: function (units) {
      units = normalizeUnits(units);
      return this.startOf(units).add(1, units === 'isoWeek' ? 'week' : units).subtract(1, 'ms');
    },
    isAfter: function (input, units) {
      units = normalizeUnits(typeof units !== 'undefined' ? units : 'millisecond');
      if (units === 'millisecond') {
        input = moment.isMoment(input) ? input : moment(input);
        return +this > +input;
      } else {
        return +this.clone().startOf(units) > +moment(input).startOf(units);
      }
    },
    isBefore: function (input, units) {
      units = normalizeUnits(typeof units !== 'undefined' ? units : 'millisecond');
      if (units === 'millisecond') {
        input = moment.isMoment(input) ? input : moment(input);
        return +this < +input;
      } else {
        return +this.clone().startOf(units) < +moment(input).startOf(units);
      }
    },
    isSame: function (input, units) {
      units = normalizeUnits(units || 'millisecond');
      if (units === 'millisecond') {
        input = moment.isMoment(input) ? input : moment(input);
        return +this === +input;
      } else {
        return +this.clone().startOf(units) === +makeAs(input, this).startOf(units);
      }
    },
    min: deprecate('moment().min is deprecated, use moment.min instead. https://github.com/moment/moment/issues/1548', function (other) {
      other = moment.apply(null, arguments);
      return other < this ? this : other;
    }),
    max: deprecate('moment().max is deprecated, use moment.max instead. https://github.com/moment/moment/issues/1548', function (other) {
      other = moment.apply(null, arguments);
      return other > this ? this : other;
    }),
    zone: function (input, keepLocalTime) {
      var offset = this._offset || 0, localAdjust;
      if (input != null) {
        if (typeof input === 'string') {
          input = timezoneMinutesFromString(input);
        }
        if (Math.abs(input) < 16) {
          input = input * 60;
        }
        if (!this._isUTC && keepLocalTime) {
          localAdjust = this._dateTzOffset();
        }
        this._offset = input;
        this._isUTC = true;
        if (localAdjust != null) {
          this.subtract(localAdjust, 'm');
        }
        if (offset !== input) {
          if (!keepLocalTime || this._changeInProgress) {
            addOrSubtractDurationFromMoment(this, moment.duration(offset - input, 'm'), 1, false);
          } else if (!this._changeInProgress) {
            this._changeInProgress = true;
            moment.updateOffset(this, true);
            this._changeInProgress = null;
          }
        }
      } else {
        return this._isUTC ? offset : this._dateTzOffset();
      }
      return this;
    },
    zoneAbbr: function () {
      return this._isUTC ? 'UTC' : '';
    },
    zoneName: function () {
      return this._isUTC ? 'Coordinated Universal Time' : '';
    },
    parseZone: function () {
      if (this._tzm) {
        this.zone(this._tzm);
      } else if (typeof this._i === 'string') {
        this.zone(this._i);
      }
      return this;
    },
    hasAlignedHourOffset: function (input) {
      if (!input) {
        input = 0;
      } else {
        input = moment(input).zone();
      }
      return (this.zone() - input) % 60 === 0;
    },
    daysInMonth: function () {
      return daysInMonth(this.year(), this.month());
    },
    dayOfYear: function (input) {
      var dayOfYear = round((moment(this).startOf('day') - moment(this).startOf('year')) / 86400000) + 1;
      return input == null ? dayOfYear : this.add(input - dayOfYear, 'd');
    },
    quarter: function (input) {
      return input == null ? Math.ceil((this.month() + 1) / 3) : this.month((input - 1) * 3 + this.month() % 3);
    },
    weekYear: function (input) {
      var year = weekOfYear(this, this.localeData()._week.dow, this.localeData()._week.doy).year;
      return input == null ? year : this.add(input - year, 'y');
    },
    isoWeekYear: function (input) {
      var year = weekOfYear(this, 1, 4).year;
      return input == null ? year : this.add(input - year, 'y');
    },
    week: function (input) {
      var week = this.localeData().week(this);
      return input == null ? week : this.add((input - week) * 7, 'd');
    },
    isoWeek: function (input) {
      var week = weekOfYear(this, 1, 4).week;
      return input == null ? week : this.add((input - week) * 7, 'd');
    },
    weekday: function (input) {
      var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
      return input == null ? weekday : this.add(input - weekday, 'd');
    },
    isoWeekday: function (input) {
      // behaves the same as moment#day except
      // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
      // as a setter, sunday should belong to the previous week.
      return input == null ? this.day() || 7 : this.day(this.day() % 7 ? input : input - 7);
    },
    isoWeeksInYear: function () {
      return weeksInYear(this.year(), 1, 4);
    },
    weeksInYear: function () {
      var weekInfo = this.localeData()._week;
      return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
    },
    get: function (units) {
      units = normalizeUnits(units);
      return this[units]();
    },
    set: function (units, value) {
      units = normalizeUnits(units);
      if (typeof this[units] === 'function') {
        this[units](value);
      }
      return this;
    },
    locale: function (key) {
      var newLocaleData;
      if (key === undefined) {
        return this._locale._abbr;
      } else {
        newLocaleData = moment.localeData(key);
        if (newLocaleData != null) {
          this._locale = newLocaleData;
        }
        return this;
      }
    },
    lang: deprecate('moment().lang() is deprecated. Use moment().localeData() instead.', function (key) {
      if (key === undefined) {
        return this.localeData();
      } else {
        return this.locale(key);
      }
    }),
    localeData: function () {
      return this._locale;
    },
    _dateTzOffset: function () {
      // On Firefox.24 Date#getTimezoneOffset returns a floating point.
      // https://github.com/moment/moment/pull/1871
      return Math.round(this._d.getTimezoneOffset() / 15) * 15;
    }
  });
  function rawMonthSetter(mom, value) {
    var dayOfMonth;
    // TODO: Move this out of here!
    if (typeof value === 'string') {
      value = mom.localeData().monthsParse(value);
      // TODO: Another silent failure?
      if (typeof value !== 'number') {
        return mom;
      }
    }
    dayOfMonth = Math.min(mom.date(), daysInMonth(mom.year(), value));
    mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);
    return mom;
  }
  function rawGetter(mom, unit) {
    return mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]();
  }
  function rawSetter(mom, unit, value) {
    if (unit === 'Month') {
      return rawMonthSetter(mom, value);
    } else {
      return mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
    }
  }
  function makeAccessor(unit, keepTime) {
    return function (value) {
      if (value != null) {
        rawSetter(this, unit, value);
        moment.updateOffset(this, keepTime);
        return this;
      } else {
        return rawGetter(this, unit);
      }
    };
  }
  moment.fn.millisecond = moment.fn.milliseconds = makeAccessor('Milliseconds', false);
  moment.fn.second = moment.fn.seconds = makeAccessor('Seconds', false);
  moment.fn.minute = moment.fn.minutes = makeAccessor('Minutes', false);
  // Setting the hour should keep the time, because the user explicitly
  // specified which hour he wants. So trying to maintain the same hour (in
  // a new timezone) makes sense. Adding/subtracting hours does not follow
  // this rule.
  moment.fn.hour = moment.fn.hours = makeAccessor('Hours', true);
  // moment.fn.month is defined separately
  moment.fn.date = makeAccessor('Date', true);
  moment.fn.dates = deprecate('dates accessor is deprecated. Use date instead.', makeAccessor('Date', true));
  moment.fn.year = makeAccessor('FullYear', true);
  moment.fn.years = deprecate('years accessor is deprecated. Use year instead.', makeAccessor('FullYear', true));
  // add plural methods
  moment.fn.days = moment.fn.day;
  moment.fn.months = moment.fn.month;
  moment.fn.weeks = moment.fn.week;
  moment.fn.isoWeeks = moment.fn.isoWeek;
  moment.fn.quarters = moment.fn.quarter;
  // add aliased format methods
  moment.fn.toJSON = moment.fn.toISOString;
  /************************************
        Duration Prototype
    ************************************/
  function daysToYears(days) {
    // 400 years have 146097 days (taking into account leap year rules)
    return days * 400 / 146097;
  }
  function yearsToDays(years) {
    // years * 365 + absRound(years / 4) -
    //     absRound(years / 100) + absRound(years / 400);
    return years * 146097 / 400;
  }
  extend(moment.duration.fn = Duration.prototype, {
    _bubble: function () {
      var milliseconds = this._milliseconds, days = this._days, months = this._months, data = this._data, seconds, minutes, hours, years = 0;
      // The following code bubbles up values, see the tests for
      // examples of what that means.
      data.milliseconds = milliseconds % 1000;
      seconds = absRound(milliseconds / 1000);
      data.seconds = seconds % 60;
      minutes = absRound(seconds / 60);
      data.minutes = minutes % 60;
      hours = absRound(minutes / 60);
      data.hours = hours % 24;
      days += absRound(hours / 24);
      // Accurately convert days to years, assume start from year 0.
      years = absRound(daysToYears(days));
      days -= absRound(yearsToDays(years));
      // 30 days to a month
      // TODO (iskren): Use anchor date (like 1st Jan) to compute this.
      months += absRound(days / 30);
      days %= 30;
      // 12 months -> 1 year
      years += absRound(months / 12);
      months %= 12;
      data.days = days;
      data.months = months;
      data.years = years;
    },
    abs: function () {
      this._milliseconds = Math.abs(this._milliseconds);
      this._days = Math.abs(this._days);
      this._months = Math.abs(this._months);
      this._data.milliseconds = Math.abs(this._data.milliseconds);
      this._data.seconds = Math.abs(this._data.seconds);
      this._data.minutes = Math.abs(this._data.minutes);
      this._data.hours = Math.abs(this._data.hours);
      this._data.months = Math.abs(this._data.months);
      this._data.years = Math.abs(this._data.years);
      return this;
    },
    weeks: function () {
      return absRound(this.days() / 7);
    },
    valueOf: function () {
      return this._milliseconds + this._days * 86400000 + this._months % 12 * 2592000000 + toInt(this._months / 12) * 31536000000;
    },
    humanize: function (withSuffix) {
      var output = relativeTime(this, !withSuffix, this.localeData());
      if (withSuffix) {
        output = this.localeData().pastFuture(+this, output);
      }
      return this.localeData().postformat(output);
    },
    add: function (input, val) {
      // supports only 2.0-style add(1, 's') or add(moment)
      var dur = moment.duration(input, val);
      this._milliseconds += dur._milliseconds;
      this._days += dur._days;
      this._months += dur._months;
      this._bubble();
      return this;
    },
    subtract: function (input, val) {
      var dur = moment.duration(input, val);
      this._milliseconds -= dur._milliseconds;
      this._days -= dur._days;
      this._months -= dur._months;
      this._bubble();
      return this;
    },
    get: function (units) {
      units = normalizeUnits(units);
      return this[units.toLowerCase() + 's']();
    },
    as: function (units) {
      var days, months;
      units = normalizeUnits(units);
      if (units === 'month' || units === 'year') {
        days = this._days + this._milliseconds / 86400000;
        months = this._months + daysToYears(days) * 12;
        return units === 'month' ? months : months / 12;
      } else {
        // handle milliseconds separately because of floating point math errors (issue #1867)
        days = this._days + yearsToDays(this._months / 12);
        switch (units) {
        case 'week':
          return days / 7 + this._milliseconds / 604800000;
        case 'day':
          return days + this._milliseconds / 86400000;
        case 'hour':
          return days * 24 + this._milliseconds / 3600000;
        case 'minute':
          return days * 24 * 60 + this._milliseconds / 60000;
        case 'second':
          return days * 24 * 60 * 60 + this._milliseconds / 1000;
        // Math.floor prevents floating point math errors here
        case 'millisecond':
          return Math.floor(days * 24 * 60 * 60 * 1000) + this._milliseconds;
        default:
          throw new Error('Unknown unit ' + units);
        }
      }
    },
    lang: moment.fn.lang,
    locale: moment.fn.locale,
    toIsoString: deprecate('toIsoString() is deprecated. Please use toISOString() instead ' + '(notice the capitals)', function () {
      return this.toISOString();
    }),
    toISOString: function () {
      // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
      var years = Math.abs(this.years()), months = Math.abs(this.months()), days = Math.abs(this.days()), hours = Math.abs(this.hours()), minutes = Math.abs(this.minutes()), seconds = Math.abs(this.seconds() + this.milliseconds() / 1000);
      if (!this.asSeconds()) {
        // this is the same as C#'s (Noda) and python (isodate)...
        // but not other JS (goog.date)
        return 'P0D';
      }
      return (this.asSeconds() < 0 ? '-' : '') + 'P' + (years ? years + 'Y' : '') + (months ? months + 'M' : '') + (days ? days + 'D' : '') + (hours || minutes || seconds ? 'T' : '') + (hours ? hours + 'H' : '') + (minutes ? minutes + 'M' : '') + (seconds ? seconds + 'S' : '');
    },
    localeData: function () {
      return this._locale;
    }
  });
  moment.duration.fn.toString = moment.duration.fn.toISOString;
  function makeDurationGetter(name) {
    moment.duration.fn[name] = function () {
      return this._data[name];
    };
  }
  for (i in unitMillisecondFactors) {
    if (hasOwnProp(unitMillisecondFactors, i)) {
      makeDurationGetter(i.toLowerCase());
    }
  }
  moment.duration.fn.asMilliseconds = function () {
    return this.as('ms');
  };
  moment.duration.fn.asSeconds = function () {
    return this.as('s');
  };
  moment.duration.fn.asMinutes = function () {
    return this.as('m');
  };
  moment.duration.fn.asHours = function () {
    return this.as('h');
  };
  moment.duration.fn.asDays = function () {
    return this.as('d');
  };
  moment.duration.fn.asWeeks = function () {
    return this.as('weeks');
  };
  moment.duration.fn.asMonths = function () {
    return this.as('M');
  };
  moment.duration.fn.asYears = function () {
    return this.as('y');
  };
  /************************************
        Default Locale
    ************************************/
  // Set default locale, other locale will inherit from English.
  moment.locale('en', {
    ordinal: function (number) {
      var b = number % 10, output = toInt(number % 100 / 10) === 1 ? 'th' : b === 1 ? 'st' : b === 2 ? 'nd' : b === 3 ? 'rd' : 'th';
      return number + output;
    }
  });
  /* EMBED_LOCALES */
  /************************************
        Exposing Moment
    ************************************/
  function makeGlobal(shouldDeprecate) {
    /*global ender:false */
    if (typeof ender !== 'undefined') {
      return;
    }
    oldGlobalMoment = globalScope.moment;
    if (shouldDeprecate) {
      globalScope.moment = deprecate('Accessing Moment through the global scope is ' + 'deprecated, and will be removed in an upcoming ' + 'release.', moment);
    } else {
      globalScope.moment = moment;
    }
  }
  // CommonJS module is defined
  if (hasModule) {
    module.exports = moment;
  } else if (typeof define === 'function' && define.amd) {
    define('moment', function (require, exports, module) {
      if (module.config && module.config() && module.config().noGlobal === true) {
        // release the global variable
        globalScope.moment = oldGlobalMoment;
      }
      return moment;
    });
    makeGlobal(true);
  } else {
    makeGlobal();
  }
}.call(this));/**
 * @preserve FastClick: polyfill to remove click delays on browsers with touch UIs.
 *
 * @version 1.0.3
 * @codingstandard ftlabs-jsv2
 * @copyright The Financial Times Limited [All Rights Reserved]
 * @license MIT License (see LICENSE.txt)
 */
/*jslint browser:true, node:true*/
/*global define, Event, Node*/
/**
 * Instantiate fast-clicking listeners on the specified layer.
 *
 * @constructor
 * @param {Element} layer The layer to listen on
 * @param {Object} options The options to override the defaults
 */
function FastClick(layer, options) {
  'use strict';
  var oldOnClick;
  options = options || {};
  /**
	 * Whether a click is currently being tracked.
	 *
	 * @type boolean
	 */
  this.trackingClick = false;
  /**
	 * Timestamp for when click tracking started.
	 *
	 * @type number
	 */
  this.trackingClickStart = 0;
  /**
	 * The element being tracked for a click.
	 *
	 * @type EventTarget
	 */
  this.targetElement = null;
  /**
	 * X-coordinate of touch start event.
	 *
	 * @type number
	 */
  this.touchStartX = 0;
  /**
	 * Y-coordinate of touch start event.
	 *
	 * @type number
	 */
  this.touchStartY = 0;
  /**
	 * ID of the last touch, retrieved from Touch.identifier.
	 *
	 * @type number
	 */
  this.lastTouchIdentifier = 0;
  /**
	 * Touchmove boundary, beyond which a click will be cancelled.
	 *
	 * @type number
	 */
  this.touchBoundary = options.touchBoundary || 10;
  /**
	 * The FastClick layer.
	 *
	 * @type Element
	 */
  this.layer = layer;
  /**
	 * The minimum time between tap(touchstart and touchend) events
	 *
	 * @type number
	 */
  this.tapDelay = options.tapDelay || 200;
  if (FastClick.notNeeded(layer)) {
    return;
  }
  // Some old versions of Android don't have Function.prototype.bind
  function bind(method, context) {
    return function () {
      return method.apply(context, arguments);
    };
  }
  var methods = [
      'onMouse',
      'onClick',
      'onTouchStart',
      'onTouchMove',
      'onTouchEnd',
      'onTouchCancel'
    ];
  var context = this;
  for (var i = 0, l = methods.length; i < l; i++) {
    context[methods[i]] = bind(context[methods[i]], context);
  }
  // Set up event handlers as required
  if (deviceIsAndroid) {
    layer.addEventListener('mouseover', this.onMouse, true);
    layer.addEventListener('mousedown', this.onMouse, true);
    layer.addEventListener('mouseup', this.onMouse, true);
  }
  layer.addEventListener('click', this.onClick, true);
  layer.addEventListener('touchstart', this.onTouchStart, false);
  layer.addEventListener('touchmove', this.onTouchMove, false);
  layer.addEventListener('touchend', this.onTouchEnd, false);
  layer.addEventListener('touchcancel', this.onTouchCancel, false);
  // Hack is required for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
  // which is how FastClick normally stops click events bubbling to callbacks registered on the FastClick
  // layer when they are cancelled.
  if (!Event.prototype.stopImmediatePropagation) {
    layer.removeEventListener = function (type, callback, capture) {
      var rmv = Node.prototype.removeEventListener;
      if (type === 'click') {
        rmv.call(layer, type, callback.hijacked || callback, capture);
      } else {
        rmv.call(layer, type, callback, capture);
      }
    };
    layer.addEventListener = function (type, callback, capture) {
      var adv = Node.prototype.addEventListener;
      if (type === 'click') {
        adv.call(layer, type, callback.hijacked || (callback.hijacked = function (event) {
          if (!event.propagationStopped) {
            callback(event);
          }
        }), capture);
      } else {
        adv.call(layer, type, callback, capture);
      }
    };
  }
  // If a handler is already declared in the element's onclick attribute, it will be fired before
  // FastClick's onClick handler. Fix this by pulling out the user-defined handler function and
  // adding it as listener.
  if (typeof layer.onclick === 'function') {
    // Android browser on at least 3.2 requires a new reference to the function in layer.onclick
    // - the old one won't work if passed to addEventListener directly.
    oldOnClick = layer.onclick;
    layer.addEventListener('click', function (event) {
      oldOnClick(event);
    }, false);
    layer.onclick = null;
  }
}
/**
 * Android requires exceptions.
 *
 * @type boolean
 */
var deviceIsAndroid = navigator.userAgent.indexOf('Android') > 0;
/**
 * iOS requires exceptions.
 *
 * @type boolean
 */
var deviceIsIOS = /iP(ad|hone|od)/.test(navigator.userAgent);
/**
 * iOS 4 requires an exception for select elements.
 *
 * @type boolean
 */
var deviceIsIOS4 = deviceIsIOS && /OS 4_\d(_\d)?/.test(navigator.userAgent);
/**
 * iOS 6.0(+?) requires the target element to be manually derived
 *
 * @type boolean
 */
var deviceIsIOSWithBadTarget = deviceIsIOS && /OS ([6-9]|\d{2})_\d/.test(navigator.userAgent);
/**
 * BlackBerry requires exceptions.
 *
 * @type boolean
 */
var deviceIsBlackBerry10 = navigator.userAgent.indexOf('BB10') > 0;
/**
 * Determine whether a given element requires a native click.
 *
 * @param {EventTarget|Element} target Target DOM element
 * @returns {boolean} Returns true if the element needs a native click
 */
FastClick.prototype.needsClick = function (target) {
  'use strict';
  switch (target.nodeName.toLowerCase()) {
  // Don't send a synthetic click to disabled inputs (issue #62)
  case 'button':
  case 'select':
  case 'textarea':
    if (target.disabled) {
      return true;
    }
    break;
  case 'input':
    // File inputs need real clicks on iOS 6 due to a browser bug (issue #68)
    if (deviceIsIOS && target.type === 'file' || target.disabled) {
      return true;
    }
    break;
  case 'label':
  case 'video':
    return true;
  }
  return /\bneedsclick\b/.test(target.className);
};
/**
 * Determine whether a given element requires a call to focus to simulate click into element.
 *
 * @param {EventTarget|Element} target Target DOM element
 * @returns {boolean} Returns true if the element requires a call to focus to simulate native click.
 */
FastClick.prototype.needsFocus = function (target) {
  'use strict';
  switch (target.nodeName.toLowerCase()) {
  case 'textarea':
    return true;
  case 'select':
    return !deviceIsAndroid;
  case 'input':
    switch (target.type) {
    case 'button':
    case 'checkbox':
    case 'file':
    case 'image':
    case 'radio':
    case 'submit':
      return false;
    }
    // No point in attempting to focus disabled inputs
    return !target.disabled && !target.readOnly;
  default:
    return /\bneedsfocus\b/.test(target.className);
  }
};
/**
 * Send a click event to the specified element.
 *
 * @param {EventTarget|Element} targetElement
 * @param {Event} event
 */
FastClick.prototype.sendClick = function (targetElement, event) {
  'use strict';
  var clickEvent, touch;
  // On some Android devices activeElement needs to be blurred otherwise the synthetic click will have no effect (#24)
  if (document.activeElement && document.activeElement !== targetElement) {
    document.activeElement.blur();
  }
  touch = event.changedTouches[0];
  // Synthesise a click event, with an extra attribute so it can be tracked
  clickEvent = document.createEvent('MouseEvents');
  clickEvent.initMouseEvent(this.determineEventType(targetElement), true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
  clickEvent.forwardedTouchEvent = true;
  targetElement.dispatchEvent(clickEvent);
};
FastClick.prototype.determineEventType = function (targetElement) {
  'use strict';
  //Issue #159: Android Chrome Select Box does not open with a synthetic click event
  if (deviceIsAndroid && targetElement.tagName.toLowerCase() === 'select') {
    return 'mousedown';
  }
  return 'click';
};
/**
 * @param {EventTarget|Element} targetElement
 */
FastClick.prototype.focus = function (targetElement) {
  'use strict';
  var length;
  // Issue #160: on iOS 7, some input elements (e.g. date datetime) throw a vague TypeError on setSelectionRange. These elements don't have an integer value for the selectionStart and selectionEnd properties, but unfortunately that can't be used for detection because accessing the properties also throws a TypeError. Just check the type instead. Filed as Apple bug #15122724.
  if (deviceIsIOS && targetElement.setSelectionRange && targetElement.type.indexOf('date') !== 0 && targetElement.type !== 'time') {
    length = targetElement.value.length;
    targetElement.setSelectionRange(length, length);
  } else {
    targetElement.focus();
  }
};
/**
 * Check whether the given target element is a child of a scrollable layer and if so, set a flag on it.
 *
 * @param {EventTarget|Element} targetElement
 */
FastClick.prototype.updateScrollParent = function (targetElement) {
  'use strict';
  var scrollParent, parentElement;
  scrollParent = targetElement.fastClickScrollParent;
  // Attempt to discover whether the target element is contained within a scrollable layer. Re-check if the
  // target element was moved to another parent.
  if (!scrollParent || !scrollParent.contains(targetElement)) {
    parentElement = targetElement;
    do {
      if (parentElement.scrollHeight > parentElement.offsetHeight) {
        scrollParent = parentElement;
        targetElement.fastClickScrollParent = parentElement;
        break;
      }
      parentElement = parentElement.parentElement;
    } while (parentElement);
  }
  // Always update the scroll top tracker if possible.
  if (scrollParent) {
    scrollParent.fastClickLastScrollTop = scrollParent.scrollTop;
  }
};
/**
 * @param {EventTarget} targetElement
 * @returns {Element|EventTarget}
 */
FastClick.prototype.getTargetElementFromEventTarget = function (eventTarget) {
  'use strict';
  // On some older browsers (notably Safari on iOS 4.1 - see issue #56) the event target may be a text node.
  if (eventTarget.nodeType === Node.TEXT_NODE) {
    return eventTarget.parentNode;
  }
  return eventTarget;
};
/**
 * On touch start, record the position and scroll offset.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onTouchStart = function (event) {
  'use strict';
  var targetElement, touch, selection;
  // Ignore multiple touches, otherwise pinch-to-zoom is prevented if both fingers are on the FastClick element (issue #111).
  if (event.targetTouches.length > 1) {
    return true;
  }
  targetElement = this.getTargetElementFromEventTarget(event.target);
  touch = event.targetTouches[0];
  if (deviceIsIOS) {
    // Only trusted events will deselect text on iOS (issue #49)
    selection = window.getSelection();
    if (selection.rangeCount && !selection.isCollapsed) {
      return true;
    }
    if (!deviceIsIOS4) {
      // Weird things happen on iOS when an alert or confirm dialog is opened from a click event callback (issue #23):
      // when the user next taps anywhere else on the page, new touchstart and touchend events are dispatched
      // with the same identifier as the touch event that previously triggered the click that triggered the alert.
      // Sadly, there is an issue on iOS 4 that causes some normal touch events to have the same identifier as an
      // immediately preceeding touch event (issue #52), so this fix is unavailable on that platform.
      // Issue 120: touch.identifier is 0 when Chrome dev tools 'Emulate touch events' is set with an iOS device UA string,
      // which causes all touch events to be ignored. As this block only applies to iOS, and iOS identifiers are always long,
      // random integers, it's safe to to continue if the identifier is 0 here.
      if (touch.identifier && touch.identifier === this.lastTouchIdentifier) {
        event.preventDefault();
        return false;
      }
      this.lastTouchIdentifier = touch.identifier;
      // If the target element is a child of a scrollable layer (using -webkit-overflow-scrolling: touch) and:
      // 1) the user does a fling scroll on the scrollable layer
      // 2) the user stops the fling scroll with another tap
      // then the event.target of the last 'touchend' event will be the element that was under the user's finger
      // when the fling scroll was started, causing FastClick to send a click event to that layer - unless a check
      // is made to ensure that a parent layer was not scrolled before sending a synthetic click (issue #42).
      this.updateScrollParent(targetElement);
    }
  }
  this.trackingClick = true;
  this.trackingClickStart = event.timeStamp;
  this.targetElement = targetElement;
  this.touchStartX = touch.pageX;
  this.touchStartY = touch.pageY;
  // Prevent phantom clicks on fast double-tap (issue #36)
  if (event.timeStamp - this.lastClickTime < this.tapDelay) {
    event.preventDefault();
  }
  return true;
};
/**
 * Based on a touchmove event object, check whether the touch has moved past a boundary since it started.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.touchHasMoved = function (event) {
  'use strict';
  var touch = event.changedTouches[0], boundary = this.touchBoundary;
  if (Math.abs(touch.pageX - this.touchStartX) > boundary || Math.abs(touch.pageY - this.touchStartY) > boundary) {
    return true;
  }
  return false;
};
/**
 * Update the last position.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onTouchMove = function (event) {
  'use strict';
  if (!this.trackingClick) {
    return true;
  }
  // If the touch has moved, cancel the click tracking
  if (this.targetElement !== this.getTargetElementFromEventTarget(event.target) || this.touchHasMoved(event)) {
    this.trackingClick = false;
    this.targetElement = null;
  }
  return true;
};
/**
 * Attempt to find the labelled control for the given label element.
 *
 * @param {EventTarget|HTMLLabelElement} labelElement
 * @returns {Element|null}
 */
FastClick.prototype.findControl = function (labelElement) {
  'use strict';
  // Fast path for newer browsers supporting the HTML5 control attribute
  if (labelElement.control !== undefined) {
    return labelElement.control;
  }
  // All browsers under test that support touch events also support the HTML5 htmlFor attribute
  if (labelElement.htmlFor) {
    return document.getElementById(labelElement.htmlFor);
  }
  // If no for attribute exists, attempt to retrieve the first labellable descendant element
  // the list of which is defined here: http://www.w3.org/TR/html5/forms.html#category-label
  return labelElement.querySelector('button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea');
};
/**
 * On touch end, determine whether to send a click event at once.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onTouchEnd = function (event) {
  'use strict';
  var forElement, trackingClickStart, targetTagName, scrollParent, touch, targetElement = this.targetElement;
  if (!this.trackingClick) {
    return true;
  }
  // Prevent phantom clicks on fast double-tap (issue #36)
  if (event.timeStamp - this.lastClickTime < this.tapDelay) {
    this.cancelNextClick = true;
    return true;
  }
  // Reset to prevent wrong click cancel on input (issue #156).
  this.cancelNextClick = false;
  this.lastClickTime = event.timeStamp;
  trackingClickStart = this.trackingClickStart;
  this.trackingClick = false;
  this.trackingClickStart = 0;
  // On some iOS devices, the targetElement supplied with the event is invalid if the layer
  // is performing a transition or scroll, and has to be re-detected manually. Note that
  // for this to function correctly, it must be called *after* the event target is checked!
  // See issue #57; also filed as rdar://13048589 .
  if (deviceIsIOSWithBadTarget) {
    touch = event.changedTouches[0];
    // In certain cases arguments of elementFromPoint can be negative, so prevent setting targetElement to null
    targetElement = document.elementFromPoint(touch.pageX - window.pageXOffset, touch.pageY - window.pageYOffset) || targetElement;
    targetElement.fastClickScrollParent = this.targetElement.fastClickScrollParent;
  }
  targetTagName = targetElement.tagName.toLowerCase();
  if (targetTagName === 'label') {
    forElement = this.findControl(targetElement);
    if (forElement) {
      this.focus(targetElement);
      if (deviceIsAndroid) {
        return false;
      }
      targetElement = forElement;
    }
  } else if (this.needsFocus(targetElement)) {
    // Case 1: If the touch started a while ago (best guess is 100ms based on tests for issue #36) then focus will be triggered anyway. Return early and unset the target element reference so that the subsequent click will be allowed through.
    // Case 2: Without this exception for input elements tapped when the document is contained in an iframe, then any inputted text won't be visible even though the value attribute is updated as the user types (issue #37).
    if (event.timeStamp - trackingClickStart > 100 || deviceIsIOS && window.top !== window && targetTagName === 'input') {
      this.targetElement = null;
      return false;
    }
    this.focus(targetElement);
    this.sendClick(targetElement, event);
    // Select elements need the event to go through on iOS 4, otherwise the selector menu won't open.
    // Also this breaks opening selects when VoiceOver is active on iOS6, iOS7 (and possibly others)
    if (!deviceIsIOS || targetTagName !== 'select') {
      this.targetElement = null;
      event.preventDefault();
    }
    return false;
  }
  if (deviceIsIOS && !deviceIsIOS4) {
    // Don't send a synthetic click event if the target element is contained within a parent layer that was scrolled
    // and this tap is being used to stop the scrolling (usually initiated by a fling - issue #42).
    scrollParent = targetElement.fastClickScrollParent;
    if (scrollParent && scrollParent.fastClickLastScrollTop !== scrollParent.scrollTop) {
      return true;
    }
  }
  // Prevent the actual click from going though - unless the target node is marked as requiring
  // real clicks or if it is in the whitelist in which case only non-programmatic clicks are permitted.
  if (!this.needsClick(targetElement)) {
    event.preventDefault();
    this.sendClick(targetElement, event);
  }
  return false;
};
/**
 * On touch cancel, stop tracking the click.
 *
 * @returns {void}
 */
FastClick.prototype.onTouchCancel = function () {
  'use strict';
  this.trackingClick = false;
  this.targetElement = null;
};
/**
 * Determine mouse events which should be permitted.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onMouse = function (event) {
  'use strict';
  // If a target element was never set (because a touch event was never fired) allow the event
  if (!this.targetElement) {
    return true;
  }
  if (event.forwardedTouchEvent) {
    return true;
  }
  // Programmatically generated events targeting a specific element should be permitted
  if (!event.cancelable) {
    return true;
  }
  // Derive and check the target element to see whether the mouse event needs to be permitted;
  // unless explicitly enabled, prevent non-touch click events from triggering actions,
  // to prevent ghost/doubleclicks.
  if (!this.needsClick(this.targetElement) || this.cancelNextClick) {
    // Prevent any user-added listeners declared on FastClick element from being fired.
    if (event.stopImmediatePropagation) {
      event.stopImmediatePropagation();
    } else {
      // Part of the hack for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
      event.propagationStopped = true;
    }
    // Cancel the event
    event.stopPropagation();
    event.preventDefault();
    return false;
  }
  // If the mouse event is permitted, return true for the action to go through.
  return true;
};
/**
 * On actual clicks, determine whether this is a touch-generated click, a click action occurring
 * naturally after a delay after a touch (which needs to be cancelled to avoid duplication), or
 * an actual click which should be permitted.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onClick = function (event) {
  'use strict';
  var permitted;
  // It's possible for another FastClick-like library delivered with third-party code to fire a click event before FastClick does (issue #44). In that case, set the click-tracking flag back to false and return early. This will cause onTouchEnd to return early.
  if (this.trackingClick) {
    this.targetElement = null;
    this.trackingClick = false;
    return true;
  }
  // Very odd behaviour on iOS (issue #18): if a submit element is present inside a form and the user hits enter in the iOS simulator or clicks the Go button on the pop-up OS keyboard the a kind of 'fake' click event will be triggered with the submit-type input element as the target.
  if (event.target.type === 'submit' && event.detail === 0) {
    return true;
  }
  permitted = this.onMouse(event);
  // Only unset targetElement if the click is not permitted. This will ensure that the check for !targetElement in onMouse fails and the browser's click doesn't go through.
  if (!permitted) {
    this.targetElement = null;
  }
  // If clicks are permitted, return true for the action to go through.
  return permitted;
};
/**
 * Remove all FastClick's event listeners.
 *
 * @returns {void}
 */
FastClick.prototype.destroy = function () {
  'use strict';
  var layer = this.layer;
  if (deviceIsAndroid) {
    layer.removeEventListener('mouseover', this.onMouse, true);
    layer.removeEventListener('mousedown', this.onMouse, true);
    layer.removeEventListener('mouseup', this.onMouse, true);
  }
  layer.removeEventListener('click', this.onClick, true);
  layer.removeEventListener('touchstart', this.onTouchStart, false);
  layer.removeEventListener('touchmove', this.onTouchMove, false);
  layer.removeEventListener('touchend', this.onTouchEnd, false);
  layer.removeEventListener('touchcancel', this.onTouchCancel, false);
};
/**
 * Check whether FastClick is needed.
 *
 * @param {Element} layer The layer to listen on
 */
FastClick.notNeeded = function (layer) {
  'use strict';
  var metaViewport;
  var chromeVersion;
  var blackberryVersion;
  // Devices that don't support touch don't need FastClick
  if (typeof window.ontouchstart === 'undefined') {
    return true;
  }
  // Chrome version - zero for other browsers
  chromeVersion = +(/Chrome\/([0-9]+)/.exec(navigator.userAgent) || [
    ,
    0
  ])[1];
  if (chromeVersion) {
    if (deviceIsAndroid) {
      metaViewport = document.querySelector('meta[name=viewport]');
      if (metaViewport) {
        // Chrome on Android with user-scalable="no" doesn't need FastClick (issue #89)
        if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
          return true;
        }
        // Chrome 32 and above with width=device-width or less don't need FastClick
        if (chromeVersion > 31 && document.documentElement.scrollWidth <= window.outerWidth) {
          return true;
        }
      }  // Chrome desktop doesn't need FastClick (issue #15)
    } else {
      return true;
    }
  }
  if (deviceIsBlackBerry10) {
    blackberryVersion = navigator.userAgent.match(/Version\/([0-9]*)\.([0-9]*)/);
    // BlackBerry 10.3+ does not require Fastclick library.
    // https://github.com/ftlabs/fastclick/issues/251
    if (blackberryVersion[1] >= 10 && blackberryVersion[2] >= 3) {
      metaViewport = document.querySelector('meta[name=viewport]');
      if (metaViewport) {
        // user-scalable=no eliminates click delay.
        if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
          return true;
        }
        // width=device-width (or less than device-width) eliminates click delay.
        if (document.documentElement.scrollWidth <= window.outerWidth) {
          return true;
        }
      }
    }
  }
  // IE10 with -ms-touch-action: none, which disables double-tap-to-zoom (issue #97)
  if (layer.style.msTouchAction === 'none') {
    return true;
  }
  return false;
};
/**
 * Factory method for creating a FastClick object
 *
 * @param {Element} layer The layer to listen on
 * @param {Object} options The options to override the defaults
 */
FastClick.attach = function (layer, options) {
  'use strict';
  return new FastClick(layer, options);
};
if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
  // AMD. Register as an anonymous module.
  define(function () {
    'use strict';
    return FastClick;
  });
} else if (typeof module !== 'undefined' && module.exports) {
  module.exports = FastClick.attach;
  module.exports.FastClick = FastClick;
} else {
  window.FastClick = FastClick;
}/*!
 * Modernizr v2.8.3
 * www.modernizr.com
 *
 * Copyright (c) Faruk Ates, Paul Irish, Alex Sexton
 * Available under the BSD and MIT licenses: www.modernizr.com/license/
 */
/*
 * Modernizr tests which native CSS3 and HTML5 features are available in
 * the current UA and makes the results available to you in two ways:
 * as properties on a global Modernizr object, and as classes on the
 * <html> element. This information allows you to progressively enhance
 * your pages with a granular level of control over the experience.
 *
 * Modernizr has an optional (not included) conditional resource loader
 * called Modernizr.load(), based on Yepnope.js (yepnopejs.com).
 * To get a build that includes Modernizr.load(), as well as choosing
 * which tests to include, go to www.modernizr.com/download/
 *
 * Authors        Faruk Ates, Paul Irish, Alex Sexton
 * Contributors   Ryan Seddon, Ben Alman
 */
window.Modernizr = function (window, document, undefined) {
  var version = '2.8.3', Modernizr = {},
    /*>>cssclasses*/
    // option for enabling the HTML classes to be added
    enableClasses = true,
    /*>>cssclasses*/
    docElement = document.documentElement,
    /**
     * Create our "modernizr" element that we do most feature tests on.
     */
    mod = 'modernizr', modElem = document.createElement(mod), mStyle = modElem.style,
    /**
     * Create the input element for various Web Forms feature tests.
     */
    inputElem = document.createElement('input'),
    /*>>smile*/
    smile = ':)',
    /*>>smile*/
    toString = {}.toString,
    // TODO :: make the prefixes more granular
    /*>>prefixes*/
    // List of property values to set for css tests. See ticket #21
    prefixes = ' -webkit- -moz- -o- -ms- '.split(' '),
    /*>>prefixes*/
    /*>>domprefixes*/
    // Following spec is to expose vendor-specific style properties as:
    //   elem.style.WebkitBorderRadius
    // and the following would be incorrect:
    //   elem.style.webkitBorderRadius
    // Webkit ghosts their properties in lowercase but Opera & Moz do not.
    // Microsoft uses a lowercase `ms` instead of the correct `Ms` in IE8+
    //   erik.eae.net/archives/2008/03/10/21.48.10/
    // More here: github.com/Modernizr/Modernizr/issues/issue/21
    omPrefixes = 'Webkit Moz O ms', cssomPrefixes = omPrefixes.split(' '), domPrefixes = omPrefixes.toLowerCase().split(' '),
    /*>>domprefixes*/
    /*>>ns*/
    ns = { 'svg': 'http://www.w3.org/2000/svg' },
    /*>>ns*/
    tests = {}, inputs = {}, attrs = {}, classes = [], slice = classes.slice, featureName,
    // used in testing loop
    /*>>teststyles*/
    // Inject element with style element and some CSS rules
    injectElementWithStyles = function (rule, callback, nodes, testnames) {
      var style, ret, node, docOverflow, div = document.createElement('div'),
        // After page load injecting a fake body doesn't work so check if body exists
        body = document.body,
        // IE6 and 7 won't return offsetWidth or offsetHeight unless it's in the body element, so we fake it.
        fakeBody = body || document.createElement('body');
      if (parseInt(nodes, 10)) {
        // In order not to give false positives we create a node for each test
        // This also allows the method to scale for unspecified uses
        while (nodes--) {
          node = document.createElement('div');
          node.id = testnames ? testnames[nodes] : mod + (nodes + 1);
          div.appendChild(node);
        }
      }
      // <style> elements in IE6-9 are considered 'NoScope' elements and therefore will be removed
      // when injected with innerHTML. To get around this you need to prepend the 'NoScope' element
      // with a 'scoped' element, in our case the soft-hyphen entity as it won't mess with our measurements.
      // msdn.microsoft.com/en-us/library/ms533897%28VS.85%29.aspx
      // Documents served as xml will throw if using &shy; so use xml friendly encoded version. See issue #277
      style = [
        '&#173;',
        '<style id="s',
        mod,
        '">',
        rule,
        '</style>'
      ].join('');
      div.id = mod;
      // IE6 will false positive on some tests due to the style element inside the test div somehow interfering offsetHeight, so insert it into body or fakebody.
      // Opera will act all quirky when injecting elements in documentElement when page is served as xml, needs fakebody too. #270
      (body ? div : fakeBody).innerHTML += style;
      fakeBody.appendChild(div);
      if (!body) {
        //avoid crashing IE8, if background image is used
        fakeBody.style.background = '';
        //Safari 5.13/5.1.4 OSX stops loading if ::-webkit-scrollbar is used and scrollbars are visible
        fakeBody.style.overflow = 'hidden';
        docOverflow = docElement.style.overflow;
        docElement.style.overflow = 'hidden';
        docElement.appendChild(fakeBody);
      }
      ret = callback(div, rule);
      // If this is done after page load we don't want to remove the body so check if body exists
      if (!body) {
        fakeBody.parentNode.removeChild(fakeBody);
        docElement.style.overflow = docOverflow;
      } else {
        div.parentNode.removeChild(div);
      }
      return !!ret;
    },
    /*>>teststyles*/
    /*>>mq*/
    // adapted from matchMedia polyfill
    // by Scott Jehl and Paul Irish
    // gist.github.com/786768
    testMediaQuery = function (mq) {
      var matchMedia = window.matchMedia || window.msMatchMedia;
      if (matchMedia) {
        return matchMedia(mq) && matchMedia(mq).matches || false;
      }
      var bool;
      injectElementWithStyles('@media ' + mq + ' { #' + mod + ' { position: absolute; } }', function (node) {
        bool = (window.getComputedStyle ? getComputedStyle(node, null) : node.currentStyle)['position'] == 'absolute';
      });
      return bool;
    },
    /*>>mq*/
    /*>>hasevent*/
    //
    // isEventSupported determines if a given element supports the given event
    // kangax.github.com/iseventsupported/
    //
    // The following results are known incorrects:
    //   Modernizr.hasEvent("webkitTransitionEnd", elem) // false negative
    //   Modernizr.hasEvent("textInput") // in Webkit. github.com/Modernizr/Modernizr/issues/333
    //   ...
    isEventSupported = function () {
      var TAGNAMES = {
          'select': 'input',
          'change': 'input',
          'submit': 'form',
          'reset': 'form',
          'error': 'img',
          'load': 'img',
          'abort': 'img'
        };
      function isEventSupported(eventName, element) {
        element = element || document.createElement(TAGNAMES[eventName] || 'div');
        eventName = 'on' + eventName;
        // When using `setAttribute`, IE skips "unload", WebKit skips "unload" and "resize", whereas `in` "catches" those
        var isSupported = eventName in element;
        if (!isSupported) {
          // If it has no `setAttribute` (i.e. doesn't implement Node interface), try generic element
          if (!element.setAttribute) {
            element = document.createElement('div');
          }
          if (element.setAttribute && element.removeAttribute) {
            element.setAttribute(eventName, '');
            isSupported = is(element[eventName], 'function');
            // If property was created, "remove it" (by setting value to `undefined`)
            if (!is(element[eventName], 'undefined')) {
              element[eventName] = undefined;
            }
            element.removeAttribute(eventName);
          }
        }
        element = null;
        return isSupported;
      }
      return isEventSupported;
    }(),
    /*>>hasevent*/
    // TODO :: Add flag for hasownprop ? didn't last time
    // hasOwnProperty shim by kangax needed for Safari 2.0 support
    _hasOwnProperty = {}.hasOwnProperty, hasOwnProp;
  if (!is(_hasOwnProperty, 'undefined') && !is(_hasOwnProperty.call, 'undefined')) {
    hasOwnProp = function (object, property) {
      return _hasOwnProperty.call(object, property);
    };
  } else {
    hasOwnProp = function (object, property) {
      /* yes, this can give false positives/negatives, but most of the time we don't care about those */
      return property in object && is(object.constructor.prototype[property], 'undefined');
    };
  }
  // Adapted from ES5-shim https://github.com/kriskowal/es5-shim/blob/master/es5-shim.js
  // es5.github.com/#x15.3.4.5
  if (!Function.prototype.bind) {
    Function.prototype.bind = function bind(that) {
      var target = this;
      if (typeof target != 'function') {
        throw new TypeError();
      }
      var args = slice.call(arguments, 1), bound = function () {
          if (this instanceof bound) {
            var F = function () {
            };
            F.prototype = target.prototype;
            var self = new F();
            var result = target.apply(self, args.concat(slice.call(arguments)));
            if (Object(result) === result) {
              return result;
            }
            return self;
          } else {
            return target.apply(that, args.concat(slice.call(arguments)));
          }
        };
      return bound;
    };
  }
  /**
     * setCss applies given styles to the Modernizr DOM node.
     */
  function setCss(str) {
    mStyle.cssText = str;
  }
  /**
     * setCssAll extrapolates all vendor-specific css strings.
     */
  function setCssAll(str1, str2) {
    return setCss(prefixes.join(str1 + ';') + (str2 || ''));
  }
  /**
     * is returns a boolean for if typeof obj is exactly type.
     */
  function is(obj, type) {
    return typeof obj === type;
  }
  /**
     * contains returns a boolean for if substr is found within str.
     */
  function contains(str, substr) {
    return !!~('' + str).indexOf(substr);
  }
  /*>>testprop*/
  // testProps is a generic CSS / DOM property test.
  // In testing support for a given CSS property, it's legit to test:
  //    `elem.style[styleName] !== undefined`
  // If the property is supported it will return an empty string,
  // if unsupported it will return undefined.
  // We'll take advantage of this quick test and skip setting a style
  // on our modernizr element, but instead just testing undefined vs
  // empty string.
  // Because the testing of the CSS property names (with "-", as
  // opposed to the camelCase DOM properties) is non-portable and
  // non-standard but works in WebKit and IE (but not Gecko or Opera),
  // we explicitly reject properties with dashes so that authors
  // developing in WebKit or IE first don't end up with
  // browser-specific content by accident.
  function testProps(props, prefixed) {
    for (var i in props) {
      var prop = props[i];
      if (!contains(prop, '-') && mStyle[prop] !== undefined) {
        return prefixed == 'pfx' ? prop : true;
      }
    }
    return false;
  }
  /*>>testprop*/
  // TODO :: add testDOMProps
  /**
     * testDOMProps is a generic DOM property test; if a browser supports
     *   a certain property, it won't return undefined for it.
     */
  function testDOMProps(props, obj, elem) {
    for (var i in props) {
      var item = obj[props[i]];
      if (item !== undefined) {
        // return the property name as a string
        if (elem === false)
          return props[i];
        // let's bind a function
        if (is(item, 'function')) {
          // default to autobind unless override
          return item.bind(elem || obj);
        }
        // return the unbound function or obj or value
        return item;
      }
    }
    return false;
  }
  /*>>testallprops*/
  /**
     * testPropsAll tests a list of DOM properties we want to check against.
     *   We specify literally ALL possible (known and/or likely) properties on
     *   the element including the non-vendor prefixed one, for forward-
     *   compatibility.
     */
  function testPropsAll(prop, prefixed, elem) {
    var ucProp = prop.charAt(0).toUpperCase() + prop.slice(1), props = (prop + ' ' + cssomPrefixes.join(ucProp + ' ') + ucProp).split(' ');
    // did they call .prefixed('boxSizing') or are we just testing a prop?
    if (is(prefixed, 'string') || is(prefixed, 'undefined')) {
      return testProps(props, prefixed);  // otherwise, they called .prefixed('requestAnimationFrame', window[, elem])
    } else {
      props = (prop + ' ' + domPrefixes.join(ucProp + ' ') + ucProp).split(' ');
      return testDOMProps(props, prefixed, elem);
    }
  }
  /*>>testallprops*/
  /**
     * Tests
     * -----
     */
  // The *new* flexbox
  // dev.w3.org/csswg/css3-flexbox
  tests['flexbox'] = function () {
    return testPropsAll('flexWrap');
  };
  // The *old* flexbox
  // www.w3.org/TR/2009/WD-css3-flexbox-20090723/
  tests['flexboxlegacy'] = function () {
    return testPropsAll('boxDirection');
  };
  // On the S60 and BB Storm, getContext exists, but always returns undefined
  // so we actually have to call getContext() to verify
  // github.com/Modernizr/Modernizr/issues/issue/97/
  tests['canvas'] = function () {
    var elem = document.createElement('canvas');
    return !!(elem.getContext && elem.getContext('2d'));
  };
  tests['canvastext'] = function () {
    return !!(Modernizr['canvas'] && is(document.createElement('canvas').getContext('2d').fillText, 'function'));
  };
  // webk.it/70117 is tracking a legit WebGL feature detect proposal
  // We do a soft detect which may false positive in order to avoid
  // an expensive context creation: bugzil.la/732441
  tests['webgl'] = function () {
    return !!window.WebGLRenderingContext;
  };
  /*
     * The Modernizr.touch test only indicates if the browser supports
     *    touch events, which does not necessarily reflect a touchscreen
     *    device, as evidenced by tablets running Windows 7 or, alas,
     *    the Palm Pre / WebOS (touch) phones.
     *
     * Additionally, Chrome (desktop) used to lie about its support on this,
     *    but that has since been rectified: crbug.com/36415
     *
     * We also test for Firefox 4 Multitouch Support.
     *
     * For more info, see: modernizr.github.com/Modernizr/touch.html
     */
  tests['touch'] = function () {
    var bool;
    if ('ontouchstart' in window || window.DocumentTouch && document instanceof DocumentTouch) {
      bool = true;
    } else {
      injectElementWithStyles([
        '@media (',
        prefixes.join('touch-enabled),('),
        mod,
        ')',
        '{#modernizr{top:9px;position:absolute}}'
      ].join(''), function (node) {
        bool = node.offsetTop === 9;
      });
    }
    return bool;
  };
  // geolocation is often considered a trivial feature detect...
  // Turns out, it's quite tricky to get right:
  //
  // Using !!navigator.geolocation does two things we don't want. It:
  //   1. Leaks memory in IE9: github.com/Modernizr/Modernizr/issues/513
  //   2. Disables page caching in WebKit: webk.it/43956
  //
  // Meanwhile, in Firefox < 8, an about:config setting could expose
  // a false positive that would throw an exception: bugzil.la/688158
  tests['geolocation'] = function () {
    return 'geolocation' in navigator;
  };
  tests['postmessage'] = function () {
    return !!window.postMessage;
  };
  // Chrome incognito mode used to throw an exception when using openDatabase
  // It doesn't anymore.
  tests['websqldatabase'] = function () {
    return !!window.openDatabase;
  };
  // Vendors had inconsistent prefixing with the experimental Indexed DB:
  // - Webkit's implementation is accessible through webkitIndexedDB
  // - Firefox shipped moz_indexedDB before FF4b9, but since then has been mozIndexedDB
  // For speed, we don't test the legacy (and beta-only) indexedDB
  tests['indexedDB'] = function () {
    return !!testPropsAll('indexedDB', window);
  };
  // documentMode logic from YUI to filter out IE8 Compat Mode
  //   which false positives.
  tests['hashchange'] = function () {
    return isEventSupported('hashchange', window) && (document.documentMode === undefined || document.documentMode > 7);
  };
  // Per 1.6:
  // This used to be Modernizr.historymanagement but the longer
  // name has been deprecated in favor of a shorter and property-matching one.
  // The old API is still available in 1.6, but as of 2.0 will throw a warning,
  // and in the first release thereafter disappear entirely.
  tests['history'] = function () {
    return !!(window.history && history.pushState);
  };
  tests['draganddrop'] = function () {
    var div = document.createElement('div');
    return 'draggable' in div || 'ondragstart' in div && 'ondrop' in div;
  };
  // FF3.6 was EOL'ed on 4/24/12, but the ESR version of FF10
  // will be supported until FF19 (2/12/13), at which time, ESR becomes FF17.
  // FF10 still uses prefixes, so check for it until then.
  // for more ESR info, see: mozilla.org/en-US/firefox/organizations/faq/
  tests['websockets'] = function () {
    return 'WebSocket' in window || 'MozWebSocket' in window;
  };
  // css-tricks.com/rgba-browser-support/
  tests['rgba'] = function () {
    // Set an rgba() color and check the returned value
    setCss('background-color:rgba(150,255,150,.5)');
    return contains(mStyle.backgroundColor, 'rgba');
  };
  tests['hsla'] = function () {
    // Same as rgba(), in fact, browsers re-map hsla() to rgba() internally,
    //   except IE9 who retains it as hsla
    setCss('background-color:hsla(120,40%,100%,.5)');
    return contains(mStyle.backgroundColor, 'rgba') || contains(mStyle.backgroundColor, 'hsla');
  };
  tests['multiplebgs'] = function () {
    // Setting multiple images AND a color on the background shorthand property
    //  and then querying the style.background property value for the number of
    //  occurrences of "url(" is a reliable method for detecting ACTUAL support for this!
    setCss('background:url(https://),url(https://),red url(https://)');
    // If the UA supports multiple backgrounds, there should be three occurrences
    //   of the string "url(" in the return value for elemStyle.background
    return /(url\s*\(.*?){3}/.test(mStyle.background);
  };
  // this will false positive in Opera Mini
  //   github.com/Modernizr/Modernizr/issues/396
  tests['backgroundsize'] = function () {
    return testPropsAll('backgroundSize');
  };
  tests['borderimage'] = function () {
    return testPropsAll('borderImage');
  };
  // Super comprehensive table about all the unique implementations of
  // border-radius: muddledramblings.com/table-of-css3-border-radius-compliance
  tests['borderradius'] = function () {
    return testPropsAll('borderRadius');
  };
  // WebOS unfortunately false positives on this test.
  tests['boxshadow'] = function () {
    return testPropsAll('boxShadow');
  };
  // FF3.0 will false positive on this test
  tests['textshadow'] = function () {
    return document.createElement('div').style.textShadow === '';
  };
  tests['opacity'] = function () {
    // Browsers that actually have CSS Opacity implemented have done so
    //  according to spec, which means their return values are within the
    //  range of [0.0,1.0] - including the leading zero.
    setCssAll('opacity:.55');
    // The non-literal . in this regex is intentional:
    //   German Chrome returns this value as 0,55
    // github.com/Modernizr/Modernizr/issues/#issue/59/comment/516632
    return /^0.55$/.test(mStyle.opacity);
  };
  // Note, Android < 4 will pass this test, but can only animate
  //   a single property at a time
  //   goo.gl/v3V4Gp
  tests['cssanimations'] = function () {
    return testPropsAll('animationName');
  };
  tests['csscolumns'] = function () {
    return testPropsAll('columnCount');
  };
  tests['cssgradients'] = function () {
    /**
         * For CSS Gradients syntax, please see:
         * webkit.org/blog/175/introducing-css-gradients/
         * developer.mozilla.org/en/CSS/-moz-linear-gradient
         * developer.mozilla.org/en/CSS/-moz-radial-gradient
         * dev.w3.org/csswg/css3-images/#gradients-
         */
    var str1 = 'background-image:', str2 = 'gradient(linear,left top,right bottom,from(#9f9),to(white));', str3 = 'linear-gradient(left top,#9f9, white);';
    setCss((str1 + '-webkit- '.split(' ').join(str2 + str1) + prefixes.join(str3 + str1)).slice(0, -str1.length));
    return contains(mStyle.backgroundImage, 'gradient');
  };
  tests['cssreflections'] = function () {
    return testPropsAll('boxReflect');
  };
  tests['csstransforms'] = function () {
    return !!testPropsAll('transform');
  };
  tests['csstransforms3d'] = function () {
    var ret = !!testPropsAll('perspective');
    // Webkit's 3D transforms are passed off to the browser's own graphics renderer.
    //   It works fine in Safari on Leopard and Snow Leopard, but not in Chrome in
    //   some conditions. As a result, Webkit typically recognizes the syntax but
    //   will sometimes throw a false positive, thus we must do a more thorough check:
    if (ret && 'webkitPerspective' in docElement.style) {
      // Webkit allows this media query to succeed only if the feature is enabled.
      // `@media (transform-3d),(-webkit-transform-3d){ ... }`
      injectElementWithStyles('@media (transform-3d),(-webkit-transform-3d){#modernizr{left:9px;position:absolute;height:3px;}}', function (node, rule) {
        ret = node.offsetLeft === 9 && node.offsetHeight === 3;
      });
    }
    return ret;
  };
  tests['csstransitions'] = function () {
    return testPropsAll('transition');
  };
  /*>>fontface*/
  // @font-face detection routine by Diego Perini
  // javascript.nwbox.com/CSSSupport/
  // false positives:
  //   WebOS github.com/Modernizr/Modernizr/issues/342
  //   WP7   github.com/Modernizr/Modernizr/issues/538
  tests['fontface'] = function () {
    var bool;
    injectElementWithStyles('@font-face {font-family:"font";src:url("https://")}', function (node, rule) {
      var style = document.getElementById('smodernizr'), sheet = style.sheet || style.styleSheet, cssText = sheet ? sheet.cssRules && sheet.cssRules[0] ? sheet.cssRules[0].cssText : sheet.cssText || '' : '';
      bool = /src/i.test(cssText) && cssText.indexOf(rule.split(' ')[0]) === 0;
    });
    return bool;
  };
  /*>>fontface*/
  // CSS generated content detection
  tests['generatedcontent'] = function () {
    var bool;
    injectElementWithStyles([
      '#',
      mod,
      '{font:0/0 a}#',
      mod,
      ':after{content:"',
      smile,
      '";visibility:hidden;font:3px/1 a}'
    ].join(''), function (node) {
      bool = node.offsetHeight >= 3;
    });
    return bool;
  };
  // These tests evaluate support of the video/audio elements, as well as
  // testing what types of content they support.
  //
  // We're using the Boolean constructor here, so that we can extend the value
  // e.g.  Modernizr.video     // true
  //       Modernizr.video.ogg // 'probably'
  //
  // Codec values from : github.com/NielsLeenheer/html5test/blob/9106a8/index.html#L845
  //                     thx to NielsLeenheer and zcorpan
  // Note: in some older browsers, "no" was a return value instead of empty string.
  //   It was live in FF3.5.0 and 3.5.1, but fixed in 3.5.2
  //   It was also live in Safari 4.0.0 - 4.0.4, but fixed in 4.0.5
  tests['video'] = function () {
    var elem = document.createElement('video'), bool = false;
    // IE9 Running on Windows Server SKU can cause an exception to be thrown, bug #224
    try {
      if (bool = !!elem.canPlayType) {
        bool = new Boolean(bool);
        bool.ogg = elem.canPlayType('video/ogg; codecs="theora"').replace(/^no$/, '');
        // Without QuickTime, this value will be `undefined`. github.com/Modernizr/Modernizr/issues/546
        bool.h264 = elem.canPlayType('video/mp4; codecs="avc1.42E01E"').replace(/^no$/, '');
        bool.webm = elem.canPlayType('video/webm; codecs="vp8, vorbis"').replace(/^no$/, '');
      }
    } catch (e) {
    }
    return bool;
  };
  tests['audio'] = function () {
    var elem = document.createElement('audio'), bool = false;
    try {
      if (bool = !!elem.canPlayType) {
        bool = new Boolean(bool);
        bool.ogg = elem.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, '');
        bool.mp3 = elem.canPlayType('audio/mpeg;').replace(/^no$/, '');
        // Mimetypes accepted:
        //   developer.mozilla.org/En/Media_formats_supported_by_the_audio_and_video_elements
        //   bit.ly/iphoneoscodecs
        bool.wav = elem.canPlayType('audio/wav; codecs="1"').replace(/^no$/, '');
        bool.m4a = (elem.canPlayType('audio/x-m4a;') || elem.canPlayType('audio/aac;')).replace(/^no$/, '');
      }
    } catch (e) {
    }
    return bool;
  };
  // In FF4, if disabled, window.localStorage should === null.
  // Normally, we could not test that directly and need to do a
  //   `('localStorage' in window) && ` test first because otherwise Firefox will
  //   throw bugzil.la/365772 if cookies are disabled
  // Also in iOS5 Private Browsing mode, attempting to use localStorage.setItem
  // will throw the exception:
  //   QUOTA_EXCEEDED_ERRROR DOM Exception 22.
  // Peculiarly, getItem and removeItem calls do not throw.
  // Because we are forced to try/catch this, we'll go aggressive.
  // Just FWIW: IE8 Compat mode supports these features completely:
  //   www.quirksmode.org/dom/html5.html
  // But IE8 doesn't support either with local files
  tests['localstorage'] = function () {
    try {
      localStorage.setItem(mod, mod);
      localStorage.removeItem(mod);
      return true;
    } catch (e) {
      return false;
    }
  };
  tests['sessionstorage'] = function () {
    try {
      sessionStorage.setItem(mod, mod);
      sessionStorage.removeItem(mod);
      return true;
    } catch (e) {
      return false;
    }
  };
  tests['webworkers'] = function () {
    return !!window.Worker;
  };
  tests['applicationcache'] = function () {
    return !!window.applicationCache;
  };
  // Thanks to Erik Dahlstrom
  tests['svg'] = function () {
    return !!document.createElementNS && !!document.createElementNS(ns.svg, 'svg').createSVGRect;
  };
  // specifically for SVG inline in HTML, not within XHTML
  // test page: paulirish.com/demo/inline-svg
  tests['inlinesvg'] = function () {
    var div = document.createElement('div');
    div.innerHTML = '<svg/>';
    return (div.firstChild && div.firstChild.namespaceURI) == ns.svg;
  };
  // SVG SMIL animation
  tests['smil'] = function () {
    return !!document.createElementNS && /SVGAnimate/.test(toString.call(document.createElementNS(ns.svg, 'animate')));
  };
  // This test is only for clip paths in SVG proper, not clip paths on HTML content
  // demo: srufaculty.sru.edu/david.dailey/svg/newstuff/clipPath4.svg
  // However read the comments to dig into applying SVG clippaths to HTML content here:
  //   github.com/Modernizr/Modernizr/issues/213#issuecomment-1149491
  tests['svgclippaths'] = function () {
    return !!document.createElementNS && /SVGClipPath/.test(toString.call(document.createElementNS(ns.svg, 'clipPath')));
  };
  /*>>webforms*/
  // input features and input types go directly onto the ret object, bypassing the tests loop.
  // Hold this guy to execute in a moment.
  function webforms() {
    /*>>input*/
    // Run through HTML5's new input attributes to see if the UA understands any.
    // We're using f which is the <input> element created early on
    // Mike Taylr has created a comprehensive resource for testing these attributes
    //   when applied to all input types:
    //   miketaylr.com/code/input-type-attr.html
    // spec: www.whatwg.org/specs/web-apps/current-work/multipage/the-input-element.html#input-type-attr-summary
    // Only input placeholder is tested while textarea's placeholder is not.
    // Currently Safari 4 and Opera 11 have support only for the input placeholder
    // Both tests are available in feature-detects/forms-placeholder.js
    Modernizr['input'] = function (props) {
      for (var i = 0, len = props.length; i < len; i++) {
        attrs[props[i]] = !!(props[i] in inputElem);
      }
      if (attrs.list) {
        // safari false positive's on datalist: webk.it/74252
        // see also github.com/Modernizr/Modernizr/issues/146
        attrs.list = !!(document.createElement('datalist') && window.HTMLDataListElement);
      }
      return attrs;
    }('autocomplete autofocus list placeholder max min multiple pattern required step'.split(' '));
    /*>>input*/
    /*>>inputtypes*/
    // Run through HTML5's new input types to see if the UA understands any.
    //   This is put behind the tests runloop because it doesn't return a
    //   true/false like all the other tests; instead, it returns an object
    //   containing each input type with its corresponding true/false value
    // Big thanks to @miketaylr for the html5 forms expertise. miketaylr.com/
    Modernizr['inputtypes'] = function (props) {
      for (var i = 0, bool, inputElemType, defaultView, len = props.length; i < len; i++) {
        inputElem.setAttribute('type', inputElemType = props[i]);
        bool = inputElem.type !== 'text';
        // We first check to see if the type we give it sticks..
        // If the type does, we feed it a textual value, which shouldn't be valid.
        // If the value doesn't stick, we know there's input sanitization which infers a custom UI
        if (bool) {
          inputElem.value = smile;
          inputElem.style.cssText = 'position:absolute;visibility:hidden;';
          if (/^range$/.test(inputElemType) && inputElem.style.WebkitAppearance !== undefined) {
            docElement.appendChild(inputElem);
            defaultView = document.defaultView;
            // Safari 2-4 allows the smiley as a value, despite making a slider
            bool = defaultView.getComputedStyle && defaultView.getComputedStyle(inputElem, null).WebkitAppearance !== 'textfield' && inputElem.offsetHeight !== 0;
            docElement.removeChild(inputElem);
          } else if (/^(search|tel)$/.test(inputElemType)) {
          } else if (/^(url|email)$/.test(inputElemType)) {
            // Real url and email support comes with prebaked validation.
            bool = inputElem.checkValidity && inputElem.checkValidity() === false;
          } else {
            // If the upgraded input compontent rejects the :) text, we got a winner
            bool = inputElem.value != smile;
          }
        }
        inputs[props[i]] = !!bool;
      }
      return inputs;
    }('search tel url email datetime date month week time datetime-local number range color'.split(' '));  /*>>inputtypes*/
  }
  /*>>webforms*/
  // End of test definitions
  // -----------------------
  // Run through all tests and detect their support in the current UA.
  // todo: hypothetically we could be doing an array of tests and use a basic loop here.
  for (var feature in tests) {
    if (hasOwnProp(tests, feature)) {
      // run the test, throw the return value into the Modernizr,
      //   then based on that boolean, define an appropriate className
      //   and push it into an array of classes we'll join later.
      featureName = feature.toLowerCase();
      Modernizr[featureName] = tests[feature]();
      classes.push((Modernizr[featureName] ? '' : 'no-') + featureName);
    }
  }
  /*>>webforms*/
  // input tests need to run.
  Modernizr.input || webforms();
  /*>>webforms*/
  /**
     * addTest allows the user to define their own feature tests
     * the result will be added onto the Modernizr object,
     * as well as an appropriate className set on the html element
     *
     * @param feature - String naming the feature
     * @param test - Function returning true if feature is supported, false if not
     */
  Modernizr.addTest = function (feature, test) {
    if (typeof feature == 'object') {
      for (var key in feature) {
        if (hasOwnProp(feature, key)) {
          Modernizr.addTest(key, feature[key]);
        }
      }
    } else {
      feature = feature.toLowerCase();
      if (Modernizr[feature] !== undefined) {
        // we're going to quit if you're trying to overwrite an existing test
        // if we were to allow it, we'd do this:
        //   var re = new RegExp("\\b(no-)?" + feature + "\\b");
        //   docElement.className = docElement.className.replace( re, '' );
        // but, no rly, stuff 'em.
        return Modernizr;
      }
      test = typeof test == 'function' ? test() : test;
      if (typeof enableClasses !== 'undefined' && enableClasses) {
        docElement.className += ' ' + (test ? '' : 'no-') + feature;
      }
      Modernizr[feature] = test;
    }
    return Modernizr;  // allow chaining.
  };
  // Reset modElem.cssText to nothing to reduce memory footprint.
  setCss('');
  modElem = inputElem = null;
  /*>>shiv*/
  /**
     * @preserve HTML5 Shiv prev3.7.1 | @afarkas @jdalton @jon_neal @rem | MIT/GPL2 Licensed
     */
  ;
  (function (window, document) {
    /*jshint evil:true */
    /** version */
    var version = '3.7.0';
    /** Preset options */
    var options = window.html5 || {};
    /** Used to skip problem elements */
    var reSkip = /^<|^(?:button|map|select|textarea|object|iframe|option|optgroup)$/i;
    /** Not all elements can be cloned in IE **/
    var saveClones = /^(?:a|b|code|div|fieldset|h1|h2|h3|h4|h5|h6|i|label|li|ol|p|q|span|strong|style|table|tbody|td|th|tr|ul)$/i;
    /** Detect whether the browser supports default html5 styles */
    var supportsHtml5Styles;
    /** Name of the expando, to work with multiple documents or to re-shiv one document */
    var expando = '_html5shiv';
    /** The id for the the documents expando */
    var expanID = 0;
    /** Cached data for each document */
    var expandoData = {};
    /** Detect whether the browser supports unknown elements */
    var supportsUnknownElements;
    (function () {
      try {
        var a = document.createElement('a');
        a.innerHTML = '<xyz></xyz>';
        //if the hidden property is implemented we can assume, that the browser supports basic HTML5 Styles
        supportsHtml5Styles = 'hidden' in a;
        supportsUnknownElements = a.childNodes.length == 1 || function () {
          // assign a false positive if unable to shiv
          document.createElement('a');
          var frag = document.createDocumentFragment();
          return typeof frag.cloneNode == 'undefined' || typeof frag.createDocumentFragment == 'undefined' || typeof frag.createElement == 'undefined';
        }();
      } catch (e) {
        // assign a false positive if detection fails => unable to shiv
        supportsHtml5Styles = true;
        supportsUnknownElements = true;
      }
    }());
    /*--------------------------------------------------------------------------*/
    /**
         * Creates a style sheet with the given CSS text and adds it to the document.
         * @private
         * @param {Document} ownerDocument The document.
         * @param {String} cssText The CSS text.
         * @returns {StyleSheet} The style element.
         */
    function addStyleSheet(ownerDocument, cssText) {
      var p = ownerDocument.createElement('p'), parent = ownerDocument.getElementsByTagName('head')[0] || ownerDocument.documentElement;
      p.innerHTML = 'x<style>' + cssText + '</style>';
      return parent.insertBefore(p.lastChild, parent.firstChild);
    }
    /**
         * Returns the value of `html5.elements` as an array.
         * @private
         * @returns {Array} An array of shived element node names.
         */
    function getElements() {
      var elements = html5.elements;
      return typeof elements == 'string' ? elements.split(' ') : elements;
    }
    /**
         * Returns the data associated to the given document
         * @private
         * @param {Document} ownerDocument The document.
         * @returns {Object} An object of data.
         */
    function getExpandoData(ownerDocument) {
      var data = expandoData[ownerDocument[expando]];
      if (!data) {
        data = {};
        expanID++;
        ownerDocument[expando] = expanID;
        expandoData[expanID] = data;
      }
      return data;
    }
    /**
         * returns a shived element for the given nodeName and document
         * @memberOf html5
         * @param {String} nodeName name of the element
         * @param {Document} ownerDocument The context document.
         * @returns {Object} The shived element.
         */
    function createElement(nodeName, ownerDocument, data) {
      if (!ownerDocument) {
        ownerDocument = document;
      }
      if (supportsUnknownElements) {
        return ownerDocument.createElement(nodeName);
      }
      if (!data) {
        data = getExpandoData(ownerDocument);
      }
      var node;
      if (data.cache[nodeName]) {
        node = data.cache[nodeName].cloneNode();
      } else if (saveClones.test(nodeName)) {
        node = (data.cache[nodeName] = data.createElem(nodeName)).cloneNode();
      } else {
        node = data.createElem(nodeName);
      }
      // Avoid adding some elements to fragments in IE < 9 because
      // * Attributes like `name` or `type` cannot be set/changed once an element
      //   is inserted into a document/fragment
      // * Link elements with `src` attributes that are inaccessible, as with
      //   a 403 response, will cause the tab/window to crash
      // * Script elements appended to fragments will execute when their `src`
      //   or `text` property is set
      return node.canHaveChildren && !reSkip.test(nodeName) && !node.tagUrn ? data.frag.appendChild(node) : node;
    }
    /**
         * returns a shived DocumentFragment for the given document
         * @memberOf html5
         * @param {Document} ownerDocument The context document.
         * @returns {Object} The shived DocumentFragment.
         */
    function createDocumentFragment(ownerDocument, data) {
      if (!ownerDocument) {
        ownerDocument = document;
      }
      if (supportsUnknownElements) {
        return ownerDocument.createDocumentFragment();
      }
      data = data || getExpandoData(ownerDocument);
      var clone = data.frag.cloneNode(), i = 0, elems = getElements(), l = elems.length;
      for (; i < l; i++) {
        clone.createElement(elems[i]);
      }
      return clone;
    }
    /**
         * Shivs the `createElement` and `createDocumentFragment` methods of the document.
         * @private
         * @param {Document|DocumentFragment} ownerDocument The document.
         * @param {Object} data of the document.
         */
    function shivMethods(ownerDocument, data) {
      if (!data.cache) {
        data.cache = {};
        data.createElem = ownerDocument.createElement;
        data.createFrag = ownerDocument.createDocumentFragment;
        data.frag = data.createFrag();
      }
      ownerDocument.createElement = function (nodeName) {
        //abort shiv
        if (!html5.shivMethods) {
          return data.createElem(nodeName);
        }
        return createElement(nodeName, ownerDocument, data);
      };
      ownerDocument.createDocumentFragment = Function('h,f', 'return function(){' + 'var n=f.cloneNode(),c=n.createElement;' + 'h.shivMethods&&(' + getElements().join().replace(/[\w\-]+/g, function (nodeName) {
        data.createElem(nodeName);
        data.frag.createElement(nodeName);
        return 'c("' + nodeName + '")';
      }) + ');return n}')(html5, data.frag);
    }
    /*--------------------------------------------------------------------------*/
    /**
         * Shivs the given document.
         * @memberOf html5
         * @param {Document} ownerDocument The document to shiv.
         * @returns {Document} The shived document.
         */
    function shivDocument(ownerDocument) {
      if (!ownerDocument) {
        ownerDocument = document;
      }
      var data = getExpandoData(ownerDocument);
      if (html5.shivCSS && !supportsHtml5Styles && !data.hasCSS) {
        data.hasCSS = !!addStyleSheet(ownerDocument, 'article,aside,dialog,figcaption,figure,footer,header,hgroup,main,nav,section{display:block}' + 'mark{background:#FF0;color:#000}' + 'template{display:none}');
      }
      if (!supportsUnknownElements) {
        shivMethods(ownerDocument, data);
      }
      return ownerDocument;
    }
    /*--------------------------------------------------------------------------*/
    /**
         * The `html5` object is exposed so that more elements can be shived and
         * existing shiving can be detected on iframes.
         * @type Object
         * @example
         *
         * // options can be changed before the script is included
         * html5 = { 'elements': 'mark section', 'shivCSS': false, 'shivMethods': false };
         */
    var html5 = {
        'elements': options.elements || 'abbr article aside audio bdi canvas data datalist details dialog figcaption figure footer header hgroup main mark meter nav output progress section summary template time video',
        'version': version,
        'shivCSS': options.shivCSS !== false,
        'supportsUnknownElements': supportsUnknownElements,
        'shivMethods': options.shivMethods !== false,
        'type': 'default',
        'shivDocument': shivDocument,
        createElement: createElement,
        createDocumentFragment: createDocumentFragment
      };
    /*--------------------------------------------------------------------------*/
    // expose html5
    window.html5 = html5;
    // shiv the document
    shivDocument(document);
  }(this, document));
  /*>>shiv*/
  // Assign private properties to the return object with prefix
  Modernizr._version = version;
  // expose these for the plugin API. Look in the source for how to join() them against your input
  /*>>prefixes*/
  Modernizr._prefixes = prefixes;
  /*>>prefixes*/
  /*>>domprefixes*/
  Modernizr._domPrefixes = domPrefixes;
  Modernizr._cssomPrefixes = cssomPrefixes;
  /*>>domprefixes*/
  /*>>mq*/
  // Modernizr.mq tests a given media query, live against the current state of the window
  // A few important notes:
  //   * If a browser does not support media queries at all (eg. oldIE) the mq() will always return false
  //   * A max-width or orientation query will be evaluated against the current state, which may change later.
  //   * You must specify values. Eg. If you are testing support for the min-width media query use:
  //       Modernizr.mq('(min-width:0)')
  // usage:
  // Modernizr.mq('only screen and (max-width:768)')
  Modernizr.mq = testMediaQuery;
  /*>>mq*/
  /*>>hasevent*/
  // Modernizr.hasEvent() detects support for a given event, with an optional element to test on
  // Modernizr.hasEvent('gesturestart', elem)
  Modernizr.hasEvent = isEventSupported;
  /*>>hasevent*/
  /*>>testprop*/
  // Modernizr.testProp() investigates whether a given style property is recognized
  // Note that the property names must be provided in the camelCase variant.
  // Modernizr.testProp('pointerEvents')
  Modernizr.testProp = function (prop) {
    return testProps([prop]);
  };
  /*>>testprop*/
  /*>>testallprops*/
  // Modernizr.testAllProps() investigates whether a given style property,
  //   or any of its vendor-prefixed variants, is recognized
  // Note that the property names must be provided in the camelCase variant.
  // Modernizr.testAllProps('boxSizing')
  Modernizr.testAllProps = testPropsAll;
  /*>>testallprops*/
  /*>>teststyles*/
  // Modernizr.testStyles() allows you to add custom styles to the document and test an element afterwards
  // Modernizr.testStyles('#modernizr { position:absolute }', function(elem, rule){ ... })
  Modernizr.testStyles = injectElementWithStyles;
  /*>>teststyles*/
  /*>>prefixed*/
  // Modernizr.prefixed() returns the prefixed or nonprefixed property name variant of your input
  // Modernizr.prefixed('boxSizing') // 'MozBoxSizing'
  // Properties must be passed as dom-style camelcase, rather than `box-sizing` hypentated style.
  // Return values will also be the camelCase variant, if you need to translate that to hypenated style use:
  //
  //     str.replace(/([A-Z])/g, function(str,m1){ return '-' + m1.toLowerCase(); }).replace(/^ms-/,'-ms-');
  // If you're trying to ascertain which transition end event to bind to, you might do something like...
  //
  //     var transEndEventNames = {
  //       'WebkitTransition' : 'webkitTransitionEnd',
  //       'MozTransition'    : 'transitionend',
  //       'OTransition'      : 'oTransitionEnd',
  //       'msTransition'     : 'MSTransitionEnd',
  //       'transition'       : 'transitionend'
  //     },
  //     transEndEventName = transEndEventNames[ Modernizr.prefixed('transition') ];
  Modernizr.prefixed = function (prop, obj, elem) {
    if (!obj) {
      return testPropsAll(prop, 'pfx');
    } else {
      // Testing DOM property e.g. Modernizr.prefixed('requestAnimationFrame', window) // 'mozRequestAnimationFrame'
      return testPropsAll(prop, obj, elem);
    }
  };
  /*>>prefixed*/
  /*>>cssclasses*/
  // Remove "no-js" class from <html> element, if it exists:
  docElement.className = docElement.className.replace(/(^|\s)no-js(\s|$)/, '$1$2') + (enableClasses ? ' js ' + classes.join(' ') : '');
  /*>>cssclasses*/
  return Modernizr;
}(this, this.document);/*!
* screenfull
* v1.2.0 - 2014-04-29
* (c) Sindre Sorhus; MIT License
*/
!function () {
  'use strict';
  var a = 'undefined' != typeof module && module.exports, b = 'undefined' != typeof Element && 'ALLOW_KEYBOARD_INPUT' in Element, c = function () {
      for (var a, b, c = [
            [
              'requestFullscreen',
              'exitFullscreen',
              'fullscreenElement',
              'fullscreenEnabled',
              'fullscreenchange',
              'fullscreenerror'
            ],
            [
              'webkitRequestFullscreen',
              'webkitExitFullscreen',
              'webkitFullscreenElement',
              'webkitFullscreenEnabled',
              'webkitfullscreenchange',
              'webkitfullscreenerror'
            ],
            [
              'webkitRequestFullScreen',
              'webkitCancelFullScreen',
              'webkitCurrentFullScreenElement',
              'webkitCancelFullScreen',
              'webkitfullscreenchange',
              'webkitfullscreenerror'
            ],
            [
              'mozRequestFullScreen',
              'mozCancelFullScreen',
              'mozFullScreenElement',
              'mozFullScreenEnabled',
              'mozfullscreenchange',
              'mozfullscreenerror'
            ],
            [
              'msRequestFullscreen',
              'msExitFullscreen',
              'msFullscreenElement',
              'msFullscreenEnabled',
              'MSFullscreenChange',
              'MSFullscreenError'
            ]
          ], d = 0, e = c.length, f = {}; e > d; d++)
        if (a = c[d], a && a[1] in document) {
          for (d = 0, b = a.length; b > d; d++)
            f[c[0][d]] = a[d];
          return f;
        }
      return !1;
    }(), d = {
      request: function (a) {
        var d = c.requestFullscreen;
        a = a || document.documentElement, /5\.1[\.\d]* Safari/.test(navigator.userAgent) ? a[d]() : a[d](b && Element.ALLOW_KEYBOARD_INPUT);
      },
      exit: function () {
        document[c.exitFullscreen]();
      },
      toggle: function (a) {
        this.isFullscreen ? this.exit() : this.request(a);
      },
      onchange: function () {
      },
      onerror: function () {
      },
      raw: c
    };
  return c ? (Object.defineProperties(d, {
    isFullscreen: {
      get: function () {
        return !!document[c.fullscreenElement];
      }
    },
    element: {
      enumerable: !0,
      get: function () {
        return document[c.fullscreenElement];
      }
    },
    enabled: {
      enumerable: !0,
      get: function () {
        return !!document[c.fullscreenEnabled];
      }
    }
  }), document.addEventListener(c.fullscreenchange, function (a) {
    d.onchange.call(d, a);
  }), document.addEventListener(c.fullscreenerror, function (a) {
    d.onerror.call(d, a);
  }), void (a ? module.exports = d : window.screenfull = d)) : void (a ? module.exports = !1 : window.screenfull = !1);
}();;
(function ($, window, document, undefined) {
  /**
   * animo is a powerful little tool that makes managing CSS animations extremely easy. Stack animations, set callbacks, make magic.
   * Modern browsers and almost all mobile browsers support CSS animations (http://caniuse.com/css-animation).
   *
   * @author Daniel Raftery : twitter/ThrivingKings
   * @version 1.0.2
  */
  function animo(element, options, callback, other_cb) {
    // Default configuration
    var defaults = {
        duration: 1,
        animation: null,
        iterate: 1,
        timing: 'linear',
        keep: false
      };
    // Browser prefixes for CSS
    this.prefixes = [
      '',
      '-moz-',
      '-o-animation-',
      '-webkit-'
    ];
    // Cache the element
    this.element = $(element);
    this.bare = element;
    // For stacking of animations
    this.queue = [];
    // Hacky
    this.listening = false;
    // Figure out where the callback is
    var cb = typeof callback == 'function' ? callback : other_cb;
    // Options can sometimes be a command
    switch (options) {
    case 'blur':
      defaults = {
        amount: 3,
        duration: 0.5,
        focusAfter: null
      };
      this.options = $.extend(defaults, callback);
      this._blur(cb);
      break;
    case 'focus':
      this._focus();
      break;
    case 'rotate':
      defaults = {
        degrees: 15,
        duration: 0.5
      };
      this.options = $.extend(defaults, callback);
      this._rotate(cb);
      break;
    case 'cleanse':
      this.cleanse();
      break;
    default:
      this.options = $.extend(defaults, options);
      this.init(cb);
      break;
    }
  }
  animo.prototype = {
    init: function (callback) {
      var $me = this;
      // Are we stacking animations?
      if (Object.prototype.toString.call($me.options.animation) === '[object Array]') {
        $.merge($me.queue, $me.options.animation);
      } else {
        $me.queue.push($me.options.animation);
      }
      $me.cleanse();
      $me.animate(callback);
    },
    animate: function (callback) {
      this.element.addClass('animated');
      this.element.addClass(this.queue[0]);
      this.element.data('animo', this.queue[0]);
      var ai = this.prefixes.length;
      // Add the options for each prefix
      while (ai--) {
        this.element.css(this.prefixes[ai] + 'animation-duration', this.options.duration + 's');
        this.element.css(this.prefixes[ai] + 'animation-iteration-count', this.options.iterate);
        this.element.css(this.prefixes[ai] + 'animation-timing-function', this.options.timing);
      }
      var $me = this, _cb = callback;
      if ($me.queue.length > 1) {
        _cb = null;
      }
      // Listen for the end of the animation
      this._end('AnimationEnd', function () {
        // If there are more, clean it up and move on
        if ($me.element.hasClass($me.queue[0])) {
          if (!$me.options.keep) {
            $me.cleanse();
          }
          $me.queue.shift();
          if ($me.queue.length) {
            $me.animate(callback);
          }
        }
      }, _cb);
    },
    cleanse: function () {
      this.element.removeClass('animated');
      this.element.removeClass(this.queue[0]);
      this.element.removeClass(this.element.data('animo'));
      var ai = this.prefixes.length;
      while (ai--) {
        this.element.css(this.prefixes[ai] + 'animation-duration', '');
        this.element.css(this.prefixes[ai] + 'animation-iteration-count', '');
        this.element.css(this.prefixes[ai] + 'animation-timing-function', '');
        this.element.css(this.prefixes[ai] + 'transition', '');
        this.element.css(this.prefixes[ai] + 'transform', '');
        this.element.css(this.prefixes[ai] + 'filter', '');
      }
    },
    _blur: function (callback) {
      if (this.element.is('img')) {
        var svg_id = 'svg_' + ((1 + Math.random()) * 16777216 | 0).toString(16).substring(1);
        var filter_id = 'filter_' + ((1 + Math.random()) * 16777216 | 0).toString(16).substring(1);
        $('body').append('<svg version="1.1" xmlns="http://www.w3.org/2000/svg" id="' + svg_id + '" style="height:0;position:absolute;top:-1000px;"><filter id="' + filter_id + '"><feGaussianBlur stdDeviation="' + this.options.amount + '" /></filter></svg>');
        var ai = this.prefixes.length;
        while (ai--) {
          this.element.css(this.prefixes[ai] + 'filter', 'blur(' + this.options.amount + 'px)');
          this.element.css(this.prefixes[ai] + 'transition', this.options.duration + 's all linear');
        }
        this.element.css('filter', 'url(#' + filter_id + ')');
        this.element.data('svgid', svg_id);
      } else {
        var color = this.element.css('color');
        var ai = this.prefixes.length;
        // Add the options for each prefix
        while (ai--) {
          this.element.css(this.prefixes[ai] + 'transition', 'all ' + this.options.duration + 's linear');
        }
        this.element.css('text-shadow', '0 0 ' + this.options.amount + 'px ' + color);
        this.element.css('color', 'transparent');
      }
      this._end('TransitionEnd', null, callback);
      var $me = this;
      if (this.options.focusAfter) {
        var focus_wait = window.setTimeout(function () {
            $me._focus();
            focus_wait = window.clearTimeout(focus_wait);
          }, this.options.focusAfter * 1000);
      }
    },
    _focus: function () {
      var ai = this.prefixes.length;
      if (this.element.is('img')) {
        while (ai--) {
          this.element.css(this.prefixes[ai] + 'filter', '');
          this.element.css(this.prefixes[ai] + 'transition', '');
        }
        var $svg = $('#' + this.element.data('svgid'));
        $svg.remove();
      } else {
        while (ai--) {
          this.element.css(this.prefixes[ai] + 'transition', '');
        }
        this.element.css('text-shadow', '');
        this.element.css('color', '');
      }
    },
    _rotate: function (callback) {
      var ai = this.prefixes.length;
      // Add the options for each prefix
      while (ai--) {
        this.element.css(this.prefixes[ai] + 'transition', 'all ' + this.options.duration + 's linear');
        this.element.css(this.prefixes[ai] + 'transform', 'rotate(' + this.options.degrees + 'deg)');
      }
      this._end('TransitionEnd', null, callback);
    },
    _end: function (type, todo, callback) {
      var $me = this;
      var binding = type.toLowerCase() + ' webkit' + type + ' o' + type + ' MS' + type;
      this.element.bind(binding, function () {
        $me.element.unbind(binding);
        if (typeof todo == 'function') {
          todo();
        }
        if (typeof callback == 'function') {
          callback($me);
        }
      });
    }
  };
  $.fn.animo = function (options, callback, other_cb) {
    return this.each(function () {
      new animo(this, options, callback, other_cb);
    });
  };
}(jQuery, window, document));/*! Copyright (c) 2011 Piotr Rochala (http://rocha.la)
 * Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
 * and GPL (http://www.opensource.org/licenses/gpl-license.php) licenses.
 *
 * Version: 1.3.3
 *
 */
(function (e) {
  e.fn.extend({
    slimScroll: function (g) {
      var a = e.extend({
          width: 'auto',
          height: '250px',
          size: '7px',
          color: '#000',
          position: 'right',
          distance: '1px',
          start: 'top',
          opacity: 0.4,
          alwaysVisible: !1,
          disableFadeOut: !1,
          railVisible: !1,
          railColor: '#333',
          railOpacity: 0.2,
          railDraggable: !0,
          railClass: 'slimScrollRail',
          barClass: 'slimScrollBar',
          wrapperClass: 'slimScrollDiv',
          allowPageScroll: !1,
          wheelStep: 20,
          touchScrollStep: 200,
          borderRadius: '7px',
          railBorderRadius: '7px'
        }, g);
      this.each(function () {
        function u(d) {
          if (r) {
            d = d || window.event;
            var c = 0;
            d.wheelDelta && (c = -d.wheelDelta / 120);
            d.detail && (c = d.detail / 3);
            e(d.target || d.srcTarget || d.srcElement).closest('.' + a.wrapperClass).is(b.parent()) && m(c, !0);
            d.preventDefault && !k && d.preventDefault();
            k || (d.returnValue = !1);
          }
        }
        function m(d, e, g) {
          k = !1;
          var f = d, h = b.outerHeight() - c.outerHeight();
          e && (f = parseInt(c.css('top')) + d * parseInt(a.wheelStep) / 100 * c.outerHeight(), f = Math.min(Math.max(f, 0), h), f = 0 < d ? Math.ceil(f) : Math.floor(f), c.css({ top: f + 'px' }));
          l = parseInt(c.css('top')) / (b.outerHeight() - c.outerHeight());
          f = l * (b[0].scrollHeight - b.outerHeight());
          g && (f = d, d = f / b[0].scrollHeight * b.outerHeight(), d = Math.min(Math.max(d, 0), h), c.css({ top: d + 'px' }));
          b.scrollTop(f);
          b.trigger('slimscrolling', ~~f);
          v();
          p();
        }
        function C() {
          window.addEventListener ? (this.addEventListener('DOMMouseScroll', u, !1), this.addEventListener('mousewheel', u, !1)) : document.attachEvent('onmousewheel', u);
        }
        function w() {
          s = Math.max(b.outerHeight() / b[0].scrollHeight * b.outerHeight(), 30);
          c.css({ height: s + 'px' });
          var a = s == b.outerHeight() ? 'none' : 'block';
          c.css({ display: a });
        }
        function v() {
          w();
          clearTimeout(A);
          l == ~~l ? (k = a.allowPageScroll, B != l && b.trigger('slimscroll', 0 == ~~l ? 'top' : 'bottom')) : k = !1;
          B = l;
          s >= b.outerHeight() ? k = !0 : (c.stop(!0, !0).fadeIn('fast'), a.railVisible && h.stop(!0, !0).fadeIn('fast'));
        }
        function p() {
          a.alwaysVisible || (A = setTimeout(function () {
            a.disableFadeOut && r || x || y || (c.fadeOut('slow'), h.fadeOut('slow'));
          }, 1000));
        }
        var r, x, y, A, z, s, l, B, k = !1, b = e(this);
        if (b.parent().hasClass(a.wrapperClass)) {
          var n = b.scrollTop(), c = b.parent().find('.' + a.barClass), h = b.parent().find('.' + a.railClass);
          w();
          if (e.isPlainObject(g)) {
            if ('height' in g && 'auto' == g.height) {
              b.parent().css('height', 'auto');
              b.css('height', 'auto');
              var q = b.parent().parent().height();
              b.parent().css('height', q);
              b.css('height', q);
            }
            if ('scrollTo' in g)
              n = parseInt(a.scrollTo);
            else if ('scrollBy' in g)
              n += parseInt(a.scrollBy);
            else if ('destroy' in g) {
              c.remove();
              h.remove();
              b.unwrap();
              return;
            }
            m(n, !1, !0);
          }
        } else if (!(e.isPlainObject(g) && 'destroy' in g)) {
          a.height = 'auto' == a.height ? b.parent().height() : a.height;
          n = e('<div></div>').addClass(a.wrapperClass).css({
            position: 'relative',
            overflow: 'hidden',
            width: a.width,
            height: a.height
          });
          b.css({
            overflow: 'hidden',
            width: a.width,
            height: a.height
          });
          var h = e('<div></div>').addClass(a.railClass).css({
              width: a.size,
              height: '100%',
              position: 'absolute',
              top: 0,
              display: a.alwaysVisible && a.railVisible ? 'block' : 'none',
              'border-radius': a.railBorderRadius,
              background: a.railColor,
              opacity: a.railOpacity,
              zIndex: 90
            }), c = e('<div></div>').addClass(a.barClass).css({
              background: a.color,
              width: a.size,
              position: 'absolute',
              top: 0,
              opacity: a.opacity,
              display: a.alwaysVisible ? 'block' : 'none',
              'border-radius': a.borderRadius,
              BorderRadius: a.borderRadius,
              MozBorderRadius: a.borderRadius,
              WebkitBorderRadius: a.borderRadius,
              zIndex: 99
            }), q = 'right' == a.position ? { right: a.distance } : { left: a.distance };
          h.css(q);
          c.css(q);
          b.wrap(n);
          b.parent().append(c);
          b.parent().append(h);
          a.railDraggable && c.bind('mousedown', function (a) {
            var b = e(document);
            y = !0;
            t = parseFloat(c.css('top'));
            pageY = a.pageY;
            b.bind('mousemove.slimscroll', function (a) {
              currTop = t + a.pageY - pageY;
              c.css('top', currTop);
              m(0, c.position().top, !1);
            });
            b.bind('mouseup.slimscroll', function (a) {
              y = !1;
              p();
              b.unbind('.slimscroll');
            });
            return !1;
          }).bind('selectstart.slimscroll', function (a) {
            a.stopPropagation();
            a.preventDefault();
            return !1;
          });
          h.hover(function () {
            v();
          }, function () {
            p();
          });
          c.hover(function () {
            x = !0;
          }, function () {
            x = !1;
          });
          b.hover(function () {
            r = !0;
            v();
            p();
          }, function () {
            r = !1;
            p();
          });
          b.bind('touchstart', function (a, b) {
            a.originalEvent.touches.length && (z = a.originalEvent.touches[0].pageY);
          });
          b.bind('touchmove', function (b) {
            k || b.originalEvent.preventDefault();
            b.originalEvent.touches.length && (m((z - b.originalEvent.touches[0].pageY) / a.touchScrollStep, !0), z = b.originalEvent.touches[0].pageY);
          });
          w();
          'bottom' === a.start ? (c.css({ top: b.outerHeight() - c.outerHeight() }), m(0, !0)) : 'top' !== a.start && (m(e(a.start).position().top, null, !0), a.alwaysVisible || c.hide());
          C();
        }
      });
      return this;
    }
  });
  e.fn.extend({ slimscroll: e.fn.slimScroll });
}(jQuery));/*!
 * jQuery ClassyLoader
 * www.class.pm
 *
 * Written by Marius Stanciu - Sergiu <marius@class.pm>
 * Licensed under the MIT license www.class.pm/LICENSE-MIT
 * Version 1.2.0
 *
 */
(function (d) {
  d.fn.ClassyLoader = function (a) {
    a = d.extend({}, {
      width: 200,
      height: 200,
      animate: !0,
      displayOnLoad: !0,
      percentage: 100,
      speed: 1,
      roundedLine: !1,
      showRemaining: !0,
      fontFamily: 'Helvetica',
      fontSize: '50px',
      showText: !0,
      diameter: 80,
      fontColor: 'rgba(25, 25, 25, 0.6)',
      lineColor: 'rgba(55, 55, 55, 1)',
      remainingLineColor: 'rgba(55, 55, 55, 0.4)',
      lineWidth: 5,
      start: 'left'
    }, a);
    var e = d(this);
    this.draw = function (b) {
      'undefined' !== typeof b && (a.percentage = b);
      var c = e[0].getContext('2d'), h = e.width() / 2, d = e.height() / 2, f = 0, g = 0;
      c.scale(1, 1);
      c.lineWidth = a.lineWidth;
      c.strokeStyle = a.lineColour;
      setTimeout(function k() {
        var b = Math.PI / 180 * 360 / 100 * (f + 1), b = b || Math.PI / 180 * 360 / 100 * (f + 1);
        c.clearRect(0, 0, e.width(), e.height());
        !0 === a.showRemaining && (c.beginPath(), c.strokeStyle = a.remainingLineColor, c.arc(h, d, a.diameter, 0, 360), c.stroke(), c.closePath());
        c.strokeStyle = a.lineColor;
        c.beginPath();
        c.lineCap = !0 === a.roundedLine ? 'round' : 'butt';
        switch (a.start) {
        case 'top':
          g = 1.5 * Math.PI;
          break;
        case 'bottom':
          g = 0.5 * Math.PI;
          break;
        case 'right':
          g = 1 * Math.PI;
          break;
        default:
          g = 0;
        }
        c.arc(h, d, a.diameter, g, b + g);
        c.stroke();
        c.closePath();
        !0 === a.showText && (c.fillStyle = a.fontColor, c.font = a.fontSize + ' ' + a.fontFamily, c.textAlign = 'center', c.textBaseline = 'middle', c.fillText(f + 1 + '%', h, d));
        f += 1;
        f < a.percentage && setTimeout(k, a.speed);
      }, a.speed);
    };
    this.setPercent = function (b) {
      a.percentage = b;
      return this;
    };
    this.getPercent = function () {
      return a.percentage;
    };
    this.show = function () {
      var b = e[0].getContext('2d'), c = e.width() / 2, d = e.height() / 2;
      b.scale(1, 1);
      b.lineWidth = a.lineWidth;
      b.strokeStyle = a.lineColour;
      b.clearRect(0, 0, e.width(), e.height());
      b.strokeStyle = a.lineColor;
      b.beginPath();
      b.arc(c, d, a.diameter, 0, Math.PI / 180 * (a.percentage / 100) * 360);
      b.stroke();
      b.closePath();
      !0 === a.showText && (b.fillStyle = a.fontColor, b.font = a.fontSize + ' ' + a.font, b.textAlign = 'center', b.textBaseline = 'middle', b.fillText(a.percentage + '%', c, d));
      !0 === a.showRemaining && (b.beginPath(), b.strokeStyle = a.remainingLineColor, b.arc(c, d, a.diameter, 0, 360), b.stroke(), b.closePath());
    };
    this.__constructor = function () {
      d(this).attr('width', a.width);
      d(this).attr('height', a.height);
      !0 === a.displayOnLoad && (!0 === a.animate ? this.draw() : this.show());
      return this;
    };
    return this.__constructor();
  };
}(jQuery));/*!
 * ClockPicker v0.0.7 (http://weareoutman.github.io/clockpicker/)
 * Copyright 2014 Wang Shenwei.
 * Licensed under MIT (https://github.com/weareoutman/clockpicker/blob/master/LICENSE)
 */
;
(function () {
  var $ = window.jQuery, $win = $(window), $doc = $(document), $body;
  // Can I use inline svg ?
  var svgNS = 'http://www.w3.org/2000/svg', svgSupported = 'SVGAngle' in window && function () {
      var supported, el = document.createElement('div');
      el.innerHTML = '<svg/>';
      supported = (el.firstChild && el.firstChild.namespaceURI) == svgNS;
      el.innerHTML = '';
      return supported;
    }();
  // Can I use transition ?
  var transitionSupported = function () {
      var style = document.createElement('div').style;
      return 'transition' in style || 'WebkitTransition' in style || 'MozTransition' in style || 'msTransition' in style || 'OTransition' in style;
    }();
  // Listen touch events in touch screen device, instead of mouse events in desktop.
  var touchSupported = 'ontouchstart' in window, mousedownEvent = 'mousedown' + (touchSupported ? ' touchstart' : ''), mousemoveEvent = 'mousemove.clockpicker' + (touchSupported ? ' touchmove.clockpicker' : ''), mouseupEvent = 'mouseup.clockpicker' + (touchSupported ? ' touchend.clockpicker' : '');
  // Vibrate the device if supported
  var vibrate = navigator.vibrate ? 'vibrate' : navigator.webkitVibrate ? 'webkitVibrate' : null;
  function createSvgElement(name) {
    return document.createElementNS(svgNS, name);
  }
  function leadingZero(num) {
    return (num < 10 ? '0' : '') + num;
  }
  // Get a unique id
  var idCounter = 0;
  function uniqueId(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  }
  // Clock size
  var dialRadius = 100, outerRadius = 80,
    // innerRadius = 80 on 12 hour clock
    innerRadius = 54, tickRadius = 13, diameter = dialRadius * 2, duration = transitionSupported ? 350 : 1;
  // Popover template
  var tpl = [
      '<div class="popover clockpicker-popover">',
      '<div class="arrow"></div>',
      '<div class="popover-title">',
      '<span class="clockpicker-span-hours text-primary"></span>',
      ' : ',
      '<span class="clockpicker-span-minutes"></span>',
      '<span class="clockpicker-span-am-pm"></span>',
      '</div>',
      '<div class="popover-content">',
      '<div class="clockpicker-plate">',
      '<div class="clockpicker-canvas"></div>',
      '<div class="clockpicker-dial clockpicker-hours"></div>',
      '<div class="clockpicker-dial clockpicker-minutes clockpicker-dial-out"></div>',
      '</div>',
      '<span class="clockpicker-am-pm-block">',
      '</span>',
      '</div>',
      '</div>'
    ].join('');
  // ClockPicker
  function ClockPicker(element, options) {
    var popover = $(tpl), plate = popover.find('.clockpicker-plate'), hoursView = popover.find('.clockpicker-hours'), minutesView = popover.find('.clockpicker-minutes'), amPmBlock = popover.find('.clockpicker-am-pm-block'), isInput = element.prop('tagName') === 'INPUT', input = isInput ? element : element.find('input'), addon = element.find('.input-group-addon'), self = this, timer;
    this.id = uniqueId('cp');
    this.element = element;
    this.options = options;
    this.isAppended = false;
    this.isShown = false;
    this.currentView = 'hours';
    this.isInput = isInput;
    this.input = input;
    this.addon = addon;
    this.popover = popover;
    this.plate = plate;
    this.hoursView = hoursView;
    this.minutesView = minutesView;
    this.amPmBlock = amPmBlock;
    this.spanHours = popover.find('.clockpicker-span-hours');
    this.spanMinutes = popover.find('.clockpicker-span-minutes');
    this.spanAmPm = popover.find('.clockpicker-span-am-pm');
    this.amOrPm = 'PM';
    // Setup for for 12 hour clock if option is selected
    if (options.twelvehour) {
      var amPmButtonsTemplate = [
          '<div class="clockpicker-am-pm-block">',
          '<button type="button" class="btn btn-sm btn-default clockpicker-button clockpicker-am-button">',
          'AM</button>',
          '<button type="button" class="btn btn-sm btn-default clockpicker-button clockpicker-pm-button">',
          'PM</button>',
          '</div>'
        ].join('');
      var amPmButtons = $(amPmButtonsTemplate);
      //amPmButtons.appendTo(plate);
      ////Not working b/c they are not shown when this runs
      //$('clockpicker-am-button')
      //    .on("click", function() {
      //        self.amOrPm = "AM";
      //        $('.clockpicker-span-am-pm').empty().append('AM');
      //    });
      //    
      //$('clockpicker-pm-button')
      //    .on("click", function() {
      //         self.amOrPm = "PM";
      //        $('.clockpicker-span-am-pm').empty().append('PM');
      //    });
      $('<button type="button" class="btn btn-sm btn-default clockpicker-button am-button">' + 'AM' + '</button>').on('click', function () {
        self.amOrPm = 'AM';
        $('.clockpicker-span-am-pm').empty().append('AM');
      }).appendTo(this.amPmBlock);
      $('<button type="button" class="btn btn-sm btn-default clockpicker-button pm-button">' + 'PM' + '</button>').on('click', function () {
        self.amOrPm = 'PM';
        $('.clockpicker-span-am-pm').empty().append('PM');
      }).appendTo(this.amPmBlock);
    }
    if (!options.autoclose) {
      // If autoclose is not setted, append a button
      $('<button type="button" class="btn btn-sm btn-default btn-block clockpicker-button">' + options.donetext + '</button>').click($.proxy(this.done, this)).appendTo(popover);
    }
    // Placement and arrow align - make sure they make sense.
    if ((options.placement === 'top' || options.placement === 'bottom') && (options.align === 'top' || options.align === 'bottom'))
      options.align = 'left';
    if ((options.placement === 'left' || options.placement === 'right') && (options.align === 'left' || options.align === 'right'))
      options.align = 'top';
    popover.addClass(options.placement);
    popover.addClass('clockpicker-align-' + options.align);
    this.spanHours.click($.proxy(this.toggleView, this, 'hours'));
    this.spanMinutes.click($.proxy(this.toggleView, this, 'minutes'));
    // Show or toggle
    input.on('focus.clockpicker click.clockpicker', $.proxy(this.show, this));
    addon.on('click.clockpicker', $.proxy(this.toggle, this));
    // Build ticks
    var tickTpl = $('<div class="clockpicker-tick"></div>'), i, tick, radian;
    // Hours view
    if (options.twelvehour) {
      for (i = 1; i < 13; i += 1) {
        tick = tickTpl.clone();
        radian = i / 6 * Math.PI;
        var radius = outerRadius;
        tick.css('font-size', '120%');
        tick.css({
          left: dialRadius + Math.sin(radian) * radius - tickRadius,
          top: dialRadius - Math.cos(radian) * radius - tickRadius
        });
        tick.html(i === 0 ? '00' : i);
        hoursView.append(tick);
        tick.on(mousedownEvent, mousedown);
      }
    } else {
      for (i = 0; i < 24; i += 1) {
        tick = tickTpl.clone();
        radian = i / 6 * Math.PI;
        var inner = i > 0 && i < 13, radius = inner ? innerRadius : outerRadius;
        tick.css({
          left: dialRadius + Math.sin(radian) * radius - tickRadius,
          top: dialRadius - Math.cos(radian) * radius - tickRadius
        });
        if (inner) {
          tick.css('font-size', '120%');
        }
        tick.html(i === 0 ? '00' : i);
        hoursView.append(tick);
        tick.on(mousedownEvent, mousedown);
      }
    }
    // Minutes view
    for (i = 0; i < 60; i += 5) {
      tick = tickTpl.clone();
      radian = i / 30 * Math.PI;
      tick.css({
        left: dialRadius + Math.sin(radian) * outerRadius - tickRadius,
        top: dialRadius - Math.cos(radian) * outerRadius - tickRadius
      });
      tick.css('font-size', '120%');
      tick.html(leadingZero(i));
      minutesView.append(tick);
      tick.on(mousedownEvent, mousedown);
    }
    // Clicking on minutes view space
    plate.on(mousedownEvent, function (e) {
      if ($(e.target).closest('.clockpicker-tick').length === 0) {
        mousedown(e, true);
      }
    });
    // Mousedown or touchstart
    function mousedown(e, space) {
      var offset = plate.offset(), isTouch = /^touch/.test(e.type), x0 = offset.left + dialRadius, y0 = offset.top + dialRadius, dx = (isTouch ? e.originalEvent.touches[0] : e).pageX - x0, dy = (isTouch ? e.originalEvent.touches[0] : e).pageY - y0, z = Math.sqrt(dx * dx + dy * dy), moved = false;
      // When clicking on minutes view space, check the mouse position
      if (space && (z < outerRadius - tickRadius || z > outerRadius + tickRadius)) {
        return;
      }
      e.preventDefault();
      // Set cursor style of body after 200ms
      var movingTimer = setTimeout(function () {
          $body.addClass('clockpicker-moving');
        }, 200);
      // Place the canvas to top
      if (svgSupported) {
        plate.append(self.canvas);
      }
      // Clock
      self.setHand(dx, dy, !space, true);
      // Mousemove on document
      $doc.off(mousemoveEvent).on(mousemoveEvent, function (e) {
        e.preventDefault();
        var isTouch = /^touch/.test(e.type), x = (isTouch ? e.originalEvent.touches[0] : e).pageX - x0, y = (isTouch ? e.originalEvent.touches[0] : e).pageY - y0;
        if (!moved && x === dx && y === dy) {
          // Clicking in chrome on windows will trigger a mousemove event
          return;
        }
        moved = true;
        self.setHand(x, y, false, true);
      });
      // Mouseup on document
      $doc.off(mouseupEvent).on(mouseupEvent, function (e) {
        $doc.off(mouseupEvent);
        e.preventDefault();
        var isTouch = /^touch/.test(e.type), x = (isTouch ? e.originalEvent.changedTouches[0] : e).pageX - x0, y = (isTouch ? e.originalEvent.changedTouches[0] : e).pageY - y0;
        if ((space || moved) && x === dx && y === dy) {
          self.setHand(x, y);
        }
        if (self.currentView === 'hours') {
          self.toggleView('minutes', duration / 2);
        } else {
          if (options.autoclose) {
            self.minutesView.addClass('clockpicker-dial-out');
            setTimeout(function () {
              self.done();
            }, duration / 2);
          }
        }
        plate.prepend(canvas);
        // Reset cursor style of body
        clearTimeout(movingTimer);
        $body.removeClass('clockpicker-moving');
        // Unbind mousemove event
        $doc.off(mousemoveEvent);
      });
    }
    if (svgSupported) {
      // Draw clock hands and others
      var canvas = popover.find('.clockpicker-canvas'), svg = createSvgElement('svg');
      svg.setAttribute('class', 'clockpicker-svg');
      svg.setAttribute('width', diameter);
      svg.setAttribute('height', diameter);
      var g = createSvgElement('g');
      g.setAttribute('transform', 'translate(' + dialRadius + ',' + dialRadius + ')');
      var bearing = createSvgElement('circle');
      bearing.setAttribute('class', 'clockpicker-canvas-bearing');
      bearing.setAttribute('cx', 0);
      bearing.setAttribute('cy', 0);
      bearing.setAttribute('r', 2);
      var hand = createSvgElement('line');
      hand.setAttribute('x1', 0);
      hand.setAttribute('y1', 0);
      var bg = createSvgElement('circle');
      bg.setAttribute('class', 'clockpicker-canvas-bg');
      bg.setAttribute('r', tickRadius);
      var fg = createSvgElement('circle');
      fg.setAttribute('class', 'clockpicker-canvas-fg');
      fg.setAttribute('r', 3.5);
      g.appendChild(hand);
      g.appendChild(bg);
      g.appendChild(fg);
      g.appendChild(bearing);
      svg.appendChild(g);
      canvas.append(svg);
      this.hand = hand;
      this.bg = bg;
      this.fg = fg;
      this.bearing = bearing;
      this.g = g;
      this.canvas = canvas;
    }
  }
  // Default options
  ClockPicker.DEFAULTS = {
    'default': '',
    fromnow: 0,
    placement: 'bottom',
    align: 'left',
    donetext: '\u5b8c\u6210',
    autoclose: false,
    twelvehour: false,
    vibrate: true
  };
  // Show or hide popover
  ClockPicker.prototype.toggle = function () {
    this[this.isShown ? 'hide' : 'show']();
  };
  // Set popover position
  ClockPicker.prototype.locate = function () {
    var element = this.element, popover = this.popover, offset = element.offset(), width = element.outerWidth(), height = element.outerHeight(), placement = this.options.placement, align = this.options.align, styles = {}, self = this;
    popover.show();
    // Place the popover
    switch (placement) {
    case 'bottom':
      styles.top = offset.top + height;
      break;
    case 'right':
      styles.left = offset.left + width;
      break;
    case 'top':
      styles.top = offset.top - popover.outerHeight();
      break;
    case 'left':
      styles.left = offset.left - popover.outerWidth();
      break;
    }
    // Align the popover arrow
    switch (align) {
    case 'left':
      styles.left = offset.left;
      break;
    case 'right':
      styles.left = offset.left + width - popover.outerWidth();
      break;
    case 'top':
      styles.top = offset.top;
      break;
    case 'bottom':
      styles.top = offset.top + height - popover.outerHeight();
      break;
    }
    popover.css(styles);
  };
  // Show popover
  ClockPicker.prototype.show = function (e) {
    // Not show again
    if (this.isShown) {
      return;
    }
    var self = this;
    // Initialize
    if (!this.isAppended) {
      // Append popover to body
      $body = $(document.body).append(this.popover);
      // Reset position when resize
      $win.on('resize.clockpicker' + this.id, function () {
        if (self.isShown) {
          self.locate();
        }
      });
      this.isAppended = true;
    }
    // Get the time
    var value = ((this.input.prop('value') || this.options['default'] || '') + '').split(':');
    if (value[0] === 'now') {
      var now = new Date(+new Date() + this.options.fromnow);
      value = [
        now.getHours(),
        now.getMinutes()
      ];
    }
    this.hours = +value[0] || 0;
    this.minutes = +value[1] || 0;
    this.spanHours.html(leadingZero(this.hours));
    this.spanMinutes.html(leadingZero(this.minutes));
    // Toggle to hours view
    this.toggleView('hours');
    // Set position
    this.locate();
    this.isShown = true;
    // Hide when clicking or tabbing on any element except the clock, input and addon
    $doc.on('click.clockpicker.' + this.id + ' focusin.clockpicker.' + this.id, function (e) {
      var target = $(e.target);
      if (target.closest(self.popover).length === 0 && target.closest(self.addon).length === 0 && target.closest(self.input).length === 0) {
        self.hide();
      }
    });
    // Hide when ESC is pressed
    $doc.on('keyup.clockpicker.' + this.id, function (e) {
      if (e.keyCode === 27) {
        self.hide();
      }
    });
  };
  // Hide popover
  ClockPicker.prototype.hide = function () {
    this.isShown = false;
    // Unbinding events on document
    $doc.off('click.clockpicker.' + this.id + ' focusin.clockpicker.' + this.id);
    $doc.off('keyup.clockpicker.' + this.id);
    this.popover.hide();
  };
  // Toggle to hours or minutes view
  ClockPicker.prototype.toggleView = function (view, delay) {
    var isHours = view === 'hours', nextView = isHours ? this.hoursView : this.minutesView, hideView = isHours ? this.minutesView : this.hoursView;
    this.currentView = view;
    this.spanHours.toggleClass('text-primary', isHours);
    this.spanMinutes.toggleClass('text-primary', !isHours);
    // Let's make transitions
    hideView.addClass('clockpicker-dial-out');
    nextView.css('visibility', 'visible').removeClass('clockpicker-dial-out');
    // Reset clock hand
    this.resetClock(delay);
    // After transitions ended
    clearTimeout(this.toggleViewTimer);
    this.toggleViewTimer = setTimeout(function () {
      hideView.css('visibility', 'hidden');
    }, duration);
  };
  // Reset clock hand
  ClockPicker.prototype.resetClock = function (delay) {
    var view = this.currentView, value = this[view], isHours = view === 'hours', unit = Math.PI / (isHours ? 6 : 30), radian = value * unit, radius = isHours && value > 0 && value < 13 ? innerRadius : outerRadius, x = Math.sin(radian) * radius, y = -Math.cos(radian) * radius, self = this;
    if (svgSupported && delay) {
      self.canvas.addClass('clockpicker-canvas-out');
      setTimeout(function () {
        self.canvas.removeClass('clockpicker-canvas-out');
        self.setHand(x, y);
      }, delay);
    } else {
      this.setHand(x, y);
    }
  };
  // Set clock hand to (x, y)
  ClockPicker.prototype.setHand = function (x, y, roundBy5, dragging) {
    var radian = Math.atan2(x, -y), isHours = this.currentView === 'hours', unit = Math.PI / (isHours || roundBy5 ? 6 : 30), z = Math.sqrt(x * x + y * y), options = this.options, inner = isHours && z < (outerRadius + innerRadius) / 2, radius = inner ? innerRadius : outerRadius, value;
    if (options.twelvehour) {
      radius = outerRadius;
    }
    // Radian should in range [0, 2PI]
    if (radian < 0) {
      radian = Math.PI * 2 + radian;
    }
    // Get the round value
    value = Math.round(radian / unit);
    // Get the round radian
    radian = value * unit;
    // Correct the hours or minutes
    if (options.twelvehour) {
      if (isHours) {
        if (value === 0) {
          value = 12;
        }
      } else {
        if (roundBy5) {
          value *= 5;
        }
        if (value === 60) {
          value = 0;
        }
      }
    } else {
      if (isHours) {
        if (value === 12) {
          value = 0;
        }
        value = inner ? value === 0 ? 12 : value : value === 0 ? 0 : value + 12;
      } else {
        if (roundBy5) {
          value *= 5;
        }
        if (value === 60) {
          value = 0;
        }
      }
    }
    // Once hours or minutes changed, vibrate the device
    if (this[this.currentView] !== value) {
      if (vibrate && this.options.vibrate) {
        // Do not vibrate too frequently
        if (!this.vibrateTimer) {
          navigator[vibrate](10);
          this.vibrateTimer = setTimeout($.proxy(function () {
            this.vibrateTimer = null;
          }, this), 100);
        }
      }
    }
    this[this.currentView] = value;
    this[isHours ? 'spanHours' : 'spanMinutes'].html(leadingZero(value));
    // If svg is not supported, just add an active class to the tick
    if (!svgSupported) {
      this[isHours ? 'hoursView' : 'minutesView'].find('.clockpicker-tick').each(function () {
        var tick = $(this);
        tick.toggleClass('active', value === +tick.html());
      });
      return;
    }
    // Place clock hand at the top when dragging
    if (dragging || !isHours && value % 5) {
      this.g.insertBefore(this.hand, this.bearing);
      this.g.insertBefore(this.bg, this.fg);
      this.bg.setAttribute('class', 'clockpicker-canvas-bg clockpicker-canvas-bg-trans');
    } else {
      // Or place it at the bottom
      this.g.insertBefore(this.hand, this.bg);
      this.g.insertBefore(this.fg, this.bg);
      this.bg.setAttribute('class', 'clockpicker-canvas-bg');
    }
    // Set clock hand and others' position
    var cx = Math.sin(radian) * radius, cy = -Math.cos(radian) * radius;
    this.hand.setAttribute('x2', cx);
    this.hand.setAttribute('y2', cy);
    this.bg.setAttribute('cx', cx);
    this.bg.setAttribute('cy', cy);
    this.fg.setAttribute('cx', cx);
    this.fg.setAttribute('cy', cy);
  };
  // Hours and minutes are selected
  ClockPicker.prototype.done = function () {
    this.hide();
    var last = this.input.prop('value'), value = leadingZero(this.hours) + ':' + leadingZero(this.minutes);
    if (this.options.twelvehour) {
      value = value + this.amOrPm;
    }
    this.input.prop('value', value);
    if (value !== last) {
      this.input.triggerHandler('change');
      if (!this.isInput) {
        this.element.trigger('change');
      }
    }
    if (this.options.autoclose) {
      this.input.trigger('blur');
    }
  };
  // Remove clockpicker from input
  ClockPicker.prototype.remove = function () {
    this.element.removeData('clockpicker');
    this.input.off('focus.clockpicker click.clockpicker');
    this.addon.off('click.clockpicker');
    if (this.isShown) {
      this.hide();
    }
    if (this.isAppended) {
      $win.off('resize.clockpicker' + this.id);
      this.popover.remove();
    }
  };
  // Extends $.fn.clockpicker
  $.fn.clockpicker = function (option) {
    var args = Array.prototype.slice.call(arguments, 1);
    return this.each(function () {
      var $this = $(this), data = $this.data('clockpicker');
      if (!data) {
        var options = $.extend({}, ClockPicker.DEFAULTS, $this.data(), typeof option == 'object' && option);
        $this.data('clockpicker', new ClockPicker($this, options));
      } else {
        // Manual operatsions. show, hide, remove, e.g.
        if (typeof data[option] === 'function') {
          data[option].apply(data, args);
        }
      }
    });
  };
}());/* =========================================================
 * bootstrap-datepicker.js
 * Repo: https://github.com/eternicode/bootstrap-datepicker/
 * Demo: http://eternicode.github.io/bootstrap-datepicker/
 * Docs: http://bootstrap-datepicker.readthedocs.org/
 * Forked from http://www.eyecon.ro/bootstrap-datepicker
 * =========================================================
 * Started by Stefan Petre; improvements by Andrew Rowls + contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================= */
(function ($, undefined) {
  var $window = $(window);
  function UTCDate() {
    return new Date(Date.UTC.apply(Date, arguments));
  }
  function UTCToday() {
    var today = new Date();
    return UTCDate(today.getFullYear(), today.getMonth(), today.getDate());
  }
  function alias(method) {
    return function () {
      return this[method].apply(this, arguments);
    };
  }
  var DateArray = function () {
      var extras = {
          get: function (i) {
            return this.slice(i)[0];
          },
          contains: function (d) {
            // Array.indexOf is not cross-browser;
            // $.inArray doesn't work with Dates
            var val = d && d.valueOf();
            for (var i = 0, l = this.length; i < l; i++)
              if (this[i].valueOf() === val)
                return i;
            return -1;
          },
          remove: function (i) {
            this.splice(i, 1);
          },
          replace: function (new_array) {
            if (!new_array)
              return;
            if (!$.isArray(new_array))
              new_array = [new_array];
            this.clear();
            this.push.apply(this, new_array);
          },
          clear: function () {
            this.length = 0;
          },
          copy: function () {
            var a = new DateArray();
            a.replace(this);
            return a;
          }
        };
      return function () {
        var a = [];
        a.push.apply(a, arguments);
        $.extend(a, extras);
        return a;
      };
    }();
  // Picker object
  var Datepicker = function (element, options) {
    this.dates = new DateArray();
    this.viewDate = UTCToday();
    this.focusDate = null;
    this._process_options(options);
    this.element = $(element);
    this.isInline = false;
    this.isInput = this.element.is('input');
    this.component = this.element.is('.date') ? this.element.find('.add-on, .input-group-addon, .btn') : false;
    this.hasInput = this.component && this.element.find('input').length;
    if (this.component && this.component.length === 0)
      this.component = false;
    this.picker = $(DPGlobal.template);
    this._buildEvents();
    this._attachEvents();
    if (this.isInline) {
      this.picker.addClass('datepicker-inline').appendTo(this.element);
    } else {
      this.picker.addClass('datepicker-dropdown dropdown-menu');
    }
    if (this.o.rtl) {
      this.picker.addClass('datepicker-rtl');
    }
    this.viewMode = this.o.startView;
    if (this.o.calendarWeeks)
      this.picker.find('tfoot th.today, tfoot th.clear').attr('colspan', function (i, val) {
        return parseInt(val) + 1;
      });
    this._allow_update = false;
    this.setStartDate(this._o.startDate);
    this.setEndDate(this._o.endDate);
    this.setDaysOfWeekDisabled(this.o.daysOfWeekDisabled);
    this.fillDow();
    this.fillMonths();
    this._allow_update = true;
    this.update();
    this.showMode();
    if (this.isInline) {
      this.show();
    }
  };
  Datepicker.prototype = {
    constructor: Datepicker,
    _process_options: function (opts) {
      // Store raw options for reference
      this._o = $.extend({}, this._o, opts);
      // Processed options
      var o = this.o = $.extend({}, this._o);
      // Check if "de-DE" style date is available, if not language should
      // fallback to 2 letter code eg "de"
      var lang = o.language;
      if (!dates[lang]) {
        lang = lang.split('-')[0];
        if (!dates[lang])
          lang = defaults.language;
      }
      o.language = lang;
      switch (o.startView) {
      case 2:
      case 'decade':
        o.startView = 2;
        break;
      case 1:
      case 'year':
        o.startView = 1;
        break;
      default:
        o.startView = 0;
      }
      switch (o.minViewMode) {
      case 1:
      case 'months':
        o.minViewMode = 1;
        break;
      case 2:
      case 'years':
        o.minViewMode = 2;
        break;
      default:
        o.minViewMode = 0;
      }
      o.startView = Math.max(o.startView, o.minViewMode);
      // true, false, or Number > 0
      if (o.multidate !== true) {
        o.multidate = Number(o.multidate) || false;
        if (o.multidate !== false)
          o.multidate = Math.max(0, o.multidate);
        else
          o.multidate = 1;
      }
      o.multidateSeparator = String(o.multidateSeparator);
      o.weekStart %= 7;
      o.weekEnd = (o.weekStart + 6) % 7;
      var format = DPGlobal.parseFormat(o.format);
      if (o.startDate !== -Infinity) {
        if (!!o.startDate) {
          if (o.startDate instanceof Date)
            o.startDate = this._local_to_utc(this._zero_time(o.startDate));
          else
            o.startDate = DPGlobal.parseDate(o.startDate, format, o.language);
        } else {
          o.startDate = -Infinity;
        }
      }
      if (o.endDate !== Infinity) {
        if (!!o.endDate) {
          if (o.endDate instanceof Date)
            o.endDate = this._local_to_utc(this._zero_time(o.endDate));
          else
            o.endDate = DPGlobal.parseDate(o.endDate, format, o.language);
        } else {
          o.endDate = Infinity;
        }
      }
      o.daysOfWeekDisabled = o.daysOfWeekDisabled || [];
      if (!$.isArray(o.daysOfWeekDisabled))
        o.daysOfWeekDisabled = o.daysOfWeekDisabled.split(/[,\s]*/);
      o.daysOfWeekDisabled = $.map(o.daysOfWeekDisabled, function (d) {
        return parseInt(d, 10);
      });
      var plc = String(o.orientation).toLowerCase().split(/\s+/g), _plc = o.orientation.toLowerCase();
      plc = $.grep(plc, function (word) {
        return /^auto|left|right|top|bottom$/.test(word);
      });
      o.orientation = {
        x: 'auto',
        y: 'auto'
      };
      if (!_plc || _plc === 'auto');
      else if (plc.length === 1) {
        switch (plc[0]) {
        case 'top':
        case 'bottom':
          o.orientation.y = plc[0];
          break;
        case 'left':
        case 'right':
          o.orientation.x = plc[0];
          break;
        }
      } else {
        _plc = $.grep(plc, function (word) {
          return /^left|right$/.test(word);
        });
        o.orientation.x = _plc[0] || 'auto';
        _plc = $.grep(plc, function (word) {
          return /^top|bottom$/.test(word);
        });
        o.orientation.y = _plc[0] || 'auto';
      }
    },
    _events: [],
    _secondaryEvents: [],
    _applyEvents: function (evs) {
      for (var i = 0, el, ch, ev; i < evs.length; i++) {
        el = evs[i][0];
        if (evs[i].length === 2) {
          ch = undefined;
          ev = evs[i][1];
        } else if (evs[i].length === 3) {
          ch = evs[i][1];
          ev = evs[i][2];
        }
        el.on(ev, ch);
      }
    },
    _unapplyEvents: function (evs) {
      for (var i = 0, el, ev, ch; i < evs.length; i++) {
        el = evs[i][0];
        if (evs[i].length === 2) {
          ch = undefined;
          ev = evs[i][1];
        } else if (evs[i].length === 3) {
          ch = evs[i][1];
          ev = evs[i][2];
        }
        el.off(ev, ch);
      }
    },
    _buildEvents: function () {
      if (this.isInput) {
        // single input
        this._events = [[
            this.element,
            {
              focus: $.proxy(this.show, this),
              keyup: $.proxy(function (e) {
                if ($.inArray(e.keyCode, [
                    27,
                    37,
                    39,
                    38,
                    40,
                    32,
                    13,
                    9
                  ]) === -1)
                  this.update();
              }, this),
              keydown: $.proxy(this.keydown, this)
            }
          ]];
      } else if (this.component && this.hasInput) {
        // component: input + button
        this._events = [
          [
            this.element.find('input'),
            {
              focus: $.proxy(this.show, this),
              keyup: $.proxy(function (e) {
                if ($.inArray(e.keyCode, [
                    27,
                    37,
                    39,
                    38,
                    40,
                    32,
                    13,
                    9
                  ]) === -1)
                  this.update();
              }, this),
              keydown: $.proxy(this.keydown, this)
            }
          ],
          [
            this.component,
            { click: $.proxy(this.show, this) }
          ]
        ];
      } else if (this.element.is('div')) {
        // inline datepicker
        this.isInline = true;
      } else {
        this._events = [[
            this.element,
            { click: $.proxy(this.show, this) }
          ]];
      }
      this._events.push([
        this.element,
        '*',
        {
          blur: $.proxy(function (e) {
            this._focused_from = e.target;
          }, this)
        }
      ], [
        this.element,
        {
          blur: $.proxy(function (e) {
            this._focused_from = e.target;
          }, this)
        }
      ]);
      this._secondaryEvents = [
        [
          this.picker,
          { click: $.proxy(this.click, this) }
        ],
        [
          $(window),
          { resize: $.proxy(this.place, this) }
        ],
        [
          $(document),
          {
            'mousedown touchstart': $.proxy(function (e) {
              // Clicked outside the datepicker, hide it
              if (!(this.element.is(e.target) || this.element.find(e.target).length || this.picker.is(e.target) || this.picker.find(e.target).length)) {
                this.hide();
              }
            }, this)
          }
        ]
      ];
    },
    _attachEvents: function () {
      this._detachEvents();
      this._applyEvents(this._events);
    },
    _detachEvents: function () {
      this._unapplyEvents(this._events);
    },
    _attachSecondaryEvents: function () {
      this._detachSecondaryEvents();
      this._applyEvents(this._secondaryEvents);
    },
    _detachSecondaryEvents: function () {
      this._unapplyEvents(this._secondaryEvents);
    },
    _trigger: function (event, altdate) {
      var date = altdate || this.dates.get(-1), local_date = this._utc_to_local(date);
      this.element.trigger({
        type: event,
        date: local_date,
        dates: $.map(this.dates, this._utc_to_local),
        format: $.proxy(function (ix, format) {
          if (arguments.length === 0) {
            ix = this.dates.length - 1;
            format = this.o.format;
          } else if (typeof ix === 'string') {
            format = ix;
            ix = this.dates.length - 1;
          }
          format = format || this.o.format;
          var date = this.dates.get(ix);
          return DPGlobal.formatDate(date, format, this.o.language);
        }, this)
      });
    },
    show: function () {
      if (!this.isInline)
        this.picker.appendTo('body');
      this.picker.show();
      this.place();
      this._attachSecondaryEvents();
      this._trigger('show');
    },
    hide: function () {
      if (this.isInline)
        return;
      if (!this.picker.is(':visible'))
        return;
      this.focusDate = null;
      this.picker.hide().detach();
      this._detachSecondaryEvents();
      this.viewMode = this.o.startView;
      this.showMode();
      if (this.o.forceParse && (this.isInput && this.element.val() || this.hasInput && this.element.find('input').val()))
        this.setValue();
      this._trigger('hide');
    },
    remove: function () {
      this.hide();
      this._detachEvents();
      this._detachSecondaryEvents();
      this.picker.remove();
      delete this.element.data().datepicker;
      if (!this.isInput) {
        delete this.element.data().date;
      }
    },
    _utc_to_local: function (utc) {
      return utc && new Date(utc.getTime() + utc.getTimezoneOffset() * 60000);
    },
    _local_to_utc: function (local) {
      return local && new Date(local.getTime() - local.getTimezoneOffset() * 60000);
    },
    _zero_time: function (local) {
      return local && new Date(local.getFullYear(), local.getMonth(), local.getDate());
    },
    _zero_utc_time: function (utc) {
      return utc && new Date(Date.UTC(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate()));
    },
    getDates: function () {
      return $.map(this.dates, this._utc_to_local);
    },
    getUTCDates: function () {
      return $.map(this.dates, function (d) {
        return new Date(d);
      });
    },
    getDate: function () {
      return this._utc_to_local(this.getUTCDate());
    },
    getUTCDate: function () {
      return new Date(this.dates.get(-1));
    },
    setDates: function () {
      var args = $.isArray(arguments[0]) ? arguments[0] : arguments;
      this.update.apply(this, args);
      this._trigger('changeDate');
      this.setValue();
    },
    setUTCDates: function () {
      var args = $.isArray(arguments[0]) ? arguments[0] : arguments;
      this.update.apply(this, $.map(args, this._utc_to_local));
      this._trigger('changeDate');
      this.setValue();
    },
    setDate: alias('setDates'),
    setUTCDate: alias('setUTCDates'),
    setValue: function () {
      var formatted = this.getFormattedDate();
      if (!this.isInput) {
        if (this.component) {
          this.element.find('input').val(formatted).change();
        }
      } else {
        this.element.val(formatted).change();
      }
    },
    getFormattedDate: function (format) {
      if (format === undefined)
        format = this.o.format;
      var lang = this.o.language;
      return $.map(this.dates, function (d) {
        return DPGlobal.formatDate(d, format, lang);
      }).join(this.o.multidateSeparator);
    },
    setStartDate: function (startDate) {
      this._process_options({ startDate: startDate });
      this.update();
      this.updateNavArrows();
    },
    setEndDate: function (endDate) {
      this._process_options({ endDate: endDate });
      this.update();
      this.updateNavArrows();
    },
    setDaysOfWeekDisabled: function (daysOfWeekDisabled) {
      this._process_options({ daysOfWeekDisabled: daysOfWeekDisabled });
      this.update();
      this.updateNavArrows();
    },
    place: function () {
      if (this.isInline)
        return;
      var calendarWidth = this.picker.outerWidth(), calendarHeight = this.picker.outerHeight(), visualPadding = 10, windowWidth = $window.width(), windowHeight = $window.height(), scrollTop = $window.scrollTop();
      var parentsZindex = [];
      this.element.parents().each(function () {
        var itemZIndex = $(this).css('z-index');
        if (itemZIndex !== 'auto' && itemZIndex !== 0)
          parentsZindex.push(parseInt(itemZIndex));
      });
      var zIndex = Math.max.apply(Math, parentsZindex) + 10;
      var offset = this.component ? this.component.parent().offset() : this.element.offset();
      var height = this.component ? this.component.outerHeight(true) : this.element.outerHeight(false);
      var width = this.component ? this.component.outerWidth(true) : this.element.outerWidth(false);
      var left = offset.left, top = offset.top;
      this.picker.removeClass('datepicker-orient-top datepicker-orient-bottom ' + 'datepicker-orient-right datepicker-orient-left');
      if (this.o.orientation.x !== 'auto') {
        this.picker.addClass('datepicker-orient-' + this.o.orientation.x);
        if (this.o.orientation.x === 'right')
          left -= calendarWidth - width;
      }  // auto x orientation is best-placement: if it crosses a window
         // edge, fudge it sideways
      else {
        // Default to left
        this.picker.addClass('datepicker-orient-left');
        if (offset.left < 0)
          left -= offset.left - visualPadding;
        else if (offset.left + calendarWidth > windowWidth)
          left = windowWidth - calendarWidth - visualPadding;
      }
      // auto y orientation is best-situation: top or bottom, no fudging,
      // decision based on which shows more of the calendar
      var yorient = this.o.orientation.y, top_overflow, bottom_overflow;
      if (yorient === 'auto') {
        top_overflow = -scrollTop + offset.top - calendarHeight;
        bottom_overflow = scrollTop + windowHeight - (offset.top + height + calendarHeight);
        if (Math.max(top_overflow, bottom_overflow) === bottom_overflow)
          yorient = 'top';
        else
          yorient = 'bottom';
      }
      this.picker.addClass('datepicker-orient-' + yorient);
      if (yorient === 'top')
        top += height;
      else
        top -= calendarHeight + parseInt(this.picker.css('padding-top'));
      this.picker.css({
        top: top,
        left: left,
        zIndex: zIndex
      });
    },
    _allow_update: true,
    update: function () {
      if (!this._allow_update)
        return;
      var oldDates = this.dates.copy(), dates = [], fromArgs = false;
      if (arguments.length) {
        $.each(arguments, $.proxy(function (i, date) {
          if (date instanceof Date)
            date = this._local_to_utc(date);
          dates.push(date);
        }, this));
        fromArgs = true;
      } else {
        dates = this.isInput ? this.element.val() : this.element.data('date') || this.element.find('input').val();
        if (dates && this.o.multidate)
          dates = dates.split(this.o.multidateSeparator);
        else
          dates = [dates];
        delete this.element.data().date;
      }
      dates = $.map(dates, $.proxy(function (date) {
        return DPGlobal.parseDate(date, this.o.format, this.o.language);
      }, this));
      dates = $.grep(dates, $.proxy(function (date) {
        return date < this.o.startDate || date > this.o.endDate || !date;
      }, this), true);
      this.dates.replace(dates);
      if (this.dates.length)
        this.viewDate = new Date(this.dates.get(-1));
      else if (this.viewDate < this.o.startDate)
        this.viewDate = new Date(this.o.startDate);
      else if (this.viewDate > this.o.endDate)
        this.viewDate = new Date(this.o.endDate);
      if (fromArgs) {
        // setting date by clicking
        this.setValue();
      } else if (dates.length) {
        // setting date by typing
        if (String(oldDates) !== String(this.dates))
          this._trigger('changeDate');
      }
      if (!this.dates.length && oldDates.length)
        this._trigger('clearDate');
      this.fill();
    },
    fillDow: function () {
      var dowCnt = this.o.weekStart, html = '<tr>';
      if (this.o.calendarWeeks) {
        var cell = '<th class="cw">&nbsp;</th>';
        html += cell;
        this.picker.find('.datepicker-days thead tr:first-child').prepend(cell);
      }
      while (dowCnt < this.o.weekStart + 7) {
        html += '<th class="dow">' + dates[this.o.language].daysMin[dowCnt++ % 7] + '</th>';
      }
      html += '</tr>';
      this.picker.find('.datepicker-days thead').append(html);
    },
    fillMonths: function () {
      var html = '', i = 0;
      while (i < 12) {
        html += '<span class="month">' + dates[this.o.language].monthsShort[i++] + '</span>';
      }
      this.picker.find('.datepicker-months td').html(html);
    },
    setRange: function (range) {
      if (!range || !range.length)
        delete this.range;
      else
        this.range = $.map(range, function (d) {
          return d.valueOf();
        });
      this.fill();
    },
    getClassNames: function (date) {
      var cls = [], year = this.viewDate.getUTCFullYear(), month = this.viewDate.getUTCMonth(), today = new Date();
      if (date.getUTCFullYear() < year || date.getUTCFullYear() === year && date.getUTCMonth() < month) {
        cls.push('old');
      } else if (date.getUTCFullYear() > year || date.getUTCFullYear() === year && date.getUTCMonth() > month) {
        cls.push('new');
      }
      if (this.focusDate && date.valueOf() === this.focusDate.valueOf())
        cls.push('focused');
      // Compare internal UTC date with local today, not UTC today
      if (this.o.todayHighlight && date.getUTCFullYear() === today.getFullYear() && date.getUTCMonth() === today.getMonth() && date.getUTCDate() === today.getDate()) {
        cls.push('today');
      }
      if (this.dates.contains(date) !== -1)
        cls.push('active');
      if (date.valueOf() < this.o.startDate || date.valueOf() > this.o.endDate || $.inArray(date.getUTCDay(), this.o.daysOfWeekDisabled) !== -1) {
        cls.push('disabled');
      }
      if (this.range) {
        if (date > this.range[0] && date < this.range[this.range.length - 1]) {
          cls.push('range');
        }
        if ($.inArray(date.valueOf(), this.range) !== -1) {
          cls.push('selected');
        }
      }
      return cls;
    },
    fill: function () {
      var d = new Date(this.viewDate), year = d.getUTCFullYear(), month = d.getUTCMonth(), startYear = this.o.startDate !== -Infinity ? this.o.startDate.getUTCFullYear() : -Infinity, startMonth = this.o.startDate !== -Infinity ? this.o.startDate.getUTCMonth() : -Infinity, endYear = this.o.endDate !== Infinity ? this.o.endDate.getUTCFullYear() : Infinity, endMonth = this.o.endDate !== Infinity ? this.o.endDate.getUTCMonth() : Infinity, todaytxt = dates[this.o.language].today || dates['en'].today || '', cleartxt = dates[this.o.language].clear || dates['en'].clear || '', tooltip;
      if (isNaN(year) || isNaN(month))
        return;
      this.picker.find('.datepicker-days thead th.datepicker-switch').text(dates[this.o.language].months[month] + ' ' + year);
      this.picker.find('tfoot th.today').text(todaytxt).toggle(this.o.todayBtn !== false);
      this.picker.find('tfoot th.clear').text(cleartxt).toggle(this.o.clearBtn !== false);
      this.updateNavArrows();
      this.fillMonths();
      var prevMonth = UTCDate(year, month - 1, 28), day = DPGlobal.getDaysInMonth(prevMonth.getUTCFullYear(), prevMonth.getUTCMonth());
      prevMonth.setUTCDate(day);
      prevMonth.setUTCDate(day - (prevMonth.getUTCDay() - this.o.weekStart + 7) % 7);
      var nextMonth = new Date(prevMonth);
      nextMonth.setUTCDate(nextMonth.getUTCDate() + 42);
      nextMonth = nextMonth.valueOf();
      var html = [];
      var clsName;
      while (prevMonth.valueOf() < nextMonth) {
        if (prevMonth.getUTCDay() === this.o.weekStart) {
          html.push('<tr>');
          if (this.o.calendarWeeks) {
            // ISO 8601: First week contains first thursday.
            // ISO also states week starts on Monday, but we can be more abstract here.
            var
              // Start of current week: based on weekstart/current date
              ws = new Date(+prevMonth + (this.o.weekStart - prevMonth.getUTCDay() - 7) % 7 * 86400000),
              // Thursday of this week
              th = new Date(Number(ws) + (7 + 4 - ws.getUTCDay()) % 7 * 86400000),
              // First Thursday of year, year from thursday
              yth = new Date(Number(yth = UTCDate(th.getUTCFullYear(), 0, 1)) + (7 + 4 - yth.getUTCDay()) % 7 * 86400000),
              // Calendar week: ms between thursdays, div ms per day, div 7 days
              calWeek = (th - yth) / 86400000 / 7 + 1;
            html.push('<td class="cw">' + calWeek + '</td>');
          }
        }
        clsName = this.getClassNames(prevMonth);
        clsName.push('day');
        if (this.o.beforeShowDay !== $.noop) {
          var before = this.o.beforeShowDay(this._utc_to_local(prevMonth));
          if (before === undefined)
            before = {};
          else if (typeof before === 'boolean')
            before = { enabled: before };
          else if (typeof before === 'string')
            before = { classes: before };
          if (before.enabled === false)
            clsName.push('disabled');
          if (before.classes)
            clsName = clsName.concat(before.classes.split(/\s+/));
          if (before.tooltip)
            tooltip = before.tooltip;
        }
        clsName = $.unique(clsName);
        html.push('<td class="' + clsName.join(' ') + '"' + (tooltip ? ' title="' + tooltip + '"' : '') + '>' + prevMonth.getUTCDate() + '</td>');
        tooltip = null;
        if (prevMonth.getUTCDay() === this.o.weekEnd) {
          html.push('</tr>');
        }
        prevMonth.setUTCDate(prevMonth.getUTCDate() + 1);
      }
      this.picker.find('.datepicker-days tbody').empty().append(html.join(''));
      var months = this.picker.find('.datepicker-months').find('th:eq(1)').text(year).end().find('span').removeClass('active');
      $.each(this.dates, function (i, d) {
        if (d.getUTCFullYear() === year)
          months.eq(d.getUTCMonth()).addClass('active');
      });
      if (year < startYear || year > endYear) {
        months.addClass('disabled');
      }
      if (year === startYear) {
        months.slice(0, startMonth).addClass('disabled');
      }
      if (year === endYear) {
        months.slice(endMonth + 1).addClass('disabled');
      }
      html = '';
      year = parseInt(year / 10, 10) * 10;
      var yearCont = this.picker.find('.datepicker-years').find('th:eq(1)').text(year + '-' + (year + 9)).end().find('td');
      year -= 1;
      var years = $.map(this.dates, function (d) {
          return d.getUTCFullYear();
        }), classes;
      for (var i = -1; i < 11; i++) {
        classes = ['year'];
        if (i === -1)
          classes.push('old');
        else if (i === 10)
          classes.push('new');
        if ($.inArray(year, years) !== -1)
          classes.push('active');
        if (year < startYear || year > endYear)
          classes.push('disabled');
        html += '<span class="' + classes.join(' ') + '">' + year + '</span>';
        year += 1;
      }
      yearCont.html(html);
    },
    updateNavArrows: function () {
      if (!this._allow_update)
        return;
      var d = new Date(this.viewDate), year = d.getUTCFullYear(), month = d.getUTCMonth();
      switch (this.viewMode) {
      case 0:
        if (this.o.startDate !== -Infinity && year <= this.o.startDate.getUTCFullYear() && month <= this.o.startDate.getUTCMonth()) {
          this.picker.find('.prev').css({ visibility: 'hidden' });
        } else {
          this.picker.find('.prev').css({ visibility: 'visible' });
        }
        if (this.o.endDate !== Infinity && year >= this.o.endDate.getUTCFullYear() && month >= this.o.endDate.getUTCMonth()) {
          this.picker.find('.next').css({ visibility: 'hidden' });
        } else {
          this.picker.find('.next').css({ visibility: 'visible' });
        }
        break;
      case 1:
      case 2:
        if (this.o.startDate !== -Infinity && year <= this.o.startDate.getUTCFullYear()) {
          this.picker.find('.prev').css({ visibility: 'hidden' });
        } else {
          this.picker.find('.prev').css({ visibility: 'visible' });
        }
        if (this.o.endDate !== Infinity && year >= this.o.endDate.getUTCFullYear()) {
          this.picker.find('.next').css({ visibility: 'hidden' });
        } else {
          this.picker.find('.next').css({ visibility: 'visible' });
        }
        break;
      }
    },
    click: function (e) {
      e.preventDefault();
      var target = $(e.target).closest('span, td, th'), year, month, day;
      if (target.length === 1) {
        switch (target[0].nodeName.toLowerCase()) {
        case 'th':
          switch (target[0].className) {
          case 'datepicker-switch':
            this.showMode(1);
            break;
          case 'prev':
          case 'next':
            var dir = DPGlobal.modes[this.viewMode].navStep * (target[0].className === 'prev' ? -1 : 1);
            switch (this.viewMode) {
            case 0:
              this.viewDate = this.moveMonth(this.viewDate, dir);
              this._trigger('changeMonth', this.viewDate);
              break;
            case 1:
            case 2:
              this.viewDate = this.moveYear(this.viewDate, dir);
              if (this.viewMode === 1)
                this._trigger('changeYear', this.viewDate);
              break;
            }
            this.fill();
            break;
          case 'today':
            var date = new Date();
            date = UTCDate(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
            this.showMode(-2);
            var which = this.o.todayBtn === 'linked' ? null : 'view';
            this._setDate(date, which);
            break;
          case 'clear':
            var element;
            if (this.isInput)
              element = this.element;
            else if (this.component)
              element = this.element.find('input');
            if (element)
              element.val('').change();
            this.update();
            this._trigger('changeDate');
            if (this.o.autoclose)
              this.hide();
            break;
          }
          break;
        case 'span':
          if (!target.is('.disabled')) {
            this.viewDate.setUTCDate(1);
            if (target.is('.month')) {
              day = 1;
              month = target.parent().find('span').index(target);
              year = this.viewDate.getUTCFullYear();
              this.viewDate.setUTCMonth(month);
              this._trigger('changeMonth', this.viewDate);
              if (this.o.minViewMode === 1) {
                this._setDate(UTCDate(year, month, day));
              }
            } else {
              day = 1;
              month = 0;
              year = parseInt(target.text(), 10) || 0;
              this.viewDate.setUTCFullYear(year);
              this._trigger('changeYear', this.viewDate);
              if (this.o.minViewMode === 2) {
                this._setDate(UTCDate(year, month, day));
              }
            }
            this.showMode(-1);
            this.fill();
          }
          break;
        case 'td':
          if (target.is('.day') && !target.is('.disabled')) {
            day = parseInt(target.text(), 10) || 1;
            year = this.viewDate.getUTCFullYear();
            month = this.viewDate.getUTCMonth();
            if (target.is('.old')) {
              if (month === 0) {
                month = 11;
                year -= 1;
              } else {
                month -= 1;
              }
            } else if (target.is('.new')) {
              if (month === 11) {
                month = 0;
                year += 1;
              } else {
                month += 1;
              }
            }
            this._setDate(UTCDate(year, month, day));
          }
          break;
        }
      }
      if (this.picker.is(':visible') && this._focused_from) {
        $(this._focused_from).focus();
      }
      delete this._focused_from;
    },
    _toggle_multidate: function (date) {
      var ix = this.dates.contains(date);
      if (!date) {
        this.dates.clear();
      }
      if (this.o.multidate === 1 && ix === 0) {
      } else if (ix !== -1) {
        this.dates.remove(ix);
      } else {
        this.dates.push(date);
      }
      if (typeof this.o.multidate === 'number')
        while (this.dates.length > this.o.multidate)
          this.dates.remove(0);
    },
    _setDate: function (date, which) {
      if (!which || which === 'date')
        this._toggle_multidate(date && new Date(date));
      if (!which || which === 'view')
        this.viewDate = date && new Date(date);
      this.fill();
      this.setValue();
      this._trigger('changeDate');
      var element;
      if (this.isInput) {
        element = this.element;
      } else if (this.component) {
        element = this.element.find('input');
      }
      if (element) {
        element.change();
      }
      if (this.o.autoclose && (!which || which === 'date')) {
        this.hide();
      }
    },
    moveMonth: function (date, dir) {
      if (!date)
        return undefined;
      if (!dir)
        return date;
      var new_date = new Date(date.valueOf()), day = new_date.getUTCDate(), month = new_date.getUTCMonth(), mag = Math.abs(dir), new_month, test;
      dir = dir > 0 ? 1 : -1;
      if (mag === 1) {
        test = dir === -1 ? function () {
          return new_date.getUTCMonth() === month;
        }  // If going forward one month, make sure month is as expected
           // (eg, Jan 31 -> Feb 31 == Feb 28, not Mar 02)
 : function () {
          return new_date.getUTCMonth() !== new_month;
        };
        new_month = month + dir;
        new_date.setUTCMonth(new_month);
        // Dec -> Jan (12) or Jan -> Dec (-1) -- limit expected date to 0-11
        if (new_month < 0 || new_month > 11)
          new_month = (new_month + 12) % 12;
      } else {
        // For magnitudes >1, move one month at a time...
        for (var i = 0; i < mag; i++)
          // ...which might decrease the day (eg, Jan 31 to Feb 28, etc)...
          new_date = this.moveMonth(new_date, dir);
        // ...then reset the day, keeping it in the new month
        new_month = new_date.getUTCMonth();
        new_date.setUTCDate(day);
        test = function () {
          return new_month !== new_date.getUTCMonth();
        };
      }
      // Common date-resetting loop -- if date is beyond end of month, make it
      // end of month
      while (test()) {
        new_date.setUTCDate(--day);
        new_date.setUTCMonth(new_month);
      }
      return new_date;
    },
    moveYear: function (date, dir) {
      return this.moveMonth(date, dir * 12);
    },
    dateWithinRange: function (date) {
      return date >= this.o.startDate && date <= this.o.endDate;
    },
    keydown: function (e) {
      if (this.picker.is(':not(:visible)')) {
        if (e.keyCode === 27)
          // allow escape to hide and re-show picker
          this.show();
        return;
      }
      var dateChanged = false, dir, newDate, newViewDate, focusDate = this.focusDate || this.viewDate;
      switch (e.keyCode) {
      case 27:
        // escape
        if (this.focusDate) {
          this.focusDate = null;
          this.viewDate = this.dates.get(-1) || this.viewDate;
          this.fill();
        } else
          this.hide();
        e.preventDefault();
        break;
      case 37:
      // left
      case 39:
        // right
        if (!this.o.keyboardNavigation)
          break;
        dir = e.keyCode === 37 ? -1 : 1;
        if (e.ctrlKey) {
          newDate = this.moveYear(this.dates.get(-1) || UTCToday(), dir);
          newViewDate = this.moveYear(focusDate, dir);
          this._trigger('changeYear', this.viewDate);
        } else if (e.shiftKey) {
          newDate = this.moveMonth(this.dates.get(-1) || UTCToday(), dir);
          newViewDate = this.moveMonth(focusDate, dir);
          this._trigger('changeMonth', this.viewDate);
        } else {
          newDate = new Date(this.dates.get(-1) || UTCToday());
          newDate.setUTCDate(newDate.getUTCDate() + dir);
          newViewDate = new Date(focusDate);
          newViewDate.setUTCDate(focusDate.getUTCDate() + dir);
        }
        if (this.dateWithinRange(newDate)) {
          this.focusDate = this.viewDate = newViewDate;
          this.setValue();
          this.fill();
          e.preventDefault();
        }
        break;
      case 38:
      // up
      case 40:
        // down
        if (!this.o.keyboardNavigation)
          break;
        dir = e.keyCode === 38 ? -1 : 1;
        if (e.ctrlKey) {
          newDate = this.moveYear(this.dates.get(-1) || UTCToday(), dir);
          newViewDate = this.moveYear(focusDate, dir);
          this._trigger('changeYear', this.viewDate);
        } else if (e.shiftKey) {
          newDate = this.moveMonth(this.dates.get(-1) || UTCToday(), dir);
          newViewDate = this.moveMonth(focusDate, dir);
          this._trigger('changeMonth', this.viewDate);
        } else {
          newDate = new Date(this.dates.get(-1) || UTCToday());
          newDate.setUTCDate(newDate.getUTCDate() + dir * 7);
          newViewDate = new Date(focusDate);
          newViewDate.setUTCDate(focusDate.getUTCDate() + dir * 7);
        }
        if (this.dateWithinRange(newDate)) {
          this.focusDate = this.viewDate = newViewDate;
          this.setValue();
          this.fill();
          e.preventDefault();
        }
        break;
      case 32:
        // spacebar
        // Spacebar is used in manually typing dates in some formats.
        // As such, its behavior should not be hijacked.
        break;
      case 13:
        // enter
        focusDate = this.focusDate || this.dates.get(-1) || this.viewDate;
        if (this.o.keyboardNavigation) {
          this._toggle_multidate(focusDate);
          dateChanged = true;
        }
        this.focusDate = null;
        this.viewDate = this.dates.get(-1) || this.viewDate;
        this.setValue();
        this.fill();
        if (this.picker.is(':visible')) {
          e.preventDefault();
          if (this.o.autoclose)
            this.hide();
        }
        break;
      case 9:
        // tab
        this.focusDate = null;
        this.viewDate = this.dates.get(-1) || this.viewDate;
        this.fill();
        this.hide();
        break;
      }
      if (dateChanged) {
        if (this.dates.length)
          this._trigger('changeDate');
        else
          this._trigger('clearDate');
        var element;
        if (this.isInput) {
          element = this.element;
        } else if (this.component) {
          element = this.element.find('input');
        }
        if (element) {
          element.change();
        }
      }
    },
    showMode: function (dir) {
      if (dir) {
        this.viewMode = Math.max(this.o.minViewMode, Math.min(2, this.viewMode + dir));
      }
      this.picker.find('>div').hide().filter('.datepicker-' + DPGlobal.modes[this.viewMode].clsName).css('display', 'block');
      this.updateNavArrows();
    }
  };
  var DateRangePicker = function (element, options) {
    this.element = $(element);
    this.inputs = $.map(options.inputs, function (i) {
      return i.jquery ? i[0] : i;
    });
    delete options.inputs;
    $(this.inputs).datepicker(options).bind('changeDate', $.proxy(this.dateUpdated, this));
    this.pickers = $.map(this.inputs, function (i) {
      return $(i).data('datepicker');
    });
    this.updateDates();
  };
  DateRangePicker.prototype = {
    updateDates: function () {
      this.dates = $.map(this.pickers, function (i) {
        return i.getUTCDate();
      });
      this.updateRanges();
    },
    updateRanges: function () {
      var range = $.map(this.dates, function (d) {
          return d.valueOf();
        });
      $.each(this.pickers, function (i, p) {
        p.setRange(range);
      });
    },
    dateUpdated: function (e) {
      // `this.updating` is a workaround for preventing infinite recursion
      // between `changeDate` triggering and `setUTCDate` calling.  Until
      // there is a better mechanism.
      if (this.updating)
        return;
      this.updating = true;
      var dp = $(e.target).data('datepicker'), new_date = dp.getUTCDate(), i = $.inArray(e.target, this.inputs), l = this.inputs.length;
      if (i === -1)
        return;
      $.each(this.pickers, function (i, p) {
        if (!p.getUTCDate())
          p.setUTCDate(new_date);
      });
      if (new_date < this.dates[i]) {
        // Date being moved earlier/left
        while (i >= 0 && new_date < this.dates[i]) {
          this.pickers[i--].setUTCDate(new_date);
        }
      } else if (new_date > this.dates[i]) {
        // Date being moved later/right
        while (i < l && new_date > this.dates[i]) {
          this.pickers[i++].setUTCDate(new_date);
        }
      }
      this.updateDates();
      delete this.updating;
    },
    remove: function () {
      $.map(this.pickers, function (p) {
        p.remove();
      });
      delete this.element.data().datepicker;
    }
  };
  function opts_from_el(el, prefix) {
    // Derive options from element data-attrs
    var data = $(el).data(), out = {}, inkey, replace = new RegExp('^' + prefix.toLowerCase() + '([A-Z])');
    prefix = new RegExp('^' + prefix.toLowerCase());
    function re_lower(_, a) {
      return a.toLowerCase();
    }
    for (var key in data)
      if (prefix.test(key)) {
        inkey = key.replace(replace, re_lower);
        out[inkey] = data[key];
      }
    return out;
  }
  function opts_from_locale(lang) {
    // Derive options from locale plugins
    var out = {};
    // Check if "de-DE" style date is available, if not language should
    // fallback to 2 letter code eg "de"
    if (!dates[lang]) {
      lang = lang.split('-')[0];
      if (!dates[lang])
        return;
    }
    var d = dates[lang];
    $.each(locale_opts, function (i, k) {
      if (k in d)
        out[k] = d[k];
    });
    return out;
  }
  var old = $.fn.datepicker;
  $.fn.datepicker = function (option) {
    var args = Array.apply(null, arguments);
    args.shift();
    var internal_return;
    this.each(function () {
      var $this = $(this), data = $this.data('datepicker'), options = typeof option === 'object' && option;
      if (!data) {
        var elopts = opts_from_el(this, 'date'),
          // Preliminary otions
          xopts = $.extend({}, defaults, elopts, options), locopts = opts_from_locale(xopts.language),
          // Options priority: js args, data-attrs, locales, defaults
          opts = $.extend({}, defaults, locopts, elopts, options);
        if ($this.is('.input-daterange') || opts.inputs) {
          var ropts = { inputs: opts.inputs || $this.find('input').toArray() };
          $this.data('datepicker', data = new DateRangePicker(this, $.extend(opts, ropts)));
        } else {
          $this.data('datepicker', data = new Datepicker(this, opts));
        }
      }
      if (typeof option === 'string' && typeof data[option] === 'function') {
        internal_return = data[option].apply(data, args);
        if (internal_return !== undefined)
          return false;
      }
    });
    if (internal_return !== undefined)
      return internal_return;
    else
      return this;
  };
  var defaults = $.fn.datepicker.defaults = {
      autoclose: false,
      beforeShowDay: $.noop,
      calendarWeeks: false,
      clearBtn: false,
      daysOfWeekDisabled: [],
      endDate: Infinity,
      forceParse: true,
      format: 'mm/dd/yyyy',
      keyboardNavigation: true,
      language: 'en',
      minViewMode: 0,
      multidate: false,
      multidateSeparator: ',',
      orientation: 'auto',
      rtl: false,
      startDate: -Infinity,
      startView: 0,
      todayBtn: false,
      todayHighlight: false,
      weekStart: 0
    };
  var locale_opts = $.fn.datepicker.locale_opts = [
      'format',
      'rtl',
      'weekStart'
    ];
  $.fn.datepicker.Constructor = Datepicker;
  var dates = $.fn.datepicker.dates = {
      en: {
        days: [
          'Sunday',
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday'
        ],
        daysShort: [
          'Sun',
          'Mon',
          'Tue',
          'Wed',
          'Thu',
          'Fri',
          'Sat',
          'Sun'
        ],
        daysMin: [
          'Su',
          'Mo',
          'Tu',
          'We',
          'Th',
          'Fr',
          'Sa',
          'Su'
        ],
        months: [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December'
        ],
        monthsShort: [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec'
        ],
        today: 'Today',
        clear: 'Clear'
      }
    };
  var DPGlobal = {
      modes: [
        {
          clsName: 'days',
          navFnc: 'Month',
          navStep: 1
        },
        {
          clsName: 'months',
          navFnc: 'FullYear',
          navStep: 1
        },
        {
          clsName: 'years',
          navFnc: 'FullYear',
          navStep: 10
        }
      ],
      isLeapYear: function (year) {
        return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
      },
      getDaysInMonth: function (year, month) {
        return [
          31,
          DPGlobal.isLeapYear(year) ? 29 : 28,
          31,
          30,
          31,
          30,
          31,
          31,
          30,
          31,
          30,
          31
        ][month];
      },
      validParts: /dd?|DD?|mm?|MM?|yy(?:yy)?/g,
      nonpunctuation: /[^ -\/:-@\[\u3400-\u9fff-`{-~\t\n\r]+/g,
      parseFormat: function (format) {
        // IE treats \0 as a string end in inputs (truncating the value),
        // so it's a bad format delimiter, anyway
        var separators = format.replace(this.validParts, '\0').split('\0'), parts = format.match(this.validParts);
        if (!separators || !separators.length || !parts || parts.length === 0) {
          throw new Error('Invalid date format.');
        }
        return {
          separators: separators,
          parts: parts
        };
      },
      parseDate: function (date, format, language) {
        if (!date)
          return undefined;
        if (date instanceof Date)
          return date;
        if (typeof format === 'string')
          format = DPGlobal.parseFormat(format);
        var part_re = /([\-+]\d+)([dmwy])/, parts = date.match(/([\-+]\d+)([dmwy])/g), part, dir, i;
        if (/^[\-+]\d+[dmwy]([\s,]+[\-+]\d+[dmwy])*$/.test(date)) {
          date = new Date();
          for (i = 0; i < parts.length; i++) {
            part = part_re.exec(parts[i]);
            dir = parseInt(part[1]);
            switch (part[2]) {
            case 'd':
              date.setUTCDate(date.getUTCDate() + dir);
              break;
            case 'm':
              date = Datepicker.prototype.moveMonth.call(Datepicker.prototype, date, dir);
              break;
            case 'w':
              date.setUTCDate(date.getUTCDate() + dir * 7);
              break;
            case 'y':
              date = Datepicker.prototype.moveYear.call(Datepicker.prototype, date, dir);
              break;
            }
          }
          return UTCDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0);
        }
        parts = date && date.match(this.nonpunctuation) || [];
        date = new Date();
        var parsed = {}, setters_order = [
            'yyyy',
            'yy',
            'M',
            'MM',
            'm',
            'mm',
            'd',
            'dd'
          ], setters_map = {
            yyyy: function (d, v) {
              return d.setUTCFullYear(v);
            },
            yy: function (d, v) {
              return d.setUTCFullYear(2000 + v);
            },
            m: function (d, v) {
              if (isNaN(d))
                return d;
              v -= 1;
              while (v < 0)
                v += 12;
              v %= 12;
              d.setUTCMonth(v);
              while (d.getUTCMonth() !== v)
                d.setUTCDate(d.getUTCDate() - 1);
              return d;
            },
            d: function (d, v) {
              return d.setUTCDate(v);
            }
          }, val, filtered;
        setters_map['M'] = setters_map['MM'] = setters_map['mm'] = setters_map['m'];
        setters_map['dd'] = setters_map['d'];
        date = UTCDate(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
        var fparts = format.parts.slice();
        // Remove noop parts
        if (parts.length !== fparts.length) {
          fparts = $(fparts).filter(function (i, p) {
            return $.inArray(p, setters_order) !== -1;
          }).toArray();
        }
        // Process remainder
        function match_part() {
          var m = this.slice(0, parts[i].length), p = parts[i].slice(0, m.length);
          return m === p;
        }
        if (parts.length === fparts.length) {
          var cnt;
          for (i = 0, cnt = fparts.length; i < cnt; i++) {
            val = parseInt(parts[i], 10);
            part = fparts[i];
            if (isNaN(val)) {
              switch (part) {
              case 'MM':
                filtered = $(dates[language].months).filter(match_part);
                val = $.inArray(filtered[0], dates[language].months) + 1;
                break;
              case 'M':
                filtered = $(dates[language].monthsShort).filter(match_part);
                val = $.inArray(filtered[0], dates[language].monthsShort) + 1;
                break;
              }
            }
            parsed[part] = val;
          }
          var _date, s;
          for (i = 0; i < setters_order.length; i++) {
            s = setters_order[i];
            if (s in parsed && !isNaN(parsed[s])) {
              _date = new Date(date);
              setters_map[s](_date, parsed[s]);
              if (!isNaN(_date))
                date = _date;
            }
          }
        }
        return date;
      },
      formatDate: function (date, format, language) {
        if (!date)
          return '';
        if (typeof format === 'string')
          format = DPGlobal.parseFormat(format);
        var val = {
            d: date.getUTCDate(),
            D: dates[language].daysShort[date.getUTCDay()],
            DD: dates[language].days[date.getUTCDay()],
            m: date.getUTCMonth() + 1,
            M: dates[language].monthsShort[date.getUTCMonth()],
            MM: dates[language].months[date.getUTCMonth()],
            yy: date.getUTCFullYear().toString().substring(2),
            yyyy: date.getUTCFullYear()
          };
        val.dd = (val.d < 10 ? '0' : '') + val.d;
        val.mm = (val.m < 10 ? '0' : '') + val.m;
        date = [];
        var seps = $.extend([], format.separators);
        for (var i = 0, cnt = format.parts.length; i <= cnt; i++) {
          if (seps.length)
            date.push(seps.shift());
          date.push(val[format.parts[i]]);
        }
        return date.join('');
      },
      headTemplate: '<thead>' + '<tr>' + '<th class="prev">&laquo;</th>' + '<th colspan="5" class="datepicker-switch"></th>' + '<th class="next">&raquo;</th>' + '</tr>' + '</thead>',
      contTemplate: '<tbody><tr><td colspan="7"></td></tr></tbody>',
      footTemplate: '<tfoot>' + '<tr>' + '<th colspan="7" class="today"></th>' + '</tr>' + '<tr>' + '<th colspan="7" class="clear"></th>' + '</tr>' + '</tfoot>'
    };
  DPGlobal.template = '<div class="datepicker">' + '<div class="datepicker-days">' + '<table class=" table-condensed">' + DPGlobal.headTemplate + '<tbody></tbody>' + DPGlobal.footTemplate + '</table>' + '</div>' + '<div class="datepicker-months">' + '<table class="table-condensed">' + DPGlobal.headTemplate + DPGlobal.contTemplate + DPGlobal.footTemplate + '</table>' + '</div>' + '<div class="datepicker-years">' + '<table class="table-condensed">' + DPGlobal.headTemplate + DPGlobal.contTemplate + DPGlobal.footTemplate + '</table>' + '</div>' + '</div>';
  $.fn.datepicker.DPGlobal = DPGlobal;
  /* DATEPICKER NO CONFLICT
	* =================== */
  $.fn.datepicker.noConflict = function () {
    $.fn.datepicker = old;
    return this;
  };
  /* DATEPICKER DATA-API
	* ================== */
  $(document).on('focus.datepicker.data-api click.datepicker.data-api', '[data-provide="datepicker"]', function (e) {
    var $this = $(this);
    if ($this.data('datepicker'))
      return;
    e.preventDefault();
    // component click requires us to explicitly show it
    $this.datepicker('show');
  });
  $(function () {
    $('[data-provide="datepicker-inline"]').datepicker();
  });
}(window.jQuery));/*! ngTable v0.3.2 by Vitalii Savchuk(esvit666@gmail.com) - https://github.com/esvit/ng-table - New BSD License */
!function (a, b) {
  'use strict';
  return 'function' == typeof define && define.amd ? (define(['angular'], function (a) {
    return b(a);
  }), void 0) : b(a);
}(angular || null, function (a) {
  'use strict';
  var b = a.module('ngTable', []);
  b.factory('ngTableParams', [
    '$q',
    '$log',
    function (b, c) {
      var d = function (a) {
          return !isNaN(parseFloat(a)) && isFinite(a);
        }, e = function (e, f) {
          var g = this, h = function () {
              j.debugMode && c.debug && c.debug.apply(this, arguments);
            };
          this.data = [], this.parameters = function (b, c) {
            if (c = c || !1, a.isDefined(b)) {
              for (var e in b) {
                var f = b[e];
                if (c && e.indexOf('[') >= 0) {
                  for (var g = e.split(/\[(.*)\]/).reverse(), j = '', k = 0, l = g.length; l > k; k++) {
                    var m = g[k];
                    if ('' !== m) {
                      var n = f;
                      f = {}, f[j = m] = d(n) ? parseFloat(n) : n;
                    }
                  }
                  'sorting' === j && (i[j] = {}), i[j] = a.extend(i[j] || {}, f[j]);
                } else
                  i[e] = d(b[e]) ? parseFloat(b[e]) : b[e];
              }
              return h('ngTable: set parameters', i), this;
            }
            return i;
          }, this.settings = function (b) {
            return a.isDefined(b) ? (a.isArray(b.data) && (b.total = b.data.length), j = a.extend(j, b), h('ngTable: set settings', j), this) : j;
          }, this.page = function (b) {
            return a.isDefined(b) ? this.parameters({ page: b }) : i.page;
          }, this.total = function (b) {
            return a.isDefined(b) ? this.settings({ total: b }) : j.total;
          }, this.count = function (b) {
            return a.isDefined(b) ? this.parameters({
              count: b,
              page: 1
            }) : i.count;
          }, this.filter = function (b) {
            return a.isDefined(b) ? this.parameters({ filter: b }) : i.filter;
          }, this.sorting = function (b) {
            if (2 == arguments.length) {
              var c = {};
              return c[b] = arguments[1], this.parameters({ sorting: c }), this;
            }
            return a.isDefined(b) ? this.parameters({ sorting: b }) : i.sorting;
          }, this.isSortBy = function (b, c) {
            return a.isDefined(i.sorting[b]) && i.sorting[b] == c;
          }, this.orderBy = function () {
            var a = [];
            for (var b in i.sorting)
              a.push(('asc' === i.sorting[b] ? '+' : '-') + b);
            return a;
          }, this.getData = function (b, c) {
            a.isArray(this.data) && a.isObject(c) ? b.resolve(this.data.slice((c.page() - 1) * c.count(), c.page() * c.count())) : b.resolve([]);
          }, this.getGroups = function (c, d) {
            var e = b.defer();
            e.promise.then(function (b) {
              var e = {};
              a.forEach(b, function (b) {
                var c = a.isFunction(d) ? d(b) : b[d];
                e[c] = e[c] || { data: [] }, e[c].value = c, e[c].data.push(b);
              });
              var f = [];
              for (var g in e)
                f.push(e[g]);
              h('ngTable: refresh groups', f), c.resolve(f);
            }), this.getData(e, g);
          }, this.generatePagesArray = function (a, b, c) {
            var d, e, f, g, h, i;
            if (d = 11, i = [], h = Math.ceil(b / c), h > 1) {
              i.push({
                type: 'prev',
                number: Math.max(1, a - 1),
                active: a > 1
              }), i.push({
                type: 'first',
                number: 1,
                active: a > 1
              }), f = Math.round((d - 5) / 2), g = Math.max(2, a - f), e = Math.min(h - 1, a + 2 * f - (a - g)), g = Math.max(2, g - (2 * f - (e - g)));
              for (var j = g; e >= j;)
                j === g && 2 !== j || j === e && j !== h - 1 ? i.push({
                  type: 'more',
                  active: !1
                }) : i.push({
                  type: 'page',
                  number: j,
                  active: a !== j
                }), j++;
              i.push({
                type: 'last',
                number: h,
                active: a !== h
              }), i.push({
                type: 'next',
                number: Math.min(h, a + 1),
                active: h > a
              });
            }
            return i;
          }, this.url = function (b) {
            b = b || !1;
            var c = b ? [] : {};
            for (var d in i)
              if (i.hasOwnProperty(d)) {
                var e = i[d], f = encodeURIComponent(d);
                if ('object' == typeof e) {
                  for (var g in e)
                    if (!a.isUndefined(e[g]) && '' !== e[g]) {
                      var h = f + '[' + encodeURIComponent(g) + ']';
                      b ? c.push(h + '=' + e[g]) : c[h] = e[g];
                    }
                } else
                  a.isFunction(e) || a.isUndefined(e) || '' === e || (b ? c.push(f + '=' + encodeURIComponent(e)) : c[f] = encodeURIComponent(e));
              }
            return c;
          }, this.reload = function () {
            var a = b.defer(), c = this;
            j.$loading = !0, j.groupBy ? j.getGroups(a, j.groupBy, this) : j.getData(a, this), h('ngTable: reload data'), a.promise.then(function (a) {
              j.$loading = !1, h('ngTable: current scope', j.$scope), c.data = j.groupBy ? j.$scope.$groups = a : j.$scope.$data = a, j.$scope.pages = c.generatePagesArray(c.page(), c.total(), c.count()), j.$scope.$emit('ngTableAfterReloadData');
            });
          }, this.reloadPages = function () {
            var a = this;
            j.$scope.pages = a.generatePagesArray(a.page(), a.total(), a.count());
          };
          var i = this.$params = {
              page: 1,
              count: 1,
              filter: {},
              sorting: {},
              group: {},
              groupBy: null
            }, j = {
              $scope: null,
              $loading: !1,
              data: null,
              total: 0,
              defaultSort: 'desc',
              filterDelay: 750,
              counts: [
                10,
                25,
                50,
                100
              ],
              getGroups: this.getGroups,
              getData: this.getData
            };
          return this.settings(f), this.parameters(e, !0), this;
        };
      return e;
    }
  ]);
  var c = [
      '$scope',
      'ngTableParams',
      '$timeout',
      function (b, c, d) {
        b.$loading = !1, b.params || (b.params = new c()), b.params.settings().$scope = b;
        var e = function () {
            var a = 0;
            return function (b, c) {
              d.cancel(a), a = d(b, c);
            };
          }();
        b.$watch('params.$params', function (c, d) {
          b.params.settings().$scope = b, a.equals(c.filter, d.filter) ? b.params.reload() : e(function () {
            b.params.$params.page = 1, b.params.reload();
          }, b.params.settings().filterDelay);
        }, !0), b.sortBy = function (a, c) {
          var d = b.parse(a.sortable);
          if (d) {
            var e = b.params.settings().defaultSort, f = 'asc' === e ? 'desc' : 'asc', g = b.params.sorting() && b.params.sorting()[d] && b.params.sorting()[d] === e, h = c.ctrlKey || c.metaKey ? b.params.sorting() : {};
            h[d] = g ? f : e, b.params.parameters({ sorting: h });
          }
        };
      }
    ];
  return b.directive('ngTable', [
    '$compile',
    '$q',
    '$parse',
    function (b, d, e) {
      return {
        restrict: 'A',
        priority: 1001,
        scope: !0,
        controller: c,
        compile: function (c) {
          var d = [], f = 0, g = null, h = c.find('thead');
          return a.forEach(a.element(c.find('tr')), function (b) {
            b = a.element(b), b.hasClass('ng-table-group') || g || (g = b);
          }), g ? (a.forEach(g.find('td'), function (b) {
            var c = a.element(b);
            if (!c.attr('ignore-cell') || 'true' !== c.attr('ignore-cell')) {
              var g = function (a, b) {
                  return function (f) {
                    return e(c.attr('x-data-' + a) || c.attr('data-' + a) || c.attr(a))(f, { $columns: d }) || b;
                  };
                }, h = g('title', ' '), i = g('header', !1), j = g('filter', !1)(), k = !1, l = !1;
              j && j.$$name && (l = j.$$name, delete j.$$name), j && j.templateURL && (k = j.templateURL, delete j.templateURL), c.attr('data-title-text', h()), d.push({
                id: f++,
                title: h,
                sortable: g('sortable', !1),
                'class': c.attr('x-data-header-class') || c.attr('data-header-class') || c.attr('header-class'),
                filter: j,
                filterTemplateURL: k,
                filterName: l,
                headerTemplateURL: i,
                filterData: c.attr('filter-data') ? c.attr('filter-data') : null,
                show: c.attr('ng-show') ? function (a) {
                  return e(c.attr('ng-show'))(a);
                } : function () {
                  return !0;
                }
              });
            }
          }), function (c, f, g) {
            if (c.$loading = !1, c.$columns = d, c.$watch(g.ngTable, function (b) {
                a.isUndefined(b) || (c.paramsModel = e(g.ngTable), c.params = b);
              }, !0), c.parse = function (b) {
                return a.isDefined(b) ? b(c) : '';
              }, g.showFilter && c.$parent.$watch(g.showFilter, function (a) {
                c.show_filter = a;
              }), a.forEach(d, function (b) {
                var d;
                if (b.filterData) {
                  if (d = e(b.filterData)(c, { $column: b }), !a.isObject(d) || !a.isObject(d.promise))
                    throw new Error('Function ' + b.filterData + ' must be instance of $q.defer()');
                  return delete b.filterData, d.promise.then(function (c) {
                    a.isArray(c) || (c = []), c.unshift({
                      title: '-',
                      id: ''
                    }), b.data = c;
                  });
                }
              }), !f.hasClass('ng-table')) {
              c.templates = {
                header: g.templateHeader ? g.templateHeader : 'ng-table/header.html',
                pagination: g.templatePagination ? g.templatePagination : 'ng-table/pager.html'
              };
              var i = h.length > 0 ? h : a.element(document.createElement('thead')).attr('ng-include', 'templates.header'), j = a.element(document.createElement('div')).attr({
                  'ng-table-pagination': 'params',
                  'template-url': 'templates.pagination'
                });
              f.find('thead').remove(), f.addClass('ng-table').prepend(i).after(j), b(i)(c), b(j)(c);
            }
          }) : void 0;
        }
      };
    }
  ]), b.directive('ngTablePagination', [
    '$compile',
    function (b) {
      return {
        restrict: 'A',
        scope: {
          params: '=ngTablePagination',
          templateUrl: '='
        },
        replace: !1,
        link: function (c, d) {
          c.params.settings().$scope.$on('ngTableAfterReloadData', function () {
            c.pages = c.params.generatePagesArray(c.params.page(), c.params.total(), c.params.count());
          }, !0), c.$watch('templateUrl', function (e) {
            if (!a.isUndefined(e)) {
              var f = a.element(document.createElement('div'));
              f.attr({ 'ng-include': 'templateUrl' }), d.append(f), b(f)(c);
            }
          });
        }
      };
    }
  ]), a.module('ngTable').run([
    '$templateCache',
    function (a) {
      a.put('ng-table/filters/select-multiple.html', '<select ng-options="data.id as data.title for data in column.data" multiple ng-multiple="true" ng-model="params.filter()[name]" ng-show="filter==\'select-multiple\'" class="filter filter-select-multiple form-control" name="{{column.filterName}}"> </select>'), a.put('ng-table/filters/select.html', '<select ng-options="data.id as data.title for data in column.data" ng-model="params.filter()[name]" ng-show="filter==\'select\'" class="filter filter-select form-control" name="{{column.filterName}}"> </select>'), a.put('ng-table/filters/text.html', '<input type="text" name="{{column.filterName}}" ng-model="params.filter()[name]" ng-if="filter==\'text\'" class="input-filter form-control"/>'), a.put('ng-table/header.html', '<tr> <th ng-repeat="column in $columns" ng-class="{ \'sortable\': parse(column.sortable), \'sort-asc\': params.sorting()[parse(column.sortable)]==\'asc\', \'sort-desc\': params.sorting()[parse(column.sortable)]==\'desc\' }" ng-click="sortBy(column, $event)" ng-show="column.show(this)" ng-init="template=column.headerTemplateURL(this)" class="header {{column.class}}"> <div ng-if="!template" ng-show="!template" ng-bind="parse(column.title)"></div> <div ng-if="template" ng-show="template"><div ng-include="template"></div></div> </th> </tr> <tr ng-show="show_filter" class="ng-table-filters"> <th ng-repeat="column in $columns" ng-show="column.show(this)" class="filter"> <div ng-repeat="(name, filter) in column.filter"> <div ng-if="column.filterTemplateURL" ng-show="column.filterTemplateURL"> <div ng-include="column.filterTemplateURL"></div> </div> <div ng-if="!column.filterTemplateURL" ng-show="!column.filterTemplateURL"> <div ng-include="\'ng-table/filters/\' + filter + \'.html\'"></div> </div> </div> </th> </tr>'), a.put('ng-table/pager.html', '<div class="ng-cloak ng-table-pager"> <div ng-if="params.settings().counts.length" class="ng-table-counts btn-group pull-right"> <button ng-repeat="count in params.settings().counts" type="button" ng-class="{\'active\':params.count()==count}" ng-click="params.count(count)" class="btn btn-default"> <span ng-bind="count"></span> </button> </div> <ul class="pagination ng-table-pagination"> <li ng-class="{\'disabled\': !page.active}" ng-repeat="page in pages" ng-switch="page.type"> <a ng-switch-when="prev" ng-click="params.page(page.number)" href="">&laquo;</a> <a ng-switch-when="first" ng-click="params.page(page.number)" href=""><span ng-bind="page.number"></span></a> <a ng-switch-when="page" ng-click="params.page(page.number)" href=""><span ng-bind="page.number"></span></a> <a ng-switch-when="more" ng-click="params.page(page.number)" href="">&#8230;</a> <a ng-switch-when="last" ng-click="params.page(page.number)" href=""><span ng-bind="page.number"></span></a> <a ng-switch-when="next" ng-click="params.page(page.number)" href="">&raquo;</a> </li> </ul> </div> ');
    }
  ]), b;
});  //# sourceMappingURL=ng-table.map
/* Javascript plotting library for jQuery, version 0.8.3.

Copyright (c) 2007-2014 IOLA and Ole Laursen.
Licensed under the MIT license.

*/
// first an inline dependency, jquery.colorhelpers.js, we inline it here
// for convenience
/* Plugin for jQuery for working with colors.
 *
 * Version 1.1.
 *
 * Inspiration from jQuery color animation plugin by John Resig.
 *
 * Released under the MIT license by Ole Laursen, October 2009.
 *
 * Examples:
 *
 *   $.color.parse("#fff").scale('rgb', 0.25).add('a', -0.5).toString()
 *   var c = $.color.extract($("#mydiv"), 'background-color');
 *   console.log(c.r, c.g, c.b, c.a);
 *   $.color.make(100, 50, 25, 0.4).toString() // returns "rgba(100,50,25,0.4)"
 *
 * Note that .scale() and .add() return the same modified object
 * instead of making a new one.
 *
 * V. 1.1: Fix error handling so e.g. parsing an empty string does
 * produce a color rather than just crashing.
 */
(function ($) {
  $.color = {};
  $.color.make = function (r, g, b, a) {
    var o = {};
    o.r = r || 0;
    o.g = g || 0;
    o.b = b || 0;
    o.a = a != null ? a : 1;
    o.add = function (c, d) {
      for (var i = 0; i < c.length; ++i)
        o[c.charAt(i)] += d;
      return o.normalize();
    };
    o.scale = function (c, f) {
      for (var i = 0; i < c.length; ++i)
        o[c.charAt(i)] *= f;
      return o.normalize();
    };
    o.toString = function () {
      if (o.a >= 1) {
        return 'rgb(' + [
          o.r,
          o.g,
          o.b
        ].join(',') + ')';
      } else {
        return 'rgba(' + [
          o.r,
          o.g,
          o.b,
          o.a
        ].join(',') + ')';
      }
    };
    o.normalize = function () {
      function clamp(min, value, max) {
        return value < min ? min : value > max ? max : value;
      }
      o.r = clamp(0, parseInt(o.r), 255);
      o.g = clamp(0, parseInt(o.g), 255);
      o.b = clamp(0, parseInt(o.b), 255);
      o.a = clamp(0, o.a, 1);
      return o;
    };
    o.clone = function () {
      return $.color.make(o.r, o.b, o.g, o.a);
    };
    return o.normalize();
  };
  $.color.extract = function (elem, css) {
    var c;
    do {
      c = elem.css(css).toLowerCase();
      if (c != '' && c != 'transparent')
        break;
      elem = elem.parent();
    } while (elem.length && !$.nodeName(elem.get(0), 'body'));
    if (c == 'rgba(0, 0, 0, 0)')
      c = 'transparent';
    return $.color.parse(c);
  };
  $.color.parse = function (str) {
    var res, m = $.color.make;
    if (res = /rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/.exec(str))
      return m(parseInt(res[1], 10), parseInt(res[2], 10), parseInt(res[3], 10));
    if (res = /rgba\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]+(?:\.[0-9]+)?)\s*\)/.exec(str))
      return m(parseInt(res[1], 10), parseInt(res[2], 10), parseInt(res[3], 10), parseFloat(res[4]));
    if (res = /rgb\(\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*\)/.exec(str))
      return m(parseFloat(res[1]) * 2.55, parseFloat(res[2]) * 2.55, parseFloat(res[3]) * 2.55);
    if (res = /rgba\(\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\s*\)/.exec(str))
      return m(parseFloat(res[1]) * 2.55, parseFloat(res[2]) * 2.55, parseFloat(res[3]) * 2.55, parseFloat(res[4]));
    if (res = /#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/.exec(str))
      return m(parseInt(res[1], 16), parseInt(res[2], 16), parseInt(res[3], 16));
    if (res = /#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/.exec(str))
      return m(parseInt(res[1] + res[1], 16), parseInt(res[2] + res[2], 16), parseInt(res[3] + res[3], 16));
    var name = $.trim(str).toLowerCase();
    if (name == 'transparent')
      return m(255, 255, 255, 0);
    else {
      res = lookupColors[name] || [
        0,
        0,
        0
      ];
      return m(res[0], res[1], res[2]);
    }
  };
  var lookupColors = {
      aqua: [
        0,
        255,
        255
      ],
      azure: [
        240,
        255,
        255
      ],
      beige: [
        245,
        245,
        220
      ],
      black: [
        0,
        0,
        0
      ],
      blue: [
        0,
        0,
        255
      ],
      brown: [
        165,
        42,
        42
      ],
      cyan: [
        0,
        255,
        255
      ],
      darkblue: [
        0,
        0,
        139
      ],
      darkcyan: [
        0,
        139,
        139
      ],
      darkgrey: [
        169,
        169,
        169
      ],
      darkgreen: [
        0,
        100,
        0
      ],
      darkkhaki: [
        189,
        183,
        107
      ],
      darkmagenta: [
        139,
        0,
        139
      ],
      darkolivegreen: [
        85,
        107,
        47
      ],
      darkorange: [
        255,
        140,
        0
      ],
      darkorchid: [
        153,
        50,
        204
      ],
      darkred: [
        139,
        0,
        0
      ],
      darksalmon: [
        233,
        150,
        122
      ],
      darkviolet: [
        148,
        0,
        211
      ],
      fuchsia: [
        255,
        0,
        255
      ],
      gold: [
        255,
        215,
        0
      ],
      green: [
        0,
        128,
        0
      ],
      indigo: [
        75,
        0,
        130
      ],
      khaki: [
        240,
        230,
        140
      ],
      lightblue: [
        173,
        216,
        230
      ],
      lightcyan: [
        224,
        255,
        255
      ],
      lightgreen: [
        144,
        238,
        144
      ],
      lightgrey: [
        211,
        211,
        211
      ],
      lightpink: [
        255,
        182,
        193
      ],
      lightyellow: [
        255,
        255,
        224
      ],
      lime: [
        0,
        255,
        0
      ],
      magenta: [
        255,
        0,
        255
      ],
      maroon: [
        128,
        0,
        0
      ],
      navy: [
        0,
        0,
        128
      ],
      olive: [
        128,
        128,
        0
      ],
      orange: [
        255,
        165,
        0
      ],
      pink: [
        255,
        192,
        203
      ],
      purple: [
        128,
        0,
        128
      ],
      violet: [
        128,
        0,
        128
      ],
      red: [
        255,
        0,
        0
      ],
      silver: [
        192,
        192,
        192
      ],
      white: [
        255,
        255,
        255
      ],
      yellow: [
        255,
        255,
        0
      ]
    };
}(jQuery));
// the actual Flot code
(function ($) {
  // Cache the prototype hasOwnProperty for faster access
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  // A shim to provide 'detach' to jQuery versions prior to 1.4.  Using a DOM
  // operation produces the same effect as detach, i.e. removing the element
  // without touching its jQuery data.
  // Do not merge this into Flot 0.9, since it requires jQuery 1.4.4+.
  if (!$.fn.detach) {
    $.fn.detach = function () {
      return this.each(function () {
        if (this.parentNode) {
          this.parentNode.removeChild(this);
        }
      });
    };
  }
  ///////////////////////////////////////////////////////////////////////////
  // The Canvas object is a wrapper around an HTML5 <canvas> tag.
  //
  // @constructor
  // @param {string} cls List of classes to apply to the canvas.
  // @param {element} container Element onto which to append the canvas.
  //
  // Requiring a container is a little iffy, but unfortunately canvas
  // operations don't work unless the canvas is attached to the DOM.
  function Canvas(cls, container) {
    var element = container.children('.' + cls)[0];
    if (element == null) {
      element = document.createElement('canvas');
      element.className = cls;
      $(element).css({
        direction: 'ltr',
        position: 'absolute',
        left: 0,
        top: 0
      }).appendTo(container);
      // If HTML5 Canvas isn't available, fall back to [Ex|Flash]canvas
      if (!element.getContext) {
        if (window.G_vmlCanvasManager) {
          element = window.G_vmlCanvasManager.initElement(element);
        } else {
          throw new Error('Canvas is not available. If you\'re using IE with a fall-back such as Excanvas, then there\'s either a mistake in your conditional include, or the page has no DOCTYPE and is rendering in Quirks Mode.');
        }
      }
    }
    this.element = element;
    var context = this.context = element.getContext('2d');
    // Determine the screen's ratio of physical to device-independent
    // pixels.  This is the ratio between the canvas width that the browser
    // advertises and the number of pixels actually present in that space.
    // The iPhone 4, for example, has a device-independent width of 320px,
    // but its screen is actually 640px wide.  It therefore has a pixel
    // ratio of 2, while most normal devices have a ratio of 1.
    var devicePixelRatio = window.devicePixelRatio || 1, backingStoreRatio = context.webkitBackingStorePixelRatio || context.mozBackingStorePixelRatio || context.msBackingStorePixelRatio || context.oBackingStorePixelRatio || context.backingStorePixelRatio || 1;
    this.pixelRatio = devicePixelRatio / backingStoreRatio;
    // Size the canvas to match the internal dimensions of its container
    this.resize(container.width(), container.height());
    // Collection of HTML div layers for text overlaid onto the canvas
    this.textContainer = null;
    this.text = {};
    // Cache of text fragments and metrics, so we can avoid expensively
    // re-calculating them when the plot is re-rendered in a loop.
    this._textCache = {};
  }
  // Resizes the canvas to the given dimensions.
  //
  // @param {number} width New width of the canvas, in pixels.
  // @param {number} width New height of the canvas, in pixels.
  Canvas.prototype.resize = function (width, height) {
    if (width <= 0 || height <= 0) {
      throw new Error('Invalid dimensions for plot, width = ' + width + ', height = ' + height);
    }
    var element = this.element, context = this.context, pixelRatio = this.pixelRatio;
    // Resize the canvas, increasing its density based on the display's
    // pixel ratio; basically giving it more pixels without increasing the
    // size of its element, to take advantage of the fact that retina
    // displays have that many more pixels in the same advertised space.
    // Resizing should reset the state (excanvas seems to be buggy though)
    if (this.width != width) {
      element.width = width * pixelRatio;
      element.style.width = width + 'px';
      this.width = width;
    }
    if (this.height != height) {
      element.height = height * pixelRatio;
      element.style.height = height + 'px';
      this.height = height;
    }
    // Save the context, so we can reset in case we get replotted.  The
    // restore ensure that we're really back at the initial state, and
    // should be safe even if we haven't saved the initial state yet.
    context.restore();
    context.save();
    // Scale the coordinate space to match the display density; so even though we
    // may have twice as many pixels, we still want lines and other drawing to
    // appear at the same size; the extra pixels will just make them crisper.
    context.scale(pixelRatio, pixelRatio);
  };
  // Clears the entire canvas area, not including any overlaid HTML text
  Canvas.prototype.clear = function () {
    this.context.clearRect(0, 0, this.width, this.height);
  };
  // Finishes rendering the canvas, including managing the text overlay.
  Canvas.prototype.render = function () {
    var cache = this._textCache;
    // For each text layer, add elements marked as active that haven't
    // already been rendered, and remove those that are no longer active.
    for (var layerKey in cache) {
      if (hasOwnProperty.call(cache, layerKey)) {
        var layer = this.getTextLayer(layerKey), layerCache = cache[layerKey];
        layer.hide();
        for (var styleKey in layerCache) {
          if (hasOwnProperty.call(layerCache, styleKey)) {
            var styleCache = layerCache[styleKey];
            for (var key in styleCache) {
              if (hasOwnProperty.call(styleCache, key)) {
                var positions = styleCache[key].positions;
                for (var i = 0, position; position = positions[i]; i++) {
                  if (position.active) {
                    if (!position.rendered) {
                      layer.append(position.element);
                      position.rendered = true;
                    }
                  } else {
                    positions.splice(i--, 1);
                    if (position.rendered) {
                      position.element.detach();
                    }
                  }
                }
                if (positions.length == 0) {
                  delete styleCache[key];
                }
              }
            }
          }
        }
        layer.show();
      }
    }
  };
  // Creates (if necessary) and returns the text overlay container.
  //
  // @param {string} classes String of space-separated CSS classes used to
  //     uniquely identify the text layer.
  // @return {object} The jQuery-wrapped text-layer div.
  Canvas.prototype.getTextLayer = function (classes) {
    var layer = this.text[classes];
    // Create the text layer if it doesn't exist
    if (layer == null) {
      // Create the text layer container, if it doesn't exist
      if (this.textContainer == null) {
        this.textContainer = $('<div class=\'flot-text\'></div>').css({
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          'font-size': 'smaller',
          color: '#545454'
        }).insertAfter(this.element);
      }
      layer = this.text[classes] = $('<div></div>').addClass(classes).css({
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0
      }).appendTo(this.textContainer);
    }
    return layer;
  };
  // Creates (if necessary) and returns a text info object.
  //
  // The object looks like this:
  //
  // {
  //     width: Width of the text's wrapper div.
  //     height: Height of the text's wrapper div.
  //     element: The jQuery-wrapped HTML div containing the text.
  //     positions: Array of positions at which this text is drawn.
  // }
  //
  // The positions array contains objects that look like this:
  //
  // {
  //     active: Flag indicating whether the text should be visible.
  //     rendered: Flag indicating whether the text is currently visible.
  //     element: The jQuery-wrapped HTML div containing the text.
  //     x: X coordinate at which to draw the text.
  //     y: Y coordinate at which to draw the text.
  // }
  //
  // Each position after the first receives a clone of the original element.
  //
  // The idea is that that the width, height, and general 'identity' of the
  // text is constant no matter where it is placed; the placements are a
  // secondary property.
  //
  // Canvas maintains a cache of recently-used text info objects; getTextInfo
  // either returns the cached element or creates a new entry.
  //
  // @param {string} layer A string of space-separated CSS classes uniquely
  //     identifying the layer containing this text.
  // @param {string} text Text string to retrieve info for.
  // @param {(string|object)=} font Either a string of space-separated CSS
  //     classes or a font-spec object, defining the text's font and style.
  // @param {number=} angle Angle at which to rotate the text, in degrees.
  //     Angle is currently unused, it will be implemented in the future.
  // @param {number=} width Maximum width of the text before it wraps.
  // @return {object} a text info object.
  Canvas.prototype.getTextInfo = function (layer, text, font, angle, width) {
    var textStyle, layerCache, styleCache, info;
    // Cast the value to a string, in case we were given a number or such
    text = '' + text;
    // If the font is a font-spec object, generate a CSS font definition
    if (typeof font === 'object') {
      textStyle = font.style + ' ' + font.variant + ' ' + font.weight + ' ' + font.size + 'px/' + font.lineHeight + 'px ' + font.family;
    } else {
      textStyle = font;
    }
    // Retrieve (or create) the cache for the text's layer and styles
    layerCache = this._textCache[layer];
    if (layerCache == null) {
      layerCache = this._textCache[layer] = {};
    }
    styleCache = layerCache[textStyle];
    if (styleCache == null) {
      styleCache = layerCache[textStyle] = {};
    }
    info = styleCache[text];
    // If we can't find a matching element in our cache, create a new one
    if (info == null) {
      var element = $('<div></div>').html(text).css({
          position: 'absolute',
          'max-width': width,
          top: -9999
        }).appendTo(this.getTextLayer(layer));
      if (typeof font === 'object') {
        element.css({
          font: textStyle,
          color: font.color
        });
      } else if (typeof font === 'string') {
        element.addClass(font);
      }
      info = styleCache[text] = {
        width: element.outerWidth(true),
        height: element.outerHeight(true),
        element: element,
        positions: []
      };
      element.detach();
    }
    return info;
  };
  // Adds a text string to the canvas text overlay.
  //
  // The text isn't drawn immediately; it is marked as rendering, which will
  // result in its addition to the canvas on the next render pass.
  //
  // @param {string} layer A string of space-separated CSS classes uniquely
  //     identifying the layer containing this text.
  // @param {number} x X coordinate at which to draw the text.
  // @param {number} y Y coordinate at which to draw the text.
  // @param {string} text Text string to draw.
  // @param {(string|object)=} font Either a string of space-separated CSS
  //     classes or a font-spec object, defining the text's font and style.
  // @param {number=} angle Angle at which to rotate the text, in degrees.
  //     Angle is currently unused, it will be implemented in the future.
  // @param {number=} width Maximum width of the text before it wraps.
  // @param {string=} halign Horizontal alignment of the text; either "left",
  //     "center" or "right".
  // @param {string=} valign Vertical alignment of the text; either "top",
  //     "middle" or "bottom".
  Canvas.prototype.addText = function (layer, x, y, text, font, angle, width, halign, valign) {
    var info = this.getTextInfo(layer, text, font, angle, width), positions = info.positions;
    // Tweak the div's position to match the text's alignment
    if (halign == 'center') {
      x -= info.width / 2;
    } else if (halign == 'right') {
      x -= info.width;
    }
    if (valign == 'middle') {
      y -= info.height / 2;
    } else if (valign == 'bottom') {
      y -= info.height;
    }
    // Determine whether this text already exists at this position.
    // If so, mark it for inclusion in the next render pass.
    for (var i = 0, position; position = positions[i]; i++) {
      if (position.x == x && position.y == y) {
        position.active = true;
        return;
      }
    }
    // If the text doesn't exist at this position, create a new entry
    // For the very first position we'll re-use the original element,
    // while for subsequent ones we'll clone it.
    position = {
      active: true,
      rendered: false,
      element: positions.length ? info.element.clone() : info.element,
      x: x,
      y: y
    };
    positions.push(position);
    // Move the element to its final position within the container
    position.element.css({
      top: Math.round(y),
      left: Math.round(x),
      'text-align': halign
    });
  };
  // Removes one or more text strings from the canvas text overlay.
  //
  // If no parameters are given, all text within the layer is removed.
  //
  // Note that the text is not immediately removed; it is simply marked as
  // inactive, which will result in its removal on the next render pass.
  // This avoids the performance penalty for 'clear and redraw' behavior,
  // where we potentially get rid of all text on a layer, but will likely
  // add back most or all of it later, as when redrawing axes, for example.
  //
  // @param {string} layer A string of space-separated CSS classes uniquely
  //     identifying the layer containing this text.
  // @param {number=} x X coordinate of the text.
  // @param {number=} y Y coordinate of the text.
  // @param {string=} text Text string to remove.
  // @param {(string|object)=} font Either a string of space-separated CSS
  //     classes or a font-spec object, defining the text's font and style.
  // @param {number=} angle Angle at which the text is rotated, in degrees.
  //     Angle is currently unused, it will be implemented in the future.
  Canvas.prototype.removeText = function (layer, x, y, text, font, angle) {
    if (text == null) {
      var layerCache = this._textCache[layer];
      if (layerCache != null) {
        for (var styleKey in layerCache) {
          if (hasOwnProperty.call(layerCache, styleKey)) {
            var styleCache = layerCache[styleKey];
            for (var key in styleCache) {
              if (hasOwnProperty.call(styleCache, key)) {
                var positions = styleCache[key].positions;
                for (var i = 0, position; position = positions[i]; i++) {
                  position.active = false;
                }
              }
            }
          }
        }
      }
    } else {
      var positions = this.getTextInfo(layer, text, font, angle).positions;
      for (var i = 0, position; position = positions[i]; i++) {
        if (position.x == x && position.y == y) {
          position.active = false;
        }
      }
    }
  };
  ///////////////////////////////////////////////////////////////////////////
  // The top-level container for the entire plot.
  function Plot(placeholder, data_, options_, plugins) {
    // data is on the form:
    //   [ series1, series2 ... ]
    // where series is either just the data as [ [x1, y1], [x2, y2], ... ]
    // or { data: [ [x1, y1], [x2, y2], ... ], label: "some label", ... }
    var series = [], options = {
        colors: [
          '#edc240',
          '#afd8f8',
          '#cb4b4b',
          '#4da74d',
          '#9440ed'
        ],
        legend: {
          show: true,
          noColumns: 1,
          labelFormatter: null,
          labelBoxBorderColor: '#ccc',
          container: null,
          position: 'ne',
          margin: 5,
          backgroundColor: null,
          backgroundOpacity: 0.85,
          sorted: null
        },
        xaxis: {
          show: null,
          position: 'bottom',
          mode: null,
          font: null,
          color: null,
          tickColor: null,
          transform: null,
          inverseTransform: null,
          min: null,
          max: null,
          autoscaleMargin: null,
          ticks: null,
          tickFormatter: null,
          labelWidth: null,
          labelHeight: null,
          reserveSpace: null,
          tickLength: null,
          alignTicksWithAxis: null,
          tickDecimals: null,
          tickSize: null,
          minTickSize: null
        },
        yaxis: {
          autoscaleMargin: 0.02,
          position: 'left'
        },
        xaxes: [],
        yaxes: [],
        series: {
          points: {
            show: false,
            radius: 3,
            lineWidth: 2,
            fill: true,
            fillColor: '#ffffff',
            symbol: 'circle'
          },
          lines: {
            lineWidth: 2,
            fill: false,
            fillColor: null,
            steps: false
          },
          bars: {
            show: false,
            lineWidth: 2,
            barWidth: 1,
            fill: true,
            fillColor: null,
            align: 'left',
            horizontal: false,
            zero: true
          },
          shadowSize: 3,
          highlightColor: null
        },
        grid: {
          show: true,
          aboveData: false,
          color: '#545454',
          backgroundColor: null,
          borderColor: null,
          tickColor: null,
          margin: 0,
          labelMargin: 5,
          axisMargin: 8,
          borderWidth: 2,
          minBorderMargin: null,
          markings: null,
          markingsColor: '#f4f4f4',
          markingsLineWidth: 2,
          clickable: false,
          hoverable: false,
          autoHighlight: true,
          mouseActiveRadius: 10
        },
        interaction: { redrawOverlayInterval: 1000 / 60 },
        hooks: {}
      }, surface = null,
      // the canvas for the plot itself
      overlay = null,
      // canvas for interactive stuff on top of plot
      eventHolder = null,
      // jQuery object that events should be bound to
      ctx = null, octx = null, xaxes = [], yaxes = [], plotOffset = {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
      }, plotWidth = 0, plotHeight = 0, hooks = {
        processOptions: [],
        processRawData: [],
        processDatapoints: [],
        processOffset: [],
        drawBackground: [],
        drawSeries: [],
        draw: [],
        bindEvents: [],
        drawOverlay: [],
        shutdown: []
      }, plot = this;
    // public functions
    plot.setData = setData;
    plot.setupGrid = setupGrid;
    plot.draw = draw;
    plot.getPlaceholder = function () {
      return placeholder;
    };
    plot.getCanvas = function () {
      return surface.element;
    };
    plot.getPlotOffset = function () {
      return plotOffset;
    };
    plot.width = function () {
      return plotWidth;
    };
    plot.height = function () {
      return plotHeight;
    };
    plot.offset = function () {
      var o = eventHolder.offset();
      o.left += plotOffset.left;
      o.top += plotOffset.top;
      return o;
    };
    plot.getData = function () {
      return series;
    };
    plot.getAxes = function () {
      var res = {}, i;
      $.each(xaxes.concat(yaxes), function (_, axis) {
        if (axis)
          res[axis.direction + (axis.n != 1 ? axis.n : '') + 'axis'] = axis;
      });
      return res;
    };
    plot.getXAxes = function () {
      return xaxes;
    };
    plot.getYAxes = function () {
      return yaxes;
    };
    plot.c2p = canvasToAxisCoords;
    plot.p2c = axisToCanvasCoords;
    plot.getOptions = function () {
      return options;
    };
    plot.highlight = highlight;
    plot.unhighlight = unhighlight;
    plot.triggerRedrawOverlay = triggerRedrawOverlay;
    plot.pointOffset = function (point) {
      return {
        left: parseInt(xaxes[axisNumber(point, 'x') - 1].p2c(+point.x) + plotOffset.left, 10),
        top: parseInt(yaxes[axisNumber(point, 'y') - 1].p2c(+point.y) + plotOffset.top, 10)
      };
    };
    plot.shutdown = shutdown;
    plot.destroy = function () {
      shutdown();
      placeholder.removeData('plot').empty();
      series = [];
      options = null;
      surface = null;
      overlay = null;
      eventHolder = null;
      ctx = null;
      octx = null;
      xaxes = [];
      yaxes = [];
      hooks = null;
      highlights = [];
      plot = null;
    };
    plot.resize = function () {
      var width = placeholder.width(), height = placeholder.height();
      surface.resize(width, height);
      overlay.resize(width, height);
    };
    // public attributes
    plot.hooks = hooks;
    // initialize
    initPlugins(plot);
    parseOptions(options_);
    setupCanvases();
    setData(data_);
    setupGrid();
    draw();
    bindEvents();
    function executeHooks(hook, args) {
      args = [plot].concat(args);
      for (var i = 0; i < hook.length; ++i)
        hook[i].apply(this, args);
    }
    function initPlugins() {
      // References to key classes, allowing plugins to modify them
      var classes = { Canvas: Canvas };
      for (var i = 0; i < plugins.length; ++i) {
        var p = plugins[i];
        p.init(plot, classes);
        if (p.options)
          $.extend(true, options, p.options);
      }
    }
    function parseOptions(opts) {
      $.extend(true, options, opts);
      // $.extend merges arrays, rather than replacing them.  When less
      // colors are provided than the size of the default palette, we
      // end up with those colors plus the remaining defaults, which is
      // not expected behavior; avoid it by replacing them here.
      if (opts && opts.colors) {
        options.colors = opts.colors;
      }
      if (options.xaxis.color == null)
        options.xaxis.color = $.color.parse(options.grid.color).scale('a', 0.22).toString();
      if (options.yaxis.color == null)
        options.yaxis.color = $.color.parse(options.grid.color).scale('a', 0.22).toString();
      if (options.xaxis.tickColor == null)
        // grid.tickColor for back-compatibility
        options.xaxis.tickColor = options.grid.tickColor || options.xaxis.color;
      if (options.yaxis.tickColor == null)
        // grid.tickColor for back-compatibility
        options.yaxis.tickColor = options.grid.tickColor || options.yaxis.color;
      if (options.grid.borderColor == null)
        options.grid.borderColor = options.grid.color;
      if (options.grid.tickColor == null)
        options.grid.tickColor = $.color.parse(options.grid.color).scale('a', 0.22).toString();
      // Fill in defaults for axis options, including any unspecified
      // font-spec fields, if a font-spec was provided.
      // If no x/y axis options were provided, create one of each anyway,
      // since the rest of the code assumes that they exist.
      var i, axisOptions, axisCount, fontSize = placeholder.css('font-size'), fontSizeDefault = fontSize ? +fontSize.replace('px', '') : 13, fontDefaults = {
          style: placeholder.css('font-style'),
          size: Math.round(0.8 * fontSizeDefault),
          variant: placeholder.css('font-variant'),
          weight: placeholder.css('font-weight'),
          family: placeholder.css('font-family')
        };
      axisCount = options.xaxes.length || 1;
      for (i = 0; i < axisCount; ++i) {
        axisOptions = options.xaxes[i];
        if (axisOptions && !axisOptions.tickColor) {
          axisOptions.tickColor = axisOptions.color;
        }
        axisOptions = $.extend(true, {}, options.xaxis, axisOptions);
        options.xaxes[i] = axisOptions;
        if (axisOptions.font) {
          axisOptions.font = $.extend({}, fontDefaults, axisOptions.font);
          if (!axisOptions.font.color) {
            axisOptions.font.color = axisOptions.color;
          }
          if (!axisOptions.font.lineHeight) {
            axisOptions.font.lineHeight = Math.round(axisOptions.font.size * 1.15);
          }
        }
      }
      axisCount = options.yaxes.length || 1;
      for (i = 0; i < axisCount; ++i) {
        axisOptions = options.yaxes[i];
        if (axisOptions && !axisOptions.tickColor) {
          axisOptions.tickColor = axisOptions.color;
        }
        axisOptions = $.extend(true, {}, options.yaxis, axisOptions);
        options.yaxes[i] = axisOptions;
        if (axisOptions.font) {
          axisOptions.font = $.extend({}, fontDefaults, axisOptions.font);
          if (!axisOptions.font.color) {
            axisOptions.font.color = axisOptions.color;
          }
          if (!axisOptions.font.lineHeight) {
            axisOptions.font.lineHeight = Math.round(axisOptions.font.size * 1.15);
          }
        }
      }
      // backwards compatibility, to be removed in future
      if (options.xaxis.noTicks && options.xaxis.ticks == null)
        options.xaxis.ticks = options.xaxis.noTicks;
      if (options.yaxis.noTicks && options.yaxis.ticks == null)
        options.yaxis.ticks = options.yaxis.noTicks;
      if (options.x2axis) {
        options.xaxes[1] = $.extend(true, {}, options.xaxis, options.x2axis);
        options.xaxes[1].position = 'top';
        // Override the inherit to allow the axis to auto-scale
        if (options.x2axis.min == null) {
          options.xaxes[1].min = null;
        }
        if (options.x2axis.max == null) {
          options.xaxes[1].max = null;
        }
      }
      if (options.y2axis) {
        options.yaxes[1] = $.extend(true, {}, options.yaxis, options.y2axis);
        options.yaxes[1].position = 'right';
        // Override the inherit to allow the axis to auto-scale
        if (options.y2axis.min == null) {
          options.yaxes[1].min = null;
        }
        if (options.y2axis.max == null) {
          options.yaxes[1].max = null;
        }
      }
      if (options.grid.coloredAreas)
        options.grid.markings = options.grid.coloredAreas;
      if (options.grid.coloredAreasColor)
        options.grid.markingsColor = options.grid.coloredAreasColor;
      if (options.lines)
        $.extend(true, options.series.lines, options.lines);
      if (options.points)
        $.extend(true, options.series.points, options.points);
      if (options.bars)
        $.extend(true, options.series.bars, options.bars);
      if (options.shadowSize != null)
        options.series.shadowSize = options.shadowSize;
      if (options.highlightColor != null)
        options.series.highlightColor = options.highlightColor;
      // save options on axes for future reference
      for (i = 0; i < options.xaxes.length; ++i)
        getOrCreateAxis(xaxes, i + 1).options = options.xaxes[i];
      for (i = 0; i < options.yaxes.length; ++i)
        getOrCreateAxis(yaxes, i + 1).options = options.yaxes[i];
      // add hooks from options
      for (var n in hooks)
        if (options.hooks[n] && options.hooks[n].length)
          hooks[n] = hooks[n].concat(options.hooks[n]);
      executeHooks(hooks.processOptions, [options]);
    }
    function setData(d) {
      series = parseData(d);
      fillInSeriesOptions();
      processData();
    }
    function parseData(d) {
      var res = [];
      for (var i = 0; i < d.length; ++i) {
        var s = $.extend(true, {}, options.series);
        if (d[i].data != null) {
          s.data = d[i].data;
          // move the data instead of deep-copy
          delete d[i].data;
          $.extend(true, s, d[i]);
          d[i].data = s.data;
        } else
          s.data = d[i];
        res.push(s);
      }
      return res;
    }
    function axisNumber(obj, coord) {
      var a = obj[coord + 'axis'];
      if (typeof a == 'object')
        // if we got a real axis, extract number
        a = a.n;
      if (typeof a != 'number')
        a = 1;
      // default to first axis
      return a;
    }
    function allAxes() {
      // return flat array without annoying null entries
      return $.grep(xaxes.concat(yaxes), function (a) {
        return a;
      });
    }
    function canvasToAxisCoords(pos) {
      // return an object with x/y corresponding to all used axes
      var res = {}, i, axis;
      for (i = 0; i < xaxes.length; ++i) {
        axis = xaxes[i];
        if (axis && axis.used)
          res['x' + axis.n] = axis.c2p(pos.left);
      }
      for (i = 0; i < yaxes.length; ++i) {
        axis = yaxes[i];
        if (axis && axis.used)
          res['y' + axis.n] = axis.c2p(pos.top);
      }
      if (res.x1 !== undefined)
        res.x = res.x1;
      if (res.y1 !== undefined)
        res.y = res.y1;
      return res;
    }
    function axisToCanvasCoords(pos) {
      // get canvas coords from the first pair of x/y found in pos
      var res = {}, i, axis, key;
      for (i = 0; i < xaxes.length; ++i) {
        axis = xaxes[i];
        if (axis && axis.used) {
          key = 'x' + axis.n;
          if (pos[key] == null && axis.n == 1)
            key = 'x';
          if (pos[key] != null) {
            res.left = axis.p2c(pos[key]);
            break;
          }
        }
      }
      for (i = 0; i < yaxes.length; ++i) {
        axis = yaxes[i];
        if (axis && axis.used) {
          key = 'y' + axis.n;
          if (pos[key] == null && axis.n == 1)
            key = 'y';
          if (pos[key] != null) {
            res.top = axis.p2c(pos[key]);
            break;
          }
        }
      }
      return res;
    }
    function getOrCreateAxis(axes, number) {
      if (!axes[number - 1])
        axes[number - 1] = {
          n: number,
          direction: axes == xaxes ? 'x' : 'y',
          options: $.extend(true, {}, axes == xaxes ? options.xaxis : options.yaxis)
        };
      return axes[number - 1];
    }
    function fillInSeriesOptions() {
      var neededColors = series.length, maxIndex = -1, i;
      // Subtract the number of series that already have fixed colors or
      // color indexes from the number that we still need to generate.
      for (i = 0; i < series.length; ++i) {
        var sc = series[i].color;
        if (sc != null) {
          neededColors--;
          if (typeof sc == 'number' && sc > maxIndex) {
            maxIndex = sc;
          }
        }
      }
      // If any of the series have fixed color indexes, then we need to
      // generate at least as many colors as the highest index.
      if (neededColors <= maxIndex) {
        neededColors = maxIndex + 1;
      }
      // Generate all the colors, using first the option colors and then
      // variations on those colors once they're exhausted.
      var c, colors = [], colorPool = options.colors, colorPoolSize = colorPool.length, variation = 0;
      for (i = 0; i < neededColors; i++) {
        c = $.color.parse(colorPool[i % colorPoolSize] || '#666');
        // Each time we exhaust the colors in the pool we adjust
        // a scaling factor used to produce more variations on
        // those colors. The factor alternates negative/positive
        // to produce lighter/darker colors.
        // Reset the variation after every few cycles, or else
        // it will end up producing only white or black colors.
        if (i % colorPoolSize == 0 && i) {
          if (variation >= 0) {
            if (variation < 0.5) {
              variation = -variation - 0.2;
            } else
              variation = 0;
          } else
            variation = -variation;
        }
        colors[i] = c.scale('rgb', 1 + variation);
      }
      // Finalize the series options, filling in their colors
      var colori = 0, s;
      for (i = 0; i < series.length; ++i) {
        s = series[i];
        // assign colors
        if (s.color == null) {
          s.color = colors[colori].toString();
          ++colori;
        } else if (typeof s.color == 'number')
          s.color = colors[s.color].toString();
        // turn on lines automatically in case nothing is set
        if (s.lines.show == null) {
          var v, show = true;
          for (v in s)
            if (s[v] && s[v].show) {
              show = false;
              break;
            }
          if (show)
            s.lines.show = true;
        }
        // If nothing was provided for lines.zero, default it to match
        // lines.fill, since areas by default should extend to zero.
        if (s.lines.zero == null) {
          s.lines.zero = !!s.lines.fill;
        }
        // setup axes
        s.xaxis = getOrCreateAxis(xaxes, axisNumber(s, 'x'));
        s.yaxis = getOrCreateAxis(yaxes, axisNumber(s, 'y'));
      }
    }
    function processData() {
      var topSentry = Number.POSITIVE_INFINITY, bottomSentry = Number.NEGATIVE_INFINITY, fakeInfinity = Number.MAX_VALUE, i, j, k, m, length, s, points, ps, x, y, axis, val, f, p, data, format;
      function updateAxis(axis, min, max) {
        if (min < axis.datamin && min != -fakeInfinity)
          axis.datamin = min;
        if (max > axis.datamax && max != fakeInfinity)
          axis.datamax = max;
      }
      $.each(allAxes(), function (_, axis) {
        // init axis
        axis.datamin = topSentry;
        axis.datamax = bottomSentry;
        axis.used = false;
      });
      for (i = 0; i < series.length; ++i) {
        s = series[i];
        s.datapoints = { points: [] };
        executeHooks(hooks.processRawData, [
          s,
          s.data,
          s.datapoints
        ]);
      }
      // first pass: clean and copy data
      for (i = 0; i < series.length; ++i) {
        s = series[i];
        data = s.data;
        format = s.datapoints.format;
        if (!format) {
          format = [];
          // find out how to copy
          format.push({
            x: true,
            number: true,
            required: true
          });
          format.push({
            y: true,
            number: true,
            required: true
          });
          if (s.bars.show || s.lines.show && s.lines.fill) {
            var autoscale = !!(s.bars.show && s.bars.zero || s.lines.show && s.lines.zero);
            format.push({
              y: true,
              number: true,
              required: false,
              defaultValue: 0,
              autoscale: autoscale
            });
            if (s.bars.horizontal) {
              delete format[format.length - 1].y;
              format[format.length - 1].x = true;
            }
          }
          s.datapoints.format = format;
        }
        if (s.datapoints.pointsize != null)
          continue;
        // already filled in
        s.datapoints.pointsize = format.length;
        ps = s.datapoints.pointsize;
        points = s.datapoints.points;
        var insertSteps = s.lines.show && s.lines.steps;
        s.xaxis.used = s.yaxis.used = true;
        for (j = k = 0; j < data.length; ++j, k += ps) {
          p = data[j];
          var nullify = p == null;
          if (!nullify) {
            for (m = 0; m < ps; ++m) {
              val = p[m];
              f = format[m];
              if (f) {
                if (f.number && val != null) {
                  val = +val;
                  // convert to number
                  if (isNaN(val))
                    val = null;
                  else if (val == Infinity)
                    val = fakeInfinity;
                  else if (val == -Infinity)
                    val = -fakeInfinity;
                }
                if (val == null) {
                  if (f.required)
                    nullify = true;
                  if (f.defaultValue != null)
                    val = f.defaultValue;
                }
              }
              points[k + m] = val;
            }
          }
          if (nullify) {
            for (m = 0; m < ps; ++m) {
              val = points[k + m];
              if (val != null) {
                f = format[m];
                // extract min/max info
                if (f.autoscale !== false) {
                  if (f.x) {
                    updateAxis(s.xaxis, val, val);
                  }
                  if (f.y) {
                    updateAxis(s.yaxis, val, val);
                  }
                }
              }
              points[k + m] = null;
            }
          } else {
            // a little bit of line specific stuff that
            // perhaps shouldn't be here, but lacking
            // better means...
            if (insertSteps && k > 0 && points[k - ps] != null && points[k - ps] != points[k] && points[k - ps + 1] != points[k + 1]) {
              // copy the point to make room for a middle point
              for (m = 0; m < ps; ++m)
                points[k + ps + m] = points[k + m];
              // middle point has same y
              points[k + 1] = points[k - ps + 1];
              // we've added a point, better reflect that
              k += ps;
            }
          }
        }
      }
      // give the hooks a chance to run
      for (i = 0; i < series.length; ++i) {
        s = series[i];
        executeHooks(hooks.processDatapoints, [
          s,
          s.datapoints
        ]);
      }
      // second pass: find datamax/datamin for auto-scaling
      for (i = 0; i < series.length; ++i) {
        s = series[i];
        points = s.datapoints.points;
        ps = s.datapoints.pointsize;
        format = s.datapoints.format;
        var xmin = topSentry, ymin = topSentry, xmax = bottomSentry, ymax = bottomSentry;
        for (j = 0; j < points.length; j += ps) {
          if (points[j] == null)
            continue;
          for (m = 0; m < ps; ++m) {
            val = points[j + m];
            f = format[m];
            if (!f || f.autoscale === false || val == fakeInfinity || val == -fakeInfinity)
              continue;
            if (f.x) {
              if (val < xmin)
                xmin = val;
              if (val > xmax)
                xmax = val;
            }
            if (f.y) {
              if (val < ymin)
                ymin = val;
              if (val > ymax)
                ymax = val;
            }
          }
        }
        if (s.bars.show) {
          // make sure we got room for the bar on the dancing floor
          var delta;
          switch (s.bars.align) {
          case 'left':
            delta = 0;
            break;
          case 'right':
            delta = -s.bars.barWidth;
            break;
          default:
            delta = -s.bars.barWidth / 2;
          }
          if (s.bars.horizontal) {
            ymin += delta;
            ymax += delta + s.bars.barWidth;
          } else {
            xmin += delta;
            xmax += delta + s.bars.barWidth;
          }
        }
        updateAxis(s.xaxis, xmin, xmax);
        updateAxis(s.yaxis, ymin, ymax);
      }
      $.each(allAxes(), function (_, axis) {
        if (axis.datamin == topSentry)
          axis.datamin = null;
        if (axis.datamax == bottomSentry)
          axis.datamax = null;
      });
    }
    function setupCanvases() {
      // Make sure the placeholder is clear of everything except canvases
      // from a previous plot in this container that we'll try to re-use.
      placeholder.css('padding', 0).children().filter(function () {
        return !$(this).hasClass('flot-overlay') && !$(this).hasClass('flot-base');
      }).remove();
      if (placeholder.css('position') == 'static')
        placeholder.css('position', 'relative');
      // for positioning labels and overlay
      surface = new Canvas('flot-base', placeholder);
      overlay = new Canvas('flot-overlay', placeholder);
      // overlay canvas for interactive features
      ctx = surface.context;
      octx = overlay.context;
      // define which element we're listening for events on
      eventHolder = $(overlay.element).unbind();
      // If we're re-using a plot object, shut down the old one
      var existing = placeholder.data('plot');
      if (existing) {
        existing.shutdown();
        overlay.clear();
      }
      // save in case we get replotted
      placeholder.data('plot', plot);
    }
    function bindEvents() {
      // bind events
      if (options.grid.hoverable) {
        eventHolder.mousemove(onMouseMove);
        // Use bind, rather than .mouseleave, because we officially
        // still support jQuery 1.2.6, which doesn't define a shortcut
        // for mouseenter or mouseleave.  This was a bug/oversight that
        // was fixed somewhere around 1.3.x.  We can return to using
        // .mouseleave when we drop support for 1.2.6.
        eventHolder.bind('mouseleave', onMouseLeave);
      }
      if (options.grid.clickable)
        eventHolder.click(onClick);
      executeHooks(hooks.bindEvents, [eventHolder]);
    }
    function shutdown() {
      if (redrawTimeout)
        clearTimeout(redrawTimeout);
      eventHolder.unbind('mousemove', onMouseMove);
      eventHolder.unbind('mouseleave', onMouseLeave);
      eventHolder.unbind('click', onClick);
      executeHooks(hooks.shutdown, [eventHolder]);
    }
    function setTransformationHelpers(axis) {
      // set helper functions on the axis, assumes plot area
      // has been computed already
      function identity(x) {
        return x;
      }
      var s, m, t = axis.options.transform || identity, it = axis.options.inverseTransform;
      // precompute how much the axis is scaling a point
      // in canvas space
      if (axis.direction == 'x') {
        s = axis.scale = plotWidth / Math.abs(t(axis.max) - t(axis.min));
        m = Math.min(t(axis.max), t(axis.min));
      } else {
        s = axis.scale = plotHeight / Math.abs(t(axis.max) - t(axis.min));
        s = -s;
        m = Math.max(t(axis.max), t(axis.min));
      }
      // data point to canvas coordinate
      if (t == identity)
        // slight optimization
        axis.p2c = function (p) {
          return (p - m) * s;
        };
      else
        axis.p2c = function (p) {
          return (t(p) - m) * s;
        };
      // canvas coordinate to data point
      if (!it)
        axis.c2p = function (c) {
          return m + c / s;
        };
      else
        axis.c2p = function (c) {
          return it(m + c / s);
        };
    }
    function measureTickLabels(axis) {
      var opts = axis.options, ticks = axis.ticks || [], labelWidth = opts.labelWidth || 0, labelHeight = opts.labelHeight || 0, maxWidth = labelWidth || (axis.direction == 'x' ? Math.floor(surface.width / (ticks.length || 1)) : null), legacyStyles = axis.direction + 'Axis ' + axis.direction + axis.n + 'Axis', layer = 'flot-' + axis.direction + '-axis flot-' + axis.direction + axis.n + '-axis ' + legacyStyles, font = opts.font || 'flot-tick-label tickLabel';
      for (var i = 0; i < ticks.length; ++i) {
        var t = ticks[i];
        if (!t.label)
          continue;
        var info = surface.getTextInfo(layer, t.label, font, null, maxWidth);
        labelWidth = Math.max(labelWidth, info.width);
        labelHeight = Math.max(labelHeight, info.height);
      }
      axis.labelWidth = opts.labelWidth || labelWidth;
      axis.labelHeight = opts.labelHeight || labelHeight;
    }
    function allocateAxisBoxFirstPhase(axis) {
      // find the bounding box of the axis by looking at label
      // widths/heights and ticks, make room by diminishing the
      // plotOffset; this first phase only looks at one
      // dimension per axis, the other dimension depends on the
      // other axes so will have to wait
      var lw = axis.labelWidth, lh = axis.labelHeight, pos = axis.options.position, isXAxis = axis.direction === 'x', tickLength = axis.options.tickLength, axisMargin = options.grid.axisMargin, padding = options.grid.labelMargin, innermost = true, outermost = true, first = true, found = false;
      // Determine the axis's position in its direction and on its side
      $.each(isXAxis ? xaxes : yaxes, function (i, a) {
        if (a && (a.show || a.reserveSpace)) {
          if (a === axis) {
            found = true;
          } else if (a.options.position === pos) {
            if (found) {
              outermost = false;
            } else {
              innermost = false;
            }
          }
          if (!found) {
            first = false;
          }
        }
      });
      // The outermost axis on each side has no margin
      if (outermost) {
        axisMargin = 0;
      }
      // The ticks for the first axis in each direction stretch across
      if (tickLength == null) {
        tickLength = first ? 'full' : 5;
      }
      if (!isNaN(+tickLength))
        padding += +tickLength;
      if (isXAxis) {
        lh += padding;
        if (pos == 'bottom') {
          plotOffset.bottom += lh + axisMargin;
          axis.box = {
            top: surface.height - plotOffset.bottom,
            height: lh
          };
        } else {
          axis.box = {
            top: plotOffset.top + axisMargin,
            height: lh
          };
          plotOffset.top += lh + axisMargin;
        }
      } else {
        lw += padding;
        if (pos == 'left') {
          axis.box = {
            left: plotOffset.left + axisMargin,
            width: lw
          };
          plotOffset.left += lw + axisMargin;
        } else {
          plotOffset.right += lw + axisMargin;
          axis.box = {
            left: surface.width - plotOffset.right,
            width: lw
          };
        }
      }
      // save for future reference
      axis.position = pos;
      axis.tickLength = tickLength;
      axis.box.padding = padding;
      axis.innermost = innermost;
    }
    function allocateAxisBoxSecondPhase(axis) {
      // now that all axis boxes have been placed in one
      // dimension, we can set the remaining dimension coordinates
      if (axis.direction == 'x') {
        axis.box.left = plotOffset.left - axis.labelWidth / 2;
        axis.box.width = surface.width - plotOffset.left - plotOffset.right + axis.labelWidth;
      } else {
        axis.box.top = plotOffset.top - axis.labelHeight / 2;
        axis.box.height = surface.height - plotOffset.bottom - plotOffset.top + axis.labelHeight;
      }
    }
    function adjustLayoutForThingsStickingOut() {
      // possibly adjust plot offset to ensure everything stays
      // inside the canvas and isn't clipped off
      var minMargin = options.grid.minBorderMargin, axis, i;
      // check stuff from the plot (FIXME: this should just read
      // a value from the series, otherwise it's impossible to
      // customize)
      if (minMargin == null) {
        minMargin = 0;
        for (i = 0; i < series.length; ++i)
          minMargin = Math.max(minMargin, 2 * (series[i].points.radius + series[i].points.lineWidth / 2));
      }
      var margins = {
          left: minMargin,
          right: minMargin,
          top: minMargin,
          bottom: minMargin
        };
      // check axis labels, note we don't check the actual
      // labels but instead use the overall width/height to not
      // jump as much around with replots
      $.each(allAxes(), function (_, axis) {
        if (axis.reserveSpace && axis.ticks && axis.ticks.length) {
          if (axis.direction === 'x') {
            margins.left = Math.max(margins.left, axis.labelWidth / 2);
            margins.right = Math.max(margins.right, axis.labelWidth / 2);
          } else {
            margins.bottom = Math.max(margins.bottom, axis.labelHeight / 2);
            margins.top = Math.max(margins.top, axis.labelHeight / 2);
          }
        }
      });
      plotOffset.left = Math.ceil(Math.max(margins.left, plotOffset.left));
      plotOffset.right = Math.ceil(Math.max(margins.right, plotOffset.right));
      plotOffset.top = Math.ceil(Math.max(margins.top, plotOffset.top));
      plotOffset.bottom = Math.ceil(Math.max(margins.bottom, plotOffset.bottom));
    }
    function setupGrid() {
      var i, axes = allAxes(), showGrid = options.grid.show;
      // Initialize the plot's offset from the edge of the canvas
      for (var a in plotOffset) {
        var margin = options.grid.margin || 0;
        plotOffset[a] = typeof margin == 'number' ? margin : margin[a] || 0;
      }
      executeHooks(hooks.processOffset, [plotOffset]);
      // If the grid is visible, add its border width to the offset
      for (var a in plotOffset) {
        if (typeof options.grid.borderWidth == 'object') {
          plotOffset[a] += showGrid ? options.grid.borderWidth[a] : 0;
        } else {
          plotOffset[a] += showGrid ? options.grid.borderWidth : 0;
        }
      }
      $.each(axes, function (_, axis) {
        var axisOpts = axis.options;
        axis.show = axisOpts.show == null ? axis.used : axisOpts.show;
        axis.reserveSpace = axisOpts.reserveSpace == null ? axis.show : axisOpts.reserveSpace;
        setRange(axis);
      });
      if (showGrid) {
        var allocatedAxes = $.grep(axes, function (axis) {
            return axis.show || axis.reserveSpace;
          });
        $.each(allocatedAxes, function (_, axis) {
          // make the ticks
          setupTickGeneration(axis);
          setTicks(axis);
          snapRangeToTicks(axis, axis.ticks);
          // find labelWidth/Height for axis
          measureTickLabels(axis);
        });
        // with all dimensions calculated, we can compute the
        // axis bounding boxes, start from the outside
        // (reverse order)
        for (i = allocatedAxes.length - 1; i >= 0; --i)
          allocateAxisBoxFirstPhase(allocatedAxes[i]);
        // make sure we've got enough space for things that
        // might stick out
        adjustLayoutForThingsStickingOut();
        $.each(allocatedAxes, function (_, axis) {
          allocateAxisBoxSecondPhase(axis);
        });
      }
      plotWidth = surface.width - plotOffset.left - plotOffset.right;
      plotHeight = surface.height - plotOffset.bottom - plotOffset.top;
      // now we got the proper plot dimensions, we can compute the scaling
      $.each(axes, function (_, axis) {
        setTransformationHelpers(axis);
      });
      if (showGrid) {
        drawAxisLabels();
      }
      insertLegend();
    }
    function setRange(axis) {
      var opts = axis.options, min = +(opts.min != null ? opts.min : axis.datamin), max = +(opts.max != null ? opts.max : axis.datamax), delta = max - min;
      if (delta == 0) {
        // degenerate case
        var widen = max == 0 ? 1 : 0.01;
        if (opts.min == null)
          min -= widen;
        // always widen max if we couldn't widen min to ensure we
        // don't fall into min == max which doesn't work
        if (opts.max == null || opts.min != null)
          max += widen;
      } else {
        // consider autoscaling
        var margin = opts.autoscaleMargin;
        if (margin != null) {
          if (opts.min == null) {
            min -= delta * margin;
            // make sure we don't go below zero if all values
            // are positive
            if (min < 0 && axis.datamin != null && axis.datamin >= 0)
              min = 0;
          }
          if (opts.max == null) {
            max += delta * margin;
            if (max > 0 && axis.datamax != null && axis.datamax <= 0)
              max = 0;
          }
        }
      }
      axis.min = min;
      axis.max = max;
    }
    function setupTickGeneration(axis) {
      var opts = axis.options;
      // estimate number of ticks
      var noTicks;
      if (typeof opts.ticks == 'number' && opts.ticks > 0)
        noTicks = opts.ticks;
      else
        // heuristic based on the model a*sqrt(x) fitted to
        // some data points that seemed reasonable
        noTicks = 0.3 * Math.sqrt(axis.direction == 'x' ? surface.width : surface.height);
      var delta = (axis.max - axis.min) / noTicks, dec = -Math.floor(Math.log(delta) / Math.LN10), maxDec = opts.tickDecimals;
      if (maxDec != null && dec > maxDec) {
        dec = maxDec;
      }
      var magn = Math.pow(10, -dec), norm = delta / magn,
        // norm is between 1.0 and 10.0
        size;
      if (norm < 1.5) {
        size = 1;
      } else if (norm < 3) {
        size = 2;
        // special case for 2.5, requires an extra decimal
        if (norm > 2.25 && (maxDec == null || dec + 1 <= maxDec)) {
          size = 2.5;
          ++dec;
        }
      } else if (norm < 7.5) {
        size = 5;
      } else {
        size = 10;
      }
      size *= magn;
      if (opts.minTickSize != null && size < opts.minTickSize) {
        size = opts.minTickSize;
      }
      axis.delta = delta;
      axis.tickDecimals = Math.max(0, maxDec != null ? maxDec : dec);
      axis.tickSize = opts.tickSize || size;
      // Time mode was moved to a plug-in in 0.8, and since so many people use it
      // we'll add an especially friendly reminder to make sure they included it.
      if (opts.mode == 'time' && !axis.tickGenerator) {
        throw new Error('Time mode requires the flot.time plugin.');
      }
      // Flot supports base-10 axes; any other mode else is handled by a plug-in,
      // like flot.time.js.
      if (!axis.tickGenerator) {
        axis.tickGenerator = function (axis) {
          var ticks = [], start = floorInBase(axis.min, axis.tickSize), i = 0, v = Number.NaN, prev;
          do {
            prev = v;
            v = start + i * axis.tickSize;
            ticks.push(v);
            ++i;
          } while (v < axis.max && v != prev);
          return ticks;
        };
        axis.tickFormatter = function (value, axis) {
          var factor = axis.tickDecimals ? Math.pow(10, axis.tickDecimals) : 1;
          var formatted = '' + Math.round(value * factor) / factor;
          // If tickDecimals was specified, ensure that we have exactly that
          // much precision; otherwise default to the value's own precision.
          if (axis.tickDecimals != null) {
            var decimal = formatted.indexOf('.');
            var precision = decimal == -1 ? 0 : formatted.length - decimal - 1;
            if (precision < axis.tickDecimals) {
              return (precision ? formatted : formatted + '.') + ('' + factor).substr(1, axis.tickDecimals - precision);
            }
          }
          return formatted;
        };
      }
      if ($.isFunction(opts.tickFormatter))
        axis.tickFormatter = function (v, axis) {
          return '' + opts.tickFormatter(v, axis);
        };
      if (opts.alignTicksWithAxis != null) {
        var otherAxis = (axis.direction == 'x' ? xaxes : yaxes)[opts.alignTicksWithAxis - 1];
        if (otherAxis && otherAxis.used && otherAxis != axis) {
          // consider snapping min/max to outermost nice ticks
          var niceTicks = axis.tickGenerator(axis);
          if (niceTicks.length > 0) {
            if (opts.min == null)
              axis.min = Math.min(axis.min, niceTicks[0]);
            if (opts.max == null && niceTicks.length > 1)
              axis.max = Math.max(axis.max, niceTicks[niceTicks.length - 1]);
          }
          axis.tickGenerator = function (axis) {
            // copy ticks, scaled to this axis
            var ticks = [], v, i;
            for (i = 0; i < otherAxis.ticks.length; ++i) {
              v = (otherAxis.ticks[i].v - otherAxis.min) / (otherAxis.max - otherAxis.min);
              v = axis.min + v * (axis.max - axis.min);
              ticks.push(v);
            }
            return ticks;
          };
          // we might need an extra decimal since forced
          // ticks don't necessarily fit naturally
          if (!axis.mode && opts.tickDecimals == null) {
            var extraDec = Math.max(0, -Math.floor(Math.log(axis.delta) / Math.LN10) + 1), ts = axis.tickGenerator(axis);
            // only proceed if the tick interval rounded
            // with an extra decimal doesn't give us a
            // zero at end
            if (!(ts.length > 1 && /\..*0$/.test((ts[1] - ts[0]).toFixed(extraDec))))
              axis.tickDecimals = extraDec;
          }
        }
      }
    }
    function setTicks(axis) {
      var oticks = axis.options.ticks, ticks = [];
      if (oticks == null || typeof oticks == 'number' && oticks > 0)
        ticks = axis.tickGenerator(axis);
      else if (oticks) {
        if ($.isFunction(oticks))
          // generate the ticks
          ticks = oticks(axis);
        else
          ticks = oticks;
      }
      // clean up/labelify the supplied ticks, copy them over
      var i, v;
      axis.ticks = [];
      for (i = 0; i < ticks.length; ++i) {
        var label = null;
        var t = ticks[i];
        if (typeof t == 'object') {
          v = +t[0];
          if (t.length > 1)
            label = t[1];
        } else
          v = +t;
        if (label == null)
          label = axis.tickFormatter(v, axis);
        if (!isNaN(v))
          axis.ticks.push({
            v: v,
            label: label
          });
      }
    }
    function snapRangeToTicks(axis, ticks) {
      if (axis.options.autoscaleMargin && ticks.length > 0) {
        // snap to ticks
        if (axis.options.min == null)
          axis.min = Math.min(axis.min, ticks[0].v);
        if (axis.options.max == null && ticks.length > 1)
          axis.max = Math.max(axis.max, ticks[ticks.length - 1].v);
      }
    }
    function draw() {
      surface.clear();
      executeHooks(hooks.drawBackground, [ctx]);
      var grid = options.grid;
      // draw background, if any
      if (grid.show && grid.backgroundColor)
        drawBackground();
      if (grid.show && !grid.aboveData) {
        drawGrid();
      }
      for (var i = 0; i < series.length; ++i) {
        executeHooks(hooks.drawSeries, [
          ctx,
          series[i]
        ]);
        drawSeries(series[i]);
      }
      executeHooks(hooks.draw, [ctx]);
      if (grid.show && grid.aboveData) {
        drawGrid();
      }
      surface.render();
      // A draw implies that either the axes or data have changed, so we
      // should probably update the overlay highlights as well.
      triggerRedrawOverlay();
    }
    function extractRange(ranges, coord) {
      var axis, from, to, key, axes = allAxes();
      for (var i = 0; i < axes.length; ++i) {
        axis = axes[i];
        if (axis.direction == coord) {
          key = coord + axis.n + 'axis';
          if (!ranges[key] && axis.n == 1)
            key = coord + 'axis';
          // support x1axis as xaxis
          if (ranges[key]) {
            from = ranges[key].from;
            to = ranges[key].to;
            break;
          }
        }
      }
      // backwards-compat stuff - to be removed in future
      if (!ranges[key]) {
        axis = coord == 'x' ? xaxes[0] : yaxes[0];
        from = ranges[coord + '1'];
        to = ranges[coord + '2'];
      }
      // auto-reverse as an added bonus
      if (from != null && to != null && from > to) {
        var tmp = from;
        from = to;
        to = tmp;
      }
      return {
        from: from,
        to: to,
        axis: axis
      };
    }
    function drawBackground() {
      ctx.save();
      ctx.translate(plotOffset.left, plotOffset.top);
      ctx.fillStyle = getColorOrGradient(options.grid.backgroundColor, plotHeight, 0, 'rgba(255, 255, 255, 0)');
      ctx.fillRect(0, 0, plotWidth, plotHeight);
      ctx.restore();
    }
    function drawGrid() {
      var i, axes, bw, bc;
      ctx.save();
      ctx.translate(plotOffset.left, plotOffset.top);
      // draw markings
      var markings = options.grid.markings;
      if (markings) {
        if ($.isFunction(markings)) {
          axes = plot.getAxes();
          // xmin etc. is backwards compatibility, to be
          // removed in the future
          axes.xmin = axes.xaxis.min;
          axes.xmax = axes.xaxis.max;
          axes.ymin = axes.yaxis.min;
          axes.ymax = axes.yaxis.max;
          markings = markings(axes);
        }
        for (i = 0; i < markings.length; ++i) {
          var m = markings[i], xrange = extractRange(m, 'x'), yrange = extractRange(m, 'y');
          // fill in missing
          if (xrange.from == null)
            xrange.from = xrange.axis.min;
          if (xrange.to == null)
            xrange.to = xrange.axis.max;
          if (yrange.from == null)
            yrange.from = yrange.axis.min;
          if (yrange.to == null)
            yrange.to = yrange.axis.max;
          // clip
          if (xrange.to < xrange.axis.min || xrange.from > xrange.axis.max || yrange.to < yrange.axis.min || yrange.from > yrange.axis.max)
            continue;
          xrange.from = Math.max(xrange.from, xrange.axis.min);
          xrange.to = Math.min(xrange.to, xrange.axis.max);
          yrange.from = Math.max(yrange.from, yrange.axis.min);
          yrange.to = Math.min(yrange.to, yrange.axis.max);
          var xequal = xrange.from === xrange.to, yequal = yrange.from === yrange.to;
          if (xequal && yequal) {
            continue;
          }
          // then draw
          xrange.from = Math.floor(xrange.axis.p2c(xrange.from));
          xrange.to = Math.floor(xrange.axis.p2c(xrange.to));
          yrange.from = Math.floor(yrange.axis.p2c(yrange.from));
          yrange.to = Math.floor(yrange.axis.p2c(yrange.to));
          if (xequal || yequal) {
            var lineWidth = m.lineWidth || options.grid.markingsLineWidth, subPixel = lineWidth % 2 ? 0.5 : 0;
            ctx.beginPath();
            ctx.strokeStyle = m.color || options.grid.markingsColor;
            ctx.lineWidth = lineWidth;
            if (xequal) {
              ctx.moveTo(xrange.to + subPixel, yrange.from);
              ctx.lineTo(xrange.to + subPixel, yrange.to);
            } else {
              ctx.moveTo(xrange.from, yrange.to + subPixel);
              ctx.lineTo(xrange.to, yrange.to + subPixel);
            }
            ctx.stroke();
          } else {
            ctx.fillStyle = m.color || options.grid.markingsColor;
            ctx.fillRect(xrange.from, yrange.to, xrange.to - xrange.from, yrange.from - yrange.to);
          }
        }
      }
      // draw the ticks
      axes = allAxes();
      bw = options.grid.borderWidth;
      for (var j = 0; j < axes.length; ++j) {
        var axis = axes[j], box = axis.box, t = axis.tickLength, x, y, xoff, yoff;
        if (!axis.show || axis.ticks.length == 0)
          continue;
        ctx.lineWidth = 1;
        // find the edges
        if (axis.direction == 'x') {
          x = 0;
          if (t == 'full')
            y = axis.position == 'top' ? 0 : plotHeight;
          else
            y = box.top - plotOffset.top + (axis.position == 'top' ? box.height : 0);
        } else {
          y = 0;
          if (t == 'full')
            x = axis.position == 'left' ? 0 : plotWidth;
          else
            x = box.left - plotOffset.left + (axis.position == 'left' ? box.width : 0);
        }
        // draw tick bar
        if (!axis.innermost) {
          ctx.strokeStyle = axis.options.color;
          ctx.beginPath();
          xoff = yoff = 0;
          if (axis.direction == 'x')
            xoff = plotWidth + 1;
          else
            yoff = plotHeight + 1;
          if (ctx.lineWidth == 1) {
            if (axis.direction == 'x') {
              y = Math.floor(y) + 0.5;
            } else {
              x = Math.floor(x) + 0.5;
            }
          }
          ctx.moveTo(x, y);
          ctx.lineTo(x + xoff, y + yoff);
          ctx.stroke();
        }
        // draw ticks
        ctx.strokeStyle = axis.options.tickColor;
        ctx.beginPath();
        for (i = 0; i < axis.ticks.length; ++i) {
          var v = axis.ticks[i].v;
          xoff = yoff = 0;
          if (isNaN(v) || v < axis.min || v > axis.max || t == 'full' && (typeof bw == 'object' && bw[axis.position] > 0 || bw > 0) && (v == axis.min || v == axis.max))
            continue;
          if (axis.direction == 'x') {
            x = axis.p2c(v);
            yoff = t == 'full' ? -plotHeight : t;
            if (axis.position == 'top')
              yoff = -yoff;
          } else {
            y = axis.p2c(v);
            xoff = t == 'full' ? -plotWidth : t;
            if (axis.position == 'left')
              xoff = -xoff;
          }
          if (ctx.lineWidth == 1) {
            if (axis.direction == 'x')
              x = Math.floor(x) + 0.5;
            else
              y = Math.floor(y) + 0.5;
          }
          ctx.moveTo(x, y);
          ctx.lineTo(x + xoff, y + yoff);
        }
        ctx.stroke();
      }
      // draw border
      if (bw) {
        // If either borderWidth or borderColor is an object, then draw the border
        // line by line instead of as one rectangle
        bc = options.grid.borderColor;
        if (typeof bw == 'object' || typeof bc == 'object') {
          if (typeof bw !== 'object') {
            bw = {
              top: bw,
              right: bw,
              bottom: bw,
              left: bw
            };
          }
          if (typeof bc !== 'object') {
            bc = {
              top: bc,
              right: bc,
              bottom: bc,
              left: bc
            };
          }
          if (bw.top > 0) {
            ctx.strokeStyle = bc.top;
            ctx.lineWidth = bw.top;
            ctx.beginPath();
            ctx.moveTo(0 - bw.left, 0 - bw.top / 2);
            ctx.lineTo(plotWidth, 0 - bw.top / 2);
            ctx.stroke();
          }
          if (bw.right > 0) {
            ctx.strokeStyle = bc.right;
            ctx.lineWidth = bw.right;
            ctx.beginPath();
            ctx.moveTo(plotWidth + bw.right / 2, 0 - bw.top);
            ctx.lineTo(plotWidth + bw.right / 2, plotHeight);
            ctx.stroke();
          }
          if (bw.bottom > 0) {
            ctx.strokeStyle = bc.bottom;
            ctx.lineWidth = bw.bottom;
            ctx.beginPath();
            ctx.moveTo(plotWidth + bw.right, plotHeight + bw.bottom / 2);
            ctx.lineTo(0, plotHeight + bw.bottom / 2);
            ctx.stroke();
          }
          if (bw.left > 0) {
            ctx.strokeStyle = bc.left;
            ctx.lineWidth = bw.left;
            ctx.beginPath();
            ctx.moveTo(0 - bw.left / 2, plotHeight + bw.bottom);
            ctx.lineTo(0 - bw.left / 2, 0);
            ctx.stroke();
          }
        } else {
          ctx.lineWidth = bw;
          ctx.strokeStyle = options.grid.borderColor;
          ctx.strokeRect(-bw / 2, -bw / 2, plotWidth + bw, plotHeight + bw);
        }
      }
      ctx.restore();
    }
    function drawAxisLabels() {
      $.each(allAxes(), function (_, axis) {
        var box = axis.box, legacyStyles = axis.direction + 'Axis ' + axis.direction + axis.n + 'Axis', layer = 'flot-' + axis.direction + '-axis flot-' + axis.direction + axis.n + '-axis ' + legacyStyles, font = axis.options.font || 'flot-tick-label tickLabel', tick, x, y, halign, valign;
        // Remove text before checking for axis.show and ticks.length;
        // otherwise plugins, like flot-tickrotor, that draw their own
        // tick labels will end up with both theirs and the defaults.
        surface.removeText(layer);
        if (!axis.show || axis.ticks.length == 0)
          return;
        for (var i = 0; i < axis.ticks.length; ++i) {
          tick = axis.ticks[i];
          if (!tick.label || tick.v < axis.min || tick.v > axis.max)
            continue;
          if (axis.direction == 'x') {
            halign = 'center';
            x = plotOffset.left + axis.p2c(tick.v);
            if (axis.position == 'bottom') {
              y = box.top + box.padding;
            } else {
              y = box.top + box.height - box.padding;
              valign = 'bottom';
            }
          } else {
            valign = 'middle';
            y = plotOffset.top + axis.p2c(tick.v);
            if (axis.position == 'left') {
              x = box.left + box.width - box.padding;
              halign = 'right';
            } else {
              x = box.left + box.padding;
            }
          }
          surface.addText(layer, x, y, tick.label, font, null, null, halign, valign);
        }
      });
    }
    function drawSeries(series) {
      if (series.lines.show)
        drawSeriesLines(series);
      if (series.bars.show)
        drawSeriesBars(series);
      if (series.points.show)
        drawSeriesPoints(series);
    }
    function drawSeriesLines(series) {
      function plotLine(datapoints, xoffset, yoffset, axisx, axisy) {
        var points = datapoints.points, ps = datapoints.pointsize, prevx = null, prevy = null;
        ctx.beginPath();
        for (var i = ps; i < points.length; i += ps) {
          var x1 = points[i - ps], y1 = points[i - ps + 1], x2 = points[i], y2 = points[i + 1];
          if (x1 == null || x2 == null)
            continue;
          // clip with ymin
          if (y1 <= y2 && y1 < axisy.min) {
            if (y2 < axisy.min)
              continue;
            // line segment is outside
            // compute new intersection point
            x1 = (axisy.min - y1) / (y2 - y1) * (x2 - x1) + x1;
            y1 = axisy.min;
          } else if (y2 <= y1 && y2 < axisy.min) {
            if (y1 < axisy.min)
              continue;
            x2 = (axisy.min - y1) / (y2 - y1) * (x2 - x1) + x1;
            y2 = axisy.min;
          }
          // clip with ymax
          if (y1 >= y2 && y1 > axisy.max) {
            if (y2 > axisy.max)
              continue;
            x1 = (axisy.max - y1) / (y2 - y1) * (x2 - x1) + x1;
            y1 = axisy.max;
          } else if (y2 >= y1 && y2 > axisy.max) {
            if (y1 > axisy.max)
              continue;
            x2 = (axisy.max - y1) / (y2 - y1) * (x2 - x1) + x1;
            y2 = axisy.max;
          }
          // clip with xmin
          if (x1 <= x2 && x1 < axisx.min) {
            if (x2 < axisx.min)
              continue;
            y1 = (axisx.min - x1) / (x2 - x1) * (y2 - y1) + y1;
            x1 = axisx.min;
          } else if (x2 <= x1 && x2 < axisx.min) {
            if (x1 < axisx.min)
              continue;
            y2 = (axisx.min - x1) / (x2 - x1) * (y2 - y1) + y1;
            x2 = axisx.min;
          }
          // clip with xmax
          if (x1 >= x2 && x1 > axisx.max) {
            if (x2 > axisx.max)
              continue;
            y1 = (axisx.max - x1) / (x2 - x1) * (y2 - y1) + y1;
            x1 = axisx.max;
          } else if (x2 >= x1 && x2 > axisx.max) {
            if (x1 > axisx.max)
              continue;
            y2 = (axisx.max - x1) / (x2 - x1) * (y2 - y1) + y1;
            x2 = axisx.max;
          }
          if (x1 != prevx || y1 != prevy)
            ctx.moveTo(axisx.p2c(x1) + xoffset, axisy.p2c(y1) + yoffset);
          prevx = x2;
          prevy = y2;
          ctx.lineTo(axisx.p2c(x2) + xoffset, axisy.p2c(y2) + yoffset);
        }
        ctx.stroke();
      }
      function plotLineArea(datapoints, axisx, axisy) {
        var points = datapoints.points, ps = datapoints.pointsize, bottom = Math.min(Math.max(0, axisy.min), axisy.max), i = 0, top, areaOpen = false, ypos = 1, segmentStart = 0, segmentEnd = 0;
        // we process each segment in two turns, first forward
        // direction to sketch out top, then once we hit the
        // end we go backwards to sketch the bottom
        while (true) {
          if (ps > 0 && i > points.length + ps)
            break;
          i += ps;
          // ps is negative if going backwards
          var x1 = points[i - ps], y1 = points[i - ps + ypos], x2 = points[i], y2 = points[i + ypos];
          if (areaOpen) {
            if (ps > 0 && x1 != null && x2 == null) {
              // at turning point
              segmentEnd = i;
              ps = -ps;
              ypos = 2;
              continue;
            }
            if (ps < 0 && i == segmentStart + ps) {
              // done with the reverse sweep
              ctx.fill();
              areaOpen = false;
              ps = -ps;
              ypos = 1;
              i = segmentStart = segmentEnd + ps;
              continue;
            }
          }
          if (x1 == null || x2 == null)
            continue;
          // clip x values
          // clip with xmin
          if (x1 <= x2 && x1 < axisx.min) {
            if (x2 < axisx.min)
              continue;
            y1 = (axisx.min - x1) / (x2 - x1) * (y2 - y1) + y1;
            x1 = axisx.min;
          } else if (x2 <= x1 && x2 < axisx.min) {
            if (x1 < axisx.min)
              continue;
            y2 = (axisx.min - x1) / (x2 - x1) * (y2 - y1) + y1;
            x2 = axisx.min;
          }
          // clip with xmax
          if (x1 >= x2 && x1 > axisx.max) {
            if (x2 > axisx.max)
              continue;
            y1 = (axisx.max - x1) / (x2 - x1) * (y2 - y1) + y1;
            x1 = axisx.max;
          } else if (x2 >= x1 && x2 > axisx.max) {
            if (x1 > axisx.max)
              continue;
            y2 = (axisx.max - x1) / (x2 - x1) * (y2 - y1) + y1;
            x2 = axisx.max;
          }
          if (!areaOpen) {
            // open area
            ctx.beginPath();
            ctx.moveTo(axisx.p2c(x1), axisy.p2c(bottom));
            areaOpen = true;
          }
          // now first check the case where both is outside
          if (y1 >= axisy.max && y2 >= axisy.max) {
            ctx.lineTo(axisx.p2c(x1), axisy.p2c(axisy.max));
            ctx.lineTo(axisx.p2c(x2), axisy.p2c(axisy.max));
            continue;
          } else if (y1 <= axisy.min && y2 <= axisy.min) {
            ctx.lineTo(axisx.p2c(x1), axisy.p2c(axisy.min));
            ctx.lineTo(axisx.p2c(x2), axisy.p2c(axisy.min));
            continue;
          }
          // else it's a bit more complicated, there might
          // be a flat maxed out rectangle first, then a
          // triangular cutout or reverse; to find these
          // keep track of the current x values
          var x1old = x1, x2old = x2;
          // clip the y values, without shortcutting, we
          // go through all cases in turn
          // clip with ymin
          if (y1 <= y2 && y1 < axisy.min && y2 >= axisy.min) {
            x1 = (axisy.min - y1) / (y2 - y1) * (x2 - x1) + x1;
            y1 = axisy.min;
          } else if (y2 <= y1 && y2 < axisy.min && y1 >= axisy.min) {
            x2 = (axisy.min - y1) / (y2 - y1) * (x2 - x1) + x1;
            y2 = axisy.min;
          }
          // clip with ymax
          if (y1 >= y2 && y1 > axisy.max && y2 <= axisy.max) {
            x1 = (axisy.max - y1) / (y2 - y1) * (x2 - x1) + x1;
            y1 = axisy.max;
          } else if (y2 >= y1 && y2 > axisy.max && y1 <= axisy.max) {
            x2 = (axisy.max - y1) / (y2 - y1) * (x2 - x1) + x1;
            y2 = axisy.max;
          }
          // if the x value was changed we got a rectangle
          // to fill
          if (x1 != x1old) {
            ctx.lineTo(axisx.p2c(x1old), axisy.p2c(y1));  // it goes to (x1, y1), but we fill that below
          }
          // fill triangular section, this sometimes result
          // in redundant points if (x1, y1) hasn't changed
          // from previous line to, but we just ignore that
          ctx.lineTo(axisx.p2c(x1), axisy.p2c(y1));
          ctx.lineTo(axisx.p2c(x2), axisy.p2c(y2));
          // fill the other rectangle if it's there
          if (x2 != x2old) {
            ctx.lineTo(axisx.p2c(x2), axisy.p2c(y2));
            ctx.lineTo(axisx.p2c(x2old), axisy.p2c(y2));
          }
        }
      }
      ctx.save();
      ctx.translate(plotOffset.left, plotOffset.top);
      ctx.lineJoin = 'round';
      var lw = series.lines.lineWidth, sw = series.shadowSize;
      // FIXME: consider another form of shadow when filling is turned on
      if (lw > 0 && sw > 0) {
        // draw shadow as a thick and thin line with transparency
        ctx.lineWidth = sw;
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        // position shadow at angle from the mid of line
        var angle = Math.PI / 18;
        plotLine(series.datapoints, Math.sin(angle) * (lw / 2 + sw / 2), Math.cos(angle) * (lw / 2 + sw / 2), series.xaxis, series.yaxis);
        ctx.lineWidth = sw / 2;
        plotLine(series.datapoints, Math.sin(angle) * (lw / 2 + sw / 4), Math.cos(angle) * (lw / 2 + sw / 4), series.xaxis, series.yaxis);
      }
      ctx.lineWidth = lw;
      ctx.strokeStyle = series.color;
      var fillStyle = getFillStyle(series.lines, series.color, 0, plotHeight);
      if (fillStyle) {
        ctx.fillStyle = fillStyle;
        plotLineArea(series.datapoints, series.xaxis, series.yaxis);
      }
      if (lw > 0)
        plotLine(series.datapoints, 0, 0, series.xaxis, series.yaxis);
      ctx.restore();
    }
    function drawSeriesPoints(series) {
      function plotPoints(datapoints, radius, fillStyle, offset, shadow, axisx, axisy, symbol) {
        var points = datapoints.points, ps = datapoints.pointsize;
        for (var i = 0; i < points.length; i += ps) {
          var x = points[i], y = points[i + 1];
          if (x == null || x < axisx.min || x > axisx.max || y < axisy.min || y > axisy.max)
            continue;
          ctx.beginPath();
          x = axisx.p2c(x);
          y = axisy.p2c(y) + offset;
          if (symbol == 'circle')
            ctx.arc(x, y, radius, 0, shadow ? Math.PI : Math.PI * 2, false);
          else
            symbol(ctx, x, y, radius, shadow);
          ctx.closePath();
          if (fillStyle) {
            ctx.fillStyle = fillStyle;
            ctx.fill();
          }
          ctx.stroke();
        }
      }
      ctx.save();
      ctx.translate(plotOffset.left, plotOffset.top);
      var lw = series.points.lineWidth, sw = series.shadowSize, radius = series.points.radius, symbol = series.points.symbol;
      // If the user sets the line width to 0, we change it to a very 
      // small value. A line width of 0 seems to force the default of 1.
      // Doing the conditional here allows the shadow setting to still be 
      // optional even with a lineWidth of 0.
      if (lw == 0)
        lw = 0.0001;
      if (lw > 0 && sw > 0) {
        // draw shadow in two steps
        var w = sw / 2;
        ctx.lineWidth = w;
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        plotPoints(series.datapoints, radius, null, w + w / 2, true, series.xaxis, series.yaxis, symbol);
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        plotPoints(series.datapoints, radius, null, w / 2, true, series.xaxis, series.yaxis, symbol);
      }
      ctx.lineWidth = lw;
      ctx.strokeStyle = series.color;
      plotPoints(series.datapoints, radius, getFillStyle(series.points, series.color), 0, false, series.xaxis, series.yaxis, symbol);
      ctx.restore();
    }
    function drawBar(x, y, b, barLeft, barRight, fillStyleCallback, axisx, axisy, c, horizontal, lineWidth) {
      var left, right, bottom, top, drawLeft, drawRight, drawTop, drawBottom, tmp;
      // in horizontal mode, we start the bar from the left
      // instead of from the bottom so it appears to be
      // horizontal rather than vertical
      if (horizontal) {
        drawBottom = drawRight = drawTop = true;
        drawLeft = false;
        left = b;
        right = x;
        top = y + barLeft;
        bottom = y + barRight;
        // account for negative bars
        if (right < left) {
          tmp = right;
          right = left;
          left = tmp;
          drawLeft = true;
          drawRight = false;
        }
      } else {
        drawLeft = drawRight = drawTop = true;
        drawBottom = false;
        left = x + barLeft;
        right = x + barRight;
        bottom = b;
        top = y;
        // account for negative bars
        if (top < bottom) {
          tmp = top;
          top = bottom;
          bottom = tmp;
          drawBottom = true;
          drawTop = false;
        }
      }
      // clip
      if (right < axisx.min || left > axisx.max || top < axisy.min || bottom > axisy.max)
        return;
      if (left < axisx.min) {
        left = axisx.min;
        drawLeft = false;
      }
      if (right > axisx.max) {
        right = axisx.max;
        drawRight = false;
      }
      if (bottom < axisy.min) {
        bottom = axisy.min;
        drawBottom = false;
      }
      if (top > axisy.max) {
        top = axisy.max;
        drawTop = false;
      }
      left = axisx.p2c(left);
      bottom = axisy.p2c(bottom);
      right = axisx.p2c(right);
      top = axisy.p2c(top);
      // fill the bar
      if (fillStyleCallback) {
        c.fillStyle = fillStyleCallback(bottom, top);
        c.fillRect(left, top, right - left, bottom - top);
      }
      // draw outline
      if (lineWidth > 0 && (drawLeft || drawRight || drawTop || drawBottom)) {
        c.beginPath();
        // FIXME: inline moveTo is buggy with excanvas
        c.moveTo(left, bottom);
        if (drawLeft)
          c.lineTo(left, top);
        else
          c.moveTo(left, top);
        if (drawTop)
          c.lineTo(right, top);
        else
          c.moveTo(right, top);
        if (drawRight)
          c.lineTo(right, bottom);
        else
          c.moveTo(right, bottom);
        if (drawBottom)
          c.lineTo(left, bottom);
        else
          c.moveTo(left, bottom);
        c.stroke();
      }
    }
    function drawSeriesBars(series) {
      function plotBars(datapoints, barLeft, barRight, fillStyleCallback, axisx, axisy) {
        var points = datapoints.points, ps = datapoints.pointsize;
        for (var i = 0; i < points.length; i += ps) {
          if (points[i] == null)
            continue;
          drawBar(points[i], points[i + 1], points[i + 2], barLeft, barRight, fillStyleCallback, axisx, axisy, ctx, series.bars.horizontal, series.bars.lineWidth);
        }
      }
      ctx.save();
      ctx.translate(plotOffset.left, plotOffset.top);
      // FIXME: figure out a way to add shadows (for instance along the right edge)
      ctx.lineWidth = series.bars.lineWidth;
      ctx.strokeStyle = series.color;
      var barLeft;
      switch (series.bars.align) {
      case 'left':
        barLeft = 0;
        break;
      case 'right':
        barLeft = -series.bars.barWidth;
        break;
      default:
        barLeft = -series.bars.barWidth / 2;
      }
      var fillStyleCallback = series.bars.fill ? function (bottom, top) {
          return getFillStyle(series.bars, series.color, bottom, top);
        } : null;
      plotBars(series.datapoints, barLeft, barLeft + series.bars.barWidth, fillStyleCallback, series.xaxis, series.yaxis);
      ctx.restore();
    }
    function getFillStyle(filloptions, seriesColor, bottom, top) {
      var fill = filloptions.fill;
      if (!fill)
        return null;
      if (filloptions.fillColor)
        return getColorOrGradient(filloptions.fillColor, bottom, top, seriesColor);
      var c = $.color.parse(seriesColor);
      c.a = typeof fill == 'number' ? fill : 0.4;
      c.normalize();
      return c.toString();
    }
    function insertLegend() {
      if (options.legend.container != null) {
        $(options.legend.container).html('');
      } else {
        placeholder.find('.legend').remove();
      }
      if (!options.legend.show) {
        return;
      }
      var fragments = [], entries = [], rowStarted = false, lf = options.legend.labelFormatter, s, label;
      // Build a list of legend entries, with each having a label and a color
      for (var i = 0; i < series.length; ++i) {
        s = series[i];
        if (s.label) {
          label = lf ? lf(s.label, s) : s.label;
          if (label) {
            entries.push({
              label: label,
              color: s.color
            });
          }
        }
      }
      // Sort the legend using either the default or a custom comparator
      if (options.legend.sorted) {
        if ($.isFunction(options.legend.sorted)) {
          entries.sort(options.legend.sorted);
        } else if (options.legend.sorted == 'reverse') {
          entries.reverse();
        } else {
          var ascending = options.legend.sorted != 'descending';
          entries.sort(function (a, b) {
            return a.label == b.label ? 0 : a.label < b.label != ascending ? 1 : -1;
          });
        }
      }
      // Generate markup for the list of entries, in their final order
      for (var i = 0; i < entries.length; ++i) {
        var entry = entries[i];
        if (i % options.legend.noColumns == 0) {
          if (rowStarted)
            fragments.push('</tr>');
          fragments.push('<tr>');
          rowStarted = true;
        }
        fragments.push('<td class="legendColorBox"><div style="border:1px solid ' + options.legend.labelBoxBorderColor + ';padding:1px"><div style="width:4px;height:0;border:5px solid ' + entry.color + ';overflow:hidden"></div></div></td>' + '<td class="legendLabel">' + entry.label + '</td>');
      }
      if (rowStarted)
        fragments.push('</tr>');
      if (fragments.length == 0)
        return;
      var table = '<table style="font-size:smaller;color:' + options.grid.color + '">' + fragments.join('') + '</table>';
      if (options.legend.container != null)
        $(options.legend.container).html(table);
      else {
        var pos = '', p = options.legend.position, m = options.legend.margin;
        if (m[0] == null)
          m = [
            m,
            m
          ];
        if (p.charAt(0) == 'n')
          pos += 'top:' + (m[1] + plotOffset.top) + 'px;';
        else if (p.charAt(0) == 's')
          pos += 'bottom:' + (m[1] + plotOffset.bottom) + 'px;';
        if (p.charAt(1) == 'e')
          pos += 'right:' + (m[0] + plotOffset.right) + 'px;';
        else if (p.charAt(1) == 'w')
          pos += 'left:' + (m[0] + plotOffset.left) + 'px;';
        var legend = $('<div class="legend">' + table.replace('style="', 'style="position:absolute;' + pos + ';') + '</div>').appendTo(placeholder);
        if (options.legend.backgroundOpacity != 0) {
          // put in the transparent background
          // separately to avoid blended labels and
          // label boxes
          var c = options.legend.backgroundColor;
          if (c == null) {
            c = options.grid.backgroundColor;
            if (c && typeof c == 'string')
              c = $.color.parse(c);
            else
              c = $.color.extract(legend, 'background-color');
            c.a = 1;
            c = c.toString();
          }
          var div = legend.children();
          $('<div style="position:absolute;width:' + div.width() + 'px;height:' + div.height() + 'px;' + pos + 'background-color:' + c + ';"> </div>').prependTo(legend).css('opacity', options.legend.backgroundOpacity);
        }
      }
    }
    // interactive features
    var highlights = [], redrawTimeout = null;
    // returns the data item the mouse is over, or null if none is found
    function findNearbyItem(mouseX, mouseY, seriesFilter) {
      var maxDistance = options.grid.mouseActiveRadius, smallestDistance = maxDistance * maxDistance + 1, item = null, foundPoint = false, i, j, ps;
      for (i = series.length - 1; i >= 0; --i) {
        if (!seriesFilter(series[i]))
          continue;
        var s = series[i], axisx = s.xaxis, axisy = s.yaxis, points = s.datapoints.points, mx = axisx.c2p(mouseX),
          // precompute some stuff to make the loop faster
          my = axisy.c2p(mouseY), maxx = maxDistance / axisx.scale, maxy = maxDistance / axisy.scale;
        ps = s.datapoints.pointsize;
        // with inverse transforms, we can't use the maxx/maxy
        // optimization, sadly
        if (axisx.options.inverseTransform)
          maxx = Number.MAX_VALUE;
        if (axisy.options.inverseTransform)
          maxy = Number.MAX_VALUE;
        if (s.lines.show || s.points.show) {
          for (j = 0; j < points.length; j += ps) {
            var x = points[j], y = points[j + 1];
            if (x == null)
              continue;
            // For points and lines, the cursor must be within a
            // certain distance to the data point
            if (x - mx > maxx || x - mx < -maxx || y - my > maxy || y - my < -maxy)
              continue;
            // We have to calculate distances in pixels, not in
            // data units, because the scales of the axes may be different
            var dx = Math.abs(axisx.p2c(x) - mouseX), dy = Math.abs(axisy.p2c(y) - mouseY), dist = dx * dx + dy * dy;
            // we save the sqrt
            // use <= to ensure last point takes precedence
            // (last generally means on top of)
            if (dist < smallestDistance) {
              smallestDistance = dist;
              item = [
                i,
                j / ps
              ];
            }
          }
        }
        if (s.bars.show && !item) {
          // no other point can be nearby
          var barLeft, barRight;
          switch (s.bars.align) {
          case 'left':
            barLeft = 0;
            break;
          case 'right':
            barLeft = -s.bars.barWidth;
            break;
          default:
            barLeft = -s.bars.barWidth / 2;
          }
          barRight = barLeft + s.bars.barWidth;
          for (j = 0; j < points.length; j += ps) {
            var x = points[j], y = points[j + 1], b = points[j + 2];
            if (x == null)
              continue;
            // for a bar graph, the cursor must be inside the bar
            if (series[i].bars.horizontal ? mx <= Math.max(b, x) && mx >= Math.min(b, x) && my >= y + barLeft && my <= y + barRight : mx >= x + barLeft && mx <= x + barRight && my >= Math.min(b, y) && my <= Math.max(b, y))
              item = [
                i,
                j / ps
              ];
          }
        }
      }
      if (item) {
        i = item[0];
        j = item[1];
        ps = series[i].datapoints.pointsize;
        return {
          datapoint: series[i].datapoints.points.slice(j * ps, (j + 1) * ps),
          dataIndex: j,
          series: series[i],
          seriesIndex: i
        };
      }
      return null;
    }
    function onMouseMove(e) {
      if (options.grid.hoverable)
        triggerClickHoverEvent('plothover', e, function (s) {
          return s['hoverable'] != false;
        });
    }
    function onMouseLeave(e) {
      if (options.grid.hoverable)
        triggerClickHoverEvent('plothover', e, function (s) {
          return false;
        });
    }
    function onClick(e) {
      triggerClickHoverEvent('plotclick', e, function (s) {
        return s['clickable'] != false;
      });
    }
    // trigger click or hover event (they send the same parameters
    // so we share their code)
    function triggerClickHoverEvent(eventname, event, seriesFilter) {
      var offset = eventHolder.offset(), canvasX = event.pageX - offset.left - plotOffset.left, canvasY = event.pageY - offset.top - plotOffset.top, pos = canvasToAxisCoords({
          left: canvasX,
          top: canvasY
        });
      pos.pageX = event.pageX;
      pos.pageY = event.pageY;
      var item = findNearbyItem(canvasX, canvasY, seriesFilter);
      if (item) {
        // fill in mouse pos for any listeners out there
        item.pageX = parseInt(item.series.xaxis.p2c(item.datapoint[0]) + offset.left + plotOffset.left, 10);
        item.pageY = parseInt(item.series.yaxis.p2c(item.datapoint[1]) + offset.top + plotOffset.top, 10);
      }
      if (options.grid.autoHighlight) {
        // clear auto-highlights
        for (var i = 0; i < highlights.length; ++i) {
          var h = highlights[i];
          if (h.auto == eventname && !(item && h.series == item.series && h.point[0] == item.datapoint[0] && h.point[1] == item.datapoint[1]))
            unhighlight(h.series, h.point);
        }
        if (item)
          highlight(item.series, item.datapoint, eventname);
      }
      placeholder.trigger(eventname, [
        pos,
        item
      ]);
    }
    function triggerRedrawOverlay() {
      var t = options.interaction.redrawOverlayInterval;
      if (t == -1) {
        // skip event queue
        drawOverlay();
        return;
      }
      if (!redrawTimeout)
        redrawTimeout = setTimeout(drawOverlay, t);
    }
    function drawOverlay() {
      redrawTimeout = null;
      // draw highlights
      octx.save();
      overlay.clear();
      octx.translate(plotOffset.left, plotOffset.top);
      var i, hi;
      for (i = 0; i < highlights.length; ++i) {
        hi = highlights[i];
        if (hi.series.bars.show)
          drawBarHighlight(hi.series, hi.point);
        else
          drawPointHighlight(hi.series, hi.point);
      }
      octx.restore();
      executeHooks(hooks.drawOverlay, [octx]);
    }
    function highlight(s, point, auto) {
      if (typeof s == 'number')
        s = series[s];
      if (typeof point == 'number') {
        var ps = s.datapoints.pointsize;
        point = s.datapoints.points.slice(ps * point, ps * (point + 1));
      }
      var i = indexOfHighlight(s, point);
      if (i == -1) {
        highlights.push({
          series: s,
          point: point,
          auto: auto
        });
        triggerRedrawOverlay();
      } else if (!auto)
        highlights[i].auto = false;
    }
    function unhighlight(s, point) {
      if (s == null && point == null) {
        highlights = [];
        triggerRedrawOverlay();
        return;
      }
      if (typeof s == 'number')
        s = series[s];
      if (typeof point == 'number') {
        var ps = s.datapoints.pointsize;
        point = s.datapoints.points.slice(ps * point, ps * (point + 1));
      }
      var i = indexOfHighlight(s, point);
      if (i != -1) {
        highlights.splice(i, 1);
        triggerRedrawOverlay();
      }
    }
    function indexOfHighlight(s, p) {
      for (var i = 0; i < highlights.length; ++i) {
        var h = highlights[i];
        if (h.series == s && h.point[0] == p[0] && h.point[1] == p[1])
          return i;
      }
      return -1;
    }
    function drawPointHighlight(series, point) {
      var x = point[0], y = point[1], axisx = series.xaxis, axisy = series.yaxis, highlightColor = typeof series.highlightColor === 'string' ? series.highlightColor : $.color.parse(series.color).scale('a', 0.5).toString();
      if (x < axisx.min || x > axisx.max || y < axisy.min || y > axisy.max)
        return;
      var pointRadius = series.points.radius + series.points.lineWidth / 2;
      octx.lineWidth = pointRadius;
      octx.strokeStyle = highlightColor;
      var radius = 1.5 * pointRadius;
      x = axisx.p2c(x);
      y = axisy.p2c(y);
      octx.beginPath();
      if (series.points.symbol == 'circle')
        octx.arc(x, y, radius, 0, 2 * Math.PI, false);
      else
        series.points.symbol(octx, x, y, radius, false);
      octx.closePath();
      octx.stroke();
    }
    function drawBarHighlight(series, point) {
      var highlightColor = typeof series.highlightColor === 'string' ? series.highlightColor : $.color.parse(series.color).scale('a', 0.5).toString(), fillStyle = highlightColor, barLeft;
      switch (series.bars.align) {
      case 'left':
        barLeft = 0;
        break;
      case 'right':
        barLeft = -series.bars.barWidth;
        break;
      default:
        barLeft = -series.bars.barWidth / 2;
      }
      octx.lineWidth = series.bars.lineWidth;
      octx.strokeStyle = highlightColor;
      drawBar(point[0], point[1], point[2] || 0, barLeft, barLeft + series.bars.barWidth, function () {
        return fillStyle;
      }, series.xaxis, series.yaxis, octx, series.bars.horizontal, series.bars.lineWidth);
    }
    function getColorOrGradient(spec, bottom, top, defaultColor) {
      if (typeof spec == 'string')
        return spec;
      else {
        // assume this is a gradient spec; IE currently only
        // supports a simple vertical gradient properly, so that's
        // what we support too
        var gradient = ctx.createLinearGradient(0, top, 0, bottom);
        for (var i = 0, l = spec.colors.length; i < l; ++i) {
          var c = spec.colors[i];
          if (typeof c != 'string') {
            var co = $.color.parse(defaultColor);
            if (c.brightness != null)
              co = co.scale('rgb', c.brightness);
            if (c.opacity != null)
              co.a *= c.opacity;
            c = co.toString();
          }
          gradient.addColorStop(i / (l - 1), c);
        }
        return gradient;
      }
    }
  }
  // Add the plot function to the top level of the jQuery object
  $.plot = function (placeholder, data, options) {
    //var t0 = new Date();
    var plot = new Plot($(placeholder), data, options, $.plot.plugins);
    //(window.console ? console.log : alert)("time used (msecs): " + ((new Date()).getTime() - t0.getTime()));
    return plot;
  };
  $.plot.version = '0.8.3';
  $.plot.plugins = [];
  // Also add the plot function as a chainable property
  $.fn.plot = function (data, options) {
    return this.each(function () {
      $.plot(this, data, options);
    });
  };
  // round to nearby lower multiple of base
  function floorInBase(n, base) {
    return base * Math.floor(n / base);
  }
}(jQuery));/*
 * jquery.flot.tooltip
 * 
 * description: easy-to-use tooltips for Flot charts
 * version: 0.8.4
 * authors: Krzysztof Urbas @krzysu [myviews.pl],Evan Steinkerchner @Roundaround
 * website: https://github.com/krzysu/flot.tooltip
 * 
 * build on 2014-08-04
 * released under MIT License, 2012
*/
!function (a) {
  var b = {
      tooltip: !1,
      tooltipOpts: {
        id: 'flotTip',
        content: '%s | X: %x | Y: %y',
        xDateFormat: null,
        yDateFormat: null,
        monthNames: null,
        dayNames: null,
        shifts: {
          x: 10,
          y: 20
        },
        defaultTheme: !0,
        lines: {
          track: !1,
          threshold: 0.05
        },
        onHover: function () {
        },
        $compat: !1
      }
    }, c = function (a) {
      this.tipPosition = {
        x: 0,
        y: 0
      }, this.init(a);
    };
  c.prototype.init = function (b) {
    function c(a) {
      var c = {};
      c.x = a.pageX, c.y = a.pageY, b.setTooltipPosition(c);
    }
    function d(c, d, f) {
      var g = function (a, b, c, d) {
          return Math.sqrt((c - a) * (c - a) + (d - b) * (d - b));
        }, h = function (a, b, c, d, e, f, h) {
          if (!h || (h = function (a, b, c, d, e, f) {
              if ('undefined' != typeof c)
                return {
                  x: c,
                  y: b
                };
              if ('undefined' != typeof d)
                return {
                  x: a,
                  y: d
                };
              var g, h = -1 / ((f - d) / (e - c));
              return {
                x: g = (e * (a * h - b + d) + c * (a * -h + b - f)) / (h * (e - c) + d - f),
                y: h * g - h * a + b
              };
            }(a, b, c, d, e, f), h.x >= Math.min(c, e) && h.x <= Math.max(c, e) && h.y >= Math.min(d, f) && h.y <= Math.max(d, f))) {
            var i = d - f, j = e - c, k = c * f - d * e;
            return Math.abs(i * a + j * b + k) / Math.sqrt(i * i + j * j);
          }
          var l = g(a, b, c, d), m = g(a, b, e, f);
          return l > m ? m : l;
        };
      if (f)
        b.showTooltip(f, d);
      else if (e.plotOptions.series.lines.show && e.tooltipOptions.lines.track === !0) {
        var i = { distance: -1 };
        a.each(b.getData(), function (a, c) {
          for (var f = 0, j = -1, k = 1; k < c.data.length; k++)
            c.data[k - 1][0] <= d.x && c.data[k][0] >= d.x && (f = k - 1, j = k);
          if (-1 === j)
            return void b.hideTooltip();
          var l = {
              x: c.data[f][0],
              y: c.data[f][1]
            }, m = {
              x: c.data[j][0],
              y: c.data[j][1]
            }, n = h(d.x, d.y, l.x, l.y, m.x, m.y, !1);
          if (n < e.tooltipOptions.lines.threshold) {
            var o = g(l.x, l.y, d.x, d.y) < g(d.x, d.y, m.x, m.y) ? f : j, p = (c.datapoints.pointsize, [
                d.x,
                l.y + (m.y - l.y) * ((d.x - l.x) / (m.x - l.x))
              ]), q = {
                datapoint: p,
                dataIndex: o,
                series: c,
                seriesIndex: a
              };
            (-1 === i.distance || n < i.distance) && (i = {
              distance: n,
              item: q
            });
          }
        }), -1 !== i.distance ? b.showTooltip(i.item, d) : b.hideTooltip();
      } else
        b.hideTooltip();
    }
    var e = this, f = a.plot.plugins.length;
    if (this.plotPlugins = [], f)
      for (var g = 0; f > g; g++)
        this.plotPlugins.push(a.plot.plugins[g].name);
    b.hooks.bindEvents.push(function (b, f) {
      if (e.plotOptions = b.getOptions(), e.plotOptions.tooltip !== !1 && 'undefined' != typeof e.plotOptions.tooltip) {
        e.tooltipOptions = e.plotOptions.tooltipOpts, e.tooltipOptions.$compat ? (e.wfunc = 'width', e.hfunc = 'height') : (e.wfunc = 'innerWidth', e.hfunc = 'innerHeight');
        {
          e.getDomElement();
        }
        a(b.getPlaceholder()).bind('plothover', d), a(f).bind('mousemove', c);
      }
    }), b.hooks.shutdown.push(function (b, e) {
      a(b.getPlaceholder()).unbind('plothover', d), a(e).unbind('mousemove', c);
    }), b.setTooltipPosition = function (b) {
      var c = e.getDomElement(), d = c.outerWidth() + e.tooltipOptions.shifts.x, f = c.outerHeight() + e.tooltipOptions.shifts.y;
      b.x - a(window).scrollLeft() > a(window)[e.wfunc]() - d && (b.x -= d), b.y - a(window).scrollTop() > a(window)[e.hfunc]() - f && (b.y -= f), e.tipPosition.x = b.x, e.tipPosition.y = b.y;
    }, b.showTooltip = function (a, c) {
      var d = e.getDomElement(), f = e.stringFormat(e.tooltipOptions.content, a);
      d.html(f), b.setTooltipPosition({
        x: c.pageX,
        y: c.pageY
      }), d.css({
        left: e.tipPosition.x + e.tooltipOptions.shifts.x,
        top: e.tipPosition.y + e.tooltipOptions.shifts.y
      }).show(), 'function' == typeof e.tooltipOptions.onHover && e.tooltipOptions.onHover(a, d);
    }, b.hideTooltip = function () {
      e.getDomElement().hide().html('');
    };
  }, c.prototype.getDomElement = function () {
    var b = a('#' + this.tooltipOptions.id);
    return 0 === b.length && (b = a('<div />').attr('id', this.tooltipOptions.id), b.appendTo('body').hide().css({ position: 'absolute' }), this.tooltipOptions.defaultTheme && b.css({
      background: '#fff',
      'z-index': '1040',
      padding: '0.4em 0.6em',
      'border-radius': '0.5em',
      'font-size': '0.8em',
      border: '1px solid #111',
      display: 'none',
      'white-space': 'nowrap'
    })), b;
  }, c.prototype.stringFormat = function (a, b) {
    var c, d, e, f, g = /%p\.{0,1}(\d{0,})/, h = /%s/, i = /%lx/, j = /%ly/, k = /%x\.{0,1}(\d{0,})/, l = /%y\.{0,1}(\d{0,})/, m = '%x', n = '%y', o = '%ct';
    if ('undefined' != typeof b.series.threshold ? (c = b.datapoint[0], d = b.datapoint[1], e = b.datapoint[2]) : 'undefined' != typeof b.series.lines && b.series.lines.steps ? (c = b.series.datapoints.points[2 * b.dataIndex], d = b.series.datapoints.points[2 * b.dataIndex + 1], e = '') : (c = b.series.data[b.dataIndex][0], d = b.series.data[b.dataIndex][1], e = b.series.data[b.dataIndex][2]), null === b.series.label && b.series.originSeries && (b.series.label = b.series.originSeries.label), 'function' == typeof a && (a = a(b.series.label, c, d, b)), 'undefined' != typeof b.series.percent ? f = b.series.percent : 'undefined' != typeof b.series.percents && (f = b.series.percents[b.dataIndex]), 'number' == typeof f && (a = this.adjustValPrecision(g, a, f)), a = 'undefined' != typeof b.series.label ? a.replace(h, b.series.label) : a.replace(h, ''), a = this.hasAxisLabel('xaxis', b) ? a.replace(i, b.series.xaxis.options.axisLabel) : a.replace(i, ''), a = this.hasAxisLabel('yaxis', b) ? a.replace(j, b.series.yaxis.options.axisLabel) : a.replace(j, ''), this.isTimeMode('xaxis', b) && this.isXDateFormat(b) && (a = a.replace(k, this.timestampToDate(c, this.tooltipOptions.xDateFormat, b.series.xaxis.options))), this.isTimeMode('yaxis', b) && this.isYDateFormat(b) && (a = a.replace(l, this.timestampToDate(d, this.tooltipOptions.yDateFormat, b.series.yaxis.options))), 'number' == typeof c && (a = this.adjustValPrecision(k, a, c)), 'number' == typeof d && (a = this.adjustValPrecision(l, a, d)), 'undefined' != typeof b.series.xaxis.ticks) {
      var p;
      p = this.hasRotatedXAxisTicks(b) ? 'rotatedTicks' : 'ticks';
      var q = b.dataIndex + b.seriesIndex;
      if (b.series.xaxis[p].length > q && !this.isTimeMode('xaxis', b)) {
        var r = this.isCategoriesMode('xaxis', b) ? b.series.xaxis[p][q].label : b.series.xaxis[p][q].v;
        r === c && (a = a.replace(k, b.series.xaxis[p][q].label));
      }
    }
    if ('undefined' != typeof b.series.yaxis.ticks)
      for (var s in b.series.yaxis.ticks)
        if (b.series.yaxis.ticks.hasOwnProperty(s)) {
          var t = this.isCategoriesMode('yaxis', b) ? b.series.yaxis.ticks[s].label : b.series.yaxis.ticks[s].v;
          t === d && (a = a.replace(l, b.series.yaxis.ticks[s].label));
        }
    return 'undefined' != typeof b.series.xaxis.tickFormatter && (a = a.replace(m, b.series.xaxis.tickFormatter(c, b.series.xaxis).replace(/\$/g, '$$'))), 'undefined' != typeof b.series.yaxis.tickFormatter && (a = a.replace(n, b.series.yaxis.tickFormatter(d, b.series.yaxis).replace(/\$/g, '$$'))), e && (a = a.replace(o, e)), a;
  }, c.prototype.isTimeMode = function (a, b) {
    return 'undefined' != typeof b.series[a].options.mode && 'time' === b.series[a].options.mode;
  }, c.prototype.isXDateFormat = function () {
    return 'undefined' != typeof this.tooltipOptions.xDateFormat && null !== this.tooltipOptions.xDateFormat;
  }, c.prototype.isYDateFormat = function () {
    return 'undefined' != typeof this.tooltipOptions.yDateFormat && null !== this.tooltipOptions.yDateFormat;
  }, c.prototype.isCategoriesMode = function (a, b) {
    return 'undefined' != typeof b.series[a].options.mode && 'categories' === b.series[a].options.mode;
  }, c.prototype.timestampToDate = function (b, c, d) {
    var e = a.plot.dateGenerator(b, d);
    return a.plot.formatDate(e, c, this.tooltipOptions.monthNames, this.tooltipOptions.dayNames);
  }, c.prototype.adjustValPrecision = function (a, b, c) {
    var d, e = b.match(a);
    return null !== e && '' !== RegExp.$1 && (d = RegExp.$1, c = c.toFixed(d), b = b.replace(a, c)), b;
  }, c.prototype.hasAxisLabel = function (b, c) {
    return -1 !== a.inArray(this.plotPlugins, 'axisLabels') && 'undefined' != typeof c.series[b].options.axisLabel && c.series[b].options.axisLabel.length > 0;
  }, c.prototype.hasRotatedXAxisTicks = function (b) {
    return -1 !== a.inArray(this.plotPlugins, 'tickRotor') && 'undefined' != typeof b.series.xaxis.rotatedTicks;
  };
  var d = function (a) {
    new c(a);
  };
  a.plot.plugins.push({
    init: d,
    options: b,
    name: 'tooltip',
    version: '0.8.4'
  });
}(jQuery);/* Flot plugin for automatically redrawing plots as the placeholder resizes.

Copyright (c) 2007-2014 IOLA and Ole Laursen.
Licensed under the MIT license.

It works by listening for changes on the placeholder div (through the jQuery
resize event plugin) - if the size changes, it will redraw the plot.

There are no options. If you need to disable the plugin for some plots, you
can just fix the size of their placeholders.

*/
/* Inline dependency:
 * jQuery resize event - v1.1 - 3/14/2010
 * http://benalman.com/projects/jquery-resize-plugin/
 *
 * Copyright (c) 2010 "Cowboy" Ben Alman
 * Dual licensed under the MIT and GPL licenses.
 * http://benalman.com/about/license/
 */
(function ($, e, t) {
  '$:nomunge';
  var i = [], n = $.resize = $.extend($.resize, {}), a, r = false, s = 'setTimeout', u = 'resize', m = u + '-special-event', o = 'pendingDelay', l = 'activeDelay', f = 'throttleWindow';
  n[o] = 200;
  n[l] = 20;
  n[f] = true;
  $.event.special[u] = {
    setup: function () {
      if (!n[f] && this[s]) {
        return false;
      }
      var e = $(this);
      i.push(this);
      e.data(m, {
        w: e.width(),
        h: e.height()
      });
      if (i.length === 1) {
        a = t;
        h();
      }
    },
    teardown: function () {
      if (!n[f] && this[s]) {
        return false;
      }
      var e = $(this);
      for (var t = i.length - 1; t >= 0; t--) {
        if (i[t] == this) {
          i.splice(t, 1);
          break;
        }
      }
      e.removeData(m);
      if (!i.length) {
        if (r) {
          cancelAnimationFrame(a);
        } else {
          clearTimeout(a);
        }
        a = null;
      }
    },
    add: function (e) {
      if (!n[f] && this[s]) {
        return false;
      }
      var i;
      function a(e, n, a) {
        var r = $(this), s = r.data(m) || {};
        s.w = n !== t ? n : r.width();
        s.h = a !== t ? a : r.height();
        i.apply(this, arguments);
      }
      if ($.isFunction(e)) {
        i = e;
        return a;
      } else {
        i = e.handler;
        e.handler = a;
      }
    }
  };
  function h(t) {
    if (r === true) {
      r = t || 1;
    }
    for (var s = i.length - 1; s >= 0; s--) {
      var l = $(i[s]);
      if (l[0] == e || l.is(':visible')) {
        var f = l.width(), c = l.height(), d = l.data(m);
        if (d && (f !== d.w || c !== d.h)) {
          l.trigger(u, [
            d.w = f,
            d.h = c
          ]);
          r = t || true;
        }
      } else {
        d = l.data(m);
        d.w = 0;
        d.h = 0;
      }
    }
    if (a !== null) {
      if (r && (t == null || t - r < 1000)) {
        a = e.requestAnimationFrame(h);
      } else {
        a = setTimeout(h, n[o]);
        r = false;
      }
    }
  }
  if (!e.requestAnimationFrame) {
    e.requestAnimationFrame = function () {
      return e.webkitRequestAnimationFrame || e.mozRequestAnimationFrame || e.oRequestAnimationFrame || e.msRequestAnimationFrame || function (t, i) {
        return e.setTimeout(function () {
          t(new Date().getTime());
        }, n[l]);
      };
    }();
  }
  if (!e.cancelAnimationFrame) {
    e.cancelAnimationFrame = function () {
      return e.webkitCancelRequestAnimationFrame || e.mozCancelRequestAnimationFrame || e.oCancelRequestAnimationFrame || e.msCancelRequestAnimationFrame || clearTimeout;
    }();
  }
}(jQuery, this));
(function ($) {
  var options = {};
  // no options
  function init(plot) {
    function onResize() {
      var placeholder = plot.getPlaceholder();
      // somebody might have hidden us and we can't plot
      // when we don't have the dimensions
      if (placeholder.width() == 0 || placeholder.height() == 0)
        return;
      plot.resize();
      plot.setupGrid();
      plot.draw();
    }
    function bindEvents(plot, eventHolder) {
      plot.getPlaceholder().resize(onResize);
    }
    function shutdown(plot, eventHolder) {
      plot.getPlaceholder().unbind('resize', onResize);
    }
    plot.hooks.bindEvents.push(bindEvents);
    plot.hooks.shutdown.push(shutdown);
  }
  $.plot.plugins.push({
    init: init,
    options: options,
    name: 'resize',
    version: '1.0'
  });
}(jQuery));/* Flot plugin for rendering pie charts.

Copyright (c) 2007-2014 IOLA and Ole Laursen.
Licensed under the MIT license.

The plugin assumes that each series has a single data value, and that each
value is a positive integer or zero.  Negative numbers don't make sense for a
pie chart, and have unpredictable results.  The values do NOT need to be
passed in as percentages; the plugin will calculate the total and per-slice
percentages internally.

* Created by Brian Medendorp

* Updated with contributions from btburnett3, Anthony Aragues and Xavi Ivars

The plugin supports these options:

	series: {
		pie: {
			show: true/false
			radius: 0-1 for percentage of fullsize, or a specified pixel length, or 'auto'
			innerRadius: 0-1 for percentage of fullsize or a specified pixel length, for creating a donut effect
			startAngle: 0-2 factor of PI used for starting angle (in radians) i.e 3/2 starts at the top, 0 and 2 have the same result
			tilt: 0-1 for percentage to tilt the pie, where 1 is no tilt, and 0 is completely flat (nothing will show)
			offset: {
				top: integer value to move the pie up or down
				left: integer value to move the pie left or right, or 'auto'
			},
			stroke: {
				color: any hexidecimal color value (other formats may or may not work, so best to stick with something like '#FFF')
				width: integer pixel width of the stroke
			},
			label: {
				show: true/false, or 'auto'
				formatter:  a user-defined function that modifies the text/style of the label text
				radius: 0-1 for percentage of fullsize, or a specified pixel length
				background: {
					color: any hexidecimal color value (other formats may or may not work, so best to stick with something like '#000')
					opacity: 0-1
				},
				threshold: 0-1 for the percentage value at which to hide labels (if they're too small)
			},
			combine: {
				threshold: 0-1 for the percentage value at which to combine slices (if they're too small)
				color: any hexidecimal color value (other formats may or may not work, so best to stick with something like '#CCC'), if null, the plugin will automatically use the color of the first slice to be combined
				label: any text value of what the combined slice should be labeled
			}
			highlight: {
				opacity: 0-1
			}
		}
	}

More detail and specific examples can be found in the included HTML file.

*/
(function ($) {
  // Maximum redraw attempts when fitting labels within the plot
  var REDRAW_ATTEMPTS = 10;
  // Factor by which to shrink the pie when fitting labels within the plot
  var REDRAW_SHRINK = 0.95;
  function init(plot) {
    var canvas = null, target = null, options = null, maxRadius = null, centerLeft = null, centerTop = null, processed = false, ctx = null;
    // interactive variables
    var highlights = [];
    // add hook to determine if pie plugin in enabled, and then perform necessary operations
    plot.hooks.processOptions.push(function (plot, options) {
      if (options.series.pie.show) {
        options.grid.show = false;
        // set labels.show
        if (options.series.pie.label.show == 'auto') {
          if (options.legend.show) {
            options.series.pie.label.show = false;
          } else {
            options.series.pie.label.show = true;
          }
        }
        // set radius
        if (options.series.pie.radius == 'auto') {
          if (options.series.pie.label.show) {
            options.series.pie.radius = 3 / 4;
          } else {
            options.series.pie.radius = 1;
          }
        }
        // ensure sane tilt
        if (options.series.pie.tilt > 1) {
          options.series.pie.tilt = 1;
        } else if (options.series.pie.tilt < 0) {
          options.series.pie.tilt = 0;
        }
      }
    });
    plot.hooks.bindEvents.push(function (plot, eventHolder) {
      var options = plot.getOptions();
      if (options.series.pie.show) {
        if (options.grid.hoverable) {
          eventHolder.unbind('mousemove').mousemove(onMouseMove);
        }
        if (options.grid.clickable) {
          eventHolder.unbind('click').click(onClick);
        }
      }
    });
    plot.hooks.processDatapoints.push(function (plot, series, data, datapoints) {
      var options = plot.getOptions();
      if (options.series.pie.show) {
        processDatapoints(plot, series, data, datapoints);
      }
    });
    plot.hooks.drawOverlay.push(function (plot, octx) {
      var options = plot.getOptions();
      if (options.series.pie.show) {
        drawOverlay(plot, octx);
      }
    });
    plot.hooks.draw.push(function (plot, newCtx) {
      var options = plot.getOptions();
      if (options.series.pie.show) {
        draw(plot, newCtx);
      }
    });
    function processDatapoints(plot, series, datapoints) {
      if (!processed) {
        processed = true;
        canvas = plot.getCanvas();
        target = $(canvas).parent();
        options = plot.getOptions();
        plot.setData(combine(plot.getData()));
      }
    }
    function combine(data) {
      var total = 0, combined = 0, numCombined = 0, color = options.series.pie.combine.color, newdata = [];
      // Fix up the raw data from Flot, ensuring the data is numeric
      for (var i = 0; i < data.length; ++i) {
        var value = data[i].data;
        // If the data is an array, we'll assume that it's a standard
        // Flot x-y pair, and are concerned only with the second value.
        // Note how we use the original array, rather than creating a
        // new one; this is more efficient and preserves any extra data
        // that the user may have stored in higher indexes.
        if ($.isArray(value) && value.length == 1) {
          value = value[0];
        }
        if ($.isArray(value)) {
          // Equivalent to $.isNumeric() but compatible with jQuery < 1.7
          if (!isNaN(parseFloat(value[1])) && isFinite(value[1])) {
            value[1] = +value[1];
          } else {
            value[1] = 0;
          }
        } else if (!isNaN(parseFloat(value)) && isFinite(value)) {
          value = [
            1,
            +value
          ];
        } else {
          value = [
            1,
            0
          ];
        }
        data[i].data = [value];
      }
      // Sum up all the slices, so we can calculate percentages for each
      for (var i = 0; i < data.length; ++i) {
        total += data[i].data[0][1];
      }
      // Count the number of slices with percentages below the combine
      // threshold; if it turns out to be just one, we won't combine.
      for (var i = 0; i < data.length; ++i) {
        var value = data[i].data[0][1];
        if (value / total <= options.series.pie.combine.threshold) {
          combined += value;
          numCombined++;
          if (!color) {
            color = data[i].color;
          }
        }
      }
      for (var i = 0; i < data.length; ++i) {
        var value = data[i].data[0][1];
        if (numCombined < 2 || value / total > options.series.pie.combine.threshold) {
          newdata.push($.extend(data[i], {
            data: [[
                1,
                value
              ]],
            color: data[i].color,
            label: data[i].label,
            angle: value * Math.PI * 2 / total,
            percent: value / (total / 100)
          }));
        }
      }
      if (numCombined > 1) {
        newdata.push({
          data: [[
              1,
              combined
            ]],
          color: color,
          label: options.series.pie.combine.label,
          angle: combined * Math.PI * 2 / total,
          percent: combined / (total / 100)
        });
      }
      return newdata;
    }
    function draw(plot, newCtx) {
      if (!target) {
        return;  // if no series were passed
      }
      var canvasWidth = plot.getPlaceholder().width(), canvasHeight = plot.getPlaceholder().height(), legendWidth = target.children().filter('.legend').children().width() || 0;
      ctx = newCtx;
      // WARNING: HACK! REWRITE THIS CODE AS SOON AS POSSIBLE!
      // When combining smaller slices into an 'other' slice, we need to
      // add a new series.  Since Flot gives plugins no way to modify the
      // list of series, the pie plugin uses a hack where the first call
      // to processDatapoints results in a call to setData with the new
      // list of series, then subsequent processDatapoints do nothing.
      // The plugin-global 'processed' flag is used to control this hack;
      // it starts out false, and is set to true after the first call to
      // processDatapoints.
      // Unfortunately this turns future setData calls into no-ops; they
      // call processDatapoints, the flag is true, and nothing happens.
      // To fix this we'll set the flag back to false here in draw, when
      // all series have been processed, so the next sequence of calls to
      // processDatapoints once again starts out with a slice-combine.
      // This is really a hack; in 0.9 we need to give plugins a proper
      // way to modify series before any processing begins.
      processed = false;
      // calculate maximum radius and center point
      maxRadius = Math.min(canvasWidth, canvasHeight / options.series.pie.tilt) / 2;
      centerTop = canvasHeight / 2 + options.series.pie.offset.top;
      centerLeft = canvasWidth / 2;
      if (options.series.pie.offset.left == 'auto') {
        if (options.legend.position.match('w')) {
          centerLeft += legendWidth / 2;
        } else {
          centerLeft -= legendWidth / 2;
        }
        if (centerLeft < maxRadius) {
          centerLeft = maxRadius;
        } else if (centerLeft > canvasWidth - maxRadius) {
          centerLeft = canvasWidth - maxRadius;
        }
      } else {
        centerLeft += options.series.pie.offset.left;
      }
      var slices = plot.getData(), attempts = 0;
      // Keep shrinking the pie's radius until drawPie returns true,
      // indicating that all the labels fit, or we try too many times.
      do {
        if (attempts > 0) {
          maxRadius *= REDRAW_SHRINK;
        }
        attempts += 1;
        clear();
        if (options.series.pie.tilt <= 0.8) {
          drawShadow();
        }
      } while (!drawPie() && attempts < REDRAW_ATTEMPTS);
      if (attempts >= REDRAW_ATTEMPTS) {
        clear();
        target.prepend('<div class=\'error\'>Could not draw pie with labels contained inside canvas</div>');
      }
      if (plot.setSeries && plot.insertLegend) {
        plot.setSeries(slices);
        plot.insertLegend();
      }
      // we're actually done at this point, just defining internal functions at this point
      function clear() {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        target.children().filter('.pieLabel, .pieLabelBackground').remove();
      }
      function drawShadow() {
        var shadowLeft = options.series.pie.shadow.left;
        var shadowTop = options.series.pie.shadow.top;
        var edge = 10;
        var alpha = options.series.pie.shadow.alpha;
        var radius = options.series.pie.radius > 1 ? options.series.pie.radius : maxRadius * options.series.pie.radius;
        if (radius >= canvasWidth / 2 - shadowLeft || radius * options.series.pie.tilt >= canvasHeight / 2 - shadowTop || radius <= edge) {
          return;  // shadow would be outside canvas, so don't draw it
        }
        ctx.save();
        ctx.translate(shadowLeft, shadowTop);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#000';
        // center and rotate to starting position
        ctx.translate(centerLeft, centerTop);
        ctx.scale(1, options.series.pie.tilt);
        //radius -= edge;
        for (var i = 1; i <= edge; i++) {
          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, Math.PI * 2, false);
          ctx.fill();
          radius -= i;
        }
        ctx.restore();
      }
      function drawPie() {
        var startAngle = Math.PI * options.series.pie.startAngle;
        var radius = options.series.pie.radius > 1 ? options.series.pie.radius : maxRadius * options.series.pie.radius;
        // center and rotate to starting position
        ctx.save();
        ctx.translate(centerLeft, centerTop);
        ctx.scale(1, options.series.pie.tilt);
        //ctx.rotate(startAngle); // start at top; -- This doesn't work properly in Opera
        // draw slices
        ctx.save();
        var currentAngle = startAngle;
        for (var i = 0; i < slices.length; ++i) {
          slices[i].startAngle = currentAngle;
          drawSlice(slices[i].angle, slices[i].color, true);
        }
        ctx.restore();
        // draw slice outlines
        if (options.series.pie.stroke.width > 0) {
          ctx.save();
          ctx.lineWidth = options.series.pie.stroke.width;
          currentAngle = startAngle;
          for (var i = 0; i < slices.length; ++i) {
            drawSlice(slices[i].angle, options.series.pie.stroke.color, false);
          }
          ctx.restore();
        }
        // draw donut hole
        drawDonutHole(ctx);
        ctx.restore();
        // Draw the labels, returning true if they fit within the plot
        if (options.series.pie.label.show) {
          return drawLabels();
        } else
          return true;
        function drawSlice(angle, color, fill) {
          if (angle <= 0 || isNaN(angle)) {
            return;
          }
          if (fill) {
            ctx.fillStyle = color;
          } else {
            ctx.strokeStyle = color;
            ctx.lineJoin = 'round';
          }
          ctx.beginPath();
          if (Math.abs(angle - Math.PI * 2) > 1e-9) {
            ctx.moveTo(0, 0);  // Center of the pie
          }
          //ctx.arc(0, 0, radius, 0, angle, false); // This doesn't work properly in Opera
          ctx.arc(0, 0, radius, currentAngle, currentAngle + angle / 2, false);
          ctx.arc(0, 0, radius, currentAngle + angle / 2, currentAngle + angle, false);
          ctx.closePath();
          //ctx.rotate(angle); // This doesn't work properly in Opera
          currentAngle += angle;
          if (fill) {
            ctx.fill();
          } else {
            ctx.stroke();
          }
        }
        function drawLabels() {
          var currentAngle = startAngle;
          var radius = options.series.pie.label.radius > 1 ? options.series.pie.label.radius : maxRadius * options.series.pie.label.radius;
          for (var i = 0; i < slices.length; ++i) {
            if (slices[i].percent >= options.series.pie.label.threshold * 100) {
              if (!drawLabel(slices[i], currentAngle, i)) {
                return false;
              }
            }
            currentAngle += slices[i].angle;
          }
          return true;
          function drawLabel(slice, startAngle, index) {
            if (slice.data[0][1] == 0) {
              return true;
            }
            // format label text
            var lf = options.legend.labelFormatter, text, plf = options.series.pie.label.formatter;
            if (lf) {
              text = lf(slice.label, slice);
            } else {
              text = slice.label;
            }
            if (plf) {
              text = plf(text, slice);
            }
            var halfAngle = (startAngle + slice.angle + startAngle) / 2;
            var x = centerLeft + Math.round(Math.cos(halfAngle) * radius);
            var y = centerTop + Math.round(Math.sin(halfAngle) * radius) * options.series.pie.tilt;
            var html = '<span class=\'pieLabel\' id=\'pieLabel' + index + '\' style=\'position:absolute;top:' + y + 'px;left:' + x + 'px;\'>' + text + '</span>';
            target.append(html);
            var label = target.children('#pieLabel' + index);
            var labelTop = y - label.height() / 2;
            var labelLeft = x - label.width() / 2;
            label.css('top', labelTop);
            label.css('left', labelLeft);
            // check to make sure that the label is not outside the canvas
            if (0 - labelTop > 0 || 0 - labelLeft > 0 || canvasHeight - (labelTop + label.height()) < 0 || canvasWidth - (labelLeft + label.width()) < 0) {
              return false;
            }
            if (options.series.pie.label.background.opacity != 0) {
              // put in the transparent background separately to avoid blended labels and label boxes
              var c = options.series.pie.label.background.color;
              if (c == null) {
                c = slice.color;
              }
              var pos = 'top:' + labelTop + 'px;left:' + labelLeft + 'px;';
              $('<div class=\'pieLabelBackground\' style=\'position:absolute;width:' + label.width() + 'px;height:' + label.height() + 'px;' + pos + 'background-color:' + c + ';\'></div>').css('opacity', options.series.pie.label.background.opacity).insertBefore(label);
            }
            return true;
          }  // end individual label function
        }  // end drawLabels function
      }  // end drawPie function
    }
    // end draw function
    // Placed here because it needs to be accessed from multiple locations
    function drawDonutHole(layer) {
      if (options.series.pie.innerRadius > 0) {
        // subtract the center
        layer.save();
        var innerRadius = options.series.pie.innerRadius > 1 ? options.series.pie.innerRadius : maxRadius * options.series.pie.innerRadius;
        layer.globalCompositeOperation = 'destination-out';
        // this does not work with excanvas, but it will fall back to using the stroke color
        layer.beginPath();
        layer.fillStyle = options.series.pie.stroke.color;
        layer.arc(0, 0, innerRadius, 0, Math.PI * 2, false);
        layer.fill();
        layer.closePath();
        layer.restore();
        // add inner stroke
        layer.save();
        layer.beginPath();
        layer.strokeStyle = options.series.pie.stroke.color;
        layer.arc(0, 0, innerRadius, 0, Math.PI * 2, false);
        layer.stroke();
        layer.closePath();
        layer.restore();  // TODO: add extra shadow inside hole (with a mask) if the pie is tilted.
      }
    }
    //-- Additional Interactive related functions --
    function isPointInPoly(poly, pt) {
      for (var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
        (poly[i][1] <= pt[1] && pt[1] < poly[j][1] || poly[j][1] <= pt[1] && pt[1] < poly[i][1]) && pt[0] < (poly[j][0] - poly[i][0]) * (pt[1] - poly[i][1]) / (poly[j][1] - poly[i][1]) + poly[i][0] && (c = !c);
      return c;
    }
    function findNearbySlice(mouseX, mouseY) {
      var slices = plot.getData(), options = plot.getOptions(), radius = options.series.pie.radius > 1 ? options.series.pie.radius : maxRadius * options.series.pie.radius, x, y;
      for (var i = 0; i < slices.length; ++i) {
        var s = slices[i];
        if (s.pie.show) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(0, 0);
          // Center of the pie
          //ctx.scale(1, options.series.pie.tilt);	// this actually seems to break everything when here.
          ctx.arc(0, 0, radius, s.startAngle, s.startAngle + s.angle / 2, false);
          ctx.arc(0, 0, radius, s.startAngle + s.angle / 2, s.startAngle + s.angle, false);
          ctx.closePath();
          x = mouseX - centerLeft;
          y = mouseY - centerTop;
          if (ctx.isPointInPath) {
            if (ctx.isPointInPath(mouseX - centerLeft, mouseY - centerTop)) {
              ctx.restore();
              return {
                datapoint: [
                  s.percent,
                  s.data
                ],
                dataIndex: 0,
                series: s,
                seriesIndex: i
              };
            }
          } else {
            // excanvas for IE doesn;t support isPointInPath, this is a workaround.
            var p1X = radius * Math.cos(s.startAngle), p1Y = radius * Math.sin(s.startAngle), p2X = radius * Math.cos(s.startAngle + s.angle / 4), p2Y = radius * Math.sin(s.startAngle + s.angle / 4), p3X = radius * Math.cos(s.startAngle + s.angle / 2), p3Y = radius * Math.sin(s.startAngle + s.angle / 2), p4X = radius * Math.cos(s.startAngle + s.angle / 1.5), p4Y = radius * Math.sin(s.startAngle + s.angle / 1.5), p5X = radius * Math.cos(s.startAngle + s.angle), p5Y = radius * Math.sin(s.startAngle + s.angle), arrPoly = [
                [
                  0,
                  0
                ],
                [
                  p1X,
                  p1Y
                ],
                [
                  p2X,
                  p2Y
                ],
                [
                  p3X,
                  p3Y
                ],
                [
                  p4X,
                  p4Y
                ],
                [
                  p5X,
                  p5Y
                ]
              ], arrPoint = [
                x,
                y
              ];
            // TODO: perhaps do some mathmatical trickery here with the Y-coordinate to compensate for pie tilt?
            if (isPointInPoly(arrPoly, arrPoint)) {
              ctx.restore();
              return {
                datapoint: [
                  s.percent,
                  s.data
                ],
                dataIndex: 0,
                series: s,
                seriesIndex: i
              };
            }
          }
          ctx.restore();
        }
      }
      return null;
    }
    function onMouseMove(e) {
      triggerClickHoverEvent('plothover', e);
    }
    function onClick(e) {
      triggerClickHoverEvent('plotclick', e);
    }
    // trigger click or hover event (they send the same parameters so we share their code)
    function triggerClickHoverEvent(eventname, e) {
      var offset = plot.offset();
      var canvasX = parseInt(e.pageX - offset.left);
      var canvasY = parseInt(e.pageY - offset.top);
      var item = findNearbySlice(canvasX, canvasY);
      if (options.grid.autoHighlight) {
        // clear auto-highlights
        for (var i = 0; i < highlights.length; ++i) {
          var h = highlights[i];
          if (h.auto == eventname && !(item && h.series == item.series)) {
            unhighlight(h.series);
          }
        }
      }
      // highlight the slice
      if (item) {
        highlight(item.series, eventname);
      }
      // trigger any hover bind events
      var pos = {
          pageX: e.pageX,
          pageY: e.pageY
        };
      target.trigger(eventname, [
        pos,
        item
      ]);
    }
    function highlight(s, auto) {
      //if (typeof s == "number") {
      //	s = series[s];
      //}
      var i = indexOfHighlight(s);
      if (i == -1) {
        highlights.push({
          series: s,
          auto: auto
        });
        plot.triggerRedrawOverlay();
      } else if (!auto) {
        highlights[i].auto = false;
      }
    }
    function unhighlight(s) {
      if (s == null) {
        highlights = [];
        plot.triggerRedrawOverlay();
      }
      //if (typeof s == "number") {
      //	s = series[s];
      //}
      var i = indexOfHighlight(s);
      if (i != -1) {
        highlights.splice(i, 1);
        plot.triggerRedrawOverlay();
      }
    }
    function indexOfHighlight(s) {
      for (var i = 0; i < highlights.length; ++i) {
        var h = highlights[i];
        if (h.series == s)
          return i;
      }
      return -1;
    }
    function drawOverlay(plot, octx) {
      var options = plot.getOptions();
      var radius = options.series.pie.radius > 1 ? options.series.pie.radius : maxRadius * options.series.pie.radius;
      octx.save();
      octx.translate(centerLeft, centerTop);
      octx.scale(1, options.series.pie.tilt);
      for (var i = 0; i < highlights.length; ++i) {
        drawHighlight(highlights[i].series);
      }
      drawDonutHole(octx);
      octx.restore();
      function drawHighlight(series) {
        if (series.angle <= 0 || isNaN(series.angle)) {
          return;
        }
        //octx.fillStyle = parseColor(options.series.pie.highlight.color).scale(null, null, null, options.series.pie.highlight.opacity).toString();
        octx.fillStyle = 'rgba(255, 255, 255, ' + options.series.pie.highlight.opacity + ')';
        // this is temporary until we have access to parseColor
        octx.beginPath();
        if (Math.abs(series.angle - Math.PI * 2) > 1e-9) {
          octx.moveTo(0, 0);  // Center of the pie
        }
        octx.arc(0, 0, radius, series.startAngle, series.startAngle + series.angle / 2, false);
        octx.arc(0, 0, radius, series.startAngle + series.angle / 2, series.startAngle + series.angle, false);
        octx.closePath();
        octx.fill();
      }
    }
  }
  // end init (plugin body)
  // define pie specific options and their default values
  var options = {
      series: {
        pie: {
          show: false,
          radius: 'auto',
          innerRadius: 0,
          startAngle: 3 / 2,
          tilt: 1,
          shadow: {
            left: 5,
            top: 15,
            alpha: 0.02
          },
          offset: {
            top: 0,
            left: 'auto'
          },
          stroke: {
            color: '#fff',
            width: 1
          },
          label: {
            show: 'auto',
            formatter: function (label, slice) {
              return '<div style=\'font-size:x-small;text-align:center;padding:2px;color:' + slice.color + ';\'>' + label + '<br/>' + Math.round(slice.percent) + '%</div>';
            },
            radius: 1,
            background: {
              color: null,
              opacity: 0
            },
            threshold: 0
          },
          combine: {
            threshold: -1,
            color: null,
            label: 'Other'
          },
          highlight: { opacity: 0.5 }
        }
      }
    };
  $.plot.plugins.push({
    init: init,
    options: options,
    name: 'pie',
    version: '1.1'
  });
}(jQuery));/* Pretty handling of time axes.

Copyright (c) 2007-2014 IOLA and Ole Laursen.
Licensed under the MIT license.

Set axis.mode to "time" to enable. See the section "Time series data" in
API.txt for details.

*/
(function ($) {
  var options = {
      xaxis: {
        timezone: null,
        timeformat: null,
        twelveHourClock: false,
        monthNames: null
      }
    };
  // round to nearby lower multiple of base
  function floorInBase(n, base) {
    return base * Math.floor(n / base);
  }
  // Returns a string with the date d formatted according to fmt.
  // A subset of the Open Group's strftime format is supported.
  function formatDate(d, fmt, monthNames, dayNames) {
    if (typeof d.strftime == 'function') {
      return d.strftime(fmt);
    }
    var leftPad = function (n, pad) {
      n = '' + n;
      pad = '' + (pad == null ? '0' : pad);
      return n.length == 1 ? pad + n : n;
    };
    var r = [];
    var escape = false;
    var hours = d.getHours();
    var isAM = hours < 12;
    if (monthNames == null) {
      monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec'
      ];
    }
    if (dayNames == null) {
      dayNames = [
        'Sun',
        'Mon',
        'Tue',
        'Wed',
        'Thu',
        'Fri',
        'Sat'
      ];
    }
    var hours12;
    if (hours > 12) {
      hours12 = hours - 12;
    } else if (hours == 0) {
      hours12 = 12;
    } else {
      hours12 = hours;
    }
    for (var i = 0; i < fmt.length; ++i) {
      var c = fmt.charAt(i);
      if (escape) {
        switch (c) {
        case 'a':
          c = '' + dayNames[d.getDay()];
          break;
        case 'b':
          c = '' + monthNames[d.getMonth()];
          break;
        case 'd':
          c = leftPad(d.getDate());
          break;
        case 'e':
          c = leftPad(d.getDate(), ' ');
          break;
        case 'h':
        // For back-compat with 0.7; remove in 1.0
        case 'H':
          c = leftPad(hours);
          break;
        case 'I':
          c = leftPad(hours12);
          break;
        case 'l':
          c = leftPad(hours12, ' ');
          break;
        case 'm':
          c = leftPad(d.getMonth() + 1);
          break;
        case 'M':
          c = leftPad(d.getMinutes());
          break;
        // quarters not in Open Group's strftime specification
        case 'q':
          c = '' + (Math.floor(d.getMonth() / 3) + 1);
          break;
        case 'S':
          c = leftPad(d.getSeconds());
          break;
        case 'y':
          c = leftPad(d.getFullYear() % 100);
          break;
        case 'Y':
          c = '' + d.getFullYear();
          break;
        case 'p':
          c = isAM ? '' + 'am' : '' + 'pm';
          break;
        case 'P':
          c = isAM ? '' + 'AM' : '' + 'PM';
          break;
        case 'w':
          c = '' + d.getDay();
          break;
        }
        r.push(c);
        escape = false;
      } else {
        if (c == '%') {
          escape = true;
        } else {
          r.push(c);
        }
      }
    }
    return r.join('');
  }
  // To have a consistent view of time-based data independent of which time
  // zone the client happens to be in we need a date-like object independent
  // of time zones.  This is done through a wrapper that only calls the UTC
  // versions of the accessor methods.
  function makeUtcWrapper(d) {
    function addProxyMethod(sourceObj, sourceMethod, targetObj, targetMethod) {
      sourceObj[sourceMethod] = function () {
        return targetObj[targetMethod].apply(targetObj, arguments);
      };
    }
    ;
    var utc = { date: d };
    // support strftime, if found
    if (d.strftime != undefined) {
      addProxyMethod(utc, 'strftime', d, 'strftime');
    }
    addProxyMethod(utc, 'getTime', d, 'getTime');
    addProxyMethod(utc, 'setTime', d, 'setTime');
    var props = [
        'Date',
        'Day',
        'FullYear',
        'Hours',
        'Milliseconds',
        'Minutes',
        'Month',
        'Seconds'
      ];
    for (var p = 0; p < props.length; p++) {
      addProxyMethod(utc, 'get' + props[p], d, 'getUTC' + props[p]);
      addProxyMethod(utc, 'set' + props[p], d, 'setUTC' + props[p]);
    }
    return utc;
  }
  ;
  // select time zone strategy.  This returns a date-like object tied to the
  // desired timezone
  function dateGenerator(ts, opts) {
    if (opts.timezone == 'browser') {
      return new Date(ts);
    } else if (!opts.timezone || opts.timezone == 'utc') {
      return makeUtcWrapper(new Date(ts));
    } else if (typeof timezoneJS != 'undefined' && typeof timezoneJS.Date != 'undefined') {
      var d = new timezoneJS.Date();
      // timezone-js is fickle, so be sure to set the time zone before
      // setting the time.
      d.setTimezone(opts.timezone);
      d.setTime(ts);
      return d;
    } else {
      return makeUtcWrapper(new Date(ts));
    }
  }
  // map of app. size of time units in milliseconds
  var timeUnitSize = {
      'second': 1000,
      'minute': 60 * 1000,
      'hour': 60 * 60 * 1000,
      'day': 24 * 60 * 60 * 1000,
      'month': 30 * 24 * 60 * 60 * 1000,
      'quarter': 3 * 30 * 24 * 60 * 60 * 1000,
      'year': 365.2425 * 24 * 60 * 60 * 1000
    };
  // the allowed tick sizes, after 1 year we use
  // an integer algorithm
  var baseSpec = [
      [
        1,
        'second'
      ],
      [
        2,
        'second'
      ],
      [
        5,
        'second'
      ],
      [
        10,
        'second'
      ],
      [
        30,
        'second'
      ],
      [
        1,
        'minute'
      ],
      [
        2,
        'minute'
      ],
      [
        5,
        'minute'
      ],
      [
        10,
        'minute'
      ],
      [
        30,
        'minute'
      ],
      [
        1,
        'hour'
      ],
      [
        2,
        'hour'
      ],
      [
        4,
        'hour'
      ],
      [
        8,
        'hour'
      ],
      [
        12,
        'hour'
      ],
      [
        1,
        'day'
      ],
      [
        2,
        'day'
      ],
      [
        3,
        'day'
      ],
      [
        0.25,
        'month'
      ],
      [
        0.5,
        'month'
      ],
      [
        1,
        'month'
      ],
      [
        2,
        'month'
      ]
    ];
  // we don't know which variant(s) we'll need yet, but generating both is
  // cheap
  var specMonths = baseSpec.concat([
      [
        3,
        'month'
      ],
      [
        6,
        'month'
      ],
      [
        1,
        'year'
      ]
    ]);
  var specQuarters = baseSpec.concat([
      [
        1,
        'quarter'
      ],
      [
        2,
        'quarter'
      ],
      [
        1,
        'year'
      ]
    ]);
  function init(plot) {
    plot.hooks.processOptions.push(function (plot, options) {
      $.each(plot.getAxes(), function (axisName, axis) {
        var opts = axis.options;
        if (opts.mode == 'time') {
          axis.tickGenerator = function (axis) {
            var ticks = [];
            var d = dateGenerator(axis.min, opts);
            var minSize = 0;
            // make quarter use a possibility if quarters are
            // mentioned in either of these options
            var spec = opts.tickSize && opts.tickSize[1] === 'quarter' || opts.minTickSize && opts.minTickSize[1] === 'quarter' ? specQuarters : specMonths;
            if (opts.minTickSize != null) {
              if (typeof opts.tickSize == 'number') {
                minSize = opts.tickSize;
              } else {
                minSize = opts.minTickSize[0] * timeUnitSize[opts.minTickSize[1]];
              }
            }
            for (var i = 0; i < spec.length - 1; ++i) {
              if (axis.delta < (spec[i][0] * timeUnitSize[spec[i][1]] + spec[i + 1][0] * timeUnitSize[spec[i + 1][1]]) / 2 && spec[i][0] * timeUnitSize[spec[i][1]] >= minSize) {
                break;
              }
            }
            var size = spec[i][0];
            var unit = spec[i][1];
            // special-case the possibility of several years
            if (unit == 'year') {
              // if given a minTickSize in years, just use it,
              // ensuring that it's an integer
              if (opts.minTickSize != null && opts.minTickSize[1] == 'year') {
                size = Math.floor(opts.minTickSize[0]);
              } else {
                var magn = Math.pow(10, Math.floor(Math.log(axis.delta / timeUnitSize.year) / Math.LN10));
                var norm = axis.delta / timeUnitSize.year / magn;
                if (norm < 1.5) {
                  size = 1;
                } else if (norm < 3) {
                  size = 2;
                } else if (norm < 7.5) {
                  size = 5;
                } else {
                  size = 10;
                }
                size *= magn;
              }
              // minimum size for years is 1
              if (size < 1) {
                size = 1;
              }
            }
            axis.tickSize = opts.tickSize || [
              size,
              unit
            ];
            var tickSize = axis.tickSize[0];
            unit = axis.tickSize[1];
            var step = tickSize * timeUnitSize[unit];
            if (unit == 'second') {
              d.setSeconds(floorInBase(d.getSeconds(), tickSize));
            } else if (unit == 'minute') {
              d.setMinutes(floorInBase(d.getMinutes(), tickSize));
            } else if (unit == 'hour') {
              d.setHours(floorInBase(d.getHours(), tickSize));
            } else if (unit == 'month') {
              d.setMonth(floorInBase(d.getMonth(), tickSize));
            } else if (unit == 'quarter') {
              d.setMonth(3 * floorInBase(d.getMonth() / 3, tickSize));
            } else if (unit == 'year') {
              d.setFullYear(floorInBase(d.getFullYear(), tickSize));
            }
            // reset smaller components
            d.setMilliseconds(0);
            if (step >= timeUnitSize.minute) {
              d.setSeconds(0);
            }
            if (step >= timeUnitSize.hour) {
              d.setMinutes(0);
            }
            if (step >= timeUnitSize.day) {
              d.setHours(0);
            }
            if (step >= timeUnitSize.day * 4) {
              d.setDate(1);
            }
            if (step >= timeUnitSize.month * 2) {
              d.setMonth(floorInBase(d.getMonth(), 3));
            }
            if (step >= timeUnitSize.quarter * 2) {
              d.setMonth(floorInBase(d.getMonth(), 6));
            }
            if (step >= timeUnitSize.year) {
              d.setMonth(0);
            }
            var carry = 0;
            var v = Number.NaN;
            var prev;
            do {
              prev = v;
              v = d.getTime();
              ticks.push(v);
              if (unit == 'month' || unit == 'quarter') {
                if (tickSize < 1) {
                  // a bit complicated - we'll divide the
                  // month/quarter up but we need to take
                  // care of fractions so we don't end up in
                  // the middle of a day
                  d.setDate(1);
                  var start = d.getTime();
                  d.setMonth(d.getMonth() + (unit == 'quarter' ? 3 : 1));
                  var end = d.getTime();
                  d.setTime(v + carry * timeUnitSize.hour + (end - start) * tickSize);
                  carry = d.getHours();
                  d.setHours(0);
                } else {
                  d.setMonth(d.getMonth() + tickSize * (unit == 'quarter' ? 3 : 1));
                }
              } else if (unit == 'year') {
                d.setFullYear(d.getFullYear() + tickSize);
              } else {
                d.setTime(v + step);
              }
            } while (v < axis.max && v != prev);
            return ticks;
          };
          axis.tickFormatter = function (v, axis) {
            var d = dateGenerator(v, axis.options);
            // first check global format
            if (opts.timeformat != null) {
              return formatDate(d, opts.timeformat, opts.monthNames, opts.dayNames);
            }
            // possibly use quarters if quarters are mentioned in
            // any of these places
            var useQuarters = axis.options.tickSize && axis.options.tickSize[1] == 'quarter' || axis.options.minTickSize && axis.options.minTickSize[1] == 'quarter';
            var t = axis.tickSize[0] * timeUnitSize[axis.tickSize[1]];
            var span = axis.max - axis.min;
            var suffix = opts.twelveHourClock ? ' %p' : '';
            var hourCode = opts.twelveHourClock ? '%I' : '%H';
            var fmt;
            if (t < timeUnitSize.minute) {
              fmt = hourCode + ':%M:%S' + suffix;
            } else if (t < timeUnitSize.day) {
              if (span < 2 * timeUnitSize.day) {
                fmt = hourCode + ':%M' + suffix;
              } else {
                fmt = '%b %d ' + hourCode + ':%M' + suffix;
              }
            } else if (t < timeUnitSize.month) {
              fmt = '%b %d';
            } else if (useQuarters && t < timeUnitSize.quarter || !useQuarters && t < timeUnitSize.year) {
              if (span < timeUnitSize.year) {
                fmt = '%b';
              } else {
                fmt = '%b %Y';
              }
            } else if (useQuarters && t < timeUnitSize.year) {
              if (span < timeUnitSize.year) {
                fmt = 'Q%q';
              } else {
                fmt = 'Q%q %Y';
              }
            } else {
              fmt = '%Y';
            }
            var rt = formatDate(d, fmt, opts.monthNames, opts.dayNames);
            return rt;
          };
        }
      });
    });
  }
  $.plot.plugins.push({
    init: init,
    options: options,
    name: 'time',
    version: '1.0'
  });
  // Time-axis support used to be in Flot core, which exposed the
  // formatDate function on the plot object.  Various plugins depend
  // on the function, so we need to re-expose it here.
  $.plot.formatDate = formatDate;
  $.plot.dateGenerator = dateGenerator;
}(jQuery));/* Flot plugin for plotting textual data or categories.

Copyright (c) 2007-2014 IOLA and Ole Laursen.
Licensed under the MIT license.

Consider a dataset like [["February", 34], ["March", 20], ...]. This plugin
allows you to plot such a dataset directly.

To enable it, you must specify mode: "categories" on the axis with the textual
labels, e.g.

	$.plot("#placeholder", data, { xaxis: { mode: "categories" } });

By default, the labels are ordered as they are met in the data series. If you
need a different ordering, you can specify "categories" on the axis options
and list the categories there:

	xaxis: {
		mode: "categories",
		categories: ["February", "March", "April"]
	}

If you need to customize the distances between the categories, you can specify
"categories" as an object mapping labels to values

	xaxis: {
		mode: "categories",
		categories: { "February": 1, "March": 3, "April": 4 }
	}

If you don't specify all categories, the remaining categories will be numbered
from the max value plus 1 (with a spacing of 1 between each).

Internally, the plugin works by transforming the input data through an auto-
generated mapping where the first category becomes 0, the second 1, etc.
Hence, a point like ["February", 34] becomes [0, 34] internally in Flot (this
is visible in hover and click events that return numbers rather than the
category labels). The plugin also overrides the tick generator to spit out the
categories as ticks instead of the values.

If you need to map a value back to its label, the mapping is always accessible
as "categories" on the axis object, e.g. plot.getAxes().xaxis.categories.

*/
(function ($) {
  var options = {
      xaxis: { categories: null },
      yaxis: { categories: null }
    };
  function processRawData(plot, series, data, datapoints) {
    // if categories are enabled, we need to disable
    // auto-transformation to numbers so the strings are intact
    // for later processing
    var xCategories = series.xaxis.options.mode == 'categories', yCategories = series.yaxis.options.mode == 'categories';
    if (!(xCategories || yCategories))
      return;
    var format = datapoints.format;
    if (!format) {
      // FIXME: auto-detection should really not be defined here
      var s = series;
      format = [];
      format.push({
        x: true,
        number: true,
        required: true
      });
      format.push({
        y: true,
        number: true,
        required: true
      });
      if (s.bars.show || s.lines.show && s.lines.fill) {
        var autoscale = !!(s.bars.show && s.bars.zero || s.lines.show && s.lines.zero);
        format.push({
          y: true,
          number: true,
          required: false,
          defaultValue: 0,
          autoscale: autoscale
        });
        if (s.bars.horizontal) {
          delete format[format.length - 1].y;
          format[format.length - 1].x = true;
        }
      }
      datapoints.format = format;
    }
    for (var m = 0; m < format.length; ++m) {
      if (format[m].x && xCategories)
        format[m].number = false;
      if (format[m].y && yCategories)
        format[m].number = false;
    }
  }
  function getNextIndex(categories) {
    var index = -1;
    for (var v in categories)
      if (categories[v] > index)
        index = categories[v];
    return index + 1;
  }
  function categoriesTickGenerator(axis) {
    var res = [];
    for (var label in axis.categories) {
      var v = axis.categories[label];
      if (v >= axis.min && v <= axis.max)
        res.push([
          v,
          label
        ]);
    }
    res.sort(function (a, b) {
      return a[0] - b[0];
    });
    return res;
  }
  function setupCategoriesForAxis(series, axis, datapoints) {
    if (series[axis].options.mode != 'categories')
      return;
    if (!series[axis].categories) {
      // parse options
      var c = {}, o = series[axis].options.categories || {};
      if ($.isArray(o)) {
        for (var i = 0; i < o.length; ++i)
          c[o[i]] = i;
      } else {
        for (var v in o)
          c[v] = o[v];
      }
      series[axis].categories = c;
    }
    // fix ticks
    if (!series[axis].options.ticks)
      series[axis].options.ticks = categoriesTickGenerator;
    transformPointsOnAxis(datapoints, axis, series[axis].categories);
  }
  function transformPointsOnAxis(datapoints, axis, categories) {
    // go through the points, transforming them
    var points = datapoints.points, ps = datapoints.pointsize, format = datapoints.format, formatColumn = axis.charAt(0), index = getNextIndex(categories);
    for (var i = 0; i < points.length; i += ps) {
      if (points[i] == null)
        continue;
      for (var m = 0; m < ps; ++m) {
        var val = points[i + m];
        if (val == null || !format[m][formatColumn])
          continue;
        if (!(val in categories)) {
          categories[val] = index;
          ++index;
        }
        points[i + m] = categories[val];
      }
    }
  }
  function processDatapoints(plot, series, datapoints) {
    setupCategoriesForAxis(series, 'xaxis', datapoints);
    setupCategoriesForAxis(series, 'yaxis', datapoints);
  }
  function init(plot) {
    plot.hooks.processRawData.push(processRawData);
    plot.hooks.processDatapoints.push(processDatapoints);
  }
  $.plot.plugins.push({
    init: init,
    options: options,
    name: 'categories',
    version: '1.0'
  });
}(jQuery));!function (a) {
  'use strict';
  function b(a, b, c, d, e, f, g) {
    var j, k, l, m, n, o, p, q, h = Math.pow, i = Math.sqrt;
    return j = i(h(c - a, 2) + h(d - b, 2)), k = i(h(e - c, 2) + h(f - d, 2)), l = g * j / (j + k), m = g - l, n = c + l * (a - e), o = d + l * (b - f), p = c - m * (a - e), q = d - m * (b - f), [
      n,
      o,
      p,
      q
    ];
  }
  function d(b, c, d, e, f) {
    var g = a.color.parse(f);
    g.a = 'number' == typeof e ? e : 0.3, g.normalize(), g = g.toString(), c.beginPath(), c.moveTo(b[0][0], b[0][1]);
    for (var h = b.length, i = 0; h > i; i++)
      c[b[i][3]].apply(c, b[i][2]);
    c.stroke(), c.lineWidth = 0, c.lineTo(b[h - 1][0], d), c.lineTo(b[0][0], d), c.closePath(), e !== !1 && (c.fillStyle = g, c.fill());
  }
  function e(a, b, d, e) {
    (void 0 === b || 'bezier' !== b && 'quadratic' !== b) && (b = 'quadratic'), b += 'CurveTo', 0 == c.length ? c.push([
      d[0],
      d[1],
      e.concat(d.slice(2)),
      b
    ]) : 'quadraticCurveTo' == b && 2 == d.length ? (e = e.slice(0, 2).concat(d), c.push([
      d[0],
      d[1],
      e,
      b
    ])) : c.push([
      d[2],
      d[3],
      e.concat(d.slice(2)),
      b
    ]);
  }
  function f(f, g, h) {
    if (h.splines.show === !0) {
      var k, l, m, i = [], j = h.splines.tension || 0.5, n = h.datapoints.points, o = h.datapoints.pointsize, p = f.getPlotOffset(), q = n.length, r = [];
      if (c = [], 4 > q / o)
        return a.extend(h.lines, h.splines), void 0;
      for (k = 0; q > k; k += o)
        l = n[k], m = n[k + 1], null == l || l < h.xaxis.min || l > h.xaxis.max || m < h.yaxis.min || m > h.yaxis.max || r.push(h.xaxis.p2c(l) + p.left, h.yaxis.p2c(m) + p.top);
      for (q = r.length, k = 0; q - 2 > k; k += 2)
        i = i.concat(b.apply(this, r.slice(k, k + 6).concat([j])));
      for (g.save(), g.strokeStyle = h.color, g.lineWidth = h.splines.lineWidth, e(g, 'quadratic', r.slice(0, 4), i.slice(0, 2)), k = 2; q - 3 > k; k += 2)
        e(g, 'bezier', r.slice(k, k + 4), i.slice(2 * k - 2, 2 * k + 2));
      e(g, 'quadratic', r.slice(q - 2, q), [
        i[2 * q - 10],
        i[2 * q - 9],
        r[q - 4],
        r[q - 3]
      ]), d(c, g, f.height() + 10, h.splines.fill, h.color), g.restore();
    }
  }
  var c = [];
  a.plot.plugins.push({
    init: function (a) {
      a.hooks.drawSeries.push(f);
    },
    options: {
      series: {
        splines: {
          show: !1,
          lineWidth: 2,
          tension: 0.5,
          fill: !1
        }
      }
    },
    name: 'spline',
    version: '0.8.2'
  });
}(jQuery);