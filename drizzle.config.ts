// drizzle.config.ts
import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

if (!process.env.DATABASE_URL) {
  throw new Error('❌ DATABASE_URL is not set in .env file');
}

console.log('🔧 Using database:', process.env.DATABASE_URL.split('@')[1]?.split('?')[0] || 'unknown');

// Parse the database URL
const dbUrl = new URL(process.env.DATABASE_URL!);

export default {
  schema: './shared/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: dbUrl.hostname,
    port: parseInt(dbUrl.port || '5432'),
    user: dbUrl.username,
    password: dbUrl.password,
    database: dbUrl.pathname.replace('/', ''),
    ssl: 'require'
  },
  verbose: true,
  strict: true,
} satisfies Config;