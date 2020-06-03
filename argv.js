/* eslint-disable max-len */
const yargs = require('yargs');

const {argv} = yargs.options({
  altText: {
    alias: 'a',
    default: 'alt.js',
    description: 'Path to file containing alt texts. See documentation for the file structure.',
    normalize: true,
    type: 'string',
  },
  baseSize: {
    alias: 's',
    demandOption: true,
    description: 'Base size of the image, or path to the file containing base sizes. Use \'md\' breakpoint. See documentation for details.',
    normalize: true,
  },
  buildPath: {
    alias: 't',
    default: 'build',
    description: 'Path to target directory to export assets.',
    normalize: true,
    type: 'string',
  },
  className: {
    alias: 'c',
    description: 'HTML class name',
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
}).help().alias('help', 'h');

module.exports = argv;
