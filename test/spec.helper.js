/*global $, afterEach*/
function createTestElement(options) {
    options = $.extend({
        listHeight: 60,
        itemHeight: 30
    }, options);
    var testContainer = $('#test');
    var list = $('<div data-bind="list: items"></div>');
    list.height(options.listHeight);
    var item = $('<div data-bind="text: $data, attr: { id: $data }"></div>');
    item.height(options.itemHeight);
    list.append(item);

    testContainer.append(list);

    return list.get(0);
}


function scrollToBottom(element) {
    element.scrollTop = element.scrollHeight;
    $(element).trigger('scroll');
}

var expect = window.weknowhow.expect;
var factory = window.weknowhow.factory;

var itemFactory = factory(function () {
    return 'item' + this.sequence();
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
