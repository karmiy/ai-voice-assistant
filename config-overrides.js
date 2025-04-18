const webpack = require('webpack');

module.exports = function override(config) {
  // 添加必要的 polyfills
  // config.resolve.fallback = {
  //   ...config.resolve.fallback,
  //   'readable-stream': require.resolve('readable-stream'),
  //   'base64-js': require.resolve('base64-js'),
  //   buffer: require.resolve('buffer'),
  //   process: require.resolve('process/browser'),
  //   stream: require.resolve('stream-browserify'),
  // };

  // 添加 webpack 插件
  // config.plugins.push(
  //   new webpack.DefinePlugin({
  //     'process.browser': JSON.stringify(true),
  //     'process.env': {
  //       NODE_ENV: JSON.stringify(process.env.NODE_ENV),
  //     },
  //   }),
  //   new webpack.ProvidePlugin({
  //     process: 'process/browser',
  //     Buffer: ['buffer', 'Buffer'],
  //   })
  // );

  return config;
}; 