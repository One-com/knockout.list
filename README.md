## knockout.list

[![Build Status](https://travis-ci.org/sunesimonsen/knockout.list.png?branch=master)](https://travis-ci.org/sunesimonsen/knockout.list)

A list binding capable of scrolling through up to 500 thousand items, by only loading data for the viewport.

Note: This project is still in an early stage, so please use at own discretion.

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

### `dividers` \<observable\> or `data.dividers` \<observable\>

An observable containing an object. The object keys specify before which `data` index a particular divider should be placed, the values which text to show in the divider.

### `visibleDivider` \<observable\>

An observable pointing to the object key in `dividers` of which divider should be visible. When updating this observable's value, knockout.list will try to scroll the requested index into view.

Requires `dividers` option to be set.

### `grid` \<boolean\>

When false (default), tiles are placed below each other. All tiles are assumed to have equal height.

When true, knockout.list tries to position multiple tiles side-by-side. All tiles are assumed to have equal height and width.

[Click here to see an example](http://sunesimonsen.github.com/knockout.list/examples/grid.html)

### `scrollable` \<string\>

By default, knockout.list assumes that the element it is bound to, is scrollable.

If scrolling should take place in a parent of the bound element, this should be done by providing a valid CSS selector here.

[Click here to see an example](http://sunesimonsen.github.com/knockout.list/examples/scrollable.html)

## Browser support

This binding uses native scrolling of the browser, by creating a stretcher element which stretches the list, to show a scrollbar large enough to scroll to any element in the list.

This means that the maximum number of items the list can contain is limited by the maximum height of an element the different browsers allow.

Maximum element height in different browsers:

* Chrome: 33555000px
* IE 9/10: 1534000px
* Firefox: 8949000px

## Contributors

* Maarten Winter (@mwoc)

## License

```
Copyright 2012 Sune Simonsen
https://github.com/sunesimonsen/knockout.list

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
