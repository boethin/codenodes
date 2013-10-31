// #ifdef DEBUG
'use strict';
// #endif

var globals = require("./globals");
var Result = require("./result");

var clientExports = {
  name: 'Node',
  base: null,
  ctor: null,
  proto: {},
  protoPublic: {},
  stat: {},
  statPublic: {}
};


var Node
    = module.exports
    = clientExports.ctor = function(scope,rule,match) {
  this.scope = scope;
  this.rule = rule;
  this.match = match;
  this.result = new Result;
};





/**
 * Client code provider for the Node class.
 * @static
 */
Node.clientModule = function() {
  return globals.ceateClientModule.call(clientExports);
};
