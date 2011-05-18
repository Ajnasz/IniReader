/*jslint indent: 2*/
/*globals require: true*/

var getLines = function (file, cb, async) {
  var fs = require('fs'), splitLines, data;
  splitLines = function (data) {
    data = data.toString();
    var lines;
    if (data.indexOf('\r\n') > -1) {
      lines = data.split('\r\n');
    } else if (data.indexOf('\n') > -1) {
      lines = data.split('\n');
    } else if (data.indexOf('\r') > -1) {
      lines = data.split('\r');
    } else { // mostly it's only one line
      lines = [data];
    }
    return lines.filter(function (line) {
      return line !== '';
    });
  };
  if (async) {
    fs.readFile(file, function (err, data) {
      if (err) {
        throw err;
      }
      cb(splitLines(data));
    });
  } else {
    data = fs.readFileSync(file);
    return splitLines(data);
  }
};

/**
 * If a string is inside quotes, the quotes will be removed
 * Very simple and not foolproof yet. It doesn't care about
 * escaped/not escaped strings. So you can have thing like this;
 * "lorem ipsum" dolor sit"
 * and you will receive:
 * lorem ipsum" dolor sit
 *
 * FIXME
 * is it a bug?
 */
var fixQuoted = function (str) {
  if (
    (str[0] === '"' && str[str.length - 1] === '"') ||
    (str[0] === "'" && str[str.length - 1] === "'")
  ) {

    return str.substr(1, str.length - 2);
  }

  return str;

};

/**
 * Parses a .ini file and convert's it's content to a JS object
 * Parser regexps are from the Config::Simple Perl module
 * @class IniReader
 * @constructor
 */
var IniReader = function (file, async) {
  this.async = !!async;
  this.file = file;
};
require('util').inherits(IniReader, require('events').EventEmitter);
/**
  * Regexp to get the group names
  */
IniReader.prototype.groupRex = /^\s*\[\s*([^\]]+)\s*\]$/;

/**
  * Regexp to get key/value pairs
  */
IniReader.prototype.keyValueRex = /^\s*([^=]*\w)\s*=\s*(.*)\s*$/;

IniReader.prototype.init = function () {
  if (this.async) {
    getLines(this.file, function (lines) {
      this.lines = lines;
      this.values = this.parseFile();
      this.emit('fileParse');
    }.bind(this), true);
  } else {
    this.lines = getLines(this.file);
    this.values = this.parseFile();
    this.emit('fileParse');
  }
};

/**
  * Tries to find a group name in a line
  * @method groupMatch
  * @type {String|False}
  * @returns the group name if found or false
  */
IniReader.prototype.groupMatch = function (line) {
  var groupMatch = line.match(this.groupRex);
  return groupMatch ? groupMatch[1] : false;
};

/**
  * Tries to find a key/value pair in a line
  * @method groupMatch
  * @type {Object|False}
  * @returns the key value pair in an object ({key: 'key', value;'value'}) if found or false
  */
IniReader.prototype.keyValueMatch = function (line) {
  var keyValMatch = line.match(this.keyValueRex);
  return keyValMatch ? {key: keyValMatch[1], value: keyValMatch[2]} : false;
};

/**
  * Parses an init file, and extracts blocks with keys and values
  * @method parseFile
  * @returns the conf tree
  * @type Object
  */
IniReader.prototype.parseFile = function () {

  var output, lines, skipLineRex, chompRex, trimRex, nonWhitespaceRex,
      groupName, keyVal, line, currentSection, lineNumber;

  output = {};
  lines = this.lines;

  // regular expressions to clear, validate and get the values
  skipLineRex = /^\s*(\n|\#|;)/;
  chompRex = /(?:\n|\r)$/;
  trimRex = /^\s+|\s+$/g;
  nonWhitespaceRex = /\S/;

  lineNumber = 0;

  while (line = lines.shift()) {

    lineNumber += 1;
    // skip comments and empty lines
    if (skipLineRex.test(line) || !nonWhitespaceRex.test(line)) {
      continue;
    }

    line = line.replace(chompRex, '');
    line = line.replace(trimRex, '');

    // block name
    groupName = this.groupMatch(line);
    if (groupName) {
      currentSection = groupName;
      if (!output[currentSection]) {
        output[currentSection] = {};
      }
      continue;
    }

    // key/value pairs
    keyVal = this.keyValueMatch(line);
    if (keyVal) {
      if (currentSection) {
        output[currentSection][keyVal.key] = fixQuoted(keyVal.value);
        continue;
      }
    }

    // if we came this far, the syntax couldn't be validated
    throw new Error("syntax error in line " + lineNumber);

  }
  return output;

};
/**
  * @method getBlock
  * @returns A block of the conf tree
  * @type Object
  */
IniReader.prototype.getBlock = function (block) {
  return typeof block === 'string' ?
          this.values[block] :
          this.values;
};
/**
  * @method getValue
  * @returns the value of the key
  * @param String block The name of the block where the key should be defined
  * @param String key The name of the key which value should be returned
  */
IniReader.prototype.getValue = function (block, key) {

  if (typeof(block) !== 'string') {
    throw new Error('block is not a string');
  }

  var sec = this.getBlock(block);

  if (sec === this.values || typeof(sec) === 'undefined') {
    throw new Error('block ' + block + ' is undefined');
  }
  return sec[key];
};
exports.IniReader = IniReader;
