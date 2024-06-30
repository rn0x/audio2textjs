#!/usr/bin/env node

import { Command } from 'commander/esm.mjs'; // Import using ES modules
import Audio2TextJS from '../../src/Audio2TextJS.js'; // Import Audio2TextJS class

// Create a new Command instance
const program = new Command();

// Set application description
program.description('Convert speech audio file to text using Audio2TextJS.');

// Define command options and arguments
program
  .requiredOption('-i, --input <input>', 'Path to input audio file')
  .option('-m, --model <model>', 'Name of the model to use', 'base')
  .option('-l, --language <language>', 'Spoken language for transcription', 'auto')
  .option('-o, --output <output>', 'Path to save output file', 'output.txt');

// Handle command execution
program.parse(process.argv);

const options = program.opts();

// Validate required input option
if (!options.input) {
  console.error('Error: Required option -i, --input <input> is missing.');
  process.exit(1);
}

// Create an instance of Audio2TextJS
const converter = new Audio2TextJS();

// Run Audio2TextJS to convert audio to text
converter.runWhisper(options.input, options.model, options.language)
  .then(result => {
    if (result.success) {
      console.log('Conversion successful.');
      console.log('Transcribed text:');
      console.log(result.output);
      // Optionally save output to file
      return fs.writeFile(options.output, result.output);
    } else {
      console.error('Conversion failed:', result.message);
      process.exit(1);
    }
  })
  .then(() => {
    console.log(`Transcribed text saved to ${options.output}`);
  })
  .catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });