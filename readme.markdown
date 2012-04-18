# xdiff

`diff` and `patch` (nearly) arbitary json documents.

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

## todo

  * diff3 -- will enable this to be used with snob.
