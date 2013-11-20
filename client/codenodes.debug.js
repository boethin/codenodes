/**
 * @preserve
 * codeNodes v0.0.1
 *
 * Copyright (c) 2013 Sebastian Boethin <boethin@codenodes.org>
 * codeNodes is open sourced under the MIT license
 * Report bugs to: bugs@codenodes.org
 * See also: http://codenodes.org
 */
(function(){
RegExp.prototype.captures=function () {
  var c = 0, s = this.source;
  for (var i=0, len=s.length; i<len; ++i) {
    switch(s[i]) {
      case '\\':
        ++i;
        break;
      case '(':
        if (!(s[i+1] === '?' && s[i+2] === ':'))
          ++c;
        break;
    }
  }
  return c;
};
var globals={};
globals.isNonEmptyString=function (s) {
  return (('string' === typeof s) && (s.length > 0));
};
globals.quotemeta=function (s) {
  return s.replace(/([\.\\\+\*\?\[\^\]\$\(\)])/g,'\\$1');
};
globals.defineGet=function (obj,name,def) {
  Object.defineProperty(obj,name,{"get":def});
};


/**
 * Create a new instance of the Result class.
 * @class A result is a list of nodes, where each node can be either a
 *   string or a {@link codeNodes.Core.Node} object.
 * @constructor
 * @alias codeNodes.Core.Result
 * @memberof codeNodes.Core
 */
var Result=function () {

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

/**
 * String representaion.
 * @param {codeNodes.Core.Node~stringify=} stringify A stringifier for the nodes.
 * @returns {String}
 * @alias codeNodes.Core.Result#toString
 */
Result.prototype.toString=function (stringify) {
  return this.nodes.map(
    function(n) { return Node.nodeStringify(n,stringify) }
  ).join('');
};

/**
 * Append a new node to the result.
 * @param {codeNodes.Core.Node|String} node A node, i.e. either a string or
 *   a Node instance.
 * @param {codeNodes.Core.Result~pushCallback} ready A callback function
 *   determining the event happened.
 * @alias codeNodes.Core.Result#push
 */
Result.prototype.push=function (node,ready) {

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

Result.prototype["toString"]=Result.prototype.toString;



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
var Node=function Node(rule,scope,match) {

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

/**
 * String representation.
 * @param {codeNodes.Core.Node~stringify=} stringify A stringifyer for Node instances,
 * defaults to {@link codeNodes.Core.Node.defaultStringify}.
 * @returns {String} The string representation.
 * @alias codeNodes.Core.Node#toString
 */
Node.prototype.toString=function (stringify) {
  stringify = stringify || Node.defaultStringify;
  return Node.nodeStringify(this,stringify);
};

/**
 * Default stringifier for nodes.
 * @param {codeNodes.Core.Node|String} node A node, i.e. either a string or a Node instance.
 * @param {String=} content The stringified content of the node if the
 *   first argument is a Node instance.
 * @returns {String} Either the given string or the content enclosed in class tags.
 * @static
 * @alias codeNodes.Core.Node.defaultStringify
 */
Node.defaultStringify=function (node,content) {
  var c;
  if ('string' == typeof node) {
    return node;
  }
  if (globals.isNonEmptyString((c = node['class']))) {
    return '<'+c+'>'+content+'</'+c+'>';
  }
  return content; // no class given
};

/**
 * Stringify a node object recursively by way of a given stringifyier.
 * @param {codeNodes.Core.Node|String} obj The node to stringify.
 * @param {codeNodes.Core.Node~stringify=} stringify A stringifyer for Node instances,
 *   defaults to {@link Node.defaultStringify}.
 * @alias codeNodes.Core.Node.nodeStringify
 * @private
 */
Node.nodeStringify=function (node,stringify) {
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

Node.requireResult=function () {
  // on client side Result is in the same script anyway
  return Result;
};

Node.prototype["toString"]=Node.prototype.toString;

Node["defaultStringify"]=Node.defaultStringify;



/**
 * This class cannot be instantiated directly.
 * @class Abstract base class, providing base functionallity
 * for all rules.
 * @constructor
 * @alias codeNodes.Core.RuleBase
 * @memberof codeNodes.Core
 */
var RuleBase=function () {

  /**
   * Language specific definitions.
   * @type {Object}
   * @instance
   * @readonly
   */
  this.def = null;

};

/**
 * Initialize the rule instance with language specific definitions.
 * @param {Object=} def Language specific definitions.
 * @returns {RuleBase} The instance itself.
 * @alias codeNodes.Core.RuleBase#init
 */
RuleBase.prototype.init=function (def) {
  def = def || {};

  // defaults
  if (!def.hasOwnProperty("scope"))
    def["scope"] = { "main": 0 };
    
  this.def = def;
  return this;
};

/**
 * The priority of the rule related to a scope wherein the rule applies.
 * @param {String} scope The scope identifier.
 * @returns {number}
 * @alias codeNodes.Core.RuleBase#scopeOrder
 */
RuleBase.prototype.scopeOrder=function (scope) {
  return this.def["scope"][scope];
};

RuleBase.prototype.eachScope=function (callback) {
  for (var n in this.def["scope"]) callback(n);
};

/**
 * Create the regex that triggers this rule.
 * The result goes to the callback function along with the number of
 * captures.
 * @param {Function} created Callback: function(regex,numberOfCaptures).
 */
RuleBase.prototype.regexp=function (created) {
  if (!this.re) {
    var re = this.createRegExp(), cpt = re.captures();
    this.re = [re,cpt];
  }
  created.apply(null,this.re);
};

/**
 * Abstract regex creation method.
 * Must be overriden in a derived class.
 * @abstract
 * @returns {RegExp} A new RegExp.
 */
RuleBase.prototype.createRegExp=function () {
  // #ifdef DEBUG
  throw new Error("Abstract function call.")
  // #endif
};

/**
 * Match handler.
 * @param {Object} scope The Scope object.
 * @param {String} input The current input chunk.
 * @param {String[]} match The match array.
 * @param {int} pos The position in input where the match starts.
 * @param {RuleBase~handleCallback} callback The callback function.
 */
RuleBase.prototype.handle=function (scope,input,match,pos,callback) {

  //console.log("// handle: '"+scope.name+"'; '"+input+"'");

  if ('function' == typeof this.def["handler"]) {
    // a handler may be set up within the rule definition.
    this.def["handler"].call(this,scope,input,re,match,pos,callback);
  }
  else { // default handler
    var pre = input.substr(0,pos),txt = match[0],
      rem = input.substr(txt.length+pos), re;

    if ((re = this.def["lookBehind"]) && !pre.match(re)) {
      console.log("lookBehind failed: '"+pre+"'");

      // TODO: ignore match
    }
    
    callback(pre,rem,new Node(this,scope,match));
  }
};

RuleBase.prototype["init"]=RuleBase.prototype.init;



/**
 * Create a new Language processor.
 * @class Internal code processor attached to a specific language.
 * @param {String} lang Language identifier.
 * @constructor
 * @alias codeNodes.Core.Language
 * @memberof codeNodes.Core
 */
var Language=function (lang) {

  // #ifdef DEBUG
  if(!globals.isNonEmptyString(lang))
    throw new Error("Argument 'lang' cannot be empty.");
  // #endif

  this.lang = lang;
  this.listeners = {};
};

/**
 * Initialize the language processor with the set of rules defining the language.
 * @param {Array<RuleBase>} rules The list of rules defining the language.
 * @returns {Language} The instance itself.
 * @alias codeNodes.Core.Language#init
 */
Language.prototype.init=function (rules) {

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

Language.prototype.addEventListener=function (eventType,handler) {
  if (!this.listeners[eventType]) this.listeners[eventType] = [];
  this.listeners[eventType].push(handler);
};

Language.prototype.triggerEvent=function (eventType,args) {
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
Language.prototype.process=function (scope,input,result,ready,left,right,depth) {

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

Language.prototype["addEventListener"]=Language.prototype.addEventListener;



var Scope=function (lang,name) {
  this.lang = lang;
  this.name = name;
};

/**
 * Initialize an instance of the Scope class with a set of rules.
 * @param {Array<RuleBase>} rules The rules applying to the scope.
 * @returns {Scope} The instance itself.
 * @alias codeNodes.Core.Scope#init
 */
Scope.prototype.init=function (rules) {

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

/**
 * Match a chunk of code against the regex of the Scope. If a match is found,
 *   find the rule responsible for handling the match.
 * @param {String} chunk The current chunk of code.
 * @param {RuleBase~handleCallback} next Callback function, forwarded to
 *   the rule handler.
 * @alias codeNodes.Core.Scope#eat
 */
Scope.prototype.eat=function (chunk,next) {

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



var PatternRule=function () {
  RuleBase.call(this);

  /**
   * @type {string}
   * @instance
   * @readonly
   */
  this.pattern = null;

};

PatternRule.prototype=new RuleBase;

PatternRule.prototype.init=function (def) {
  this.constructor.prototype.init.call(this,def);

  // #ifdef DEBUG
  if (!this.def.hasOwnProperty("pattern"))
    throw new Error("Missing property: 'pattern'.");
  // #endif

  return this;
};

PatternRule.prototype.createRegExp=function () {
  return new RegExp(this.def['pattern']);
};

PatternRule.prototype["init"]=PatternRule.prototype.init;



var KeywordRule=function () {
  RuleBase.call(this);
};

KeywordRule.prototype=new RuleBase;

KeywordRule.prototype.init=function (def) {
  this.constructor.prototype.init.call(this,def);

  // #ifdef DEBUG
  // required
  if (!this.def.hasOwnProperty("words"))
    throw new Error("Missing property: 'words'.");
  // #endif

  // defaults
  if (!this.def.hasOwnProperty("before"))
    this.def["before"] = '\\b';
  if (!this.def.hasOwnProperty("after"))
    this.def["after"] = '\\b';

  return this;
};

KeywordRule.prototype.createRegExp=function () {
  var p = KeywordRule.fold(this.def['words']);
  return new RegExp(this.def["before"]+p+this.def["after"]);
};

KeywordRule.fold=function (words) {

  function str(prefix,nodes,opt) {
    var rv = prefix.replace( // quotemeta
      /([\.\\\+\*\?\[\^\]\$\(\)])/g, '\\$1');
    if (nodes.length) { // append alternation
      rv += '(?:'+nodes.map(function(n){
        return str.apply(null,n)}).join('|')+')';
      if (opt) rv += '?'; // optional
    }
    return rv;
  }

  function reduce(prefix,nodes,opt) {
    //console.log("## reduce("+loopc+"): "+triple_tostr(prefix,nodes,opt));

    // do nothing unless at least 2 triples are given
    if (!(nodes.length > 1)) {
      return [prefix,nodes,opt];
    }

    // 1st char of the prefix of the 1st node
    var c = nodes[0][0][0];
    if (!(c === nodes[1][0][0])) {
      // no match with the prefix of the 2nd node

      // do nothing unless there are at least 3 nodes
      if (!(nodes.length > 2)) {
        return [prefix,nodes,opt];
      }

      // try to reduce next list part
      var first = nodes.shift(), next = reduce('',nodes,false);
      if (next[0].length > 0) {
        return [prefix,[first,next],opt];
      }

      // next list part couldn't be reduced
      next[1].unshift(first);
      return [prefix,next[1],opt];
    }

    // reduce any ensuing node whose prefix starts with c
    var newnodes = [], newopt = false;
    while (nodes.length)
    {
      if (nodes[0][0][0] == c) // remove 1st char
        nodes[0][0] = nodes[0][0].substr(1);
      else // otherwise stop
        break;

      // reduce node or detect new optional node
      var n = nodes.shift();
      if (n[0].length) {
        newnodes.push(n);
        continue;
      }
      newopt = true;
    }

    if (nodes.length || opt)
    {
      var newtrip = reduce(c,newnodes,newopt);
      if (nodes.length)
      {
        // reduce remaining nodes
        var next = reduce('',nodes,false);
        if (next[0].length) {
          return [prefix, [ newtrip, next ], opt];
        }

        // couldn't be reduced
        next[1].unshift(newtrip);
        return [prefix, next[1],opt];
      }

      // current node is optional
      nodes.unshift(newtrip);
      return [prefix,nodes,opt];
    }

    // nothing left to reduce
    return reduce(prefix+c, newnodes, newopt);
  }

  words.sort();
  var nodes = words.map(function(w){return [w,[],false]});
  return str.apply(null,reduce('',nodes,false));
};

KeywordRule.prototype["init"]=KeywordRule.prototype.init;



/**
 * @class This rule applies to any text between start and end delimiter,
 * regardless in wich context the end delimiter occurs.
 * If no end delimiter is found, the rule applies to the rest of the text.
 * A typical example is the C-sytle comment block.
 * @constructor
 * @alias codeNodes.Rules.BlockCommentRule
 * @memberof codeNodes.Rules
 * @extends codeNodes.Core.RuleBase
 * @example
 *   // C-style block comment
 *   (new codeNodes.Rules.BlockCommentRule).init({
 *     "class": "comment",
 *     "begin": "/*",
 *     "end": "*&#47;"
 *   })
*/
var BlockCommentRule=function () {
  RuleBase.call(this);

  /**
   * @type {string}
   * @instance
   */
  this.startDelimiter = null;

  /**
   * @type {string}
   * @instance
   */
  this.endDelimiter = null;

};

BlockCommentRule.prototype=new RuleBase;

BlockCommentRule.prototype.init=function (def) {
  RuleBase.prototype.init.call(this,def);
  
  // delimiters
  this.startDelimiter = this.def["begin"] || '/*';
  this.endDelimiter = this.def["end"] || '*/';
  return this;
};

/**
 * The RegExp matching the start delimiter.
 * @returns {RegExp}
 * @alias codeNodes.Rules.BlockCommentRule#createRegExp
 * @see RuleBase#createRegExp
 * @override
 */
BlockCommentRule.prototype.createRegExp=function () {
  return new RegExp(globals.quotemeta(this.startDelimiter));
};

/**
 * Look up for the end delimiter and either handle all the text bewteen
 * start and end delimiter or the rest of the text if no end delimiter
 * is found.
 * @param {Object} scope The Scope object.
 * @param {String} input The current input chunk.
 * @param {Array<String>} match The match array.
 * @param {number} pos The position in input where the match starts.
 * @param {RuleBase~handleCallback} callback The callback function.
 * @alias codeNodes.Rules.BlockCommentRule#handle
 * @see RuleBase#handle
 * @override
 */
BlockCommentRule.prototype.handle=function (scope,input,match,pos,callback) {
  var pre = input.substr(0,pos),rem,m,p;

  // look up end delimiter
  if (0 < (p = input.indexOf(this.endDelimiter,pos+this.startDelimiter.length))) {
    // delimiter found
    rem = input.substr(p+this.endDelimiter.length);
    m = input.substr(pos,p-pos+this.endDelimiter.length);
  }
  else { // no end delimiter found
    rem = '';
    m = input.substr(pos);
  }
  
  callback(pre,rem,new Node(this,scope,[m]));
};

BlockCommentRule.prototype["init"]=BlockCommentRule.prototype.init;



var Core={};

Core["Result"]=Result;

Core["Node"]=Node;

Core["Language"]=Language;

Core["Scope"]=Scope;

Core["RuleBase"]=RuleBase;

var Rules={};

Rules["PatternRule"]=PatternRule;

Rules["KeywordRule"]=KeywordRule;

Rules["BlockCommentRule"]=BlockCommentRule;

var codeNodes={};

/**
 * Language definition cache.
 * @type {Object}
 * @static
 * @private
 */
codeNodes.langCache={};

/**
 * Language identifiers.
 * @type {Array<String>}
 * @static
 * @private
 */
codeNodes.knownLanguages=["XML","test"];

codeNodes.createProcessor=function (lang,ready) {
  codeNodes.ensureRules(lang,function(err,rules) {
    if (err) return ready(err);
    ready(null,rules,function(code,callback) { // proc
      rules.process("main",code,new Result,function(r){
        callback(r);
      });
    });
  },codeNodes.loadRulesExplicit);
};

codeNodes.compileLanguage=function (lang,rules) {
  return (new Language(lang)).init(rules());
};

codeNodes.availableLanguages=function (ready) {
  // on client side the list of languages is known in advance
  ready(null,codeNodes.knownLanguages);
};

codeNodes.setRules=function (lang,rules) {
  return (codeNodes.langCache[lang] = rules);
};

codeNodes.ensureRules=function (lang,ready,load) {
  var rules;
  if ((rules = codeNodes.langCache[lang])) {
    ready(null,rules);
  }
  else {
    load(lang,ready);
  }
};

codeNodes.loadRulesExplicit=function (lang,ready) {
  if (!('function' == typeof codeNodes["langScriptUri"]))
    return ready("function required: codeNodes.langScriptUri");
    
  // append script element and wait for execution, i.e.: wait while
  // langCache[lang] is not set.
  var src = codeNodes["langScriptUri"](lang);
  codeNodes.appendScript(src);
  (function(wait,t){ wait(wait,t) })(function(wait,t) {
    setTimeout(function() {
      console.log("wait("+t+")");
      if ('object' == typeof(rules = codeNodes.langCache[lang])) {
        ready(null,rules);
      }
      else { // timeout after 10 seconds
        (t < 100) ? wait(wait,t+1)
        : ready("timeout while loading '"+src+"'");
      }
    }, 100);
  }, 0);
};

codeNodes.init=function (langScriptUri) {
  codeNodes["langScriptUri"] = langScriptUri;
};

codeNodes.appendScript=function (src) {
  (function(elem) {
    elem.setAttribute("src",src);
    elem.setAttribute("type","text/javascript");
    document.body.appendChild(elem);
  })(document.createElement("script"));
};

codeNodes["createProcessor"]=codeNodes.createProcessor;

codeNodes["compileLanguage"]=codeNodes.compileLanguage;

codeNodes["availableLanguages"]=codeNodes.availableLanguages;

codeNodes["setRules"]=codeNodes.setRules;

codeNodes["init"]=codeNodes.init;

codeNodes["appendScript"]=codeNodes.appendScript;

codeNodes["Core"]=Core;

codeNodes["Rules"]=Rules;



window['codeNodes'] = codeNodes;
})();
