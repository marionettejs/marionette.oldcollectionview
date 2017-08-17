import gulp from 'gulp';
import uglifyjs from 'uglify-js';
import runSequence from 'run-sequence';
import fs from 'fs';

import { rollup } from 'rollup';
import babel from 'rollup-plugin-babel';
import json from 'rollup-plugin-json';

import banner from './_banner';
import pkg from '../package.json';

const srcPath = 'src/';

const rollupGlobals = {
  'backbone': 'Backbone',
  'underscore': '_',
  'backbone.marionette': 'Backbone.Marionette'
};

function makeESModule(bundle) {
  bundle.write({
    format: 'es',
    dest: 'lib/marionette.oldcollectionview.esm.js',
    sourceMap: true,
    sourceMapFile: 'marionette.oldcollectionview.esm.js',
    banner: banner,
    globals: rollupGlobals
  });
}

function generateBundle(bundle) {
  return bundle.generate({
    format: 'umd',
    moduleName: 'oldcollectionview',
    sourceMap: true,
    sourceMapFile: 'marionette.oldcollectionview.js',
    banner: banner,
    globals: rollupGlobals
  });
}

function makeBundle(buildPath) {
  const buildFile = buildPath + pkg.name + '.js';

  return rollup({
    entry: srcPath + 'old.js',
    external: ['underscore', 'backbone', 'backbone.marionette'],
    plugins: [
      json(),
      babel({
        sourceMaps: true,
        presets: [['es2015', {modules: false}]],
        babelrc: false
      })
    ]
  }).then(bundle => {
    // Only build the ES6 module if this is the main build
    if (buildFile === pkg.main) {
      makeESModule(bundle);
    }
    return generateBundle(bundle);
  });
}

function build(buildPath) {
  return makeBundle(buildPath).then(gen => {
    fs.writeFileSync(buildPath + pkg.name + '.js', gen.code  +
      '//# sourceMappingURL=' + pkg.name + '.js.map\n' );
    fs.writeFileSync(buildPath + pkg.name + '.js.map', gen.map.toString());
    var minified = uglifyjs.minify(gen.code, {sourceMap: {
        content: gen.map,
        filename: 'marionette.oldcollectionview.min.js',
        url: 'marionette.oldcollectionview.min.js.map'
      },
      output: {
        comments: 'some'
      }
    });

    if (minified.error) {
      throw 'uglify-js error: ' + minified.error
    }

    fs.writeFileSync(buildPath + pkg.name + '.min.js', minified.code);
    fs.writeFileSync(buildPath + pkg.name + '.min.js.map', minified.map);
  });
}

gulp.task('build-test', ['lint-test'], function() {
  return build('tmp/lib/');
});

gulp.task('build-lib', ['lint-src'], function() {
  return build('lib/');
});

gulp.task('build', function(done) {
  runSequence('build-lib', done);
});
