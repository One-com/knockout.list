/*global $, afterEach*/
function createTestElement(options) {
    options = $.extend({
        listHeight: 60,
        listWidth: 160,
        itemHeight: 30,
        itemWidth: 50
    }, options);
    var testContainer = $('#test');
    var list = $('<div data-bind="list: { data: items, visibleIndex: $data.visibleIndex, dividers: $data.dividers }"></div>');
    list.height(options.listHeight);
    var item = $('<div data-bind="text: $data, attr: { id: $data }"></div>');
    item.height(options.itemHeight);
    list.append(item);

    testContainer.append(list);

    return list.get(0);
}

function createTestGridElement(options) {
    options = $.extend({
        listHeight: 60,
        listWidth: 160,
        itemHeight: 30,
        itemWidth: 50
    }, options);
    var testContainer = $('#test');
    var list = $('<div data-bind="list: { data: items, visibleIndex: $data.visibleIndex, dividers: $data.dividers, grid: true }"></div>');
    list.height(options.listHeight);
    list.width(options.listWidth);
    var item = $('<div data-bind="text: $data, attr: { id: $data }"></div>');
    item.height(options.itemHeight);
    item.width(options.itemWidth);
    list.append(item);

    testContainer.append(list);

    return list.get(0);
}

function scrollTo(element, top) {
    element.scrollTop = top;
    $(element).trigger('scroll');
}

function scrollToBottom(element) {
    scrollTo(element, element.scrollHeight);
}

function tileRange(from, to) {
    var result = [];
    for (var i = from; i <= to; i += 1) {
        result.push('#item' + i);
    }
    return result;
}

var expect = window.weknowhow.expect;
var factory = window.weknowhow.factory;

var itemFactory = factory(function (name) {
    return name || 'item' + this.sequence();
});

afterEach(function () {
    $('#test').empty();
    itemFactory.reset();
});

expect.addAssertion('to have number of tiles', function (value) {
    var numberOfTiles = $('.tile', this.obj).length;
    if (numberOfTiles !== value) {
        throw new Error('expected element to have ' + value + ' tiles but it has ' + numberOfTiles + ' tiles');
    }
});

expect.addAssertion('to have number of dividers', function (value) {
    var numberOfDividers = $('.divider', this.obj).length;
    if (numberOfDividers !== value) {
        throw new Error('expected element to have ' + value + ' dividers but it has ' + numberOfDividers + ' dividers');
    }
});

expect.addAssertion('to have scroll top', function (value) {
    var scrollTop = this.obj.scrollTop;
    if (scrollTop !== value) {
        throw new Error('expected element to have scroll top ' + value + ' but was ' + scrollTop);
    }
});

expect.addAssertion('to have scroll height', function (value) {
    var scrollHeight = this.obj.scrollHeight;
    if (scrollHeight !== value) {
        throw new Error('expected element to have scroll height ' + value + ' but was ' + scrollHeight);
    }
});

expect.addAssertion('to have content height', function (value) {
    var contentHeight = $('.stretcher', this.obj).height();
    if (contentHeight !== value) {
        throw new Error('expected element to have content height ' + value + ' but was ' + contentHeight);
    }
});

expect.addAssertion('to [only] have tiles', function (tileSelectors) {
    var element = this.obj;
    tileSelectors.forEach(function (tileSelector) {
        if ($(tileSelector, element).length === 0) {
            throw new Error('expected element to have tiles "' + tileSelectors.join(', ') + '" but tile "' + tileSelector + '" was not found');
        }
    });
    if (this.flags.only) {
        expect(element, 'to have number of tiles', tileSelectors.length);
    }
});


function retrieveTileInfo(index, tileElement) {
    var $tile = $(tileElement);
    return {
        id: $tile.find('> div').attr('id'),
        top: parseInt($tile.css('top'), 10),
        left: parseInt($tile.css('left'), 10),
        height: $tile.height()
    };
}

function retrieveDividerInfo(index, dividerElement) {
    var $divider = $(dividerElement);
    return {
        text: $divider.text(),
        top: parseInt($divider.css('top'), 10),
        left: parseInt($divider.css('left'), 10),
        height: $divider.height()
    };
}

function assertNoOverlappingAndGaps(elements) {
    function byTopAndLeft(element1, element2) {
        if (element1.top !== element2.top) {
            return element1.top - element2.top;
        } else {
            return element1.left - element2.left;
        }
    }
    var lastElement;
    elements.sort(byTopAndLeft);
    elements.forEach(function (element) {
        if (lastElement) {
            if (element.top < lastElement.top + lastElement.height &&
                element.left < lastElement.left + lastElement.width) {
                throw new Error('expected element to have no overlapping children ' +
                                'but the following children overlap: ' +
                                expect.inspect(lastElement) + ' and ' + expect.inspect(element));
            } else if (element.top > lastElement.top + lastElement.height &&
                element.left > lastElement.left + lastElement.width) {
                throw new Error('expected element to have no gaps between children ' +
                                'but the following children have a gap between them: ' +
                                expect.inspect(lastElement) + ' and ' + expect.inspect(element));
            }
        }
        lastElement = element;
    });
}

expect.addAssertion('to have no gap or overlapping between tiles and dividers', function () {
    var tiles = $('.tile', this.obj).map(retrieveTileInfo).get();
    var dividers = $('.divider', this.obj).map(retrieveDividerInfo).get();

    var elements = tiles.concat(dividers);
    assertNoOverlappingAndGaps(elements);
});

expect.addAssertion('to have no gap or overlapping between tiles', function () {
    var tiles = $('.tile', this.obj).map(retrieveTileInfo).get();
    var dividers = [];
    if (tiles.length > 0) {
        var firstTile = tiles[0];
        var lastTile = tiles[tiles.length - 1];
        dividers = $('.divider', this.obj).map(retrieveDividerInfo).get().filter(function (divider) {
            return firstTile.top <= divider.top && divider.top + divider.height <= lastTile.top + lastTile.height;
        });
    }

    var elements = tiles.concat(dividers);
    assertNoOverlappingAndGaps(elements);
});
