const mongoose = require('mongoose');

const chunkSchema = new mongoose.Schema({
    text: { type: String, required: true },
    keywords: [String],
    chunkIndex: Number,
});

const companyProfileSchema = new mongoose.Schema({
    companyName: { type: String, required: true },
    industry: { type: String, default: '' },
    pdfFilename: String,
    rawText: String, // Full extracted text
    chunks: [chunkSchema],
}, {
    timestamps: true,
});

module.exports = mongoose.model('CompanyProfile', companyProfileSchema);
