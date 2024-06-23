const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
  devtool: "inline-source-map",

  entry: {
    "js/background/index": "./src/background/index",
    "js/content_scripts/youtube": "./src/content_scripts/youtube",
  },
  output: {
    filename: "[name].js",
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
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: "./manifest.json" },
        {
          from: "./assets",
          to: "assets"
        },
        {
          from: "./data",
          to: "data"
        }
      ],
    }),
    // webpack-ext-loader doesn't work because of the same error as next issue
    // https://github.com/SimplifyJobs/webpack-ext-reloader/issues/28#issuecomment-1812405678
  ]
}
