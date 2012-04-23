//while simple.js just tests that the diff -> is consistant 
// this tests that they are correct.
const 
    SET = 'set'
  , SPL = 'splice'
  , DEL = 'del'
  , ROOT = 'root'

function asRef(id) {
  return '#*='+id
}

var x = require('../')
var assert = require('assert')
var log = console.log
var str = JSON.stringify
var t = 0
function cpy (o) {
  return JSON.parse(JSON.stringify(o))
}
function assertDiff(a, b, d) {
  log('------------------')
  log('Before :', str(a))
  log('After  :', str(b))
  var diff = x.diff(a, b)
  log('Delta  :', str(diff))
  assert.deepEqual(diff, d)  
  log('ok', ++ t)
  if(!diff)
    assert.equal(diff, d)
  else {
    var patched = x.patch(cpy(a), diff)
    assert.deepEqual(patched, b)
  }
}

assertDiff(
  {},
  {a: true},
  [ [SET, [ROOT, 'a'], true] ]
)

assertDiff(
  {a : true},
  {a: [1, 2, 3]},
  [ [SET, [ROOT, 'a'], [1, 2, 3] ] ]
)

assertDiff(
  {a: [1, 2, 'INSERT', 3]},
  {a: [1, 3]},
  [ [SPL, [ROOT, 'a'], [[1, 2]] ] ]
)


assertDiff(
  {a: [1, 2, 'INSERT', 3]},
  {a: [1, 2, 'INSERT', 3], thing: {__id__: 123}},
  [ [SET, ['123'], {__id__: 123}]
  , [SET, [ROOT, 'thing'], asRef(123) ]
  ]
)
var thing = {__id__: '123'}
var _thing = cpy(thing)
assertDiff(
  {a: [1, 2, 'INSERT', 3], thing: thing},
  {a: [1, 2, 'INSERT', 3], thing: thing, other: thing },
  [ [SET, [ROOT, 'other'], asRef(123) ]
  ]
)

//here we need to traverse the object, and update any references.
// that means we will also have to traverse the object
// when we apply the diff.
// actually, we're already kinda doing this for the array.
// oh, things might really simplify if I just traverse
// the whole object, and replace the refs, then diff those.

assertDiff(
  {hello: thing},
  {hello: [thing]},
  [ [SET, [ROOT, 'hello'], [asRef('123')]]]
)

/*
  I had `a == b` at the end of equal()
  and equal(['X'], 'X') was evaluating to true
  and that was confusing adiff, which went into a infinite loop 
*/

assertDiff(
  {hello: [thing, 0]},
  {hello: [[ thing], 0]},
  [ [SPL, [ROOT, 'hello'], [[0, 1, [asRef('123')]]]]]
)

assertDiff(
  {hello: thing},
  {hello: [null]},
  [ [SET, [ROOT, 'hello'], [null]], [DEL, ['123'] ] ]
)

assertDiff(
  {hello: [thing]},
  {hello: [null]},
  [ [SPL, [ROOT, 'hello'], [[0, 1 , null]]], [DEL, ['123'] ] ]
)

assertDiff(
  {hello: thing, },
  {hello: [null]},
  [ [SET, [ROOT, 'hello'], [null]], [DEL, ['123'] ] ]
)

/*
  null and undefined should be compared with == because JSON.parse(JSON.stringify(undefined)) === null

*/

assertDiff(
  [null],
  [undefined],
  undefined 
)

log('passed')


