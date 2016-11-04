'use strict';

const promiseThunkCallback = require('../promise-thunk-callback');

function sleep(msec, val, cb) {
	if (!cb) cb = promiseThunkCallback();
	if (msec < 0) cb(new Error('msec must be zeror or plus!'));
	else setTimeout(cb, msec, null, val);
	return cb.promiseThunk;
}

class Sleep {
	constructor(msec) {
		this.msec = 600;
	}
	*sleep(val) {
		return console.log(yield sleep(this.msec, val));
	}
}

//const aa = require('aa');
const aa = gen => function cb(err, val) {
	const obj = err ? gen.throw(err) : gen.next(val);
	obj.done || (obj.value)(cb); } ();

aa(new Sleep(200).sleep('Sleep with Class and Generators'));

aa(function *() {
	console.log('start');
	const s = new Sleep(600);
	yield *s.sleep('Sleep with Class and Generators1');
	yield *s.sleep('Sleep with Class and Generators2');
} ());
