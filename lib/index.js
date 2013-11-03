// #ifdef DEBUG
'use strict';
// #endif

var fs = require("fs");
var path = require("path");
var globals = require("./globals");

var
  Result = exports.Result = require("./result"),
  Node = require("./node"),
  Language = require("./language"),
  Scope = require("./scope"),
  RuleBase = require("./rulebase"),
  PatternRule = require("./rules/patternrule"),
  WordListRule = require("./rules/wordlistrule"),
  NewLineRule = require("./rules/newlinerule"),
  BlockCommentRule = require("./rules/blockcommentrule");

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
    'WordListRule',
    'NewLineRule',
    'BlockCommentRule'
  ],
  stat: {},
  statPublic: {},
};

var codeNodes = clientExports.ctor = {};
codeNodes.parser = clientExports.ctorMember.parser = {};


// server-public, client-public
codeNodes.createProcessor
    = exports.createProcessor
    = clientExports.stat.createProcessor
    = clientExports.statPublic.createProcessor = function(lang,ready) {
  codeNodes.ensureRules(lang,function(err,rules) {
    if (err) return ready(err);
    ready(null,rules,function(code,callback) { // proc
    
      var result = new Result;
      rules.process("main",code,result,function(r){
        callback(r);

      });

      //callback(result);

      //return rules.process("main",code,result)
    });
  },codeNodes.loadRulesExplicit);
};

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
  return (codeNodes.parser[lang] = rules);
};


// Load rules asynchronously (server/client).
codeNodes.ensureRules
    = exports.ensureRules
    = clientExports.stat.ensureRules = function(lang,ready,load) {
  var rules;
  if ((rules = codeNodes.parser[lang])) {
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
    
//   return (codeNodes.parser[lang] = codeNodes.compileLanguage(
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
  // parser[lang] is not set.
  var src = codeNodes["langScriptUri"](lang);
  codeNodes.appendScript(src);
  (function(wait,t){ wait(wait,t) })(function(wait,t) {
    setTimeout(function() {
      console.log("wait("+t+")");
      if ('object' == typeof(rules = codeNodes.parser[lang])) {
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
      " * @preserve Copyright 2013 SomeThirdParty.\n"+
      " * @author <a href=\"mailto:sebastian@boethin.eu\">Sebastian Böthin</a>\n"+
      " * Here is the full license text and copyright\n"+
      " * notice for this file. Note that the notice can span several\n"+
      " * lines and is only terminated by the closing star and slash:\n"+
      " */\n"+

      "(function(){\n"+

        renderClientModule(globals.clientModule())+"\n\n"+
        renderClientModule(Result.clientModule())+"\n\n"+
        renderClientModule(Node.clientModule())+"\n\n"+
        renderClientModule(RuleBase.clientModule())+"\n\n"+
        renderClientModule(Language.clientModule())+"\n\n"+
        renderClientModule(Scope.clientModule())+"\n\n"+
        renderClientModule(PatternRule.clientModule())+"\n\n"+
        renderClientModule(WordListRule.clientModule())+"\n\n"+
        renderClientModule(NewLineRule.clientModule())+"\n\n"+
        renderClientModule(BlockCommentRule.clientModule())+"\n\n"+

        renderClientModule(clientModule())+"\n\n"+

        
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



