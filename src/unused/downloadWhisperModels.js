/**
 * LICENSE MIT
 * Copyright (c) 2024 rn0x
 * github: https://github.com/rn0x
 * telegram: https://t.me/F93ii
 * repository: https://github.com/rn0x/Audio2TextJS
 */

import { spawn } from 'node:child_process';
import { platform } from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Download Whisper models using a shell script.
 * @param {'tiny'|'tiny.en'|'base'|'base.en'|'small'|'small.en'|'medium'|'medium.en'|'large-v1'|'large'} model - The name of the model to download. Must be one of "tiny.en", "tiny", "base.en", "base", "small.en", "small", "medium.en", "medium", "large-v1", "large".
 * @param {string} [folder] - Optional folder name to store the models. If not provided, default folder "models" will be used.
 * @returns {Promise<{ success: boolean, message?: string }>} A promise resolving to an object indicating success or failure.
 */
async function downloadWhisperModels(model, folder) {
    const models = ["tiny.en", "tiny", "base.en", "base", "small.en", "small", "medium.en", "medium", "large-v1", "large"];

    if (!models.includes(model)) {
        return Promise.reject({ success: false, message: `Invalid model: ${model}. Must be one of ${models.join(", ")}.` });
    }

    // Determine the script path based on the platform
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    let scriptPath;

    if (platform === 'win32') {
        scriptPath = path.join(__dirname, 'download-whisper-models.bat');
    } else {
        scriptPath = path.join(__dirname, 'download-whisper-models.sh');
    }

    // Arguments to pass to the script
    const args = [scriptPath, model, folder].filter(arg => arg !== undefined);

    // Spawn the child process
    const child = spawn(platform === 'win32' ? 'cmd.exe' : 'bash', args);

    // Return a promise to handle process completion
    return new Promise((resolve, reject) => {
        let stdoutData = '';

        child.stdout.on('data', (data) => {
            stdoutData += data.toString();
            console.log(`stdout: ${data}`);
        });

        child.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
            reject({ success: false, message: data.toString() });
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve({ success: true, message: `Whisper model '${model}' downloaded successfully. Output: ${stdoutData}` });
            } else {
                reject({ success: false, message: `Failed to download Whisper model '${model}'. Exit code: ${code}` });
            }
        });

        child.on('error', (err) => {
            console.error(`Failed to start child process. ${err}`);
            reject({ success: false, message: `Failed to start child process. ${err}` });
        });
    });
}

export default downloadWhisperModels;