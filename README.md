IniReader is a small module for nodejs. You can parse .ini configuration files with it.

## The constructor ##
### Arguments ###

The constructor accepts configuration parameters as an object:

* async: (Optional), Boolean, default: true, Set to true if you wan't to use asynchron calls to read and/or write configuration files
* file: (Optional), String, default: empty, You can set the configuration file name here
* inheritDefault: (Optional), String, default: false, If this option is true and your configuration has a section with a name `DEFAULT` the other sections will inherit it's values if they are not defined.


## Methods ##


### load ###
Loads and parses the configuration file.

#### Arguments: ####
* file: (Optional), String, Name of the configuration file to read. If you didn't set the file name in the constructor, you must do it here.


### write ###
Writes out the configuration into a file

#### Arguments: ####
* file: (Optional), String, Name of the configuration file to write. If you didn't set the file name in the constructor, you must do it here.
* le: (Optional), String, default: '\n', Line ending. Possible values are: '\n', '\r\n', '\r'


### param ###
Method to get or set a configuration value, or a section or the whole configuration as an object

#### Arguments: ####
* prop: (Optional), String, The name of the property or block. If the argument is empty, it will return the whole configuration object. To retreive a block, give the name of the block. `iniReaderInstance.param('blockname')`. To retreive a property value, give the name of the block and the property name concatenated witha a dot: `blockname.propertyname`.
* value: (Optional), String,Number,Object, The value of the parameter. Pass an object to add several properties to a section

### interpolate ###

#### _Arguments_ ####
* _prop_: (Optional), String, The name of the property or block.

#### _Description_ ####
Same as the method _param_ with the argument _prop_ but this method
extends recursively all the patterns _%(xxx)_ by the value which would
be returned by _param(xxx)_. The patterns can be _%(blockname.key)_ or _%(key)_,
assuming that _key_ refers to the current block.

For example, if the file _.ini_ is
```
 [sectionA]
 a=foo
 b=%(a)/bar
 [sectionB]
 c=%(sectionA.b)/baz
```
_interpolate_ called with the parameter _'sectionA.b'_ will return
_foo/bar_ and, with the parameter _'sectionB.c'_, it will return
_foo/bar/baz_.

## Basic usage ##

```javascript
// include
var iniReader = require('./inireader');
// initialize
var parser = new iniReader.IniReader();
parser.load('./myconf.ini');
// get the config tree
parser.getBlock();
// get only a sub section
parser.param('blockname');
// get a config value. The blockname is mandantory
parser.param('blockname.key');
// add or update (if exists) config
// if the block doesn't exists it will be created;
parser.param('blockname.key', 'foobar');
// update the config
parser.write();
// create a new config
parser.write('myotherconf.ini');
```

## Using callbacks ##

```javascript
var iniReader = require('./inireader');
// initialize
var parser = new iniReader.IniReader();
parser.on('fileParse', function() {
  // get the config tree
  this.getBlock();
  // get only a sub section
  this.param('blockname');
  // get a config value. The blockname is mandantory
  this.param('blockname.key');
  // add or update (if exists) config
  // if the block doesn't exists it will be created;
  parser.param('blockname.key', 'foobar');
  // update the config
  parser.write();
  // create a new config
  parser.write('myotherconf.ini');
});
parser.load('./myconf.ini');
```

## Using async file reading ##

```javascript
var iniReader = require('./inireader');
// initialize
var parser = new iniReader.IniReader({async: true});
parser.on('fileParse', function() {
  // get the config tree
  this.getBlock();
  // get only a sub section
  this.param('blockname');
  // get a config value. The blockname is mandantory
  this.param('blockname.key');
  // add or update (if exists) config
  // if the block doesn't exists it will be created;
  parser.param('blockname.key', 'foobar');
  // update the config
  parser.write();
  // create a new config
  parser.write('myotherconf.ini');
});
parser.load('./myconf.ini');
```
