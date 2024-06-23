const path = require('path')

module.exports = {
  devtool: "inline-source-map",

  entry: {
    "background/index": "./src/background/index",
    "content_scripts/youtube": "./src/content_scripts/youtube",
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "build/js")
  },
  resolve: {
    extensions: [".ts", ".tsx"]
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  }
}
