const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI;

    // Attempt standard connection with 3-second timeout
    await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`[LifeOS DB] Connected to MongoDB at: ${mongoose.connection.host}`);
  } catch (err) {
    console.warn(`[LifeOS DB] External MongoDB connection failed (${err.message}). Launching Memory MongoDB fallback...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
      console.log(`[LifeOS DB] Successfully connected to In-Memory MongoDB Server at: ${mongoUri}`);
    } catch (memErr) {
      console.error('[LifeOS DB] Failed to start In-Memory MongoDB Server:', memErr);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
