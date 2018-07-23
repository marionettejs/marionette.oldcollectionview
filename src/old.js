import Marionette from 'backbone.marionette';
import OldCollectionView from './collection-view';
import OldCompositeView from './composite-view';

// Support the default export
Marionette.OldCollectionView = OldCollectionView;
Marionette.OldCompositeView = OldCompositeView;

export { OldCollectionView, OldCompositeView }
