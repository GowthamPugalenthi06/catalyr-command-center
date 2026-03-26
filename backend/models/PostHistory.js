const mongoose = require('mongoose');

const postHistorySchema = mongoose.Schema({
    platform: {
        type: String,
        enum: ['LinkedIn', 'Instagram'],
        required: true,
    },
    topicCategory: String,
    summary: String,
    embeddingVector: [Number],
    postedAt: Date, // Can be different from createdAt
}, {
    timestamps: true,
});

module.exports = mongoose.model('PostHistory', postHistorySchema);
