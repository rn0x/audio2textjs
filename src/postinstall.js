/**
 * LICENSE MIT
 * Copyright (c) 2024 rn0x
 * github: https://github.com/rn0x
 * telegram: https://t.me/F93ii
 * repository: https://github.com/rn0x/Audio2TextJS
 */

// postinstall.js

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fetchBinFiles from './fetchBinFiles.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Function to download dependencies based on current OS and architecture.
 * @returns {Promise<void>} Promise that resolves when dependencies are downloaded.
 */
async function downloadDependencies() {
    const os = process.platform; // Get current operating system
    const arch = process.arch; // Get current processor architecture
    
    const destDir = path.join(__dirname, 'bin'); // Target directory to store files
    
    try {
        // Download files using fetchBinFiles function
        const programs = ['whisper', 'ffprobe', 'ffmpeg'];
        const result = await fetchBinFiles(os, arch, programs, destDir);

        if (result.success) {
            console.log('Library installed successfully.');
        } else {
            console.error('Failed to install library. Please check logs for details.');
        }
    } catch (error) {
        console.error('An error occurred while installing the library:', error.message);
    }
}

// Execute the download process
downloadDependencies()
    .catch(err => {
        console.error('Unhandled error during installation:', err);
        process.exitCode = 1; // Set non-zero exit code for failure
    });

/**
 * JSDoc comment for the entire file/module.
 * @module postinstall
 */