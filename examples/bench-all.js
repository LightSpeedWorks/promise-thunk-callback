module.exports = benchAll;

function benchAll(Thunk) {
	'use strict';

	var {aa, wait, Channel, thunkify, promisify, thunkifyAll, promisifyAll} = Thunk;

	//if (!wait) wait = function wait(msec, val, cb) {
	//	return Thunk(function (cb) { setTimeout(cb, msec, null, val); }, cb);
	//};

	// DELETE FROM HERE
	//================================================================================
	/*
	function Promise(setup) {
		var pending = true, err, val, list = [];
		this.$push = function () {
			list.push(arguments);
			if (!pending) nextExec(fire);
		};
		setup(resolve, reject); // throws
		function resolve(v) {
			if (pending) val = v, pending = false;
			nextExec(fire);
		}
		function reject(e) {
			if (pending) err = e, pending = false;
			nextExec(fire);
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
	      err => (console.log('@y' + ++y + ' y14e ' + err), a((y = -14, F))))
	.catch(err => console.error('@y' + x + ' y14z ' + (err.stack || err + '')));
	console.log('@y' + ++y + ' y12'), a(y === 12, 'y12');
	Thunk.reject(new Error('always error'))
	.then(val => (console.log('@y' + ++y + ' y15  ' + val), a((y = -15, F))),
	      err => (console.log('@y' + ++y + ' y15e ' + err), a(y === 15, 'y15')))
	.catch(err => console.error('@y' + x + ' y15z ' + (err.stack || err + '')));
	console.log('@y' + ++y + ' y13'), a(y === 13, 'y13');

	var z = 10;
	console.log('@z' + ++z + ' z11'), a(z === 11, 'z11');
	Thunk(function (res, rej) { res(true); })
	.then(val => (console.log('@z' + ++z + ' z14  ' + val), a(z === 14, 'z14')),
	      err => (console.log('@z' + ++z + ' z14e ' + err), a((z = -14, F))))
	.catch(err => console.error('@z' + x + ' z14z ' + (err.stack || err + '')));
	console.log('@z' + ++z + ' z12'), a(z === 12, 'z12');
	Thunk(function (res, rej) { rej(new Error('always error')); })
	.then(val => (console.log('@z' + ++z + ' z15  ' + val), a((z = -15, F))),
	      err => (console.log('@z' + ++z + ' z15e ' + err), a(z === 15, 'z15')))
	.catch(err => console.error('@z' + x + ' z15z ' + (err.stack || err + '')));
	console.log('@z' + ++z + ' z13'), a(z === 13, 'z13');

	var w = 10;
	console.log('@w' + ++w + ' w11'), a(w === 11, 'w11');
	Thunk(function (res, rej) { res(true); })
	.then(val => (console.log('@w' + ++w + ' w14  ' + val), a(w === 14, 'w14')),
	      err => (console.log('@w' + ++w + ' w14e ' + err), a((w = -14, F))))
	.catch(err => console.error('@w' + x + ' w14z ' + (err.stack || err + '')));
	console.log('@w' + ++w + ' w12'), a(w === 12, 'w12');
	Thunk(function (res, rej) { rej(new Error('always error')); })
	.then(val => (console.log('@w' + ++w + ' w15  ' + val), a((w = -15, F))),
	      err => (console.log('@w' + ++w + ' w15e ' + err), a(w === 15, 'w15')))
	.catch(err => console.error('@w' + x + ' w15z ' + (err.stack || err + '')));
	console.log('@w' + ++w + ' w13'), a(w === 13, 'w13');

	//================================================================================
	aa(function *() {
		yield wait(5000);

		if (typeof Channel !== 'function')
			return console.log('Channel not yet implemented');

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

		if (typeof Thunk !== 'function')
			return console.log('Thunk not yet implemented');

		console.log('Thunk start');
		var thunk = Thunk();
		setTimeout(thunk, 100, 0);
		a((yield thunk) === 0);
		thunk(1);
		a((yield thunk) === 0);
		console.log('Thunk works');
	}, err => err && console.error(err));

	aa(function *() {
		yield wait(7000);
		console.log('Primitive values start');
		for (var i = 0; i <= 5e4; ++i) {
			if (i % 5000 === 0) console.log('Primitive values:', i);
			if (i !== (yield i)) console.log('eh!?', i);
		}
		console.log('Primitive values works');
	}, err => err && console.error(err));

	//================================================================================
	aa(function *() {
		yield wait(8000);

		function sleep(msec, val, cb) {
			setTimeout(cb, msec, null, val);
		}

		if (typeof thunkify !== 'function')
			console.log('thunkify not yet implemented');
		else {
			console.log('thunkify start');
			var delay = thunkify(sleep);
			console.log('thunkify sleep', yield cb => sleep(50, 'sleep 50-0', cb));
			console.log('thunkify delay', yield delay(50, 'sleep 50-1'));
			console.log('thunkify delay', yield delay(50, 'sleep 50-2')
				((err, val) => err || (console.log('thunkify delay', val), delay(50, 'sleep 50-3')))
				((err, val) => err || (console.log('thunkify delay', val), delay(50, 'sleep 50-4'))));
			console.log('thunkify delay', yield delay(50, 'sleep 50-5')
				.then(val => (console.log('thunkify delay', val), delay(50, 'sleep 50-6')))
				.then(val => (console.log('thunkify delay', val), delay(50, 'sleep 50-7'))));
			console.log('thunkify works');
		}

		if (typeof promisify !== 'function')
			console.log('promisify not yet implemented');
		else {
			console.log('promisify start');
			var delay2 = promisify(sleep);
			console.log('promisify sleep', yield cb => sleep(50, 'sleep 50-0', cb));
			console.log('promisify delay', yield delay2(50, 'sleep 50-1'));
			console.log('promisify delay', yield delay2(50, 'sleep 50-2')
				((err, val) => err || (console.log('promisify delay', val), delay2(50, 'sleep 50-3')))
				((err, val) => err || (console.log('promisify delay', val), delay2(50, 'sleep 50-4'))));
			console.log('promisify delay', yield delay2(50, 'sleep 50-5')
				.then(val => (console.log('promisify delay', val), delay2(50, 'sleep 50-6')))
				.then(val => (console.log('promisify delay', val), delay2(50, 'sleep 50-7'))));
			console.log('promisify works');
		}

		//function thunkify(fn) {
		//	return function () {
		//		var ctx = this, args = arguments;
		//		return Thunk(function (cb) {
		//			args[args.length++] = cb;
		//			fn.apply(ctx, args);
		//		});
		//	}
		//}
	}, err => err && console.error(err));

	//================================================================================
	function benchcb(name, bench, cb) {
		const start = Date.now();
		try {
			bench(function (err, val) {
				let msec = Date.now() - start;
				if (msec === 0 || val === 'N/A') msec = 'N/A';
				cb(err, name + ':' + msec);
				//{n: name, v: val, m: Date.now() - start});
			});
		} catch (err) { cb(err); }
	}

	const N = 5e4;
	function bench0(cb) {
		aa(function *() {
			for (var i = 0; i < N; ++i)
				yield i;
			return 0;
		}, cb);
	}
	function bench1(cb) {
		aa(function *() {
			var p = cb => cb(null, 0);
			for (var i = 0; i < N; ++i)
				yield p;
			return 0;
		}, cb);
	}
	function bench2(cb) {
		try {
			var p = Promise.resolve(0);
			var pr = function (val) { return Promise.resolve(0); };
			for (var i = 0; i < N; ++i)
				p = p.then(pr);
			p.then(val => cb(null, val), err => cb(err));
		} catch (err) { cb(err); }
	}
	function bench3(cb) {
		try {
			var p = Thunk(function (cb) { cb(null, 0); });
			var th = function (err, val) {
				return Thunk(function (cb) { cb(null, 0); }); };
			for (var i = 0; i < N; ++i)
				p = p(th);
			p(cb);
		} catch (err) { cb(err); }
	}
	function bench4(cb) {
		try {
			var p = Thunk.resolve(0);
			var tr = function (val) { return Thunk.resolve(0); };
			for (var i = 0; i < N; ++i)
				p = p.then(tr);
			p.then(val => cb(null, val), err => cb(err));
		} catch (err) { cb(err); }
	}
	function bench5(cb) {
		aa(function *() {
			var SetImmediate = typeof setImmediate === 'function' ? setImmediate : null;
			if (!SetImmediate) return 'N/A';
			var p = cb => SetImmediate(cb);
			for (var i = 0; i < N; ++i)
				yield p;
			return 0;
		}, cb);
	}
	function bench6(cb) {
		aa(function *() {
			var processNextTick = typeof process === 'object' && process &&
				typeof process.nextTick === 'function' ? process.nextTick : null;
			if (!processNextTick) return 'N/A';
			var p = cb => processNextTick(cb);
			for (var i = 0; i < N; ++i)
				yield p;
			return 0;
		}, cb);
	}

	//================================================================================
	aa(function *() {
		yield wait(9000);
		console.log(yield cb => benchcb('0:Primitives', bench0, cb));
		console.log(yield cb => benchcb('1:Callback', bench1, cb));
		console.log(yield cb => benchcb('2:Promise', bench2, cb));
		console.log(yield cb => benchcb('3:ThunkSync', bench3, cb));
		console.log(yield cb => benchcb('4:ThunkAsync', bench4, cb));
		console.log(yield cb => benchcb('5:setImmediate', bench5, cb));
		console.log(yield cb => benchcb('6:process.nextTick', bench6, cb));
		console.log('Benchmark start');
		for (var i = 0; i < 20; ++i) {
			console.log(
				yield cb => benchcb('0:Primitives', bench0, cb),
				yield cb => benchcb('1:Callback', bench1, cb),
				yield cb => benchcb('2:Promise', bench2, cb),
				yield cb => benchcb('3:Thunk', bench3, cb),
				yield cb => benchcb('4:ThunkThen', bench4, cb),
				yield cb => benchcb('5:setImmed', bench5, cb),
				yield cb => benchcb('6:proc.next', bench6, cb));
		}
		console.log('Benchmark end');
	}, err => err && console.error(err));

}
