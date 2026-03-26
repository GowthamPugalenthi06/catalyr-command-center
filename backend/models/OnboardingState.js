const mongoose = require('mongoose');

const onboardingStateSchema = new mongoose.Schema({
    isComplete: { type: Boolean, default: false },
    selectedAgents: [String], // Agent role names
    pdfFilename: String,
    companyName: String,
    completedAt: Date,
}, {
    timestamps: true,
});

module.exports = mongoose.model('OnboardingState', onboardingStateSchema);
