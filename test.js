var assert = require('assert');
var sys = require('sys');
var inireader = require('./inireader');


var izeConf = new inireader.IniReader('./ize-unix.ini');

assert.equal(typeof(izeConf.getBlock('doesntexists')), 'undefined', 'non existing key doesn\'t returned undefined');
assert.equal(typeof(izeConf.getBlock('foo')), 'object', 'existing key doesn\'t returned an object');
assert.equal(typeof(izeConf.getBlock('bar')), 'object', 'existing key doesn\'t returned an object');

assert.deepEqual(izeConf.getValue('foo', 'lorem'), 'ipsum', 'lorem\'s key value in foo conf is not ipsum');
assert.deepEqual(izeConf.getValue('foo', 'amet'), '', 'amet\'s value should be an empty string');
assert.equal(typeof(izeConf.getValue('foo', 'doesntexists')), 'undefined', 'value which should not exist returned something else then undefined');


assert.deepEqual(izeConf.getValue('bar', 'asdfas'), 'fooobar', 'bad value');
assert.deepEqual(izeConf.getValue('bar', '1'), 'lorem ipsum');
assert.deepEqual(izeConf.getValue('bar', '2'), '  lorem ipsum');
assert.deepEqual(izeConf.getValue('bar', '3'), 'lorem ipsum');
assert.deepEqual(izeConf.getValue('bar', '4'), 'lorem ipsum  ');

sys.puts('unix tests finished');


var izeConf = new inireader.IniReader('./ize-dos.ini');

assert.equal(typeof(izeConf.getBlock('doesntexists')), 'undefined', 'non existing key doesn\'t returned undefined');
assert.equal(typeof(izeConf.getBlock('foo')), 'object', 'existing key doesn\'t returned an object');
assert.equal(typeof(izeConf.getBlock('bar')), 'object', 'existing key doesn\'t returned an object');

assert.deepEqual(izeConf.getValue('foo', 'lorem'), 'ipsum', 'lorem\'s key value in foo conf is not ipsum');
assert.deepEqual(izeConf.getValue('foo', 'amet'), '', 'amet\'s value should be an empty string');
assert.equal(typeof(izeConf.getValue('foo', 'doesntexists')), 'undefined', 'value which should not exist returned something else then undefined');


assert.deepEqual(izeConf.getValue('bar', 'asdfas'), 'fooobar', 'bad value');
assert.deepEqual(izeConf.getValue('bar', '1'), 'lorem ipsum');
assert.deepEqual(izeConf.getValue('bar', '2'), '  lorem ipsum');
assert.deepEqual(izeConf.getValue('bar', '3'), 'lorem ipsum');
assert.deepEqual(izeConf.getValue('bar', '4'), 'lorem ipsum  ');

sys.puts('dos tests finished');




var izeConf = new inireader.IniReader('./ize-mac.ini');

assert.equal(typeof(izeConf.getBlock('doesntexists')), 'undefined', 'non existing key doesn\'t returned undefined');
assert.equal(typeof(izeConf.getBlock('foo')), 'object', 'existing key doesn\'t returned an object');
assert.equal(typeof(izeConf.getBlock('bar')), 'object', 'existing key doesn\'t returned an object');

assert.deepEqual(izeConf.getValue('foo', 'lorem'), 'ipsum', 'lorem\'s key value in foo conf is not ipsum');
assert.deepEqual(izeConf.getValue('foo', 'amet'), '', 'amet\'s value should be an empty string');
assert.equal(typeof(izeConf.getValue('foo', 'doesntexists')), 'undefined', 'value which should not exist returned something else then undefined');


assert.deepEqual(izeConf.getValue('bar', 'asdfas'), 'fooobar', 'bad value');
assert.deepEqual(izeConf.getValue('bar', '1'), 'lorem ipsum');
assert.deepEqual(izeConf.getValue('bar', '2'), '  lorem ipsum');
assert.deepEqual(izeConf.getValue('bar', '3'), 'lorem ipsum');
assert.deepEqual(izeConf.getValue('bar', '4'), 'lorem ipsum  ');

sys.puts('mac tests finished');
