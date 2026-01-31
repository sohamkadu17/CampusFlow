const mongoose = require('mongoose');
require('dotenv').config();

const fixRegistrationIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const registrationsCollection = db.collection('registrations');

    // Get current indexes
    const indexes = await registrationsCollection.indexes();
    console.log('\n📋 Current indexes:');
    indexes.forEach(idx => console.log(`  - ${idx.name}:`, idx.key));

    // Drop old incompatible indexes (but keep _id index)
    for (const index of indexes) {
      if (index.name !== '_id_' && 
          (index.name === 'event_1_user_1' || 
           index.name.includes('event_') || 
           index.name.includes('user_'))) {
        console.log(`\n🗑️  Dropping old index: ${index.name}`);
        await registrationsCollection.dropIndex(index.name);
      }
    }

    // Create correct indexes
    console.log('\n✨ Creating correct indexes...');
    
    // Unique compound index for userId + eventId
    await registrationsCollection.createIndex(
      { userId: 1, eventId: 1 }, 
      { unique: true, name: 'userId_1_eventId_1' }
    );
    console.log('  ✅ Created: userId_1_eventId_1 (unique)');

    // Index for registration number
    await registrationsCollection.createIndex(
      { registrationNumber: 1 }, 
      { unique: true, name: 'registrationNumber_1' }
    );
    console.log('  ✅ Created: registrationNumber_1 (unique)');

    // Index for eventId (for queries)
    await registrationsCollection.createIndex(
      { eventId: 1 }, 
      { name: 'eventId_1' }
    );
    console.log('  ✅ Created: eventId_1');

    // Index for userId (for queries)
    await registrationsCollection.createIndex(
      { userId: 1 }, 
      { name: 'userId_1' }
    );
    console.log('  ✅ Created: userId_1');

    // Verify new indexes
    const newIndexes = await registrationsCollection.indexes();
    console.log('\n📋 Updated indexes:');
    newIndexes.forEach(idx => console.log(`  - ${idx.name}:`, idx.key));

    console.log('\n✅ Index fix completed successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing indexes:', error);
    process.exit(1);
  }
};

fixRegistrationIndexes();
