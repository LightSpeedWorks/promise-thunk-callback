promise-thunk-callback
====

easy to make async library.

support following feature:
+ ES6 Promise
+ Thunk
+ Node.js style callback

PREPARE:
----

```html
<script src="promise-thunk-callback.js"></script>
```

with Browserify or Node.js

```js
// ES5
var promiseThunkCallback = require('promise-thunk-callback');
// or
// with Babel and so on
import promiseThunkCallback from 'promise-thunk-callback';
```

QUICK EXAMPLE
----

if you have following async function:

```js
function sleep(msec, val, cb) {
	setTimeout(cb, msec, null, val);
}
```

you convert the following:

```js
function sleep(msec, val, cb) {
	if (!cb) cb = promiseThunkCallback();
	setTimeout(cb, msec, null, val);
	return cb.promiseThunk;
}
```

you can use with Callback, return value as a Promise or Thunk.

```js
// with Callback
sleep(100, 'Sleep with Callback',
	function (err, val) { console.log(err, val); });

// as a Promise
sleep(200, 'Sleep as a Promise')
	.then(function (val) { console.log(val); },
		function (err) { console.error(err); });
sleep(300, 'Sleep as a Promise')
	.then(function (val) { console.log(val); })
	.catch(function (err) { console.error(err); });

// as a Thunk
sleep(400, 'Sleep as a Thunk')
	(function (err, val) { console.log(err, val); });
```

LICENSE
----

  MIT
