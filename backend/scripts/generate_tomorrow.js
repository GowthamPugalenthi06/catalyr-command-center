const mongoose = require('mongoose');
const Agent = require('../models/Agent');
const Task = require('../models/Task');
const COMPANY_CONTEXT = require('../data/companyContext');
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

const generateMissionTasks = (agents) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Set consistent deadlines for tomorrow 6 PM
    const deadline = new Date(tomorrow);
    deadline.setHours(18, 0, 0, 0);

    // Business Vitalization Tasks - Focus: Getting 1st Client, Setup, Cost efficiency

    const tasks = [];

    const createTask = (agent, title, desc, priority = 2) => {
        tasks.push({
            title: title,
            description: desc,
            department: agent.department,
            assignedAgent: agent._id,
            priority: priority,
            status: 'PENDING',
            requiresApproval: true,
            deadline: deadline,
            startTime: new Date(tomorrow.setHours(9, 0, 0, 0)), // 9 AM tomorrow
            type: 'task'
        });
    };

    agents.forEach(agent => {
        if (agent.name === "Lyra") createTask(agent, "Launch Content Strategy", "Create 3 LinkedIn posts announcing Catalyr's launch and value proposition.", 3);
        else if (agent.name === "Echo") createTask(agent, "Website Copy Review", "Review and polish the 'About' and 'Services' sections on catalyr.com for clarity.", 2);
        else if (agent.name === "Titan") createTask(agent, "Outreach Strategy", "Define the outreach plan for the first 50 potential startup clients.", 3);
        else if (agent.name === "Scout") createTask(agent, "Lead Scraping", "Find contact info for 20 recently funded startups in our region.", 2);
        else if (agent.name === "Bolt") createTask(agent, "Draft Cold Emails", "Draft 3 variations of cold outreach emails focusing on 'Zero-Debt Engineering'.", 2);
        else if (agent.name === "Nexus") createTask(agent, "Operational Cost Audit", "Review Hostinger subscription and ensure no other hidden costs. Track $1000 spend.", 3);
        else if (agent.name === "Helix") createTask(agent, "Team Onboarding Doc", "Prepare a 'Catalyr Culture' one-pager for future hires.", 1);
        else if (agent.name === "Nova") createTask(agent, "MVP Tech Stack Check", "Confirm tech stack readiness for new client intake (Repo templates, CI/CD).", 3);
        else if (agent.name === "Vector") createTask(agent, "Code Quality Standards", "Document the 'Zero-Debt' coding standards for the team.", 2);
        else if (agent.name === "Codey") createTask(agent, "Website Performance Optimization", "Ensure www.catalyr.com loads under 2s. Run Lighthouse audit.", 2);
        else if (agent.name === "Pixel") createTask(agent, "Portfolio Mockups", "Create 2 case study mockups (even if hypothetical) to showcase capability.", 2);
        else if (agent.name === "Zion") createTask(agent, "Vision Alignment", "Write a internal memo re-iterating the 'Engineering Partner' vs 'Agency' mindset.", 3);
        else if (agent.name === "Atlas") createTask(agent, "Burn Rate Analysis", "Calculate runaway based on current $1000 spend and projected revenue scenarios.", 3);

        // Fallback for any missed agents
        else createTask(agent, "Daily Standup Prep", "Prepare updates for the daily sync.", 1);
    });

    return tasks;
};

const run = async () => {
    await connectDB();

    try {
        console.log("Checking Agents...");
        let dbAgents = await Agent.find();

        if (dbAgents.length === 0) {
            console.log("Seeding Agents...");
            dbAgents = await Agent.insertMany(agentsList);
            console.log(`Seeded ${dbAgents.length} agents.`);
        } else {
            console.log(`Found ${dbAgents.length} existing agents.`);
            // Optional: Update missing agents if needed, skipping for now to keep it simple
        }

        console.log("Generating Tomorrow's Tasks...");
        const newTasks = generateMissionTasks(dbAgents);

        await Task.insertMany(newTasks);
        console.log(`Successfully scheduled ${newTasks.length} tasks for Tomorrow.`);

        process.exit(0);

    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
};

run();
