// #ifdef DEBUG
'use strict';
// #endif

var
  globals = require("../globals"),
  RuleBase = require("../RuleBase"),
  Result = require("../Result"),
  Node = require("../Node");

var clientExports = {
  name: 'StringRule',
  base: 'RuleBase',
  ctor: null,
  proto: {},
  protoPublic: {},
  stat: {},
  statPublic: {}
};

var StringRule
    = module.exports
    = clientExports.ctor = function() {
  RuleBase.call(this);
};
StringRule.prototype = new RuleBase;

StringRule.prototype.init
    = clientExports.proto.init
    = clientExports.protoPublic.init = function(def) {
  RuleBase.prototype.init.call(this,def);

  // delimiter
  this.delimiter = this.def["delimiter"] || '"';
  return this;
};

StringRule.prototype.createRegExp
    = clientExports.proto.createRegExp = function() {
  // e.g.: /"((?:\\"|[^"])*)"/
  var qd = globals.quotemeta(this.delimiter); 
  return new RegExp(qd+'((?:\\'+qd+'|[^'+qd+'])*)'+qd);
};




