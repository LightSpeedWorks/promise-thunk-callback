(function (g) {
'use strict';

// Unified Thunk! Thunk with Promise and Callback!
// thunk === promise === callback!

if (typeof module === 'object' && module && module.exports)
	module.exports = Thunk;

g.Thunk = Thunk;

Thunk.aa = aa;
Thunk.all = all;
Thunk.race = race;
Thunk.resolve = resolve;
Thunk.reject = reject;
Thunk.Channel = Channel;
Thunk.wait = wait;

var nextTickDo = typeof setImmediate === 'function' ? setImmediate :
	function nextTick(cb) { setTimeout(cb, 0); };

var tasksInProgress = false;
var tasksQueue = [];
function nextTick() {
	tasksQueue.push(arguments);
	if (tasksInProgress) return;
	tasksInProgress = true;
	nextTickDo(tasksExecutor);
}
function tasksExecutor() {
	var args;
	while (args = tasksQueue.shift()) args[0](args[1]);
	tasksInProgress = false;
}

var slice = [].slice;

//================================================================================
function Thunk(setup, cbOpts) {
	var list = typeof cbOpts === 'function' ? [normalizeCb(cbOpts)] : [];
	var args = null, notYetSetup = true;
	var result = undefined, notYetResult = true;

	thunk.then = then;
	thunk['catch'] = caught;

	if (typeof setup === 'function') {
		if (typeof cbOpts === 'function') {
			notYetSetup = false;
			setup(thunk, thunk); // throws
			return;
		}
		else if (cbOpts && cbOpts.immediate) {
			notYetSetup = false;
			setup(thunk, thunk); // throws
		}
	}

	return thunk;

	function thunk(callback) {
		if (typeof callback === 'function') {
			if (notYetSetup &&
				typeof setup === 'function')
				try { notYetSetup = false; setup(thunk, thunk); }
				catch (err) { thunk(err); }

			return Thunk(function (thunk) {
				list.push(function (err, val) {
					if (arguments.length === 1)
						err instanceof Error || (val = err, err = null);
					else if (arguments.length > 2)
						val = slice.call(arguments, 1);
					try { return valcb(callback(err, val), thunk); }
					// try { return valcb(callback.apply(null,
					//	normalizeArgs(arguments)), thunk); }
					catch (err) { return thunk(err); }
				});
				if (args) nextTick(fire);
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

		if (!args) args = arguments; //normalizeArgs(arguments);
		return list.length > 0 ? void nextTick(fire) : void 0;
	} // thunk

	function fire() {
		var cb = null;
		while (cb = list.shift()) {
			var r = cb.apply(null, args);
			if (notYetResult) result = r, notYetResult = false;
		}
		return result;
	} // fire
}

function normalizeArgs(args) {
	switch (args.length) {
		case 0: case 2: return args;
		case 1: return args[0] instanceof Error ? args : [null, args[0]];
		case 3: return [args[0], [args[1], args[2]]];
		default: return [args[0]].concat(slice.call(args, 1));
	}
}

// function normalizeCb(cb) {
//	return function () { return cb.apply(null, normalizeArgs(arguments)); };
// }
function normalizeCb(cb) {
	return function (err, val) {
		if (arguments.length === 1)
			err instanceof Error || (val = err, err = null);
		else if (arguments.length > 2)
			val = slice.call(arguments, 1);
		// switch (arguments.length) {
		//	case 0: case 2: break;
		//	case 1: err instanceof Error || (val = err, err = null); break;
		//	case 3: val = [val, next]; break;
		//	default: val = slice.call(arguments, 1); break;
		// }
		return cb(err, val);
	};
}

function caught(rejected) {
	var self = this;
	return Thunk(function (cb) {
		self(function (err, val) {
			try { return valcb(err ?
				rejected ? rejected(err) : err : val, cb);
			} catch (e) { return cb(e); }
		});
	}, {immediate: true});
}

function then(resolved, rejected) {
	var self = this;
	return Thunk(function (cb) {
		self(function (err, val) {
			try { return valcb(err ?
				rejected ? rejected(err) : err :
				resolved ? resolved(val) : val, cb);
			} catch (e) { return cb(e); }
		});
	}, {immediate: true});
}

//================================================================================
function resolve(val) {
	return Thunk(function (cb) { valcb(val, cb); });
}

function reject(err) {
	return Thunk(function (cb) { cb(err); });
}

//================================================================================
function aa(gtor, cbOpts) {
	if (typeof gtor === 'function') gtor = gtor();

	return Thunk(!gtor || typeof gtor.next !== 'function' ?
		function (callback) { valcb(gtor, callback); } :
		function (callback) {
			return function cb(err, val) {
				// var args = normalizeArgs(arguments), err = args[0], val = args[1];
				if (arguments.length === 1)
					err instanceof Error || (val = err, err = null);
				else if (arguments.length > 2)
					val = slice.call(arguments, 1);
				// if (arguments.length === 1 && !(err instanceof Error))
				//	val = err, err = null;
				try { var obj = err ? gtor.throw(err) : gtor.next(val);
				} catch (err) { return callback(err); }
				val = obj.value;
				return obj.done ? valcb(val, callback) :
					val && val.constructor === Array ? arrcb(val, cb) :
					val && val.constructor === Object ? objcb(val, cb) :
					valcb(val, cb);
			} ();
		}, cbOpts);
}

function valcb(val, cb) {
	// cb = normalizeCb(cb);
	return !val ? cb(null, val) :
		typeof val === 'function' ? nextTick(val, cb) :
		typeof val.then === 'function' ?
			val.then(function (v) { return valcb(v, cb); }, cb) :
		typeof val.next === 'function' ? aa(val)(cb) :
		val instanceof Error ? cb(val) :
		cb(null, val);
}

function arrcb(arr, cb) {
	var n = arr.length, res = new Array(n);
	if (n === 0) return cb(null, arr);
	arr.forEach(function (val, i) {
		valcb(val, function (err, val) {
			if (arguments.length === 1)
				err instanceof Error || (val = err, err = null);
			else if (arguments.length > 2)
				val = slice.call(arguments, 1);
			// var args = normalizeArgs(arguments), err = args[0], val = args[1];
			// if (arguments.length === 1 && !(err instanceof Error))
			//	val = err, err = null;
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
			if (arguments.length === 1)
				err instanceof Error || (val = err, err = null);
			else if (arguments.length > 2)
				val = slice.call(arguments, 1);
			// var args = normalizeArgs(arguments), err = args[0], val = args[1];
			// if (arguments.length === 1 && !(err instanceof Error))
			//	val = err, err = null;
			if (err) return n = 0, cb(err);
			res[i] = val;
			if (--n === 0) cb(null, res);
		});
	});
}

//================================================================================
function all(arr, cbOpts) {
	return Thunk(function (cb) {
		(arr.constructor === Array ? arrcb : objcb)(arr, cb);
	}, cbOpts);
}

function racecb(arr, cb) {
	var end = false;
	arr.forEach(function (val, i) {
		valcb(val, function (err, val) {
			if (end) return;
			if (arguments.length === 1)
				err instanceof Error || (val = err, err = null);
			else if (arguments.length > 2)
				val = slice.call(arguments, 1);
			// var args = normalizeArgs(arguments), err = args[0], val = args[1];
			// if (arguments.length === 1 && !(err instanceof Error))
			//	val = err, err = null;
			end = true;
			err ? cb(err) : cb(null, val);
		});
	});
}

function raceobjcb(obj, cb) {
	var keys = Object.keys(obj), end = false;
	keys.forEach(function (i) {
		valcb(obj[i], function (err, val) {
			if (end) return;
			if (arguments.length === 1)
				err instanceof Error || (val = err, err = null);
			else if (arguments.length > 2)
				val = slice.call(arguments, 1);
			// var args = normalizeArgs(arguments), err = args[0], val = args[1];
			// if (arguments.length === 1 && !(err instanceof Error))
			//	val = err, err = null;
			end = true;
			err ? cb(err) : cb(null, val);
		});
	});
}

function race(arr, cbOpts) {
	return Thunk(function (cb) {
		(arr.constructor === Array ? racecb : raceobjcb)(arr, cb);
	}, cbOpts);
}

//================================================================================
function Channel() {
	var list = [], args = [], ctx = this;
	return function channel(cb) {
		if (typeof cb === 'function')
			list.push(cb);
		else args.push(normalizeArgs(arguments));
		while (args.length > 0 && list.length > 0)
			list.shift().apply(ctx, args.shift());
	}
}

//================================================================================
function wait(msec, val, cbOpts) {
	return Thunk(function (cb) {
		if (msec < 0) setTimeout(cb, 0, new Error('msec must be plus or zero'));
		else setTimeout(cb, msec, null, val);
	}, cbOpts);
}

})(Function('return this')());

const {aa, wait, Channel} = Thunk;

// DELETE FROM HERE
//================================================================================
/*
function Promise(setup) {
	var pending = true, err, val, list = [];
	this.$push = function () {
		list.push(arguments);
		if (!pending) nextTick(fire);
	};
	setup(resolve, reject); // throws
	function resolve(v) {
		if (pending) val = v, pending = false;
		nextTick(fire);
	}
	function reject(e) {
		if (pending) err = e, pending = false;
		nextTick(fire);
	}
	function fire() {
		if (pending) return;
		var pair;
		while (pair = list.shift())
			(function (rejected, resolved, cb) {
				try {
					err ? rejected ? valcb(rejected(err), cb): cb(err) :
						valcb(resolved ? resolved(val) : val, cb);
				} catch (e) { cb(e); }
			})(pair[0], pair[1], pair[2]);
	} // fire
	this.toString = function () {
		return pending ? 'pending' :
			err ? 'rejected ' + err : 'resolved ' + val;
	};
}
Promise.prototype.then = function then(resolved, rejected) {
	var self = this;
	return new Promise(function (res, rej) {
		self.$push(rejected, resolved,
			function cb(e, v) { e ? rej(e) : res(v); });
	});
};
Promise.prototype['catch'] = function caught(rejected) {
	return this.then(void 0, rejected);
};
Promise.resolve = function resolve(val) {
	return new Promise(function (res, rej) {
		valcb(val, function (e, v) { e ? rej(e) : res(v); });
	});
};
Promise.reject = function reject(err) {
	return new Promise(function (res, rej) { rej(err); });
};
Promise.all = function all(arr) {
	return new Promise(function (res, rej) {
		arrcb(arr, function (e, v) { e ? rej(e) : res(v); });
	});
};
*/

//================================================================================
var x = 10, F = false;
function a(v, m) {
	if (v) return;
	m = m || ('assert 失敗 @' + x);
	console.error(m);
	var err = new Error(m);
	console.error(err.stack || err + '');
	throw err;
}
console.log('@x' + ++x + ' wa0'), a(x === 11);
a(wait(1000, 'wa_1000',
   (err, val) => (console.log('@x' + ++x + ' wa1 ' + val + ' ' + err), a(x === 16), 'wa1x   '))
   === undefined);
console.log('@x' + ++x + ' wb0'), a(x === 12);
wait(2000, 'wb_2000')
  ((err, val) => (console.log('@x' + ++x + ' wb1 ' + val + ' ' + err), a(x === 17), 'wb1x   '))
  ((err, val) => (console.log('@x' + ++x + ' wb2 ' + val + ' ' + err), a(x === 18), 'wb2x   '))
  ((err, val) => (console.log('@x' + ++x + ' wb3 ' + val + ' ' + err), a(x === 19), cb => cb(null, 'wb3x   ')))
  ((err, val) => (console.log('@x' + ++x + ' wb4 ' + val + ' ' + err), a(x === 20), cb => cb(null, 'wb4x   ')))
  ((err, val) => (console.log('@x' + ++x + ' wb5 ' + val + ' ' + err), a(x === 21), Promise.resolve('wb5x   ')))
  ((err, val) => (console.log('@x' + ++x + ' wb6 ' + val + ' ' + err), a(x === 22), Promise.resolve('wb6x   ')))
  (err => console.error('@x' + x + ' wb  ' + (err.stack || err + '')));
console.log('@x' + ++x + ' wc0'), a(x === 13);
wait(3000, 'wc_3000')
.then(val => (console.log('@x' + ++x + ' wc1 ' + val), a(x === 23),     'wc1x   '),
      err => (console.log('@x' + ++x + ' wc1 ' + err), a((x = -23, F)), 'wc1e   '))
.then(val => (console.log('@x' + ++x + ' wc2 ' + val), a(x === 24),     'wc2x   '),
      err => (console.log('@x' + ++x + ' wc2 ' + err), a((x = -24, F)), 'wc2e   '))
.catch(err => console.error('@x' + x + ' wc  ' + (err.stack || err + '')));
console.log('@x' + ++x + ' wd0'), a(x === 14);
wait(4000, 'wd_4000')
.then(val => (console.log('@x' + ++x + ' wd1 ' + val), a(x === 25),     Promise.resolve('wd1x   ')),
      err => (console.log('@x' + ++x + ' wd1 ' + err), a((x = -25, F)), Promise.resolve('wd1e   ')))
.then(val => (console.log('@x' + ++x + ' wd2 ' + val), a(x === 26),     Promise.resolve('wd2x   ')),
      err => (console.log('@x' + ++x + ' wd2 ' + err), a((x = -26, F)), Promise.resolve('wd2e   ')))
.then(val => (console.log('@x' + ++x + ' wd3 ' + val), a(x === 27)),
      err => (console.log('@x' + ++x + ' wd3 ' + err), a((x = -27, F))))
.catch(err => console.error('@x' + x + ' wd  ' + (err.stack || err + '')));
console.log('@x' + ++x + ' wz0'), a(x === 15);

var y = 10;
console.log('@y' + ++y + ' y11'), a(y === 11, 'y11');
Thunk.resolve(true)
.then(val => (console.log('@y' + ++y + ' y14  ' + val), a(y === 14, 'y14')),
      err => (console.log('@y' + ++y + ' y14e ' + err), a((y = -14), F)))
.catch(err => console.error('@y' + x + ' y14z ' + (err.stack || err + '')));
console.log('@y' + ++y + ' y12'), a(y === 12, 'y12');
Thunk.reject(new Error('always error'))
.then(val => (console.log('@y' + ++y + ' y15  ' + val), a((y = -15), F)),
      err => (console.log('@y' + ++y + ' y15e ' + err), a(y === 15, 'y15')))
.catch(err => console.error('@y' + x + ' y15z ' + (err.stack || err + '')));
console.log('@y' + ++y + ' y13'), a(y === 13, 'y13');

var z = 10;
console.log('@z' + ++z + ' z11'), a(z === 11, 'z11');
Thunk(function (res, rej) { res(true); })
.then(val => (console.log('@z' + ++z + ' z14  ' + val), a(z === 14, 'z14')),
      err => (console.log('@z' + ++z + ' z14e ' + err), a((z = -14), F)))
.catch(err => console.error('@z' + x + ' z14z ' + (err.stack || err + '')));
console.log('@z' + ++z + ' z12'), a(z === 12, 'z12');
Thunk(function (res, rej) { rej(new Error('always error')); })
.then(val => (console.log('@z' + ++z + ' z15  ' + val), a((z = -15), F)),
      err => (console.log('@z' + ++z + ' z15e ' + err), a(z === 15, 'z15')))
.catch(err => console.error('@z' + x + ' z15z ' + (err.stack || err + '')));
console.log('@z' + ++z + ' z13'), a(z === 13, 'z13');

var w = 10;
console.log('@w' + ++w + ' w11'), a(w === 11, 'w11');
Thunk(function (res, rej) { res(true); })
.then(val => (console.log('@w' + ++w + ' w14  ' + val), a(w === 14, 'w14')),
      err => (console.log('@w' + ++w + ' w14e ' + err), a((w = -14), F)))
.catch(err => console.error('@w' + x + ' w14z ' + (err.stack || err + '')));
console.log('@w' + ++w + ' w12'), a(w === 12, 'w12');
Thunk(function (res, rej) { rej(new Error('always error')); })
.then(val => (console.log('@w' + ++w + ' w15  ' + val), a((w = -15), F)),
      err => (console.log('@w' + ++w + ' w15e ' + err), a(w === 15, 'w15')))
.catch(err => console.error('@w' + x + ' w15z ' + (err.stack || err + '')));
console.log('@w' + ++w + ' w13'), a(w === 13, 'w13');
/*
console.log('@w' + ++w + ' w11'), a(w === 11, 'w11');
Thunk(function (res, rej) { res(true); })
.then(val => (console.log('@w' + ++w + ' w12  ' + val), a(w === 12, 'w12')),
      err => (console.log('@w' + ++w + ' w12e ' + err), a((w = -12), F)))
.catch(err => console.error('@w' + x + ' w12z ' + (err.stack || err + '')));
console.log('@w' + ++w + ' w13'), a(w === 13, 'w13');
Thunk(function (res, rej) { rej(new Error('always error')); })
.then(val => (console.log('@w' + ++w + ' w14  ' + val), a((w = -14), F)),
      err => (console.log('@w' + ++w + ' w14e ' + err), a(w === 14, 'w14')))
.catch(err => console.error('@w' + x + ' w14z ' + (err.stack || err + '')));
console.log('@w' + ++w + ' w15'), a(w === 15, 'w15');
*/

aa(function *() {
	yield wait(5000);
	console.log('Channel start');
	var chan = Channel();
	setTimeout(chan, 100, 0);
	a((yield chan) === 0);
	chan(1);
	chan(2);
	chan(3);
	a((yield chan) === 1);
	a((yield chan) === 2);
	a((yield chan) === 3);
	setTimeout(chan, 100, 4);
	setTimeout(chan, 200, 5);
	setTimeout(chan, 300, 6);
	a((yield chan) === 4);
	a((yield chan) === 5);
	a((yield chan) === 6);
	console.log('Channel works');
}, err => err && console.error(err));

aa(function *() {
	yield wait(6000);
	console.log('Thunk start');
	var thunk = Thunk();
	setTimeout(thunk, 100, 0);
	a((yield thunk) === 0);
	thunk(1);
	a((yield thunk) === 0);
	console.log('Thunk works');
}, err => err && console.error(err));

function benchcb(name, bench, cb) {
	const start = Date.now();
	try {
		bench(function (err, val) { cb(err,
			name + ':' + (Date.now() - start));
			//{n: name, v: val, m: Date.now() - start});
		});
	} catch (err) { cb(err); }
}

const N = 5e4;
function bench1(cb) {
	var p = Promise.resolve(0);
	for (var i = 0; i < N; ++i)
		p = p.then(function (val) { return Promise.resolve(0); });
	p.then(val => cb(null, val), err => cb(err));
}
function bench2(cb) {
	aa(function *() {
		var p = cb => cb(null, 0);
		for (var i = 0; i < N; ++i)
			yield p;
		return 0;
	}, cb);
}
function bench3(cb) {
	var p = Thunk(function (cb) { cb(0); });
	for (var i = 0; i < N; ++i)
		p = p(function (err, val) {
			return Thunk(function (cb) { cb(0); });
		});
	p(cb);
}
function bench4(cb) {
	var p = Thunk.resolve(0);
	for (var i = 0; i < N; ++i)
		p = p.then(function (val) {
			return Thunk.resolve(0);
		});
	p.then(val => cb(null, val), err => cb(err));
}
aa(function *() {
	yield wait(7000);
	console.log('Benchmark start');
	for (var i = 0; i < 20; ++i) {
		console.log(
			yield cb => benchcb('1:NativePromise', bench1, cb),
			yield cb => benchcb('2:Callback', bench2, cb),
			yield cb => benchcb('3:ThunkSync', bench3, cb),
			yield cb => benchcb('4:ThunkAsync', bench4, cb));
	}
	console.log('Benchmark end');
}, err => err && console.error(err));
