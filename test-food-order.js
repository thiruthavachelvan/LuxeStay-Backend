const http = require('http');

const data = JSON.stringify({
    items: [{ menuItem: 'test', quantity: 1, priceAtOrder: 10 }],
    totalAmount: 10
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/food-order',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.on('data', (d) => {
        process.stdout.write(d);
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.write(data);
req.end();
