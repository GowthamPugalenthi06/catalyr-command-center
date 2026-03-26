const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const imaps = require('imap-simple');

// Environment variables
const EMAIL_USER = process.env.EMAIL_USER || 'catalyr06@gmail.com';
const EMAIL_PASS = process.env.EMAIL_PASSWORD; // User app password

// 1. GET /api/email/inbox - Fetch recent emails
router.get('/inbox', async (req, res) => {
    // Basic check without returning mock data
    if (!EMAIL_PASS) {
        return res.status(500).json({ error: "EMAIL_PASSWORD not configured in backend" });
    }

    const config = {
        imap: {
            user: EMAIL_USER,
            password: EMAIL_PASS,
            host: 'imap.gmail.com',
            port: 993,
            tls: true,
            tlsOptions: { rejectUnauthorized: false },
            authTimeout: 30000,
            connTimeout: 30000,
            readyTimeout: 30000
        }
    };

    const { simpleParser } = require('mailparser');

    // ... (existing code)

    try {
        const connection = await imaps.connect(config);
        await connection.openBox('INBOX');

        const searchCriteria = ['ALL'];
        const fetchOptions = {
            bodies: [''], // Fetch full source
            markSeen: false,
            struct: true
        };

        // Fetch last 10 emails
        const messages = await connection.search(searchCriteria, fetchOptions);
        const recentMessages = messages.slice(-10).reverse();

        const emails = await Promise.all(recentMessages.map(async (msg) => {
            const part = msg.parts.find(p => p.which === ''); // Full source
            const id = msg.attributes.uid;

            try {
                const parsed = await simpleParser(part.body);
                return {
                    id: id,
                    from: parsed.from ? parsed.from.text : 'Unknown',
                    subject: parsed.subject || '(No Subject)',
                    date: parsed.date ? parsed.date.toISOString() : new Date().toISOString(),
                    body: parsed.text || parsed.html || "(No Content)"
                };
            } catch (err) {
                console.error("Parse error for msg", id, err);
                return {
                    id: id,
                    from: "Error",
                    subject: "Error Parsing Email",
                    date: new Date().toISOString(),
                    body: "Could not parse email content."
                };
            }
        }));

        connection.end();
        res.json(emails);

    } catch (error) {
        console.error("IMAP Error:", error);
        res.status(500).json({ error: "Failed to fetch emails", details: error.message, stack: error.stack });
    }
});

// 2. POST /api/email/send - Send an email
router.post('/send', async (req, res) => {
    const { to, subject, text, html, body } = req.body;

    if (!EMAIL_PASS) {
        return res.status(500).json({ error: "EMAIL_PASSWORD not configured" });
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    try {
        const info = await transporter.sendMail({
            from: `"Catalyr Command Center" <${EMAIL_USER}>`,
            to,
            subject,
            text: text || body, // Use body if text is missing
            html: html || (body ? body.replace(/\n/g, '<br>') : undefined) // Simple HTML fallback
        });

        console.log("Message sent: %s", info.messageId);
        res.json({ success: true, messageId: info.messageId });
    } catch (error) {
        console.error("SMTP Error:", error);
        res.status(500).json({ error: "Failed to send email" });
    }
});
// 3. DELETE /api/email/:id - Move email to Trash
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    if (!EMAIL_PASS) {
        return res.status(500).json({ error: "EMAIL_PASSWORD not configured" });
    }

    const config = {
        imap: {
            user: EMAIL_USER,
            password: EMAIL_PASS,
            host: 'imap.gmail.com',
            port: 993,
            tls: true,
            tlsOptions: { rejectUnauthorized: false },
            authTimeout: 10000
        }
    };

    try {
        const connection = await imaps.connect(config);
        await connection.openBox('INBOX');

        // Move to Trash (Gmail behavior)
        // Note: For Gmail, usually moving to [Gmail]/Trash is enough.
        await connection.moveMessage(id, '[Gmail]/Trash');

        connection.end();
        res.json({ success: true, message: "Moved to Trash" });

    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ error: "Failed to delete email", details: error.message });
    }
});
module.exports = router;
