import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

if (!process.env.DATABASE_URL) {
  throw new Error("❌ DATABASE_URL must be set in .env file");
}

// Parse database URL
const dbUrl = new URL(process.env.DATABASE_URL);
const dbConfig = {
  host: dbUrl.hostname,
  port: parseInt(dbUrl.port || '5432'),
  user: dbUrl.username,
  password: dbUrl.password,
  database: dbUrl.pathname.replace('/', ''),
  ssl: {
    rejectUnauthorized: false // Required for Railway
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
};

console.log(`🔌 Connecting to database: ${dbConfig.user}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);

export const pool = new Pool(dbConfig);

// Test the connection
pool.on('connect', () => {
  console.log('✅ Database connection established');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err.message);
  process.exit(-1);
});

export const db = drizzle(pool, { 
  schema,
  logger: process.env.NODE_ENV !== 'production',
});

// Test the database connection on startup
(async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Database connection test successful');
    client.release();
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    process.exit(1);
  }
})();