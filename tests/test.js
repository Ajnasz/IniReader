/*jslint indent: 2*/
/*globals require: true*/
(function () {
  var assert, util, fs, inireader, beginSection, test,
    commonTests, testCallbacks,
    testFileReadWrite, testFileRead, testFileReadAsync,
    testAsync, testError, testAsyncError;


  assert = require('assert');
  util = require('util');
  fs = require('fs');
  inireader = require('../index');

  beginSection = function (s, config) {
    var str = (config ? (' with config ' + require('util').inspect(config)) : '');
    util.puts('-------------- ' + str + s.toUpperCase() + ' --------------');
  };

  test = function (obj) {
    ['param', 'interpolate'].forEach(function (fnGet) {
      assert.deepEqual(typeof obj[fnGet](), 'object', "empty key doesn't returned object");
      assert.deepEqual(typeof obj[fnGet]('doesntexists'), 'undefined',
                    "nonexisting key doesn't returned undefined");
      assert.deepEqual(typeof obj[fnGet]('foo'), 'object', "key doesn't returned an object");
      assert.deepEqual(typeof obj[fnGet]('bar'), 'object', "key doesn't returned an object");

      assert.deepEqual(obj[fnGet]('foo.lorem'), 'ipsum',
        "lorem's key value in foo conf is not ipsum");
      assert.deepEqual(obj[fnGet]().foo.lorem, 'ipsum',
        "lorem's key value in foo conf is not ipsum when " +
          fnGet + ' is called without argument');
      assert.deepEqual(obj[fnGet]('foo').lorem, 'ipsum',
        "lorem's key value in foo conf is not ipsum when " +
          fnGet + ' is called with argument foo');
      assert.deepEqual(obj[fnGet]('foo.amet'), '', "amet's value should be an empty string");
      assert.deepEqual(typeof obj[fnGet]('foo.doesntexists'), 'undefined',
        'value which should not exist returned something else then undefined');


      // Test of section "DEFAULT" {--
      assert.deepEqual(
        obj[fnGet]('DEFAULT.test_default'),
        'I come from the default section',
        "test_default's key value in DEFAULT is wrong"
      );

      if (obj.inheritDefault) {
        assert.deepEqual(
          obj[fnGet]('foo.test_default'),
          'I come from the default section',
          "test_default's key value in foo is not inherited from DEFAULT section"
        );
        assert.deepEqual(
          obj[fnGet]().foo.test_default,
          'I come from the default section',
          "test_default's key value in foo is not inherited from DEFAULT section"
        );
        [obj[fnGet]().foo.test_default, obj[fnGet]('foo.test_default')].forEach(
          function (item) {
            assert.deepEqual(
              item,
              'I come from the default section',
              "test_default's key value in foo is not inherited from DEFAULT section"
            );
          }
        );
        [obj[fnGet]().bar.test_default, obj[fnGet]('bar.test_default')].forEach(
          function (item) {
            assert.deepEqual(
              item,
              'I come from bar',
              "test_default's key value in bar is not overwrited"
            );
          }
        );
      } else {
        assert.deepEqual(
          typeof obj[fnGet]('foo.test_default'),
          'undefined',
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
    assert.deepEqual(obj.interpolate('foo.interpolate'), 'sittercity',
                     'Interpolation is wrong');
    assert.deepEqual(obj.interpolate().foo.interpolate, 'sittercity',
                     'Interpolation without arguments is wrong');
    assert.deepEqual(obj.interpolate('foo').interpolate, 'sittercity',
                     'Interpolation with block as argument is wrong');
    assert.deepEqual(obj.interpolate('foo.interpolate_block2'), 'ipsumfooobar',
      'Interpolation is wrong');
    if (obj.inheritDefault) {
      assert.deepEqual(obj.interpolate('foo.interpolate_default'),
        'I come from the default section / interpolation',
        'Interpolation with inheritance from block "DEFAULT" is wrong');
      assert.deepEqual(obj.interpolate().foo.interpolate_default,
        'I come from the default section / interpolation',
        'Interpolation without arguments and with inheritance from current block' +
        ' "DEFAULT" is wrong');
      assert.deepEqual(obj.interpolate('foo').interpolate_default,
        'I come from the default section / interpolation',
        'Interpolation with block as argument and with inheritance from current block' +
        ' "DEFAULT" is wrong');
      assert.deepEqual(obj.interpolate('bar.interpolate_block_recursive'),
        'I come from bar / block interpolation / recursive',
        'Interpolation wiht inheritance from block "DEFAULT" and recursion is wrong');
    }
    assert.deepEqual(obj.interpolate('foo.interpolate_block'),
      'I come from bar / block interpolation', 'Interpolation from other block is wrong');

    // --}
  };


  commonTests = function (config) {
    beginSection('common test', config);

    var cfg = new inireader.IniReader(config);
    cfg.load('./ize-unix.ini');
    test(cfg);
    util.puts('unix tests finished');

    cfg = new inireader.IniReader(config);
    cfg.load('./ize-dos.ini');
    test(cfg);
    util.puts('dos tests finished');

    cfg = new inireader.IniReader(config);
    cfg.load('./ize-mac.ini');
    test(cfg);
    util.puts('mac tests finished');
  };

  testCallbacks = function (config) {
    beginSection('start callback test', config);

    var cfg = new inireader.IniReader();
    cfg.on('fileParse', function () {
      test(this);
      util.puts('unix tests finished');
    });
    cfg.load('./ize-unix.ini');


    cfg = new inireader.IniReader();
    cfg.on('fileParse', function () {
      test(this);
      util.puts('dos tests finished');

    });
    cfg.load('./ize-dos.ini');

    cfg = new inireader.IniReader();
    cfg.on('fileParse', function () {
      test(this);
      util.puts('mac tests finished');
    });
    cfg.load('./ize-mac.ini');


  };

  testFileReadWrite = function (obj) {
    obj.param('a.foo', '1');
    obj.param('a.bar', '2');
    obj.param('a.baz', '3');
    obj.param('lorem.ipsum', 'dolor');
    obj.param('newobject', {a: 1, b: 2});
    obj.on('fileWritten', function () {
      util.puts('saving file finished');
      obj.on('fileParse', function () {
        assert.deepEqual(typeof this.param('a'), 'object');
        assert.deepEqual(this.param('a.foo'), '1');
        assert.deepEqual(this.param('a.bar'), '2');
        assert.deepEqual(this.param('a.baz'), '3');
        assert.deepEqual(this.param('lorem.ipsum'), 'dolor');
        assert.deepEqual(this.param('newobject.a'), 1, 'setting new object failed');
        util.puts('reading saved file finished');
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

    var a, cb, cfg;

    a = 0;
    cb = function () {
      a += 1;
      if (a === 3) {
        testFileReadAsync();
      }
    };

    cfg = new inireader.IniReader({async: true});
    cfg.on('fileParse', function () {
      test(this);
      util.puts('unix tests finished');
      cb();
    });
    cfg.load('./ize-unix.ini');

    cfg = new inireader.IniReader({async: true});
    cfg.on('fileParse', function () {
      test(this);
      util.puts('dos tests finished');
      cb();
    });
    cfg.load('./ize-dos.ini');

    cfg = new inireader.IniReader({async: true});
    cfg.on('fileParse', function () {
      test(this);
      util.puts('mac tests finished');
      cb();
    });
    cfg.load('./ize-mac.ini');

  };

  testError = function () {
    var cfg, errorFound, syntaxErrFound, noFileNameErr, noSuchFile;

    cfg = new inireader.IniReader();
    errorFound = 0;
    syntaxErrFound = false;
    noFileNameErr = false;
    noSuchFile = false;

    cfg.on('error', function (err) {
      if (err.message.indexOf('Syntax error in line ') > -1) {
        syntaxErrFound = true;
      } else if (err.message.indexOf('No file name given') > -1) {
        noFileNameErr = true;
      } else if (err.message.indexOf('ENOENT') > -1) {
        noSuchFile = true;
      }
      errorFound += 1;
    });
    cfg.load('./ize-.ini');
    cfg.file = null;
    cfg.load('./ize-err.ini');
    cfg.file = null;
    cfg.load();
    assert.deepEqual(errorFound, 3, 'Not all error found: ' + errorFound);
    assert.ok(syntaxErrFound, 'Syntax error not found');
    assert.ok(noFileNameErr, 'no file name error not found');
    assert.ok(noSuchFile, 'not existing file error not thrown');
  };

  testAsyncError = function () {
    var cfg, errorFound, syntaxErrFound, noFileNameErr, noSuchFile, testTimeout;

    cfg = new inireader.IniReader({async: true});
    errorFound = 0;
    syntaxErrFound = false;
    noFileNameErr = false;
    noSuchFile = false;

    function finish() {
      clearTimeout(testTimeout);
      assert.deepEqual(errorFound, 3, 'Not all error found: ' + errorFound);
      assert.ok(syntaxErrFound, 'Syntax error not found');
      assert.ok(noFileNameErr, 'no file name error not found');
      assert.ok(noSuchFile, 'not existing file error not thrown');
    }

    cfg.on('error', function (err) {
      if (err.message.indexOf('Syntax error in line ') > -1) {
        syntaxErrFound = true;
      } else if (err.message.indexOf('No file name given') > -1) {
        noFileNameErr = true;
      } else if (err.message.indexOf('ENOENT') > -1) {
        noSuchFile = true;
      }

      errorFound += 1;

      if (errorFound === 3) {
        finish();
      }
    });

    cfg.load('./ize-.ini');
    cfg.file = null;
    cfg.load('./ize-err.ini');
    cfg.file = null;
    cfg.load();

    testTimeout = setTimeout(finish, 100);
  };

  // run tests
  commonTests();
  commonTests({inheritDefault: true});
  testCallbacks();
  testFileRead();
  testAsync();
  testError();
  testAsyncError();
}());
