/*jslint indent: 2*/
/*globals require: true*/
var assert = require('assert');
var sys = require('sys');
var inireader = require('inireader');


var izeConf = new inireader.IniReader('./ize-unix.ini', true);
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

  sys.puts('unix tests finished');
});
izeConf.init();


var izeConf = new inireader.IniReader('./ize-dos.ini', true);
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

  sys.puts('dos tests finished');

});
izeConf.init();



var izeConf = new inireader.IniReader('./ize-mac.ini', true);
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

  sys.puts('mac tests finished');
});
izeConf.init();
