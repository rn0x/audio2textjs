// test.js

import Audio2TextJS from '../src/Audio2TextJS.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

async function testSpeechToText() {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));

    const converter = new Audio2TextJS({
        outputJson: true,
        outputTxt: true
    });

    const inputFile = path.join(__dirname, 'test.mp3');
    const model = 'small'; // Choose the appropriate model from the available models
    const language = 'auto'; // Or specify the language manually if necessary

    try {
        const result = await converter.runWhisper(inputFile, model, language);
        console.log(result);
        if (result.success) return console.log('Whisper process result:', result.message);
    } catch (error) {
        console.error('Error running Whisper:', error);
    }
}

testSpeechToText();
