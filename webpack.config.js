const webpack = require('@nativescript/webpack');

module.exports = (env) => {
  webpack.init(env);

  webpack.Utils.addCopyRule({
    from: 'assets/**/*',
    context: webpack.Utils.project.getProjectFilePath('src'),
    noErrorOnMissing: true,
  });

  return webpack.resolveConfig();
};