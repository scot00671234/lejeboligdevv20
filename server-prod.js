import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, and, or, desc, lte, ilike } from 'drizzle-orm';
import * as schema from './shared/schema.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database setup
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

// Storage class for database operations
class DatabaseStorage {
  async getUser(id) {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }

  async getUserByEmail(email) {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
    return user;
  }

  async createUser(insertUser) {
    const [user] = await db.insert(schema.users).values(insertUser).returning();
    return user;
  }

  async updateUser(id, updateData) {
    const [user] = await db.update(schema.users).set(updateData).where(eq(schema.users.id, id)).returning();
    return user;
  }

  async getProperties(filters) {
    let query = db.select().from(schema.properties);
    
    if (filters) {
      const conditions = [];
      if (filters.location) conditions.push(ilike(schema.properties.location, `%${filters.location}%`));
      if (filters.rooms) conditions.push(eq(schema.properties.rooms, filters.rooms));
      if (filters.maxPrice) conditions.push(lte(schema.properties.price, filters.maxPrice));
      if (filters.landlordId) conditions.push(eq(schema.properties.landlordId, filters.landlordId));
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    return await query.orderBy(desc(schema.properties.createdAt));
  }

  async getProperty(id) {
    const [property] = await db.select().from(schema.properties).where(eq(schema.properties.id, id));
    return property;
  }

  async createProperty(insertProperty) {
    const [property] = await db.insert(schema.properties).values(insertProperty).returning();
    return property;
  }

  async updateProperty(id, updateData) {
    const [property] = await db.update(schema.properties).set(updateData).where(eq(schema.properties.id, id)).returning();
    return property;
  }

  async deleteProperty(id) {
    const result = await db.delete(schema.properties).where(eq(schema.properties.id, id));
    return result.rowCount > 0;
  }

  async getMessages(userId, otherUserId) {
    let query = db.select().from(schema.messages).where(
      or(
        eq(schema.messages.senderId, userId),
        eq(schema.messages.receiverId, userId)
      )
    );
    
    if (otherUserId) {
      query = query.where(
        or(
          and(eq(schema.messages.senderId, userId), eq(schema.messages.receiverId, otherUserId)),
          and(eq(schema.messages.senderId, otherUserId), eq(schema.messages.receiverId, userId))
        )
      );
    }
    
    return await query.orderBy(schema.messages.createdAt);
  }

  async createMessage(insertMessage) {
    const [message] = await db.insert(schema.messages).values(insertMessage).returning();
    return message;
  }

  async markMessageAsRead(id) {
    const result = await db.update(schema.messages).set({ isRead: true }).where(eq(schema.messages.id, id));
    return result.rowCount > 0;
  }

  async getFavorites(userId) {
    return await db.select({
      id: schema.favorites.id,
      userId: schema.favorites.userId,
      propertyId: schema.favorites.propertyId,
      createdAt: schema.favorites.createdAt,
      property: schema.properties
    }).from(schema.favorites)
      .leftJoin(schema.properties, eq(schema.favorites.propertyId, schema.properties.id))
      .where(eq(schema.favorites.userId, userId))
      .orderBy(desc(schema.favorites.createdAt));
  }

  async addFavorite(insertFavorite) {
    const [favorite] = await db.insert(schema.favorites).values(insertFavorite).returning();
    return favorite;
  }

  async removeFavorite(userId, propertyId) {
    const result = await db.delete(schema.favorites).where(
      and(eq(schema.favorites.userId, userId), eq(schema.favorites.propertyId, propertyId))
    );
    return result.rowCount > 0;
  }

  async isFavorite(userId, propertyId) {
    const [favorite] = await db.select().from(schema.favorites).where(
      and(eq(schema.favorites.userId, userId), eq(schema.favorites.propertyId, propertyId))
    );
    return !!favorite;
  }
}

const storage = new DatabaseStorage();

// Routes registration
async function registerRoutes(app) {
  // Authentication routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { name, email, password, role } = req.body;
      
      // Check if user exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const user = await storage.createUser({
        name,
        email,
        password: hashedPassword,
        role
      });
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );
      
      res.json({ 
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        token 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );
      
      res.json({ 
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        token 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Property routes
  app.get('/api/properties', async (req, res) => {
    try {
      const { location, rooms, maxPrice, landlordId } = req.query;
      const filters = {};
      
      if (location) filters.location = location;
      if (rooms) filters.rooms = parseInt(rooms);
      if (maxPrice) filters.maxPrice = parseInt(maxPrice);
      if (landlordId) filters.landlordId = parseInt(landlordId);
      
      const properties = await storage.getProperties(filters);
      res.json(properties);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Add other routes as needed...
}

// Static file path finder
function findStaticFilesPath() {
  const possiblePaths = [
    path.join(__dirname, 'public'),
    path.join(__dirname, 'dist', 'public'), 
    path.join(__dirname, '..', 'dist', 'public'),
    path.join(process.cwd(), 'dist', 'public'),
    path.join(process.cwd(), 'public'),
    'dist/public',
    'public'
  ];
  
  for (const staticPath of possiblePaths) {
    if (fs.existsSync(staticPath)) {
      return staticPath;
    }
  }
  
  return null;
}

// Main server startup
async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 5000;

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
  }));

  // CORS configuration
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://lejebolignu.dk'],
    credentials: true,
    optionsSuccessStatus: 200
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check endpoints
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production'
    });
  });

  app.get('/ready', async (req, res) => {
    try {
      // Check database connection
      await pool.query('SELECT 1');
      res.json({ 
        status: 'ready',
        database: 'connected',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(503).json({ 
        status: 'not ready',
        database: 'disconnected',
        error: error.message
      });
    }
  });

  // Register API routes
  await registerRoutes(app);

  // Serve static files
  const staticPath = findStaticFilesPath();
  if (staticPath) {
    app.use(express.static(staticPath));
    console.log(`Serving static files from: ${staticPath}`);
  }

  // SPA fallback - serve index.html for all other routes
  app.get('*', (req, res) => {
    const indexPath = staticPath ? path.join(staticPath, 'index.html') : null;
    if (indexPath && fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).json({ error: 'Static files not found' });
    }
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message 
    });
  });

  // Start server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Production server running on port ${PORT}`);
    console.log(`Static files path: ${staticPath}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });
}

// Start the server
startServer().catch(console.error);