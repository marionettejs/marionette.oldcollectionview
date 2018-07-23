import OldCollectionView from '../../src/collection-view';

describe('onAttach', function() {
  const expectTriggerMethod = (method, target, retval, before = null) => {
    expect(method)
      .to.have.been.calledOnce
      .and.to.have.been.calledOn(target)
      .and.to.have.been.calledWithExactly(target)
      .and.to.have.returned(retval);
    if (before) {
      expect(method).to.have.been.calledBefore(before);
    }
  };

  const extendAttachMethods = superConstructor => target => _.assign(target, {
    constructor(options) {
      superConstructor.call(this, options);
      sinon.spy(this, 'onAttach');
      sinon.spy(this, 'onBeforeAttach');
      sinon.spy(this, 'onDetach');
      sinon.spy(this, 'onBeforeDetach');
      sinon.spy(this, 'onDestroy');
    },
    onAttach() {
      return !!this._isAttached;
    },
    onBeforeAttach() {
      return !!this._isAttached;
    },
    onDetach() {
      return !!this._isAttached;
    },
    onBeforeDetach() {
      return !!this._isAttached;
    },
    onDestroy() {
      return !!this._isAttached;
    }
  });

  let sinon;
  let View;
  let EmptyView;
  let ChildView;
  let CollectionView;
  let regionEl;
  let region;  // A Region to show our View within

  beforeEach(function() {
    sinon = this.sinon;
    View = Marionette.View.extend(extendAttachMethods(Marionette.View)({
      template: _.template('<header></header><main></main><footer></footer>'),
      regions: {
        header: 'header',
        main: 'main',
        footer: 'footer'
      }
    }));
    EmptyView = Backbone.View.extend(extendAttachMethods(Backbone.View)({
      template: _.noop
    }));
    ChildView = Backbone.View.extend(extendAttachMethods(Backbone.View)({
      template: _.noop
    }));
    CollectionView = OldCollectionView.extend({
      childView: ChildView,
      emptyView: EmptyView
    });
    // A Region to show our View within
    this.setFixtures('<div id="region"></div>');
    regionEl = document.getElementById('region');
    region = new Marionette.Region({el: regionEl});
  });

  describe('when showing an empty CollectionView', function() {
    let emptyView;
    let childView;
    let collection;
    let collectionView;

    beforeEach(function() {
      collection = new Backbone.Collection();
      collectionView = new CollectionView({
        collection
      });

      region.show(collectionView);
      emptyView = collectionView.children.findByIndex(0);
    });

    it('should trigger onBeforeAttach and onAttach on the emptyView', function() {
      expect(emptyView).to.be.an.instanceof(EmptyView);
      expectTriggerMethod(emptyView.onBeforeAttach, emptyView, false, emptyView.onAttach);
      expectTriggerMethod(emptyView.onAttach, emptyView, true);
    });

    describe('when adding a new element to the collection', function() {
      beforeEach(function() {
        collection.add({id: 1});
        childView = collectionView.children.findByIndex(0);
      });

      it('should trigger onBeforeDetach and onDetach on the emptyView', function() {
        expectTriggerMethod(emptyView.onBeforeDetach, emptyView, true, emptyView.onDetach);
        expectTriggerMethod(emptyView.onDetach, emptyView, false);
      });

      it('should trigger onBeforeAttach and onAttach on the childView', function() {
        expect(childView).to.be.an.instanceof(ChildView);
        expectTriggerMethod(childView.onBeforeAttach, childView, false, childView.onAttach);
        expect(childView.onAttach, childView, true);
      });
    });
  });

  describe('when showing a non-empty CollectionView', function() {
    let collection;
    let collectionView;
    let childView1;
    let childView2;

    beforeEach(function() {
      collection = new Backbone.Collection([{id: 1}, {id: 2}]);
      collectionView = new CollectionView({
        collection
      });
      region.show(collectionView);
      childView1 = collectionView.children.findByIndex(0);
      childView2 = collectionView.children.findByIndex(1);
    });

    it('should trigger onBeforeAttach and onAttach on each of its childViews', function() {
      expectTriggerMethod(childView1.onBeforeAttach, childView1, false, childView1.onAttach);
      expectTriggerMethod(childView1.onAttach, childView1, true);

      expectTriggerMethod(childView2.onBeforeAttach, childView2, false, childView2.onAttach);
      expectTriggerMethod(childView2.onAttach, childView2, true);
    });

    describe('when re-rendering the CollectionView', function() {
      beforeEach(function() {
        collectionView.render();
      });

      it('should trigger onBeforeDetach and onDetach on each of its childViews', function() {
        expectTriggerMethod(childView1.onBeforeDetach, childView1, true, childView1.onDetach);
        expectTriggerMethod(childView1.onDetach, childView1, false);

        expectTriggerMethod(childView2.onBeforeDetach, childView2, true, childView2.onDetach);
        expectTriggerMethod(childView2.onDetach, childView2, false);
      });

      it('should trigger onBeforeAttach and onAttach on each of its childViews', function() {
        expectTriggerMethod(childView1.onBeforeAttach, childView1, false, childView1.onAttach);
        expect(childView1.onAttach, childView1, true);

        expectTriggerMethod(childView2.onBeforeAttach, childView2, false, childView2.onAttach);
        expectTriggerMethod(childView2.onAttach, childView2, true);
      });
    });

    describe('when emptying the collection', function() {
      let emptyView;

      beforeEach(function() {
        collection.reset();
        emptyView = collectionView.children.findByIndex(0);
      });

      it('should trigger onBeforeDetach and onDetach on each of its childViews', function() {
        expectTriggerMethod(childView1.onBeforeDetach, childView1, true, childView1.onDetach);
        expectTriggerMethod(childView1.onDetach, childView1, false);

        expectTriggerMethod(childView2.onBeforeDetach, childView2, true, childView2.onDetach);
        expectTriggerMethod(childView2.onDetach, childView2, false);
      });

      it('should trigger onBeforeAttach and onAttach on the emptyView', function() {
        expect(emptyView).to.be.an.instanceof(EmptyView);
        expectTriggerMethod(emptyView.onBeforeAttach, emptyView, false, emptyView.onAttach);
        expectTriggerMethod(emptyView.onAttach, emptyView, true);
      });
    });

    describe('when destroying CollectionView tree', function() {
      let detachView;
      let collectionViewOnDetach;

      beforeEach(function() {
        detachView = new View({
          template: _.noop
        });
        ChildView = View.extend({
          template: _.template('<div id="child-region"></div>'),
          regions: {
            'region': '#child-region'
          },
          onAttach() {
            this.showChildView('region', detachView);
          }
        });
        collectionViewOnDetach = this.sinon.spy();
        collectionView = new CollectionView({
          collection: collection,
          childView: ChildView,
          onDetach: collectionViewOnDetach
        });
        region.show(collectionView);
        childView1 = collectionView.children.findByIndex(0);
        childView2 = collectionView.children.findByIndex(1);
        region.empty();
      });

      it('should call onDetach for detachView before destroying parent view', function() {
        expect(childView1.onDetach).to.have.been.calledBefore(detachView.onDestroy);
        expect(childView2.onDetach).to.have.been.calledBefore(detachView.onDestroy);
      });

      it('should call onDetach for childView before destroying collectionView', function() {
        expect(collectionViewOnDetach).to.have.been.calledBefore(childView1.onDestroy);
        expect(collectionViewOnDetach).to.have.been.calledBefore(childView2.onDestroy);
      });

      it('should call onDetach for collectionView before destroying parent', function() {
        expect(collectionViewOnDetach).to.have.been.calledBefore(detachView.onDestroy);
      });
    });
  });
});
