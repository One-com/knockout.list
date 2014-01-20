## knockout.list

[![Build Status](https://travis-ci.org/sunesimonsen/knockout.list.png?branch=master)](https://travis-ci.org/sunesimonsen/knockout.list)

A list binding capable of scroll through many thousands of items by only loading data for the viewport.

Note this project is no where near finished, so please check back later.

[Click here to see an example](http://sunesimonsen.github.com/knockout.list/examples/index.html)

This binding uses the native scrolling of the browser by creating a
stretcher element the strech the list to show a scrollbar large enough
to scroll through all elements in the list. This means that the
maximum number of items that the list can contain is limited by the
maximum height of an element the different browsers allow.

Maximum element height in different browsers:

* Chrome: 33555000px
* IE 9/10: 1534000px
* Firefox: 8949000px

### Contributors

* Maarten Winter (@mwoc)
