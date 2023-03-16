/* eslint-disable no-console */
const assert = require('assert');
const util = require('util');
const fs = require('fs');
const inireader = require('../index');

(function testSuite() {
  let undef;

  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
  function getRandomInt(min, max) {
    const minVal = Math.ceil(min);
    const maxVal = Math.floor(max);
    return Math.floor(Math.random() * (maxVal - minVal)) + minVal;
  }

  function getRandomFilename(nameLen) {
    let fn = '';

    const len = nameLen || 10;

    while (fn.length < len) {
      fn += String.fromCharCode(getRandomInt(97, 122));
    }

    return `./${fn}.ini`;
  }

  function beginSection(s, config) {
    const str = (config ? (` with config ${util.inspect(config)}`) : '');
    console.log(`-------------- ${str}${s.toUpperCase()} --------------`);
  }

  function test(obj) {
    ['param', 'interpolate'].forEach((fnGet) => {
      assert.deepEqual(typeof obj[fnGet](), 'object', "empty key doesn't returned object");
      assert.deepEqual(
        typeof obj[fnGet]('doesntexists'),
        'undefined',
        "nonexisting key doesn't returned undefined",
      );
      assert.deepEqual(typeof obj[fnGet]('foo'), 'object', "key doesn't returned an object");
      assert.deepEqual(typeof obj[fnGet]('bar'), 'object', "key doesn't returned an object");

      assert.equal(
        obj[fnGet]('foo.lorem'),
        'ipsum',
        "lorem's key value in foo conf is not ipsum",
      );
      assert.equal(
        obj[fnGet](['foo', 'lorem']),
        'ipsum',
        "lorem's key value in foo conf is not ipsum (array get)",
      );
      assert.equal(
        obj[fnGet]().foo.lorem,
        'ipsum',
        `lorem's key value in foo conf is not ipsum when ${fnGet} is called without argument`,
      );
      assert.deepEqual(
        obj[fnGet]('foo').lorem,
        'ipsum',
        `lorem's key value in foo conf is not ipsum when ${fnGet} is called with argument foo`,
      );
      assert.deepEqual(obj[fnGet]('foo.amet'), '', "amet's value should be an empty string");
      assert.deepEqual(obj[fnGet]('foo')['qux[0]'], 'quux');
      assert.deepEqual(obj[fnGet]('foo')['key with space'], 'Value');
      assert.deepEqual(typeof obj[fnGet]('block.and.period'), 'object', 'block name with period (no key) not found');
      assert.deepEqual(typeof obj[fnGet]('block.and.period.keyname'), 'string', 'block name with period plus key not found');
      assert.deepEqual(obj[fnGet]('theblock.key.period.name'), 'supervalue');
      assert.deepEqual(obj[fnGet]('another.block.with.period.and.a.key.with.period'), 'has a great value');
      assert.deepEqual(obj[fnGet]('block.to.conflict'), 'section names');
      assert.deepEqual(
        typeof obj[fnGet]('foo.doesntexists'),
        'undefined',
        'value which should not exist returned something else then undefined',
      );

      // Test of section "DEFAULT" {--
      assert.deepEqual(
        obj[fnGet]('DEFAULT.test_default'),
        'I come from the default section',
        "test_default's key value in DEFAULT is wrong",
      );

      assert.deepEqual(obj[fnGet]('no_such_block'), undef);
      assert.deepEqual(obj[fnGet]('foo.no_such_key'), undef);

      if (obj.inheritDefault) {
        assert.deepEqual(
          obj[fnGet]('foo.test_default'),
          'I come from the default section',
          "test_default's key value in foo is not inherited from DEFAULT section",
        );
        assert.deepEqual(
          obj[fnGet]().foo.test_default,
          'I come from the default section',
          "test_default's key value in foo is not inherited from DEFAULT section",
        );
        [obj[fnGet]().foo.test_default, obj[fnGet]('foo.test_default')].forEach(
          (item) => {
            assert.deepEqual(
              item,
              'I come from the default section',
              "test_default's key value in foo is not inherited from DEFAULT section",
            );
          },
        );
        [obj[fnGet]().bar.test_default, obj[fnGet]('bar.test_default')].forEach(
          (item) => {
            assert.deepEqual(
              item,
              'I come from bar',
              "test_default's key value in bar is not overwrited",
            );
          },
        );
      } else {
        assert.deepEqual(
          typeof obj[fnGet]('foo.test_default'),
          'undefined',
          'value which should not exist returned something else then undefined',
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
    assert.deepEqual(obj.interpolate('foo.interpolate'), 'sittercity', 'Interpolation is wrong');
    assert.deepEqual(obj.interpolate().foo.interpolate, 'sittercity', 'Interpolation without arguments is wrong');
    assert.deepEqual(obj.interpolate('foo').interpolate, 'sittercity', 'Interpolation with block as argument is wrong');
    assert.deepEqual(obj.interpolate('foo.interpolate_block2'), 'ipsumfooobar', 'Interpolation is wrong');
    if (obj.inheritDefault) {
      assert.deepEqual(
        obj.interpolate('foo.interpolate_default'),
        'I come from the default section / interpolation',
        'Interpolation with inheritance from block "DEFAULT" is wrong',
      );
      assert.deepEqual(
        obj.interpolate().foo.interpolate_default,
        'I come from the default section / interpolation',
        'Interpolation without arguments and with inheritance from current block'
        + ' "DEFAULT" is wrong',
      );
      assert.deepEqual(
        obj.interpolate('foo').interpolate_default,
        'I come from the default section / interpolation',
        'Interpolation with block as argument and with inheritance from current block'
        + ' "DEFAULT" is wrong',
      );
      assert.deepEqual(
        obj.interpolate('bar.interpolate_block_recursive'),
        'I come from bar / block interpolation / recursive',
        'Interpolation wiht inheritance from block "DEFAULT" and recursion is wrong',
      );
    }
    assert.deepEqual(
      obj.interpolate('foo.interpolate_block'),
      'I come from bar / block interpolation',
      'Interpolation from other block is wrong',
    );

    // --}
  }

  function testRemoveParam(obj) {
    obj.removeParam('foo.lorem');
    assert.deepEqual(obj.param('foo.lorem'), undefined, 'foo.lorem expected to be undefined after delete');
    assert.deepEqual(obj.param('foo.ipus'), 'foo bar baz', 'foo.ipus should be kept');
    obj.removeParam(['foo', 'ipus']);
    assert.deepEqual(obj.param('foo.ipus'), undefined, 'foo.ipus expected to be undefined after delete');
    obj.removeParam(['foo']);
    assert.deepEqual(obj.param('foo'), undefined, 'foo expected to be undefined after block remove');
  }

  function commonTests(config) {
    beginSection('common test', config);

    ['ize-unix.ini', 'ize-dos.ini', 'ize-mac.ini'].forEach((iniFile) => {
      console.log(`${iniFile} tests started`);
      const cfg = new inireader.IniReader(config);
      cfg.load(iniFile);
      test(cfg);
      testRemoveParam(cfg);
      console.log(`${iniFile} tests finished`);
    });
  }

  function testCallbacks(config) {
    beginSection('start callback test', config);

    let cfg = new inireader.IniReader();
    cfg.on('fileParse', function onFileParse() {
      test(this);
      console.log('unix tests finished');
    });
    cfg.load('./ize-unix.ini');

    cfg = new inireader.IniReader();
    cfg.on('fileParse', function onFileParse() {
      test(this);
      console.log('dos tests finished');
    });
    cfg.load('./ize-dos.ini');

    cfg = new inireader.IniReader();
    cfg.on('fileParse', function onFileParse() {
      test(this);
      console.log('mac tests finished');
    });
    cfg.load('./ize-mac.ini');
  }

  function testFileReadWrite(obj) {
    const fn = getRandomFilename();

    obj.param('a.foo', '1');
    obj.param('a.bar', '2');
    obj.param('a.baz', '3');
    obj.param('a.qux', '4');
    obj.removeParam('a.qux');
    obj.param('lorem.ipsum', 'dolor');
    obj.param('newobject', { a: 1, b: 2 });
    obj.param('new.object.block.key', 'abcd');
    obj.param(['block.name.with.period', 'key.with.period'], 'and its great value');
    obj.param('whitespace.just_whitspace', '  asdf');
    obj.param('whitespace.double_quote', '  "asdf');
    obj.param('whitespace.double_and_single_quote', '  "asdf\'s foo');

    obj.param('whitespace.doublequote_as_data', '"foo bar baz"');
    obj.param('whitespace.singlequote_as_data', '\'foo bar baz\'');

    obj.on('fileWritten', () => {
      console.log('saving file finished');
      obj.on('fileParse', function onFileParse() {
        assert.deepEqual(typeof this.param('a'), 'object');
        assert.deepEqual(this.param('a.foo'), '1');
        assert.deepEqual(this.param('a.bar'), '2');
        assert.deepEqual(this.param('a.baz'), '3');
        assert.deepEqual(this.param('a.qux'), undefined);
        assert.deepEqual(this.param('lorem.ipsum'), 'dolor');
        assert.deepEqual(this.param('newobject.a'), 1, 'setting new object failed');
        assert.deepEqual(this.param('new.object.block.key'), 'abcd', 'setting new object with period failed');
        assert.deepEqual(
          this.param('block.name.with.period.key.with.period'),
          'and its great value',
          'could not find key and block name with period',
        );
        assert.deepEqual(
          this.param('block.name.with.period')['key.with.period'],
          'and its great value',
          'setting new block with period and key with period failed',
        );

        assert.deepEqual(this.param('whitespace.just_whitspace'), '  asdf');
        assert.deepEqual(this.param('whitespace.double_and_single_quote'), '  "asdf\'s foo');
        assert.deepEqual(this.param('whitespace.doublequote_as_data'), '"foo bar baz"');
        assert.deepEqual(this.param('whitespace.singlequote_as_data'), '\'foo bar baz\'');
        console.log('reading saved file finished');
        fs.unlink(fn, (err) => { if (err) { throw err; } });
      });
      obj.load(fn);
    });
    obj.write(fn);
  }
  function testFileRead() {
    beginSection('test file read');

    const booConf = new inireader.IniReader();
    testFileReadWrite(booConf);
  }

  function testFileReadAsync() {
    beginSection('test file read async');

    const booConf = new inireader.IniReader({ async: true });
    testFileReadWrite(booConf);
  }

  function testAsync() {
    beginSection('test async');

    let a = 0;
    function cb() {
      a += 1;
      if (a === 3) {
        testFileReadAsync();
      }
    }

    let cfg = new inireader.IniReader({ async: true });
    cfg.on('fileParse', function onFileParse() {
      test(this);
      console.log('unix tests finished');
      cb();
    });
    cfg.load('./ize-unix.ini');

    cfg = new inireader.IniReader({ async: true });
    cfg.on('fileParse', function onFileParse() {
      test(this);
      console.log('dos tests finished');
      cb();
    });
    cfg.load('./ize-dos.ini');

    cfg = new inireader.IniReader({ async: true });
    cfg.on('fileParse', function onFileParse() {
      test(this);
      console.log('mac tests finished');
      cb();
    });
    cfg.load('./ize-mac.ini');
  }

  function testError() {
    const cfg = new inireader.IniReader();
    let errorFound = 0;
    let syntaxErrFound = false;
    let noFileNameErr = false;
    let noSuchFile = false;
    cfg.on('error', (err) => {
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
    assert.deepEqual(errorFound, 3, `Not all error found: ${errorFound}`);
    assert.ok(syntaxErrFound, 'Syntax error not found');
    assert.ok(noFileNameErr, 'no file name error not found');
    assert.ok(noSuchFile, 'not existing file error not thrown');
  }

  function testAsyncError() {
    const cfg = new inireader.IniReader({ async: true });
    let errorFound = 0;
    let syntaxErrFound = false;
    let noFileNameErr = false;
    let noSuchFile = false;

    let testTimeout;
    function finish() {
      clearTimeout(testTimeout);
      assert.deepEqual(errorFound, 3, `Not all error found: ${errorFound}`);
      assert.ok(syntaxErrFound, 'Syntax error not found');
      assert.ok(noFileNameErr, 'no file name error not found');
      assert.ok(noSuchFile, 'not existing file error not thrown');
    }

    cfg.on('error', (err) => {
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
  }

  function testWriteError() {
    const cfg = new inireader.IniReader({ async: true });
    let testTimeout;
    let writeError = false; let
      fileWritten = false;

    function finish() {
      clearTimeout(testTimeout);
      assert.ok(writeError, 'Write error not emitted');
      assert.ok(!fileWritten, 'fileWritten emitted');
    }

    cfg.load('./ize-nowrite.ini');

    cfg.on('fileWritten', () => {
      fileWritten = true;
    });
    cfg.on('error', () => {
      writeError = true;
    });

    setTimeout(() => {
      cfg.write();
    }, 50);

    testTimeout = setTimeout(finish, 100);
  }

  function testHeader() {
    beginSection('test header');
    // Test backwards compatible default
    testFileReadWrite(new inireader.IniReader());
    testFileReadWrite(new inireader.IniReader({
      header: undefined,
    }));
    function testCustomHeader(headerFunc, resultHeader) {
      // prep
      const reader = new inireader.IniReader({ header: headerFunc });
      const fn = getRandomFilename();
      reader.param('a.foo', 1);
      reader.write(fn);
      // test
      assert.equal(fs.readFileSync(fn).toString('utf8'), `${resultHeader}\n[a]\nfoo=1\n`);
      // clean-up
      fs.unlink(fn, (err) => { if (err) { throw err; } });
    }

    // Test custom headers
    testCustomHeader(
      (le) => '', // eslint-disable-line no-unused-vars
      '',
    );
    testCustomHeader(
      (le) => le + le + le,
      '\n\n\n',
    );
    testCustomHeader(
      (le) => `; TEST!${le}`,
      '; TEST!\n',
    );
  }

  function testMultiValue() {
    const cfg = new inireader.IniReader({ multiValue: true });
    const fn = getRandomFilename();

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
    fs.unlink(fn, (err) => { if (err) { throw err; } });
  }

  function testHooks() {
    const cfg = new inireader.IniReader({
      hooks: {
        write: {
          keyValue(keyValue, group) {
            if (group === 'allquoted') {
              return [keyValue[0], `"${keyValue[1]}"`];
            }

            return keyValue;
          },
        },
      },
    });
    const fn = getRandomFilename();

    cfg.load('./ize-unix.ini');

    cfg.param(['allquoted', 'BanListURL'], 'http://foo.com/bar/baz');

    cfg.write(fn);
    cfg.load(fn);
    const file = fs.readFileSync(fn);
    let quotedFound = false;

    file.toString('utf8').split('\n').forEach((line) => {
      const value = line.split('=')[1];
      if (quotedFound && value) {
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
    fs.unlink(fn, (err) => { if (err) { throw err; } });
  }

  // run tests
  commonTests();
  commonTests({ inheritDefault: true });
  testCallbacks();
  testFileRead();
  testAsync();
  testError();
  testAsyncError();
  testWriteError();
  testHeader();
  testMultiValue();
  testHooks();
}());

// vim: expandtab:sw=2:ts=2:
