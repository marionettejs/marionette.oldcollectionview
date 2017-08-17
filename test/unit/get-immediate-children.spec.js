import CollectionView from '../../src/collection-view';

describe('_getImmediateChildren', function() {
  beforeEach(function() {

    // A suitable view to use as a child
    this.BaseView = Marionette.View.extend({
      template: _.noop
    });
  });

  describe('CollectionView', function() {
    describe('when empty', function() {
      beforeEach(function() {
        this.collectionView = new CollectionView();
      });
      it('should return an empty array for getImmediateChildren', function() {
        expect(this.collectionView._getImmediateChildren())
          .to.be.instanceof(Array)
          .and.to.have.length(0);
      });
    });

    describe('when there are children', function() {
      beforeEach(function() {
        this.collectionView = new CollectionView({
          collection: new Backbone.Collection([{}, {}]),
          childView: this.BaseView
        });
        this.collectionView.render();
        this.childOne = this.collectionView.children.findByIndex(0);
        this.childTwo = this.collectionView.children.findByIndex(1);
      });
      it('should return an empty array for getImmediateChildren', function() {
        expect(this.collectionView._getImmediateChildren())
          .to.be.instanceof(Array)
          .and.to.have.length(2)
          .and.to.contain(this.childOne)
          .and.to.contain(this.childTwo);
      });
    });
  });

});
