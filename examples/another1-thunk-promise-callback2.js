'use strict';

// Thunk0

//================================================================================
function Thunk0(setup) {
	var list = [], args;
	try{ setup(cb); } catch (e) { cb(e); }
	return thunk;

	function thunk(cb) {
		list.push(cb);
		args && fire();
		return Thunk0(function (next) { cb.next = next; });
	} // thunk

	function cb(err, val) {
		if (args) return args[0] ?
			err ? console.log('rejected twice:', err, args[0]) :
				console.log('resolved after rejected:', val, args[0]) :
			err ? console.log('rejected after resolved:', err, args[1]) :
				console.log('resolved twice:', val, args[1]);
		args = arguments;
		list.length && fire();
	} // cb

	function fire() {
		var cb;
		while (cb = list.shift()) {
			var next = cb.next;
			try {
				var r = cb.apply(null, args);
				if (typeof r === 'function') r(next);
				else if (r && r.then) r.then(
					function (v) { next(null, v); }, next);
				else if (r instanceof Error) next(r);
				else next(null, r);
			} catch (e) { next(e); }
		}
	} // fire
} // Thunk0

//if (typeof module === 'object' && module && module.exports)
//	module.exports = Thunk;

//================================================================================
function Thunk1(setup) {
	var list = [], next, args;
	try { setup(cb); } catch (e) { cb(e); }
	return thunk;

	function thunk(cb) {
		list.push(cb);
		args && fire();
		return Thunk1(function (cb) { next = cb; });
	} // thunk

	function cb(err, val) {
		args = arguments;
		list.length && fire();
	} // cb

	function fire() {
		try {
			var callback;
			while (callback = list.shift()) {
				var r = callback.apply(null, args);
				if (typeof r === 'function') r(next);
				else if (r && r.then) r.then(
					function (v) { next(null, v); }, next);
				else if (r instanceof Error) next(r);
				else next(null, r);
			}
		} catch (e) { next(e); }
	} // fire
} // Thunk1

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

			if (!next) {
				next = Thunk();
				list.push(function (err, val) {
					var args = normalizeArgs(arguments);
					try { return valcb(first.apply(null, args), next); }
					catch (err) { return next(err); }
				});
			}
			if (args) fire();
			return next;
		}

		// callback
		if (args) {
			var args2 = normalizeArgs(arguments);
			args[0] ?
				args2[0] ?
					console.log('rejected twice:', args2[0], args[0]) :
					console.log('resolved after rejected:', args2[1], args[0]) :
				args2[0] ?
					console.log('rejected after resolved:', args2[0], args[1]) :
					console.log('resolved twice:', args2[1], args[1]);
		}

		if (!args) args = normalizeArgs(arguments);
		return fire();
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

//================================================================================
// wait(msec: number, val: any, cbOpts: Function | Options): Thunk | Promise
function wait(msec, val, cbOpts) {
	return Thunk(function (cb) {
		if (msec < 0) setTimeout(cb, 0, new Error('msec must be plus or zero'));
		else setTimeout(cb, msec, null, val);
	}, cbOpts);
} // wait

function resolve(val) {
	return Thunk(function (cb) { valcb(val, cb); });
}
function reject(err) {
	return Thunk(function (cb) { cb(err); });
}

Thunk.Channel = Channel;
Thunk.aa = aa;
Thunk.wait = wait;
Thunk.resolve = resolve;
Thunk.reject = reject;

const benchAll = require('./bench-all');
benchAll(Thunk);
