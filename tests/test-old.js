/*jslint indent: 2*/
/*globals require: true*/
var assert = require('assert');
var util = require('util');
var inireader = require('../index');


var izeConf = new inireader.IniReader('./ize-unix.ini');
izeConf.init();

assert.equal(typeof(izeConf.getBlock('doesntexists')), 'undefined',
'nonexisting key doesn\'t returned undefined');
assert.equal(typeof(izeConf.getBlock('foo')), 'object', 'existing key doesn\'t returned an object');
assert.equal(typeof(izeConf.getBlock('bar')), 'object', 'existing key doesn\'t returned an object');

assert.deepEqual(izeConf.getValue('foo', 'lorem'),
  'ipsum', 'lorem\'s key value in foo conf is not ipsum');
assert.deepEqual(izeConf.getValue('foo', 'amet'), '', 'amet\'s value should be an empty string');
assert.equal(typeof(izeConf.getValue('foo', 'doesntexists')),
  'undefined', 'value which should not exist returned something else then undefined');


assert.deepEqual(izeConf.getValue('bar', 'asdfas'), 'fooobar', 'bad value');
assert.deepEqual(izeConf.getValue('bar', '1'), 'lorem ipsum');
assert.deepEqual(izeConf.getValue('bar', '2'), '  lorem ipsum');
assert.deepEqual(izeConf.getValue('bar', '3'), 'lorem ipsum');
assert.deepEqual(izeConf.getValue('bar', '4'), 'lorem ipsum  ');

util.puts('unix tests finished');


var izeConf = new inireader.IniReader('./ize-dos.ini');
izeConf.init();

assert.equal(typeof(izeConf.getBlock('doesntexists')),
  'undefined', 'non existing key doesn\'t returned undefined');
assert.equal(typeof(izeConf.getBlock('foo')), 'object', 'existing key doesn\'t returned an object');
assert.equal(typeof(izeConf.getBlock('bar')), 'object', 'existing key doesn\'t returned an object');

assert.deepEqual(izeConf.getValue('foo', 'lorem'),
  'ipsum', 'lorem\'s key value in foo conf is not ipsum');
assert.deepEqual(izeConf.getValue('foo', 'amet'),
  '', 'amet\'s value should be an empty string');
assert.equal(typeof(izeConf.getValue('foo', 'doesntexists')),
  'undefined', 'value which should not exist returned something else then undefined');


assert.deepEqual(izeConf.getValue('bar', 'asdfas'), 'fooobar', 'bad value');
assert.deepEqual(izeConf.getValue('bar', '1'), 'lorem ipsum');
assert.deepEqual(izeConf.getValue('bar', '2'), '  lorem ipsum');
assert.deepEqual(izeConf.getValue('bar', '3'), 'lorem ipsum');
assert.deepEqual(izeConf.getValue('bar', '4'), 'lorem ipsum  ');

util.puts('dos tests finished');




var izeConf = new inireader.IniReader('./ize-mac.ini');
izeConf.init();

assert.equal(typeof(izeConf.getBlock('doesntexists')),
  'undefined', 'non existing key doesn\'t returned undefined');
assert.equal(typeof(izeConf.getBlock('foo')), 'object', 'existing key doesn\'t returned an object');
assert.equal(typeof(izeConf.getBlock('bar')), 'object', 'existing key doesn\'t returned an object');

assert.deepEqual(izeConf.getValue('foo', 'lorem'),
  'ipsum', 'lorem\'s key value in foo conf is not ipsum');
assert.deepEqual(izeConf.getValue('foo', 'amet'),
  '', 'amet\'s value should be an empty string');
assert.equal(typeof(izeConf.getValue('foo', 'doesntexists')),
  'undefined', 'value which should not exist returned something else then undefined');


assert.deepEqual(izeConf.getValue('bar', 'asdfas'), 'fooobar', 'bad value');
assert.deepEqual(izeConf.getValue('bar', '1'), 'lorem ipsum');
assert.deepEqual(izeConf.getValue('bar', '2'), '  lorem ipsum');
assert.deepEqual(izeConf.getValue('bar', '3'), 'lorem ipsum');
assert.deepEqual(izeConf.getValue('bar', '4'), 'lorem ipsum  ');

util.puts('mac tests finished');



util.puts('start callback test');



var izeConf = new inireader.IniReader('./ize-unix.ini');
izeConf.on('fileParse', function () {
  assert.equal(typeof(this.getBlock('doesntexists')), 'undefined',
    'nonexisting key doesn\'t returned undefined');
  assert.equal(typeof(this.getBlock('foo')),
    'object', 'existing key doesn\'t returned an object');
  assert.equal(typeof(this.getBlock('bar')),
    'object', 'existing key doesn\'t returned an object');

  assert.deepEqual(this.getValue('foo', 'lorem'),
    'ipsum', 'lorem\'s key value in foo conf is not ipsum');
  assert.deepEqual(this.getValue('foo', 'amet'), '', 'amet\'s value should be an empty string');
  assert.equal(typeof(this.getValue('foo', 'doesntexists')),
    'undefined', 'value which should not exist returned something else then undefined');


  assert.deepEqual(this.getValue('bar', 'asdfas'), 'fooobar', 'bad value');
  assert.deepEqual(this.getValue('bar', '1'), 'lorem ipsum');
  assert.deepEqual(this.getValue('bar', '2'), '  lorem ipsum');
  assert.deepEqual(this.getValue('bar', '3'), 'lorem ipsum');
  assert.deepEqual(this.getValue('bar', '4'), 'lorem ipsum  ');

  util.puts('unix tests finished');
});
izeConf.init();


var izeConf = new inireader.IniReader('./ize-dos.ini');
izeConf.on('fileParse', function () {

  assert.equal(typeof(this.getBlock('doesntexists')),
    'undefined', 'non existing key doesn\'t returned undefined');
  assert.equal(typeof(this.getBlock('foo')),
    'object', 'existing key doesn\'t returned an object');
  assert.equal(typeof(this.getBlock('bar')),
    'object', 'existing key doesn\'t returned an object');

  assert.deepEqual(this.getValue('foo', 'lorem'),
    'ipsum', 'lorem\'s key value in foo conf is not ipsum');
  assert.deepEqual(this.getValue('foo', 'amet'),
    '', 'amet\'s value should be an empty string');
  assert.equal(typeof(this.getValue('foo', 'doesntexists')),
    'undefined', 'value which should not exist returned something else then undefined');


  assert.deepEqual(this.getValue('bar', 'asdfas'), 'fooobar', 'bad value');
  assert.deepEqual(this.getValue('bar', '1'), 'lorem ipsum');
  assert.deepEqual(this.getValue('bar', '2'), '  lorem ipsum');
  assert.deepEqual(this.getValue('bar', '3'), 'lorem ipsum');
  assert.deepEqual(this.getValue('bar', '4'), 'lorem ipsum  ');

  util.puts('dos tests finished');

});
izeConf.init();



var izeConf = new inireader.IniReader('./ize-mac.ini');
izeConf.on('fileParse', function () {
  assert.equal(typeof(this.getBlock('doesntexists')),
    'undefined', 'non existing key doesn\'t returned undefined');
  assert.equal(typeof(this.getBlock('foo')),
    'object', 'existing key doesn\'t returned an object');
  assert.equal(typeof(this.getBlock('bar')),
    'object', 'existing key doesn\'t returned an object');

  assert.deepEqual(this.getValue('foo', 'lorem'),
    'ipsum', 'lorem\'s key value in foo conf is not ipsum');
  assert.deepEqual(this.getValue('foo', 'amet'),
    '', 'amet\'s value should be an empty string');
  assert.equal(typeof(this.getValue('foo', 'doesntexists')),
    'undefined', 'value which should not exist returned something else then undefined');


  assert.deepEqual(this.getValue('bar', 'asdfas'), 'fooobar', 'bad value');
  assert.deepEqual(this.getValue('bar', '1'), 'lorem ipsum');
  assert.deepEqual(this.getValue('bar', '2'), '  lorem ipsum');
  assert.deepEqual(this.getValue('bar', '3'), 'lorem ipsum');
  assert.deepEqual(this.getValue('bar', '4'), 'lorem ipsum  ');

  util.puts('mac tests finished');
});
izeConf.init();
