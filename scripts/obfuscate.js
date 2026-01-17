const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, '../build/static/js');

console.log('🔒 Starting code obfuscation...');

// Get all JS files in the build directory
const jsFiles = fs.readdirSync(buildDir).filter(file =>
    file.endsWith('.js') && !file.endsWith('.js.map')
);

let obfuscatedCount = 0;

jsFiles.forEach(file => {
    const filePath = path.join(buildDir, file);
    const code = fs.readFileSync(filePath, 'utf8');

    console.log(`  Obfuscating: ${file}...`);

    const obfuscationResult = JavaScriptObfuscator.obfuscate(code, {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.75,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.4,
        debugProtection: true,
        debugProtectionInterval: 4000,
        simplify: true,
        splitStrings: true,
        splitStringsChunkLength: 10,
        stringArray: true,
        stringArrayCallsTransform: true,
        stringArrayEncoding: ['base64'],
        stringArrayIndexShift: true,
        stringArrayRotate: true,
        stringArrayShuffle: true,
        stringArrayWrappersCount: 2,
        stringArrayWrappersChainedCalls: true,
        stringArrayWrappersParametersMaxCount: 4,
        stringArrayWrappersType: 'function',
        stringArrayThreshold: 0.75,
        transformObjectKeys: true,
        unicodeEscapeSequence: false
    });

    fs.writeFileSync(filePath, obfuscationResult.getObfuscatedCode());
    obfuscatedCount++;
});

// Remove source maps for additional security
const mapFiles = fs.readdirSync(buildDir).filter(file => file.endsWith('.js.map'));
mapFiles.forEach(file => {
    fs.unlinkSync(path.join(buildDir, file));
    console.log(`  Removed source map: ${file}`);
});

console.log(`✅ Successfully obfuscated ${obfuscatedCount} files`);
console.log(`🗑️  Removed ${mapFiles.length} source maps`);
console.log('🎉 Build is now protected!');
