const cron = require('node-cron');
const Task = require('./models/Task');
const Agent = require('./models/Agent');
const { executeTask } = require('./agents/executionEngine');

// Initialize Daily Jobs
const initScheduler = () => {
    console.log('[Scheduler] Initialized');

    // Run every day at Midnight (12:00 AM) to plan the NEXT day or TODAY
    cron.schedule('0 0 * * *', async () => {
        console.log('[Scheduler] Running Daily Planning at Midnight...');
        await triggerDailyPlanning();
    });
};

async function triggerDailyPlanning() {
    try {
        const dateStr = new Date().toLocaleDateString();
        const dailyPlanKey = `Daily Plan: ${dateStr}`;

        // Check if we already planned today (Simple check via a "Plan Task" or unique logic)
        // For now, we will check if ANY task with today's date exists to avoid double planning
        // In a real app, we'd store "LastPlannedDate" in DB.
        // Let's rely on the COO's generated tasks being unique enough or add a "Daily Planning" log task.

        // BETTER APPROACH: Just call the COO, iterate tasks, and create them if they don't exist.
        const cooAgent = require('./agents/cooAgent');
        const tasks = await cooAgent.planDailyWork();

        if (!tasks || tasks.length === 0) return;

        for (const t of tasks) {
            // Check for duplicate title today
            const exists = await Task.findOne({
                title: t.title,
                createdAt: {
                    $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    $lt: new Date(new Date().setHours(23, 59, 59, 999))
                }
            });

            if (exists) {
                console.log(`[Scheduler] Task "${t.title}" already exists today. Skipping.`);
                continue;
            }

            // Find best agent for department (Simple round-robin or role match in future)
            // For now, assign to Department Head or random agent in dept
            const agent = await Agent.findOne({ department: t.department });

            const priorityMap = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };

            const newTask = await Task.create({
                title: t.title || "Untitled Task",
                description: t.description,
                department: t.department,
                priority: priorityMap[t.priority] || 1, // Default to 1 (Low) if mismatch
                assignedAgent: agent ? agent._id : null,
                status: 'PENDING',
                requiresApproval: true,
                deadline: new Date(Date.now() + 24 * 60 * 60 * 1000)
            });

            console.log(`[Scheduler] Created Goal: ${t.title}`);
            executeTask(newTask._id);
        }

    } catch (e) {
        console.error('[Scheduler] Error in daily planning:', e);
    }
}

module.exports = { initScheduler };
