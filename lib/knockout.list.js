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
(function (document, window, ko) {
    function FiFoCache(size) {
        this.size = size;
        this.next = 0; 
        this.invalidationListeners = [];
        this.keys = [];
        this.data = {};
    }

    FiFoCache.prototype.set = function (key, value) {
        var index = this.next % this.size;

        if (this.keys[index] !== undefined) {
            var oldKey = this.keys[index];
            var oldValue = this.data[oldKey];
            delete this.data[oldKey];
            this.invalidationListeners.forEach(function (listener) {
                listener(oldKey, oldValue);
            });
        }

        this.keys[index] = key;
        this.data[key] = value;
        this.next++;
    };

    FiFoCache.prototype.get = function (key) {
        return this.data[key];
    };

    FiFoCache.prototype.onInvalidation = function (callback) {
        this.invalidationListeners.push(callback);
        return this;
    };

    ko.bindingHandlers.list = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var dataSource = ko.utils.unwrapObservable(valueAccessor());

            var templateNodes = element.nodeType == 1 ? element.childNodes : ko.virtualElements.childNodes(element);
            var container = ko.utils.moveCleanedNodesToContainerElement(templateNodes);
            new ko.templateSources.anonymousTemplate(element).nodes(container);

            var $element = $(element);


            $element.addClass('knockout-list');
            var stretcher = $('<div>').appendTo(element);
            var tileHeight = null;
            var tileCache = new FiFoCache(30);
            var indexRange = {};

            function renderTile(item, index) {
                var cached = tileCache.get(index);
                if (cached) {
                    return cached;
                }

                var childBindingContext = bindingContext.createChildContext(viewModel);
                ko.utils.extend(childBindingContext, { $data: item, $index: index });
                var $tile = $('<div class="tile">');
                ko.renderTemplate(element, childBindingContext, { }, $tile[0]);
                var top = index && index * tileHeight;
                $tile.css('top', top + 'px').appendTo(element);
                tileCache.set(index, $tile);
                return $tile;
            }

            tileCache.onInvalidation(function (index, $tile) {
                $tile.remove();
            });

            function renderViewPort(callback) {
                if (tileHeight === null) {
                    dataSource.get(0, function (item) {
                        var $tile = renderTile(item, 0);
                        tileHeight = $tile.outerHeight();
                        stretcher.height(tileHeight * dataSource.length());
                        renderViewPort(callback);
                    });
                    return;
                }

                var viewPort = {
                    top: $element.scrollTop()
                };

                var viewPortIndexes = Math.floor($element.height() / tileHeight);
                var startIndex = viewPort.top === 0 ? 0 : 
                    startIndex = Math.floor(viewPort.top / tileHeight);
                var endIndex = viewPortIndexes + startIndex;

                indexRange.start = Math.max(0, startIndex - viewPortIndexes);
                indexRange.end = Math.min(dataSource.length() - 1,  endIndex + viewPortIndexes);

                function updateIndex(index) {
                    var cached = tileCache.get(index);
                    if (cached) {
                        return;
                    }
                    dataSource.get(index, function (item, index) {
                        if (indexRange.start <= index && index <= indexRange.end) {
                            renderTile(item, index);
                        }
                    });
                }

                var start = indexRange.start;
                var end = indexRange.end;
                for (var i = start; i <= end; i++) {
                    updateIndex(i);
                }

                if (callback) {
                    callback();
                }
            }

            dataSource.update(function () {
                if (dataSource.length() === 0) {
                    stretcher.height(0);
                    return;
                }

                renderViewPort();
            });

            $element.scroll(function (event) {
                renderViewPort();
            });

            return { controlsDescendantBindings: true };
        }
    };
}(document, window, ko));

