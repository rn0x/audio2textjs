/**
 * LICENSE MIT
 * Copyright (c) 2024 rn0x
 * github: https://github.com/rn0x
 * telegram: https://t.me/F93ii
 * repository: https://github.com/rn0x/Audio2TextJS
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import fs from 'node:fs/promises';
import convertAudioFile from './convertAudioFile.js';
import whisperDownloader from './downloadWhisperModels.js';

/**
 * A class to run the Whisper tool for audio processing and transcription.
 */
class Audio2TextJS {
    /**
     * Creates an instance of WhisperRunner.
     * @param {Object} [options={}] - Options for configuring WhisperRunner.
     * @param {number} [options.threads=4] - Number of threads to use during computation.
     * @param {number} [options.processors=1] - Number of processors to use during computation.
     * @param {number} [options.duration=0] - Duration of audio to process in milliseconds.
     * @param {number} [options.maxLen=0] - Maximum segment length in characters.
     * @param {boolean} [options.outputJson=true] - Whether to output result in JSON format.
     * @param {boolean} [options.outputTxt=false] - Whether to output result in TXT format.
     * @param {boolean} [options.outputCsv=false] - Whether to output result in CSV format.
     */
    constructor(options = {}) {
        /**
         * Default options for Audio2TextJS.
         * @type {Object}
         */
        this.defaultOptions = {
            threads: 4,
            processors: 1,
            duration: 0,
            maxLen: 0,
            outputJson: false,
            outputTxt: false,
            outputCsv: false,
        };
        /**
         * Merged options with defaults.
         * @type {Object}
         */
        this.options = { ...this.defaultOptions, ...options };
        /**
         * Directory name of the current module.
         * @type {string}
         */
        this.__dirname = path.dirname(fileURLToPath(import.meta.url));
        /**
         * Path to the models directory.
         * @type {string}
         */
        this.models = path.join(this.__dirname, "models");
        /**
         * System architecture.
         * @type {string}
         */
        this.arch = os.arch();
        /**
         * Platform of the operating system.
         * @type {string}
         */
        this.platform = os.platform();
        /**
         * List of available models with their file names.
         * @type {Object}
         */
        this.MODELS_LIST = {
            "tiny": "ggml-tiny.bin",
            "tiny.en": "ggml-tiny.en.bin",
            "base": "ggml-base.bin",
            "base.en": "ggml-base.en.bin",
            "small": "ggml-small.bin",
            "small.en": "ggml-small.en.bin",
            "medium": "ggml-medium.bin",
            "medium.en": "ggml-medium.en.bin",
            "large-v1": "ggml-large-v1.bin",
            "large": "ggml-large.bin"
        };
        /**
         * Information about the models including disk and RAM usage.
         * @type {string}
         */
        this.MODELS_INFO = `
    | Model     | Disk   | RAM     |
    |-----------|--------|---------|
    | tiny      |  75 MB | ~390 MB |
    | tiny.en   |  75 MB | ~390 MB |
    | base      | 142 MB | ~500 MB |
    | base.en   | 142 MB | ~500 MB |
    | small     | 466 MB | ~1.0 GB |
    | small.en  | 466 MB | ~1.0 GB |
    | medium    | 1.5 GB | ~2.6 GB |
    | medium.en | 1.5 GB | ~2.6 GB |
    | large-v1  | 2.9 GB | ~4.7 GB |
    | large     | 2.9 GB | ~4.7 GB |
    `;
    }

    /**
     * Determines the path to the Whisper executable based on the operating system.
     * @returns {string} - The path to the Whisper executable.
     */
    getWhisperPath() {
        const dirBin = path.join(this.__dirname, "bin");
        if (this.platform === 'win32') {
            return path.join(dirBin, "win32", "whisper.exe");
        } else if (this.platform === 'linux' || this.platform === 'android') {
            if (this.arch === 'x64') {
                return path.join(dirBin, "linux", "whisper");
            } else if (['arm64', 'arm'].includes(this.arch)) {
                return path.join(dirBin, "linux", "whisper-aarch64");
            }
        } else {
            throw new Error('Unsupported operating system.');
        }
    }

    /**
    * Determines the path to the ffprobe executable based on the operating system.
    * @returns {string} - The path to the ffprobe executable.
    */
    getFFprobePath() {
        const dirBin = path.join(this.__dirname, "bin");
        if (this.platform === 'win32') {
            return path.join(dirBin, "win32", "ffprobe.exe");
        } else if (this.platform === 'linux' || this.platform === 'android') {
            if (this.arch === 'x64') {
                return path.join(dirBin, "linux", "ffprobe");
            } else if (['arm64', 'arm'].includes(this.arch)) {
                return path.join(dirBin, "linux", "ffprobe-aarch64");
            }
        } else {
            throw new Error('Unsupported operating system.');
        }
    }

    /**
     * Runs the Whisper tool with the specified input file, model file, and output file.
     * @param {string} inputFile - Path to the input WAV file.
     * @param {'tiny'|'tiny.en'|'base'|'base.en'|'small'|'small.en'|'medium'|'medium.en'|'large-v1'|'large'} model - The name of the model to download. Must be one of "tiny.en", "tiny", "base.en", "base", "small.en", "small", "medium.en", "medium", "large-v1", "large".
     * @param {string} language - Spoken language ('auto' for auto-detect).
     * @returns {Promise<{ success: boolean, message: string, output?: any }>} - A promise that resolves with success status, message, and optional output data upon completion.
     */
    async runWhisper(inputFile, model, language) {
        const { threads, processors, duration, maxLen, outputJson, outputTxt, outputCsv, outputAll, translate } = this.options;

        const resultDownModel = await whisperDownloader.downloadModel(model);
        if (!resultDownModel.success) return { success: false, message: `Failed to download ggml model ${model}` };

        // Convert the audio file to a suitable format using the convertAudioFile function
        // If the conversion fails, return an object containing the error information
        const CWF = await convertAudioFile(inputFile);
        if (!CWF.success) return { success: false, message: CWF.message };

        const args = [
            `--threads`, `${threads}`,
            `--processors`, `${processors}`,
            `--duration`, `${duration}`,
            `--max-len`, `${maxLen}`,
            (outputJson || outputAll) ? '--output-json' : '',
            (outputTxt || outputAll) ? '--output-txt' : '',
            (outputCsv || outputAll) ? '--output-csv' : '',
            translate ? '--translate' : '',
            `--model`, `${resultDownModel.modelFile}`,
            `--language`, `${language}`,
            `--file`, `${CWF.output}`,
        ].filter(Boolean);

        const whisperPath = this.getWhisperPath();
        const subprocess = spawn(whisperPath, args);
        const command = subprocess.spawnargs.join(" ");

        let stderr = '';

        return new Promise((resolve, reject) => {
            subprocess.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            subprocess.on('close', async (code) => {
                if (code === 0) {
                    const outputFiles = [];

                    if (outputJson || outputAll) {
                        try {
                            const jsonContent = await fs.readFile(`${CWF.output}.json`, 'utf-8');
                            outputFiles.push({ type: 'json', data: JSON.parse(jsonContent), outputFile: `${CWF.output}.json` });
                        } catch (error) {
                            return resolve({ success: false, message: `Failed to read or parse JSON output file: ${error.message}` });
                        }
                    }

                    if (outputTxt || outputAll) {
                        try {
                            const textContent = await fs.readFile(`${CWF.output}.txt`, 'utf-8');
                            outputFiles.push({ type: 'txt', data: textContent, outputFile: `${CWF.output}.txt` });
                        } catch (error) {
                            return resolve({ success: false, message: `Failed to read TXT output file: ${error.message}` });
                        }
                    }

                    if (outputCsv || outputAll) {
                        try {
                            const csvContent = await fs.readFile(`${CWF.output}.csv`, 'utf-8');
                            outputFiles.push({ type: 'csv', data: csvContent, outputFile: `${CWF.output}.csv` });
                        } catch (error) {
                            return resolve({ success: false, message: `Failed to read CSV output file: ${error.message}` });
                        }
                    }

                    resolve({ success: true, message: `Whisper process completed successfully.`, output: outputFiles });
                } else {
                    resolve({ success: false, message: `Whisper process failed with code ${code}. stderr: ${stderr}` });
                }
            });

            subprocess.on('error', (err) => {
                reject(err);
            });
        });
    }

    /**
     * Check if a video file contains audio streams.
     * @param {string} videoPath - Path to the video file.
     * @returns {Promise<boolean>} - Promise that resolves to true if audio is present, false otherwise.
     */
    async checkAudioPresence(videoPath) {
        return new Promise((resolve, reject) => {

            const ffprobePath = this.getFFprobePath();
            const args = [
                '-v', 'error',
                '-select_streams', 'a:0',
                '-show_entries', 'stream=codec_type',
                '-of', 'default=nokey=1:noprint_wrappers=1',
                videoPath
            ]
            const ffprobe = spawn(ffprobePath, args);
            let hasAudio = false;

            ffprobe.stdout.on('data', (data) => {
                const codecType = data.toString().trim();
                if (codecType === 'audio') {
                    hasAudio = true;
                }
            });

            ffprobe.on('close', (code) => {
                if (code === 0) {
                    resolve(hasAudio);
                } else {
                    reject(new Error(`ffprobe process exited with code ${code}`));
                }
            });

            ffprobe.on('error', (err) => {
                reject(err);
            });
        });
    }
}

export default Audio2TextJS;