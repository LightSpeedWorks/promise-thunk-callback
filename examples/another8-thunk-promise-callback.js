process.title = __filename.substr(__dirname.length + 1);
(function () {
'use strict';

	(function (g) {
	'use strict';

	// Unified Thunk! Thunk with Promise and Callback!
	// thunk === promise === callback!

	if (typeof module === 'object' && module && module.exports)
		module.exports = Thunk;

	var hasConsole = typeof console === 'object' && console != null;
	var hasConsoleWarn  = hasConsole && typeof console.warn  === 'function';
	var hasConsoleError = hasConsole && typeof console.error === 'function';

	// var COLOR_ERROR  = typeof window !== 'undefined' ? '' : '\x1b[35m';
	// var COLOR_NORMAL = typeof window !== 'undefined' ? '' : '\x1b[m';

	// Object.keys for ie8
	if (!Object.keys)
		Object.keys = function keys(obj) {
			var props = [];
			for (var prop in obj)
				if (obj.hasOwnProperty(prop))
					props.push(prop);
			return props;
		},
		hasConsoleWarn && console.warn('Undefined: Object.keys');

	// Object.getOwnPropertyNames for ie8
	if (!Object.getOwnPropertyNames)
		Object.getOwnPropertyNames = Object.keys,
		hasConsoleWarn && console.warn('Undefined: Object.getOwnPropertyNames');

	// Array.prototype.reduce for ie8
	if (!Array.prototype.reduce)
		Array.prototype.reduce = function reduce(fn, val) {
			var i = 0;
			if (arguments.length <= 1) val = this[i++];
			for (var n = this.length; i < n; ++i)
				val = fn(val, this[i], i, this);
			return val;
		},
		hasConsoleWarn && console.warn('Undefined: Array.prototype.reduce');

	var COLORS = {red: '31', green: '32', purple: '35', cyan: '36', yellow: '33'};
	var colors = Object.keys(COLORS).reduce(function (obj, k) {
		obj[k] = typeof window === 'object' ? function (x) { return x; } :
			function (x) { return '\x1b[' + COLORS[k] + 'm' + x + '\x1b[m'; };
		return obj;
	}, {});

	function errmsg(err) { return err.stack || err; }

	// defProp(obj, prop, propDesc)
	var defProp = function (obj) {
		if (!Object.defineProperty) return null;
		try {
			Object.defineProperty(obj, 'prop', {value: 'str'});
			return obj.prop === 'str' ? Object.defineProperty : null;
		} catch (err) { return null; }
	} ({});

	// setValue(obj, prop, val)
	var setValue = defProp ?
		function setValue(obj, prop, val) {
			defProp(obj, prop, {value: val,
				writable: true, configurable: true}); } :
		function setValue(obj, prop, val) { obj[prop] = val; };

	/*
	// setConst(obj, prop, val)
	var setConst = defProp ?
		function setConst(obj, prop, val) {
			defProp(obj, prop, {value: val}); } :
		function setConst(obj, prop, val) { obj[prop] = val; };

	// getProto(obj)
	var getProto = Object.getPrototypeOf ||
		function getProto(obj) { return obj.__proto__; };

	// setProto(obj, proto)
	var setProto = Object.setPrototypeOf ||
		function setProto(obj, proto) { obj.__proto__ = proto; };
	//*/

	g.Thunk = Thunk;

	setValue(Thunk, 'aa', aa);
	setValue(Thunk, 'all', all);
	setValue(Thunk, 'race', race);
	setValue(Thunk, 'resolve', resolve);
	setValue(Thunk, 'reject', reject);
	setValue(Thunk, 'accept', resolve);
	setValue(Thunk, 'Thunk', Thunk);
	setValue(Thunk, 'Promise', Thunk);
	setValue(Thunk, 'Channel', Channel);
	setValue(Thunk, 'wait', wait);
	setValue(Thunk, 'isIterable', isIterable);
	setValue(Thunk, 'isIterator', isIterator);
	setValue(Thunk, 'isPromise', isPromise);
	setValue(Thunk, 'makeArrayFromIterator', makeArrayFromIterator);
	setValue(Thunk, 'promisify', thunkify);
	setValue(Thunk, 'thunkify', thunkify);
	setValue(Thunk, 'promisifyAll', thunkifyAll);
	setValue(Thunk, 'thunkifyAll', thunkifyAll);

	// PromiseResolveThen(fn)
	var PromiseResolveThen = function (N) {
		var n = N;
		return typeof Promise === 'function' && Promise &&
			typeof Promise.resolve === 'function' ?
			function PromiseResolveThen(cb) {
				--n < 0 ? (n = N, setTimeout(cb, 0)) :
				Promise.resolve(void 0).then(cb);
			} : null;
	} (5000);

	// nextTickDo(fn)
	var nextTickDo = typeof process === 'object' && process &&
		typeof process.nextTick === 'function' ? process.nextTick :
		PromiseResolveThen ? PromiseResolveThen :
		typeof setImmediate === 'function' ? setImmediate :
		function nextTickDo(cb) { setTimeout(cb, 0); };

	// nextExec(fn, arg0, arg1)
	var nextExec = function (tasks, progress) {
		// tasks {head, tail}

		// nextExec(ctx, fn)
		function nextExec(fn, arg0, arg1) {
			var task = {fn:fn, arg0:arg0, arg1:arg1, chain:null};
			tasks.tail = tasks.tail ? (tasks.tail.chain = task) : (tasks.head = task);

			if (progress) return;
			progress = true;
			nextTickDo(nextTickExec);
		}

		function nextTickExec() {
			var task;
			while (task = tasks.head) {
				tasks.head = task.chain;
				task.chain = null;
				if (!tasks.head) tasks.tail = null;

				var fn = task.fn;
				fn(task.arg0, task.arg1);
			}
			progress = false;
		}

		return nextExec;
	}({head:null, tail:null}, false); // nextExec

	var slice = [].slice;

	//================================================================================
	// Thunk(setup: Function | undefined, cbOpts: Function | Options): Thunk | Promise
	function Thunk(setup, cbOpts, args) {
		// var head, tail;
		// head = tail = typeof cbOpts === 'function' ? {cb:cbOpts, chain:undefined} : undefined;
		var pos = 0, len = 0;
		thunk[0] = null;
		if (typeof cbOpts === 'function') thunk[len++] = cbOpts;

		thunk.constructor = Thunk;
		thunk.then = then;
		thunk['catch'] = caught;

		if (typeof setup === 'function') {
			if (typeof cbOpts === 'function') {
				try { var f = setup; setup = undefined;
					f(thunk, thunk); }
				catch (err) { thunk(err); }
				return;
			}
			else if (cbOpts && cbOpts.immediate)
				try { var f = setup; setup = undefined;
					f(thunk, thunk); }
				catch (err) { thunk(err); }
		}

		return thunk;

		function thunk(callback) {
			if (typeof callback === 'function') {
				if (typeof setup === 'function')
					try { var f = setup; setup = undefined;
						f(thunk, thunk); }
					catch (err) { thunk(err); }

				return Thunk(function (cb) {
					thunk[len++] = function (err, val) {
						if (arguments.length === 1)
							err instanceof Error || (val = err, err = null);
						else if (arguments.length > 2)
							val = slice.call(arguments, 1);
						try { return valcb(callback(err, val), cb); }
						catch (err) { return cb(err); }
					};
					if (args) nextExec(fire);
				}, {immediate: true});
			}

			// callback
			//if (args) {
			//	var args2 = normalizeArgs(arguments);
			//	args[0] ?
			//		args2[0] ?
			//			console.log('rejected twice:', args2[0], args[0]) :
			//			console.log('resolved after rejected:', args2[1], args[0]) :
			//		args2[0] ?
			//			console.log('rejected after resolved:', args2[0], args[1]) :
			//			console.log('resolved twice:', args2[1], args[1]);
			//}

			if (!args) {
				args = arguments;
				if (arguments.length === 1)
					callback instanceof Error || (args = [null, callback]);
				else if (arguments.length > 2)
					args = [callback, slice.call(arguments, 1)];
			}
			return pos < len ? nextExec(fire) : undefined;
		} // thunk

		function fire() {
			var cb;
			while (pos < len) {
				cb = thunk[pos];
				delete thunk[pos];
				pos++;
				cb.apply(null, args);
			}
		} // fire
	} // Thunk

	// caught(resolved, rejected) : Thunk | Promise
	function caught(rejected) {
		var self = this;
		return Thunk(function (cb) {
			self(function (err, val) {
				try { return valcb(err ?
					rejected ? rejected(err) : err : val, cb);
				} catch (err) { return cb(err); }
			});
		}, {immediate: true});
	} // caught | catch

	// then(resolved, rejected) : Thunk | Promise
	function then(resolved, rejected) {
		var self = this;
		return Thunk(function (cb) {
			self(function (err, val) {
				try { return valcb(err ?
					rejected ? rejected(err) : err :
					resolved ? resolved(val) : val, cb);
				} catch (err) { return cb(err); }
			});
		}, {immediate: true});
	} // then

	/*
	function normalizeArgs(args) {
		switch (args.length) {
			case 0: case 2: return args;
			case 1: return args[0] instanceof Error ? args : [null, args[0]];
			case 3: return [args[0], [args[1], args[2]]];
			default: return [args[0], slice.call(args, 1)];
		}
	} // normalizeArgs

	function normalizeCb(cb) {
		return function (err, val) {
			if (arguments.length === 1)
				err instanceof Error || (val = err, err = null);
			else if (arguments.length > 2)
				val = slice.call(arguments, 1);
			return cb(err, val);
		};
	} // normalizeCb
	//*/

	//================================================================================
	// resolve(val: Thunk | Promise | any) : Thunk | Promise
	function resolve(val) {
		return typeof val === 'string' ||
			typeof val === 'number' ||
			typeof val === 'boolean' ||
			val === undefined || val === null ?
				Thunk(undefined, undefined, [null, val]) :
				Thunk(function (cb) { valcb(val, cb); });
	}

	// reject(err: Error) : Thunk | Promise
	function reject(err) {
		return Thunk(undefined, undefined, [err]);
		// return Thunk(function (cb) { cb(err); });
	}

	//================================================================================
	// aa(gtor: Generator, cbOpts: Function | Options): Thunk | Promise
	function aa(gtor, cbOpts) {
		if (typeof gtor === 'function') gtor = gtor();

		return Thunk(!gtor || typeof gtor.next !== 'function' ?
			function (callback) { valcb(gtor, callback); } :
			function (callback) {
				return function cb(err, val) {
					if (arguments.length === 1)
						err instanceof Error || (val = err, err = null);
					else if (arguments.length > 2)
						val = slice.call(arguments, 1);
					try { var obj = err ? gtor.throw(err) : gtor.next(val);
					} catch (err) { return callback(err); }
					val = obj.value;
					return obj.done ? valcb(val, callback) :
						typeof val === 'function' ? nextExec(val, cb) :
						typeof val === 'object' && val ? (
							typeof val.then === 'function' ?
								val.then(function (v) { return valcb(v, cb); }, cb) :
							typeof val.next === 'function' ? aa(val, cb) :
							val.constructor === Array ? arrcb(val, cb) :
							val.constructor === Object ? objcb(val, cb) :
							val instanceof Error ? nextExec(cb, val) :
							nextExec(cb, null, val)
						) :
						nextExec(cb, null, val);
				} ();
			}, cbOpts);
	} // aa

	// valcb(val: any, cb: Function) : any
	function valcb(val, cb) {
		return typeof val === 'string' ||
			typeof val === 'number' ||
			typeof val === 'boolean' ||
			val === undefined || val === null ? cb(null, val) :
			typeof val === 'function' ? nextExec(val, cb) :
			typeof val.then === 'function' ?
				val.then(function (v) { return valcb(v, cb); }, cb) :
			typeof val.next === 'function' ? aa(val, cb) :
			val instanceof Error ? cb(val) :
			cb(null, val);
	} // valcb

	// arrcb(arr: Array | Iterator, cb: Function): void
	function arrcb(arr, cb) {
		// TODO arr = makeArray...
		var n = arr.length, res = new Array(n);
		if (n === 0) return cb(null, arr);
		arr.forEach(function (val, i) {
			valcb(val, function (err, val) {
				if (arguments.length === 1)
					err instanceof Error || (val = err, err = null);
				else if (arguments.length > 2)
					val = slice.call(arguments, 1);
				if (err) return n = 0, cb(err);
				res[i] = val;
				if (--n === 0) cb(null, res);
			});
		});
	} // arrcb

	// objcb(obj, cb): void
	function objcb(obj, cb) {
		var keys = Object.keys(obj), n = keys.length;
		if (n === 0) return cb(null, obj);
		var res = keys.reduce(function (res, i) { res[i] = void 0; return res; }, {});
		keys.forEach(function (i) {
			valcb(obj[i], function (err, val) {
				if (arguments.length === 1)
					err instanceof Error || (val = err, err = null);
				else if (arguments.length > 2)
					val = slice.call(arguments, 1);
				if (err) return n = 0, cb(err);
				res[i] = val;
				if (--n === 0) cb(null, res);
			});
		});
	} // objcb

	//================================================================================
	// all(arr: Array | Iterator, cbOpts: Function) : Thunk | Promise
	function all(arr, cbOpts) {
		// TODO arr = makeArray...
		return Thunk(function (cb) {
			(arr.constructor === Array ? arrcb : objcb)(arr, cb);
		}, cbOpts);
	} // all

	function racecb(arr, cb) {
		var end = false;
		arr.forEach(function (val, i) {
			valcb(val, function (err, val) {
				if (end) return;
				if (arguments.length === 1)
					err instanceof Error || (val = err, err = null);
				else if (arguments.length > 2)
					val = slice.call(arguments, 1);
				end = true;
				err ? cb(err) : cb(null, val);
			});
		});
	} // racecb

	function raceobjcb(obj, cb) {
		var keys = Object.keys(obj), end = false;
		keys.forEach(function (i) {
			valcb(obj[i], function (err, val) {
				if (end) return;
				if (arguments.length === 1)
					err instanceof Error || (val = err, err = null);
				else if (arguments.length > 2)
					val = slice.call(arguments, 1);
				end = true;
				err ? cb(err) : cb(null, val);
			});
		});
	} // raceobjcb

	function race(arr, cbOpts) {
		return Thunk(function (cb) {
			(arr.constructor === Array ? racecb : raceobjcb)(arr, cb);
		}, cbOpts);
	} // race

	//================================================================================
	// Channel() : Function
	function Channel() {
		var ctx = this, list = [], values = [];
		return function channel(cb) {
			if (typeof cb === 'function')
				list.push(cb);
			else {
				var args = arguments;
				if (arguments.length === 1)
					cb instanceof Error || (args = [null, cb]);
				else if (arguments.length > 2)
					args = [cb, slice.call(arguments, 1)];
				values.push(args);
			}
			while (values.length > 0 && list.length > 0)
				var r = list.shift().apply(ctx, values.shift());
			return r;
		}; // channel
	} // Channel

	//================================================================================
	// wait(msec: number, val: any, cbOpts: Function | Options): Thunk | Promise
	function wait(msec, val, cbOpts) {
		return Thunk(function (cb) {
			if (msec < 0) setTimeout(cb, 0, new Error('msec must be plus or zero'));
			else setTimeout(cb, msec, null, val);
		}, cbOpts);
	} // wait

	//================================================================================
	// isPromise(p)
	function isPromise(p) {
		return (typeof p === 'object' && !!p || typeof p === 'function') &&
			typeof p.then === 'function';
	} // isPromise

	// isIterator(iter)
	function isIterator(iter) {
		return typeof iter === 'object' && !!iter &&
			(typeof iter.next === 'function' || isIterable(iter));
	} // isIterator

	// isIterable(iter)
	function isIterable(iter) {
		return typeof iter === 'object' && !!iter &&
			typeof Symbol === 'function' &&
			!!Symbol.iterator &&
			typeof iter[Symbol.iterator] === 'function';
	} // isIterable

	// makeArrayFromIterator(iter or array)
	function makeArrayFromIterator(iter) {
		if (iter instanceof Array) return iter;
		if (!isIterator(iter)) return [iter];
		if (isIterable(iter)) iter = iter[Symbol.iterator]();
		var array = [];
		try {
			for (;;) {
				var val = iter.next();
				if (val && val.hasOwnProperty('done') && val.done) return array;
				if (val && val.hasOwnProperty('value')) val = val.value;
				array.push(val);
			}
		} catch (error) {
			return array;
		}
	} // makeArrayFromIterator

	// thunkify(fn, [options])
	function thunkify(fn, options) {
		// thunkify(target: Object, method: string, [options: Object]) : undefined
		if (fn && typeof fn === 'object' && options && typeof options === 'string') {
			var object = fn, method = options, options = arguments[2];
			var suffix = options && typeof options === 'string' ? options :
				options && typeof options.suffix === 'string' ? options.suffix :
				options && typeof options.postfix === 'string' ? options.postfix : 'Async';
			var methodAsyncCached = method + suffix + 'Cached';
			Object.defineProperty(object, method + suffix, {
				get: function () {
					return this.hasOwnProperty(methodAsyncCached) &&
						typeof this[methodAsyncCached] === 'function' ? this[methodAsyncCached] :
						(setValue(this, methodAsyncCached, thunkify(this, this[method])), this[methodAsyncCached]);
				},
				configurable: true
			});
			return;
		}

		// thunkify([ctx: Object,] fn: Function) : Function
		var ctx = typeof this !== 'function' ? this : undefined;
		if (typeof options === 'function') ctx = fn, fn = options, options = arguments[2];
		if (options && options.context) ctx = options.context;
		if (typeof fn !== 'function')
			throw new TypeError('thunkify: argument must be a function');

		// thunkified, promisified
		thunkified.thunkified = thunkified.promisified = true;
		return thunkified;
		function thunkified() {
			var args = arguments;
			return Thunk(function (cb) {
				args[args.length++] = cb;
				fn.apply(ctx, args);
			});
		} // thunkified
	} // thunkify

	// thunkifyAll(object, options)
	function thunkifyAll(object, options) {
		var keys = [];
		if (Object.getOwnPropertyNames) keys = Object.getOwnPropertyNames(object);
		else if (Object.keys) keys = Object.keys(object);
		else for (var method in object) if (object.hasOwnProperty(method)) keys.push(i);

		keys.forEach(function (method) {
			if (typeof object[method] === 'function' &&
					!object[method].promisified &&
					!object[method].thunkified)
				thunkify(object, method, options);
		});
		return object;
	} // thunkifyAll

	})(Function('return this')());

	const benchAll = require('./bench-all');
	benchAll(Thunk);

})();
