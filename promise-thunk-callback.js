// promise-thunk-callback

(this || {}).promiseThunkCallback = function () {
	'use strict';

	if (typeof module === 'object' && module && module.exports)
		module.exports = promiseThunkCallback;

	function promiseThunkCallback() {
		var promise, resolve, reject, pending = true;
		var ctx, results, cbs = [];

		function setup(res, rej) { resolve = res; reject = rej; }

		function thunk(cb) {
			if (typeof cb === 'function') cbs.push(cb);
			results && callback.apply(ctx, results);
		}

		thunk.then = function then(res, rej) {
			promise || (promise = new Promise(setup));
			results && callback.apply(ctx, results);
			return promise.then(res, rej);
		};

		thunk['catch'] = function caught(rej) {
			promise || (promise = new Promise(setup));
			results && callback.apply(ctx, results);
			return promise['catch'](rej)
		};

		function callback(err, val) {
			results || (ctx = this, results = arguments);

			var cb;
			while (cb = cbs.shift()) cb.apply(ctx, results);

			if (pending && promise) {
				results[0] ? reject(results[0]) : resolve(results[1]);
				pending = false;
			}
		}

		callback.promiseThunk = thunk;
		return callback;
	}

} ();
