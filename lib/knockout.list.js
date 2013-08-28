/*global ko, $*/
// Copyright 2012 Sune Simonsen
// https://github.com/sunesimonsen/knockout.list
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

    ko.bindingHandlers.list = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var bindingValue = valueAccessor();

            var dataSource;
            var updateDataSourceAtOnce = false;
            if (bindingValue.onUpdate) {
                // Datasource
                dataSource = bindingValue;
            } else {
                var items;
                if (bindingValue.data) {
                    items = bindingValue.data;
                } else {
                    items = bindingValue;
                }

                dataSource = createDataSourceFromObservableArray(items);
                if (bindingValue.visibleIndex) {
                    dataSource.visibleIndex = bindingValue.visibleIndex;
                }

                updateDataSourceAtOnce = true;
                var dataSourceSubscription = items.subscribe(function () {
                    dataSource.notify();
                });
                ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                    dataSourceSubscription.dispose();
                });
            }

            var templateNodes = element.nodeType === 1 ? element.childNodes : ko.virtualElements.childNodes(element);
            var container = ko.utils.moveCleanedNodesToContainerElement(templateNodes);
            new ko.templateSources.anonymousTemplate(element).nodes(container);

            var $element = $(element);

            $element.addClass('knockout-list');
            var stretcher = $('<div class="stretcher">').appendTo(element);
            var tileHeight = null;
            var tileCache = {};
            var indexRange = {};
            var viewportIndexes = null;
            var neverEvictTiles = false;
            var evictionTreshold = 100;

            if (dataSource.visibleIndex) {
                var visibleIndexSubscription = dataSource.visibleIndex.subscribe(function (index) {
                    if (index === -1) {
                        return;
                    }

                    var tileTop = tileHeight * index;
                    var tileBottom = tileTop + tileHeight;
                    if (tileBottom <= element.scrollTop) {
                        element.scrollTop = tileTop;
                    } else if (element.scrollTop + $(element).height() <= tileTop) {
                        element.scrollTop = tileTop - $(element).height() + tileHeight;
                    }
                });
                ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                    visibleIndexSubscription.dispose();
                });
            }

            function renderTile(item, index) {
                var childBindingContext = bindingContext.createChildContext(viewModel);
                ko.utils.extend(childBindingContext, { $data: item, $index: index });
                var $tile = $('<div class="tile">');
                ko.renderTemplate(element, childBindingContext, { }, $tile[0]);
                var top = index && index * tileHeight;
                $tile.css('top', top + 'px').appendTo(element);
                tileCache[index] = $tile;
                return $tile;
            }

            function renderViewPort(callback) {
                if (tileHeight === null) {
                    dataSource.get(0, function (item) {
                        var $tile = renderTile(item, 0);
                        tileHeight = $tile.outerHeight();
                        stretcher.height(tileHeight * dataSource.length());
                        viewportIndexes = Math.floor($element.height() / tileHeight);
                        renderViewPort(callback);
                    });
                    return;
                }

                var viewport = {
                    top: $element.scrollTop()
                };

                var startIndex = viewport.top === 0 ? 0 :
                    Math.floor(viewport.top / tileHeight);
                var endIndex = viewportIndexes - 1  + startIndex;

                if (neverEvictTiles) {
                    indexRange.start = 0;
                    indexRange.end = dataSource.length() - 1;
                } else {
                    indexRange.start = Math.max(0, startIndex - viewportIndexes);
                    indexRange.end = Math.min(dataSource.length() - 1,  endIndex + viewportIndexes);
                }

                function updateIndex(index) {
                    var cached = tileCache[index];
                    if (cached) { return; }
                    dataSource.get(index, function (item, index) {
                        var cached = tileCache[index];
                        if (cached) { return; }
                        if (indexRange.start <= index && index <= indexRange.end) {
                            renderTile(item, index);
                        }
                    });
                }

                var start = indexRange.start;
                var end = indexRange.end;
                for (var i = start; i <= end; i += 1) {
                    updateIndex(i);
                }

                Object.keys(tileCache).filter(function (index) {
                    return index < start || end < index;
                }).forEach(function (index) {
                    ko.removeNode(tileCache[index][0]);
                    delete tileCache[index];
                });

                if (callback) {
                    callback();
                }
            }

            var renderTimer = null;
            var renderInterval = null;
            function queryRendering() {
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
                tileHeight = null;

                Object.keys(tileCache).forEach(function (index) {
                    ko.removeNode(tileCache[index][0]);
                    delete tileCache[index];
                });
                tileCache = {};

                if (dataSource.length() === 0) {
                    stretcher.height(0);
                    return;
                }

                if (dataSource.length() < evictionTreshold) {
                    neverEvictTiles = true;
                }

                queryRendering();
            });

            $(window).on('resize.knockoutList', function (e) {
                if (tileHeight) {
                    viewportIndexes = Math.floor($element.height() / tileHeight);
                }
                queryRendering();
            });

            $element.scroll(function (event) {
                queryRendering();

            });

            ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                $(window).off('resize.knockoutList');
            });

            if (updateDataSourceAtOnce) {
                dataSource.notify();
            }

            return { controlsDescendantBindings: true };
        }
    };
}));
