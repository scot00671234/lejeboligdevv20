# Lejebolig Nu - Danish Rental Property Platform

A modern rental property platform connecting tenants with landlords in Denmark.

## Features

- Property search and management
- User authentication (tenant/landlord roles)
- Direct messaging between users
- Favorites system
- Responsive design

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT + bcrypt

## Quick Start

```bash
npm install
npm run db:push
npm run dev
```

## Environment Variables

```
DATABASE_URL=postgresql://username:password@host:5432/database
JWT_SECRET=your-secret-key-32-chars-minimum
SESSION_SECRET=your-session-secret-32-chars-minimum
NODE_ENV=production
```

## Docker Deployment

```bash
docker build -t lejebolig-nu .
docker run -p 5000:5000 -e DATABASE_URL=... lejebolig-nu
```

## API Health Checks

- `GET /health` - Application status
- `GET /ready` - Readiness check

## License

MIT