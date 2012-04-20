
//inject a matchRef, isRef, and a getRef function?
//could use the same pattern with objects.

//I don't really want to force __id__
//should be able to use anything, aslong as you 


function shallowEqual (a, b) {
    if(isObject(a) 
      && isObject(b) 
      && (a.__id__ == b.__id__ || a === b))
      return true
    if(a && !b) return false
    return a == b
  }


function equal (a, b) {
  if(isObject(a) && isObject(b) && (a.__id__ == b.__id__ || a === b))
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

  if(!obj)
    return refs

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
  return a && b && isRef(a) == isRef(b)
}

exports.diff = function (a, b) {

  var aRefs = findRefs(a)
  var bRefs = findRefs(b)

  var seen = []

  for (var k in aRefs)
    seen.push(k)

  aRefs.root = a
  bRefs.root = b

  function toRef(v) {
    //TODO escape strings that happen to start with #*=
    var r
    if(r = isRef(v)) return '#*='+r
    return v
  }

 function isSeen(o) {
    if(isRef(o)) return ~seen.indexOf(o.__id__)
    return true 
  }
  function addSeen(o) {
    if(!isRef(o)) return o
    if(!isSeen(o)) seen.push(o.__id__)
    return o
  }

  // how to handle references?
  // this is necessary to handle objects in arrays nicely
  // otherwise mergeing an edit and a move is ambigous.  // will need to perform a topoligical sort of the refs and diff them first, in that order.
  // first, apply changes to all refs,
  // then traverse over the root object,

  function _diff (a, b, path) {
    path = path || []

    if(Array.isArray(a) && Array.isArray(b)) {
      var d = adiff.diff(a.map(toRef), b.map(toRef))
      if(d.length)
        delta.push(['splice', path, d])
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
      // if both are nonRef objects, or are the same object, branch into them.
      if(isObject(a[k]) && isObject(b[k]) && sameRef(b[k], a[k])){ 
        _diff(a[k], b[k], path.concat(k))
}      else if(!shallowEqual(b[k], a[k]) || (!isSeen(b[k]) && !isRoot)) {

        delta.push(['set', path.concat(k), 
          isSeen(b[k]) ? toRef(b[k]) : addSeen(cpy(b[k]))
        ])
        // a new reference is created straight away.
        // need to remember this has happened so can insert it later.
      }
    }
    
    for (var k in a)
      if('undefined' == typeof b[k])
        delta.push(['del', path.concat(k)])
  }

  var delta = []
  _diff(aRefs, bRefs, [])

  if(delta.length)
    return delta

}

exports.patch = function (a, patch) {

  if(!patch) throw new Error('expected patch')

  a = cpy(a)
  var refs = findRefs(a)
  refs.root = a
 
  function fromRef(v) {
    //TODO escape strings that happen to start with #*=
    if(/^#\*=/.test(v)) return refs[v.substring(3)]
      return cpy(v)
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

  function pathTo(a, p) {
    for (var i in p) a = a[p[i]]
    return a
  }

  patch.forEach(function (args) {
    args = args.slice()
    var method = args.shift()
    var path = args.shift().slice()
    var key
    if(method != 'splice') {
      key = path.pop()
      args.unshift(key)
    }
    var obj = pathTo(refs, path)
    methods[method].apply(obj, args)
  })

  return refs.root
}

function cpy(o) {
  return JSON.parse(JSON.stringify(o))
}

exports.diff3 = function (a, o, b) {
  if(arguments.length == 1)
    o = a[1], b = a[2], a = a[0]
  var _a = exports.diff(o, a)
    , _b = exports.diff(o, b) 

  //then merge them.
  //for each change in a, see if there is a conflicting change in b

  //i.e. a set or delete on the prefix to a path.
  //sort the changes by path, and then method...

  var p = []

  function add(_p) {p.push(_p)}

  _a.forEach(add)
  _b.forEach(add)

  // for each change in _a

  function cmp (a, b) {
    //check if a[1] > b[1]
    if(!b)
      return 1

    var p = a[1], q = b[1]
    var i = 0
    while (p[i] === q[i] && p[i] != null)
      i++

    if(p[i] === q[i]) return 0
    return p[i] < q[i] ? -1 : 1
  }

  function isPrefix(a, b) {
    if(!b) return 1
    var p = a[1], q = b[1]
    var i = 0
    while (p[i] === q[i] && i < p.length && i < q.length)
      i++
    if(i == p.length || i == q.length) return 0
    return p[i] < q[i] ? -1 : 1 
  }

  //merge two lists, which must be sorted.

  function cmpSp (a, b) {
    if(a[0] == b[0])
      return 0
    function max(k) {
      return k[0] + (k[1] >= 1 ? k[1] - 1 : 0)
    }
    if(max(a) < b[0] || max(b) < a[0])
      return a[0] - b[0]
    return 0
  }

  function resolveAry(a, b) {
    return a
  }

  function resolve(a, b) {
    if(a[1].length == b[1].length) { 
      if(a[0] == b[0]) {
        if(a[0] == 'splice') {
          var R = merge(a[2], b[2], cmpSp, resolveAry)
          return ['splice', a[1].slice(), R]
        } else if(equal(a[2], b[2])) //same change both sides.
          return a
      }
    }
    return a
  }

  function merge(a, b, cmp, resolve) {
    var i = a.length - 1, j = b.length - 1, r = []
    while(~i && ~j) {
      var c = cmp(a[i], b[j])
      if(c > 0) r.push(a[i--])
      if(c < 0) r.push(b[j--])
      if(!c) {
        var R = resolve(a[i], b[j])
          j--, i--
        r.push(R)
      }
    }
    //finish off the list if there are any left over
    while(~i) r.push(a[i--])
    while(~j) r.push(b[j--])
    return r
  }

  _a.sort(cmp)
  _b.sort(cmp)

  return merge(_a, _b, isPrefix, resolve)
}
