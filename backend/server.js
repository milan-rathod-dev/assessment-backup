require('dotenv').config();
const app = require('./src/app');
const { connectDB } = require('./src/config/db');

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/monthstick';

async function start() {
  await connectDB(MONGO_URI);
  app.listen(PORT, () => {
    console.log(`[Server] MonthStick API running on http://localhost:${PORT}`);
  });
}

start();
