const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');

// GET /api/leads - Get all leads
router.get('/', async (req, res) => {
    try {
        const leads = await Lead.find().sort({ createdAt: -1 });
        res.json(leads);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/leads - Create manual lead
router.post('/', async (req, res) => {
    try {
        const lead = new Lead(req.body);
        const newLead = await lead.save();
        res.status(201).json(newLead);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
