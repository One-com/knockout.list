/*global $, afterEach*/
function createTestElement(options) {
    options = $.extend({}, options || {}, {
        height: 60,
        itemHeight: 30
    });
    var testContainer = $('#test');
    var list = $('<div data-bind="list: items"></div>');
    list.height(options.height);
    var item = $('<div data-bind="text: $data"></div>');
    item.height(options.itemHeight);
    list.append(item);

    testContainer.append(list);

    return list.get(0);
}

afterEach(function () {
    //$('#test').empty();
});

function createItems(size) {
    var result = [];

    for (var i = 0; i < size; i += 1) {
        result.push('item' + i);
    }
    return result;
}

var expect = window.weknowhow.expect;

expect.addAssertion('has number tiles', function (value) {
    this.assert($('.tile', this.obj).length === value);
});

expect.addAssertion('has scroll height', function (value) {
    this.assert(this.obj.scrollHeight === value);
});

expect.addAssertion('has content height', function (value) {
    this.assert($('.stretcher', this.obj)[0].scrollHeight === value);
});
