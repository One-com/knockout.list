/*global $, afterEach*/
function createTestElement(options) {
    options = $.extend({
        listHeight: 60,
        itemHeight: 30
    }, options);
    var testContainer = $('#test');
    var list = $('<div data-bind="list: { data: items, visibleIndex: $data.visibleIndex }"></div>');
    list.height(options.listHeight);
    var item = $('<div data-bind="text: $data, attr: { id: $data }"></div>');
    item.height(options.itemHeight);
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
        throw new Error('expected element to have ' + value + ' tiles but it have ' + numberOfTiles + ' tiles');
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


expect.addAssertion('to have no gap or overlapping between tiles', function () {
    var that = this;
    function retrieveTileInfo(index, tileElement) {
        var $tile = $(tileElement);
        return {
            id: $tile.find('> div').attr('id'),
            top: parseInt($tile.css('top'), 10),
            height: $tile.height()
        };
    }

    function byTop(tile1, tile2) {
        return tile1.top - tile2.top;
    }

    var lastTile;
    var tiles = $('.tile', this.obj).map(retrieveTileInfo).get();
    tiles.sort(byTop);
    tiles.forEach(function (tile) {
        if (lastTile) {
            if (tile.top < lastTile.top + lastTile.height) {
                throw new Error('expected element to have no overlapping tiles ' +
                                'but the following tiles overlap: ' +
                                that.inspect(lastTile) + ' and ' + that.inspect(tile));
            } else if (tile.top > lastTile.top + lastTile.height) {
                throw new Error('expected element to have no gaps between tiles ' +
                                'but the following tiles have a gap between them: ' +
                                that.inspect(lastTile) + ' and ' + that.inspect(tile));
            }
        }
        lastTile = tile;
    });
});
