var x = require('../')
var assert = require('assert')
var log = console.log

function assertDeref(a, e, mutate) {
  log('----------', mutate ? 'mutate' : 'non-mutate')
  log('before :', a)
  var deref = x.deref(a, mutate)
  log('deref  :', deref)
  assert.deepEqual(deref, e)
  var reref = x.reref(deref, mutate)
  log('reref  :', reref)
  assert.deepEqual(reref, a)

  if(!mutate)
    assertDeref(a, e, true)
}

function asRef (v) {
  return '#*=' + v
}

assertDeref(
  {a: true},
  {root: {a:true}}
)
var dvorak = {__id__: 'dvorak'}

assertDeref(
  [dvorak],
  { 'dvorak': dvorak
  , root: [asRef('dvorak') ]}
)
var querty = {__id__: 'querty'}
assertDeref(
  {types: [dvorak, querty], __id__: 'layouts'},
  { 'dvorak': dvorak
  , 'querty': querty
  , 'layouts': {types: [asRef('dvorak'), asRef('querty')], __id__: 'layouts'} 
  , root: asRef('layouts')}
)

//NOTE: REFERENCES ARE SUPPORTED, BUT NOT CIRCULAR REFERENCES.

