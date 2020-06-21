/* eslint-disable max-len */
const yargs = require('yargs');

const {argv} = yargs.options({
  buildPath: {
    alias: 't',
    default: 'build',
    description: 'Path to target directory to export assets.',
    normalize: true,
    type: 'string',
  },
  configFile: {
    alias: 'c',
    default: 'config.js',
    description: 'Path to configuration file. See documentation for details.',
    normalize: true,
    type: 'string',
  },
  lazyload: {
    alias: 'l',
    description: 'Whether or not to use lazyloading',
    type: 'boolean',
  },
  source: {
    alias: 'd',
    default: 'src',
    description: 'Path to directory containing source image files.',
    normalize: true,
    type: 'string',
  },
  webp: {
    default: true,
    description: 'Whether or not to output webp images.',
    type: 'boolean',
  },
}).help().alias('help', 'h');

module.exports = argv;
