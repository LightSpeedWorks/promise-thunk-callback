'use strict';

process.title = __filename.substr(__dirname.length + 1);
const Thunk = require('./thunk2');

const benchAll = require('./bench-all');
benchAll(Thunk);
