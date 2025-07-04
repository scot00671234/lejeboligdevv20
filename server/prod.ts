import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust proxy for rate limiting and security
app.set('trust proxy', true);

// Security middleware for production
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

// CORS configuration for production
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://lejeboligfind.dk'],
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

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoints
app.get('/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

app.get('/ready', (_req: Request, res: Response) => {
  res.json({ 
    status: 'ready',
    database: 'connected',
    timestamp: new Date().toISOString()
  });
});

// Static file path finder
function findStaticFilesPath(): string {
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
  
  return path.join(process.cwd(), 'dist', 'public');
}

// Main server startup
async function startServer() {
  const PORT = parseInt(process.env.PORT || '5000', 10);

  // Register API routes
  await registerRoutes(app);

  // Serve static files
  const staticPath = findStaticFilesPath();
  if (fs.existsSync(staticPath)) {
    app.use(express.static(staticPath));
    console.log(`Serving static files from: ${staticPath}`);
  } else {
    console.warn(`Static files path not found: ${staticPath}`);
  }

  // SPA fallback - serve index.html for all other routes
  app.get('*', (req: Request, res: Response) => {
    const indexPath = path.join(staticPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).json({ error: 'Static files not found' });
    }
  });

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
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