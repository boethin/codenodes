// #ifdef DEBUG
'use strict';
// #endif

var globals = require("../globals");
var RuleBase = require("../rulebase");

var clientExports = {
  name: 'NewLineRule',
  base: 'RuleBase',
  ctor: null,
  proto: {},
  protoPublic: {},
  stat: {},
  statPublic: {}
};


// NewLineRule extends codeNodes.RuleBase
var NewLineRule
    = module.exports
    = clientExports.ctor = function() {
  RuleBase.call(this);
};
NewLineRule.prototype = new RuleBase;

NewLineRule.prototype.init
    = clientExports.proto.init
    = clientExports.protoPublic.init = function() {
  RuleBase.prototype.init.call(this,{"class":"newline"});
  return this;
};

NewLineRule.prototype.createRegExp
    = clientExports.proto.createRegExp = function() {
  return /\n/;
};

NewLineRule.clientModule = function() {
  return globals.ceateClientModule.call(clientExports);
};

