/**
 * v0.0.1
 * codeNodes - Consider source code as nodes.
 * http://www.codenodes.org
 *
 * Copyright (c) 2013 Sebastian Böthin <boethin@codenodes.org>
 * MIT license - see http://www.codenodes.org/LICENSE
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
  client = require("./client"),
  Result = exports.Result = require("./core/Result"),
  Node = exports.Node = require("./core/Node"),
  Language = require("./core/Language"),
  Scope = require("./core/Scope"),
  RuleBase = require("./core/RuleBase"),
  PatternRule = require("./rules/PatternRule"),
  KeywordRule = require("./rules/KeywordRule"),
  BlockCommentRule = require("./rules/BlockCommentRule");


// client code provider
var clientExports = new client.Exporter({
  publics: [
    'Core',
    "Rules"
  ],
  members: {
    Core: new client.Exporter({
      publics: [
        'Result',
        'Node',
        'Language',
        'Scope',
        'RuleBase'
      ]
    }),
    Rules: new client.Exporter({
      publics: [
        'PatternRule',
        'KeywordRule',
        'BlockCommentRule'
      ]
    })
  }
});


/**
 * The codeNodes namespace.
 * @namespace codeNodes
 */
var codeNodes = clientExports.ctor = {};

/**
 * The namespace containing core classes.
 * @namespace codeNodes.Core
 */
exports.Core = codeNodes.Core = clientExports.members.Core.ctor = {
  Result: Result,
  Node: Node,
  Language: Language,
  Scope: Scope,
  RuleBase: RuleBase
};

/**
 * The namespace containing all the rules.
 * @namespace codeNodes.Rules
 */
exports.Rules = codeNodes.Rules = clientExports.members.Rules.ctor = {
  PatternRule: PatternRule,
  KeywordRule: KeywordRule,
  BlockCommentRule: BlockCommentRule
};



/**
 * Language definition cache.
 * @type {Object}
 * @static
 * @private
 */
codeNodes.langCache = clientExports.ctorMember.langCache = {};
clientExports.annotations.langCache = true;

/**
 * Language identifiers.
 * @type {Array<String>}
 * @static
 * @private
 */
codeNodes.knownLanguages = clientExports.ctorMember.knownLanguages = [];
clientExports.annotations.knownLanguages = true;

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


/**
 * @param {String} lang The language identifier.
 * @param {codeNodes.ruleProvider} rules A function returning the
 *   language-specific rule set.
 * @returns {codeNodes.Core.Language} A language processor.
 * @static
 */
codeNodes.compileLanguage = function(lang,rules) {
  return (new Language(lang)).init(rules());
};
exports.compileLanguage // server-public
  = clientExports.stat.compileLanguage // client-internal
  = clientExports.statPublic.compileLanguage // client-public
  = codeNodes.compileLanguage;

// callback description
/**
 * Rule provider function.
 * @callback codeNodes.ruleProvider
 * @returns {Array<codeNodes.Core.RuleBase>} A specific rules set.
 */

// Find available languages (server)
// (readdir a ./lang directory relative to the local path of the module
// for language+'.js' files).

/**
 * Find available language definitions (readdir a ./lang directory
 * relative to the local path of the module for language+'.js' files).
 * @param {codeNodes.availableLangugesReady} ready Callback function.
 */
codeNodes.availableLanguages = function(ready) {
  if (codeNodes.knownLanguages.length) {
    // languages already known
    ready(null,codeNodes.knownLanguages);
    return;
  }

  // __dirname is the local path of the module
  fs.readdir(path.join(__dirname,'./lang'), function(err,files) {
    if (err) {
      ready(err);
      return;
    }

    var m;
    for (var f in files) {
      if ((m = files[f].match(/^(.+)\.js$/)))
        codeNodes.knownLanguages.push(m[1]);
    }
    ready(null,codeNodes.knownLanguages);
  });
};
exports.availableLanguages = codeNodes.availableLanguages; // server-public

// client version
clientExports.stat.availableLanguages = function(ready) {
  // on client side the list of languages is known in advance
  ready(null,codeNodes.knownLanguages);
};
// client-public
clientExports.statPublic.availableLanguages = clientExports.stat.availableLanguages;

// callback description
/**
 * Result callback of availableLanguages function.
 * @callback codeNodes.availableLangugesReady
 * @param {String} err Error message, null on success.
 * @param {Array<String>} langs Language identifiers.
 */


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
 * @param {codeNodes.clientModuleReady} ready Callback function.
 * @static
 * @memberof codeNodes
 */
codeNodes.clientModule =  function(ready) {
    
  codeNodes.availableLanguages(function(err,langs) {
    if (err) {
      ready(err);
      return;
    }

    // known language identifiers
    clientExports.ctorMember.knownLanguages = '['+langs.map(
      function(s){return '"'+s+'"'}).join(",")+']';

    ready(null,
      "/**\n"+
      " * @preserve\n"+
      " * codeNodes v0.0.1\n"+
      " *\n"+
      " * Copyright (c) 2013 Sebastian Boethin <boethin@codenodes.org>\n"+
      " * codeNodes is open sourced under the MIT license\n"+
      " * Report bugs to: bugs@codenodes.org\n"+
      " * See also: http://codenodes.org\n"+
      " */\n"+
      "(function(){\n"+

        renderClientModule(globals.clientModule())+"\n\n"+

        client.render(Result.clientModule())+"\n\n"+
        client.render(Node.clientModule())+"\n\n"+
        client.render(RuleBase.clientModule())+"\n\n"+
        client.render(Language.clientModule())+"\n\n"+
        client.render(Scope.clientModule())+"\n\n"+

        client.render(PatternRule.clientModule())+"\n\n"+
        client.render(KeywordRule.clientModule())+"\n\n"+
        client.render(BlockCommentRule.clientModule())+"\n\n"+

        client.render(clientModule())+"\n\n"+


        // export codeNodes
        "window['codeNodes'] = codeNodes;\n"+
      "})();\n"
      );
  });
};
exports.clientModule = codeNodes.clientModule; // server-public

/**
 * Generate clients-side code for a particular language script.
 * @param {String} lang The language identifier.
 * @param {codeNodes.clientModuleReady} ready Callback function.
 * @static
 * @memberof codeNodes
 */
codeNodes.clientLanguageModule = function(lang,ready) {
  ready(null,'('+String(function(lang,rules) {
    codeNodes.setRules(lang,codeNodes.compileLanguage(lang,rules))
  })+')("'+lang+'",'+codeNodes.getModuleRules(lang)+');');
};
exports.clientLanguageModule = codeNodes.clientLanguageModule; // server-public

// callback description
/**
 * @callback codeNodes.clientModuleReady
 * @param {String} err Error message, null on success.
 * @param {String} code Generated client code.
 */

// client code
var clientModule = function() {
  return clientExports.module("codeNodes",__filename);
};


