/*global ko*/
(function () {
    function FakeDataSource() {
    }

    FakeDataSource.prototype.update = function (callback) {
        setTimeout(function () {
            callback();
        }, 400);
    };

    FakeDataSource.prototype.get = function (index, callback) {
        setTimeout(function () {
            callback("Item " + index, index);
        }, 100);
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
