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

    let connection;
    try {
        const { simpleParser } = require('mailparser');
        connection = await imaps.connect(config);
        await connection.openBox('INBOX');

        const searchCriteria = ['ALL'];
        const indexFetchOptions = {
            bodies: ['HEADER.FIELDS (UID)'], 
            markSeen: false,
            struct: false
        };
        const allMessages = await connection.search(searchCriteria, indexFetchOptions);
        
        const recentRefs = allMessages.slice(-10).reverse();
        if (recentRefs.length === 0) {
            return res.json([]);
        }

        const uids = recentRefs.map(m => m.attributes.uid);
        const fetchOptions = {
            bodies: [''], // Fetch full source
            markSeen: false,
            struct: true
        };
        const fullMessages = await connection.search([['UID', uids]], fetchOptions);
        const recentMessages = fullMessages.sort((a, b) => b.attributes.uid - a.attributes.uid);

        const emails = [];
        // Sequential parsing to prevent memory spikes from parallel parsing of large emails
        for (const msg of recentMessages) {
            const part = msg.parts.find(p => p.which === ''); 
            const id = msg.attributes.uid;

            try {
                const parsed = await simpleParser(part.body);
                // Truncate extremely large bodies to prevent OOM
                let bodyContent = parsed.text || parsed.html || "(No Content)";
                if (bodyContent.length > 50000) {
                    bodyContent = bodyContent.substring(0, 50000) + "\n\n... (Content truncated for performance) ...";
                }

                emails.push({
                    id: id,
                    from: parsed.from ? parsed.from.text : 'Unknown',
                    subject: parsed.subject || '(No Subject)',
                    date: parsed.date ? parsed.date.toISOString() : new Date().toISOString(),
                    body: bodyContent
                });
            } catch (err) {
                console.error("Parse error for msg", id, err);
                emails.push({
                    id: id, from: "Error", subject: "Error Parsing Email", date: new Date().toISOString(), body: "Could not parse."
                });
            }
        }

        res.json(emails);

    } catch (error) {
        console.error("IMAP Error:", error);
        res.status(500).json({ error: "Failed to fetch emails", details: error.message });
    } finally {
        if (connection) {
            connection.end();
        }
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

    let connection;
    try {
        connection = await imaps.connect(config);
        await connection.openBox('INBOX');

        // Move to Trash (Gmail behavior)
        await connection.moveMessage(id, '[Gmail]/Trash');

        res.json({ success: true, message: "Moved to Trash" });

    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ error: "Failed to delete email", details: error.message });
    } finally {
        if (connection) {
            connection.end();
        }
    }
});
module.exports = router;
