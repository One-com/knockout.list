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
            var tileCache = {};
            var indexRange = {};
            var viewPortIndexes = null;

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
                        viewPortIndexes = Math.floor($element.height() / tileHeight);
                        renderViewPort(callback);
                    });
                    return;
                }

                var viewPort = {
                    top: $element.scrollTop()
                };

                var startIndex = viewPort.top === 0 ? 0 : 
                    Math.floor(viewPort.top / tileHeight);
                var endIndex = viewPortIndexes + startIndex;

                indexRange.start = Math.max(0, startIndex - viewPortIndexes);
                indexRange.end = Math.min(dataSource.length() - 1,  endIndex + viewPortIndexes);

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
                for (var i = start; i <= end; i++) {
                    updateIndex(i);
                }

                Object.keys(tileCache).filter(function (index) {
                    return index < start || end < index;
                }).forEach(function (index) {
                    tileCache[index].remove();
                    delete tileCache[index];
                });

                if (callback) {
                    callback();
                }
            }

            dataSource.update(function () {
                tileHeight = null;

                Object.keys(tileCache).forEach(function (index) {
                    tileCache[index].remove();
                    delete tileCache[index];
                });
                tileCache = {};

                if (dataSource.length() === 0) {
                    stretcher.height(0);
                    return;
                }

                renderViewPort();
            });

            var scrollTimer = null;
            $element.scroll(function (event) {
                clearTimeout(scrollTimer);
                setTimeout(function () {
                    renderViewPort();
                }, 100);
            });

            return { controlsDescendantBindings: true };
        }
    };
}(document, window, ko));
