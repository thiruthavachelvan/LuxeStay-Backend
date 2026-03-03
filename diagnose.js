const http = require('http');
const dotenv = require('dotenv');

dotenv.config();

function makeRequest(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => resolve({ status: res.statusCode, body }));
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function test() {
    // Test a few endpoints  
    const endpoints = [
        { method: 'POST', path: '/api/auth/signup', data: JSON.stringify({ email: 'diagnostic_test@example.com', password: 'test123' }) },
        { method: 'POST', path: '/api/auth/login', data: JSON.stringify({ email: 'admin@luxestay.com', password: 'Admin@123' }) },
        { method: 'GET', path: '/api/auth/profile', data: null },
        { method: 'GET', path: '/api/auth/payment-history', data: null },
        { method: 'POST', path: '/api/auth/food-order', data: JSON.stringify({ items: [], totalAmount: 0 }) },
        { method: 'GET', path: '/api/auth/food-order', data: null },
    ];

    for (const ep of endpoints) {
        const dataStr = ep.data || '';
        const res = await makeRequest({
            hostname: 'localhost', port: 5000, path: ep.path,
            method: ep.method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(dataStr)
            }
        }, dataStr || '');
        console.log(`${ep.method} ${ep.path} => ${res.status}`);
    }
}

test().catch(console.error);
