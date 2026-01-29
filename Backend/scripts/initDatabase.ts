import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || '';

async function initializeDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully!');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    // Create collections with validation schemas
    console.log('\n📦 Creating collections...');

    // Users collection
    try {
      await db.createCollection('users', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['email', 'name', 'role'],
            properties: {
              email: { bsonType: 'string' },
              name: { bsonType: 'string' },
              role: { enum: ['student', 'organizer', 'admin'] },
              password: { bsonType: 'string' },
              supabaseId: { bsonType: 'string' },
              createdAt: { bsonType: 'date' },
              updatedAt: { bsonType: 'date' }
            }
          }
        }
      });
      console.log('  ✓ Users collection created');
    } catch (err: any) {
      if (err.code === 48) {
        console.log('  ⚠ Users collection already exists');
      } else {
        throw err;
      }
    }

    // Events collection
    try {
      await db.createCollection('events', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['title', 'description', 'date', 'organizer', 'status'],
            properties: {
              title: { bsonType: 'string' },
              description: { bsonType: 'string' },
              date: { bsonType: 'date' },
              venue: { bsonType: 'string' },
              capacity: { bsonType: 'int' },
              organizer: { bsonType: 'objectId' },
              status: { enum: ['draft', 'pending', 'approved', 'rejected', 'live', 'completed', 'cancelled'] },
              category: { bsonType: 'string' },
              tags: { bsonType: 'array' },
              registrationDeadline: { bsonType: 'date' },
              registrationFee: { bsonType: 'number' },
              rulebookUrl: { bsonType: 'string' },
              posterUrl: { bsonType: 'string' },
              createdAt: { bsonType: 'date' },
              updatedAt: { bsonType: 'date' }
            }
          }
        }
      });
      console.log('  ✓ Events collection created');
    } catch (err: any) {
      if (err.code === 48) {
        console.log('  ⚠ Events collection already exists');
      } else {
        throw err;
      }
    }

    // Registrations collection
    try {
      await db.createCollection('registrations', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['event', 'user', 'status'],
            properties: {
              event: { bsonType: 'objectId' },
              user: { bsonType: 'objectId' },
              status: { enum: ['pending', 'confirmed', 'cancelled', 'attended'] },
              paymentStatus: { enum: ['pending', 'completed', 'failed', 'refunded'] },
              teamName: { bsonType: 'string' },
              teamMembers: { bsonType: 'array' },
              checkedIn: { bsonType: 'bool' },
              checkedInAt: { bsonType: 'date' },
              createdAt: { bsonType: 'date' },
              updatedAt: { bsonType: 'date' }
            }
          }
        }
      });
      console.log('  ✓ Registrations collection created');
    } catch (err: any) {
      if (err.code === 48) {
        console.log('  ⚠ Registrations collection already exists');
      } else {
        throw err;
      }
    }

    // Bookings collection (for venues/resources)
    try {
      await db.createCollection('bookings', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['venue', 'event', 'startTime', 'endTime', 'status'],
            properties: {
              venue: { bsonType: 'string' },
              event: { bsonType: 'objectId' },
              startTime: { bsonType: 'date' },
              endTime: { bsonType: 'date' },
              status: { enum: ['pending', 'approved', 'rejected', 'cancelled'] },
              purpose: { bsonType: 'string' },
              resources: { bsonType: 'array' },
              createdAt: { bsonType: 'date' },
              updatedAt: { bsonType: 'date' }
            }
          }
        }
      });
      console.log('  ✓ Bookings collection created');
    } catch (err: any) {
      if (err.code === 48) {
        console.log('  ⚠ Bookings collection already exists');
      } else {
        throw err;
      }
    }

    // Notifications collection
    try {
      await db.createCollection('notifications', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['user', 'type', 'title', 'message'],
            properties: {
              user: { bsonType: 'objectId' },
              type: { enum: ['event', 'registration', 'booking', 'system'] },
              title: { bsonType: 'string' },
              message: { bsonType: 'string' },
              read: { bsonType: 'bool' },
              createdAt: { bsonType: 'date' }
            }
          }
        }
      });
      console.log('  ✓ Notifications collection created');
    } catch (err: any) {
      if (err.code === 48) {
        console.log('  ⚠ Notifications collection already exists');
      } else {
        throw err;
      }
    }

    // Create indexes for better query performance
    console.log('\n📊 Creating indexes...');

    // Users indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ supabaseId: 1 }, { unique: true, sparse: true });
    console.log('  ✓ Users indexes created');

    // Events indexes
    await db.collection('events').createIndex({ organizer: 1 });
    await db.collection('events').createIndex({ status: 1 });
    await db.collection('events').createIndex({ date: 1 });
    await db.collection('events').createIndex({ category: 1 });
    await db.collection('events').createIndex({ tags: 1 });
    console.log('  ✓ Events indexes created');

    // Registrations indexes
    await db.collection('registrations').createIndex({ event: 1, user: 1 }, { unique: true });
    await db.collection('registrations').createIndex({ user: 1 });
    await db.collection('registrations').createIndex({ status: 1 });
    console.log('  ✓ Registrations indexes created');

    // Bookings indexes
    await db.collection('bookings').createIndex({ event: 1 });
    await db.collection('bookings').createIndex({ venue: 1, startTime: 1, endTime: 1 });
    await db.collection('bookings').createIndex({ status: 1 });
    console.log('  ✓ Bookings indexes created');

    // Notifications indexes
    await db.collection('notifications').createIndex({ user: 1, read: 1 });
    await db.collection('notifications').createIndex({ createdAt: -1 });
    console.log('  ✓ Notifications indexes created');

    // List all collections
    console.log('\n📋 Database collections:');
    const collections = await db.listCollections().toArray();
    collections.forEach((collection) => {
      console.log(`  • ${collection.name}`);
    });

    // Show database stats
    console.log('\n📈 Database statistics:');
    const stats = await db.stats();
    console.log(`  • Database: ${db.databaseName}`);
    console.log(`  • Collections: ${stats.collections}`);
    console.log(`  • Data Size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  • Storage Size: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  • Indexes: ${stats.indexes}`);

    console.log('\n✅ Database initialization completed successfully!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the initialization
initializeDatabase()
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
