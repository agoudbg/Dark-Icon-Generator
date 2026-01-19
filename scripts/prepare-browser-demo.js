const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'lib');
const destDir = path.join(root, 'examples', 'browser', 'lib');

function copyRecursive(src, dest) {
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        for (const entry of fs.readdirSync(src)) {
            copyRecursive(path.join(src, entry), path.join(dest, entry));
        }
    } else {
        fs.copyFileSync(src, dest);
    }
}

if (!fs.existsSync(srcDir)) {
    console.error('Build output not found. Run "npm run build" first.');
    process.exit(1);
}

if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true, force: true });
}

copyRecursive(srcDir, destDir);
console.log('Browser demo prepared at', destDir);
