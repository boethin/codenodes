var codeNodes = require('codenodes');

// var codeNodes = {
//   PatternRule: require("../rules/PatternRule"),
//   StringRule: require("../rules/StringRule"),
//   BlockCommentRule: require("../rules/BlockCommentRule")
// };

exports.rules = function() {

  return [

    // XML comments
    (new codeNodes.Rules.BlockCommentRule).init({
      "class": "comment",
      "begin": "<!--",
      "end": "-->",
      "scope": {
        "main": 1000
      }
    }),

    // XML header, e.g.: <?xml version="1.0" encoding="utf-8"?>
    (new codeNodes.Rules.PatternRule).init({
      "class": "header",
      "pattern": /<\?xml\s+([^>]*)\?>/,
      "scope": {
        "main": 200
      }
    }),

    // http://www.w3schools.com/xml/xml_elements.asp
    (new codeNodes.Rules.PatternRule).init({
      "class": "element",
      "pattern": /<([^\s<>]+)([^>]*)>/,
      "scope": {
        "main": 100
      },
      "yield": function(match,callback) {
        callback("XML","ATTRS",match[2],'<'+match[1],'>')
      }
    }),

    // -- element attributes --

    // http://www.w3.org/TR/2000/REC-xml-20001006#NT-Name (but ASCII only)
    (new codeNodes.Rules.PatternRule).init({
      "class": "attr-name",
      "pattern": /\b([a-z_:][-a-z0-9_:.]*)\b/,
      "scope": {
        "ATTRS": 20
      }
    }),

    // attribute value w/ double-quote delimiter
    (new codeNodes.Rules.PatternRule).init({
      "class": "attr-value",
      "pattern": /"[^"]*"/,
      "lookBehind": /=\s*/,
      "scope": {
        "ATTRS": 10
      }
    }),

    // attribute value w/ single-quote delimiter
    (new codeNodes.Rules.PatternRule).init({
      "class": "attr-value",
      "pattern": /'[^']*'/,
      "lookBehind": /=\s*/,
      "scope": {
        "ATTRS": 9
      }
    })

  ];

};
