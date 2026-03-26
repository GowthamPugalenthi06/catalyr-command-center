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
            { $sort: { createdAt: 1 } }, // Oldest first to capture title from first message
            {
                $group: {
                    _id: "$sessionId",
                    lastMessage: { $last: "$rawMessage" },
                    updatedAt: { $last: "$createdAt" },
                    title: { $first: "$sessionTitle" } // First message has the title
                }
            },
            { $sort: { updatedAt: -1 } } // Most recent conversation at top
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

        const routerOutput = routes.tasks || [];
        const chatResponse = routes.chatResponse || "";

        chatMsg.parsedIntents = routerOutput.map(t => ({ intent: t.intent, confidence: 1.0 }));
        chatMsg.status = 'ROUTED';
        await chatMsg.save();

        const scheduleIntent = routerOutput.find(r => r.intent === 'SCHEDULE');

        // Check if we need to set a title for a new session
        const existingTitleMsg = await ChatMessage.findOne({ sessionId: currentSessionId, sessionTitle: { $exists: true, $ne: null } });
        if (!existingTitleMsg) {
            chatMsg.sessionTitle = message.substring(0, 40).trim() + (message.length > 40 ? '...' : '');
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

            chatMsg.responseSummary = reply || chatResponse || "I am listening.";
            await chatMsg.save();

            await ChatMessage.create({
                senderType: 'AI_AGENT',
                senderId: 'SYSTEM',
                sessionId: currentSessionId,
                rawMessage: reply || chatResponse || "I am listening.",
                status: 'COMPLETED'
            });

            return res.json({ success: true, chatMessage: chatMsg, tasksCreated: 0, sessionId: currentSessionId });
        }

        // 3. COO Agent (Process each route/task)
        const taskIds = [];
        for (const route of routerOutput) {
            try {
                if (route.intent === 'SCHEDULE' && chatResponse) continue;
                const task = await processTaskRequest(route, chatMsg._id);
                if (task?._id) taskIds.push(task._id);
            } catch (e) {
                console.error("[ChatRoute] Individual task spawn failed:", e);
            }
        }

        // --- INTERCEPT LEAD GENERATION ---
        if (message.toLowerCase().includes('lead') && (message.match(/\d+/) || message.toLowerCase().includes('generate'))) {
            const Lead = require('../models/Lead');
            const countMatch = message.match(/\d+/);
            const count = countMatch ? parseInt(countMatch[0]) : 5;
            
            const newLeads = [];
            for(let i=0; i<count; i++) {
               const lead = await Lead.create({
                   name: `Lead ${Math.floor(Math.random() * 1000)}`,
                   company: `Startup ${String.fromCharCode(65 + i)}`,
                   email: `contact@startup${i}.com`,
                   source: 'AI Command Center',
                   warmthScore: 40 + Math.floor(Math.random() * 50),
                   status: 'NEW'
               });
               newLeads.push(lead._id);
            }
            
            chatMsg.status = 'COMPLETED';
            chatMsg.responseSummary = `Succesfully generated ${count} leads for you. You can view them on the Leads page!`;
            await chatMsg.save();

            await ChatMessage.create({
                senderType: 'AI_AGENT',
                senderId: 'SYSTEM',
                sessionId: currentSessionId,
                rawMessage: chatMsg.responseSummary,
                status: 'COMPLETED'
            });

            return res.json({ success: true, chatMessage: chatMsg, tasksCreated: 0, sessionId: currentSessionId });
        }

        // PERSIST AI RESPONSE
        const finalMessage = chatResponse || (taskIds.length > 0 ? `Request processed. Created ${taskIds.length} task(s).` : "I've processed your request.");
        
        await ChatMessage.create({
            senderType: 'AI_AGENT',
            senderId: 'SYSTEM',
            sessionId: currentSessionId,
            rawMessage: finalMessage,
            status: 'COMPLETED'
        });

        chatMsg.responseSummary = finalMessage;
        chatMsg.relatedTasks = taskIds;
        chatMsg.status = 'COMPLETED';
        await chatMsg.save();

        res.json({ success: true, chatMessage: chatMsg, tasksCreated: taskIds.length, sessionId: currentSessionId });

    } catch (error) {
        console.error("--- CHAT ROUTE CRITICAL ERROR ---");
        console.error(error);
        res.status(500).json({ 
            error: 'Server Error', 
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
        });
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
