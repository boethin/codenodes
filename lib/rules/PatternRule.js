// #ifdef DEBUG
'use strict';
// #endif

var globals = require("../globals");
var RuleBase = require("../RuleBase");

var clientExports = {
  name: 'PatternRule',
  base: 'RuleBase',
  ctor: null,
  proto: {},
  protoPublic: {},
  stat: {},
  statPublic: {}
};


// PatternRule extends codeNodes.RuleBase
var PatternRule
    = module.exports
    = clientExports.ctor = function() {
  RuleBase.call(this);
};
PatternRule.prototype = new RuleBase;

PatternRule.prototype.init
    = clientExports.proto.init
    = clientExports.protoPublic.init = function(def) {
  this.constructor.prototype.init.call(this,def);

  // #ifdef DEBUG
  if (!this.def.hasOwnProperty("pattern"))
    throw new Error("Missing property: 'pattern'.");
  // #endif

  return this;
};

PatternRule.prototype.createRegExp
    = clientExports.proto.createRegExp = function() {
  return new RegExp(this.def['pattern']);
};

PatternRule.clientModule = function() {
  return globals.ceateClientModule.call(clientExports);
};




