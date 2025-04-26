import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { config } from 'dotenv';
import morgan from 'morgan';
import apiRoutes from './routes/api.js';
import { testConnection } from './config/db.js';
import { seedDatabase } from './config/dbInit.js';
import { runMigrations } from './migrations/index.js';

config();

const app = express();

// Test database connection, run migrations and seed data
(async () => {
  const connected = await testConnection();
  if (connected) {
    // Run migrations before seeding data
    await runMigrations();
    await seedDatabase();
  }
})();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Logging middleware
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat));

// Routes
app.use('/api', apiRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Event Management API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: 'Something went wrong!' });
});

export default app;