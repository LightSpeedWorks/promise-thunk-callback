'use strict';

const promiseThunkCallback = require('../promise-thunk-callback');

function sleep(msec, val, cb) {
	if (!cb) cb = promiseThunkCallback();
	if (msec < 0) cb(new Error('msec must be zeror or plus!'));
	else setTimeout(cb, msec, null, val);
	return cb.promiseThunk;
}

// with Callback
sleep(100, 'Sleep with Callback',
	function (err, val) { console.log(err + '', val); });

// as a Promise
sleep(200, 'Sleep as a Promise')
	.then(function (val) { console.log(val); },
		function (err) { console.error(err + ''); });
sleep(300, 'Sleep as a Promise')
	.then(function (val) { console.log(val); })
	.catch(function (err) { console.error(err + ''); });

// as a Thunk
sleep(400, 'Sleep as a Thunk')
	(function (err, val) { console.log(err + '', val); });

sleep(-100, '-Sleep with Callback',
	function (err, val) { console.log(err + '', val); });

// as a Promise
sleep(-200, '-Sleep as a Promise')
	.then(function (val) { console.log(val); },
		function (err) { console.error(err + ''); });
sleep(-300, '-Sleep as a Promise')
	.then(function (val) { console.log(val); })
	.catch(function (err) { console.error(err + ''); });

// as a Thunk
sleep(-400, '-Sleep as a Thunk')
	(function (err, val) { console.log(err + '', val); });

//const aa = require('aa');
const aa = gen => function cb(err, val) {
	const obj = err ? gen.throw(err) : gen.next(val);
	obj.done || (obj.value)(cb); } ();

aa(function *() {
	const val = yield sleep(500, 'Sleep with Generators');
	console.log(val);
	try {
		const val = yield sleep(-100, '-Sleep with Generators');
	} catch (err) {
		console.error(err + '');
	}
} ());
