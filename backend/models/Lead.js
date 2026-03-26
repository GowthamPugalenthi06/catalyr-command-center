const mongoose = require('mongoose');

const leadSchema = mongoose.Schema({
    name: String,
    company: String,
    email: String,
    source: String, // e.g., "LinkedIn Post #422"
    utm: String,
    warmthScore: {
        type: Number,
        min: 0,
        max: 100,
    },
    status: {
        type: String,
        enum: ['NEW', 'CONTACTED', 'QUALIFIED', 'CLOSED'],
        default: 'NEW',
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Lead', leadSchema);
