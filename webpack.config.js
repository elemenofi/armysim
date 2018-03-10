var webpack = require('webpack');
var path = require('path');

module.exports = {
  devtool: 'eval',
  entry: [
    './src/game/entities/game.ts'
  ],
  output: {
    filename: 'bundle.js',
    path: path.resolve('src/lib')
  },
  resolve: {
    extensions: ['', '.ts', '.tsx', '.js', '.jsx'],
    modulesDirectories: ['src', 'node_modules'],
  },
  module: {
    noParse: [/^react$/, /^chance$/, /^react-dom$/, /^date$/, /^bundle$/, /^jasmine$/],
    loaders: [
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
  }
};
