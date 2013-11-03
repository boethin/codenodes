// #ifdef DEBUG
'use strict';
// #endif

var
  globals = require("../globals"),
  RuleBase = require("../rulebase"),
  Result = require("../result"),
  Node = require("../node");

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
 * The BlockCommentRule applies to any text between start and end delimiter,
 * regardless in wich context the end delimiter occurs.
 * If no end delimiter is found, the rule applies to the rest of the text.
 * A typical example is the C-sytle comment block.
 */

// BlockCommentRule extends codeNodes.RuleBase
var BlockCommentRule
    = module.exports
    = clientExports.ctor = function() {
  RuleBase.call(this);
};
BlockCommentRule.prototype = new RuleBase;

BlockCommentRule.prototype.init
    = clientExports.proto.init
    = clientExports.protoPublic.init = function(def) {
  RuleBase.prototype.init.call(this,def);
  
  // delimiters
  this.begin = this.def["begin"] || '/*';
  this.end = this.def["end"] || '*/';
  return this;
};

BlockCommentRule.prototype.createRegExp
    = clientExports.proto.createRegExp = function() {
  return new RegExp(globals.quotemeta(this.begin));
};

/**
 * Match handler for BlockCommentRule.
 */
BlockCommentRule.prototype.handle
    = clientExports.proto.handle = function(scope,input,re,match,pos,callback) {
  var pre = input.substr(0,pos),rem,m,p;

  // look up end delimiter
  if (0 < (p = input.indexOf(this.end,pos+this.begin.length))) {
    // delimiter found
    rem = input.substr(p+this.end.length);
    m = input.substr(pos,p-pos+this.end.length);
  }
  else { // no end delimiter found
    rem = '';
    m = input.substr(pos);
  }
  
  callback(pre,rem,new Node(this,scope,m));
};

/**
 * Client code provider for the BlockCommentRule class.
 * @static
 */
BlockCommentRule.clientModule = function() {
  return globals.ceateClientModule.call(clientExports);
};

