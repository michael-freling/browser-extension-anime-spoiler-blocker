const path = require('path')
const webpack = require('webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const dotenv = require('dotenv')

dotenv.config();

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
        }
      ],
    }),
    // Using dotenv-webpack caused an error for Unreferenced variable process
    // https://stackoverflow.com/a/60015581
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(process.env)
   })
    // webpack-ext-loader doesn't work because of the same error as next issue
    // https://github.com/SimplifyJobs/webpack-ext-reloader/issues/28#issuecomment-1812405678
  ]
}
