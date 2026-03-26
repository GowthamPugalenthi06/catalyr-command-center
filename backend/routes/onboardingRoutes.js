const express = require('express');
const router = express.Router();
const multer = require('multer');
const { PDFParse } = require('pdf-parse');
const path = require('path');
const fs = require('fs');

const CompanyProfile = require('../models/CompanyProfile');
const OnboardingState = require('../models/OnboardingState');
const Agent = require('../models/Agent');
const { chunkText } = require('../agents/ragService');
const { getDefaultPrompt } = require('../agents/agentFactory');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer config for PDF upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const uniqueName = `company_${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
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
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No PDF file uploaded' });
        }

        const companyName = req.body.companyName || 'My Company';

        // Read and parse the PDF
        const pdfBuffer = fs.readFileSync(req.file.path);
        const parser = new PDFParse({ data: pdfBuffer });
        const textResult = await parser.getText();
        const pdfText = textResult.text;

        if (!pdfText || pdfText.trim().length === 0) {
            return res.status(400).json({ error: 'Could not extract text from PDF. Make sure it contains readable text.' });
        }

        // Chunk the text for RAG
        const chunks = chunkText(pdfText);

        // Upsert company profile (replace old one)
        await CompanyProfile.deleteMany({});
        const profile = await CompanyProfile.create({
            companyName,
            pdfFilename: req.file.filename,
            rawText: pdfText,
            chunks,
        });

        // Update onboarding state
        await OnboardingState.updateOne(
            {},
            {
                $set: {
                    pdfFilename: req.file.filename,
                    companyName,
                },
            },
            { upsert: true }
        );

        res.json({
            success: true,
            companyName,
            chunksCreated: chunks.length,
            textPreview: pdfData.text.substring(0, 500) + (pdfData.text.length > 500 ? '...' : ''),
            pages: pdfData.total,
        });

    } catch (error) {
        console.error('[Onboarding] Upload error:', error);
        res.status(500).json({ error: 'Failed to process PDF: ' + error.message });
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
