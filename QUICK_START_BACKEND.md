# 🚀 Quick Start Guide - ArreglaMe Ya Backend

## Prerequisites

- Node.js 20+ installed
- PostgreSQL database (or Docker for local development)
- All required environment variables configured

## 1. Initial Setup

```bash
# Install dependencies
npm run install:all

# Copy environment template
cp apps/api/.env.example apps/api/.env

# Edit .env and set required variables:
# - DATABASE_URL
# - JWT_SECRET (minimum 32 characters!)
# - NODE_ENV
# - FRONTEND_URL
```

## 2. Database Setup

### Option A: Using Docker (Recommended for Development)

```bash
# Start PostgreSQL with PostGIS
npm run db:up

# Check database is running
npm run db:logs

# Run migrations
npm run db:migrate

# (Optional) Seed database
npm run db:seed
```

### Option B: External Database

Set `DATABASE_URL` in `.env` to your external database:
```
DATABASE_URL="postgresql://user:password@host:5432/database"
```

## 3. Start the Server

```bash
# Development mode (with hot reload)
npm run start:api

# Production mode
npm run build:api
npm run start:prod
```

## 4. Verify Server is Running

You should see output like this:

```
╔════════════════════════════════════════════════════════════╗
║  🚀 Starting ArreglaMe Ya API Server                      ║
╚════════════════════════════════════════════════════════════╝

📋 Phase 1: Validating environment configuration...
✅ Environment validation passed

📋 Phase 2: Creating NestJS application...
✅ NestJS application created

... (more phases)

╔════════════════════════════════════════════════════════════╗
║  ✅ SERVER STARTED SUCCESSFULLY                            ║
╚════════════════════════════════════════════════════════════╝

🚀 API Server:         http://localhost:3001
🎨 GraphQL Playground: http://localhost:3001/graphql
💚 Health Check:       http://localhost:3001/health
🌍 Environment:        development
```

## 5. Test the Endpoints

### Health Check
```bash
curl http://localhost:3001/health
```

Expected: `{"status":"ok"}`

### GraphQL Playground
Open in browser: `http://localhost:3001/graphql`

Try this query:
```graphql
query {
  getServices {
    id
    title
    status
  }
}
```

## Common Issues

### ❌ "Environment variable not found: DATABASE_URL"

**Solution:** Make sure `.env` file exists and contains `DATABASE_URL`

```bash
# Check if .env exists
ls -la apps/api/.env

# Create from example if missing
cp apps/api/.env.example apps/api/.env
```

### ❌ "Can't reach database server"

**Solution:** Make sure database is running

```bash
# If using Docker
npm run db:up

# Check database logs
npm run db:logs

# Test connection manually
psql postgresql://admin:admin123@localhost:5432/arreglame_ya
```

### ❌ "Port 3001 is already in use"

**Solution:** Kill the process using the port or change `API_PORT` in `.env`

```bash
# Find process using port
lsof -i :3001

# Kill it
kill -9 <PID>

# Or change port in .env
API_PORT=3002
```

### ❌ "JWT_SECRET should be at least 32 characters"

**Solution:** Generate a secure secret

```bash
# Generate a random 32-character secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env
JWT_SECRET="<generated_secret>"
```

## Environment Variables Reference

### Required
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Authentication secret (min 32 chars)
- `NODE_ENV` - Environment name (development/production)
- `FRONTEND_URL` - Frontend application URL

### Optional but Recommended
- `API_PORT` - Server port (default: 3001)
- `CORS_ORIGIN` - Allowed CORS origins
- `GEMINI_API_KEY` - For AI features
- `GOOGLE_MAPS_API_KEY` - For geocoding

### Email (Optional)
- `MAIL_SMTP_HOST` - SMTP server
- `MAIL_SMTP_PORT` - SMTP port
- `MAIL_SMTP_USER` - SMTP username
- `MAIL_SMTP_PASS` - SMTP password
- `MAIL_FROM` - From email address

## Development Workflow

### Make Changes
1. Edit code in `apps/api/src/`
2. Server automatically reloads (watch mode)
3. Check terminal for any errors

### Run Tests
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Lint Code
```bash
npm run lint
```

### Build for Production
```bash
npm run build:api
```

### Database Migrations
```bash
# Create new migration
npm run db:migrate

# Deploy migrations
npm run db:migrate:deploy

# Open Prisma Studio (database GUI)
npm run db:studio
```

## Project Structure

```
apps/api/
├── src/
│   ├── main.ts              # Application entry point
│   ├── app.module.ts        # Root module
│   ├── env.validation.ts    # Environment validation
│   ├── auth/                # Authentication module
│   ├── jobs/                # Jobs/services module
│   ├── worker/              # Worker profiles module
│   ├── billing/             # Billing/payments module
│   ├── notifications/       # Notifications module
│   ├── prisma/              # Database service
│   ├── common/              # Shared utilities
│   └── ...
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── migrations/          # Database migrations
├── .env                     # Environment variables (gitignored)
├── .env.example             # Environment template
└── package.json
```

## GraphQL Schema

The GraphQL schema is automatically generated from TypeScript decorators (Code First approach).

**Schema file:** `apps/api/src/schema.graphql` (auto-generated)

To regenerate schema, just restart the server.

## Debugging

### Enable Verbose Logging
Set in `.env`:
```
GRAPHQL_DEBUG=true
LOG_LEVEL=debug
```

### Check Logs
All important events are logged:
- Database connections
- GraphQL queries (in debug mode)
- Errors with full stack traces
- Authentication attempts

### GraphQL Playground
Use GraphQL Playground to test queries interactively:
- http://localhost:3001/graphql
- Auto-complete support
- Query history
- Schema explorer

## Production Deployment

### Pre-deployment Checklist
- [ ] All environment variables set
- [ ] JWT_SECRET is strong (64+ characters)
- [ ] DATABASE_URL points to production database
- [ ] NODE_ENV=production
- [ ] Database migrations applied
- [ ] Build succeeds without errors
- [ ] Health check responds

### Deploy Steps
```bash
# Build application
npm run build:api

# Run migrations
npm run db:migrate:deploy

# Start production server
npm run start:prod
```

### Environment Configuration
Make sure to set these in production:
```
NODE_ENV=production
DATABASE_URL=<production_db_url>
JWT_SECRET=<strong_64_char_secret>
FRONTEND_URL=<production_frontend_url>
CORS_ORIGIN=<production_frontend_url>
```

## Support

If you encounter issues not covered here:
1. Check `PRODUCTION_BOOTSTRAP_REPORT.md` for detailed technical information
2. Review server startup logs for specific error messages
3. Check Prisma logs if database-related
4. Review GraphQL errors in playground

## Key Commands Summary

```bash
# Development
npm run start:api          # Start API in watch mode
npm run start:web          # Start frontend
npm run dev                # Start both

# Database
npm run db:up              # Start database (Docker)
npm run db:down            # Stop database
npm run db:migrate         # Run migrations
npm run db:studio          # Open database GUI

# Building
npm run build              # Build everything
npm run build:api          # Build API only
npm run build:web          # Build frontend only

# Testing
npm run test               # Run tests
npm run lint               # Lint code
```

## Next Steps

After getting the server running:
1. ✅ Check health endpoint
2. ✅ Open GraphQL Playground
3. ✅ Test authentication (register/login)
4. ✅ Test creating a service request
5. ✅ Test worker operations
6. ✅ Test billing operations

Happy coding! 🚀
