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
        visibleIndex: ko.observable(0).extend({notify: 'always'})
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
