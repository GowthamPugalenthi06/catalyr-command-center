const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Agent = require('./models/Agent');
const connectDB = require('./config/db');

dotenv.config();

const agents = [
    // --- EXECUTIVE (C-SUITE) ---
    {
        name: "Zion",
        role: "Chief Executive Officer",
        department: "Executive",
        rank: "L1",
        avatar: "👑",
        model: "llama-3.3-70b-versatile",
        performance: 99,
        status: "active"
    },
    {
        name: "Orion",
        role: "Chief Operating Officer",
        department: "Operations",
        rank: "L1",
        avatar: "🎯",
        model: "llama-3.3-70b-versatile",
        performance: 98,
        status: "active"
    },
    {
        name: "Atlas",
        role: "Chief Financial Officer",
        department: "Finance",
        rank: "L1",
        avatar: "📊",
        model: "llama-3.3-70b-versatile",
        performance: 96,
        status: "active"
    },
    {
        name: "Nova",
        role: "Chief Technology Officer",
        department: "Technology",
        rank: "L1",
        avatar: "⚡",
        model: "llama-3.3-70b-versatile",
        performance: 97,
        status: "active"
    },
    {
        name: "Aurora",
        role: "Chief Marketing Officer",
        department: "Marketing",
        rank: "L1",
        avatar: "🚀",
        model: "llama-3.3-70b-versatile",
        performance: 94,
        status: "active"
    },
    {
        name: "Cipher",
        role: "Chief Information Officer",
        department: "Technology",
        rank: "L1",
        avatar: "🔒",
        model: "llama-3.3-70b-versatile",
        performance: 95,
        status: "active"
    },

    // --- SENIOR MANAGEMENT (VPs) ---
    {
        name: "Titan",
        role: "VP of Sales",
        department: "Sales",
        rank: "L2",
        avatar: "💎",
        model: "llama-3.3-70b-versatile",
        performance: 92,
        status: "active"
    },
    {
        name: "Vector",
        role: "VP of Engineering",
        department: "Technology",
        rank: "L2",
        avatar: "⚙️",
        model: "llama-3.3-70b-versatile",
        performance: 94,
        status: "active"
    },

    // --- MANAGEMENT (L3) ---
    {
        name: "Nexus",
        role: "Operations Manager",
        department: "Operations",
        rank: "L3",
        avatar: "📋",
        model: "llama-3.3-70b-versatile",
        performance: 95,
        status: "active"
    },
    {
        name: "Prism",
        role: "Product Manager",
        department: "Technology",
        rank: "L3",
        avatar: "📦",
        model: "llama-3.3-70b-versatile",
        performance: 91,
        status: "active"
    },
    {
        name: "Helix",
        role: "HR Manager",
        department: "Operations",
        rank: "L3",
        avatar: "🤝",
        model: "llama-3.3-70b-versatile",
        performance: 93,
        status: "active"
    },

    // --- SPECIALISTS (L4) ---
    {
        name: "Lyra",
        role: "Content Creator",
        department: "Marketing",
        rank: "L4",
        avatar: "🎨",
        model: "llama-3.3-70b-versatile",
        performance: 89,
        status: "active"
    },
    {
        name: "Echo",
        role: "Copywriter",
        department: "Marketing",
        rank: "L4",
        avatar: "📝",
        model: "llama-3.3-70b-versatile",
        performance: 93,
        status: "active"
    },
    {
        name: "Scout",
        role: "Lead Generation Specialist",
        department: "Sales",
        rank: "L4",
        avatar: "🔍",
        model: "llama-3.3-70b-versatile",
        performance: 91,
        status: "active"
    },
    {
        name: "Codey",
        role: "Senior Full Stack Dev",
        department: "Technology",
        rank: "L4",
        avatar: "💻",
        model: "llama-3.3-70b-versatile",
        performance: 96,
        status: "working"
    },
    {
        name: "Pixel",
        role: "UI/UX Designer",
        department: "Technology",
        rank: "L4",
        avatar: "🖌️",
        model: "llama-3.3-70b-versatile",
        performance: 92,
        status: "active"
    },
    {
        name: "Data",
        role: "Data Analyst",
        department: "Technology",
        rank: "L4",
        avatar: "📈",
        model: "llama-3.3-70b-versatile",
        performance: 94,
        status: "active"
    },

    // --- SUPPORT (L5) ---
    {
        name: "Spark",
        role: "Customer Support Lead",
        department: "Customer Service",
        rank: "L5",
        avatar: "🎧",
        model: "llama-3.3-70b-versatile",
        performance: 88,
        status: "active"
    },
    {
        name: "Bolt",
        role: "Sales Representative",
        department: "Sales",
        rank: "L5",
        avatar: "⚡",
        model: "llama-3.3-70b-versatile",
        performance: 85,
        status: "active"
    }
];

const Task = require('./models/Task');
const ChatMessage = require('./models/ChatMessage');
const Lead = require('./models/Lead'); // Assuming Lead model exists in models/Lead.js
// If Lead doesn't exist, we skip. Checking file listing or assuming based on user context.
// User context mentions leadRoutes, so Lead model likely exists.
// Let's safe verify in try/catch or just add if we are sure.
// Previous turn showed leadRoutes.js import Lead, so it exists.

const seedAgents = async () => {
    try {
        await connectDB();

        // Clear All Data
        await Task.deleteMany();
        console.log('Tasks cleared');

        await ChatMessage.deleteMany();
        console.log('Chat History cleared');

        // Optional: Lead might not be a module yet, but if it is:
        try {
            const Lead = require('./models/Lead');
            await Lead.deleteMany();
            console.log('Leads cleared');
        } catch (e) {
            console.log("No Lead model found to clear.");
        }

        await Agent.deleteMany();
        console.log('Agents cleared');

        // Insert new
        await Agent.insertMany(agents);
        console.log(`Seeded ${agents.length} agents successfully`);

        process.exit();
    } catch (error) {
        console.error('Error seeding agents:', error);
        process.exit(1);
    }
};

seedAgents();
