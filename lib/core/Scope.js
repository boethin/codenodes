/**
 * v0.0.1
 * codeNodes - Consider source code as nodes.
 * http://www.codenodes.org
 *
 * Copyright (c) 2013 Sebastian Böthin <sebastian@boethin.eu>
 * MIT license - see http://www.codenodes.org/LICENSE
 */

// Abdicable code for error recovery is tagged as DEBUG.
// See: https://npmjs.org/package/preprocessor

// #ifdef DEBUG
'use strict';
// #endif

// internal modules
var
  globals = require("../globals"),
  client = require("../client");

// client code provider
var clientExports = new client.Exporter;

/**
 * @class A Scope is a set of rules applying to a specific part of a language.
 * @see Language
 * @param {String} lang The language identifier.
 * @param {String} name The scope identifier.
 * @constructor
 * @alias codeNodes.Core.Scope
 * @memberof codeNodes.Core
 */
var Scope
    = module.exports
    = clientExports.ctor = function(lang,name) {
  this.lang = lang;
  this.name = name;
};

/**
 * Initialize an instance of the Scope class with a set of rules.
 * @param {Array<RuleBase>} rules The rules applying to the scope.
 * @returns {Scope} The instance itself.
 * @alias codeNodes.Core.Scope#init
 */
Scope.prototype.init = function(rules) {

  // sort rules by scope order (highest values first)
  (function(n){rules.sort(function(a,b){
    return (b.scopeOrder(n) - a.scopeOrder(n))})}
  )(this.name);

  // set up the rule processor for this scope.
  this.idx = [];
  this.rules = [];
  this.regexp = (function(p,off){
    (function(add){
      for (var i in rules) add(this,rules[i],++off)
    }).call(this,function(scope,rule,x){
      rule.regexp(function(re,cpt) {
        p.push(re.source);
        scope.idx.push(x);
        scope.rules.push(function(match,apply) {
          apply(scope,match.slice(x,cpt+x+1),match.index,rule)});
        off += cpt;
      })
    });
    return new RegExp(p.map(function(t){return('('+t+')')}).join('|'));
  }).call(this,[],0);
  
  // #ifdef DEBUG
  //console.log("init: scope '"+this.name+"' with "+rules.length+" rules: "+this.regexp);
  // #endif
  return this;
};
clientExports.proto.init
  = Scope.prototype.init;
clientExports.annotations.init = true;

/**
 * Match a chunk of code against the regex of the Scope. If a match is found,
 *   find the rule responsible for handling the match.
 * @param {String} chunk The current chunk of code.
 * @param {RuleBase~handleCallback} next Callback function, forwarded to
 *   the rule handler.
 * @alias codeNodes.Core.Scope#eat
 */
Scope.prototype.eat = function(chunk,next) {

  // apply the scope regex to the input
  var whole;
  if (null != (whole = chunk.match(this.regexp))) {

    // find the part belonging to the current match
    for (var i in this.idx) {
      if ('undefined' != typeof whole[this.idx[i]]) { // found
        return this.rules[i].call(this,whole,
          function(scope,match,pos,rule) { // apply
            rule.handle(scope,chunk,match,pos,next)
          });
          
      }
    }
  }

  // no match
  return next(chunk);
};
clientExports.proto.eat // client-internal
  = Scope.prototype.eat;
clientExports.annotations.eat = true;


// client code
Scope.clientModule = function() {
  return clientExports.module("Scope",__filename);
};

