// Error
// -----

import _ from 'underscore';
import { View } from 'backbone.marionette';

const extend = View.extend;

const errorProps = ['description', 'fileName', 'lineNumber', 'name', 'message', 'number'];

const MarionetteError = extend.call(Error, {
  urlRoot: 'https://github.com/marionettejs/marionette.oldcollectionview/tree/master/',

  constructor(message, options) {
    if (_.isObject(message)) {
      options = message;
      message = options.message;
    } else if (!options) {
      options = {};
    }

    const error = Error.call(this, message);
    _.extend(this, _.pick(error, errorProps), _.pick(options, errorProps));

    this.captureStackTrace();

    if (options.url) {
      this.url = this.urlRoot + options.url;
    }
  },

  captureStackTrace() {
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MarionetteError);
    }
  },

  toString() {
    return this.name + ': ' + this.message + (this.url ? ' See: ' + this.url : '');
  }
});

MarionetteError.extend = extend;

export default MarionetteError;
