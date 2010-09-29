
/**
 * A simple function to get the file content
 * line by line
 */
var getLines = function(file) {
  var fs, fd, pos, lines, line;

  fs = require('fs');
  fd = fs.openSync(file, 0400);
  pos = 0;
  lines = [];

  var getLine = function() {
    var char,
        line = '';

    do {
      char = fs.readSync(fd, 1, pos);
      line += char[0];
      pos += 1;
    } while(char[0] !== '\n' && char[0] !== '\r' && char[1]);

    return line;
  };

  do {
    line = getLine();
    lines.push(line);
  } while(line !== '');
  fs.closeSync(fd);

  return lines;
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
var fixQuoted = function(str) {
  if(
    (str[0] == '"' && str[str.length - 1] == '"') ||
    (str[0] == "'" && str[str.length - 1] == "'")
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
var IniReader = function(file) {
  this.lines = getLines(file);
  this.values = this.parseFile();
};

IniReader.prototype = {
  /**
   * Regexp to get the group names
   */
  groupRex: /^\s*\[\s*([^\]]+)\s*\]$/,

  /**
   * Tries to find a group name in a line
   * @method groupMatch
   * @type {String|False}
   * @returns the group name if found or false
   */
  groupMatch: function(line) {
    var groupMatch = line.match(this.groupRex);
    return groupMatch ? groupMatch[1] : false;
  },

  /**
   * Regexp to get key/value pairs
   */
  keyValueRex: /^\s*([^=]*\w)\s*=\s*(.*)\s*$/,

  /**
   * Tries to find a key/value pair in a line
   * @method groupMatch
   * @type {Object|False}
   * @returns the key value pair in an object ({key: 'key', value;'value'}) if found or false
   */
  keyValueMatch: function(line) {
    var keyValMatch = line.match(this.keyValueRex);
    return keyValMatch ? {key: keyValMatch[1], value: keyValMatch[2]} : false;
  },

  /**
   * Parses an init file, and extracts blocks with keys and values
   * @method parseFile
   * @returns the conf tree
   * @type Object
   */
  parseFile: function() {

    var output, lines, skipLineRex, chompRex, trimRex, nonWhitespaceRex,
        groupName, keyVal, line, currentSection, lineNumber;

    output = {};
    lines = this.lines;

    // regular expressions to clear, validate and get the values
    skipLineRex = /^\s*(\n|\#|;)/ ;
    chompRex = /(?:\n|\r)$/;
    trimRex = /^\s+|\s+$/g;
    nonWhitespaceRex = /\S/;

    lineNumber = 0;

    while(line = lines.shift()) {

      lineNumber += 1;
      // skip comments and empty lines
      if(skipLineRex.test(line) || !nonWhitespaceRex.test(line)) {
        continue;
      }

      line = line.replace(chompRex, '');
      line = line.replace(trimRex, '');

      // block name
      groupName = this.groupMatch(line);
      if(groupName) {
        currentSection = groupName;
        if(!output[currentSection]) {
          output[currentSection] = {};
        }
        continue;
      }

      // key/value pairs
      keyVal = this.keyValueMatch(line);
      if(keyVal) {
        if(currentSection) {
          output[currentSection][keyVal.key] = fixQuoted(keyVal.value);
          continue;
        }
      }

      // if we came this far, the syntax couldn't be validated
      throw new Error("syntax error in line " + lineNumber);

    };
    return output;

  },
  /**
   * @method getBlock
   * @returns A block of the conf tree
   * @type Object
   */
  getBlock: function(block) {
    return typeof block == 'string' ?
           this.values[block] :
           this.values;
  },
  /**
   * @method getValue
   * @returns the value of the key
   * @param String block The name of the block where the key should be defined
   * @param String key The name of the key which value should be returned
   */
  getValue: function(block, key) {

    if(typeof(block) != 'string') {
      throw new Error('block is not a string');
    }

    var sec = this.getBlock(block);

    if(sec === this.values || typeof(sec) == 'undefined') {
      throw new Error('block ' + block + ' is undefined');
    }
    return sec[key];
  }
};
exports.IniReader = IniReader;
