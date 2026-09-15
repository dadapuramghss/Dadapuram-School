const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/analytics/leaderboard?standard=All&section=All&rankBy=Marks',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + require('jsonwebtoken').sign({id: 'dummy', role: 'admin'}, process.env.JWT_SECRET || 'edupulse_jwt_secret_key_2024')
  }
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(data);
  });
});

req.on('error', error => {
  console.error(error);
});
req.end();
