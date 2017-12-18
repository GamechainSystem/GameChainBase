/**
 * Created by xiangxn on 2016/12/10.
 */
let path = require('path');
let webpack = require('webpack');
let ExtractTextPlugin = require('extract-text-webpack-plugin');
// var git = require("git-rev-sync");

var root_dir = path.resolve(__dirname);

module.exports = {
    entry: [path.resolve(root_dir, './app/main.js')],//'babel-polyfill'
    output: {
        path: path.resolve(root_dir, 'build/assets'),
        filename: 'bundle.js',
        publicPath: './'
    },
    module: {
        loaders: [
            {
                test: /\.js|jsx$/,
                exclude: [/node_modules/],
                loaders: ['babel?presets[]=es2015,presets[]=react,presets[]=stage-0']
            },
            {
                test: /\.scss|\.css$/,
                loader: ExtractTextPlugin.extract('style', 'css!postcss!sass')
                //loader: 'css!sass?sourceMap'
            },
            {
                test: /\.(png|jpg|jpeg|gif|woff|woff2|otf|eot|ttf|svg)$/, loader: 'url?limit=8192'
            },
            {
                test: /\.json$/, loader: 'json',
                exclude: [
                    path.resolve(root_dir, "common")
                ]
            },
            {
                test:/\.worker\.js$/,
                loader: 'worker-loader'
            }
        ]
    },
    postcss: [
        require('autoprefixer')
    ],
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify('production')
            },
            // APP_VERSION: JSON.stringify(git.tag()),
            __BASE_URL__: JSON.stringify("assets"),
            __HASHHISTORY__: true
        }),
        new webpack.optimize.UglifyJsPlugin({
            output: {comments: false},
            compress: {warnings: false}
        }),
        new ExtractTextPlugin('style.css', {allChunks: true})
    ]
};