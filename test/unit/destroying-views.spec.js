import CollectionView from '../../src/collection-view';
import CompositeView from '../../src/composite-view';

describe('destroying views', function() {
  'use strict';

  describe('when destroying a Marionette.CollectionView multiple times', function() {
    beforeEach(function() {
      this.onDestroyStub = this.sinon.stub();

      this.collectionView = new CollectionView();
      this.collectionView.onDestroy = this.onDestroyStub;

      this.collectionView.destroy();
      this.collectionView.destroy();
    });

    it('should only run the destroying code once', function() {
      expect(this.onDestroyStub).to.have.been.calledOnce;
    });

    it('should mark the view as destroyed', function() {
      expect(this.collectionView).to.have.property('_isDestroyed', true);
    });
  });

  describe('when destroying a Marionette.CompositeView multiple times', function() {
    beforeEach(function() {
      this.onDestroyStub = this.sinon.stub();

      this.compositeView = new CompositeView();
      this.compositeView.onDestroy = this.onDestroyStub;

      this.compositeView.destroy();
      this.compositeView.destroy();
    });

    it('should only run the destroying code once', function() {
      expect(this.onDestroyStub).to.have.been.calledOnce;
    });

    it('should mark the view as destroyed', function() {
      expect(this.compositeView).to.have.property('_isDestroyed', true);
    });
  });
});
