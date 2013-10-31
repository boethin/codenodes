// #ifdef DEBUG
'use strict';
// #endif

var globals = require("../globals");
var RuleBase = require("../rulebase");

var clientExports = {
  name: 'WordListRule',
  base: 'RuleBase',
  ctor: null,
  proto: {},
  protoPublic: {},
  stat: {},
  statPublic: {}
};

// WordListRule extends RuleBase
var WordListRule
    = module.exports
    = clientExports.ctor = function() {
  RuleBase.call(this);
};
WordListRule.prototype = new RuleBase;

// Fold a word list to a regular expression tree,
// e.g.: convert ['fo','foo','for','bar','barz','barf']
// to (?:bar(?:f|z)?|fo(?:o|r)?)
WordListRule.fold
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

WordListRule.prototype.init
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

WordListRule.prototype.createRegExp
    = clientExports.proto.createRegExp = function() {
  var p = WordListRule.fold(this.def['words']);
  return new RegExp(this.def["before"]+p+this.def["after"]);
};

WordListRule.clientModule = function() {
  return globals.ceateClientModule.call(clientExports);
};


