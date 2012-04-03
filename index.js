
var adiff = require('adiff')

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

    if(Array.isArray(a) && Array.isArray(b)) {
      delta.push(['splice', adiff.diff(a, b)])
      return delta
    }

//    if(isObject(a) && isObject(b) && a.__id__ && b.__id__ && a.__id__ === b.__id__)
//      return []

    for (var k in b) {
   
      if(isObject(b[k]) && isObject(a[k])) { 
        if(b[k].__id__ && b[k].__id__ === a[k].__id__)
          ;
        else if(b[k].__id__ && b[k].__id__ !== a[k].__id__)
          delta.push(['sref', k, b[k].__id__])
        else
          delta.push(['apl', k, _diff(a[k], b[k])])
      } else if(isObject(b[k]) && b[k].__id__) {
        if(!a[k] || b[k].__id__ !== a[k].__id__)
          delta.push(['sref', k, b[k].__id__])
      } else if(b[k] !== a[k]) {
        delta.push(['set', k, b[k]])
      }
    }
    
    for (var k in a) {
      if('undefined' == typeof b[k])
        delta.push(['del', k])
    }

    return delta
  }
}

exports.patch = function (a, patch) {

  var root = patch.root
  console.log('ROOT', root)
  delete patch.root

  var refs = findRefs(a)
  var methods = {
    set: function (key, value) {
      this[key] = value
    },
    del: function (key) {
      delete this[key]
    },
    apl: function (key, changes) {
      _patch(this[key], changes)
    },
    splice: function (changes) {
      adiff.patch(this, changes, true)
    },
    sref: function (key, id) {
      this[key] = refs[id] 
    }
  }


  function _patch(a, patch) {

    patch.forEach(function (args) {
    console.log('ARGS', args)
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
