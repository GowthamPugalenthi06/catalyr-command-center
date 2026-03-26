const { PDFParse } = require('pdf-parse');
const fs = require('fs');
const path = require('path');

const pdfPath = '/home/gowtham/Documents/catalyr-command-center/backend/uploads/company_1774326523801.pdf';
const pdfBuffer = fs.readFileSync(pdfPath);

async function test() {
    try {
        const parser = new PDFParse({ data: pdfBuffer });
        console.log('Parser created');
        const textResult = await parser.getText();
        console.log('Text extracted, length:', textResult.text.length);
        console.log('Start of text:', textResult.text.substring(0, 100));
    } catch (e) {
        console.log('Error:', e);
    }
}

test();
