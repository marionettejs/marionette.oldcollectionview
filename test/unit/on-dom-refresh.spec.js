import CollectionView from '../../src/collection-view';

describe('onDomRefresh', function() {
  'use strict';

  beforeEach(function() {
    this.setFixtures($('<div id="region"></div>'));
    this.attachedRegion = new Marionette.Region({el: '#region'});
    this.detachedRegion = new Marionette.Region({el: $('<div></div>')});
    this.BbView = Backbone.View.extend({
      onDomRefresh: this.sinon.stub()
    });
    this.MnView = Marionette.View.extend({
      template: _.noop,
      onDomRefresh: this.sinon.stub()
    });
  });

  describe('when a CollectionView attached to the DOM renders a Backbone child view', function() {
    beforeEach(function() {
      var collection = new Backbone.Collection();
      var collectionView = new CollectionView({
        childView: this.BbView,
        collection: collection
      });
      this.attachedRegion.show(collectionView);
      collection.add({id: 1});
      this.bbView = collectionView.children.findByIndex(0);
    });

    it('should trigger onDomRefresh on the child view', function() {
      expect(this.bbView.onDomRefresh).to.have.been.calledOnce;
    });
  });

  describe('when a CollectionView attached to the DOM renders a Marionette child view', function() {
    beforeEach(function() {
      var collection = new Backbone.Collection();
      var collectionView = new CollectionView({
        childView: this.MnView,
        collection: collection
      });
      this.attachedRegion.show(collectionView);
      collection.add({id: 1});
      this.mnView = collectionView.children.findByIndex(0);
    });

    it('should trigger onDomRefresh on the child view', function() {
      expect(this.mnView.onDomRefresh).to.have.been.calledOnce;
    });
  });
});
