/*jslint indent: 2*/
/*globals require: true*/
(function () {
  var assert, sys, fs, inireader, beginSection, test,
    commonTests, testCallbacks,
    testFileReadWrite, testFileRead, testFileReadAsync,
    testAsync;


  assert = require('assert');
  sys = require('sys');
  fs = require('fs');
  inireader = require('inireader');

  beginSection = function (s) {
    sys.puts('-------------- ' + s.toUpperCase() + ' --------------');
  };

  test = function (obj) {
    assert.equal(typeof(obj.param('doesntexists')), 'undefined',
    'nonexisting key doesn\'t returned undefined');
    assert.equal(typeof(obj.param('foo')), 'object', 'existing key doesn\'t returned an object');
    assert.equal(typeof(obj.param('bar')), 'object', 'existing key doesn\'t returned an object');

    assert.deepEqual(obj.param('foo.lorem'),
      'ipsum', 'lorem\'s key value in foo conf is not ipsum');
    assert.deepEqual(obj.param('foo.amet'), '', 'amet\'s value should be an empty string');
    assert.equal(typeof(obj.param('foo.doesntexists')),
      'undefined', 'value which should not exist returned something else then undefined');

    assert.deepEqual(obj.param('bar.asdfas'), 'fooobar', 'bad value');
    assert.deepEqual(obj.param('bar.1'), 'lorem ipsum');
    assert.deepEqual(obj.param('bar.2'), '  lorem ipsum');
    assert.deepEqual(obj.param('bar.3'), 'lorem ipsum');
    assert.deepEqual(obj.param('bar.4'), 'lorem ipsum  ');
  };


  commonTests = function () {
    beginSection('common test');

    var cfg = new inireader.IniReader();
    cfg.load('./ize-unix.ini');
    test(cfg);
    sys.puts('unix tests finished');

    cfg = new inireader.IniReader();
    cfg.load('./ize-dos.ini');
    test(cfg);
    sys.puts('dos tests finished');

    cfg = new inireader.IniReader();
    cfg.load('./ize-mac.ini');
    test(cfg);
    sys.puts('mac tests finished');
  };

  testCallbacks = function () {
    beginSection('start callback test');

    var cfg = new inireader.IniReader();
    cfg.on('fileParse', function () {
      test(this);
      sys.puts('unix tests finished');
    });
    cfg.load('./ize-unix.ini');


    cfg = new inireader.IniReader();
    cfg.on('fileParse', function () {
      test(this);
      sys.puts('dos tests finished');

    });
    cfg.load('./ize-dos.ini');

    cfg = new inireader.IniReader();
    cfg.on('fileParse', function () {
      test(this);
      sys.puts('mac tests finished');
    });
    cfg.load('./ize-mac.ini');


  };

  testFileReadWrite = function (obj) {
    obj.param('a.foo', '1');
    obj.param('a.bar', '2');
    obj.param('a.baz', '3');
    obj.param('lorem.ipsum', 'dolor');
    obj.on('fileWritten', function () {
      sys.puts('saving file finished');
      obj.on('fileParse', function () {
        assert.equal(typeof this.param('a'), 'object');
        assert.equal(this.param('a.foo'), '1');
        assert.equal(this.param('a.bar'), '2');
        assert.equal(this.param('a.baz'), '3');
        assert.equal(this.param('lorem.ipsum'), 'dolor');
        sys.puts('reading saved file finished');
        fs.unlink('boo.ini');
      });
      obj.load('boo.ini');
    });
    obj.write('boo.ini');
  };
  testFileRead = function () {
    beginSection('test file read');

    var booConf = new inireader.IniReader();
    testFileReadWrite(booConf);
  };

  testFileReadAsync = function () {
    beginSection('test file read async');

    var booConf = new inireader.IniReader({async: true});
    testFileReadWrite(booConf);
  };

  testAsync = function () {
    beginSection('test async');

    var a = 0,
      cb = function () {
      a += 1;
      if (a === 3) {
        testFileReadAsync();
      }
    }, cfg;

    cfg = new inireader.IniReader({async: true});
    cfg.on('fileParse', function () {
      test(this);
      sys.puts('unix tests finished');
      cb();
    });
    cfg.load('./ize-unix.ini');

    cfg = new inireader.IniReader({async: true});
    cfg.on('fileParse', function () {
      test(this);
      sys.puts('dos tests finished');
      cb();
    });
    cfg.load('./ize-dos.ini');

    cfg = new inireader.IniReader({async: true});
    cfg.on('fileParse', function () {
      test(this);
      sys.puts('mac tests finished');
      cb();
    });
    cfg.load('./ize-mac.ini');


  };

  // run tests
  commonTests();
  testCallbacks();
  testFileRead();
  testAsync();
}());
