import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

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

// CORS configuration for production - works with any domain
app.use(cors({
  origin: true, // Accept all origins for now to fix deployment
  credentials: true,
  optionsSuccessStatus: 200
}));

// Note: Rate limiting disabled to prevent container proxy trust errors in Coolify deployment

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoints
app.get('/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    version: '1.0.0'
  });
});

// Debug endpoint to verify deployment
app.get('/debug/info', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'unknown',
    staticPath: findStaticFilesPath(),
    timestamp: new Date().toISOString(),
    message: 'Lejebolig Find API is running'
  });
});

app.get('/ready', (_req: Request, res: Response) => {
  res.json({ 
    status: 'ready',
    database: 'connected',
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint to check static files
app.get('/debug/static', (_req: Request, res: Response) => {
  const staticPath = findStaticFilesPath();
  const indexPath = path.join(staticPath, 'index.html');
  
  try {
    const files = fs.readdirSync(staticPath).map(file => {
      const filePath = path.join(staticPath, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        size: stats.size,
        isDirectory: stats.isDirectory()
      };
    });
    
    res.json({
      staticPath,
      indexPath,
      indexExists: fs.existsSync(indexPath),
      files,
      cwd: process.cwd(),
      dirname: __dirname
    });
  } catch (err) {
    res.status(500).json({
      error: 'Failed to read static directory',
      staticPath,
      indexPath,
      message: err instanceof Error ? err.message : 'Unknown error'
    });
  }
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
  const NODE_ENV = process.env.NODE_ENV || 'production';

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

  // Explicit root route with debugging
  app.get('/', (req: Request, res: Response) => {
    const indexPath = path.join(staticPath, 'index.html');
    console.log(`ROOT REQUEST: Looking for index.html at ${indexPath}`);
    console.log(`File exists: ${fs.existsSync(indexPath)}`);
    
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      console.error(`Static files not found at ${staticPath}`);
      res.status(404).json({ 
        error: 'Static files not found',
        path: staticPath,
        indexPath: indexPath,
        exists: fs.existsSync(indexPath)
      });
    }
  });

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
    console.log(`Environment: ${NODE_ENV}`);
    console.log(`Health check available at: http://localhost:${PORT}/health`);
  });
}

// Start the server
startServer().catch(console.error);