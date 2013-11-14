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
  globals = require("./globals"),
  client = require("./client"),
  Result = require("./Result"),
  Node = require("./Node");

// client code provider
var clientExports = new client.Exporter;

/**
 * This class cannot be instantiated directly.
 * @class Abstract base class, providing base functionallity
 * for all rules.
 * @constructor
 * @alias codeNodes.Core.RuleBase
 * @memberof codeNodes.Core
 */
var RuleBase = function() {

  /**
   * Language specific definitions.
   * @type {Object}
   * @instance
   * @readonly
   */
  this.def = null;

};
module.exports
  = clientExports.ctor
  = RuleBase;
clientExports.annotations.RuleBase = true;

/**
 * Initialize the rule instance with language specific definitions.
 * @param {Object=} def Language specific definitions.
 * @returns {RuleBase} The instance itself.
 * @alias codeNodes.Core.RuleBase#init
 */
RuleBase.prototype.init = function(def) {
  def = def || {};

  // defaults
  if (!def.hasOwnProperty("scope"))
    def["scope"] = { "main": 0 };
    
  this.def = def;
  return this;
};
clientExports.proto.init
  = clientExports.protoPublic.init
  = RuleBase.prototype.init;
clientExports.annotations.init = true;

/**
 * The priority of the rule related to a scope wherein the rule applies.
 * @param {String} scope The scope identifier.
 * @returns {number}
 * @alias codeNodes.Core.RuleBase#scopeOrder
 */
RuleBase.prototype.scopeOrder = function(scope) {
  return this.def["scope"][scope];
};
clientExports.proto.scopeOrder
  = RuleBase.prototype.scopeOrder;
clientExports.annotations.scopeOrder = true;


RuleBase.prototype.eachScope = function(callback) {
  for (var n in this.def["scope"]) callback(n);
};
clientExports.proto.eachScope = RuleBase.prototype.eachScope;

/**
 * Create the regex that triggers this rule.
 * The result goes to the callback function along with the number of
 * captures.
 * @param {Function} created Callback: function(regex,numberOfCaptures).
 */
RuleBase.prototype.regexp = function(created) {
  if (!this.re) {
    var re = this.createRegExp(), cpt = re.captures();
    this.re = [re,cpt];
  }
  created.apply(null,this.re);
};
clientExports.proto.regexp
  = RuleBase.prototype.regexp;
clientExports.annotations.regexp = true;

/**
 * Abstract regex creation method.
 * Must be overriden in a derived class.
 * @abstract
 * @returns {RegExp} A new RegExp.
 */
RuleBase.prototype.createRegExp = function() {
  // #ifdef DEBUG
  throw new Error("Abstract function call.")
  // #endif
};
clientExports.proto.createRegExp
  = RuleBase.prototype.createRegExp;
clientExports.annotations.createRegExp = true;

/**
 * Match handler.
 * @param {Object} scope The Scope object.
 * @param {String} input The current input chunk.
 * @param {String[]} match The match array.
 * @param {int} pos The position in input where the match starts.
 * @param {RuleBase~handleCallback} callback The callback function.
 */
RuleBase.prototype.handle = function(scope,input,match,pos,callback) {

  //console.log("// handle: '"+scope.name+"'; '"+input+"'");

  if ('function' == typeof this.def["handler"]) {
    // a handler may be set up within the rule definition.
    this.def["handler"].call(this,scope,input,re,match,pos,callback);
  }
  else { // default handler
    var pre = input.substr(0,pos),txt = match[0],
      rem = input.substr(txt.length+pos), re;

    if ((re = this.def["lookBehind"]) && !pre.match(re)) {
      console.log("lookBehind failed: '"+pre+"'");

      // TODO: ignore match
    }
    
    callback(pre,rem,new Node(this,scope,match));
  }
};
clientExports.proto.handle // client-internal
  = RuleBase.prototype.handle;
clientExports.annotations.handle = true;

// callback description
/**
 * Providing the result of the match handler. A match handler basically splits
 *   the code into three parts: a preceding text, a node object and the rest
 *   of the text that needs to be processed further.
 * @callback RuleBase~handleCallback
 * @param {String} pre Unprocessed plain text preceding the match.
 * @param {String=} rem The rest of the text that needs to be processed further.
 * @param {Node=} node The result of the match handler.
 */

// client code
RuleBase.clientModule = function() {
  return clientExports.module("RuleBase",__filename);
};

