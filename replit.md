# Lejebolig Nu - Danish Rental Property Platform

## Overview

Lejebolig Nu is a modern web application that connects tenants with landlords in Denmark. The platform allows users to search for rental properties, manage listings, communicate through direct messaging, and maintain favorites. The application supports two user roles: tenants (who search for properties) and landlords (who list properties).

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript for type safety
- **Styling**: Tailwind CSS with custom design system variables
- **UI Components**: Radix UI components with shadcn/ui for consistent design
- **State Management**: React Query (TanStack Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: JWT tokens with bcrypt for password hashing
- **API Design**: RESTful API with role-based access control
- **Security**: Helmet for security headers, CORS configuration, rate limiting

### Database Schema
The application uses a relational database with the following main entities:
- **Users**: Stores user profiles with role-based access (tenant/landlord)
- **Properties**: Property listings with landlord relationships
- **Messages**: Direct messaging between users with property context
- **Favorites**: User's saved properties for quick access

## Key Components

### Authentication System
- JWT-based authentication with token persistence
- Role-based access control (tenant vs landlord)
- Password hashing with bcrypt
- Session management with secure token storage

### Property Management
- Property CRUD operations with image upload support
- Search and filtering capabilities (location, rooms, price)
- Landlord dashboard for property management
- Property detail pages with maps and contact information

### Messaging System
- Direct messaging between tenants and landlords
- Property-specific conversations
- Real-time message status tracking
- Conversation grouping and management

### User Interface
- Responsive design with mobile-first approach
- Role-specific navigation and dashboards
- Form validation with user-friendly error messages
- Image upload and management for properties

## Data Flow

### User Authentication Flow
1. User registers/logs in through auth modal
2. Server validates credentials and returns JWT token
3. Token stored in localStorage for session persistence
4. All API requests include Authorization header
5. Server validates token and attaches user context to requests

### Property Search Flow
1. User enters search criteria in search form
2. Frontend sends GET request to `/api/properties` with filters
3. Server queries database with filtering and pagination
4. Results returned and displayed in property cards
5. User can favorite properties or view details

### Messaging Flow
1. User initiates conversation from property detail page
2. Message sent via POST to `/api/messages`
3. Server stores message with user and property context
4. Messages retrieved and grouped by conversation
5. Real-time updates through query invalidation

## External Dependencies

### Database
- **PostgreSQL**: Primary database for production deployment
- **Drizzle Kit**: Database migrations and schema management
- **Connection**: Configured for Railway/Neon deployment with SSL

### UI Libraries
- **Radix UI**: Accessible UI primitives for complex components
- **Lucide React**: Icon library for consistent iconography
- **React Hook Form**: Form management with validation
- **Zod**: Schema validation for type safety

### Development Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety across frontend and backend
- **ESLint/Prettier**: Code quality and formatting
- **Tailwind CSS**: Utility-first CSS framework

## Deployment Strategy

### Production Build
- Frontend built with Vite to static assets
- Backend compiled to single JavaScript file with esbuild
- Docker containerization for consistent deployment
- Environment variable configuration for secrets

### Database Deployment
- PostgreSQL hosted on Railway/Neon with SSL
- Drizzle migrations for schema updates
- Connection pooling for production performance
- Database credentials via environment variables

### Server Configuration
- Express server with production security middleware
- Health check endpoints for monitoring
- Static file serving for frontend assets
- CORS configuration for cross-origin requests

## Railway Deployment

### Automatic Database Setup
- Drizzle migrations run automatically on production startup
- Railway PostgreSQL configured with SSL support
- Health check endpoints for monitoring (`/health`, `/ready`)

### Environment Variables for Railway
- `DATABASE_URL`: PostgreSQL connection string (auto-provided by Railway)
- `NODE_ENV`: Set to "production" 
- `PORT`: Auto-provided by Railway (defaults to 5000)
- `JWT_SECRET`: Generate secure 32+ character string
- `SESSION_SECRET`: Generate secure 32+ character string

### Deployment Configuration
- `railway.json`: Railway deployment configuration
- `Dockerfile`: Container configuration for Railway
- Health checks configured for monitoring
- Automatic table creation on deployment

## Changelog

```
Changelog:
- July 06, 2025. Initial setup
- July 06, 2025. Production-ready Railway deployment setup:
  * Clean minimalist UI design (Apple/Palantir inspired)
  * Removed duplicate buttons and streamlined interface
  * Automatic database migrations for Railway
  * Health check endpoints for monitoring
  * Consolidated server architecture
  * Production-ready security configuration
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```