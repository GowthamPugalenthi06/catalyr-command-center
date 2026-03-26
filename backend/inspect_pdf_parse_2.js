const pdf = require('pdf-parse');
const PDFParse = pdf.PDFParse;
console.log('Type of PDFParse:', typeof PDFParse);
if (typeof PDFParse === 'function') {
    try {
        console.log('PDFParse is a function, trying to see if it is a constructor...');
        const p = new PDFParse();
        console.log('Successfully created instance with new PDFParse()');
    } catch (e) {
        console.log('Failed to create instance with new PDFParse():', e.message);
    }

    try {
        console.log('Trying to call PDFParse() as a function...');
        const p = PDFParse();
        console.log('Successfully called PDFParse() as a function');
    } catch (e) {
        console.log('Failed to call PDFParse() as a function:', e.message);
    }
}
