# Audio2TextJS

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/rn0x/audio2textjs/blob/main/LICENSE)
[![npm version](https://badge.fury.io/js/audio2textjs.svg)](https://badge.fury.io/js/audio2textjs)
[![VIEWS](https://komarev.com/ghpvc/?username=rn0x-audio2textjs&label=REPOSITORY+VIEWS&style=for-the-badge)

Audio2TextJS is a Node.js library for audio processing and transcription using the Whisper tool. It supports converting audio files to text using various pre-trained models.

## Features

- Convert audio files to text with customizable options.
- Automatically downloads necessary model files.
- Supports multiple output formats: JSON, TXT, CSV.
- Flexible configuration for threading, processors, and more.

## Installation

To install the library, use npm:

```bash
npm install audio2textjs
```

## Usage

```javascript
import Audio2TextJS from 'audio2textjs';

// Example usage
const converter = new Audio2TextJS({
    threads: 4,
    processors: 1,
    outputJson: true,
});

const inputFile = 'path/to/input.wav';
const model = 'tiny'; // Specify one of the available models
const language = 'auto'; // or specify a language code for translation

converter.runWhisper(inputFile, model, language)
    .then(result => {
        if (result.success) {
            console.log('Conversion successful:', result.output);
        } else {
            console.error('Conversion failed:', result.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
```

## Models

The library includes the following models:

```plaintext
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
```

## API Documentation

### `Audio2TextJS(options)`

Creates an instance of Audio2TextJS with optional configuration options.

#### Parameters

- `options` (Object): Optional configuration settings for the converter.

#### Example

```javascript
const converter = new Audio2TextJS({
    threads: 4,
    processors: 1,
    outputJson: true,
});
```

### `runWhisper(inputFile, model, language)`

Runs the Whisper tool for audio processing and transcription.

#### Parameters

- `inputFile` (string): Path to the input WAV file.
- `model` (string): Name of the model to use (`tiny`, `base`, etc.).
- `language` (string): Spoken language ('auto' for auto-detect).

#### Returns

A Promise that resolves with an object containing `success` status, `message`, and optional `output` upon completion.

#### Example

```javascript
converter.runWhisper('path/to/input.wav', 'tiny', 'auto')
    .then(result => {
        console.log('Conversion result:', result);
    })
    .catch(error => {
        console.error('Error:', error);
    });
```

## Tree 

```bash
│   .gitignore
│   LICENSE
│   package.json
│   README.md
├───examples
│   │   test.js
│   │
│   ├───cli
│   │       index.js
│   │       package.json
│   │       README.md
│   │
│   ├───express
│   │       app.js
│   │       package.json
│   │       README.md
│   │
│   └───telegraf
│
└───src
    │   binFiles.json
    │   convertAudioFile.js
    │   downloadWhisperModels.js
    │   fetchBinFiles.js
    │   index.js
    │   postinstall.js
    │   Audio2TextJS.js
    │
    ├───bin
    │   └───win32
    │           ffmpeg.exe
    │           ffprobe.exe
    │           whisper.exe
    │           .....
    │   └───linux
    │           ffmpeg
    │           ffprobe
    │           whisper
    │           .....
    │
    ├───models
    │       ggml-tiny.bin
    │       ggml-tiny.en.bin
    │       ggml-base.bin
    │       ggml-base.en.bin
    │       ggml-small.bin
    │       .....
    │
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

- GitHub: [rn0x](https://github.com/rn0x)
- Telegram: [rn0x](https://t.me/F93ii)