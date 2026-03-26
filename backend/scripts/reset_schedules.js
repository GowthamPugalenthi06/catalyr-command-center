const mongoose = require('mongoose');
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

const tasksList = [
    { title: "Morning Sync", description: "Daily team synchronization meeting" },
    { title: "Client Review", description: "Reviewing project status with client" },
    { title: "Development Sprint", description: "Focus time for development tasks" },
    { title: "Lunch Break", description: "Break time" },
    { title: "Code Review", description: "Reviewing pull requests" },
    { title: "Team Wrap-up", description: "End of day sync" }
];

const resetSchedules = async () => {
    await connectDB();

    try {
        // 1. Delete all existing tasks
        await Task.deleteMany({});
        console.log('Cleared all existing tasks.');

        // 2. Generate new tasks for today, 9 AM to 9 PM
        const now = new Date();
        const startHour = 9;
        const endHour = 21; // 9 PM
        const todayStr = now.toLocaleDateString();

        console.log(`Generating tasks for ${todayStr} from ${startHour}:00 to ${endHour}:00...`);

        const newTasks = [];
        let currentHour = startHour;
        let taskIndex = 0;

        while (currentHour < endHour) {
            const startTime = new Date(now);
            startTime.setHours(currentHour, 0, 0, 0);

            const endTime = new Date(now);
            // 2-hour blocks for variety, or 1 hour? Let's do 2 hour blocks to fit 9am-9pm (12 hours) with ~6 tasks
            const duration = 2;
            endTime.setHours(currentHour + duration, 0, 0, 0);

            // Cycle through sample tasks
            const taskTemplate = tasksList[taskIndex % tasksList.length];
            taskIndex++;

            newTasks.push({
                title: taskTemplate.title,
                description: taskTemplate.description,
                status: 'DONE', // Completed as requested
                startTime: startTime,
                deadline: endTime, // aligning deadline with end time for schedule view
                type: 'task', // or meeting
                priority: 2,
                department: 'Operations', // Default
                requiresApproval: false
            });

            currentHour += duration;
        }

        await Task.insertMany(newTasks);
        console.log(`Successfully created ${newTasks.length} tasks.`);

        process.exit(0);

    } catch (error) {
        console.error('Error resetting schedules:', error);
        process.exit(1);
    }
};

resetSchedules();
