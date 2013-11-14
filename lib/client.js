var fs = require("fs");

var Exporter = exports.Exporter = function(exports) {

  exports = exports || {};

  this.base = exports.base;

  this.ctor = exports.ctor;

  this.ctorMember = exports.ctorMember || {};

  this.proto = exports.proto || {};

  this.protoPublic = exports.protoPublic || {};

  this.stat = exports.stat || {};

  this.statPublic = exports.statPublic || {};

  this.members = exports.members || {};

  this.publics = exports.publics || [];

  this.annotations = {};

};

Exporter.prototype.module = function(name,fpath,m) {
  m = m || [];

  // namespace members first
  if (this.members) {
    for (var z in this.members) {
      this.members[z].module(z,fpath,m);
    }
  }



  var annotations = {};

  // load annotations in advance
  if (fpath) {
    var lines = fs.readFileSync(fpath).toString().split('\n'),
      l = lines.length, a = null;
    for (var i = 0; i < l; i++) {
      if (a && /^\s*\*\//.test(lines[i])) { // end of annotation
        a += lines[i]+"\n";
        var b = lines[++i],
          match = b.match(/(\w+)\s*=\s*function\s*\(/) ||
          b.match(/^\s*function\s*(\w+)\s*\(/);
        if (match && true === this.annotations[match[1]]) {
          annotations[match[1]] = a;

//           console.warn("annotation for "+match[1]+": '"+b+"'");
//           console.warn(a);

        }
        a = null;
      }
      else if (a && /^\s*\*/.test(lines[i])) { // annotation continues
        a += lines[i]+"\n";
      }
      else if (!a && /^\s*\/\*\*/.test(lines[i])) { // annotation starts
        a = lines[i]+"\n";
      }


    }
  }

  function push(lval,rval,symb) {
    var a = [lval,rval,''];
    if (symb && annotations[symb])
      a[2] = annotations[symb];
    m.push(a);
  }

  if ('function' == typeof this.ctor) {
    // constructor function
    push('var '+name,String(this.ctor),name);
  }
  else if (null != this.ctor) { // object
    // namespace object
    push('var '+name,'{}',name,name);
    for (var z in this.ctorMember) {
      var v;
      if ('string' == typeof this.ctorMember[z]) {
        v = this.ctorMember[z];
      }
      else if (this.ctorMember[z]) {
        v = '{}';
      }
      push(name+'.'+z,v,z);
    }
  }

  // initialize prototype with base
  if (this.base)
    push(name+'.prototype','new '+this.base);

  // render prototype functions
  for (var f in this.proto) {
    push(name+'.prototype.'+f,String(this.ctor.prototype[f]),f);
  }

  // render static functions
  for (var f in this.stat) {
    push(name+'.'+f,String(this.stat[f]),f);
  }

  // export public prototype functions
  for (var f in this.protoPublic) {
    push(name+'.prototype["'+f+'"]',name+'.prototype.'+f);
  }

  // export public static functions
  for (var f in this.statPublic) {
    push(name+'["'+f+'"]',name+'.'+f);
  }

  // export other public symbols
  for (var f in this.publics) {
    push(name+'["'+this.publics[f]+'"]',this.publics[f]);
  }

  return m;
};

// render an array of assignments
exports.render = function(assignments) {
  return assignments.map(function(a) {
    return a[2] + a[0]+'='+a[1]+';\n\n'
  }).join('');
}





