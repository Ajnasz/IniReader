/*jslint indent: 2*/
/*globals require: true*/
(function () {
  var assert, util, fs, inireader, beginSection, test,
    commonTests, testCallbacks,
    testFileReadWrite, testFileRead, testFileReadAsync,
    testAsync, testError, testAsyncError, testWriteError, testMultiValue, testHooks;


  assert = require('assert');
  util = require('util');
  fs = require('fs');
  inireader = require('../index');

  var undef;

  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
  }

  function getRandomFilename(len) {
    var fn = '';

    len = len || 10;

    while (fn.length < len) {
      fn += String.fromCharCode(getRandomInt(97, 122));
    }

    return './' + fn + '.ini';
  }

  beginSection = function (s, config) {
    var str = (config ? (' with config ' + util.inspect(config)) : '');
    console.log('-------------- ' + str + s.toUpperCase() + ' --------------');
  };

  test = function (obj) {
    ['param', 'interpolate'].forEach(function (fnGet) {

      assert.deepEqual(typeof obj[fnGet](), 'object', "empty key doesn't returned object");
      assert.deepEqual(typeof obj[fnGet]('doesntexists'), 'undefined',
                    "nonexisting key doesn't returned undefined");
      assert.deepEqual(typeof obj[fnGet]('foo'), 'object', "key doesn't returned an object");
      assert.deepEqual(typeof obj[fnGet]('bar'), 'object', "key doesn't returned an object");

      assert.equal(obj[fnGet]('foo.lorem'), 'ipsum',
        "lorem's key value in foo conf is not ipsum");
      assert.equal(obj[fnGet](['foo', 'lorem']), 'ipsum',
        "lorem's key value in foo conf is not ipsum (array get)");
      assert.equal(obj[fnGet]().foo.lorem, 'ipsum',
        "lorem's key value in foo conf is not ipsum when " +
          fnGet + ' is called without argument');
      assert.deepEqual(obj[fnGet]('foo').lorem, 'ipsum',
        "lorem's key value in foo conf is not ipsum when " +
          fnGet + ' is called with argument foo');
      assert.deepEqual(obj[fnGet]('foo.amet'), '', "amet's value should be an empty string");
      assert.deepEqual(obj[fnGet]('foo')['qux[0]'], 'quux');
      assert.deepEqual(obj[fnGet]('foo')['key with space'], 'Value');
      assert.deepEqual(typeof obj[fnGet]('block.and.period'), 'object', 'block name with period (no key) not found');
      assert.deepEqual(typeof obj[fnGet]('block.and.period.keyname'), 'string', 'block name with period plus key not found');
      assert.deepEqual(obj[fnGet]('theblock.key.period.name'), 'supervalue');
      assert.deepEqual(obj[fnGet]('another.block.with.period.and.a.key.with.period'), 'has a great value');
      assert.deepEqual(obj[fnGet]('block.to.conflict'), 'section names');
      assert.deepEqual(typeof obj[fnGet]('foo.doesntexists'), 'undefined',
        'value which should not exist returned something else then undefined');


      // Test of section "DEFAULT" {--
      assert.deepEqual(
        obj[fnGet]('DEFAULT.test_default'),
        'I come from the default section',
        "test_default's key value in DEFAULT is wrong"
      );

      assert.deepEqual(obj[fnGet]('no_such_block'), undef);
      assert.deepEqual(obj[fnGet]('foo.no_such_key'), undef);

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
      assert.deepEqual(obj[fnGet]('bar.2'), '  lorem ipsum space in begin');
      assert.deepEqual(obj[fnGet]('bar.3'), 'lorem ipsum');
      assert.deepEqual(obj[fnGet]('bar.4'), 'lorem ipsum space in end  ');
      assert.deepEqual(obj[fnGet]('bar.escape_doublequote'), '   foo\'s bar"baz   ');
      assert.deepEqual(obj[fnGet]('bar.escape_singlequote'), '   foo\'s bar"baz   ');
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

    console.log('unix tests started');
    var cfg = new inireader.IniReader(config);
    cfg.load('./ize-unix.ini');
    test(cfg);
    console.log('unix tests finished');

    console.log('dos tests started');
    cfg = new inireader.IniReader(config);
    cfg.load('./ize-dos.ini');
    test(cfg);
    console.log('dos tests finished');

    console.log('mac tests started');
    cfg = new inireader.IniReader(config);
    cfg.load('./ize-mac.ini');
    test(cfg);
    console.log('mac tests finished');
  };

  testCallbacks = function (config) {
    beginSection('start callback test', config);

    var cfg = new inireader.IniReader();
    cfg.on('fileParse', function () {
      test(this);
      console.log('unix tests finished');
    });
    cfg.load('./ize-unix.ini');


    cfg = new inireader.IniReader();
    cfg.on('fileParse', function () {
      test(this);
      console.log('dos tests finished');

    });
    cfg.load('./ize-dos.ini');

    cfg = new inireader.IniReader();
    cfg.on('fileParse', function () {
      test(this);
      console.log('mac tests finished');
    });
    cfg.load('./ize-mac.ini');


  };

  testFileReadWrite = function (obj) {
    var fn = getRandomFilename();

    obj.param('a.foo', '1');
    obj.param('a.bar', '2');
    obj.param('a.baz', '3');
    obj.param('lorem.ipsum', 'dolor');
    obj.param('newobject', {a: 1, b: 2});
    obj.param('new.object.block.key', 'abcd');
    obj.param(['block.name.with.period', 'key.with.period'], 'and its great value');
    obj.param('whitespace.just_whitspace', '  asdf');
    obj.param('whitespace.double_quote', '  "asdf');
    obj.param('whitespace.double_and_single_quote', '  "asdf\'s foo');

    obj.param('whitespace.doublequote_as_data', '"foo bar baz"');
    obj.param('whitespace.singlequote_as_data', '\'foo bar baz\'');

    obj.on('fileWritten', function () {
      console.log('saving file finished');
      obj.on('fileParse', function () {
        assert.deepEqual(typeof this.param('a'), 'object');
        assert.deepEqual(this.param('a.foo'), '1');
        assert.deepEqual(this.param('a.bar'), '2');
        assert.deepEqual(this.param('a.baz'), '3');
        assert.deepEqual(this.param('lorem.ipsum'), 'dolor');
        assert.deepEqual(this.param('newobject.a'), 1, 'setting new object failed');
        assert.deepEqual(this.param('new.object.block.key'), 'abcd', 'setting new object with period failed');
        assert.deepEqual(this.param('block.name.with.period.key.with.period'), 'and its great value',
                         'could not find key and block name with period');
        assert.deepEqual(this.param('block.name.with.period')['key.with.period'], 'and its great value',
                         'setting new block with period and key with period failed');

        assert.deepEqual(this.param('whitespace.just_whitspace'), '  asdf');
        assert.deepEqual(this.param('whitespace.double_and_single_quote'), '  "asdf\'s foo');
        assert.deepEqual(this.param('whitespace.doublequote_as_data'), '"foo bar baz"');
        assert.deepEqual(this.param('whitespace.singlequote_as_data'), '\'foo bar baz\'');
        console.log('reading saved file finished');
        fs.unlink(fn);
      });
      obj.load(fn);
    });
    obj.write(fn);
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
      console.log('unix tests finished');
      cb();
    });
    cfg.load('./ize-unix.ini');

    cfg = new inireader.IniReader({async: true});
    cfg.on('fileParse', function () {
      test(this);
      console.log('dos tests finished');
      cb();
    });
    cfg.load('./ize-dos.ini');

    cfg = new inireader.IniReader({async: true});
    cfg.on('fileParse', function () {
      test(this);
      console.log('mac tests finished');
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

  testWriteError = function () {
        var cfg = new inireader.IniReader({async: true});
        var testTimeout;
        var writeError = false, fileWritten = false;

        function finish() {
            clearTimeout(testTimeout);
            assert.ok(writeError, 'Write error not emitted');
            assert.ok(!fileWritten, 'fileWritten emitted');
        }

        cfg.load('./ize-nowrite.ini');

        cfg.on('fileWritten', function () {
            fileWritten = true;
        });
        cfg.on('error', function () {
            writeError = true;
        });

        setTimeout(function () {
            cfg.write();
        }, 50);

        testTimeout = setTimeout(finish, 100);
  };


  testMultiValue = function () {
    var cfg = new inireader.IniReader({multiValue: true}),
      fn = getRandomFilename();

    cfg.load('./ize-unix.ini');

    assert.equal(Object.prototype.toString.call(cfg.param('baz.key')), '[object Array]');
    assert.equal(cfg.param('baz.key').length, 3);
    assert.equal(cfg.param('baz.key')[0], 'value1');
    assert.equal(cfg.param('baz.key')[1], 'value2');
    assert.equal(cfg.param('baz.key')[2], 'value3');

    cfg.write(fn);
    cfg.load(fn);
    assert.equal(cfg.param('baz.key')[0], 'value1');
    assert.equal(cfg.param('baz.key')[1], 'value2');
    assert.equal(cfg.param('baz.key')[2], 'value3');
    fs.unlink(fn);
  };

  testHooks = function () {
    var cfg = new inireader.IniReader({
      hooks: {
        write: {
          keyValue: function (keyValue, group) {
            if (group === 'allquoted') {
              keyValue[1] = '"' + keyValue[1] + '"';
            }

            return keyValue;
          }
        }
      }
    }),
    fn = getRandomFilename();

    cfg.load('./ize-unix.ini');

    cfg.param(['allquoted', 'BanListURL'], 'http://foo.com/bar/baz');

    cfg.write(fn);
    cfg.load(fn);
    (function () {
      var file = fs.readFileSync(fn),
        quotedFound = false;

      file.toString('utf8').split('\n').forEach(function (line) {
        var value;
        if (quotedFound && value) {
          value = line.split('=')[1];

          assert(value[0] === '"');
          assert(value[1] !== '"');
          assert(value[value.length - 1] === '"');
          assert(value[value.length - 2] !== '"');
        }
        if (line === '[allquoted]') {
          quotedFound = true;
        }
      });

      assert(quotedFound);
    }());
    fs.unlink(fn);
  };

  // run tests
  commonTests();
  commonTests({inheritDefault: true});
  testCallbacks();
  testFileRead();
  testAsync();
  testError();
  testAsyncError();
  testWriteError();
  testMultiValue();
  testHooks();
}());

// vim: expandtab:sw=2:ts=2:
