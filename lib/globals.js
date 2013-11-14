

var isNonEmptyString = exports.isNonEmptyString = function(s) {
  return (('string' === typeof s) && (s.length > 0));
}

var quotemeta = exports.quotemeta = function(s) {
  return s.replace(/([\.\\\+\*\?\[\^\]\$\(\)])/g,'\\$1');
};

var defineGet = exports.defineGet = function(obj,name,def) {
  Object.defineProperty(obj,name,{"get":def});
};


// server-public
var ceateClientModule = exports.ceateClientModule = function(m) {

  //var m = [];
  m = m || [];

  // members first
  if (this.member) {
    for (var z in this.member) {
      ceateClientModule.call(this.member[z],m);
    }
  }
  
  if ('function' == typeof this.ctor) {
    m.push(['var '+this.name,String(this.ctor)]);
  }
  else if (null != this.ctor) { // object
    m.push(['var '+this.name,'{}']);
    for (var z in this.ctorMember) {
      var v;
      if ('string' == typeof this.ctorMember[z]) {
        v = this.ctorMember[z];
      }
      else if (this.ctorMember[z] instanceof Array) {
        v = '[]';
      }
      else if (this.ctorMember[z]) {
        v = '{';
        for (var w in this.ctorMember[z]) {

        }
        v += '}';
      }

//       v = ('string' == typeof this.ctorMember[z]) ? this.ctorMember[z]
//         : (this.ctor.hasOwnProperty('length') ? '[]' : '{}');
      m.push([this.name+'.'+z,v]);
    }
  }

  if (this.base)
    m.push([this.name+'.prototype','new '+this.base]);

  for (var f in this.proto) {
    m.push([this.name+'.prototype.'+f,String(this.ctor.prototype[f])]);
  }

  for (var f in this.stat) {
    m.push([this.name+'.'+f,String(this.stat[f])]);
  }

  for (var f in this.protoPublic) {
    m.push([this.name+'.prototype["'+f+'"]',this.name+'.prototype.'+f]);
  }

  for (var f in this.statPublic) {
    m.push([this.name+'["'+f+'"]',this.name+'.'+f]);
  }

  for (var f in this.publics) {
    m.push([this.name+'["'+this.publics[f]+'"]',this.publics[f]]);
  }

  return m;
};

// array debugging
Array.prototype.toString = function() {
  var a = [];
  for (var i=0; i < this.length; i++) {
    a.push('('+(typeof this[i])+')'+(null != this[i] ? '"'+this[i]+'"' : 'null'));
  }
  return '#'+this.length+'['+a.join(',')+']';
};


// Get the number of captures of a RegExp.
RegExp.prototype.captures = function() {
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

exports.clientModule = function() {
  return [
    ['RegExp.prototype.captures',String(RegExp.prototype.captures)],
    ['var globals','{}'],
    ['globals.isNonEmptyString',String(isNonEmptyString)],
    ['globals.quotemeta',String(quotemeta)],
    ['globals.defineGet',String(defineGet)]
  ];
};

