const pdf = require('pdf-parse');
console.log('Type of pdf:', typeof pdf);
console.log('Keys of pdf:', Object.keys(pdf));
if (typeof pdf === 'function') {
    console.log('pdf is a function');
} else if (pdf.default && typeof pdf.default === 'function') {
    console.log('pdf.default is a function');
} else {
    console.log('pdf is neither a function nor are its contents what we expected');
}
