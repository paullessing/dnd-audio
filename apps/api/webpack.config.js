const GeneratePackageJsonPlugin = require('generate-package-json-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const packageJson = require('../../package.json');

const basePackage = {
  "name": "@dnd-audio/api",
  "version": packageJson.version,
  "main": "./main.js",
  "license": packageJson.license,
  "dependencies": {
    // Dependencies that the GeneratePackageJsonPlugin doesn't auto-detect have to be added manually here
    "reflect-metadata": "",
    "rxjs": "",
    "@nestjs/platform-express": "",
    "@nestjs/platform-socket.io": "",
  },
};

module.exports = (config, context) => {
  return {
    ...config,
    plugins: [
      ...config.plugins,
      new GeneratePackageJsonPlugin(basePackage, {
        // Using the declared versions rather than installed ensures that yarn.lock will match,
        // otherwise you get mismatches caused by a too specific version in package.json
        // that's not found in the lockfile
        useInstalledVersions: false
      }),
      new CopyWebpackPlugin({
        patterns: [{
          from: 'yarn.lock',
          to: 'yarn.lock'
        }]
      })
    ]
  };
};
