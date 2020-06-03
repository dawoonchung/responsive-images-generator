const yargs = require('yargs');

const {argv} = yargs
    .option('source', {
      alias: 's',
      description: 'Source directory containing images to process.',
      type: 'string',
    }).default('source', 'src')
    .option('baseSize', {
      alias: 'S',
      description: 'Base size of the image. Use \'md\' breakpoint.',
    }).demandOption(['baseSize'], 'You must specify base size.')
    .option('build', {
      alias: 'b',
      description: 'Destination folder to generate assets.',
      type: 'string',
    }).default('build', 'build')
    .option('alt', {
      alias: 'a',
      description: 'JSON file containing alt texts. See documentation for the JSON structure.', // eslint-disable-line
      type: 'string',
    }).default('alt', 'alt.json')
    .help()
    .alias('help', 'h');

module.exports = argv;
