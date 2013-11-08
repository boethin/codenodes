/**
 * v0.0.1
 * codeNodes - Consider source code as nodes.
 * http://www.codenodes.org
 *
 * @copyright Copyright (c) 2013 Sebastian Böthin
 * @author Sebastian Böthin <sebastian@boethin.eu>
 * @license MIT license - see http://www.codenodes.org/LICENSE
 */

// Abdicable code for error recovery is tagged as DEBUG.
// See: https://npmjs.org/package/preprocessor

// #ifdef DEBUG
'use strict';
// #endif

// node.js builtin modules
var
  fs = require("fs"),
  path = require("path");

// internal modules
var
  globals = require("./globals"),
  Result = exports.Result = require("./Result"),
  Node = require("./Node"),
  Language = require("./Language"),
  Scope = require("./Scope"),
  RuleBase = require("./RuleBase"),
  PatternRule = require("./rules/PatternRule"),
  KeywordRule = require("./rules/KeywordRule"),
  BlockCommentRule = require("./rules/BlockCommentRule");

var clientExports = {
  name: 'codeNodes',
  ctor: null,
  ctorMember: {},
  publics: [
    'Result',
    'RuleBase',
    'Language',
    'Scope',
    'PatternRule',
    'KeywordRule',
    'BlockCommentRule'
  ],
  stat: {},
  statPublic: {},
};

/**
 * The codeNodes namespace.
 * @namespace codeNodes
 */
var codeNodes = clientExports.ctor = {};

/**
 * @namespace codeNodes.Rules
 */
codeNodes.Rules = {};

// Language definition cache.
codeNodes.langCache = clientExports.ctorMember.langCache = {};


// server-public, client-public

/**
 * blah
 */

/**
 * Create a processor function.
 * @param {String} lang The language identifier.
 * @param {Function} ready The callback function providing a processor function.
 * @static
 */
codeNodes.createProcessor = function(lang,ready) {
  codeNodes.ensureRules(lang,function(err,rules) {
    if (err) return ready(err);
    ready(null,rules,function(code,callback) { // proc
      rules.process("main",code,new Result,function(r){
        callback(r);
      });
    });
  },codeNodes.loadRulesExplicit);
};
exports.createProcessor
  = clientExports.stat.createProcessor
  = clientExports.statPublic.createProcessor
  = codeNodes.createProcessor;


// server-public, client-public
codeNodes.compileLanguage
    = exports.compileLanguage
    = clientExports.stat.compileLanguage
    = clientExports.statPublic.compileLanguage = function(lang,rules) {
  return (new Language(lang)).init(rules());
};


// Find available languages (server)
// (readdir a ./lang directory relative to the local path of the module
// for language+'.js' files).
codeNodes.available
    = exports.available = function(ready) {
  // __dirname is the local path of the module
  fs.readdir(path.join(__dirname,'./lang'), function(err,files) {
    if (err) return ready(err);
    var m,langs = [];
    for (var f in files) {
      if ((m = files[f].match(/^(.+)\.js$/)))
        langs.push(m[1]);
    }
    ready(null,langs);
  });
};



// server-public, client-public
codeNodes.setRules
    = exports.ensureRules
    = clientExports.stat.setRules
    = clientExports.statPublic.setRules = function(lang,rules) {
  return (codeNodes.langCache[lang] = rules);
};


// Load rules asynchronously (server/client).
codeNodes.ensureRules
    = exports.ensureRules
    = clientExports.stat.ensureRules = function(lang,ready,load) {
  var rules;
  if ((rules = codeNodes.langCache[lang])) {
    ready(null,rules);
  }
  else {
    load(lang,ready);
  }
};

// Load rules table from the given module (server).
codeNodes.getModuleRules
    = exports.getModuleRules = function(lang) {
  var module = require("./lang/"+lang);
  return module.rules;
};

// Load rules synchronously (server).
codeNodes.loadRulesSync
    = exports.loadRulesSync = function(lang) {
    
  return codeNodes.setRules(lang,
    codeNodes.compileLanguage(lang,codeNodes.getModuleRules(lang)));
    
//   return (codeNodes.langCache[lang] = codeNodes.compileLanguage(
//     lang,codeNodes.getModuleRules(lang)));
};

// server-side: loadRulesExplicit
codeNodes.loadRulesExplicit = function(lang,ready) {
  ready(null,codeNodes.loadRulesSync(lang));
};



// client-side: loadRulesExplicit
// obtain rule script from server
clientExports.stat.loadRulesExplicit = function(lang,ready) {
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


clientExports.stat.init
    = clientExports.statPublic.init = function(langScriptUri) {
  codeNodes["langScriptUri"] = langScriptUri;
};


// appendScript(string src)
// Append <script> element with "src" attribute to document.body.
clientExports.stat.appendScript
    = clientExports.statPublic.appendScript = function(src) {
  (function(elem) {
    elem.setAttribute("src",src);
    elem.setAttribute("type","text/javascript");
    document.body.appendChild(elem);
  })(document.createElement("script"));
};


// render an array of assignments
function renderClientModule(f) {
  return f.map(function(a){ return a[0]+'='+a[1]+';\n' }).join('');
}

function clientWrapper(s) {
  return "(function(){\n"+s+"\n})();"
}

/**
 * Generate clients-side code for the core codeNodes script.
 * @param {function} ready Callback function.
 */
codeNodes.clientModule
    = exports.clientModule
    = function(ready) {
    
  codeNodes.available(function(err,langs) {

    ready(null,
      "/**\n"+
      " * @preserve\n"+
      " * codeNodes v0.0.1\n"+
      " *\n"+
      " * @author Copyright (c) 2013 Sebastian Böthin\n"+
      " * @license codeNodes is open sourced under the MIT license\n"+
      " * Report bugs to: bugs@codenodes.org\n"+
      " * See also: http://codenodes.org\n"+
      " */\n"+
      "(function(){\n"+

        renderClientModule(globals.clientModule())+"\n\n"+
        renderClientModule(Result.clientModule())+"\n\n"+
        renderClientModule(Node.clientModule())+"\n\n"+
        renderClientModule(RuleBase.clientModule())+"\n\n"+
        renderClientModule(Language.clientModule())+"\n\n"+
        renderClientModule(Scope.clientModule())+"\n\n"+
        renderClientModule(PatternRule.clientModule())+"\n\n"+
        renderClientModule(KeywordRule.clientModule())+"\n\n"+
        renderClientModule(BlockCommentRule.clientModule())+"\n\n"+

        renderClientModule(clientModule())+"\n\n"+


        // export codeNodes
        "window['codeNodes'] = codeNodes;\n\n"+
      "})();"
      );
  });
};

codeNodes.clientRules
    = exports.clientRules
    = function(lang) {
  return '('+String(function(lang,rules) {
    codeNodes.setRules(lang,codeNodes.compileLanguage(lang,rules))
  })+')("'+lang+'",'+codeNodes.getModuleRules(lang)+');';
};

var clientModule = function() {
  return globals.ceateClientModule.call(clientExports);
};



