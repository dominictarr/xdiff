# xdiff

`diff`, `diff3`, `patch` (nearly) arbitary json documents.

## examples

``` js
var x = require('xdiff')

var a = SOMEOBJECT
var b = SOMEOBJECT_AFTER_CHANGES

var diff = x.diff(a, b)

// can apply a diff to A to get B

var patched = x.patch(a, diff)

require('assert').deepEqual(a, patched)

```

## diff, patch, diff3

with `diff` you can create a diff that is applyable with `patch`
you can diff nested objects, and arrays.

with `diff3` you create a diff from two objects that have been edited concurrently, 
you need to also to pass the [concestor](http://en.wikipedia.org/wiki/Concestor).

also see [adiff](https://github.com/dominictarr/adiff] which xdiff depends on to diff arrays.

xdiff is compatible with [snob](https://github.com/dominictarr/snob)

### Objects

``` js
var a = {a: true, c: 'deleteme'}
var b = {a: true, b: false}
var p = x.diff(a, b)
```

will create a diff like this:

``` js
[ ['set', ['root', 'b'], false]
, ['del', ['root', 'c']] ]
```

operations on nested objects are represented by thier path, 
unless the object has an ID. (see below)

``` js
var a0 = {A: {AA: '?'}}
var a1 = {A: {AA: 'aardvark'}}
var p = x.diff(a, b)
```

will create diff like this:

``` js
 [['set', ['root', 'A', 'AA'], 'aardvark']]
```

## Arrays

``` js
var a = [1, 2 , 3]
var b = [0, 1, 'hello', 3]
var p = x.diff(a, b)
```

will create a diff like

``` js

[ 'splice', ['root'], [
    [ 1, 1, 'hello] //at index 1 delete one item and insert hello
  , [ 0, 0, 0]      //at index 0 delete 0 items and insert `0`
]
```

## Objects in Arrays

if you give objects an ID, then xdiff will beable to track it properly, even if it's moved.
even if it's concurrently changed.

``` js
var a = [{__id__: '#1'}, 5, {__id__: '#2'}]
var b = [5, {__id__: '#2'}, {__id__: '#1', prop: 'surprise'}]
var p = x.diff(a, b)
```

will produce a diff like this

``` js
  [ ['set', ['#1', 'prop'], 'surprise'] //this applies the change to object #1
  , ['splice', ['root'], [ 
      [ 3, 0, '#=*#1'] //this just updates the reference!
    , [ 0, 1]
    ] ]
  ]

```
if you don't don't use id's `xdiff` won't know that an object that has changed
is actually the same object. this would cause it to reinsert a new copy of that object.

id's are this is really useful when you need to do 3-way-merges to merge together concurrent changes.

in a future version, xdiff will allow changing the id key. currently it uses only the `__id__` property.

## 3-way-merge: diff3

three way merge takes 3 objects, `mine`, `yours` and an `old` object, which must be the [concestor](http://en.wikipedia.org/wiki/Concestor) of both mine and yours.

if there are concurrent changes, xdiff will choose to use the change from `mine`

in a future version, xdiff will support injectable resolve function, so that you can choose how to rosolve the merge.

## licence

MIT / Apache2
