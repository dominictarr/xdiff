
//inject a matchRef, isRef, and a getRef function?
//could use the same pattern with objects.

//I don't really want to force __id__
//should be able to use anything, aslong as you 


function shallowEqual (a, b) {
    if(isObject(a) 
      && isObject(b) 
      && (a.__id__ === b.__id__ || a === b))
      return true
    if(a && !b) return false
    return a == b
  }


function equal (a, b) {
  if(isObject(a) && isObject(b) && (a.__id__ === b.__id__ || a === b))
    return true
  if(a && !b) return false
  if(Array.isArray(a))
    if(a.length != b.length) return false

  if(a && 'object' == typeof a) {
    for(var i in a)
      if(!equal(a[i], b[i])) return false
    return true
  }
  return a == b
}

var adiff = require('adiff')({ equal: equal })

function getPath (obj, path) {
  if(!Array.isArray(path))
    return obj[path]
  for(var i in path) {
    obj = obj[path[i]]
  }
  return obj
}

function findRefs(obj, refs) {
  refs = refs || {}
  //add leaves before branches.
  //this will FAIL if there are circular references.

  for(var k in obj) {
    if(obj[k] && 'object' == typeof obj[k])
      findRefs(obj[k], refs)
  }

  if(obj.__id__ && !refs[obj.__id__])
    refs[obj.__id__] = obj
  return refs
}

function isObject (o) {
  return o && 'object' == typeof o
}

function isRef(x) {
  return x ? x.__id__ : undefined
}

function sameRef(a, b) {
  return a && b && isRef(a) === isRef(b)
}

exports.diff = function (a, b) {

  var aRefs = findRefs(a)
  var bRefs = findRefs(b)

  // how to handle references?
  // this is necessary to handle objects in arrays nicely
  // otherwise mergeing an edit and a move is ambigous.  // will need to perform a topoligical sort of the refs and diff them first, in that order.

  // first, apply changes to all refs,
  // then traverse over the root object,

  var rDelta = {}

  for(var k in aRefs) {
    if(bRefs[k]) {
      var d = _diff(aRefs[k], bRefs[k])
      if(d.length)
        rDelta[k] = d
    }
  }

  rDelta.root = _diff(a, b)

  return rDelta

  function _diff (a, b) {
    var delta = []

    function toRef(v) {
      //TODO escape strings that happen to start with #*=
      var r
      if(r = isRef(v)) return '#*='+r
      return v
    }

    if(Array.isArray(a) && Array.isArray(b)) {
      delta.push(['splice', adiff.diff(a.map(toRef), b.map(toRef))])
      return delta
    }

// references to objects with ids are
// changed into strings of thier id.
// the string is prepended with '#*='
// to distinguish it from other strings
// if you use that string in your model,
// it will break.
// TODO escape strings so this is safe

    for (var k in b) {
      if(!shallowEqual(b[k], a[k]) || !aRefs[b[k]])
        delta.push(['set', k, aRefs[isRef(b[k])] ? toRef(b[k]) : b[k]])
      else if(isObject(b[k])) 
        delta.push(['apl', k, _diff(a[k], b[k])])
    }
    
    for (var k in a)
      if('undefined' == typeof b[k])
        delta.push(['del', k])
    return delta
  }
}

exports.patch = function (a, patch) {

  var root = patch.root
  delete patch.root

  var refs = findRefs(a)
 
  function fromRef(v) {
    //TODO escape strings that happen to start with #*=
    if(/^#\*=/.test(v)) return refs[v.substring(3)]
      return v
  }

  var methods = {
    set: function (key, value) {
      this[key] = fromRef(value) // incase this was a reference, remove it.
    },
    del: function (key) {
      delete this[key]
    },
    apl: function (key, changes) {
      _patch(this[key], changes)
    },
    splice: function (changes) {
      adiff.patch(this, changes, true)
      this.forEach(function (v, k, self) {
        self[k] = fromRef(v)
      })
    },
    sref: function (key, id) {
      this[key] = refs[id] 
    }
  }


  function _patch(a, patch) {

    patch.forEach(function (args) {
      var method = args.shift()
      var obj = a 
      methods[method].apply(obj, args)
    })

    return a

  }

  for(var k in patch) {
    _patch(refs[k], patch[k])
  }

  return _patch(a, root)
 
}

exports.diff3 = function () {

}
