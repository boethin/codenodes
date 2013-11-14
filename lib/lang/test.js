var codeNodes = require('codenodes');

exports.rules = //(function(codeNodes) {
//  return

  function(){

  return [

//     (new codeNodes.NewLineRule).init({
//       "class": "lbrk",
//       "scope": {
//         "main": 0
//       }
//     }),

    (new codeNodes.Rules.BlockCommentRule).init({
      "class": "cmnt",
      "begin": "<!--",
      "end": "-->",
      "scope": {
        "main": 1000
      }
    }),

    (new codeNodes.Rules.PatternRule).init({
      "class": "cmnt",
      "pattern": /#.*/,
      "scope": {
        "main": 100
      }
    }),

    (new codeNodes.Rules.PatternRule).init({
      "class": "str",
      "pattern": /'(?:\\'|[^'])*'/,
      "scope": {
        "main": 8,
        "BLOCK": 8
      }
    }),

    (new codeNodes.Rules.PatternRule).init({
      "class": "istr",
      "pattern": /"((?:\\"|[^"])*)"/,
      "scope": {
        "main": 8,
        "BLOCK": 8
      },
      "yield": function(match,callback) {
        callback("test","ISTR",match[1],'"','"')
      }
    }),

    (new codeNodes.Rules.PatternRule).init({
      "class": "block",
      "pattern": /\{(.*)\}/,
      "scope": {
        "main": 6,
        "ISTR": 2
      },
      "yield": function(match,callback) {
        callback("test","BLOCK",match[1],'{','}')
      }
    }),

    (new codeNodes.Rules.PatternRule).init({
      "class": "var",
      "pattern": /\$(\w+)/,
      "scope": {
        "main": 8,
        "BLOCK": 8,
        "ISTR": 1
      }
    }),

    (new codeNodes.Rules.KeywordRule).init({
      "class": "keyword",
      "words": ['Foo','Bar'],
      "scope": {
        "main": 2
      }
    })

    // Quote-like Operators
    // http://perldoc.perl.org/perlop.html#Quote-and-Quote-like-Operators
//     (new codeNodes.PatternRule).init({
//       "class": "qstr",
//       "pattern": /\bq(?:([\(\[\{\<])|([\|\#\@\$\/\\]))/,
//       "handler": function(scope,input,re,match,pos,callback) {
//
//         var node,txt = match[0], pre = input.substr(0,pos),
//           rem = input.substr(txt.length+pos);
//
//         if (match[1]) { // '(', '[', '{', '<'
//           var opL = match[2], opR = String.fromCharCode(match[2].charCodeAt(0)+1);
//
//           var s = input.substr(pos+1);
//
//
//           console.log("## acceptMatch: '"+input+"' ("+pos+"): '"+match[1]+"'; check='"+s+"'");
//
//         }
//         else if (match[2]) { // other
//           if (match[2] == '\\') { // backslash operator
//             var p; // simply look up the next backslash
//             if (0 < (p = input.indexOf('\\',pos+2))) {
//               rem = input.substr(pos+p);
//
//               var t = input.substr(pos,p);
//               console.log("## acceptMatch: '"+input+
//                 "' ("+pos+"): '"+match[2]+"'; result='"+t+"'; rem='"+rem+"'");
//
//               callback(pre,rem,[{
//                 "match": "Foo",
//                 "class": "c"
//               },'Y']);
//
//             }
//           }
//           else { // other unbalanced
//
//             //var p = '(?:\\)';
//
//           }
//         }
//
//
//
//       },
//       "scope": {
//         "main": 6
//       }
//     })

  ]

  };

// })({
//   PatternRule: require("../rules/PatternRule"),
//   KeywordRule: require("../rules/KeywordRule"),
//   //NewLineRule: require("../rules/newlinerule"),
//   BlockCommentRule: require("../rules/BlockCommentRule")
// });



