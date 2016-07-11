
module.exports = {
  entry: "./client/entry.js",
  output: {
    path: __dirname + "/lib",
    publicPath: '/',
    filename: 'boundle.js'
  },

  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel-loader',
      query: {
        presets: ['es2015']
      }
    }]
  },
  resolve: {
    extensions: ['', '.js']
  }
};

