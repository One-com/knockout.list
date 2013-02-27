/*global ko*/
(function () {
    var dataSource = {
        update: function (callback) {
            callback();
        },
        get: function (index, callback) {
            callback("Item " + index, index);
        },
        length: function () {
            return 500000;
        }
    };
    
    var viewModel = {
        dataSource: dataSource
    };
    ko.applyBindings(viewModel, document.getElementById('application'));
}());
