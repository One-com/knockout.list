/*global describe, beforeEach, afterEach, createTestElement, ko, expect, it, itemFactory, scrollToBottom, sinon*/
var itemHeight = 30;
var listHeight = itemHeight * 3;
describe('knockout.list with height ' + listHeight + 'px and items of height ' + itemHeight + 'px', function () {
    var clock;
    beforeEach(function () {
        clock = sinon.useFakeTimers();
    });

    afterEach(function () {
        clock.restore();
    });

    describe('with an observable array as data source', function () {
        describe('when the data source is empty', function () {
            var element;
            var model;
            beforeEach(function () {
                model = { items: ko.observableArray() };
                element = createTestElement({
                    listHeight: listHeight,
                    itemHeight: itemHeight
                });
                ko.applyBindings(model, element);
            });

            it('renders no tiles', function () {
                expect(element, 'to have number of tiles', 0);
            });

            it('has scroll height equal to container', function () {
                expect(element, 'to have scroll height', listHeight);
            });

            it('has content height', function () {
                expect(element, 'to have content height', 0);
            });
        });

        describe('when the data source is smaller then the eviction treshold of 100 items', function () {
            var element;
            var model;
            var numberOfItems = 99;
            beforeEach(function () {
                model = { items: ko.observableArray(itemFactory.create(numberOfItems)) };
                element = createTestElement({
                    listHeight: listHeight,
                    itemHeight: itemHeight
                });
                ko.applyBindings(model, element);
            });

            it('renders ' + numberOfItems + ' tiles', function () {
                expect(element, 'to have number of tiles', numberOfItems);
            });

            it('has scroll height equal to container', function () {
                expect(element, 'to have scroll height', numberOfItems * itemHeight);
            });

            it('has content height', function () {
                expect(element, 'to have content height', numberOfItems * itemHeight);
            });

            describe('and the viewport is scrolled to the bottom', function () {
                beforeEach(function () {
                    element.scrollTop = element.scrollHeight;
                });

                it('still has ' + numberOfItems + ' tiles', function () {
                    expect(element, 'to have number of tiles', numberOfItems);
                });
            });
        });

        describe('when the data source is larger then the eviction treshold of 100 items', function () {
            var element;
            var model;
            var numberOfItems = 100;
            beforeEach(function () {
                model = { items: ko.observableArray(itemFactory.create(numberOfItems)) };
                element = createTestElement({
                    listHeight: listHeight,
                    itemHeight: itemHeight
                });
                ko.applyBindings(model, element);
            });

            it('renders ' + (listHeight / itemHeight * 2) + ' tiles', function () {
                expect(element, 'to have number of tiles', (listHeight / itemHeight * 2));
            });

            it('has scroll height equal to container', function () {
                expect(element, 'to have scroll height', numberOfItems * itemHeight);
            });

            it('has content height', function () {
                expect(element, 'to have content height', numberOfItems * itemHeight);
            });

            it('has tiles item0 to item5', function () {
                expect(element, 'to only have tiles', [
                    '#item0', '#item1', '#item2', '#item3', '#item4', '#item5'
                ]);
            });

            describe('and the viewport is scrolled to element 20', function () {
                beforeEach(function () {
                    scrollTo(element, 20 * itemHeight);
                });

                it('has tiles item17 to item25', function () {
                    clock.tick(110);
                    expect(element, 'to only have tiles', [
                        '#item17', '#item18', '#item19',
                        '#item20', '#item21', '#item22',
                        '#item23', '#item24', '#item25'
                    ]);
                });
            });

            describe('and the viewport is scrolled to the bottom', function () {
                beforeEach(function () {
                    scrollToBottom(element);
                });

                it('has tiles item94 to item99', function () {
                    clock.tick(110);
                    expect(element, 'to only have tiles', [
                        '#item94', '#item95', '#item96', '#item97', '#item98', '#item99'
                    ]);
                });
            });
        });
    });
});
