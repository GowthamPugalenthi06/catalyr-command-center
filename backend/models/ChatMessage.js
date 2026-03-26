const mongoose = require('mongoose');

const chatMessageSchema = mongoose.Schema({
    senderType: {
        type: String,
        enum: ['FOUNDER', 'AI_AGENT'],
        required: true,
    },
    senderId: {
        type: String,
        required: false,
    },
    sessionId: {
        type: String,
        required: true,
        index: true
    },
    sessionTitle: {
        type: String,
        required: false
    },
    rawMessage: {
        type: String,
        required: true,
    },
    parsedIntents: [
        {
            intent: {
                type: String,
            },
            confidence: Number,
        },
    ],
    status: {
        type: String,
        enum: ['RECEIVED', 'ROUTED', 'EXECUTING', 'COMPLETED', 'FAILED'],
        default: 'RECEIVED',
    },
    relatedTasks: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task',
        },
    ],
    responseSummary: String,
}, {
    timestamps: true,
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
