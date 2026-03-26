const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Agent = require('../models/Agent');
const Task = require('../models/Task');
const Lead = require('../models/Lead');
const { executeTask } = require('../agents/executionEngine');

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

const run = async () => {
    await connectDB();

    try {
        console.log("--- CLEAN & POPULATE ---");

        // 1. Clean Data
        await Lead.deleteMany({});
        console.log("Deleted all Leads.");
        await Task.deleteMany({});
        console.log("Deleted all Tasks.");

        // 2. Ensure Agents
        let dbAgents = await Agent.find();
        if (dbAgents.length === 0) {
            console.log("Seeding Agents...");
            dbAgents = await Agent.insertMany(agentsList);
        }

        // 3. Generate & Execute TASKS for TODAY
        const today = new Date();
        // Set tasks to start at various times today
        const startHour = 9;

        console.log("Generating and Executing Tasks for Today...");

        for (const agent of dbAgents) {
            let title, desc, execute = true;

            // Unique Task Logic per Agent
            if (agent.name === "Lyra") {
                title = "Daily LinkedIn Post";
                desc = "Write a thought leadership LinkedIn post about 'Why Technical Debt Kills Startups'.";
            } else if (agent.name === "Echo") {
                title = "Website Hero Copy";
                desc = "Draft 3 variations of the hero section tagline for catalyr.com.";
            } else if (agent.name === "Titan") {
                title = "Sales Strategy Review";
                desc = "Analyze our current lack of clients and propose 3 immediate action steps.";
            } else if (agent.name === "Scout") {
                title = "Find 5 SaaS Leads";
                desc = "List 5 B2B SaaS startups founded in 2025 that need engineering help.";
            } else if (agent.name === "Bolt") {
                title = "Cold Email Draft";
                desc = "Write a cold email to a non-technical founder pitching our MVP services.";
            } else if (agent.name === "Pixel") {
                title = "Social Media Visuals";
                desc = "Describe the visual composition for Lyra's Technical Debt post.";
            } else if (agent.name === "Codey") {
                title = "CI/CD Pipeline Setup";
                desc = "Outline the steps to set up a GitHub Actions workflow for our monorepo.";
            } else {
                // Generic fallback for others, still executed
                title = `${agent.role} Daily Plan`;
                desc = `Outline the daily priorities for ${agent.role} to help Catalyr get its first client.`;
            }

            // Create Task
            const task = await Task.create({
                title: title,
                description: desc,
                department: agent.department,
                assignedAgent: agent._id,
                priority: 2,
                status: 'PENDING',
                requiresApproval: true,
                startTime: new Date(today.setHours(startHour + Math.floor(Math.random() * 8), 0, 0, 0)),
                deadline: new Date(today.setHours(18, 0, 0, 0)),
                type: 'task'
            });

            console.log(`Created: ${task.title} (${agent.name})`);

            // EXECUTE IT IMMEDIATELY
            if (execute) {
                console.log(`   Executing ${task.title}...`);
                await executeTask(task._id);
            }
        }

        console.log("--- DONE ---");
        process.exit(0);

    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
};

run();
