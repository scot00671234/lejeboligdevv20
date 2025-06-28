# Lejebolig Nu - Danish Rental Property Platform

A modern full-stack web application connecting tenants with landlords in Denmark.

## Features

- **Role-based Authentication**: Separate experiences for tenants and landlords
- **Property Management**: CRUD operations for rental listings
- **Search & Filtering**: Advanced property search with location, price, and room filters
- **Messaging System**: Direct communication between tenants and landlords
- **Favorites**: Save and manage favorite properties
- **Responsive Design**: Optimized for mobile and desktop

## Tech Stack

### Frontend
- React 18 with TypeScript
- Wouter for routing
- TanStack Query for state management
- Tailwind CSS with shadcn/ui components
- Vite for bundling

### Backend
- Node.js with Express
- TypeScript
- Drizzle ORM with PostgreSQL
- JWT authentication
- bcrypt for password hashing

## Deployment

### Environment Variables

Create a `.env` file with the following variables:

```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/lejebolig

# Security
JWT_SECRET=your_jwt_secret_minimum_32_characters
SESSION_SECRET=your_session_secret_minimum_32_characters

# Server
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Production Deployment with Coolify

1. **Repository Setup**:
   - Push code to your Git repository
   - Ensure all environment variables are configured

2. **Coolify Configuration**:
   - Set build command: `npm run build`
   - Set start command: `npm start`
   - Configure environment variables in Coolify dashboard
   - Set health check endpoint: `/health`

3. **Database Setup**:
   - Create PostgreSQL database
   - Run `npm run db:push` to deploy schema

### Docker Deployment

```bash
# Build image
docker build -t lejebolig-nu .

# Run with environment variables
docker run -p 5000:5000 \
  -e DATABASE_URL=your_database_url \
  -e JWT_SECRET=your_jwt_secret \
  -e SESSION_SECRET=your_session_secret \
  -e NODE_ENV=production \
  lejebolig-nu
```

### Manual Ubuntu VPS Deployment

1. **Prerequisites**:
   ```bash
   # Install Node.js 20
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PostgreSQL
   sudo apt-get install postgresql postgresql-contrib
   ```

2. **Application Setup**:
   ```bash
   # Clone repository
   git clone your-repo-url
   cd lejebolig-nu
   
   # Install dependencies
   npm ci --only=production
   
   # Build application
   npm run build
   
   # Set up environment variables
   cp .env.example .env
   # Edit .env with your values
   
   # Deploy database schema
   npm run db:push
   
   # Start application
   npm start
   ```

3. **Process Management (PM2)**:
   ```bash
   # Install PM2
   npm install -g pm2
   
   # Start application
   pm2 start npm --name "lejebolig-nu" -- start
   
   # Save PM2 configuration
   pm2 save
   pm2 startup
   ```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run type checking
npm run check

# Deploy database changes
npm run db:push
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Properties
- `GET /api/properties` - List properties (with filters)
- `GET /api/properties/:id` - Get property details
- `POST /api/properties` - Create property (landlords only)
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property

### Messages
- `GET /api/messages` - Get user messages
- `POST /api/messages` - Send message

### Favorites
- `GET /api/favorites` - Get user favorites
- `POST /api/favorites` - Add to favorites
- `DELETE /api/favorites/:propertyId` - Remove from favorites

### Health Checks
- `GET /health` - Application health status
- `GET /ready` - Readiness check

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS protection
- Helmet security headers
- Input validation with Zod
- SQL injection prevention with Drizzle ORM

## Performance Optimizations

- Server-side rendering in production
- Static asset caching
- Gzip compression
- Database connection pooling
- Optimized bundle size

## Monitoring

The application includes health check endpoints for monitoring:
- `/health` - Returns application status and uptime
- `/ready` - Returns readiness status for load balancers

## License

MIT License