
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

  aRefs.root = a
  bRefs.root = b

  // how to handle references?
  // this is necessary to handle objects in arrays nicely
  // otherwise mergeing an edit and a move is ambigous.  // will need to perform a topoligical sort of the refs and diff them first, in that order.

  // first, apply changes to all refs,
  // then traverse over the root object,

/*  var rDelta = {}

  for(var k in aRefs) {
    if(bRefs[k]) {
      var d = _diff(aRefs[k], bRefs[k])
      if(d.length)
        rDelta[k] = d
    }
  }

  rDelta.root = _diff(a, b)

  return rDelta
*/

  var delta = []
  _diff(aRefs, bRefs, [])
  return delta
  function _diff (a, b, path) {
    path = path || []

    function toRef(v) {
      //TODO escape strings that happen to start with #*=
      var r
      if(r = isRef(v)) return '#*='+r
      return v
    }

    if(Array.isArray(a) && Array.isArray(b)) {
      delta.push(['splice', path, adiff.diff(a.map(toRef), b.map(toRef))])
      return delta
    }

// references to objects with ids are
// changed into strings of thier id.
// the string is prepended with '#*='
// to distinguish it from other strings
// if you use that string in your model,
// it will break.
// TODO escape strings so this is safe

   //ah, treat root like it's a __id__

   var isRoot = !path.length

    for (var k in b) {
      if(!shallowEqual(b[k], a[k]) || !aRefs[b[k]] && !isRoot)
        delta.push(['set', path.concat(k), aRefs[isRef(b[k])] ? toRef(b[k]) : b[k]])
      else if(isObject(b[k])) 
        _diff(a[k], b[k], path.concat(k))
//       delta.push(['apl', path.concat(k), _diff(a[k], b[k])])  
    }
    
    for (var k in a)
      if('undefined' == typeof b[k])
        delta.push(['del', path.concat(k)])
  }
}

exports.patch = function (a, patch) {

//  var root = patch.root
//  delete patch.root

  var refs = findRefs(a)
  refs.root = a
 
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

/*
  function _patch(a, patch) {

    patch.forEach(function (args) {
      var method = args.shift()
      var obj = a 
      methods[method].apply(obj, args)
    })

    return a

  }
*/
/*  for(var k in patch) {
    _patch(refs[k], patch[k])
  }

  return _patch(a, root)
 */
  function pathTo(a, p) {
    console.log(a , p)
    //while (p.length)
    //  a = a[p.shift()]
    //return a
      


    for (var i in p) {
      a = a[p[i]]
    }
    return a
  }

  patch.forEach(function (args) {
    var method = args.shift()
    var path = args.shift()
    var key
    if(method != 'splice') {
      key = path.pop()
      args.unshift(key)
    }
    console.log(method, path, obj, args)
    var obj = pathTo(refs, path)
    methods[method].apply(obj, args)
  })

  return refs.root
}

exports.diff3 = function () {

}
