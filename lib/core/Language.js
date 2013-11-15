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
  client = require("../client"),
  Scope = require("./Scope");

// client code provider
var clientExports = new client.Exporter;

/**
 * Create a new Language processor.
 * @class Internal code processor attached to a specific language.
 * @param {String} lang Language identifier.
 * @constructor
 * @alias codeNodes.Core.Language
 * @memberof codeNodes.Core
 */
var Language = function(lang) {

  // #ifdef DEBUG
  if(!globals.isNonEmptyString(lang))
    throw new Error("Argument 'lang' cannot be empty.");
  // #endif

  this.lang = lang;
  this.listeners = {};
};
module.exports // server-public
  = clientExports.ctor // client-internal
  = Language;
clientExports.annotations.Language = true;

/**
 * Initialize the language processor with the set of rules defining the language.
 * @param {Array<RuleBase>} rules The list of rules defining the language.
 * @returns {Language} The instance itself.
 * @alias codeNodes.Core.Language#init
 */
Language.prototype.init = function(rules) {

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
clientExports.proto.init // client-internal
  = Language.prototype.init;
clientExports.annotations.init = true;

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

/**
 * Language code processor.
 * @param {String} scope The scope identifier.
 * @param {String} input The code to process.
 * @param {Result} result The result object where nodes should be pushed onto.
 * @param {String=} left A preceding string value.
 * @param {String=} right A subordinate string value.
 * @param {number=} depth A value indicating the recursion depth.
 * @alias codeNodes.Core.Language#process
 */
Language.prototype.process = function(scope,input,result,ready,left,right,depth) {

  // defaults
  left = left || '';
  right = right || '';
  depth = depth || 0;

  var scopeProc = this.scopes[scope];
  // #ifdef DEBUG
  if (!scopeProc)
    throw new Error("Scope '"+scope+"' doesn't exist.");
  // #endif

  (function(that) {

    function nodeTrigger(event,node) {
      that.triggerEvent(event,[that.lang,scopeProc,node,depth])
    }

    result.push(left,nodeTrigger);

    (function(f) { f(f,input) })(function(f,s) {
      scopeProc.eat(s, function(pre,rem,node) { // next

        function eaten() {
          if (globals.isNonEmptyString(rem)) {
            f(f,rem); // continue
          }
          else { // finished
            result.push(right,nodeTrigger);
            nodeTrigger('NodeCreated',result);
            ready(result);
          }
        }

        result.push(pre,nodeTrigger);

        if (node) {
          result.push(node,nodeTrigger);

          if ('function' == typeof node['yield']) {
            node['yield'](function(sublang,subscope,m,lft,rgt) {
              that.process(subscope,m,node.result,eaten,lft,rgt,depth+1);
            });
          }
          else {
            eaten();
          }
        }
        else {
          eaten();
        }

      }); // scopeProc.eat
    }); // function(f)

  })(this);
  
};
clientExports.proto.process // client-internal
  = Language.prototype.process;
clientExports.annotations.process = true;

// client code
Language.clientModule = function() {
  return clientExports.module("Language",__filename);
};

