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
    = clientExports.ctor = function(rule,scope,match) {

  // import rule definitions
  var importMap = {
    "yield": function(def) {
      // #ifdef DEBUG
      if ('function' != typeof def)
        throw new Error("Property 'yield' must be a function.");
      // #endif
      return function(ycb) {def(match,ycb)};
    }
  };
  for (var n in rule.def)
    this[n] = importMap[n] ? importMap[n](rule.def[n]) : rule.def[n];

  this.scope = scope;
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
