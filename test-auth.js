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
    const loginData = JSON.stringify({ email: 'admin@luxestay.com', password: 'Admin@123' });
    const loginRes = await makeRequest({
        hostname: 'localhost', port: 5000, path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginData) }
    }, loginData);

    const loginJSON = JSON.parse(loginRes.body);
    const token = loginJSON.token;
    console.log('Logged in as:', loginJSON.email, '| Role:', loginJSON.role, '| Token:', !!token);

    if (!token) return;

    const orderData = JSON.stringify({
        items: [{ menuItem: '507f1f77bcf86cd799439011', quantity: 2, priceAtOrder: 250 }],
        totalAmount: 500
    });

    const orderRes = await makeRequest({
        hostname: 'localhost', port: 5000, path: '/api/auth/food-order',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Content-Length': Buffer.byteLength(orderData)
        }
    }, orderData);

    console.log('\n=== ORDER RESPONSE ===');
    console.log('Status:', orderRes.status);
    console.log('Body:', orderRes.body);
}

test().catch(console.error);
