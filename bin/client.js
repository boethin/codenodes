#!/usr/bin/env node

(function(){
  'use strict';

  var
    util = require('util'),
    fs = require('fs'),
    program = require('commander'),
    codeNodes = require("codenodes");

  program
    .version('0.0.1')
    .option('-a, --available',
      'List available languages and exit.')
    .option('-l, --language [lang]',
      'Output code for the specified language.', null)
    .option('-p, --preprocessor [options]',
      'Argument string passed to the preprocessor.')
    .option('-P, --no-preprocessor',
      'Do not process output with the preprocessor.')
    .option('-c, --compilation [options]',
      'Argument string passed to the closure compiler.', '')
    .option('-C, --no-compilation',
      'Do not process output with the closure compiler.')
    .option('-d, --debug',
      'Do not apply optimizations.\n'+
      '    Equivalent to: --no-preprocessor --no-compilation.')
    .option('-o, --output [file]', 'Output file, default is stdout.', null)
    .parse(process.argv);

  if (program.debug)
    program.preprocessor = program.compilation = false;


//   console.log("compilation: %s", program.compilation);
//
//   console.log(typeof program.compilation);
//
//   console.log(program.compilation !== false);
//
//   if (program.compilation) {
//
//   }
//

//  process.exit(0);


  if (program.available) {
    // list available languages
    codeNodes.availableLanguages(function(err,langs) {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      for (var i in langs)
        console.log(langs[i]);
    });
  }
  else {
    // generate client code
    var
      out = function (data) {
        if (program.output) { // create file
          var s = fs.createWriteStream(program.output);
          s.on('error', function (err) {
              console.error("Error: Cannot write to '"+program.output+"':\n", err);
              process.exit(1);
            });
          s.write(data);
          s.close();
        }
        else { // stdout
          process.stdout.write(data);
        }
      },

      // code generator
      generate = program.language ?
        function(process) { codeNodes.clientLanguageModule(program.language,process) }
        : codeNodes.clientModule,

      skip = function (code,callback) { callback(null,code) }, // dummy

      // preprocessor
      preprocess = program.preprocessor ?
        function (code,callback) {
          // https://npmjs.org/package/preprocessor
          var Preprocessor = require("preprocessor");
          callback(null,(new Preprocessor(code)).process())
        } : skip,

      // minifier
      minify = program.compilation !== false ?
        function(code,callback) {
          // https://npmjs.org/package/closure-compiler
          var opt = '';
          if ('string' == typeof program.compilation)
            opt = program.compilation;
          //var opt = { compilation_level: program.compilation_level };
          //opt = {};
          require('closure-compiler').compile(code, opt,
          function(err,stdout,stderr) {
            if (stderr != '')
              console.warn(stderr);
            callback(err,stdout);
          })
        }: skip;

    // main
    generate(function(err,code) {
      if (err) {
        console.error(err);
        process.exit(1);
      }

      preprocess(code, function(err,pre) {
        if (err) {
          console.error(err);
          process.exit(1);
        }

        minify(pre, function(err,minified) {
          if (err) {
            console.error(err);
            process.exit(1);
          }

          out(minified);
        })
      })
    });
  }

})();
