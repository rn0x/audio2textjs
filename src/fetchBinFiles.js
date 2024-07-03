/**
 * LICENSE MIT
 * Copyright (c) 2024 rn0x
 * github: https://github.com/rn0x
 * telegram: https://t.me/F93ii
 * repository: https://github.com/rn0x/Audio2TextJS
 */

import { execSync } from 'node:child_process';
import fs from 'fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Function to set LD_LIBRARY_PATH environment variable globally.
 * @param {string} pathToAdd - The path to add to LD_LIBRARY_PATH.
 */
function setLDLibraryPath(pathToAdd) {
    try {
        const currentPath = process.env.LD_LIBRARY_PATH || '';
        const newPath = `${pathToAdd}:${currentPath}`;

        // Check if LD_LIBRARY_PATH is already set in ~/.bashrc
        const bashrcPath = path.join(process.env.HOME, '.bashrc');
        let bashrcContent = '';

        if (fs.existsSync(bashrcPath)) {
            bashrcContent = fs.readFileSync(bashrcPath, 'utf8');
        }

        const ldLibraryPathPattern = /export\s+LD_LIBRARY_PATH="([^"]*)"/;
        const match = bashrcContent.match(ldLibraryPathPattern);

        if (match) {
            const existingPath = match[1];
            if (existingPath.includes(pathToAdd)) {
                console.log('LD_LIBRARY_PATH is already set to the correct path in ~/.bashrc');
            } else {
                // Replace the existing LD_LIBRARY_PATH with the new one
                const updatedContent = bashrcContent.replace(ldLibraryPathPattern, `export LD_LIBRARY_PATH="${newPath}"`);
                fs.writeFileSync(bashrcPath, updatedContent, 'utf8');
                execSync('source ~/.bashrc');
                console.log(`LD_LIBRARY_PATH updated to: ${newPath}`);
            }
        } else {
            // Set LD_LIBRARY_PATH globally using ~/.bashrc
            const command = `echo 'export LD_LIBRARY_PATH="${newPath}"' >> ~/.bashrc && source ~/.bashrc`;
            execSync(command);
            console.log(`LD_LIBRARY_PATH set to: ${newPath}`);
        }
    } catch (err) {
        console.error(`Error setting LD_LIBRARY_PATH in ~/.bashrc: ${err.message}`);
        const ldLibraryPath = process.env.LD_LIBRARY_PATH || '';
        const newPath = `${pathToAdd}:${ldLibraryPath}`;
        process.env.LD_LIBRARY_PATH = newPath;
        console.log(`LD_LIBRARY_PATH set to: ${newPath} (temporarily in current process due to error)`);
    }
}

/**
 * Function to download a file from a URL and save it to a specified path.
 * @param {string} url - The URL of the file to download.
 * @param {string} dest - The destination path to save the downloaded file.
 * @returns {Promise<void>}
 */
async function downloadFile(url, dest) {
    const writer = fs.createWriteStream(dest);

    try {
        const response = await fetch(url, { redirect: 'follow' });

        if (!response.ok) {
            throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
        }

        const stream = response.body.pipe(writer);

        return new Promise((resolve, reject) => {
            stream.on('finish', resolve);
            stream.on('error', (err) => {
                fs.unlink(dest, () => reject(err));
            });
        });
    } catch (err) {
        if (fs.existsSync(dest)) {
            fs.unlinkSync(dest);
        }
        throw err;
    }
}

/**
 * Function to get file paths based on OS and architecture.
 * @param {string} os - The operating system (win32 or linux).
 * @param {string} arch - The architecture (x64, arm64, arm).
 * @param {Array<string>} programs - The array of programs to download (whisper, ffprobe, ffmpeg).
 * @returns {Array<Object>} - An array of file objects to be downloaded.
 */
function getFilePaths(os, arch, programs) {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'binFiles.json')));
    const files = data[os];
    let programFiles = [];

    if (!Array.isArray(programs) || programs.length === 0) {
        throw new Error('Invalid input: programs should be a non-empty array of program names.');
    }

    for (const program of programs) {
        const programFilesForProgram = files.filter(file => file.filename.includes(program));
        if (programFilesForProgram.length === 0) {
            throw new Error(`No files found for program "${program}" on ${os} (${arch})`);
        }
        programFiles.push(...programFilesForProgram);
    }

    if (programFiles.length === 0) {
        throw new Error(`No files found for programs ${programs.join(', ')} on ${os} (${arch})`);
    }

    if (os === 'win32') {
        programFiles = programFiles.filter(file => programs.some(program => file.filename.includes(program)));
    } else if (os === 'linux') {
        if (arch === 'x64') {
            programFiles = programFiles.filter(file => programs.some(program => file.filename.includes(program) && file.architecture === 'x64'));
        } else if (arch === 'arm64') {
            programFiles = programFiles.filter(file => programs.some(program => file.filename.includes(program) && file.architecture === 'arm64'));
        }
    }

    return programFiles;
}

/**
 * Main function to download files based on OS, architecture, and program.
 * @param {string} os - The operating system (win32 or linux).
 * @param {string} arch - The architecture (x64, arm64, arm).
 * @param {Array<'whisper'|'ffprobe'|'ffmpeg'>} programs - The array of programs to download (whisper, ffprobe, ffmpeg).
 * @param {string} destDir - The destination directory to save the downloaded files.
 * @returns {Promise<Object>} - An object containing download status for each file and overall success status.
 */
export default async function fetchBinFiles(os, arch, programs, destDir) {
    try {
        // Validate input
        if (!Array.isArray(programs) || programs.length === 0) {
            throw new Error('Invalid input: programs should be a non-empty array of program names.');
        }

        // Ensure the destination directory exists
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }

        const files = getFilePaths(os, arch, programs);
        const result = { success: true, files: { success: [], failed: [] }, dependencies: { success: [], failed: [] } };

        // Create subdirectory if specified in file path and download the file
        for (const file of files) {
            const filePath = path.join(destDir, path.dirname(file.path)); // Use dirname to get subdirectory
            const fileFullPath = path.join(destDir, file.path);

            if (!fs.existsSync(filePath)) {
                fs.mkdirSync(filePath, { recursive: true });
            }

            if (fs.existsSync(fileFullPath)) {
                console.log(`File ${file.filename} already exists at ${fileFullPath}, skipping download.`);
                result.files.success.push({ filename: file.filename, path: fileFullPath, status: 'exists' });
                continue; // Skip if file exists
            }

            try {
                await downloadFile(file.url, fileFullPath, 10); // Assuming maxRedirects is 10 by default
                console.log(`Downloaded ${file.filename} to ${fileFullPath}`);
                result.files.success.push({ filename: file.filename, path: fileFullPath, status: 'downloaded' });
            } catch (err) {
                console.error(`Failed to download ${file.filename}: ${err.message}`);
                result.files.failed.push({ filename: file.filename, url: file.url, error: err.message });
                result.success = false; // Update result.success on download failure
            }
        }

        // Download only the dependencies that have not been downloaded or are not locally available
        for (const program of programs) {
            const programFile = files.find(file => file.filename === `${program}.exe` || file.filename === program);
            if (programFile && programFile.dependencies && programFile.dependencies.length > 0) {
                console.log(`Downloading dependencies for ${program}...`);

                for (const dependency of programFile.dependencies) {
                    const dependencyPath = path.join(destDir, dependency.path);

                    if (fs.existsSync(dependencyPath)) {
                        console.log(`Dependency ${dependency.filename} already exists at ${dependencyPath}, skipping download.`);
                        result.dependencies.success.push({ filename: dependency.filename, path: dependencyPath, status: 'exists' });
                        continue; // Skip if dependency exists
                    }

                    try {
                        await downloadFile(dependency.url, dependencyPath, 10); // Assuming maxRedirects is 10 by default
                        console.log(`Downloaded dependency ${dependency.filename} to ${dependencyPath}`);
                        result.dependencies.success.push({ filename: dependency.filename, path: dependencyPath, status: 'downloaded' });
                    } catch (err) {
                        console.error(`Failed to download dependency ${dependency.filename}: ${err.message}`);
                        result.dependencies.failed.push({ filename: dependency.filename, url: dependency.url, error: err.message });
                        result.success = false; // Update result.success on dependency download failure
                    }
                }
            }
        }

        // Check if all files were already downloaded
        const allFilesExist = files.every(file => {
            const fileFullPath = path.join(destDir, file.path);
            return fs.existsSync(fileFullPath);
        });

        // Update result.success based on file existence
        result.success = allFilesExist && result.files.failed.length === 0 && result.dependencies.failed.length === 0;

        // Set LD_LIBRARY_PATH if OS is Linux
        if (os === 'linux' || os === 'android') {
            setLDLibraryPath(path.join(destDir, 'linux'));
        }
        return result; // Return the result object after all downloads and dependencies are processed
    } catch (err) {
        console.error(`Error in fetchBinFiles: ${err.message}`);
        return { success: false, error: err.message };
    }
}