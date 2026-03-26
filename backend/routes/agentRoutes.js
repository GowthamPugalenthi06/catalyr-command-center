const express = require('express');
const router = express.Router();
const Agent = require('../models/Agent');

// GET /api/agents
router.get('/', async (req, res) => {
    try {
        const agents = await Agent.find().sort({ rank: 1 }); // Sort by rank (L1 first)
        res.json(agents);
    } catch (error) {
        res.status(500).json({ error: 'Server Error' });
    }
});

// GET /api/agents/:id
router.get('/:id', async (req, res) => {
    try {
        const agent = await Agent.findById(req.params.id);
        if (!agent) return res.status(404).json({ error: 'Agent not found' });
        res.json(agent);
    } catch (error) {
        res.status(500).json({ error: 'Server Error' });
    }
});

module.exports = router;
