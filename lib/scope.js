// #ifdef DEBUG
'use strict';
// #endif

/**
 * Module dependencies.
 */
var globals = require("./globals");

var clientExports = {
  name: 'Scope',
  base: null,
  ctor: null,
  proto: {},
  protoPublic: {},
  stat: {},
  statPublic: {}
};


var ScopeProcessor
    = module.exports
    = clientExports.ctor = function(lang,name) {
  this.lang = lang;
  this.name = name;
};

ScopeProcessor.prototype.init
    = clientExports.proto.init = function(rules) {

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
      rule.regexp(function(re,cpt){
        p.push(re.source);
        scope.idx.push(x);
        scope.rules.push(function(match,apply) {
          apply(scope,re,match.slice(x,cpt+x+1),match.index,rule)});
        off += cpt;
      })
    });
    return new RegExp(p.map(function(t){return('('+t+')')}).join('|'));
  }).call(this,[],0);
  
  // #ifdef DEBUG
  console.log("init: scope '"+this.name+"' with "+rules.length+" rules: "+this.regexp);
  // #endif
  return this;
}

ScopeProcessor.prototype.eat
    = clientExports.proto.eat = function(input,next) {
  var m;
  if (null != (m = input.match(this.regexp))) {
    for (var i in this.idx) {
      if ('undefined' != typeof m[this.idx[i]]) {
      
        return this.rules[i].call(this,m,
          function(scope,re,match,pos,rule){
            rule.handle(scope,input,re,match,pos,next)
          });
          
      }
    }
  }
  return next(input);
};


ScopeProcessor.clientModule = function() {
  return globals.ceateClientModule.call(clientExports);
};

