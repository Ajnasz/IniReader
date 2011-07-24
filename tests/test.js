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

  beginSection = function (s, config) {
    var str = (config ? (' with config ' + require('util').inspect(config)) : '');
    sys.puts('-------------- ' + str + s.toUpperCase() + ' --------------');
  };

  test = function (obj) {
    ['param', 'interpolate'].forEach(function (fnGet) {
      assert.equal(typeof(obj[fnGet]()), 'object', "empty key doesn't returned object");
      assert.equal(typeof(obj[fnGet]('doesntexists')), 'undefined',
                    "nonexisting key doesn't returned undefined");
      assert.equal(typeof(obj[fnGet]('foo')), 'object', "existing key doesn't returned an object");
      assert.equal(typeof(obj[fnGet]('bar')), 'object', "existing key doesn't returned an object");

      assert.deepEqual(obj[fnGet]('foo.lorem'), 'ipsum',
        "lorem's key value in foo conf is not ipsum");
      assert.deepEqual(obj[fnGet]().foo.lorem, 'ipsum',
        "lorem's key value in foo conf is not ipsum");
      assert.deepEqual(obj[fnGet]('foo.amet'), '', "amet's value should be an empty string");
      assert.equal(typeof(obj[fnGet]('foo.doesntexists')), 'undefined',
        'value which should not exist returned something else then undefined');


      // Test of section "DEFAULT" {--
      assert.deepEqual(obj[fnGet]('DEFAULT.test_default'), 'I come from the default section',
        "test_default's key value in DEFAULT is wrong"
      );

      if (obj.inheritDefault) {
        assert.deepEqual(obj[fnGet]('foo.test_default'), 'I come from the default section',
          "test_default's key value in foo is not inherited from DEFAULT section"
        );
        assert.deepEqual(obj[fnGet]().foo.test_default, 'I come from the default section',
          "test_default's key value in foo is not inherited from DEFAULT section"
        );
        [obj[fnGet]().foo.test_default, obj[fnGet]('foo.test_default')].forEach(
          function (_) {
            assert.deepEqual(_, 'I come from the default section',
              "test_default's key value in foo is not inherited from DEFAULT section"
            );
          }
        );
        [obj[fnGet]().bar.test_default, obj[fnGet]('bar.test_default')].forEach(
          function (_) {
            assert.deepEqual(_, 'I come from bar',
              "test_default's key value in bar is not overwrited");
          }
        );
      } else {
        assert.equal(typeof(obj[fnGet]('foo.test_default')), 'undefined',
          'value which should not exist returned something else then undefined'
        );
      }
      // --}


      assert.deepEqual(obj[fnGet]('bar.asdfas'), 'fooobar', 'bad value');
      assert.deepEqual(obj[fnGet]('bar.1'), 'lorem ipsum');
      assert.deepEqual(obj[fnGet]('bar.2'), '  lorem ipsum');
      assert.deepEqual(obj[fnGet]('bar.3'), 'lorem ipsum');
      assert.deepEqual(obj[fnGet]('bar.4'), 'lorem ipsum  ');
    });

    // Test the interpolations {--
    assert.deepEqual(obj.interpolate('foo.interpolate'), 'sittercity', 'Interpolation is wrong');
    assert.deepEqual(obj.interpolate('foo.interpolate_block2'),
      'ipsumfooobar', 'Interpolation is wrong');
    if (obj.inheritDefault) {
      assert.deepEqual(obj.interpolate('foo.interpolate_default'),
        'I come from the default section / interpolation',
        'Interpolation with inheritance from block "DEFAULT" is wrong');
      assert.deepEqual(obj.interpolate('bar.interpolate_block_recursive'),
        'I come from bar / block interpolation / recursive',
        'Interpolation wiht inheritance from block "DEFAULT" and recursion is wrong');
    }
    assert.deepEqual(obj.interpolate('foo.interpolate_block'),
      'I come from bar / block interpolation',
      'Interpolation from other block is wrong');

    // --}
  };


  commonTests = function (config) {
    beginSection('common test', config);

    var cfg = new inireader.IniReader(config);
    cfg.load('./ize-unix.ini');
    test(cfg);
    sys.puts('unix tests finished');

    cfg = new inireader.IniReader(config);
    cfg.load('./ize-dos.ini');
    test(cfg);
    sys.puts('dos tests finished');

    cfg = new inireader.IniReader(config);
    cfg.load('./ize-mac.ini');
    test(cfg);
    sys.puts('mac tests finished');
  };

  testCallbacks = function (config) {
    beginSection('start callback test', config);

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
  commonTests({inheritDefault: true});
  testCallbacks();
  testFileRead();
  testAsync();
}());
