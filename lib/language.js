// #ifdef DEBUG
'use strict';
// #endif

/**
 * Module dependencies.
 */
var globals = require("./globals");
var Scope = require("./scope");

var clientExports = {
  name: 'Language',
  base: null,
  ctor: null,
  proto: {},
  protoPublic: {},
  stat: {},
  statPublic: {}
};

/**
 * Creates a new Language processor.
 * @param {String} lang Language identifier.
 * @class A code processor belonging to a specific language.
 */
var Language
    = module.exports
    = clientExports.ctor = function(lang) {

  // #ifdef DEBUG
  if(!globals.isNonEmptyString(lang))
    throw new Error("Argument 'lang' cannot be empty.");
  // #endif

  this.lang = lang;
  this.listeners = {};
};

/**
 * Instance initializer for the Language class.
 * @param {Object[]} rules The list of rules defining the language.
 * @returns {Object} The instance itself.
 */
Language.prototype.init
    = clientExports.proto.init = function(rules) {

  // #ifdef DEBUG
  if (!((rules instanceof Array) && rules.length > 0))
    throw new Error("Argument 'rules' must be a non-empty array.");
  // #endif

  // set up the scope collection
  var scps = {};
  (function(append){
    for (var i in rules)
      append(rules[i])
  })(function(rule) {
    rule.eachScope(function(n){
      if (!scps[n]) scps[n] = [];
      scps[n].push(rule);
    });
  });

  this.scopes = {};
  for (var s in scps) {
    this.scopes[s] = (new Scope(this.lang,s)).init(scps[s]);
  }
  return this;
};

Language.prototype.addEventListener
    = clientExports.proto.addEventListener
    = clientExports.protoPublic.addEventListener = function(eventType,handler) {
  if (!this.listeners[eventType]) this.listeners[eventType] = [];
  this.listeners[eventType].push(handler);
};

Language.prototype.triggerEvent
    = clientExports.proto.triggerEvent = function(eventType,args) {
  if (this.listeners[eventType]) {
    for (var i in this.listeners[eventType])
      this.listeners[eventType][i].apply(this,args);
  }
};

Language.prototype.process
    = clientExports.proto.process = function(scope,input,result,ready,left,right,depth) {
  //console.log("process("+scope+"): "+input);
  left = left || '';
  right = right || '';
  depth = depth || 0;

  var scopeProc = this.scopes[scope];
  // #ifdef DEBUG
  if (!scopeProc)
    throw new Error("Scope '"+scope+"' doesn't exist.");
  // #endif

  (function(rules){
    (function(trigger){

      if (left.length) {
        result.appendTextNode(rules.lang,scope,left,depth,trigger);
      }

      (function(f) { f(f,input) })(function(f,s) {
        scopeProc.eat(s, function(pre,rem,node) { // next
          if (pre.length) {
            result.appendTextNode(rules.lang,scopeProc.name,pre,depth,trigger);
          }
          
          (function(done) {

            if (node) {
              result.append(node,rules.lang,scope,depth,trigger);
              
              if ('function' == typeof node['yield']) {
              
                node['yield'](function(sublang,subscope,m,lft,rgt) {
                  //console.log('## yield: '+subscope+" '"+m+"'");
                  rules.process(subscope,m,node.result,done,lft,rgt,depth+1);
                });
              }
              else {
                done();
              }

            }
            else {
              done();
            }

          })(function() { // done
            if (globals.isNonEmptyString(rem)) {
              f(f,rem);
            }
            else {
              if (right.length) {
                result.appendTextNode(rules.lang,scope,right,depth,trigger);
              }
              rules.triggerEvent('NodeCreated',[rules.lang,scope,result,depth]);
              ready(result);
            }
          });
          
        }); // scopeProc.eat
      }); // function(f)

    })(function(event,args){rules.triggerEvent(event,args)});
  })(this);
  
  
};

/**
 * Client code provider for the Language class.
 * @static
 */
Language.clientModule = function() {
  return globals.ceateClientModule.call(clientExports);
};

