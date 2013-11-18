#!/usr/bin/env node

(function(){
  'use strict';

  var
    VERSION = "v0.0.1",
    DESCRIPTION = "codeNodes client code generator "+VERSION;


  var
    util = require('util'),
    fs = require('fs'),
    codeNodes = require("codenodes");

  // Light-weight option parsing for node.js
  var optimist = require('optimist')
    .usage(DESCRIPTION+"\nusage: $0 [options]")

    .describe("h",
      "Display usage and exit.")
    .alias("h", "help")

    .describe("V",
      "Display version and exit.")
    .alias("V", "version")

    .describe("a",
      "List available languages and exit.")
    .alias("a", "available")

    .describe("l",
      "Output code for the specified language.")
    .alias("l", "language")

    .describe("no-preprocessor",
      "Do not process output with the preprocessor.")

    .describe("compilation_level",
      "Pass a compilation level of the closure compiler.")

    .describe("externals",
      "Pass an external to the closure compiler.")

    .describe("jscomp_off",
      "Silences warnings from the the closure compiler of the given type.")

    .describe("flagfile",
      "Specify a flag file containing additional options for the closure compiler.")

    .describe("no-compilation",
      "Do not process output with the closure compiler.")

    .describe("d",
      "Do not apply optimizations (i.e. --no-preprocessor --no-compilation).")
    .alias("d", "debug")

    .describe("o",
      "Output file, default is stdout.")
    .alias("o", "output");


  var argv = optimist.argv;

  if (argv.help) {
    // display usage and exit
    optimist.showHelp();
    process.exit(0);
  }

  if (argv.version) {
    // display version and exit
    console.log(VERSION);
    process.exit(0);
  }

  if (argv.available) {
    // list available languages
    codeNodes.availableLanguages(function(err,langs) {
      if (err) {
        console.error("Error: "+err);
        process.exit(1);
      }
      for (var i in langs)
        console.log(langs[i]);
    });
  }

  else {
    // generate client code
    if (argv.debug)
      argv.preprocessor = argv.compilation = false;

    var
      out = function (data) {
        if (argv.output) { // create file
          var s = fs.createWriteStream(argv.output);
          s.on('error', function (err) {
              console.error("Error: Cannot write to '"+argv.output+"':\n", err);
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
      generate = argv.language ?
        function(process) { codeNodes.clientLanguageModule(argv.language,process) }
        : codeNodes.clientModule,

      skip = function (code,callback) { callback(null,code) }, // dummy

      // preprocessor
      preprocess = argv.preprocessor ?
        function (code,callback) {
          // https://npmjs.org/package/preprocessor
          var Preprocessor = require("preprocessor");
          callback(null,(new Preprocessor(code)).process())
        } : skip,

      // minifier
      minify = argv.compilation !== false ?
        function(code,callback) {
          // https://npmjs.org/package/closure-compiler
          var opt = {}; // closure compiler options
          if (argv.compilation_level)
            opt.compilation_level = argv.compilation_level;
          if (argv.externals)
            opt.externals = argv.externals;
          if (argv.jscomp_off)
            opt.jscomp_off = argv.jscomp_off;
          if (argv.flagfile)
            opt.flagfile = argv.flagfile;

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



//   argv
//     .version('0.0.1')
//     .option('-a, --available',
//       'List available languages and exit.')
//     .option('-l, --language [lang]',
//       'Output code for the specified language.', null)
//     .option('-p, --preprocessor [options]',
//       'Argument string passed to the preprocessor.')
//     .option('-P, --no-preprocessor',
//       'Do not process output with the preprocessor.')
//     .option('-c, --compilation [options]',
//       'Argument string passed to the closure compiler.', '')
//     .option('-C, --no-compilation',
//       'Do not process output with the closure compiler.')
//     .option('-d, --debug',
//       'Do not apply optimizations.\n'+
//       '    Equivalent to: --no-preprocessor --no-compilation.')
//     .option('-o, --output [file]', 'Output file, default is stdout.', null)
//     .parse(process.argv);
//
//   if (argv.debug)
//     argv.preprocessor = argv.compilation = false;


//   console.log("compilation: %s", argv.compilation);
//
//   console.log(typeof argv.compilation);
//
//   console.log(argv.compilation !== false);
//
//   if (argv.compilation) {
//
//   }
//

  /*
  process.exit(0);


  if (argv.available) {
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
        if (argv.output) { // create file
          var s = fs.createWriteStream(argv.output);
          s.on('error', function (err) {
              console.error("Error: Cannot write to '"+argv.output+"':\n", err);
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
      generate = argv.language ?
        function(process) { codeNodes.clientLanguageModule(argv.language,process) }
        : codeNodes.clientModule,

      skip = function (code,callback) { callback(null,code) }, // dummy

      // preprocessor
      preprocess = argv.preprocessor ?
        function (code,callback) {
          // https://npmjs.org/package/preprocessor
          var Preprocessor = require("preprocessor");
          callback(null,(new Preprocessor(code)).process())
        } : skip,

      // minifier
      minify = argv.compilation !== false ?
        function(code,callback) {
          // https://npmjs.org/package/closure-compiler
          var opt = '';
          if ('string' == typeof argv.compilation)
            opt = argv.compilation;
          //var opt = { compilation_level: argv.compilation_level };
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
  */

})();
