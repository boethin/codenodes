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
 * @class A node is a piece of processed code.
 * @param {codeNodes.Core.RuleBase} rule The Rule object creating the Node.
 * @param {codeNodes.Core.Scope} scope The Scope wherein the match happened.
 * @param {Array<String>} match The array containing the matches that
 *   have been found.
 * @constructor
 * @alias codeNodes.Core.Node
 * @memberof codeNodes.Core
 */
function Node(rule,scope,match) {

  // #ifdef DEBUG
  // argument check
  if (!rule)
    throw new Error("Argument 'rule' cannot be null.");
  // #endif

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

  // public get

  /**
   * @name codeNodes.Core.Node#scope
   * @type {codeNodes.Core.Scope}
   * @instance
   * @readonly
   */
  var s; // avoiding JSC_MISPLACED_TYPE_ANNOTATION
  globals.defineGet(this,"scope", function() {
    return scope;
  });


  /**
   * The array containing the matches that have been found.
   * @name codeNodes.Core.Node#match
   * @type {Array<String>}
   * @instance
   * @readonly
   */
  var m; // avoiding JSC_MISPLACED_TYPE_ANNOTATION
  globals.defineGet(this,"match", function() {
    return match;
  });

  /**
   * A {@link Result} object (empty unless the node contains sub-nodes).
   * @name codeNodes.Core.Node#result
   * @type {codeNodes.Core.Result}
   * @instance
   * @readonly
   */
  var result = null;
  globals.defineGet(this,"result",function() {
    if (!result) { // late binding
      var Result = Node.requireResult();
      result = new Result;
    }
    return result;
  });

  /**
   * The length of {@link Node#result} if the node contains of sub-nodes,
   * 0 otherwise.
   * Use this property to test whether the node has sub-nodes.
   * @name codeNodes.Core.Node#length
   * @type {!number}
   * @instance
   * @readonly
   */
  var l; // avoiding JSC_MISPLACED_TYPE_ANNOTATION
  globals.defineGet(this,"length", function() {
    if (!result)
      return 0;
    return result.length;
  });

};
module.exports // server-public
  = clientExports.ctor // client-public
  = Node;
clientExports.annotations.Node = true;

/**
 * String representation.
 * @param {codeNodes.Core.Node~stringify=} stringify A stringifyer for Node instances,
 * defaults to {@link codeNodes.Core.Node.defaultStringify}.
 * @returns {String} The string representation.
 * @alias codeNodes.Core.Node#toString
 */
Node.prototype.toString = function(stringify) {
  stringify = stringify || Node.defaultStringify;
  return Node.nodeStringify(this,stringify);
};
clientExports.proto.toString
  = clientExports.protoPublic.toString
  = Node.prototype.toString;
clientExports.annotations.toString = true;

/**
 * Default stringifier for nodes.
 * @param {codeNodes.Core.Node|String} node A node, i.e. either a string or a Node instance.
 * @param {String=} content The stringified content of the node if the
 *   first argument is a Node instance.
 * @returns {String} Either the given string or the content enclosed in class tags.
 * @static
 * @alias codeNodes.Core.Node.defaultStringify
 */
Node.defaultStringify = function(node,content) {
  var c;
  if ('string' == typeof node) {
    return node;
  }
  if (globals.isNonEmptyString((c = node['class']))) {
    return '<'+c+'>'+content+'</'+c+'>';
  }
  return content; // no class given
};
clientExports.stat.defaultStringify // static client-internal
  = clientExports.statPublic.defaultStringify // static client-public
  = Node.defaultStringify;
clientExports.annotations.defaultStringify = true;

/**
 * Stringify a node object recursively by way of a given stringifyier.
 * @param {codeNodes.Core.Node|String} obj The node to stringify.
 * @param {codeNodes.Core.Node~stringify=} stringify A stringifyer for Node instances,
 *   defaults to {@link Node.defaultStringify}.
 * @alias codeNodes.Core.Node.nodeStringify
 * @private
 */
Node.nodeStringify = function(node,stringify) {
  stringify = stringify || Node.defaultStringify;
  if ('string' == typeof node) {
    return stringify(node);
  }

  // otherwise, the argument must be a Node.
  // #ifdef DEBUG
  if (!(node instanceof Node))
    throw new Error("Argument 'node' must be either a string or an instance of Node.");
  // #endif

  var c = node.length ? node.result.toString(stringify) : node.match[0];
  return stringify(node,c);
};
clientExports.stat.nodeStringify // static client-internal
  = Node.nodeStringify;
clientExports.annotations.nodeStringify = true;

// callback description
/**
 * Stringify a node.
 * @callback codeNodes.Core.Node~stringify
 * @param {codeNodes.Core.Node|String} node A node, i.e. either a string or a Node instance.
 * @param {String=} content The stringified content of the node
 *   (present only if the first argument is a Node instance).
 * @returns {String}
 * @see codeNodes.Core.Node.defaultStringify
 * @example // HTML representation with &lt;span&gt; tags.
 * function htmlStringify(node,content) {
 *   var esc = {'&quot;':'&amp;quot;', '&amp;':'&amp;amp;', '&lt;':'&amp;lt;', '&gt;':'&amp;gt;'};
 *   return ('string' == typeof node) ?
 *     node.replace(/[&quot;&amp;&lt;&gt;]/g, function(c) {return esc[c]})
 *     : ((node['class'] != '') ?
 *       '&lt;span class=&quot;'+node['class']+'&quot;&gt;'+content+'&lt;/span&gt;'
 *       : content)
 * }
 */


// late-binding the Result module (since Result itself requires this module)
Node.requireResult = function() {
  return require("./Result");
};
clientExports.stat.requireResult = function() {
  // on client side Result is in the same script anyway
  return Result;
};

// client code
Node.clientModule = function() {
  return clientExports.module("Node",__filename);
};

