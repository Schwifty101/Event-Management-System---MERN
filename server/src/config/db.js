import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Create a connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
});

// Test and handle the database connection
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('Database connection established successfully');

        // Handle connection errors
        connection.on('error', (err) => {
            console.error('Database connection error:', err);
            if (err.code === 'PROTOCOL_CONNECTION_LOST') {
                console.error('Database connection lost. Reconnecting...');
            } else {
                throw err;
            }
        });

        connection.release();
        return true;
    } catch (error) {
        console.error('Error connecting to the database:', error.message);

        // Check for common connection issues and provide clearer feedback
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('Access denied: Check your database username and password');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('Connection refused: Make sure your database server is running');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.error('Database does not exist: Will attempt to create it during initialization');
            // Create a temporary connection without database specified to create the database
            try {
                const tempPool = mysql.createPool({
                    host: process.env.DB_HOST || 'localhost',
                    user: process.env.DB_USER || 'root',
                    password: process.env.DB_PASSWORD || '',
                    waitForConnections: true,
                    connectionLimit: 1,
                });

                await tempPool.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
                console.log(`Database ${process.env.DB_NAME} created successfully`);

                // Close the temporary connection
                await tempPool.end();
                return true;
            } catch (createError) {
                console.error('Failed to create database:', createError.message);
                return false;
            }
        }

        return false;
    }
}

export { pool, testConnection };