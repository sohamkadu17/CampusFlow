// Test Frontend-Backend Connection
// Run with: node test-connection.js

const http = require('http');

console.log('🧪 Testing Backend Connection...\n');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/health',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('✅ Backend is running!');
    console.log('📊 Status Code:', res.statusCode);
    console.log('📦 Response:', data);
    
    if (res.statusCode === 200) {
      console.log('\n🎉 SUCCESS: Backend is ready to accept connections!');
      console.log('\nNext steps:');
      console.log('1. Start frontend: cd Frontend && npm run dev');
      console.log('2. Open http://localhost:5173');
      console.log('3. Check browser console for API communication');
    } else {
      console.log('\n⚠️  Backend returned unexpected status code');
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Backend is NOT running');
  console.log('💡 Error:', error.message);
  console.log('\n📝 To start backend:');
  console.log('cd Backend');
  console.log('npm run dev');
  console.log('\n⚠️  Make sure:');
  console.log('- MongoDB is running');
  console.log('- Backend/.env file exists with MONGODB_URI');
  console.log('- Port 5000 is available');
});

req.end();
