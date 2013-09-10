/*global describe, beforeEach, afterEach, createTestElement, ko, expect, it, itemFactory, scrollToBottom, sinon, $, tileRange*/
var itemHeight = 30;
var listHeight = itemHeight * 3;
var dividerHeight = 20;
describe('knockout.list with height ' + listHeight + 'px and items of height ' + itemHeight + 'px and divider of height 20px', function () {
    var clock;
    var element;
    beforeEach(function () {
        clock = sinon.useFakeTimers();
        element = createTestElement({
            listHeight: listHeight,
            itemHeight: itemHeight
        });
    });

    afterEach(function () {
        clock.restore();
    });

    describe('with an observable array as data source', function () {
        describe('when the data source is empty', function () {
            var model;
            beforeEach(function () {
                model = { items: ko.observableArray(), dividers: ko.observable() };
                ko.applyBindings(model, element);
                clock.tick(110);
            });

            it('renders no tiles', function () {
                expect(element, 'to have number of tiles', 0);
            });

            it('has scroll height equal to container', function () {
                expect(element, 'to have scroll height', listHeight);
            });

            it('has content height equals to the height of all items', function () {
                expect(element, 'to have content height', 0);
            });

            describe('and it has 3 dividers', function () {
                beforeEach(function () {
                    model.dividers({ 20: "A", 40: 'B', 60: 'C' });
                    clock.tick(110);
                });

                it('places all dividers sequential from the start of the list', function () {
                    expect(element, 'to have number of dividers', 3);
                });

                it('has scroll height equal to container', function () {
                    expect(element, 'to have scroll height', listHeight);
                });

                it('has content height equals to the height of all dividers', function () {
                    expect(element, 'to have content height', dividerHeight * 3);
                });

                it('has no overlapping tiles', function () {
                    expect(element, 'to have no gap or overlapping between tiles and dividers');
                });
            });
        });

        describe('when the data source is smaller then the eviction treshold of 100 items', function () {
            var model;
            var numberOfItems = 99;
            beforeEach(function () {
                model = { items: ko.observableArray(itemFactory.create(numberOfItems)), dividers: ko.observable() };
                ko.applyBindings(model, element);
                clock.tick(110);
            });

            it('renders ' + numberOfItems + ' tiles', function () {
                expect(element, 'to have number of tiles', numberOfItems);
            });

            it('has scroll height equals to the height of all items', function () {
                expect(element, 'to have scroll height', numberOfItems * itemHeight);
            });

            it('has content height equals to the height of all items', function () {
                expect(element, 'to have content height', numberOfItems * itemHeight);
            });

            it('has no overlapping tiles', function () {
                expect(element, 'to have no gap or overlapping between tiles');
            });

            describe('and the viewport is scrolled to the bottom', function () {
                beforeEach(function () {
                    element.scrollTop = element.scrollHeight;
                });

                it('still has ' + numberOfItems + ' tiles', function () {
                    expect(element, 'to have number of tiles', numberOfItems);
                });

                it('has no overlapping tiles', function () {
                    expect(element, 'to have no gap or overlapping between tiles');
                });

                describe('and it has 3 dividers', function () {
                    beforeEach(function () {
                        model.dividers({ 20: "A", 40: 'B', 60: 'C' });
                        clock.tick(110);
                    });

                    it('places all dividers sequential from the start of the list', function () {
                        expect(element, 'to have number of dividers', 3);
                    });

                    it('has scroll height equals to the height of all items and dividers', function () {
                        expect(element, 'to have scroll height', dividerHeight * 3 + numberOfItems * itemHeight);
                    });

                    it('has content height equals to the height of all items and dividers', function () {
                        expect(element, 'to have content height', dividerHeight * 3 + numberOfItems * itemHeight);
                    });

                    it('has no overlapping tiles', function () {
                        expect(element, 'to have no gap or overlapping between tiles and dividers');
                    });
                });
            });

        });

        describe('when the data source is larger then the eviction treshold of 100 items', function () {
            var model;
            var numberOfItems = 100;
            beforeEach(function () {
                model = {
                    items: ko.observableArray(itemFactory.create(numberOfItems)),
                    visibleIndex: ko.observable(0).extend({ notify: 'always' }),
                    dividers: ko.observable()
                };
                ko.applyBindings(model, element);
                clock.tick(110);
            });

            it('has scroll height equals to the height of all items', function () {
                expect(element, 'to have scroll height', numberOfItems * itemHeight);
            });

            it('has content height equals to the height of all items', function () {
                expect(element, 'to have content height', numberOfItems * itemHeight);
            });

            it('has tiles item0 to item5', function () {
                expect(element, 'to only have tiles', tileRange(0, 5));
            });

            it('has no overlapping tiles', function () {
                expect(element, 'to have no gap or overlapping between tiles');
            });

            describe('and the viewport is scrolled to item 20', function () {
                beforeEach(function () {
                    scrollTo(element, 20 * itemHeight);
                    clock.tick(110);
                });

                it('has tiles item17 to item25', function () {
                    clock.tick(110);
                    expect(element, 'to only have tiles', tileRange(17, 25));
                });

                it('has no overlapping tiles', function () {
                    expect(element, 'to have no gap or overlapping between tiles');
                });
            });

            describe('and the viewport is scrolled to item 20 and back to item 10', function () {
                beforeEach(function () {
                    scrollTo(element, 20 * itemHeight);
                    scrollTo(element, 10 * itemHeight);
                    clock.tick(110);
                });

                it('has tiles item7 to item16', function () {
                    expect(element, 'to only have tiles', tileRange(7, 15));
                });

                it('has no overlapping tiles', function () {
                    expect(element, 'to have no gap or overlapping between tiles');
                });

                describe('and it has 3 dividers', function () {
                    beforeEach(function () {
                        model.dividers({ 10: "A", 40: 'B', 60: 'C' });
                        clock.tick(110);
                    });

                    it('places all dividers sequential from the start of the list', function () {
                        expect(element, 'to have number of dividers', 3);
                    });

                    it('has scroll height equals to the height of all items and dividers', function () {
                        expect(element, 'to have scroll height', dividerHeight * 3 + numberOfItems * itemHeight);
                    });

                    it('has content height equals to the height of all items and dividers', function () {
                        expect(element, 'to have content height', dividerHeight * 3 + numberOfItems * itemHeight);
                    });

                    it('has no overlapping tiles', function () {
                        expect(element, 'to have no gap or overlapping between tiles');
                    });
                });
            });

            describe('and the viewport is scrolled to the bottom', function () {
                beforeEach(function () {
                    scrollToBottom(element);
                    clock.tick(110);
                });

                it('has tiles item94 to item99', function () {
                    expect(element, 'to only have tiles', tileRange(94, 99));
                });

                it('has no overlapping tiles', function () {
                    expect(element, 'to have no gap or overlapping between tiles');
                });

                describe('and it has 3 dividers', function () {
                    beforeEach(function () {
                        model.dividers({ 10: "A", 40: 'B', 95: 'C' });
                        clock.tick(110);
                    });

                    it('places all dividers sequential from the start of the list', function () {
                        expect(element, 'to have number of dividers', 3);
                    });

                    it('has scroll height equals to the height of all items and dividers', function () {
                        expect(element, 'to have scroll height', dividerHeight * 3 + numberOfItems * itemHeight);
                    });

                    it('has content height equals to the height of all items and dividers', function () {
                        expect(element, 'to have content height', dividerHeight * 3 + numberOfItems * itemHeight);
                    });

                    it('has no overlapping tiles', function () {
                        expect(element, 'to have no gap or overlapping between tiles');
                    });
                });
            });

            describe('and a new item is added to the bottom of the list that is outside of the render tiles', function () {
                beforeEach(function () {
                    model.items.push(itemFactory());
                    clock.tick(110);
                    model.visibleIndex(model.items().length - 1);
                    $(element).trigger('scroll');
                    clock.tick(110);
                });

                it('has tiles item95 to item100', function () {
                    expect(element, 'to only have tiles', tileRange(95, 100));
                });

                it('has scroll height equals to the height of all items', function () {
                    expect(element, 'to have scroll height', (numberOfItems + 1) * itemHeight);
                });

                it('has content height equals to the height of all items', function () {
                    expect(element, 'to have content height', (numberOfItems + 1) * itemHeight);
                });

                it('has no overlapping tiles', function () {
                    expect(element, 'to have no gap or overlapping between tiles');
                });
            });

            describe('and a new item is added to the middle of the list that is outside of the render tiles', function () {
                beforeEach(function () {
                    model.items.splice(50, 0, itemFactory('newItem'));
                    clock.tick(110);
                    model.visibleIndex(50);
                    $(element).trigger('scroll');
                    clock.tick(110);
                });

                it('has tiles item45 to item52 and the new item', function () {
                    expect(element, 'to only have tiles', tileRange(45, 52).concat('#newItem'));
                });

                it('has scroll height equals to the height of all items', function () {
                    expect(element, 'to have scroll height', (numberOfItems + 1) * itemHeight);
                });

                it('has content height equals to the height of all items', function () {
                    expect(element, 'to have content height', (numberOfItems + 1) * itemHeight);
                });

                it('has no overlapping tiles', function () {
                    expect(element, 'to have no gap or overlapping between tiles');
                });
            });

            describe('and a new item inside the viewport', function () {
                beforeEach(function () {
                    scrollTo(element, 50 * itemHeight);
                    model.items.splice(51, 0, itemFactory('newItem'));
                    clock.tick(110);
                });

                it('has tiles item47 to item54 and the new item', function () {
                    expect(element, 'to only have tiles', tileRange(47, 54).concat('#newItem'));
                });

                it('has scroll height equals to the height of all items', function () {
                    expect(element, 'to have scroll height', (numberOfItems + 1) * itemHeight);
                });

                it('has content height equals to the height of all items', function () {
                    expect(element, 'to have content height', (numberOfItems + 1) * itemHeight);
                });

                it('has no overlapping tiles', function () {
                    expect(element, 'to have no gap or overlapping between tiles');
                });
            });

            describe('and items has just been sorted in the reverse direction', function () {
                beforeEach(function () {
                    scrollTo(element, 50 * itemHeight);
                    model.items.sort(function (x, y) {
                        return parseInt(y.slice(4), 10) - parseInt(x.slice(4), 10);
                    });
                    clock.tick(110);
                });

                it('has tiles item44 to item52 and the new item', function () {
                    expect(element, 'to only have tiles', tileRange(44, 52));
                });

                it('has scroll height equals to the height of all items', function () {
                    expect(element, 'to have scroll height', numberOfItems * itemHeight);
                });

                it('has content height equals to the height of all items', function () {
                    expect(element, 'to have content height', numberOfItems * itemHeight);
                });

                it('has no overlapping tiles', function () {
                    expect(element, 'to have no gap or overlapping between tiles');
                });
            });

            describe('and the data is replaced', function () {
                beforeEach(function () {
                    scrollTo(element, 50 * itemHeight);
                    clock.tick(110);
                    model.items(itemFactory.create(100));
                    clock.tick(110);
                });

                it('has tiles item147 to item155 and the new item', function () {
                    expect(element, 'to only have tiles', tileRange(147, 155));
                });

                it('has scroll height equals to the height of all items', function () {
                    expect(element, 'to have scroll height', numberOfItems * itemHeight);
                });

                it('has content height equals to the height of all items', function () {
                    expect(element, 'to have content height', numberOfItems * itemHeight);
                });

                it('has no overlapping tiles', function () {
                    expect(element, 'to have no gap or overlapping between tiles');
                });
            });
        });

    });
});
