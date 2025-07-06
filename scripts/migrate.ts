import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { sql } from 'drizzle-orm';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

if (!process.env.DATABASE_URL) {
  throw new Error('❌ DATABASE_URL is not set in .env file');
}

// Parse database URL
const dbUrl = new URL(process.env.DATABASE_URL);
const pool = new Pool({
  host: dbUrl.hostname,
  port: parseInt(dbUrl.port || '5432'),
  user: dbUrl.username,
  password: dbUrl.password,
  database: dbUrl.pathname.replace('/', ''),
  ssl: {
    rejectUnauthorized: false // Required for Railway
  }
});

const db = drizzle(pool);

export async function runMigrations() {
  console.log('🚀 Creating database tables...');
  
  try {
    // Create users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('tenant', 'landlord')),
        phone VARCHAR(20),
        bio TEXT,
        avatar VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create properties table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS properties (
        id SERIAL PRIMARY KEY,
        landlord_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        address VARCHAR(500) NOT NULL,
        postal_code VARCHAR(20),
        city VARCHAR(100) NOT NULL,
        country VARCHAR(100) DEFAULT 'Denmark',
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        price INTEGER NOT NULL,
        rooms INTEGER NOT NULL,
        size INTEGER,
        available BOOLEAN DEFAULT true,
        available_from DATE,
        images TEXT[] DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create messages table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create favorites table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS favorites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, property_id)
      )
    `);

    // Create indexes for better performance (skip if already exist)
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_properties_landlord_id ON properties(landlord_id)',
      'CREATE INDEX IF NOT EXISTS idx_properties_available ON properties(available)',
      'CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city)',
      'CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price)',
      'CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id)',
      'CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id)',
      'CREATE INDEX IF NOT EXISTS idx_messages_property_id ON messages(property_id)',
      'CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_favorites_property_id ON favorites(property_id)'
    ];

    for (const indexSql of indexes) {
      try {
        await db.execute(sql.raw(indexSql));
      } catch (indexError) {
        // Ignore index creation errors (they may already exist)
        console.log(`Index creation skipped: ${indexError.message}`);
      }
    }

    console.log('✅ Database tables created successfully');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migrations if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations().catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
}
