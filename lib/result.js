// #ifdef DEBUG
'use strict';
// #endif

var Globals = require("./globals");

var clientExports = {
  name: 'Result',
  base: null,
  ctor: null,
  proto: {},
  protoPublic: {},
  stat: {},
  statPublic: {}
};


var Result
    = module.exports
    = clientExports.ctor = function() {
  this.nodes = [];
};

Result.nodestr
    = clientExports.stat.nodestr = function(node,content) {
  var c;
  if ((c = node['class']))
    return '<'+c+'>'+content+'</'+c+'>';
  return content; // no class given
};

Result.nodeToString
    = clientExports.stat.nodeToString
    = clientExports.statPublic.nodeToString = function(obj,nodestr) {
  nodestr = nodestr || Result.nodestr;

  // case 1: argument is a string
  if ('string' == typeof obj) {
    return obj;
  }

  // case 2: argument is an array
  if ((obj instanceof Array) && obj.length > 0) {
    return obj.map(function(n) {return Result.nodeToString(n,nodestr)}).join('');
  }

  // case 3: argument is an object providing either nodes or match
  if ('object' == typeof obj) {
    var c,t,n;
    if ((t = obj['result']) && (n = t['nodes']) && n.length > 0)
      c = Result.nodeToString(n,nodestr);
    else if ((t = obj['match']))
      // obj['match'] must be either Array or String
      c = (t instanceof Array) ? t[0] : t;

    if (c) return nodestr(obj,c);
  }
  
  throw new Error("unhandled argument '"+(typeof obj)+"'");
  //return '';
  //var c = node.result.any() ? node.result.toString(nodestr) : node.match[0];
  //return nodestr(node,c);
};

Result.prototype.toString
    = clientExports.proto.toString
    = clientExports.protoPublic.toString = function(nodestr) {
  return this.nodes.map(
    function(n) { return Result.nodeToString(n,nodestr) }
  ).join('');
};

Result.prototype.any
    = clientExports.proto.any
    = clientExports.protoPublic.any = function() {
  return this.nodes.length > 0;
};

Result.prototype.append
    = clientExports.proto.append = function(obj,lang,scope,depth,trigger) {
  if ('string' == typeof obj) { // String
    this.appendTextNode(lang,scope,obj,depth,trigger);
  }
  else if ('object' == typeof obj) {
    if (obj.hasOwnProperty('match')) { // Node
      this.appendNode(lang,scope,obj,depth,trigger);
    }
    else if (obj.hasOwnProperty('nodes')) { // Result
      this.append(obj['nodes'],lang,scope,depth,trigger);
    }
    else if (obj instanceof Array) { // Array
      for (var i = 0; i < obj.length; i++)
        this.append(obj[i],lang,scope,depth,trigger);
    }
  }
};

Result.prototype.appendNode
    = clientExports.proto.appendNode = function(lang,scope,node,depth,trigger) {
  this.nodes.push(node);
  trigger('NodeCreating',[lang,scope,node,depth]);
};

Result.prototype.appendTextNode
    = clientExports.proto.appendTextNode = function(lang,scope,text,depth,trigger) {
  if (text.length) {
    var t;
    if (this.any() && 'string' == typeof this.nodes[this.nodes.length-1]) {
      this.nodes[this.nodes.length-1] += text;
      trigger('TextNodeAppended',[lang,scope,text,depth]);
    }
    else {
      this.nodes.push(text);
      trigger('TextNodeCreating',[lang,scope,text,depth]);
    }
  }
};

Result.clientModule = function() {
  return Globals.ceateClientModule.call(clientExports);
};

