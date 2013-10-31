#!/usr/bin/env node

/* codeNodes client script generator
 * usage: node client [lang]
 */
(function(){
    'use strict';

    var codeNodes = require("codenodes"),
        argv        = process.argv,
        lang        = argv[2];

    if ('string' == typeof lang) {
      process.stdout.write("/* codenodes language script: "+lang+" */\n")
      process.stdout.write(codeNodes.clientRules(lang)+"\n");
    }
    else {
      //var urldef = function(lang){ return "script/sourcecodenodes/scn-lang-"+lang+"-min.js"};
      codeNodes.clientModule(function(err,js) {
        if (err) throw err;
        process.stdout.write("/* codenodes main script */\n")
        process.stdout.write(js+"\n");
      });
      
    }

})();

