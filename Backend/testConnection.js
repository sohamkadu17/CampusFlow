require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas!\n');
    
    const db = mongoose.connection.db;
    console.log('📊 Database:', db.databaseName);
    
    const collections = await db.listCollections().toArray();
    console.log('\n📋 Collections (' + collections.length + ' total):');
    
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`  • ${col.name.padEnd(20)} - ${count} documents`);
    }
    
    console.log('\n✅ Connection test successful!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
