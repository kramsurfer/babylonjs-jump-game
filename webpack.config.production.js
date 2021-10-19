const path = require("path");
const fs = require("fs");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const appDirectory = fs.realpathSync(process.cwd());

module.exports = {
    mode: "production",
    entry: path.resolve(appDirectory, "src/App.ts"), //path to the main .ts file
    output: {
        filename: "js/bundleName.js", //name for the js file that is created/compiled in memory
    },

    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },

    devServer: {
        // Enable compression
        compress: false,
        // Enable hot reloading
        hot: true,
        //host: '192.168.1.253',
        host: '192.168.1.239',
        port: 3000,
        https: true
    },

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"],
            }
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            inject: true,
            template: path.resolve(appDirectory, "public/index.html"),
        })

    ],

};
