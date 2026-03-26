const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdf = require('pdf-parse');
const path = require('path');
const fs = require('fs');

const CompanyProfile = require('../models/CompanyProfile');
const OnboardingState = require('../models/OnboardingState');
const Agent = require('../models/Agent');
const Task = require('../models/Task');
const Lead = require('../models/Lead');
const ChatMessage = require('../models/ChatMessage');
const { chunkText } = require('../agents/ragService');
const { getDefaultPrompt } = require('../agents/agentFactory');
const { triggerDailyPlanning } = require('../scheduler');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer config for memory storage (process in memory, save only TXT)
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf' || file.mimetype === 'text/plain') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and TXT files are allowed'), false);
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 10MB max
});

// ──── AGENT DEFINITIONS (Full Company Workforce) ────
const AVAILABLE_AGENTS = [
    // Technical
    { name: 'Software Developer', role: 'Software Developer', department: 'Engineering', rank: 'L2', category: 'Technical', avatar: '💻', description: 'Writes code, implements features, fixes bugs, reviews architecture' },
    { name: 'QA/Test Engineer', role: 'QA/Test Engineer', department: 'QA', rank: 'L2', category: 'Technical', avatar: '🧪', description: 'Creates test plans, finds bugs, validates quality, writes automated tests' },
    { name: 'DevOps Engineer', role: 'DevOps Engineer', department: 'DevOps', rank: 'L2', category: 'Technical', avatar: '🔧', description: 'CI/CD pipelines, deployment, infrastructure, monitoring' },
    { name: 'Data Scientist', role: 'Data Scientist', department: 'Data', rank: 'L2', category: 'Technical', avatar: '📊', description: 'Data analysis, ML models, insights, reporting, KPI tracking' },
    { name: 'UI/UX Designer', role: 'UI/UX Designer', department: 'Design', rank: 'L2', category: 'Technical', avatar: '🎨', description: 'Wireframes, prototypes, design systems, UX research, accessibility' },
    // Management
    { name: 'Team Lead', role: 'Team Lead', department: 'Management', rank: 'L3', category: 'Management', avatar: '👥', description: 'Coordinates team tasks, code reviews, mentoring, sprint standups' },
    { name: 'Project Manager', role: 'Project Manager', department: 'Management', rank: 'L3', category: 'Management', avatar: '📋', description: 'Sprint planning, timelines, risk management, resource allocation' },
    { name: 'Product Manager', role: 'Product Manager', department: 'Product', rank: 'L3', category: 'Management', avatar: '🎯', description: 'Feature prioritization, roadmap, user stories, market research' },
    { name: 'CTO / IT Head', role: 'CTO / IT Head', department: 'Executive', rank: 'L5', category: 'Management', avatar: '🏗️', description: 'Technical strategy, architecture decisions, innovation direction' },
    // Support
    { name: 'HR Manager', role: 'HR Manager', department: 'HR', rank: 'L3', category: 'Support', avatar: '🤝', description: 'Hiring, onboarding, policies, employee engagement, performance reviews' },
    { name: 'Finance Manager', role: 'Finance Manager', department: 'Finance', rank: 'L3', category: 'Support', avatar: '💰', description: 'Budgets, invoices, financial reporting, cost optimization' },
    { name: 'Content Creator', role: 'Content Creator', department: 'Marketing', rank: 'L1', category: 'Support', avatar: '✍️', description: 'Blog posts, social media, copywriting, SEO content, brand voice' },
    { name: 'Digital Marketer', role: 'Digital Marketer', department: 'Marketing', rank: 'L2', category: 'Support', avatar: '📈', description: 'Lead generation, SEO/SEM, ad campaigns, email marketing, analytics' },
    { name: 'Sales Agent', role: 'Sales Agent', department: 'Sales', rank: 'L2', category: 'Support', avatar: '🤑', description: 'Lead qualification, outreach, pipeline management, proposals' },
    { name: 'COO', role: 'COO', department: 'Executive', rank: 'L4', category: 'Management', avatar: '⚙️', description: 'Operations oversight, workflow orchestration, cross-department coordination' },
];

// ──── GET /api/onboarding/status ────
router.get('/status', async (req, res) => {
    try {
        const state = await OnboardingState.findOne().sort({ createdAt: -1 });
        const profile = await CompanyProfile.findOne().sort({ createdAt: -1 });

        res.json({
            isComplete: state?.isComplete || false,
            selectedAgents: state?.selectedAgents || [],
            companyName: state?.companyName || profile?.companyName || '',
            pdfFilename: state?.pdfFilename || '',
            hasPdf: !!(profile && profile.chunks && profile.chunks.length > 0),
        });
    } catch (error) {
        console.error('[Onboarding] Status error:', error);
        res.status(500).json({ error: 'Failed to get onboarding status' });
    }
});

// ──── GET /api/onboarding/agents ────
router.get('/agents', async (req, res) => {
    res.json({ agents: AVAILABLE_AGENTS });
});

// ──── POST /api/onboarding/upload ────
router.post('/upload', upload.single('pdf'), async (req, res) => {
    console.log("📥 --- REQUEST RECEIVED ---");

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No PDF or TXT file uploaded' });
        }

        const companyName = req.body.companyName || 'My Company';

        console.log('📄 File received:', {
            name: req.file.originalname,
            size: req.file.size,
            type: req.file.mimetype
        });

        // ─────────────────────────────────────────────
        // STEP 1: Extract text safely
        // ─────────────────────────────────────────────
        let pdfText = '';
        let totalPages = 1;

        try {
            if (req.file.mimetype === 'text/plain') {
                pdfText = req.file.buffer.toString('utf8');
            } else {
                const data = await pdf(req.file.buffer, {
                    max: 10 // ✅ limit pages to avoid memory explosion
                });

                pdfText = data.text || '';
                totalPages = data.numpages || 1;
            }
        } catch (err) {
            console.error('❌ PDF PARSE ERROR:', err);
            return res.status(400).json({
                error: 'Invalid or unsupported PDF file'
            });
        }

        // ─────────────────────────────────────────────
        // STEP 2: Validate extracted text
        // ─────────────────────────────────────────────
        if (!pdfText || pdfText.trim().length === 0) {
            return res.status(400).json({
                error: 'Could not extract text from document.'
            });
        }

        console.log("📊 Extracted text length:", pdfText.length);

        // 🚨 HARD LIMIT (CRITICAL)
        if (pdfText.length > 500_000) {
            return res.status(400).json({
                error: 'Document too large after extraction (limit ~500k chars)'
            });
        }

        // ─────────────────────────────────────────────
        // STEP 3: Save as TXT (lightweight)
        // ─────────────────────────────────────────────
        const baseName = req.file.originalname.replace(/\.[^/.]+$/, "");
        const txtFilename = `processed_${baseName}_${Date.now()}.txt`;
        const txtPath = path.join(uploadsDir, txtFilename);

        fs.writeFileSync(txtPath, pdfText, 'utf8');

        // ─────────────────────────────────────────────
        // STEP 4: SAFE chunking (NO memory explosion)
        // ─────────────────────────────────────────────
        function safeChunkText(text, chunkSize = 1000) {
            const chunks = [];
            let i = 0;

            while (i < text.length) {
                chunks.push({
    text: text.slice(i, i + chunkSize)
}); 
                i += chunkSize;
            }

            return chunks;
        }

        console.log("✂️ Chunking text...");
        const chunks = safeChunkText(pdfText);

        console.log("✅ Chunks created:", chunks.length);

        // 🚨 SECOND SAFETY LIMIT
        if (chunks.length > 2000) {
            return res.status(400).json({
                error: 'Too many chunks generated. Document too large.'
            });
        }

        // ─────────────────────────────────────────────
        // STEP 5: Save to DB
        // ─────────────────────────────────────────────
        console.log("💾 Saving to DB...");

        await CompanyProfile.deleteMany({});

        await CompanyProfile.create({
            companyName,
            pdfFilename: txtFilename,
            rawText: pdfText,   // ⚠️ safe now (limited size)
            chunks              // ⚠️ safe chunking
        });

        await OnboardingState.updateOne(
            {},
            {
                $set: {
                    pdfFilename: txtFilename,
                    companyName
                }
            },
            { upsert: true }
        );

        // ─────────────────────────────────────────────
        // STEP 6: CLEAN MEMORY (VERY IMPORTANT)
        // ─────────────────────────────────────────────
        pdfText = null;
        if (req.file) req.file.buffer = null;

        // ─────────────────────────────────────────────
        // RESPONSE
        // ─────────────────────────────────────────────
        res.json({
            success: true,
            companyName,
            chunksCreated: chunks.length,
            textPreview: chunks[0]?.text?.substring(0, 300) || '',
            pages: totalPages
        });

    } catch (error) {
        console.error('🔥 [Onboarding] Upload error:', error);
        console.error(error.stack);

        res.status(500).json({
            error: 'Failed to process PDF: ' + error.message
        });
    }
});

// ──── POST /api/onboarding/select-agents ────
router.post('/select-agents', async (req, res) => {
    try {
        const { agents: selectedRoles } = req.body;

        if (!selectedRoles || !Array.isArray(selectedRoles) || selectedRoles.length === 0) {
            return res.status(400).json({ error: 'Please select at least one agent' });
        }

        // Clear all existing agents
        await Agent.deleteMany({});

        // Create selected agents in DB with their system prompts
        const createdAgents = [];
        for (const roleName of selectedRoles) {
            const agentDef = AVAILABLE_AGENTS.find(a => a.role === roleName || a.name === roleName);
            if (agentDef) {
                const agent = await Agent.create({
                    name: agentDef.name,
                    role: agentDef.role,
                    department: agentDef.department,
                    rank: agentDef.rank,
                    category: agentDef.category,
                    avatar: agentDef.avatar,
                    description: agentDef.description,
                    model: 'llama-3.3-70b-versatile',
                    isEnabled: true,
                    status: 'active',
                    systemPrompt: '', // Will be populated by getDefaultPrompt at runtime
                    tasksCompleted: 0,
                    performance: 100,
                });
                createdAgents.push(agent);
            }
        }

        // Mark onboarding as complete
        await OnboardingState.updateOne(
            {},
            {
                $set: {
                    isComplete: true,
                    selectedAgents: selectedRoles,
                    completedAt: new Date(),
                },
            },
            { upsert: true }
        );

        // 🔥 Kick off real-time task generation IMMEDIATELY in the background
        triggerDailyPlanning().catch(e => console.error("Initial Daily Planning Failed:", e));

        res.json({
            success: true,
            agentsCreated: createdAgents.length,
            agents: createdAgents.map(a => ({ name: a.name, role: a.role, department: a.department })),
        });

    } catch (error) {
        console.error('[Onboarding] Select agents error:', error);
        res.status(500).json({ error: 'Failed to set up agents: ' + error.message });
    }
});

// ──── DELETE /api/onboarding/reset ────
router.delete('/reset', async (req, res) => {
    try {
        await CompanyProfile.deleteMany({});
        await OnboardingState.deleteMany({});
        await Agent.deleteMany({});
        await Task.deleteMany({});
        await Lead.deleteMany({});
        await ChatMessage.deleteMany({});

        // Clean uploaded files
        if (fs.existsSync(uploadsDir)) {
            const files = fs.readdirSync(uploadsDir);
            for (const file of files) {
                fs.unlinkSync(path.join(uploadsDir, file));
            }
        }

        res.json({ success: true, message: 'Onboarding reset. All data cleared.' });
    } catch (error) {
        console.error('[Onboarding] Reset error:', error);
        res.status(500).json({ error: 'Failed to reset: ' + error.message });
    }
});

module.exports = router;
