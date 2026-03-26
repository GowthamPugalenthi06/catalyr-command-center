const { PDFParse, VerbosityLevel } = require('pdf-parse');
console.log('VerbosityLevel:', VerbosityLevel);
try {
    const parser = new PDFParse({ data: Buffer.from('%PDF-1.4'), verbosity: 0 });
    console.log('Successfully created parser');
} catch (e) {
    console.log('Failed to create parser:', e.message);
}
