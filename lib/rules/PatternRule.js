/**
 * v0.0.1
 * codeNodes - Consider source code as nodes.
 * http://www.codenodes.org
 *
 * @copyright Copyright (c) 2013 Sebastian Böthin
 * @author Sebastian Böthin <sebastian@boethin.eu>
 * @license MIT license - see http://www.codenodes.org/LICENSE
 */

// Abdicable code for error recovery is tagged as DEBUG.
// See: https://npmjs.org/package/preprocessor

// #ifdef DEBUG
'use strict';
// #endif

var
  globals = require("../globals"),
  client = require("../client"),
  RuleBase = require("../RuleBase");

// client code provider
var clientExports = new client.Exporter({"base": "RuleBase"});

/**
 * @class A generic rule type for rules based on a closed regular expression.
 * @extends RuleBase
 * @constructor
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
  return clientExports.module("PatternRule",__filename);
};




