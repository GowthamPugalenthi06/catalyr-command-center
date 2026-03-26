const mongoose = require('mongoose');

const agentSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    role: String,
    department: {
        type: String,
        enum: [
            'Engineering', 'QA', 'DevOps', 'Data', 'Design',
            'Management', 'Product', 'Executive',
            'HR', 'Finance',
            'Marketing', 'Sales', 'Operations', 'Customer Service',
            // Legacy compat
            'Ops', 'Technology',
        ],
        required: true,
    },
    rank: {
        type: String,
        enum: ['L1', 'L2', 'L3', 'L4', 'L5'],
        required: true,
    },
    status: {
        type: String, // 'active', 'idle', 'working'
        default: 'active',
    },
    avatar: String, // Emoji or URL
    model: String, // e.g. 'llama-3.3-70b-versatile'
    tasksCompleted: {
        type: Number,
        default: 0,
    },
    performance: {
        type: Number,
        default: 100,
    },
    isEnabled: {
        type: Boolean,
        default: false,
    },
    systemPrompt: {
        type: String,
        default: '',
    },
    category: {
        type: String,
        enum: ['Technical', 'Management', 'Support'],
        default: 'Technical',
    },
    description: {
        type: String,
        default: '',
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Agent', agentSchema);
