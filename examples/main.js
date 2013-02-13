/*global ko*/
(function () {
    function FakeDataSource() {
    }

    FakeDataSource.prototype.update = function (callback) {
        callback();
    };

    FakeDataSource.prototype.get = function (index, callback) {
        callback("Item " + index, index);
    };

    FakeDataSource.prototype.length = function () {
        return 500000;
    };

    var dataSource = new FakeDataSource();
    
    var viewModel = {
        dataSource: dataSource
    };
    ko.applyBindings(viewModel, document.getElementById('application'));
}());
