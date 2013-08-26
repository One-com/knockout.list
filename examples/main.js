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
        }
    };

    var viewModel = {
        itemCount: itemCount,
        dataSource: dataSource,
        update: function () {
            dataSource.notify();
        }
    };
    ko.applyBindings(viewModel, document.getElementById('application'));
    dataSource.notify();
}());
