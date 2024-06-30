Here's a concise and organized explanation of the provided `app.js` code, formatted with emojis for clarity:

```javascript
// Import necessary modules
import express from 'express';       // 🌐 Express framework for handling HTTP requests
import multer from 'multer';         // 📁 Multer for handling file uploads
import fs from 'fs/promises';        // 📄 Promises-based file system module
import Audio2TextJS from '../../src/Audio2TextJS.js'; // 🗣️ Import Audio2TextJS class

// Initialize Express application
const app = express();
const port = 3000;
const uploadDir = 'uploads';        // 📂 Directory name for file uploads

// Configure Multer for file uploads
const upload = multer({ dest: uploadDir + '/' });

// Setup Audio2TextJS with options
const sttConverter = new Audio2TextJS({
    threads: 4,                     // 🔄 Number of threads for processing
    processors: 1,                  // 💻 Number of processors for computation
    duration: 0,                    // ⏳ Maximum duration for processing (0 for unlimited)
    maxLen: 0,                      // 📏 Maximum length of input (0 for unlimited)
    outputJson: true,               // 📝 Output result in JSON format
    outputTxt: false,               // 📝 Output result in plain text format (disabled)
    outputCsv: false                // 📝 Output result in CSV format (disabled)
});

// Middleware to create 'uploads' directory if it doesn't exist
const createUploadsDirIfNotExists = async () => {
    try {
        await fs.access(uploadDir); // Check if directory exists
    } catch (error) {
        await fs.mkdir(uploadDir);  // Create directory if it doesn't exist
    }
};

// Invoke middleware to create uploads directory
createUploadsDirIfNotExists().catch(err => {
    console.error('Error creating uploads directory:', err);
});

/**
 * POST route to receive an audio file and convert it to text.
 * @route POST /convert-audio
 * @group Audio Conversion - APIs for audio to text conversion
 * @param {file} audio.file.required - The audio file to convert
 * @returns {object} 200 - Converted text in JSON format
 * @returns {Error} 400 - Bad request (if no file provided)
 * @returns {Error} 500 - Internal server error (if conversion fails)
 */
app.post('/convert-audio', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('Please provide a valid audio file.'); // Handle missing file error
        }

        const inputFile = req.file.path; // Get path of uploaded file

        // Run audio to text conversion using Audio2TextJS
        const result = await sttConverter.runWhisper(inputFile, 'base', 'auto');

        // Handle successful conversion response
        if (result.success) {
            res.json({
                success: true,
                message: 'Conversion successful.', // Success message
                text: result.output              // Converted text
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Conversion failed.',    // Failure message
                error: result.message            // Error details
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'An error occurred while processing the request.', // Internal server error
            error: error.message                                       // Error details
        });
    }
});

// Start server and listen on specified port
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`); // Server startup message
});
```

### Explanation:

- **Express Setup (`express`, `multer`, `fs/promises`)**:
  - Express is used to create a web server (`app`) that handles HTTP requests.
  - Multer is configured to manage file uploads (`upload.single('audio')`).
  - `fs/promises` is used for file system operations with promises.

- **Audio2TextJS Setup**:
  - `sttConverter` initializes an instance of `Audio2TextJS` with specified options (`threads`, `processors`, etc.) for audio-to-text conversion.

- **Middleware (`createUploadsDirIfNotExists`)**:
  - Checks if the `uploads` directory exists; if not, it creates it asynchronously.

- **Route (`/convert-audio` POST endpoint)**:
  - Handles POST requests to `/convert-audio` to receive an audio file (`audio`) for conversion.
  - Validates if the file exists (`req.file`).
  - Uses `sttConverter.runWhisper` to convert the audio file to text.
  - Responds with JSON containing the converted text or appropriate error messages (`400` for bad request, `500` for internal server error).

- **Server Start (`app.listen`)**:
  - Starts the server on port `3000` and logs a message confirming server startup.

This setup creates a robust API endpoint (`/convert-audio`) for converting uploaded audio files to text using `Audio2TextJS`, handling various scenarios with clear error messages and status codes.