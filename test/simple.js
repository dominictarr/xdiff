
var a = require('assertions')
var x = require('../')

function assertDiffPatch(m, n) {

  var delta = x.diff(m, n)
  console.log('-------')
  console.log('orig    :', JSON.stringify(m))
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


