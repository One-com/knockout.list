## knockout.list

[![Build Status](https://travis-ci.org/sunesimonsen/knockout.list.png?branch=master)](https://travis-ci.org/sunesimonsen/knockout.list)

A list binding capable of scroll through many thousands of items by only loading data for the viewport.

Note this project is no where near finished, so please check back later.

[Click here to see an example](http://sunesimonsen.github.com/knockout.list/examples/index.html)

## Usage

    data-bind="list: <observableArray>"

    data-bind="list: {data: <observableArray>}"

    data-bind="list: {data: <observableArray>, visibleIndex: <observable>, dividers: <observable>, visibleDivider: <observable>, grid: <boolean>, scrollable: <string>}"


## Options

### `data` \<observableArray\>

A required observable array that contains all items available to the list binding.

### `visibleIndex` \<observable\>

An observable pointing to the index in `data` which should be visible. When updating this observable's value, knockout.list will try to scroll the requested index into view.

### `dividers` \<observable\>

An observable containing an object. The object keys specify before which `data` index a particular divider should be placed, the values which text to show in the divider.

### `visibleDivider` \<observable\>

An observable pointing to the object key in `dividers` of which divider should be visible. When updating this observable's value, knockout.list will try to scroll the requested index into view.

Requires `dividers` option to be set.

### `grid` \<boolean\>

When false (default), tiles are placed below each other. All tiles are assumed to have equal height.

When true, knockout.list tries to position multiple tiles side-by-side. All tiles are assumed to have equal height and width.

### `scrollable` \<string\>

By default, knockout.list assumes that the element it is bound to, is scrollable.

If scrolling should take place in a parent of the bound element, this should be done by providing a valid CSS selector here.

## Browser support

This binding uses the native scrolling of the browser by creating a
stretcher element the strech the list to show a scrollbar large enough
to scroll through all elements in the list. This means that the
maximum number of items that the list can contain is limited by the
maximum height of an element the different browsers allow.

Maximum element height in different browsers:

* Chrome: 33555000px
* IE 9/10: 1534000px
* Firefox: 8949000px

## Contributors

* Maarten Winter (@mwoc)
