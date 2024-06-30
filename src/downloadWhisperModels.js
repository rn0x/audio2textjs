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
import fs from 'node:fs';

/**
 * Source URLs for the models.
 */
const src = 'https://huggingface.co/ggerganov/whisper.cpp';
const srcAll = 'https://huggingface.co/akashmjn/tinydiarize-whisper.cpp';
const pfx = 'resolve/main/ggml';

/**
 * List of available models.
 */
const models = [
  'tiny.en', 'tiny', 'base.en', 'base',
  'small.en', 'small', 'medium.en', 'medium',
  'large-v1', 'large'
];

/**
 * Get the path of the current script.
 * @returns {string} The directory path of the current script.
 */
function getScriptPath() {
  const __filename = fileURLToPath(import.meta.url);
  return path.dirname(__filename);
}

/**
 * Create the models directory if it doesn't exist.
 * @param {string} modelsPath - The path to the models directory.
 */
function createModelsDirectory(modelsPath) {
  if (!fs.existsSync(modelsPath)) {
    fs.mkdirSync(modelsPath, { recursive: true });
  }
}

/**
 * List available models.
 */
function listModels() {
  console.log("\n  Available models:");
  models.forEach(model => console.log(`  ${model}`));
  console.log("  all\n");
}

/**
 * Download a Whisper model.
 * @param {'tiny'|'tiny.en'|'base'|'base.en'|'small'|'small.en'|'medium'|'medium.en'|'large-v1'|'large'} model - The model to download.
 * @param {string} [folder='models'] - The folder to save the model in.
 * @returns {Promise<object>} A promise that resolves with the download details, including model name and file path.
 */
function downloadModel(model, folder = 'models') {
  return new Promise((resolve, reject) => {
    if (!models.includes(model) && model !== 'all') {
      const error = `Invalid model: ${model}`;
      console.log(error);
      listModels();
      resolve({ success: false, message: error });
      return;
    }

    const scriptPath = getScriptPath();
    const modelsPath = path.join(scriptPath, folder);
    createModelsDirectory(modelsPath);

    if (model === 'all') {
      Promise.all(models.map(modelItem => downloadModel(modelItem, folder)))
        .then(results => resolve({ success: true, details: results }))
        .catch(err => reject({ success: false, error: err }));
      return;
    }

    const srcUrl = model.includes('tdrz') ? srcAll : src;
    const modelFile = path.join(modelsPath, `ggml-${model}.bin`);

    if (fs.existsSync(modelFile)) {
      const message = `Model ${model} already exists. Skipping download.`;
      // console.log(message);
      resolve({ success: true, message, modelFile, modelName: model });
      return;
    }

    const downloadUrl = `${srcUrl}/${pfx}-${model}.bin`;

    console.log(`Downloading ggml model ${model} from '${downloadUrl}'...`);

    const downloader = spawn(
      platform === 'win32' ? 'curl' : 'wget',
      platform === 'win32' ? ['-L', '-o', modelFile, downloadUrl] : ['-O', modelFile, downloadUrl]
    );

    downloader.stdout.on('data', data => console.log(data.toString()));
    downloader.stderr.on('data', data => console.error(data.toString()));

    downloader.on('close', code => {
      if (code !== 0) {
        const error = `Failed to download ggml model ${model}`;
        console.error(error);
        console.log(`Please try again later or download the original Whisper model files and convert them yourself.`);
        reject({ success: false, error });
      } else {
        const message = `Done! Model '${model}' saved in '${modelFile}'`;
        console.log(message);
        console.log(`You can now use it like this:\n\n  $ ./whisper.exe -m ${modelFile} -f samples/jfk.wav\n`);
        resolve({ success: true, message, modelFile, modelName: model });
      }
    });
  });
}

export default {
  downloadModel,
  listModels
};