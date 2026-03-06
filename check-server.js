// Simple script to check if server and database are working
const http = require('http');

console.log('=== SERVER CONNECTION CHECK ===\n');

// Check if server is responding
const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/employees',
  method: 'GET',
  timeout: 5000
};

console.log('Testing connection to: http://localhost:3001/api/employees\n');

const req = http.request(options, (res) => {
  console.log(`✅ Server is responding!`);
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Status Message: ${res.statusMessage}\n`);

  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('Response Data:');
      console.log(JSON.stringify(json, null, 2));
      
      if (json.success && json.data) {
        console.log(`\n✅ SUCCESS: Found ${json.data.length} employees`);
      } else {
        console.log('\n❌ ERROR: API returned success: false');
      }
    } catch (e) {
      console.log('❌ ERROR: Invalid JSON response');
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.log('❌ CONNECTION FAILED!');
  console.log(`Error: ${e.message}\n`);
  console.log('Possible causes:');
  console.log('1. Server is not running - Run: node server.js');
  console.log('2. Server is running on different port');
  console.log('3. Firewall blocking connection');
  console.log('\nTo start the server, run:');
  console.log('  node server.js');
});

req.on('timeout', () => {
  console.log('❌ CONNECTION TIMEOUT!');
  console.log('Server is not responding within 5 seconds');
  req.destroy();
});

req.end();
