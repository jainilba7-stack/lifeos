const dotenv = require('dotenv');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

// Load environment variables


const app = require('./src/app');
const connectDB = require('./src/config/db');
const { initScheduledJobs } = require('./src/services/cronService');

const PORT = process.env.PORT || 3000;

// Connect Database & Start Server
const startServer = async () => {
  try {
    await connectDB();

    // Start Cron background workers
    initScheduledJobs();

    const server = app.listen(PORT, () => {
      console.log(`

 LifeOS Server running on http://localhost:${PORT}
 Web Client available at http://localhost:${PORT}
 Environment: ${process.env.NODE_ENV || 'development'}

      `);
    });

    // Handle Unhandled Rejections
    process.on('unhandledRejection', (err) => {
      console.error('[Unhandled Rejection Error]:', err.message);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
