/*global ko*/
(function () {
    var itemCount = ko.observable(5000);
    var dataSource = {
        onUpdate: function (callback) {
            if (callback) {
                this.callback = callback;
            } else {
                this.callback();
            }
        },
        notify: function () {
            this.callback();
        },
        get: function (index, callback) {
            callback("Item " + index, index);
        },
        length: function () {
            return itemCount();
        },
        dividers: function () {
            var length = this.length();
            var steps = length < 1000 ? 10 : (length < 10000 ? 100 : 1000);

            var result = {};

            for (var i = 0; i < length; i += steps) {
                result[i] = i + '-' + (Math.min(i + steps, length) - 1);
            }
            return result;
        },
        visibleIndex: ko.observable(0).extend({notify: 'always'}),
        scrollable: '.scrollable'
    };

    var viewModel = {
        itemCount: itemCount,
        visibleIndex: ko.observable(0),
        dataSource: dataSource,
        update: function () {
            dataSource.notify();
        },
        gotoItem: function () {
            dataSource.visibleIndex(this.visibleIndex());
        }
    };
    ko.applyBindings(viewModel, document.getElementById('application'));
    dataSource.notify();
}());
