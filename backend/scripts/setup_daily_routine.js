const mongoose = require('mongoose');
const Agent = require('../models/Agent');
const Task = require('../models/Task');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/catalyr');
        console.log('MongoDB Connected...');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const agentsList = [
    { name: "Lyra", role: "Content Marketing", department: "Marketing", rank: "L3", model: "llama-3.3-70b" },
    { name: "Echo", role: "Copywriter", department: "Marketing", rank: "L2", model: "llama-3.3-70b" },
    { name: "Titan", role: "VP of Sales", department: "Sales", rank: "L4", model: "llama-3.3-70b" },
    { name: "Scout", role: "Lead Generation", department: "Sales", rank: "L2", model: "llama-3.3-70b" },
    { name: "Bolt", role: "Sales Rep", department: "Sales", rank: "L1", model: "llama-3.3-70b" },
    { name: "Nexus", role: "Operations Manager", department: "Operations", rank: "L3", model: "llama-3.3-70b" },
    { name: "Helix", role: "HR & Culture", department: "Operations", rank: "L2", model: "llama-3.3-70b" },
    { name: "Nova", role: "CTO", department: "Technology", rank: "L5", model: "llama-3.3-70b" },
    { name: "Vector", role: "VP of Engineering", department: "Technology", rank: "L4", model: "llama-3.3-70b" },
    { name: "Codey", role: "Senior Developer", department: "Technology", rank: "L3", model: "llama-3.3-70b" },
    { name: "Pixel", role: "UI/UX Designer", department: "Technology", rank: "L3", model: "llama-3.3-70b" },
    { name: "Zion", role: "CEO", department: "Executive", rank: "L5", model: "llama-3.3-70b" },
    { name: "Atlas", role: "CFO", department: "Executive", rank: "L4", model: "llama-3.3-70b" }
];

const generateDayTasks = (agents, date, isCompleted = false) => {
    const tasks = [];
    const baseHour = 9; // Start at 9 AM

    // Helper to add task
    const addTask = (agent, title, desc, durationHours = 2) => {
        // Simple distinct start times based on agent index to avoid perfect overlap clutter
        // but keeping it within 9am-9pm
        // Actually, let's just schedule them at 9AM, 11AM, 1PM etc based on department?
        // For simplicity, everything "starts" at 9 AM or distributed slightly.

        const startTime = new Date(date);
        startTime.setHours(baseHour + (Math.floor(Math.random() * 8)), 0, 0, 0); // Random start between 9am and 5pm

        const deadline = new Date(startTime);
        deadline.setHours(startTime.getHours() + durationHours);

        tasks.push({
            title: title,
            description: desc,
            department: agent.department,
            assignedAgent: agent._id,
            priority: 2,
            status: isCompleted ? 'DONE' : 'PENDING',
            requiresApproval: !isCompleted,
            startTime: startTime,
            deadline: deadline,
            type: 'task'
        });
    };

    agents.forEach(agent => {
        // Enforce Daily Marketing Routine
        if (agent.name === "Lyra") {
            addTask(agent, "Daily: LinkedIn Post", "Draft and schedule today's LinkedIn post focusing on 'Zero-Debt Engineering'.");
            addTask(agent, "Daily: Instagram Caption", "Write engaging caption for today's IG visual.");
        } else if (agent.name === "Pixel") {
            addTask(agent, "Daily: LinkedIn Graphic", "Create minimalist visual for the LinkedIn post (Canva/Figma).");
            addTask(agent, "Daily: Instagram Story", "Design a 'Behind the Scenes' story frame.");
        }
        // Other Business Vitalization Tasks
        else if (agent.name === "Titan") addTask(agent, "Lead Pipeline Review", "Check status of top 10 prospects.");
        else if (agent.name === "Scout") addTask(agent, "Daily Lead Scraping", "Identify 5 new startups funded in last 24h.");
        else if (agent.name === "Bolt") addTask(agent, "Outreach: 10 Calls", "Call pending warm leads.");
        else if (agent.name === "Nexus") addTask(agent, "Ops Sync", "Daily operational check-in.");
        else if (agent.name === "Helix") addTask(agent, "Culture Check", "Slack check-in with the team.");
        else if (agent.name === "Nova") addTask(agent, "Tech Radar", "Review new tools/libraries for stack optimization.");
        else if (agent.name === "Vector") addTask(agent, "Code Review Block", "Review PRs from Codey and others.");
        else if (agent.name === "Codey") addTask(agent, "Feature Dev", "Continue work on current sprint tickets.");
        else if (agent.name === "Echo") addTask(agent, "Copy Polish", "Review website content updates.");
        else if (agent.name === "Zion") addTask(agent, "Investor/Partner Relations", "Reach out to potential strategic partners.");
        else if (agent.name === "Atlas") addTask(agent, "Financial Health Check", "Review daily burn and cash flow.");
        else addTask(agent, "General Task", "Daily work assignment.");
    });

    return tasks;
};

const run = async () => {
    await connectDB();

    try {
        console.log("--- Fresh Start Routine ---");

        // 1. Clear Tasks
        await Task.deleteMany({});
        console.log("Cleared all existing tasks.");

        // 2. Ensure Agents
        let dbAgents = await Agent.find();
        if (dbAgents.length === 0) {
            console.log("Seeding Agents...");
            dbAgents = await Agent.insertMany(agentsList);
        }
        console.log(`Working with ${dbAgents.length} agents.`);

        // 3. Generate Today (Completed)
        const today = new Date();
        console.log(`Generating completed tasks for Today (${today.toLocaleDateString()})...`);
        const todayTasks = generateDayTasks(dbAgents, today, true); // true = completed
        await Task.insertMany(todayTasks);

        // 4. Generate Tomorrow (Pending)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        console.log(`Generating pending tasks for Tomorrow (${tomorrow.toLocaleDateString()})...`);
        const tomorrowTasks = generateDayTasks(dbAgents, tomorrow, false); // false = pending
        await Task.insertMany(tomorrowTasks);

        console.log(`Success! Created ${todayTasks.length} tasks for Today and ${tomorrowTasks.length} tasks for Tomorrow.`);
        process.exit(0);

    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
};

run();
