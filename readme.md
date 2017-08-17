<h1 align="center">Marionette.js</h1>
<p align="center">
  <img title="backbone marionette" src='https://github.com/marionettejs/backbone.marionette/raw/master/marionette-logo.png' />
</p>
<p align="center">Marionette OldCollectionView</p>
<p align="center">
  <a title='Build Status' href="https://travis-ci.org/marionettejs/marionette.oldcollectionview">
  <img src='https://secure.travis-ci.org/marionettejs/marionette.oldcollectionview.svg?branch=master' />
  </a>
  <a href='https://coveralls.io/r/marionettejs/marionette.oldcollectionview'>
  <img src='https://img.shields.io/coveralls/marionettejs/marionette.oldcollectionview.svg' alt='Coverage Status' />
  </a>
  <a href='https://gitter.im/marionettejs/backbone.marionette?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=body_badge'>
    <img src='https://badges.gitter.im/Join%20Chat.svg' alt='Gitter Chat' />
  </a>
</p>

## Marionette v3 CollectionView

This repo contains the `CollectionView` and `CompositeView` classes from Marionette v3.
In future versions of Marionette these classes may be removed or replaced.
This library attached `OldCollectionView` and `OldCompositeView` to `Marionette`
as well as exporting them so that the following is true:
```js
import Marionette from 'backbone.marionette';
import { OldCollectionView, OldCompositeView } from 'marionette.oldcollectionview';

Marionette.OldCollectionView === OldCollectionView; // true
Marionette.OldCompositeView === OldCompositeView; // true
```

## Documentation

All of the documentation for Marionette.OldCollectionView can be found at

##### [github.com/marionettejs/marionette.oldcollectionview/tree/master/docs](https://github.com/marionettejs/marionette.oldcollectionview/tree/master/docs)

The documentation has not been modified from its original state in Marionette.

### Chat with us

Find us [on gitter](https://gitter.im/marionettejs/backbone.marionette)

We're happy to discuss design patterns and learn how you're using Marionette.


