const fs = require("fs");
const path = require("path");

const filePath = process.argv[2];
const timeoutMs = parseInt(process.argv[3], 10) || 30000;
const intervalMs = 100;

if (!filePath) {
    console.error("Usage: node wait-for-file.js <file-path> [timeout-ms]");
    process.exit(1);
}

const absolutePath = path.resolve(filePath);
const start = Date.now();

function check() {
    if (fs.existsSync(absolutePath)) {
        return;
    }
    if (Date.now() - start >= timeoutMs) {
        console.error(`Timeout waiting for file: ${absolutePath}`);
        process.exit(1);
    }
    setTimeout(check, intervalMs);
}

check();
