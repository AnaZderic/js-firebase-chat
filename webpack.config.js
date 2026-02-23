const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/app.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        type: 'javascript/esm',
        resolve: {
          fullySpecified: false,
        },
      },
    ],
  },
  devServer: {
    static: __dirname,
    compress: true,
    port: 8080,
    open: true,
  },
};