const http = require('http');

const BASE_URL = 'http://localhost:5000/api';
const ADMIN_EMAIL = 'admin@luxestay.com';
const ADMIN_PASSWORD = 'admin_luxury_2024';

const endpoints = [
    '/auth/admin/stats?range=month',
    '/auth/admin/staff',
    '/auth/admin/locations',
    '/auth/admin/menu',
    '/auth/admin/notifications',
    '/auth/admin/food-orders',
    '/auth/admin/reservations',
    '/reviews/admin/all',
    '/contact/admin/all',
    '/auth/admin/coupons',
    '/support/admin/all',
    '/auth/admin/bookings'
];

function post(url, body) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const options = {
            hostname: u.hostname,
            port: u.port,
            path: u.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(JSON.stringify(body))
            }
        };
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try { resolve({ statusCode: res.statusCode, data: JSON.parse(data) }); }
                catch (e) { resolve({ statusCode: res.statusCode, data: data }); }
            });
        });
        req.on('error', reject);
        req.write(JSON.stringify(body));
        req.end();
    });
}

function get(url, token) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const options = {
            hostname: u.hostname,
            port: u.port,
            path: u.pathname + u.search,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                let parsed = data;
                try { parsed = JSON.parse(data); } catch (e) { }
                resolve({ statusCode: res.statusCode, data: parsed });
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function testEndpoint(endpoint, method, token) {
    console.log(`Testing ${endpoint}...`);
    const res = await get(`${BASE_URL}${endpoint}`, token);
    console.log(`  Result: ${res.statusCode}`);
    if (res.statusCode === 500) {
        console.log(`  ERROR 500 DATA:`, JSON.stringify(res.data, null, 2));
    }
}

async function runTests() {
    try {
        console.log('--- ADMIN API TEST START ---');
        const loginRes = await post(`${BASE_URL}/auth/login`, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
        if (loginRes.statusCode !== 200) {
            console.log('CRITICAL: Login failed:', loginRes.statusCode);
            return;
        }
        const token = loginRes.data.token;
        console.log('Login: OK');

        const testEndpoints = [
            ['/auth/admin/stats?range=month', 'GET'],
            ['/auth/admin/bookings', 'GET'],
            ['/auth/admin/staff', 'GET'],
            ['/auth/admin/locations', 'GET'],
            ['/auth/admin/menu', 'GET'],
            ['/auth/admin/food-orders', 'GET'],
            ['/auth/admin/reservations', 'GET'],
            ['/auth/admin/notifications', 'GET'],
            ['/reviews/admin/all', 'GET'],
            ['/contact/admin/all', 'GET'],
            ['/support/admin/all', 'GET']
        ];

        for (const [endpoint, method] of testEndpoints) {
            const res = await get(`${BASE_URL}${endpoint}`, token);
            console.log(`[${res.statusCode}] ${method} ${endpoint}`);
            if (res.statusCode === 500) {
                console.log('  ERROR:', JSON.stringify(res.data, null, 2));
            }
        }

        // Special case: Test rooms for first location
        const locRes = await get(`${BASE_URL}/auth/admin/locations`, token);
        if (locRes.statusCode === 200 && locRes.data.length > 0) {
            const locId = locRes.data[0]._id;
            const res = await get(`${BASE_URL}/auth/admin/rooms/${locId}`, token);
            console.log(`[${res.statusCode}] GET /auth/admin/rooms/${locId}`);
            if (res.statusCode === 500) {
                console.log('  ERROR:', JSON.stringify(res.data, null, 2));
            }
        }

        console.log('--- TEST COMPLETE ---');
    } catch (error) {
        console.error('SCRIPT ERROR:', error.message);
    }
}

runTests();
