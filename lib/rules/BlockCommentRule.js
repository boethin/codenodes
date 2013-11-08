// #ifdef DEBUG
'use strict';
// #endif

var
  globals = require("../globals"),
  RuleBase = require("../RuleBase"),
  Result = require("../Result"),
  Node = require("../Node");

var clientExports = {
  name: 'BlockCommentRule',
  base: 'RuleBase',
  ctor: null,
  proto: {},
  protoPublic: {},
  stat: {},
  statPublic: {}
};

/**
 * @class BlockCommentRule applies to any text between start and end delimiter,
 * regardless in wich context the end delimiter occurs.
 * If no end delimiter is found, the rule applies to the rest of the text.
 * A typical example is the C-sytle comment block.
 * @extends RuleBase
 * @memberof codeNodes.Rules
 *
 * @example
 *   // C-style block comment
 *   (new codeNodes.BlockCommentRule).init({
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
   * @readonly
   */
  this.startDelimiter = null;

  /**
   * @type {string}
   * @instance
   * @readonly
   */
  this.endDelimiter = null;

};
module.exports = clientExports.ctor = BlockCommentRule;
BlockCommentRule.prototype = new RuleBase;

BlockCommentRule.prototype.init =  function(def) {
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
 * @see RuleBase#createRegExp
 * @override
 */
BlockCommentRule.prototype.createRegExp = function() {
  return new RegExp(globals.quotemeta(this.startDelimiter));
};
clientExports.proto.createRegExp = BlockCommentRule.prototype.createRegExp;

/**
 * Look up for the end delimiter and either handle all the text bewteen
 * start and end delimiter or the rest of the text if no end delimiter
 * is found.
 * @param {Object} scope The Scope object.
 * @param {String} input The current input chunk.
 * @param {String[]} match The match array.
 * @param {int} pos The position in input where the match starts.
 * @param {RuleBase~handleCallback} callback The callback function.
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
  
  callback(pre,rem,new Node(this,scope,m));
};
clientExports.proto.handle
  = BlockCommentRule.prototype.handle;

/**
 * Client code provider for the BlockCommentRule class.
 * @static
 */
BlockCommentRule.clientModule = function() {
  return globals.ceateClientModule.call(clientExports);
};

