const mongoose = require('mongoose');

const taskSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: String,
    department: {
        type: String,
        required: false,
    },
    assignedAgent: {
        type: mongoose.Schema.Types.ObjectId, // Could link to an Agent table if we had one, or just store ID
        required: false,
    },
    agentRank: {
        type: String,
        enum: ['L1', 'L2', 'L3', 'L4', 'L5'],
    },
    priority: {
        type: Number,
        required: false, // Relaxed definition
    },
    status: {
        type: String,
        enum: ['PENDING', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'DECLINED', 'FAILED'],
        default: 'PENDING',
    },
    requiresApproval: {
        type: Boolean,
        default: true,
    },
    inputRefs: {
        chatId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ChatMessage',
        },
        memoryIds: [{
            type: mongoose.Schema.Types.ObjectId,
        }],
    },
    outputRefs: {
        draftId: {
            type: mongoose.Schema.Types.ObjectId,
            // ref: 'Draft', // If we have a Draft model
        },
        leadIds: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lead',
        }],
    },
    type: {
        type: String,
        enum: ['task', 'meeting', 'leave'],
        default: 'task',
    },
    metadata: {
        link: String, // For meetings
        location: String,
        attendees: [String],
    },
    startTime: Date,
    endTime: Date,
    deadline: Date,
}, {
    timestamps: true,
});

module.exports = mongoose.model('Task', taskSchema);
