import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI as string;

const initDb = async () => {
  await mongoose.connect(MONGODB_URI, { dbName: 'pulseops' });
  const db = mongoose.connection.db!;

  // Time-series collection for metrics
  const collections = await db.listCollections({ name: 'metrics' }).toArray();

  if (collections.length === 0) {
    await db.createCollection('metrics', {
      timeseries: {
        timeField: 'timestamp',
        metaField: 'serviceId',
        granularity: 'seconds',
      },
      // Auto expire metrics after 30 days
      expireAfterSeconds: 30 * 24 * 60 * 60,
    });
    console.log('✅ Time-series collection created with 30 day TTL');
  } else {
    console.log('ℹ️  metrics collection already exists');

    // Try to set expireAfterSeconds on existing collection
    try {
      await db.command({
        collMod: 'metrics',
        expireAfterSeconds: 30 * 24 * 60 * 60,
      });
      console.log('✅ TTL updated on existing metrics collection');
    } catch {
      console.log('ℹ️  TTL already set or not applicable');
    }
  }

 // TTL index on logs — expire after 30 days
  const logsCollection = db.collection('logs');

  try {
    // Drop existing index if it exists without TTL
    await logsCollection.dropIndex('timestamp_1');
    console.log('✅ Dropped existing timestamp index on logs');
  } catch {
    console.log('ℹ️  No existing timestamp index to drop');
  }

  await logsCollection.createIndex(
    { timestamp: 1 },
    { expireAfterSeconds: 30 * 24 * 60 * 60 }
  );
  console.log('✅ TTL index created on logs collection — expires after 30 days');

  await mongoose.disconnect();
  console.log('🔌 Done');
  process.exit(0);
};

initDb();