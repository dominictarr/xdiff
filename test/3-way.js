var x = require('..')
var assert = require('assert')

var log = console.log
var str = JSON.stringify
function assert3way(opts) {
  log('-------------')
  log('mine   :', str(opts.mine))
  log('old    :', str(opts.old))
  log('yours  :', str(opts.yours))
  var diff = x.diff3(opts.mine, opts.old, opts.yours)
  log('diff   :', str(diff))
  var merged = x.patch(opts.old, diff)
  log('merged :', str(opts.merged))
  assert.deepEqual(merged, opts.merged)

}

//non conflicting
//a simple merge

assert3way({
  mine   : { a: 3 }
, old    : {}
, yours  : { b: 4 }
, merged : { a: 3, b: 4 }
})


assert3way({
  mine   : { a: 3, x: 2 }
, old    : { x: 4 }
, yours  : { b: 4, x: 2 }
, merged : { a: 3, b: 4, x: 2 }
})

//clean merge

assert3way({
  mine   : [1, 2, 3, 4]
, old    : [1, 2, 3]
, yours  : [0, 1, 2, 3]
, merged : [0, 1, 2, 3, 4]
})


//clean merge

assert3way({
  mine   : [0, 1, 2, 3]
, old    : [1, 2, 3]
, yours  : [1, 2, 3, 4]
, merged : [0, 1, 2, 3, 4]
})

// looks like a conflict, but not.

assert3way({
  mine   : [1, 2, 4, 3]
, old    : [1, 2, 3]
, yours  : [1, 3]
, merged : [1, 4, 3]
})

assert3way({
  mine   : {a: {b: 1}}
, old    : {a: {}}
, yours  : {a: true}
, merged : {a: {b: 1}}
})

assert3way({
  mine   : {a: {c: 3}}
, old    : {a: {a: 2}}
, yours  : {a: {b: 1, a: 2}}
, merged : {a: {c: 3, b: 1}}
})
