var
  PatternRule = require("../rules/patternrule"),
  WordListRule = require("../rules/wordlistrule"),
  NewLineRule = require("../rules/newlinerule");
  
exports.rules = function() {

  return [

    (new codeNodes.NewLineRule).init(),
    
    (new codeNodes.PatternRule).init({
      "class": "cmnt",
      "pattern": /#.*/,
      "scope": {
        "main": 100
      }
    })


  ];

};
