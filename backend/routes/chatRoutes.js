const express = require('express');
const router = express.Router();
const ChatMessage = require('../models/ChatMessage');
const { routeMessage } = require('../agents/routerAgent');
const { processTaskRequest } = require('../agents/cooAgent');
const mongoose = require('mongoose');

// GET /api/chat/sessions - List unique sessions with metadata
router.get('/sessions', async (req, res) => {
    try {
        const sessions = await ChatMessage.aggregate([
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: "$sessionId",
                    lastMessage: { $first: "$rawMessage" },
                    updatedAt: { $first: "$createdAt" },
                    title: { $first: "$sessionTitle" } // Assuming titles are stored or we infer
                }
            },
            { $sort: { updatedAt: -1 } }
        ]);
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ error: 'Server Error' });
    }
});

// DELETE /api/chat/sessions/:sessionId - Clear specific chat session
router.delete('/sessions/:sessionId', async (req, res) => {
    try {
        await ChatMessage.deleteMany({ sessionId: req.params.sessionId });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Server Error' });
    }
});

// POST /api/chat - Send message (Session Aware)
// POST /api/chat - Send message (Session Aware)
router.post('/', async (req, res) => {
    try {
        const { message, senderId, sessionId } = req.body;
        const currentSessionId = sessionId || new mongoose.Types.ObjectId().toString();

        // 1. Save raw message
        const chatMsg = await ChatMessage.create({
            senderType: 'FOUNDER', // Assuming only founder talks for now
            senderId: senderId || null,
            sessionId: currentSessionId,
            rawMessage: message,
            status: 'RECEIVED'
        });

        // 2. Router Agent
        const routes = await routeMessage(message);
        console.log("Router Output:", JSON.stringify(routes, null, 2));

        // Quick adapt:
        const intents = Array.isArray(routes) ? routes.map(r => ({ intent: r.intent, confidence: 1.0 })) : [];

        chatMsg.parsedIntents = intents;
        chatMsg.status = 'ROUTED';
        await chatMsg.save();

        const routerOutput = Array.isArray(routes) ? routes : [routes];
        let chatIntent = routerOutput.find(r => r.intent === 'CHAT');
        const scheduleIntent = routerOutput.find(r => r.intent === 'SCHEDULE');

        // Check if we need to set a title for a new session
        const messageCount = await ChatMessage.countDocuments({ sessionId: currentSessionId });
        if (messageCount <= 1) {
            chatMsg.sessionTitle = message.substring(0, 30) + (message.length > 30 ? '...' : '');
            await chatMsg.save();
        }

        // --- INTERCEPT SCHEDULE QUERIES ---
        if (scheduleIntent && (message.toLowerCase().match(/(what|show|get|list)/))) {
            const Task = require('../models/Task');

            // Determine date range
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let targetStart = new Date(today);
            let targetEnd = new Date(today);
            targetEnd.setDate(targetEnd.getDate() + 1); // End of today

            if (message.toLowerCase().includes('tomorrow')) {
                targetStart.setDate(targetStart.getDate() + 1);
                targetEnd.setDate(targetEnd.getDate() + 1);
            }

            const tasks = await Task.find({
                $or: [
                    { startTime: { $gte: targetStart, $lt: targetEnd } },
                    { deadline: { $gte: targetStart, $lt: targetEnd } }
                ]
            }).sort({ startTime: 1 });

            let reply = "";
            if (tasks.length === 0) {
                reply = `You have no tasks scheduled for ${message.toLowerCase().includes('tomorrow') ? 'tomorrow' : 'today'}.`;
            } else {
                reply = `Here is your schedule for ${message.toLowerCase().includes('tomorrow') ? 'tomorrow' : 'today'}:\n` +
                    tasks.map(t => `- [${t.type === 'meeting' ? 'Meeting' : 'Task'}] ${t.title} (${t.startTime ? new Date(t.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Anytime'})`).join('\n');
            }

            chatIntent = { intent: 'CHAT', reply: reply };
        }

        if (chatIntent) {
            chatMsg.parsedIntents = [{ intent: 'CHAT', confidence: 1.0 }];
            chatMsg.status = 'COMPLETED';
            chatMsg.responseSummary = chatIntent.reply || "I am listening.";
            await chatMsg.save();

            await ChatMessage.create({
                senderType: 'AI_AGENT',
                senderId: 'SYSTEM',
                sessionId: currentSessionId,
                rawMessage: chatIntent.reply || "I am listening.",
                status: 'COMPLETED'
            });

            return res.json({ success: true, chatMessage: chatMsg, tasksCreated: 0, sessionId: currentSessionId });
        }

        // 3. COO Agent (Process each route/task)
        const taskIds = [];
        if (Array.isArray(routes)) {
            for (const route of routes) {
                if (route.intent === 'SCHEDULE' && chatIntent) continue;
                const task = await processTaskRequest(route, chatMsg._id);
                taskIds.push(task._id);
            }
        } else if (routes && typeof routes === 'object') {
            if (routes.intent !== 'SCHEDULE' || !chatIntent) {
                const task = await processTaskRequest(routes, chatMsg._id);
                taskIds.push(task._id);
            }
        }

        chatMsg.relatedTasks = taskIds;
        chatMsg.status = 'COMPLETED'; // processed
        await chatMsg.save();

        // PERSIST AI RESPONSE FOR TASKS
        const summary = `Request processed. Created ${taskIds.length} task(s).`;
        await ChatMessage.create({
            senderType: 'AI_AGENT',
            senderId: 'SYSTEM',
            sessionId: currentSessionId,
            rawMessage: summary,
            status: 'COMPLETED'
        });

        res.json({ success: true, chatMessage: chatMsg, tasksCreated: taskIds.length, sessionId: currentSessionId });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error', details: error.message });
    }
});

// GET /api/chat - Fetch History (Session Aware)
router.get('/', async (req, res) => {
    try {
        const { sessionId } = req.query;
        const query = sessionId ? { sessionId } : {}; // If no session ID, return all? Or maybe none? 

        // For backward compatibility, if no sessionId, we might return legacy messages (where sessionId exists: false) 
        // OR we just return the global stream if that's desired behavior. 
        // Let's default to returning specific session if provided.

        const messages = await ChatMessage.find(query)
            .sort({ createdAt: 1 })
            .limit(100);
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Server Error' });
    }
});

module.exports = router;
