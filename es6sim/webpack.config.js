var webpack = require('webpack');
var path = require('path');
var WebpackNotifierPlugin = require('webpack-notifier');

module.exports = {
  devtool: 'eval',
  // This will be our app's entry point (webpack will look for it in the 'src' directory due to the modulesDirectory setting below). Feel free to change as desired.
  entry: [
    './es6sim/game.tsx'
  ],
  // Output the bundled JS to dist/app.js
  output: {
    filename: 'bundle.js',
    path: path.resolve('es6sim/lib')
  },
  resolve: {
    // Look for modules in .ts(x) files first, then .js(x)
    extensions: ['', '.ts', '.tsx', '.js', '.jsx'],
    // Add 'src' to our modulesDirectories, as all our app code will live in there, so Webpack should look in there for modules
    modulesDirectories: ['es6sim', 'node_modules'],
  },
  module: {
    noParse: [/^react$/, /^chance$/, /^react-dom$/, /^date$/, /^bundle$/],
    loaders: [
      // .ts(x) files should first pass through the Typescript loader, and then through babel
      {
        test: /\.ts(x?)$/,
        loader: 'babel-loader!ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
            presets: ['es2015', 'react', 'stage-0']
        }
      }
    ]
  },
  plugins: [
    // Set up the notifier plugin - you can remove this (or set alwaysNotify false) if desired
    // new WebpackNotifierPlugin({ alwaysNotify: true }),
  ]
};
