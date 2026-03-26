const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Task = require('./models/Task');
const connectDB = require('./config/db');

dotenv.config();

const cleanupDuplicates = async () => {
    try {
        await connectDB();
        console.log('Connected to DB');

        const dateStr = new Date().toLocaleDateString();
        const types = [`Daily Content: ${dateStr}`, `Daily Lead Gen: ${dateStr}`];

        for (const title of types) {
            const tasks = await Task.find({ title }).sort({ createdAt: -1 });

            if (tasks.length > 1) {
                console.log(`Found ${tasks.length} tasks for "${title}". Keeping the newest one.`);

                // Keep the first one (newest due to sort), delete the rest
                const toDelete = tasks.slice(1);
                const deleteIds = toDelete.map(t => t._id);

                await Task.deleteMany({ _id: { $in: deleteIds } });
                console.log(`Deleted ${deleteIds.length} duplicate tasks.`);
            } else {
                console.log(`No duplicates found for "${title}".`);
            }
        }

        console.log('Cleanup complete.');
        process.exit();
    } catch (error) {
        console.error('Cleanup failed:', error);
        process.exit(1);
    }
};

cleanupDuplicates();
