// #ifdef DEBUG
'use strict';
// #endif

var globals = require("./globals");
var Result = require("./result");
var Node = require("./node");

var clientExports = {
  name: 'RuleBase',
  base: null,
  ctor: null,
  proto: {},
  protoPublic: {},
  stat: {},
  statPublic: {}
};

/**
 * Abstract base class for all rules.
 * @class Providing base functionallity for rules.
 */
var RuleBase
    = module.exports = clientExports.ctor = function() {
};

RuleBase.prototype.init
    = clientExports.proto.init
    = clientExports.protoPublic.init = function(def) {
  def = def || {};

  // defaults
  if (!def.hasOwnProperty("scope"))
    def["scope"] = { "main": 0 };
    
  this.def = def;
  return this;
};

RuleBase.prototype.scopeOrder
    = clientExports.proto.scopeOrder = function(name) {
  return this.def["scope"][name];
};

// RuleBase.prototype.getClass
//     = clientExports.proto.getClass
//     = clientExports.protoPublic.getClass = function(name) {
//   return this.def["class"];
// };

RuleBase.prototype.eachScope
    = clientExports.proto.eachScope = function(callback) {
  for (var n in this.def["scope"]) callback(n);
};

// RuleBase.prototype.toXML = function(text) {
//   return '<'+this.def["class"]+'>'+text+'</'+this.def["class"]+'>';
// };

RuleBase.prototype.regexp
    = clientExports.proto.regexp = function(created) {
  if (!this.re) {
    var re = this.createRegExp(), cpt = re.captures();
    this.re = [re,cpt];
  }
  created.apply(null,this.re);
};

RuleBase.prototype.createRegExp
    = clientExports.proto.createRegExp = function() {
  // #ifdef DEBUG
  throw new Error("Abstract function call.")
  // #endif
};

RuleBase.prototype.handle
    = clientExports.proto.handle = function(scope,input,re,match,pos,callback) {
  if ('function' == typeof this.def["handler"]) {
    // a handler may be set up within the rule definition.
    this.def["handler"].call(this,scope,input,re,match,pos,callback);
  }
  else { // default handler
    console.log("## handle: "+match);
    var pre = input.substr(0,pos),txt = match[0],
      rem = input.substr(txt.length+pos),
      node = {
        "class": this.def["class"],
        "match": match,
        "scope": scope,
        "result": new Result
      };
    if ('function' == typeof this.def['yield']) {
      (function(yieldcall){
        node['yield'] = function(ycb) {yieldcall(match,ycb)}
      })(this.def['yield']);
    }

    //node=null;
    //pre += match[0];
    
    callback(pre,rem,node);
  }
};


RuleBase.clientModule = function() {
  return globals.ceateClientModule.call(clientExports);
};


