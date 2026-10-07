/**
 * Database seeder script.
 * Run once: node src/scripts/seed.js
 *
 * Creates Subscription documents from seedData.js.
 * Safe to re-run — uses upsert on customerId to avoid duplicates.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Subscription = require('../models/Subscription');
const { subscriptions } = require('../data/seedData');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/monthstick');
  console.log('[Seed] Connected to MongoDB');

  for (const sub of subscriptions) {
    await Subscription.findOneAndUpdate(
      { customerId: sub.customerId },
      sub,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  console.log(`[Seed] Upserted ${subscriptions.length} subscriptions`);
  await mongoose.disconnect();
  console.log('[Seed] Done');
}

seed().catch((err) => {
  console.error('[Seed] Error:', err);
  process.exit(1);
});
