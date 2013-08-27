/*global describe, beforeEach, createTestElement, ko, expect, it*/
describe('knockout.list', function () {
    describe('with an observable array as data source', function () {
        describe('when the data source is empty', function () {
            var element;
            var model;
            beforeEach(function () {
                model = { items: ko.observableArray() };
                element = createTestElement({
                    height: 60
                });
                ko.applyBindings(model, element);
            });

            it('renders no elements', function () {
                expect(element, 'has number tiles', 0);
            });

            it('has scroll height equal to container', function () {
                expect(element, 'has scroll height', 60);
            });

            it('has content height', function () {
                expect(element, 'has content height', 0);
            });
        });
    });
});
