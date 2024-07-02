/**
 * LICENSE MIT
 * Copyright (c) 2024 rn0x
 * github: https://github.com/rn0x
 * telegram: https://t.me/F93ii
 * repository: https://github.com/rn0x/Audio2TextJS
 */

import fs from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
* Function to check if FFmpeg and ffprobe are installed and return their executable paths based on OS and architecture.
* @returns {Object} Returns the paths to FFmpeg and ffprobe executables if installed, otherwise null.
*/
function getFFmpegPaths() {
    const dirBin = path.join(__dirname, "bin");
    let ffmpegPath = null;
    let ffprobePath = null;

    if (process.platform === 'win32') {
        ffmpegPath = path.join(dirBin, "win32", "ffmpeg.exe");
        ffprobePath = path.join(dirBin, "win32", "ffprobe.exe");
    } else if (process.platform === 'linux' || process.platform === 'android') {
        if (process.arch === 'x64') {
            ffmpegPath = path.join(dirBin, "linux", "ffmpeg");
            ffprobePath = path.join(dirBin, "linux", "ffprobe");
        } else if (['arm64', 'arm'].includes(process.arch)) {
            ffmpegPath = path.join(dirBin, "linux", "ffmpeg-aarch64");
            ffprobePath = path.join(dirBin, "linux", "ffprobe-aarch64");
        } else {
            throw new Error('Unsupported architecture.');
        }
    } else {
        throw new Error('Unsupported operating system.');
    }

    if (fs.existsSync(ffmpegPath) && fs.existsSync(ffprobePath)) {
        return { ffmpegPath, ffprobePath };
    }

    return { ffmpegPath: null, ffprobePath: null };
}

/**
 * Function to get the sample rate of an audio file using ffprobe.
 * @param {string} ffprobePath - Path to the ffprobe executable.
 * @param {string} inputFilePath - Path to the input audio file.
 * @returns {Promise<number>} A promise that resolves with the sample rate of the audio file.
 */
async function getSampleRate(ffprobePath, inputFilePath) {
    return new Promise((resolve, reject) => {
        const subprocess = spawn(ffprobePath, [
            '-v', 'error',
            '-show_entries', 'stream=sample_rate',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            inputFilePath
        ]);

        let stdout = '';
        let stderr = '';

        subprocess.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        subprocess.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        subprocess.on('close', (code) => {
            if (code === 0) {
                resolve(parseInt(stdout.trim(), 10));
            } else {
                reject(new Error(`Failed to get sample rate: ${stderr.trim()}`));
            }
        });

        subprocess.on('error', (err) => {
            reject(err);
        });
    });
}

/**
 * Function to convert an audio file to WAV format.
 * @param {string} inputFilePath - Path to input audio file.
 * @param {string} outputFilePath - Path to output WAV file.
 * @param {string} ffmpegPath - Path to the ffmpeg executable.
 * @returns {Promise<string>} A promise that resolves with the path to the converted WAV file.
 */
async function convertToWav(inputFilePath, outputFilePath, ffmpegPath) {
    return new Promise((resolve, reject) => {
        const subprocess = spawn(ffmpegPath, [
            '-y',
            '-i', inputFilePath,
            outputFilePath
        ]);

        let stderr = '';

        subprocess.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        subprocess.on('close', (code) => {
            if (code === 0) {
                resolve(outputFilePath);
            } else {
                reject(new Error(`Failed to convert to WAV: ${stderr.trim()}`));
            }
        });

        subprocess.on('error', (err) => {
            reject(err);
        });
    });
}

/**
 * Function to convert an audio file to a desired sample rate and WAV format using FFmpeg.
 * @param {string} inputFilePath - Path to input audio file.
 * @param {number} [desiredSampleRate=16000] - Desired sample rate in Hz (default: 16000).
 * @returns {Promise<{ success: boolean, message: string, output: string }>} A promise that resolves with a success message upon successful conversion, or rejects with an error message.
 */
async function convertAudioFile(inputFilePath, desiredSampleRate = 16000) {
    try {
        let outputFilePath;
        const { ffmpegPath, ffprobePath } = getFFmpegPaths();
        if (!ffmpegPath || !ffprobePath) throw new Error('FFmpeg or ffprobe is not installed.');

        if (!fs.existsSync(inputFilePath)) {
            throw new Error(`Input file '${inputFilePath}' not found.`);
        }

        const ext = path.extname(inputFilePath).toLowerCase();
        const isWav = ext === '.wav';

        if (isWav) {
            const currentSampleRate = await getSampleRate(ffprobePath, inputFilePath);
            if (currentSampleRate === desiredSampleRate) {
                return { success: true, message: `Input file '${inputFilePath}' is already at the desired sample rate.`, output: inputFilePath };
            }
            outputFilePath = `${inputFilePath}.OUTPUT.wav`;
            return await convertSampleRate(inputFilePath, outputFilePath, desiredSampleRate, ffmpegPath);
        } else {
            const tempWavPath = `${inputFilePath}.TEMP.wav`;
            await convertToWav(inputFilePath, tempWavPath, ffmpegPath);
            const currentSampleRate = await getSampleRate(ffprobePath, tempWavPath);
            if (currentSampleRate === desiredSampleRate) {
                return { success: true, message: `Input file '${inputFilePath}' converted to WAV format with the desired sample rate.`, output: tempWavPath };
            }
            outputFilePath = `${inputFilePath}.OUTPUT.wav`;
            const result = await convertSampleRate(tempWavPath, outputFilePath, desiredSampleRate, ffmpegPath);
            fs.unlinkSync(tempWavPath);
            return result;
        }
    } catch (error) {
        return { success: false, message: `Failed to convert '${inputFilePath}' to the desired sample rate: ${error.message}` };
    }
}

/**
 * Function to convert sample rate of a WAV file using FFmpeg.
 * @param {string} inputFilePath - Path to input WAV file.
 * @param {string} outputFilePath - Path to output WAV file.
 * @param {number} desiredSampleRate - Desired sample rate in Hz.
 * @param {string} ffmpegPath - Path to the ffmpeg executable.
 * @returns {Promise<{ success: boolean, message: string, output: string }>} A promise that resolves with a success message upon successful conversion, or rejects with an error message.
 */
async function convertSampleRate(inputFilePath, outputFilePath, desiredSampleRate, ffmpegPath) {
    return new Promise((resolve, reject) => {
        const subprocess = spawn(ffmpegPath, [
            '-y',
            '-i', inputFilePath,
            '-ar', desiredSampleRate,
            outputFilePath
        ]);

        let stderr = '';

        subprocess.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        subprocess.on('close', (code) => {
            if (code === 0) {
                resolve({ success: true, message: `File '${inputFilePath}' successfully converted to '${outputFilePath}' with sample rate ${desiredSampleRate} Hz.`, output: outputFilePath });
            } else {
                reject(new Error(`Failed to convert '${inputFilePath}' to the desired sample rate: ${stderr.trim()}`));
            }
        });

        subprocess.on('error', (err) => {
            reject(err);
        });
    });
}

export default convertAudioFile;