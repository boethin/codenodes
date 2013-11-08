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

/**
 * @class A generic rule type for rules based on a closed regular expression.
 * @extends RuleBase
 * @memberof codeNodes.Rules
 */
var PatternRule = function() {
  RuleBase.call(this);

  /**
   * @type {string}
   * @instance
   * @readonly
   */
  this.pattern = null;

};
module.exports
  = clientExports.ctor
  = PatternRule;
PatternRule.prototype = new RuleBase;

PatternRule.prototype.init = function(def) {
  this.constructor.prototype.init.call(this,def);

  // #ifdef DEBUG
  if (!this.def.hasOwnProperty("pattern"))
    throw new Error("Missing property: 'pattern'.");
  // #endif

  return this;
};
clientExports.proto.init
  = clientExports.protoPublic.init
  = PatternRule.prototype.init

PatternRule.prototype.createRegExp
    = clientExports.proto.createRegExp = function() {
  return new RegExp(this.def['pattern']);
};

PatternRule.clientModule = function() {
  return globals.ceateClientModule.call(clientExports);
};




