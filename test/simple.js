
var a = require('assertions')
var x = require('../')

function assertDiffPatch(m, n) {

  var delta = x.diff(m, n)
  console.log('-------')
  console.log('A       :', JSON.stringify(m))
  console.log('B       :', JSON.stringify(n))
  console.log('delta   :', JSON.stringify(delta))
  var patched = x.patch(m, delta)
  console.log('patched :', JSON.stringify(patched))
  a.deepEqual(patched, n)

}

assertDiffPatch({}, {a: 1})
assertDiffPatch({A: true}, {})

assertDiffPatch({
  inner: {x: true, y: 1, z: 'DELETEME'}
}, {
  inner: {x: false, y: 1}
})

assertDiffPatch({
  obj: {}
}, {
  obj: [0]
})

assertDiffPatch([1,2,3], [1, 4, 2, 3])

var b = {
  a: {__id__: '#0', value: 'whatever'},
  b: {__id__: '#1', value: 'whenever'},
  c: {__id__: '#2'}
}
b.c.parent = b.b

assertDiffPatch({
  a: {__id__: '#0'},
  b: {__id__: '#1'},
  c: {__id__: '#2'}
}, b)


assertDiffPatch([
  {__id__: '#0'},
  {__id__: '#1'},
  {__id__: '#2'}
], [
  {__id__: '#1'},
  {__id__: '#2'},
  {__id__: '#0'}
])


assertDiffPatch({
  b:'x',
  a: {__id__: 'AoA'}
},{
  a: {__id__: 'aaa'},
  b:'x'
})
/*
FOUND A BUG.
should not ever change the __id__,
so a 'set' transaction is not necessary.

if it has set a ref, then it can just use a reference.
need tight tests.

["UPDATE","hello","master",[{"parent":"66e6dd2fd229c1d53a4cbeb5e99b459ed1b38c35","changes":[["splice",["root","hi"],[[1,1]]]],"depth":5,"timestamp":1334883165695,"id":"6b5466a6d714b49f8ed702d1136da8f8e8927308"}]]

["UPDATE","hello","master",[{"parent":"6b5466a6d714b49f8ed702d1136da8f8e8927308","changes":[["set",["753"],{"__id__":"753"}],["set",["root","thing"],{"__id__":"753"}]],"depth":6,"timestamp":1334883206145,"id":"52d74bfe14fc2bb3ec9cf9fed8f5f006a54abc32"}]]
*/
