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
  Node = require("./Node");

// client code provider
var clientExports = new client.Exporter;

/**
 * Create a new instance of the Result class.
 * @class A result is a list of nodes, where each node can be either a
 *   string or a {@link codeNodes.Core.Node} object.
 * @constructor
 * @alias codeNodes.Core.Result
 * @memberof codeNodes.Core
 */
var Result = function() {

  /**
   * The list of nodes.
   * @name codeNodes.Core.Result#nodes
   * @type {Array<codeNodes.Core.Node|String>}
   * @instance
   * @readonly
   */
  var nodes = this.nodes = []; // privileged
  globals.defineGet(this,"nodes", function() { return nodes } );

  /**
   * The length of the nodes list.
   * @name codeNodes.Core.Result#length
   * @type {number}
   * @instance
   * @readonly
   */
  var l; // avoiding JSC_MISPLACED_TYPE_ANNOTATION
  globals.defineGet(this,"length", function() { return nodes.length } );

};
module.exports
  = clientExports.ctor // client-public
  = Result;
clientExports.annotations.Result = true;

/**
 * String representaion.
 * @param {codeNodes.Core.Node~stringify=} stringify A stringifier for the nodes.
 * @returns {String}
 * @alias codeNodes.Core.Result#toString
 */
Result.prototype.toString = function(stringify) {
  return this.nodes.map(
    function(n) { return Node.nodeStringify(n,stringify) }
  ).join('');
};
clientExports.proto.toString
  = clientExports.protoPublic.toString
  = Result.prototype.toString;
clientExports.annotations.toString = true;

/**
 * Append a new node to the result.
 * @param {codeNodes.Core.Node|String} node A node, i.e. either a string or
 *   a Node instance.
 * @param {codeNodes.Core.Result~pushCallback} ready A callback function
 *   determining the event happened.
 * @alias codeNodes.Core.Result#push
 */
Result.prototype.push = function(node,ready) {

  if ('string' == typeof node) {
    if (node.length) { // ignore empty strings
      if (this.nodes.length && 'string' == typeof this.nodes[this.nodes.length-1]) {
        this.nodes[this.nodes.length-1] += node; // avoid sequential text nodes
        ready("TextNodeAppended",node);
      }
      else {
        this.nodes.push(node);
        ready('TextNodeCreating',node);
      }
    }
  }

  else if (node instanceof Node) {
    this.nodes.push(node);
    ready('NodeCreating',node);
  }

  // #ifdef DEBUG
  else {
    throw new Error("Argument 'node' must be either a string or a Node instance.");
  }
  // #endif

};
clientExports.proto.push
  = Result.prototype.push; // client-public
clientExports.annotations.push = true;


// client code
Result.clientModule = function() {
  return clientExports.module("Result",__filename);
};

