import fetchBinFiles from './fetchBinFiles.js';


// Example usage
const os = 'win32'; // أو 'linux'
const arch = 'x64'; // أو 'arm64', 'arm'
const programs = ['whisper', 'ffprobe', 'ffmpeg']; // أو 'ffprobe', 'ffmpeg'
const destDir = './downloads'; // المسار الذي تريد حفظ الملفات فيه

const resultBin = await fetchBinFiles(os, arch, programs, destDir);
console.log('Overall Success:', resultBin.success);
console.log("resultBin.files: ", resultBin.files);
console.log("resultBin.dependencies: ", resultBin.dependencies);

if (resultBin.error) console.log(`Error:${resultBin.error}`);

console.log("======================|next|=========================");