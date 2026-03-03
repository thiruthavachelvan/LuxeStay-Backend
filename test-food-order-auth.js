const http = require('http');

// 1. Sign up the user first to ensure they exist
const signupData = JSON.stringify({ email: `test_${Date.now()}@example.com`, password: 'password123' });

const signupReq = http.request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/signup',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': signupData.length }
}, (res) => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
        let user;
        try {
            user = JSON.parse(body);
            console.log('Signup Successful, token:', user.token ? 'Yes' : 'No');
        } catch (e) {
            console.error('Signup failed to parse:', body);
            return;
        }

        if (!user.token) return;

        // 2. Try the food order route
        const orderData = JSON.stringify({
            items: [{ menuItem: 'test_item_id_123', quantity: 1, priceAtOrder: 10 }],
            totalAmount: 10
        });

        const orderReq = http.request({
            hostname: 'localhost',
            port: 5000,
            path: '/api/auth/food-order',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`,
                'Content-Length': orderData.length
            }
        }, (orderRes) => {
            console.log(`Order STATUS: ${orderRes.statusCode}`);
            let orderBody = '';
            orderRes.on('data', d => orderBody += d);
            orderRes.on('end', () => console.log('Order Response:', orderBody));
        });

        orderReq.on('error', console.error);
        orderReq.write(orderData);
        orderReq.end();
    });
});

signupReq.on('error', console.error);
signupReq.write(signupData);
signupReq.end();
