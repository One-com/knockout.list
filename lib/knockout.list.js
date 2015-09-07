/*global ko, $*/
// Copyright 2012 Sune Simonsen
// https://github.com/One-com/knockout.list
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory(require('knockout'));
    } else if (typeof define === 'function' && define.amd) {
        define(['knockout'], factory);
    } else {
        factory(ko);
    }
}(this, function (ko) {
    function SequentialIdGenerator() {
        this.currentId = 0;
    }

    SequentialIdGenerator.prototype.nextId = function () {
        this.currentId += 1;
        return this.currentId;
    };

    function createDataSourceFromObservableArray(items) {
        return {
            onUpdate: function (callback) {
                this.callback = callback;
            },
            notify: function () {
                this.callback();
            },
            get: function (index, callback) {
                callback(items()[index], index);
            },
            length: function () {
                return items().length;
            }
        };
    }

    function extractConfiguration(bindingValue) {
        var configuration = {
            grid: false,
            scrollable: false
        };

        if (bindingValue.onUpdate || ko.isObservable(bindingValue)) {
            // Datasource
            bindingValue = {
                data: bindingValue
            };
        }

        if (!bindingValue.data) {
            // TODO throw
        }

        return ko.utils.extend(configuration, bindingValue);
    }

    ko.bindingHandlers.list = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            if (ko.utils.domData.get(element, 'knockout-list')) {
                // Initialized
                return;
            }
            ko.utils.domData.set(element, 'knockout-list', true);

            var bindingValue = valueAccessor();

            var configuration = extractConfiguration(bindingValue);
            var dataSource = configuration.data;
            var subscriptions = [];
            var updateDataSourceAtOnce = false;

            if (ko.isObservable(configuration.data)) {
                var items = configuration.data;
                dataSource = configuration.data = createDataSourceFromObservableArray(items);

                updateDataSourceAtOnce = true;
                subscriptions.push(items.subscribe(function () {
                    dataSource.notify();
                }));
            }

            if (ko.isObservable(configuration.dividers)) {
                subscriptions.push(configuration.dividers.subscribe(function () {
                    dataSource.notify();
                }));
            }

            var templateNodes = element.nodeType === 1 ? element.childNodes : ko.virtualElements.childNodes(element);
            var container = ko.utils.moveCleanedNodesToContainerElement(templateNodes);
            new ko.templateSources.anonymousTemplate(element).nodes(container);

            var $element = $(element);
            var $scrollElement = $element;

            if (configuration.scrollable) {
                var possibleScrollElements = $element.parents(configuration.scrollable);
                if (!possibleScrollElements.length) {
                    throw new Error('Bound element does not have a parent matching the CSS selector `' + configuration.scrollable + '`');
                } else {
                    $scrollElement = possibleScrollElements.first();
                }
            }

            $element.addClass(configuration.grid ? 'knockout-list-grid' : 'knockout-list');
            var stretcher = $('<div class="stretcher">').appendTo(element);
            var tileHeight = null;
            var tileWidth = null;
            var tilesSideBySide = 1;
            var tileCache = {};
            var dividerHeight = 0;
            var dividerCache = {};
            var dividerIndexes = [];
            var indexRange = {};
            var indexOffsetAfterDividerIndex = [];
            var viewportIndexes = null;
            var neverEvictTiles = false;
            var evictionTreshold = 100;
            var elementOffsetTop = 0;
            var elementOffsetLeft = 0;
            var isInitialRender = true;


            var calculateViewIndex;
            if (configuration.grid) {
                calculateViewIndex = function (index) {
                    index = parseInt(index, 10);
                    var nearestDividerBeforeIndex = dividersBeforeIndex(index),
                        indexOffset = 0;

                    if (indexOffsetAfterDividerIndex[nearestDividerBeforeIndex]) {
                        indexOffset = indexOffsetAfterDividerIndex[nearestDividerBeforeIndex];
                    } else if (dividerIndexes.length) {
                        var dividers = getDividersBeforeIndex(index),
                            prevDividerIndex = 0;
                        dividers.forEach(function (dividerIndex) {
                            var indexesBetween = dividerIndex - prevDividerIndex,
                                maxIndexesBetween = Math.ceil(indexesBetween / tilesSideBySide) * tilesSideBySide;

                            prevDividerIndex = dividerIndex;
                            indexOffset += maxIndexesBetween - indexesBetween;
                        });
                        indexOffsetAfterDividerIndex[nearestDividerBeforeIndex] = indexOffset;
                    }
                    return index + indexOffset;
                };
            } else {
                calculateViewIndex = function (index) {
                    return index;
                };
            }

            function calculateVerticalTileIndex(index) {
                return Math.floor(index / tilesSideBySide);
            }

            function calculateHorizontalTileIndex(index) {
                return Math.round((index / tilesSideBySide - Math.floor(index / tilesSideBySide)) * tilesSideBySide);
            }

            function calculateVerticalTilePosition(index) {
                var viewIndex = calculateViewIndex(index);
                return dividersBeforeIndex(index) * dividerHeight + calculateVerticalTileIndex(viewIndex) * tileHeight;
            }

            function calculateScrollElementRelativeVerticalTilePosition(index) {
                return calculateVerticalTilePosition(index) + elementOffsetTop;
            }

            function calculateHorizontalTilePosition(index) {
                var viewIndex = calculateViewIndex(index);
                return tileWidth * calculateHorizontalTileIndex(viewIndex);
            }

            function calculateScrollElementRelativeHorizontalTilePosition(index) {
                return calculateVerticalTilePosition(index) + elementOffsetLeft;
            }

            function getDividersBeforeIndex(index) {
                return dividerIndexes.slice(0, dividersBeforeIndex(index));
            }

            function calculateVerticalDividerPosition(index) {
                var rowsBeforeThisIndex = Math.ceil(calculateViewIndex(index) / tilesSideBySide);
                return dividersBeforeIndex(index - 1) * dividerHeight + Math.min(rowsBeforeThisIndex, dataSource.length()) * tileHeight;
            }

            function showIndex(index) {
                index = parseInt(index, 10);
                if (index === -1) {
                    return;
                }

                var tileTop = calculateVerticalTilePosition(index);
                var tileLeft = calculateHorizontalTilePosition(index);
                var tileBottom = tileTop + tileHeight;
                // Make sure to show as many dividers above the first item as possible
                // by trying to align the item with the bottom instead
                var isFirstItem = index === 0;
                if (isFirstItem) {
                    $scrollElement.scrollTop(0 + elementOffsetTop);
                } else if (tileTop + elementOffsetTop <= $scrollElement.scrollTop()) {
                    $scrollElement.scrollTop(tileTop + elementOffsetTop);
                } else if (tileBottom + elementOffsetTop - $scrollElement.height() >= $scrollElement.scrollTop()) {
                    $scrollElement.scrollTop(tileBottom + elementOffsetTop - $scrollElement.height());
                }

                $scrollElement.scrollLeft(tileLeft + elementOffsetLeft);
            }

            function showDivider(index) {
                if (index in dividerCache) {
                    var top = calculateVerticalDividerPosition(index);
                    $scrollElement.scrollTop(top + elementOffsetTop);
                }
            }

            function subscribeToVisibleIndex() {
                subscriptions.push(configuration.visibleIndex.subscribe(showIndex));
            }

            function subscribeToVisibleDivider() {
                subscriptions.push(configuration.visibleDivider.subscribe(showDivider));
            }

            function binarySearch(items, find) {
                var low = 0, high = items.length - 1,
                    i = 0, value;
                while (low <= high) {
                    i = Math.floor((low + high) / 2);
                    value = items[i];

                    if (find === value) { return i; }
                    if (find < value) { high = i - 1; continue; }
                    if (find > value) { low = i + 1; continue; }
                    return i;
                }

                if (find < items[i]) {
                    return i - 1;
                }

                return i;
            }

            function dividersBeforeIndex(index) {
                var i = binarySearch(dividerIndexes, parseInt(index, 10));
                return i < 0 ? 0 : i + 1;
            }

            function renderTile(item, index) {
                var childBindingContext = bindingContext.createChildContext(viewModel);
                ko.utils.extend(childBindingContext, { $data: item, $index: function () { return index; } });
                var $tile = $('<div class="tile">');
                var tileCss = {'top': calculateVerticalTilePosition(index) + 'px'};

                if (configuration.grid) {
                    tileCss.left = calculateHorizontalTilePosition(index) + 'px';
                }

                // Make sure tile is part of the DOM before rendering to handle integration
                // with other bindings
                $tile.css(tileCss).appendTo(element);
                tileCache[index] = $tile;
                ko.renderTemplate(element, childBindingContext, { }, $tile[0]);
                return $tile;
            }

            function updateViewportIndexes() {
                viewportIndexes = Math.floor($scrollElement.height() / tileHeight) * tilesSideBySide;
            }

            function updateStretcherHeight() {
                stretcher.height(dividerHeight * Object.keys(dividerCache).length + tileHeight * Math.ceil(calculateViewIndex(dataSource.length()) / tilesSideBySide));
                if (configuration.scrollable) {
                    var elementPosition = $element.position();
                    elementOffsetTop = elementPosition.top + $scrollElement.scrollTop();
                    elementOffsetLeft = elementPosition.left + $scrollElement.scrollLeft();
                }
            }

            function positionDividers() {
                indexOffsetAfterDividerIndex = [];
                Object.keys(dividerCache).forEach(function (index) {
                    var $divider = dividerCache[index];
                    var top = calculateVerticalDividerPosition(index);
                    $divider.css('top', top + 'px');
                });
            }

            function positionTiles() {
                Object.keys(tileCache).forEach(function (index) {
                    var $tile = tileCache[index];
                    var tileCss = {'top': calculateVerticalTilePosition(index) + 'px'};

                    if (configuration.grid) {
                        tileCss.left = calculateHorizontalTilePosition(index) + 'px';
                    }

                    $tile.css(tileCss);
                });
            }

            function removeRenderDividers() {
                Object.keys(dividerCache).forEach(function (index) {
                    ko.removeNode(dividerCache[index][0]);
                });
                dividerCache = {};
            }

            function removeRenderTiles() {
                Object.keys(tileCache).forEach(function (index) {
                    ko.removeNode(tileCache[index][0]);
                });
                tileCache = {};
            }

            function clearViewport() {
                removeRenderDividers();
                removeRenderTiles();
            }

            function renderDividers() {
                var dividers = (configuration.dividers && ko.utils.unwrapObservable(configuration.dividers())) ||
                               (dataSource.dividers && ko.utils.unwrapObservable(dataSource.dividers())) || {};
                dividerIndexes = Object.keys(dividers);
                if (dividerIndexes.length > 0) {
                    dividerIndexes.forEach(function (index) {
                        var dividerLabel = dividers[index];
                        // TODO condider accepting a template for the divider element
                        var $divider = $('<div class="divider">').text(dividerLabel).appendTo(element);
                        dividerCache[index] = $divider;
                    });
                    var cacheKeys = Object.keys(dividerCache);
                    dividerHeight = dividerCache[cacheKeys[0]].outerHeight();
                    positionDividers();
                }
            }

            var initialRenderIdGenerator = new SequentialIdGenerator();
            function calibrateHeight(callback) {
                var tileCacheKeys = Object.keys(tileCache);
                var dividerCacheKeys = Object.keys(dividerCache);
                if (tileCacheKeys.length === 0) {
                    var executionId = initialRenderIdGenerator.nextId();
                    // Initial render, or full re-render due to changes in datasource
                    dataSource.get(0, function (item) {
                        if (executionId < initialRenderIdGenerator.currentId) {
                            return; // call was superseded
                        }
                        if (dataSource.length() === 0 ||
                            !ko.utils.domNodeIsAttachedToDocument(element)) {
                            return; // The data source has been emptied or the element got disconnected from the DOM
                        }
                        var $tile = renderTile(item, 0);
                        setTimeout(function () {
                            if (executionId < initialRenderIdGenerator.currentId) {
                                return; // call was superseded
                            }
                            tileHeight = $tile.outerHeight();
                            tileWidth = $tile.outerWidth();
                            tilesSideBySide = Math.max(Math.floor($element.width() / tileWidth), 1);
                            updateStretcherHeight();
                            positionDividers();
                            updateViewportIndexes();
                            callback();
                        }, 1);
                    });
                } else if (tileCache[tileCacheKeys[0]].outerHeight() !== tileHeight ||
                           tileCache[tileCacheKeys[0]].outerWidth() !== tileWidth ||
                           (dividerCacheKeys.length > 0 && dividerCache[dividerCacheKeys[0]].outerHeight() !== dividerHeight)) {
                    // Dimensions of tiles or dividers changed. Re-calculate
                    tileHeight = tileCache[tileCacheKeys[0]].outerHeight();
                    tileWidth = tileCache[tileCacheKeys[0]].outerWidth();
                    tilesSideBySide = Math.max(Math.floor($element.width() / tileWidth), 1);
                    dividerHeight = dividerCacheKeys.length ? dividerCache[dividerCacheKeys[0]].outerHeight() : 0;
                    removeRenderTiles();
                    updateStretcherHeight();
                    positionDividers();
                    updateViewportIndexes();
                    callback();
                } else {
                    // Scroll occurred, or page resize which does not affect tile/divider dimensions
                    tilesSideBySide = Math.max(Math.floor($element.width() / tileWidth), 1);
                    updateStretcherHeight();
                    positionDividers();
                    updateViewportIndexes();
                    positionTiles();
                    callback();
                }
            }

            function calculateStartIndex() {
                var viewport = {
                    top: $scrollElement.scrollTop()
                };

                var startIndex = Math.floor((viewport.top - elementOffsetTop) / tileHeight) * tilesSideBySide;

                while (viewport.top < calculateScrollElementRelativeVerticalTilePosition(startIndex)) {
                    startIndex -= 1;
                }

                return startIndex;
            }

            function updateIndexRange(startIndex) {
                if (startIndex === undefined) {
                    startIndex = calculateStartIndex();
                }

                var lastIndex = dataSource.length() - 1,
                    skipViewportIndexesBeforeStart = 0,
                    skipViewportIndexesAfterEnd = 0;

                if (startIndex < 0) {
                    skipViewportIndexesAfterEnd = -startIndex;
                    startIndex = 0;
                } else if (startIndex > lastIndex) {
                    skipViewportIndexesBeforeStart = lastIndex - startIndex;
                    startIndex = lastIndex;
                }

                var endIndex = viewportIndexes - 1  + startIndex;

                if (neverEvictTiles) {
                    indexRange.start = 0;
                    indexRange.end = lastIndex;
                } else {
                    indexRange.start = Math.max(0, startIndex - (viewportIndexes + skipViewportIndexesBeforeStart));
                    indexRange.end = Math.min(lastIndex,  endIndex + (viewportIndexes - skipViewportIndexesAfterEnd));
                }
            }
            function removeTileFromCacheOutsideOfIndexRange() {
                Object.keys(tileCache).filter(function (index) {
                    return index < indexRange.start || indexRange.end < index;
                }).forEach(function (index) {
                    ko.removeNode(tileCache[index][0]);
                    delete tileCache[index];
                });
            }

            function updateIndex(index) {
                dataSource.get(index, function (item, i) {
                    if (i < dataSource.length() && indexRange.start <= i && i <= indexRange.end &&
                        ko.utils.domNodeIsAttachedToDocument(element)) {
                        renderTile(item, i);
                    }
                });
            }

            var renderViewPortIdGenerator = new SequentialIdGenerator();
            function renderViewPort() {
                var executionId = renderViewPortIdGenerator.nextId();
                calibrateHeight(function () {
                    if (executionId < renderViewPortIdGenerator.currentId) {
                        return; // call was superseded
                    }

                    if (isInitialRender && configuration.visibleIndex) {
                        showIndex(configuration.visibleIndex.peek());
                    }

                    updateIndexRange();
                    isInitialRender = false;

                    for (var i = indexRange.start; i <= indexRange.end; i += 1) {
                        if (!tileCache[i]) {
                            updateIndex(i);
                        }
                    }

                    removeTileFromCacheOutsideOfIndexRange();
                });
            }

            var renderTimer = null;
            var renderInterval = null;
            function queueRendering() {
                if (dataSource.length() === 0) {
                    updateStretcherHeight();
                    return;
                }

                clearTimeout(renderTimer);
                renderTimer = setTimeout(function () {
                    clearInterval(renderInterval);
                    renderInterval = null;
                    renderViewPort();
                }, 100);

                if (!renderInterval) {
                    renderInterval = setInterval(function () {
                        renderViewPort();
                    }, 400);
                }
            }

            dataSource.onUpdate(function () {
                neverEvictTiles = dataSource.length() < evictionTreshold;
                clearViewport();
                renderDividers();

                if (dataSource.length() === 0) {
                    updateStretcherHeight();
                } else {
                    renderViewPort();
                }
            });

            var resizeAndScrollHandler = function (e) {
                setTimeout(function () {
                    queueRendering();
                }, 0);
            };

            $(window).on('resize.knockoutList', resizeAndScrollHandler);
            $scrollElement.on('scroll', resizeAndScrollHandler);

            if (configuration.visibleDivider) {
                subscribeToVisibleDivider();
            }

            if (configuration.visibleIndex) {
                subscribeToVisibleIndex();
            }

            if (updateDataSourceAtOnce) {
                dataSource.notify();
            }

            ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                $(window).off('resize', resizeAndScrollHandler);
                $scrollElement.off('scroll', resizeAndScrollHandler);
                subscriptions.forEach(function (subscription) {
                    subscription.dispose();
                });
            });

            return { controlsDescendantBindings: true };
        }
    };
}));
