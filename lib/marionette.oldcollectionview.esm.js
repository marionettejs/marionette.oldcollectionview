/**
* @license
* MarionetteJS (Backbone.Marionette)
* ----------------------------------
* v0.1.0
*
* Copyright (c)2017 Derick Bailey, Muted Solutions, LLC.
* Distributed under MIT license
*
* http://marionettejs.com
*/


import Marionette from 'backbone.marionette';
import _ from 'underscore';
import Backbone from 'backbone';

// Trigger Method
// --------------

// split the event name on the ":"
var splitter = /(^|:)(\w)/gi;

// take the event section ("section1:section2:section3")
// and turn it in to uppercase name onSection1Section2Section3
function getEventName(match, prefix, eventName) {
  return eventName.toUpperCase();
}

var getOnMethodName = _.memoize(function (event) {
  return 'on' + event.replace(splitter, getEventName);
});

// Trigger an event and/or a corresponding method name. Examples:
//
// `this.triggerMethod("foo")` will trigger the "foo" event and
// call the "onFoo" method.
//
// `this.triggerMethod("foo:bar")` will trigger the "foo:bar" event and
// call the "onFooBar" method.
function triggerMethod(event) {
  for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }

  // get the method name from the event name
  var methodName = getOnMethodName(event);
  var method = Marionette.getOption(this, methodName);
  var result = void 0;

  // call the onMethodName if it exists
  if (_.isFunction(method)) {
    // pass all args, except the event name
    result = method.apply(this, args);
  }

  // trigger the event
  this.trigger.apply(this, arguments);

  return result;
}

// triggerMethodOn invokes triggerMethod on a specific context
//
// e.g. `Marionette.triggerMethodOn(view, 'show')`
// will trigger a "show" event or invoke onShow the view.
function triggerMethodOn(context) {
  for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
    args[_key2 - 1] = arguments[_key2];
  }

  if (_.isFunction(context.triggerMethod)) {
    return context.triggerMethod.apply(context, args);
  }

  return triggerMethod.apply(context, args);
}

function renderView(view) {
  if (view._isRendered) {
    return;
  }

  if (!view.supportsRenderLifecycle) {
    triggerMethodOn(view, 'before:render', view);
  }

  view.render();

  if (!view.supportsRenderLifecycle) {
    view._isRendered = true;
    triggerMethodOn(view, 'render', view);
  }
}

function destroyView(view) {
  if (view.destroy) {
    view.destroy();
    return;
  }

  if (!view.supportsDestroyLifecycle) {
    triggerMethodOn(view, 'before:destroy', view);
  }

  var shouldTriggerDetach = view._isAttached && !view._shouldDisableEvents;

  if (shouldTriggerDetach) {
    triggerMethodOn(view, 'before:detach', view);
  }

  view.remove();

  if (shouldTriggerDetach) {
    view._isAttached = false;
    triggerMethodOn(view, 'detach', view);
  }

  view._isDestroyed = true;

  if (!view.supportsDestroyLifecycle) {
    triggerMethodOn(view, 'destroy', view);
  }
}

// DOM Refresh
// -----------

// Trigger method on children unless a pure Backbone.View
function triggerMethodChildren(view, event, shouldTrigger) {
  if (!view._getImmediateChildren) {
    return;
  }
  _.each(view._getImmediateChildren(), function (child) {
    if (!shouldTrigger(child)) {
      return;
    }
    triggerMethodOn(child, event, child);
  });
}

function shouldTriggerAttach(view) {
  return !view._isAttached;
}

function shouldAttach(view) {
  if (!shouldTriggerAttach(view)) {
    return false;
  }
  view._isAttached = true;
  return true;
}

function shouldTriggerDetach(view) {
  return view._isAttached;
}

function shouldDetach(view) {
  if (!shouldTriggerDetach(view)) {
    return false;
  }
  view._isAttached = false;
  return true;
}

function triggerDOMRefresh(view) {
  if (view._isAttached && view._isRendered) {
    triggerMethodOn(view, 'dom:refresh', view);
  }
}

function triggerDOMRemove(view) {
  if (view._isAttached && view._isRendered) {
    triggerMethodOn(view, 'dom:remove', view);
  }
}

function handleBeforeAttach() {
  triggerMethodChildren(this, 'before:attach', shouldTriggerAttach);
}

function handleAttach() {
  triggerMethodChildren(this, 'attach', shouldAttach);
  triggerDOMRefresh(this);
}

function handleBeforeDetach() {
  triggerMethodChildren(this, 'before:detach', shouldTriggerDetach);
  triggerDOMRemove(this);
}

function handleDetach() {
  triggerMethodChildren(this, 'detach', shouldDetach);
}

function handleBeforeRender() {
  triggerDOMRemove(this);
}

function handleRender() {
  triggerDOMRefresh(this);
}

// Monitor a view's state, propagating attach/detach events to children and firing dom:refresh
// whenever a rendered view is attached or an attached view is rendered.
function monitorViewEvents(view) {
  if (view._areViewEventsMonitored || view.monitorViewEvents === false) {
    return;
  }

  view._areViewEventsMonitored = true;

  view.on({
    'before:attach': handleBeforeAttach,
    'attach': handleAttach,
    'before:detach': handleBeforeDetach,
    'detach': handleDetach,
    'before:render': handleBeforeRender,
    'render': handleRender
  });
}

// Mix in methods from Underscore, for iteration, and other
// collection related features.
// Borrowing this code from Backbone.Collection:
// https://github.com/jashkenas/backbone/blob/1.1.2/backbone.js#L962

var methods = ['forEach', 'each', 'map', 'find', 'detect', 'filter', 'select', 'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke', 'toArray', 'first', 'initial', 'rest', 'last', 'without', 'isEmpty', 'pluck', 'reduce', 'partition'];

var emulateCollection = function emulateCollection(object, listProperty) {
  _.each(methods, function (method) {
    object[method] = function () {
      var list = _.result(this, listProperty);
      var args = Array.prototype.slice.call(arguments);
      return _[method].apply(_, [list].concat(args));
    };
  });
};

// Provide a container to store, retrieve and
// shut down child views.
var Container = function Container(views) {
  this._views = {};
  this._indexByModel = {};
  this._indexByCustom = {};
  this._updateLength();

  _.each(views, _.bind(this.add, this));
};

emulateCollection(Container.prototype, '_getViews');

// Container Methods
// -----------------

_.extend(Container.prototype, {
  _getViews: function _getViews() {
    return _.values(this._views);
  },


  // Add a view to this container. Stores the view
  // by `cid` and makes it searchable by the model
  // cid (and model itself). Optionally specify
  // a custom key to store an retrieve the view.
  add: function add(view, customIndex) {
    return this._add(view, customIndex)._updateLength();
  },


  // To be used when avoiding call _updateLength
  // When you are done adding all your new views
  // call _updateLength
  _add: function _add(view, customIndex) {
    var viewCid = view.cid;

    // store the view
    this._views[viewCid] = view;

    // index it by model
    if (view.model) {
      this._indexByModel[view.model.cid] = viewCid;
    }

    // index by custom
    if (customIndex) {
      this._indexByCustom[customIndex] = viewCid;
    }

    return this;
  },


  // Find a view by the model that was attached to
  // it. Uses the model's `cid` to find it.
  findByModel: function findByModel(model) {
    return this.findByModelCid(model.cid);
  },


  // Find a view by the `cid` of the model that was attached to
  // it. Uses the model's `cid` to find the view `cid` and
  // retrieve the view using it.
  findByModelCid: function findByModelCid(modelCid) {
    var viewCid = this._indexByModel[modelCid];
    return this.findByCid(viewCid);
  },


  // Find a view by a custom indexer.
  findByCustom: function findByCustom(index) {
    var viewCid = this._indexByCustom[index];
    return this.findByCid(viewCid);
  },


  // Find by index. This is not guaranteed to be a
  // stable index.
  findByIndex: function findByIndex(index) {
    return _.values(this._views)[index];
  },


  // retrieve a view by its `cid` directly
  findByCid: function findByCid(cid) {
    return this._views[cid];
  },


  // Remove a view
  remove: function remove(view) {
    return this._remove(view)._updateLength();
  },


  // To be used when avoiding call _updateLength
  // When you are done adding all your new views
  // call _updateLength
  _remove: function _remove(view) {
    var viewCid = view.cid;

    // delete model index
    if (view.model) {
      delete this._indexByModel[view.model.cid];
    }

    // delete custom index
    _.some(this._indexByCustom, _.bind(function (cid, key) {
      if (cid === viewCid) {
        delete this._indexByCustom[key];
        return true;
      }
    }, this));

    // remove the view from the container
    delete this._views[viewCid];

    return this;
  },


  // Update the `.length` attribute on this container
  _updateLength: function _updateLength() {
    this.length = _.size(this._views);

    return this;
  }
});

// Collection View
// ---------------

var setDomApi = Marionette.View.setDomApi;

var ViewMixin = _.pick(Marionette.View.prototype, 'Dom', 'supportsRenderLifecycle', 'supportsDestroyLifecycle', '_isDestroyed', 'isDestroyed', '_isRendered', 'isRendered', '_isAttached', 'isAttached', 'delegateEvents', '_getEvents', 'getTriggers', 'delegateEntityEvents', 'undelegateEntityEvents', 'destroy', '_removeElement', 'bindUIElements', 'unbindUIElements', 'getUI', 'childViewEventPrefix', 'triggerMethod', '_buildEventProxies', '_proxyChildViewEvents', '_childViewEventHandler',
// BehaviorsMixin
'_initBehaviors', '_getBehaviors', '_getBehaviorTriggers', '_getBehaviorEvents', '_proxyBehaviorViewProperties', '_delegateBehaviorEntityEvents', '_undelegateBehaviorEntityEvents', '_destroyBehaviors', '_removeBehavior', '_bindBehaviorUIElements', '_unbindBehaviorUIElements', '_triggerEventOnBehaviors',
// CommonMixin
'normalizeMethods', '_setOptions', 'mergeOptions', 'getOption', 'bindEvents', 'unbindEvents',
// DelegateEntityEventsMixin
'_delegateEntityEvents', '_undelegateEntityEvents',
// TriggersMixin
'_getViewTriggers',
// UIMixin
'normalizeUIKeys', 'normalizeUIString', 'normalizeUIValues', '_getUIBindings', '_bindUIElements', '_unbindUIElements', '_getUI');

var isNodeAttached = Marionette.isNodeAttached;
var MarionetteError = Marionette.Error;

var ClassOptions = ['behaviors', 'childView', 'childViewEventPrefix', 'childViewEvents', 'childViewOptions', 'childViewTriggers', 'collectionEvents', 'events', 'filter', 'emptyView', 'emptyViewOptions', 'modelEvents', 'reorderOnSort', 'sort', 'triggers', 'ui', 'viewComparator'];

// A view that iterates over a Backbone.Collection
// and renders an individual child view for each model.
var CollectionView = Backbone.View.extend({

  // flag for maintaining the sorted order of the collection
  sort: true,

  // constructor
  // option to pass `{sort: false}` to prevent the `CollectionView` from
  // maintaining the sorted order of the collection.
  // This will fallback onto appending childView's to the end.
  //
  // option to pass `{viewComparator: compFunction()}` to allow the `CollectionView`
  // to use a custom sort order for the collection.
  constructor: function constructor(options) {
    this.render = _.bind(this.render, this);

    this._setOptions(options);

    this.mergeOptions(options, ClassOptions);

    monitorViewEvents(this);

    this._initBehaviors();
    this.once('render', this._initialEvents);
    this._initChildViewStorage();
    this._bufferedChildren = [];

    var args = Array.prototype.slice.call(arguments);
    args[0] = this.options;
    Backbone.View.prototype.constructor.apply(this, args);

    this.delegateEntityEvents();

    this._triggerEventOnBehaviors('initialize', this);
  },


  // Instead of inserting elements one by one into the page, it's much more performant to insert
  // elements into a document fragment and then insert that document fragment into the page
  _startBuffering: function _startBuffering() {
    this._isBuffering = true;
  },
  _endBuffering: function _endBuffering() {
    var shouldTriggerAttach = this._isAttached && this.monitorViewEvents !== false;
    var triggerOnChildren = shouldTriggerAttach ? this._getImmediateChildren() : [];

    this._isBuffering = false;

    _.each(triggerOnChildren, function (child) {
      triggerMethodOn(child, 'before:attach', child);
    });

    this.attachBuffer(this, this._createBuffer());

    _.each(triggerOnChildren, function (child) {
      child._isAttached = true;
      triggerMethodOn(child, 'attach', child);
    });

    this._bufferedChildren = [];
  },
  _getImmediateChildren: function _getImmediateChildren() {
    return _.values(this.children._views);
  },


  // Configured the initial events that the collection view binds to.
  _initialEvents: function _initialEvents() {
    if (this.collection) {
      this.listenTo(this.collection, 'add', this._onCollectionAdd);
      this.listenTo(this.collection, 'update', this._onCollectionUpdate);
      this.listenTo(this.collection, 'reset', this.render);

      if (this.sort) {
        this.listenTo(this.collection, 'sort', this._sortViews);
      }
    }
  },


  // Handle a child added to the collection
  _onCollectionAdd: function _onCollectionAdd(child, collection, opts) {
    // `index` is present when adding with `at` since BB 1.2; indexOf fallback for < 1.2
    var index = opts.at !== undefined && (opts.index || collection.indexOf(child));

    // When filtered or when there is no initial index, calculate index.
    if (this.filter || index === false) {
      index = _.indexOf(this._filteredSortedModels(index), child);
    }

    if (this._shouldAddChild(child, index)) {
      this._destroyEmptyView();
      this._addChild(child, index);
    }
  },


  // Handle collection update model removals
  _onCollectionUpdate: function _onCollectionUpdate(collection, options) {
    var changes = options.changes;
    this._removeChildModels(changes.removed);
  },


  // Remove the child views and destroy them.
  // This function also updates the indices of later views
  // in the collection in order to keep the children in sync with the collection.
  // "models" is an array of models and the corresponding views
  // will be removed and destroyed from the CollectionView
  _removeChildModels: function _removeChildModels(models) {
    // Used to determine where to update the remaining
    // sibling view indices after these views are removed.
    var removedViews = this._getRemovedViews(models);

    if (!removedViews.length) {
      return;
    }

    this.children._updateLength();

    // decrement the index of views after this one
    this._updateIndices(removedViews, false);

    if (this.isEmpty()) {
      this._showEmptyView();
    }
  },


  // Returns the views that will be used for re-indexing
  // through CollectionView#_updateIndices.
  _getRemovedViews: function _getRemovedViews(models) {
    var _this = this;

    // Returning a view means something was removed.
    return _.reduce(models, function (removingViews, model) {
      var view = model && _this.children.findByModel(model);

      if (!view || view._isDestroyed) {
        return removingViews;
      }

      _this._removeChildView(view);

      removingViews.push(view);

      return removingViews;
    }, []);
  },
  _removeChildView: function _removeChildView(view) {
    this.triggerMethod('before:remove:child', this, view);

    this.children._remove(view);
    view._shouldDisableEvents = this.monitorViewEvents === false;
    destroyView(view);

    this.stopListening(view);
    this.triggerMethod('remove:child', this, view);
  },


  // Overriding Backbone.View's `setElement` to handle
  // if an el was previously defined. If so, the view might be
  // attached on setElement.
  setElement: function setElement() {
    var hasEl = !!this.el;

    Backbone.View.prototype.setElement.apply(this, arguments);

    if (hasEl) {
      this._isAttached = isNodeAttached(this.el);
    }

    return this;
  },


  // Render children views. Override this method to provide your own implementation of a
  // render function for the collection view.
  render: function render() {
    if (this._isDestroyed) {
      return this;
    }
    this.triggerMethod('before:render', this);
    this._renderChildren();
    this._isRendered = true;
    this.triggerMethod('render', this);
    return this;
  },


  // An efficient rendering used for filtering. Instead of modifying the whole DOM for the
  // collection view, we are only adding or removing the related childrenViews.
  setFilter: function setFilter(filter) {
    var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        preventRender = _ref.preventRender;

    var canBeRendered = this._isRendered && !this._isDestroyed;
    var filterChanged = this.filter !== filter;
    var shouldRender = canBeRendered && filterChanged && !preventRender;

    if (shouldRender) {
      var previousModels = this._filteredSortedModels();
      this.filter = filter;
      var models = this._filteredSortedModels();
      this._applyModelDeltas(models, previousModels);
    } else {
      this.filter = filter;
    }

    return this;
  },


  // `removeFilter` is actually an alias for removing filters.
  removeFilter: function removeFilter(options) {
    return this.setFilter(null, options);
  },


  // Calculate and apply difference by cid between `models` and `previousModels`.
  _applyModelDeltas: function _applyModelDeltas(models, previousModels) {
    var _this2 = this;

    var currentIds = {};
    _.each(models, function (model, index) {
      var addedChildNotExists = !_this2.children.findByModel(model);
      if (addedChildNotExists) {
        _this2._onCollectionAdd(model, _this2.collection, { at: index });
      }
      currentIds[model.cid] = true;
    });

    var removeModels = _.filter(previousModels, function (prevModel) {
      return !currentIds[prevModel.cid] && _this2.children.findByModel(prevModel);
    });

    this._removeChildModels(removeModels);
  },


  // Reorder DOM after sorting. When your element's rendering do not use their index,
  // you can pass reorderOnSort: true to only reorder the DOM after a sort instead of
  // rendering all the collectionView.
  reorder: function reorder() {
    var _this3 = this;

    var children = this.children;
    var models = this._filteredSortedModels();

    if (!models.length && this._showingEmptyView) {
      return this;
    }

    var anyModelsAdded = _.some(models, function (model) {
      return !children.findByModel(model);
    });

    // If there are any new models added due to filtering we need to add child views,
    // so render as normal.
    if (anyModelsAdded) {
      this.render();
    } else {

      var filteredOutModels = [];

      // Get the DOM nodes in the same order as the models and
      // find the model that were children before but aren't in this new order.
      var elsToReorder = _.reduce(this.children._views, function (viewEls, view) {
        var index = _.indexOf(models, view.model);

        if (index === -1) {
          filteredOutModels.push(view.model);
          return viewEls;
        }

        view._index = index;

        viewEls[index] = view.el;

        return viewEls;
      }, new Array(models.length));

      this.triggerMethod('before:reorder', this);

      var elBuffer = this.Dom.createBuffer();

      _.each(elsToReorder, function (el) {
        _this3.Dom.appendContents(elBuffer, el);
      });

      // Since append moves elements that are already in the DOM, appending the elements
      // will effectively reorder them.
      this._appendReorderedChildren(elBuffer);

      // remove any views that have been filtered out
      this._removeChildModels(filteredOutModels);

      this.triggerMethod('reorder', this);
    }
    return this;
  },


  // Render view after sorting. Override this method to change how the view renders
  // after a `sort` on the collection.
  resortView: function resortView() {
    if (this.reorderOnSort) {
      this.reorder();
    } else {
      this._renderChildren();
    }
    return this;
  },


  // Internal method. This checks for any changes in the order of the collection.
  // If the index of any view doesn't match, it will render.
  _sortViews: function _sortViews() {
    var _this4 = this;

    var models = this._filteredSortedModels();

    // check for any changes in sort order of views
    var orderChanged = _.find(models, function (item, index) {
      var view = _this4.children.findByModel(item);
      return !view || view._index !== index;
    });

    if (orderChanged) {
      this.resortView();
    }
  },


  // Internal reference to what index a `emptyView` is.
  _emptyViewIndex: -1,

  // Internal method. Separated so that CompositeView can append to the childViewContainer
  // if necessary
  _appendReorderedChildren: function _appendReorderedChildren(children) {
    this.Dom.appendContents(this.el, children, { _$el: this.$el });
  },


  // Internal method. Separated so that CompositeView can have more control over events
  // being triggered, around the rendering process
  _renderChildren: function _renderChildren() {
    if (this._isRendered) {
      this._destroyEmptyView();
      this._destroyChildren();
    }

    var models = this._filteredSortedModels();
    if (this.isEmpty({ processedModels: models })) {
      this._showEmptyView();
    } else {
      this.triggerMethod('before:render:children', this);
      this._startBuffering();
      this._showCollection(models);
      this._endBuffering();
      this.triggerMethod('render:children', this);
    }
  },
  _createView: function _createView(model, index) {
    var ChildView = this._getChildView(model);
    var childViewOptions = this._getChildViewOptions(model, index);
    var view = this.buildChildView(model, ChildView, childViewOptions);
    return view;
  },
  _setupChildView: function _setupChildView(view, index) {
    monitorViewEvents(view);

    // set up the child view event forwarding
    this._proxyChildViewEvents(view);

    if (this.sort) {
      view._index = index;
    }
  },


  // Internal method to loop through collection and show each child view.
  _showCollection: function _showCollection(models) {
    _.each(models, _.bind(this._addChild, this));
    this.children._updateLength();
  },


  // Allow the collection to be sorted by a custom view comparator
  _filteredSortedModels: function _filteredSortedModels(addedAt) {
    if (!this.collection || !this.collection.length) {
      return [];
    }

    var viewComparator = this.getViewComparator();
    var models = this.collection.models;
    addedAt = Math.min(Math.max(addedAt, 0), models.length - 1);

    if (viewComparator) {
      var addedModel = void 0;
      // Preserve `at` location, even for a sorted view
      if (addedAt) {
        addedModel = models[addedAt];
        models = models.slice(0, addedAt).concat(models.slice(addedAt + 1));
      }
      models = this._sortModelsBy(models, viewComparator);
      if (addedModel) {
        models.splice(addedAt, 0, addedModel);
      }
    }

    // Filter after sorting in case the filter uses the index
    models = this._filterModels(models);

    return models;
  },
  getViewComparator: function getViewComparator() {
    return this.viewComparator;
  },


  // Filter an array of models, if a filter exists
  _filterModels: function _filterModels(models) {
    var _this5 = this;

    if (this.filter) {
      models = _.filter(models, function (model, index) {
        return _this5._shouldAddChild(model, index);
      });
    }
    return models;
  },
  _sortModelsBy: function _sortModelsBy(models, comparator) {
    if (typeof comparator === 'string') {
      return _.sortBy(models, function (model) {
        return model.get(comparator);
      });
    } else if (comparator.length === 1) {
      return _.sortBy(models, _.bind(comparator, this));
    } else {
      return _.clone(models).sort(_.bind(comparator, this));
    }
  },


  // Internal method to show an empty view in place of a collection of child views,
  // when the collection is empty
  _showEmptyView: function _showEmptyView() {
    var EmptyView = this._getEmptyView();

    if (EmptyView && !this._showingEmptyView) {
      this._showingEmptyView = true;

      var model = new Backbone.Model();
      var emptyViewOptions = this.emptyViewOptions || this.childViewOptions;
      if (_.isFunction(emptyViewOptions)) {
        emptyViewOptions = emptyViewOptions.call(this, model, this._emptyViewIndex);
      }

      var view = this.buildChildView(model, EmptyView, emptyViewOptions);

      this.triggerMethod('before:render:empty', this, view);
      this.addChildView(view, 0);
      this.triggerMethod('render:empty', this, view);
    }
  },


  // Internal method to destroy an existing emptyView instance if one exists. Called when
  // a collection view has been rendered empty, and then a child is added to the collection.
  _destroyEmptyView: function _destroyEmptyView() {
    if (this._showingEmptyView) {
      this.triggerMethod('before:remove:empty', this);

      this._destroyChildren();
      delete this._showingEmptyView;

      this.triggerMethod('remove:empty', this);
    }
  },


  // Retrieve the empty view class
  _getEmptyView: function _getEmptyView() {
    var emptyView = this.emptyView;

    if (!emptyView) {
      return;
    }

    return this._getView(emptyView);
  },


  // Retrieve the `childView` class
  // The `childView` property can be either a view class or a function that
  // returns a view class. If it is a function, it will receive the model that
  // will be passed to the view instance (created from the returned view class)
  _getChildView: function _getChildView(child) {
    var childView = this.childView;

    if (!childView) {
      throw new MarionetteError({
        name: 'NoChildViewError',
        message: 'A "childView" must be specified'
      });
    }

    childView = this._getView(childView, child);

    if (!childView) {
      throw new MarionetteError({
        name: 'InvalidChildViewError',
        message: '"childView" must be a view class or a function that returns a view class'
      });
    }

    return childView;
  },


  // First check if the `view` is a view class (the common case)
  // Then check if it's a function (which we assume that returns a view class)
  _getView: function _getView(view, child) {
    if (view.prototype instanceof Backbone.View || view === Backbone.View) {
      return view;
    } else if (_.isFunction(view)) {
      return view.call(this, child);
    }
  },


  // Internal method for building and adding a child view
  _addChild: function _addChild(child, index) {
    var view = this._createView(child, index);
    this.addChildView(view, index);

    return view;
  },
  _getChildViewOptions: function _getChildViewOptions(child, index) {
    if (_.isFunction(this.childViewOptions)) {
      return this.childViewOptions(child, index);
    }

    return this.childViewOptions;
  },


  // Render the child's view and add it to the HTML for the collection view at a given index.
  // This will also update the indices of later views in the collection in order to keep the
  // children in sync with the collection.
  addChildView: function addChildView(view, index) {
    this.triggerMethod('before:add:child', this, view);
    this._setupChildView(view, index);

    // Store the child view itself so we can properly remove and/or destroy it later
    if (this._isBuffering) {
      // Add to children, but don't update children's length.
      this.children._add(view);
    } else {
      // increment indices of views after this one
      this._updateIndices(view, true);
      this.children.add(view);
    }

    renderView(view);

    this._attachView(view, index);

    this.triggerMethod('add:child', this, view);

    return view;
  },


  // Internal method. This decrements or increments the indices of views after the added/removed
  // view to keep in sync with the collection.
  _updateIndices: function _updateIndices(views, increment) {
    if (!this.sort) {
      return;
    }

    if (!increment) {
      _.each(_.sortBy(this.children._views, '_index'), function (view, index) {
        view._index = index;
      });

      return;
    }

    var view = _.isArray(views) ? _.max(views, '_index') : views;

    if (_.isObject(view)) {
      // update the indexes of views after this one
      _.each(this.children._views, function (laterView) {
        if (laterView._index >= view._index) {
          laterView._index += 1;
        }
      });
    }
  },
  _attachView: function _attachView(view, index) {
    // Only trigger attach if already attached and not buffering,
    // otherwise _endBuffering() or Region#show() handles this.
    var shouldTriggerAttach = !view._isAttached && !this._isBuffering && this._isAttached && this.monitorViewEvents !== false;

    if (shouldTriggerAttach) {
      triggerMethodOn(view, 'before:attach', view);
    }

    this.attachHtml(this, view, index);

    if (shouldTriggerAttach) {
      view._isAttached = true;
      triggerMethodOn(view, 'attach', view);
    }
  },


  // Build a `childView` for a model in the collection.
  buildChildView: function buildChildView(child, ChildViewClass, childViewOptions) {
    var options = _.extend({ model: child }, childViewOptions);
    return new ChildViewClass(options);
  },


  // Remove the child view and destroy it. This function also updates the indices of later views
  // in the collection in order to keep the children in sync with the collection.
  removeChildView: function removeChildView(view) {
    if (!view || view._isDestroyed) {
      return view;
    }

    this._removeChildView(view);
    this.children._updateLength();
    // decrement the index of views after this one
    this._updateIndices(view, false);
    return view;
  },


  // check if the collection is empty or optionally whether an array of pre-processed models is empty
  isEmpty: function isEmpty(options) {
    var models = void 0;
    if (_.result(options, 'processedModels')) {
      models = options.processedModels;
    } else {
      models = this.collection ? this.collection.models : [];
      models = this._filterModels(models);
    }
    return models.length === 0;
  },


  // You might need to override this if you've overridden attachHtml
  attachBuffer: function attachBuffer(collectionView, buffer) {
    this.Dom.appendContents(collectionView.el, buffer, { _$el: collectionView.$el });
  },


  // Create a fragment buffer from the currently buffered children
  _createBuffer: function _createBuffer() {
    var _this6 = this;

    var elBuffer = this.Dom.createBuffer();
    _.each(this._bufferedChildren, function (b) {
      _this6.Dom.appendContents(elBuffer, b.el, { _$contents: b.$el });
    });
    return elBuffer;
  },


  // Append the HTML to the collection's `el`. Override this method to do something other
  // than `.append`.
  attachHtml: function attachHtml(collectionView, childView, index) {
    if (collectionView._isBuffering) {
      // buffering happens on reset events and initial renders
      // in order to reduce the number of inserts into the
      // document, which are expensive.
      collectionView._bufferedChildren.splice(index, 0, childView);
    } else {
      // If we've already rendered the main collection, append
      // the new child into the correct order if we need to. Otherwise
      // append to the end.
      if (!collectionView._insertBefore(childView, index)) {
        collectionView._insertAfter(childView);
      }
    }
  },


  // Internal method. Check whether we need to insert the view into the correct position.
  _insertBefore: function _insertBefore(childView, index) {
    var currentView = void 0;
    var findPosition = this.sort && index < this.children.length - 1;
    if (findPosition) {
      // Find the view after this one
      currentView = _.find(this.children._views, function (view) {
        return view._index === index + 1;
      });
    }

    if (currentView) {
      this.beforeEl(currentView.el, childView.el);
      return true;
    }

    return false;
  },


  // Override to handle DOM inserting differently
  beforeEl: function beforeEl(el, siblings) {
    this.$(el).before(siblings);
  },


  // Internal method. Append a view to the end of the $el
  _insertAfter: function _insertAfter(childView) {
    this.Dom.appendContents(this.el, childView.el, { _$el: this.$el, _$contents: childView.$el });
  },


  // Internal method to set up the `children` object for storing all of the child views
  _initChildViewStorage: function _initChildViewStorage() {
    this.children = new Container();
  },


  // called by ViewMixin destroy
  _removeChildren: function _removeChildren() {
    this._destroyChildren();
  },


  // Destroy the child views that this collection view is holding on to, if any
  _destroyChildren: function _destroyChildren(options) {
    if (!this.children.length) {
      return;
    }

    this.triggerMethod('before:destroy:children', this);
    _.each(this.children._views, _.bind(this._removeChildView, this));
    this.children._updateLength();
    this.triggerMethod('destroy:children', this);
  },


  // Return true if the given child should be shown. Return false otherwise.
  // The filter will be passed (child, index, collection), where
  //  'child' is the given model
  //  'index' is the index of that model in the collection
  //  'collection' is the collection referenced by this CollectionView
  _shouldAddChild: function _shouldAddChild(child, index) {
    var filter = this.filter;
    return !_.isFunction(filter) || filter.call(this, child, index, this.collection);
  }
}, {
  setDomApi: setDomApi
});

_.extend(CollectionView.prototype, ViewMixin);

// Composite View
// --------------

var MarionetteError$1 = Marionette.Error;
var View = Marionette.View;

var ClassOptions$1 = ['childViewContainer', 'template', 'templateContext'];

// Used for rendering a branch-leaf, hierarchical structure.
// Extends directly from CollectionView
// @deprecated
var CompositeView = CollectionView.extend({

  // Setting up the inheritance chain which allows changes to
  // Marionette.CollectionView.prototype.constructor which allows overriding
  // option to pass '{sort: false}' to prevent the CompositeView from
  // maintaining the sorted order of the collection.
  // This will fallback onto appending childView's to the end.
  constructor: function constructor(options) {
    this.mergeOptions(options, ClassOptions$1);

    CollectionView.prototype.constructor.apply(this, arguments);
  },


  // Configured the initial events that the composite view
  // binds to. Override this method to prevent the initial
  // events, or to add your own initial events.
  _initialEvents: function _initialEvents() {

    // Bind only after composite view is rendered to avoid adding child views
    // to nonexistent childViewContainer

    if (this.collection) {
      this.listenTo(this.collection, 'add', this._onCollectionAdd);
      this.listenTo(this.collection, 'update', this._onCollectionUpdate);
      this.listenTo(this.collection, 'reset', this.renderChildren);

      if (this.sort) {
        this.listenTo(this.collection, 'sort', this._sortViews);
      }
    }
  },


  // Retrieve the `childView` to be used when rendering each of
  // the items in the collection. The default is to return
  // `this.childView` or Marionette.CompositeView if no `childView`
  // has been defined. As happens in CollectionView, `childView` can
  // be a function (which should return a view class).
  _getChildView: function _getChildView(child) {
    var childView = this.childView;

    // for CompositeView, if `childView` is not specified, we'll get the same
    // composite view class rendered for each child in the collection
    // then check if the `childView` is a view class (the common case)
    // finally check if it's a function (which we assume that returns a view class)
    if (!childView) {
      return this.constructor;
    }

    childView = this._getView(childView, child);

    if (!childView) {
      throw new MarionetteError$1({
        name: 'InvalidChildViewError',
        message: '"childView" must be a view class or a function that returns a view class'
      });
    }

    return childView;
  },


  // Return the serialized model
  serializeData: function serializeData() {
    return this.serializeModel();
  },


  // Renders the model and the collection.
  render: function render() {
    if (this._isDestroyed) {
      return this;
    }
    this._isRendering = true;
    this.resetChildViewContainer();

    this.triggerMethod('before:render', this);

    this._renderTemplate();
    this.bindUIElements();
    this.renderChildren();

    this._isRendering = false;
    this._isRendered = true;
    this.triggerMethod('render', this);
    return this;
  },
  renderChildren: function renderChildren() {
    if (this._isRendered || this._isRendering) {
      CollectionView.prototype._renderChildren.call(this);
    }
  },


  // You might need to override this if you've overridden attachHtml
  attachBuffer: function attachBuffer(compositeView, buffer) {
    var $container = this.getChildViewContainer(compositeView);
    this.Dom.appendContents($container[0], buffer, { _$el: $container });
  },


  // Internal method. Append a view to the end of the $el.
  // Overidden from CollectionView to ensure view is appended to
  // childViewContainer
  _insertAfter: function _insertAfter(childView) {
    var $container = this.getChildViewContainer(this, childView);
    this.Dom.appendContents($container[0], childView.el, { _$el: $container, _$contents: childView.$el });
  },


  // Internal method. Append reordered childView'.
  // Overidden from CollectionView to ensure reordered views
  // are appended to childViewContainer
  _appendReorderedChildren: function _appendReorderedChildren(children) {
    var $container = this.getChildViewContainer(this);
    this.Dom.appendContents($container[0], children, { _$el: $container });
  },


  // Internal method to ensure an `$childViewContainer` exists, for the
  // `attachHtml` method to use.
  getChildViewContainer: function getChildViewContainer(containerView, childView) {
    if (!!containerView.$childViewContainer) {
      return containerView.$childViewContainer;
    }

    var container = void 0;
    var childViewContainer = containerView.childViewContainer;
    if (childViewContainer) {

      var selector = _.result(containerView, 'childViewContainer');

      if (selector.charAt(0) === '@' && containerView.ui) {
        container = containerView.ui[selector.substr(4)];
      } else {
        container = this.$(selector);
      }

      if (container.length <= 0) {
        throw new MarionetteError$1({
          name: 'ChildViewContainerMissingError',
          message: 'The specified "childViewContainer" was not found: ' + containerView.childViewContainer
        });
      }
    } else {
      container = containerView.$el;
    }

    containerView.$childViewContainer = container;
    return container;
  },


  // Internal method to reset the `$childViewContainer` on render
  resetChildViewContainer: function resetChildViewContainer() {
    if (this.$childViewContainer) {
      this.$childViewContainer = undefined;
    }
  }
});

// To prevent duplication but allow the best View organization
// Certain View methods are mixed directly into the deprecated CompositeView
var MixinFromView = _.pick(View.prototype, 'serializeModel', 'getTemplate', '_renderTemplate', '_renderHtml', 'mixinTemplateContext', 'attachElContent');
_.extend(CompositeView.prototype, MixinFromView);

Marionette.OldCollectionView = CollectionView;
Marionette.OldCompositeView = CompositeView;

export { CollectionView as OldCollectionView, CompositeView as OldCompositeView };
//# sourceMappingURL=marionette.oldcollectionview.esm.js.map
