import gulp from 'gulp';
import util from 'gulp-util';
import livereload from 'gulp-livereload';

import { rollup } from 'rollup';
import babel from 'rollup-plugin-babel';
import multiEntry from 'rollup-plugin-multi-entry';
import nodeResolve from 'rollup-plugin-node-resolve';
import nodeGlobals from 'rollup-plugin-node-globals';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import opn from 'opn';

function bundle() {
  return rollup({
    entry: ['./test/setup/browser.js', './test/unit/**/*.js'],
    plugins: [
      multiEntry(),
      nodeResolve({ main: true }),
      commonjs(),
      nodeGlobals(),
      json(),
      babel({
        sourceMaps: true,
        presets: [ ['es2015', {modules: false}] ],
        babelrc: false,
        exclude: 'node_modules/**'
      })
    ]
  }).then(bundle => bundle.write({
    format: 'iife',
    sourceMap: true,
    moduleName: 'MnTests',
    dest: './tmp/__spec-build.js'
  }).then(livereload.reload('./tmp/__spec-build.js')));
}

function browserWatch() {
  livereload.listen({port: 35729, host: 'localhost', start: true});
  opn('./test/runner.html');
  gulp.watch(['src/**/*.js', 'test/**/*.js'], ['browser-bundle']);
}

gulp.task('browser-bundle', ['lint-src', 'lint-test'], bundle);

gulp.task('test-browser', ['browser-bundle'], browserWatch);

