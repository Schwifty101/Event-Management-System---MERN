import app from './src/app.js';
import dotenv from 'dotenv';
import { testConnection } from './src/config/db.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

// Check database connection before starting server
async function startServer() {
  try {
    // Test database connection
    const isConnected = await testConnection();

    if (!isConnected) {
      console.error('Failed to connect to database. Check your configuration.');
      process.exit(1);
    }

    // Start server if database connection is successful
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`API Documentation available at http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Server startup error:', error.message);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();