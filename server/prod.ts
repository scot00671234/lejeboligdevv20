import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust proxy for production (Coolify/reverse proxy)
app.set('trust proxy', 1);

// Security middleware for production
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// CORS for production
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || false,
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting for production
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Health check endpoints
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/ready', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ready', timestamp: new Date().toISOString() });
});

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

function findStaticFilesPath(): string {
  // Primary production paths - order matters for reliability
  const possiblePaths = [
    path.join(process.cwd(), 'dist/public'), // Docker working directory (primary)
    path.join(__dirname, '../dist/public'),  // Development relative path
    path.join(__dirname, '../../dist/public'), // If server is in nested build dir
    path.join(process.cwd(), 'dist'),        // Fallback without public subdirectory
  ];

  for (const testPath of possiblePaths) {
    const indexPath = path.join(testPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      console.log(`Found static files at: ${testPath}`);
      console.log(`Index file verified at: ${indexPath}`);
      return testPath;
    } else {
      console.log(`Static path not found: ${testPath} (index.html missing)`);
    }
  }

  console.error('CRITICAL: No static files found at any expected location!');
  console.error('Expected locations checked:');
  possiblePaths.forEach(p => console.error(`  - ${p}`));
  console.error('Current working directory:', process.cwd());
  console.error('Script directory:', __dirname);
  
  // Return the primary expected path even if not found for better error reporting
  return possiblePaths[0];
}

async function startServer() {
  try {
    const publicPath = findStaticFilesPath();
    
    // Serve static files from the found path
    app.use(express.static(publicPath, {
      maxAge: '1y', // Cache static assets for performance
      etag: true,
    }));

    // Register API routes
    const server = await registerRoutes(app);

    // SPA fallback - serve index.html for all non-API routes
    app.get('*', (req: Request, res: Response) => {
      // Skip if this is an API route
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
      }

      const indexPath = path.join(publicPath, 'index.html');
      
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        console.error(`Frontend build missing at ${indexPath}`);
        res.status(503).json({
          error: 'Service temporarily unavailable',
          message: 'Frontend build not found. The application may still be building.',
          build_path: publicPath
        });
      }
    });

    // Global error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Server Error:', err);
      res.status(500).json({ 
        error: 'Internal server error'
      });
    });

    const port = parseInt(process.env.PORT || '5000', 10);

    server.listen(port, '0.0.0.0', () => {
      console.log(`Production server running on port ${port}`);
      console.log(`Serving static files from: ${publicPath}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();