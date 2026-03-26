const imaps = require('imap-simple');
require('dotenv').config({ path: '../.env' }); // Adjust path if running from scripts dir

const EMAIL_USER = process.env.EMAIL_USER || 'catalyr06@gmail.com';
const EMAIL_PASS = process.env.EMAIL_PASSWORD;

if (!EMAIL_PASS) {
    console.error("Error: EMAIL_PASSWORD not found in .env");
    process.exit(1);
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
        readyTimeout: 30000,
        debug: console.log // Log IMAP protocol details
    }
};

async function testConnection() {
    console.log("Attempting to connect to IMAP...");
    console.log(`User: ${EMAIL_USER}`);

    try {
        const connection = await imaps.connect(config);
        console.log("Connection successful!");

        await connection.openBox('INBOX');
        console.log("INBOX opened successfully.");

        const searchCriteria = ['ALL'];
        const fetchOptions = { bodies: ['HEADER'], markSeen: false };

        // Fetch 1 email to verify
        const messages = await connection.search(searchCriteria, fetchOptions);
        console.log(`Found ${messages.length} messages.`);

        connection.end();
        console.log("Connection closed.");

    } catch (error) {
        console.error("IMAP Connection Failed:", error);
    }
}

testConnection();
