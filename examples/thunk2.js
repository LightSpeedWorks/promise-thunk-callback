'use strict';

if (typeof module === 'object' && module && module.exports)
	module.exports = Thunk;

Thunk.aa = aa;
Thunk.Channel = Channel;
Thunk.all = all;
Thunk.race = race;

//================================================================================
function Thunk(setup, cb) {
	var list = typeof cb === 'function' ? [cb] : [];
	var args = null, notYetSetup = true;
	var next = null, result = undefined, notYetResult = true;

	callback.promise = null;
	callback.then = then;
	callback['catch'] = caught;

	if (typeof setup === 'function' &&
		typeof cb === 'function') {
		notYetSetup = false;
		setup(callback, callback); // throws
		return;
	}

	return callback;

	function callback(first, val) {
		// thunk
		if (typeof first === 'function') {
			if (notYetSetup &&
				typeof setup === 'function' &&
				typeof cb !== 'function')
				try { notYetSetup = false; setup(callback, callback); }
				catch (err) { callback(err); }

			//if (!next) {
				next = Thunk();
				list.push(function (err, val) {
					var args = normalizeArgs(arguments);
					try { return valcb(first.apply(null, args), next); }
					catch (err) { return next(err); }
				});
			//}
			if (args) fire();
			return next;
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

		if (!args) args = normalizeArgs(arguments);
		return next ? fire() : void 0;
	} // callback

	function fire() {
		var cb = null;
		while (cb = list.shift()) {
			var r = cb.apply(null, args);
			if (notYetResult) result = r, notYetResult = false;
		}
		return result;
	} // fire
}

var slice = [].slice;

function normalizeArgs(args) {
	switch (args.length) {
		case 0: case 2: return args;
		case 1: return args[0] instanceof Error ? args : [null, args[0]];
		case 3: return [args[0], [args[1], args[2]]];
		default: return [args[0]].concat(slice.call(args, 1));
	}
}

function caught(rejected) {
	return this.then(void 0, rejected);
}

function then(resolved, rejected) {
	var thunk = this;
	return (this.promise || (this.promise = new Promise(function (res, rej) {
		thunk(function (err, val) { return err ? rej(err) : res(val); });
	}))).then(resolved, rejected);
}

//================================================================================
function aa(gtor, cb) {
	if (typeof gtor === 'function') gtor = gtor();

	if (!gtor || typeof gtor.next !== 'function')
		return Thunk(function (cb) { cb(null, gtor); }, cb);

	return Thunk(function (cb) {
		return function next(err, val) {
			if (arguments.length === 1 && !(err instanceof Error))
				val = err, err = null;
			try { var obj = err ? gtor.throw(err) : gtor.next(val);
			} catch (err) { cb(err); }
			val = obj.value;
			return obj.done ? cb(null, val) :
				val && val.constructor === Array ? arrcb(val, next) :
				val && val.constructor === Object ? objcb(val, next) :
				valcb(val, next);
		} ();
	}, cb);
}

function valcb(val, cb) {
	return !val ? cb(null, val) :
		typeof val === 'function' ? val(cb) :
		typeof val.then === 'function' ?
			val.then(function (v) { return cb(null, v); }, cb) :
		typeof val.cb === 'function' ? aa(val)(cb) :
		val instanceof Error ? cb(val) :
		cb(null, val);
}

function arrcb(arr, cb) {
	var n = arr.length, res = new Array(n);
	if (n === 0) return cb(null, arr);
	arr.forEach(function (val, i) {
		valcb(val, function (err, val) {
			if (arguments.length === 1 && !(err instanceof Error))
				val = err, err = null;
			if (err) return n = 0, cb(err);
			res[i] = val;
			if (--n === 0) cb(null, res);
		});
	});
}

function objcb(obj, cb) {
	var keys = Object.keys(obj), n = keys.length;
	if (n === 0) return cb(null, obj);
	var res = keys.reduce(function (res, i) { res[i] = void 0; return res; }, {});
	keys.forEach(function (i) {
		valcb(obj[i], function (err, val) {
			if (arguments.length === 1 && !(err instanceof Error))
				val = err, err = null;
			if (err) return n = 0, cb(err);
			res[i] = val;
			if (--n === 0) cb(null, res);
		});
	});
}

//================================================================================
function all(arr, cb) {
	return Thunk(function (cb) {
		(arr.constructor === Array ? arrcb : objcb)(arr, cb);
	}, cb);
}

function racecb(arr, cb) {
	var end = false;
	arr.forEach(function (val, i) {
		valcb(val, function (err, val) {
			if (end) return;
			if (arguments.length === 1 && !(err instanceof Error))
				val = err, err = null;
			end = true;
			err ? cb(err) : cb(null, val);
		});
	});
}

function raceobjcb(obj, cb) {
	var end = false;
	var keys = Object.keys(obj);
	keys.forEach(function (i) {
		valcb(obj[i], function (err, val) {
			if (end) return;
			if (arguments.length === 1 && !(err instanceof Error))
				val = err, err = null;
			if (err) return n = 0, cb(err);
			end = true;
			err ? cb(err) : cb(null, val);
		});
	});
}

function race(arr, cb) {
	return Thunk(function (cb) {
		(arr.constructor === Array ? racecb : raceobjcb)(arr, cb);
	}, cb);
}

//================================================================================
function Channel() {
	var recvs = [], sends = [];
	return channel;

	function channel(first, val) {
		var args = arguments;
		if (typeof first === 'function')
			recvs.push(first);
		else {
			if (arguments.length === 1 && !(first instanceof Error))
				args = [null, first];
			sends.push(args);
		}
		while (sends.length > 0 && recvs.length > 0)
			recvs.shift().apply(null, sends.shift());
	}
}
