module.exports = {
    entry: './src/meme.js',
    output: {
        path: './dist',
        filename: 'meme.js',
        library: 'MemeMaker',
        libraryTarget: 'umd'
    },
    module: {
        loaders: [ {
            test: /\.js$/,
            exclude: /node_modules/,
            loader: "babel-loader",
            query: {
                plugins: [ 'transform-runtime', 'add-module-exports' ]
            }
        } ]
    }
};
