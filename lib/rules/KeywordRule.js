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
 * @class This rules applies to a fixed list of keywords.
 * @extends codeNodes.Core.RuleBase
 * @constructor
 * @alias codeNodes.Rules.KeywordRule
 * @memberof codeNodes.Rules
 */
var KeywordRule =  function() {
  RuleBase.call(this);
};
module.exports // server-public
  = clientExports.ctor // client-public
  = KeywordRule;

// KeywordRule extends RuleBase
KeywordRule.prototype = new RuleBase;

// Fold a word list to a regular expression tree,
// e.g.: convert ['fo','foo','for','bar','barz','barf']
// to (?:bar(?:f|z)?|fo(?:o|r)?)
KeywordRule.fold
    = clientExports.stat.fold = function(words) {

  function str(prefix,nodes,opt) {
    var rv = prefix.replace( // quotemeta
      /([\.\\\+\*\?\[\^\]\$\(\)])/g, '\\$1');
    if (nodes.length) { // append alternation
      rv += '(?:'+nodes.map(function(n){
        return str.apply(null,n)}).join('|')+')';
      if (opt) rv += '?'; // optional
    }
    return rv;
  }

  function reduce(prefix,nodes,opt) {
    //console.log("## reduce("+loopc+"): "+triple_tostr(prefix,nodes,opt));

    // do nothing unless at least 2 triples are given
    if (!(nodes.length > 1)) {
      return [prefix,nodes,opt];
    }

    // 1st char of the prefix of the 1st node
    var c = nodes[0][0][0];
    if (!(c === nodes[1][0][0])) {
      // no match with the prefix of the 2nd node

      // do nothing unless there are at least 3 nodes
      if (!(nodes.length > 2)) {
        return [prefix,nodes,opt];
      }

      // try to reduce next list part
      var first = nodes.shift(), next = reduce('',nodes,false);
      if (next[0].length > 0) {
        return [prefix,[first,next],opt];
      }

      // next list part couldn't be reduced
      next[1].unshift(first);
      return [prefix,next[1],opt];
    }

    // reduce any ensuing node whose prefix starts with c
    var newnodes = [], newopt = false;
    while (nodes.length)
    {
      if (nodes[0][0][0] == c) // remove 1st char
        nodes[0][0] = nodes[0][0].substr(1);
      else // otherwise stop
        break;

      // reduce node or detect new optional node
      var n = nodes.shift();
      if (n[0].length) {
        newnodes.push(n);
        continue;
      }
      newopt = true;
    }

    if (nodes.length || opt)
    {
      var newtrip = reduce(c,newnodes,newopt);
      if (nodes.length)
      {
        // reduce remaining nodes
        var next = reduce('',nodes,false);
        if (next[0].length) {
          return [prefix, [ newtrip, next ], opt];
        }

        // couldn't be reduced
        next[1].unshift(newtrip);
        return [prefix, next[1],opt];
      }

      // current node is optional
      nodes.unshift(newtrip);
      return [prefix,nodes,opt];
    }

    // nothing left to reduce
    return reduce(prefix+c, newnodes, newopt);
  }

  words.sort();
  var nodes = words.map(function(w){return [w,[],false]});
  return str.apply(null,reduce('',nodes,false));
};

KeywordRule.prototype.init
    = clientExports.proto.init
    = clientExports.protoPublic.init = function(def) {
  this.constructor.prototype.init.call(this,def);

  // #ifdef DEBUG
  // required
  if (!this.def.hasOwnProperty("words"))
    throw new Error("Missing property: 'words'.");
  // #endif

  // defaults
  if (!this.def.hasOwnProperty("before"))
    this.def["before"] = '\\b';
  if (!this.def.hasOwnProperty("after"))
    this.def["after"] = '\\b';

  return this;
};

KeywordRule.prototype.createRegExp
    = clientExports.proto.createRegExp = function() {
  var p = KeywordRule.fold(this.def['words']);
  return new RegExp(this.def["before"]+p+this.def["after"]);
};

KeywordRule.clientModule = function() {
  return clientExports.module("KeywordRule",__filename);
};


