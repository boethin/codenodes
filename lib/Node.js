// #ifdef DEBUG
'use strict';
// #endif

var globals = require("./globals");
var Result = require("./Result");

var clientExports = {
  name: 'Node',
  base: null,
  ctor: null,
  proto: {},
  protoPublic: {},
  stat: {},
  statPublic: {}
};

/**
 * @class A node is a piece of processed code.
 * @param {RuleBase} rule The Rule object creating the Node.
 * @param {Scope} scope The Scope wherein the match happened.
 * @param {String[]} match The macth array.
 */
var Node = function(rule,scope,match) {
  // import rule definitions
  var importMap = {
    "yield": function(def) {
      // #ifdef DEBUG
      if ('function' != typeof def)
        throw new Error("Property 'yield' must be a function.");
      // #endif
      return function(ycb) {def(match,ycb)};
    }
  };
  for (var n in rule.def)
    this[n] = importMap[n] ? importMap[n](rule.def[n]) : rule.def[n];

  /**
   * @type {Scope}
   * @instance
   * @readonly
   */
  this.scope = scope;

  this.match = match;

  /**
   * @type {Result}
   * @instance
   * @readonly
   */
  this.result = new Result;
};
module.exports = clientExports.ctor = Node;


/**
 * Client code provider for the Node class.
 * @static
 */
Node.clientModule = function() {
  return globals.ceateClientModule.call(clientExports);
};
