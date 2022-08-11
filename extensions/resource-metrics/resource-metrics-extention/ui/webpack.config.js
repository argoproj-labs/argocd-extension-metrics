const path = require('path');

// What are the options for groupKind
const groupKind = 'argoproj.io/Rollout';
const extName = 'Metrics';

const config = {
  entry: {
    extension: './src/index.tsx',
  },
  output: {
    filename: `extensions-${extName}.js`,
    path: __dirname + `/dist/resources/extension-${extName}.js`,
    libraryTarget: 'window',
    library: ['tmp', 'extensions'],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json', '.ttf'],
  },
  externals: {
    react: 'React',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          allowTsInNodeModules: true,
          configFile: path.resolve('./src/tsconfig.json')
        },
      },
      {
        test: /\.scss$/,
        use: ['style-loader', 'raw-loader', 'sass-loader'],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'raw-loader'],
      },
    ],
  },
};

module.exports = config;