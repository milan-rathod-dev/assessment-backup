const mongoose = require('mongoose');

/**
 * Establishes a connection to MongoDB via Mongoose.
 * Exits the process if the initial connection fails.
 *
 * @param {string} uri - MongoDB connection URI.
 */
async function connectDB(uri) {
  try {
    await mongoose.connect(uri);
    console.log(`[DB] Connected to MongoDB: ${mongoose.connection.host}`);
  } catch (err) {
    console.error('[DB] Connection failed:', err.message);
    process.exit(1);
  }
}

module.exports = { connectDB };
