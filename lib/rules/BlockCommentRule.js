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
  RuleBase = require("../RuleBase"),
  Result = require("../Result"),
  Node = require("../Node");

// client code provider
var clientExports = new client.Exporter({"base": "RuleBase"});

/**
 * @class This rule applies to any text between start and end delimiter,
 * regardless in wich context the end delimiter occurs.
 * If no end delimiter is found, the rule applies to the rest of the text.
 * A typical example is the C-sytle comment block.
 * @constructor
 * @alias codeNodes.Rules.BlockCommentRule
 * @memberof codeNodes.Rules
 * @extends codeNodes.Core.RuleBase
 * @example
 *   // C-style block comment
 *   (new codeNodes.Rules.BlockCommentRule).init({
 *     "class": "comment",
 *     "begin": "/*",
 *     "end": "*&#47;"
 *   })
*/
var BlockCommentRule =  function() {
  RuleBase.call(this);

  /**
   * @type {string}
   * @instance
   */
  this.startDelimiter = null;

  /**
   * @type {string}
   * @instance
   */
  this.endDelimiter = null;

};
module.exports
  = clientExports.ctor
  = BlockCommentRule;
clientExports.annotations.BlockCommentRule = true;

BlockCommentRule.prototype = new RuleBase;

/**
 * Initialize the rule with language specific definitions. In particular, set
 * up start and end delimiter.
 * @param {Object} def Language specific definitions.
 * @returns {BlockCommentRule} The instance itself.
 * @alias codeNodes.Rules.BlockCommentRule#init
 */
BlockCommentRule.prototype.init = function(def) {
  RuleBase.prototype.init.call(this,def);
  
  // delimiters
  this.startDelimiter = this.def["begin"] || '/*';
  this.endDelimiter = this.def["end"] || '*/';
  return this;
};
clientExports.proto.init
  = clientExports.protoPublic.init
  = BlockCommentRule.prototype.init;

/**
 * The RegExp matching the start delimiter.
 * @returns {RegExp}
 * @alias codeNodes.Rules.BlockCommentRule#createRegExp
 * @see RuleBase#createRegExp
 * @override
 */
BlockCommentRule.prototype.createRegExp = function() {
  return new RegExp(globals.quotemeta(this.startDelimiter));
};
clientExports.proto.createRegExp
  = BlockCommentRule.prototype.createRegExp;
clientExports.annotations.createRegExp = true;

/**
 * Look up for the end delimiter and either handle all the text bewteen
 * start and end delimiter or the rest of the text if no end delimiter
 * is found.
 * @param {Object} scope The Scope object.
 * @param {String} input The current input chunk.
 * @param {Array<String>} match The match array.
 * @param {number} pos The position in input where the match starts.
 * @param {RuleBase~handleCallback} callback The callback function.
 * @alias codeNodes.Rules.BlockCommentRule#handle
 * @see RuleBase#handle
 * @override
 */
BlockCommentRule.prototype.handle = function(scope,input,match,pos,callback) {
  var pre = input.substr(0,pos),rem,m,p;

  // look up end delimiter
  if (0 < (p = input.indexOf(this.endDelimiter,pos+this.startDelimiter.length))) {
    // delimiter found
    rem = input.substr(p+this.endDelimiter.length);
    m = input.substr(pos,p-pos+this.endDelimiter.length);
  }
  else { // no end delimiter found
    rem = '';
    m = input.substr(pos);
  }
  
  callback(pre,rem,new Node(this,scope,[m]));
};
clientExports.proto.handle
  = BlockCommentRule.prototype.handle;
clientExports.annotations.handle = true;

// client code
BlockCommentRule.clientModule = function() {
  return clientExports.module("BlockCommentRule",__filename);
};

