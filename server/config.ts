// Production environment configuration validation
export const config = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL || (() => {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  })(),

  // JWT Secret
  JWT_SECRET: process.env.JWT_SECRET || 'development-jwt-secret-key-change-in-production-32-chars-min',

  // Session Secret
  SESSION_SECRET: process.env.SESSION_SECRET || 'development-session-secret-change-in-production',

  // Server
  PORT: parseInt(process.env.PORT || '5000'),
  HOST: process.env.HOST || '0.0.0.0',
  NODE_ENV: process.env.NODE_ENV || 'development',

  // CORS
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5000'],

  // Security
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '12'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  AUTH_RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '5'),
};

// Validate configuration in production
if (config.NODE_ENV === 'production') {
  if (config.JWT_SECRET.length < 32) {
    console.error('JWT_SECRET must be at least 32 characters in production');
    process.exit(1);
  }
  
  if (config.SESSION_SECRET.length < 32) {
    console.error('SESSION_SECRET must be at least 32 characters in production');
    process.exit(1);
  }
}

console.log(`Configuration loaded for ${config.NODE_ENV} environment`);