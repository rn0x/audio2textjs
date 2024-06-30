1. **Main Application Folder:**

   Contains two files:
   - `index.js`: Main CLI application code.
   - `package.json`: Specifies application details and used libraries.

2. **Steps:**

   - Install the `commander` library for command-line input parsing:

     ```bash
     npm install commander
     ```

3. **Code:**

   - `index.js`:

     ```javascript
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
     ```

4. **Code Explanation:**

   - Uses `commander` to parse options and arguments passed through the command line.
   - Defines path options (`input` and `output`) and additional options for the converter model (`model`) and spoken language (`language`).
   - Creates an instance of `Audio2TextJS` and executes it to convert the audio file to text.
   - Displays the converted text upon successful conversion, optionally saving the result to a file.
   - Handles errors and prints error messages if conversion or saving fails.

5. **Running the Application:**

   - Save the code in a file named `index.js`.
   - Run the following command in the application folder to test it:

     ```bash
     node index.js -i path/to/input/audio.wav -m base -l en -o path/to/output/transcription.txt
     ```

     The application will convert the specified audio file (`audio.wav`) using the `base` model and `en` language, saving the converted text to (`transcription.txt`).

This is a simple example of a CLI application using `Audio2TextJS`, which can be modified and expanded according to your application's specific needs.