# FieldPro Backend API

NestJS REST API for FieldPro Field Service Management System

## 🚀 Tech Stack

- **Framework**: NestJS 10 (Node.js + TypeScript)
- **Database**: PostgreSQL 16 + Prisma ORM
- **Authentication**: JWT (Access + Refresh tokens)
- **Documentation**: Swagger/OpenAPI
- **Validation**: class-validator + class-transformer
- **Deployment**: Docker + Docker Compose

## 📋 Prerequisites

- Node.js 20+ (for local development)
- Docker & Docker Compose (for containerized deployment)
- PostgreSQL 16+ (if running locally without Docker)

## 🔧 Installation

### Option 1: Local Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update DATABASE_URL in .env if needed

# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Start development server
npm run start:dev
```

The API will be available at: http://localhost:3001/api/v1

Swagger documentation: http://localhost:3001/api/docs

### Option 2: Docker Deployment

```bash
# From project root directory
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

The containerized API will be available at: http://localhost:3001/api/v1

## 📚 Project Structure

```
backend/
├── src/
│   ├── auth/                 # Authentication module (JWT)
│   │   ├── decorators/       # Custom decorators (@CurrentUser, @Roles)
│   │   ├── dto/              # Login, Register DTOs
│   │   ├── guards/           # JWT guards, Roles guard
│   │   ├── strategies/       # Passport JWT strategies
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── users/                # User management
│   ├── customers/            # Customer management
│   ├── jobs/                 # Job & service call management
│   ├── technicians/          # Technician profiles & scheduling
│   ├── prisma/               # Prisma service & module
│   ├── common/               # Shared utilities
│   │   ├── filters/          # Exception filters
│   │   └── interceptors/     # Response transformers
│   ├── app.module.ts         # Root module
│   └── main.ts               # Application entry point
├── prisma/
│   └── schema.prisma         # Database schema (45 models)
├── Dockerfile                # Production Docker image
├── docker-compose.yml        # Local development stack
└── package.json
```

## 🔐 Authentication

The API uses JWT-based authentication with access and refresh tokens:

### Register

```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "SecurePass123!",
  "fullName": "Admin User",
  "role": "ADMIN"
}
```

### Login

```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "SecurePass123!"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@example.com",
      "role": "ADMIN"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": "15m"
  }
}
```

### Using Access Token

```bash
GET /api/v1/users
Authorization: Bearer <accessToken>
```

### Refresh Access Token

```bash
POST /api/v1/auth/refresh
Authorization: Bearer <refreshToken>
```

## 👥 User Roles (RBAC)

- **SUPER_ADMIN**: Full system access
- **ADMIN**: Manage users, customers, jobs
- **MANAGER**: View all data, manage jobs
- **TECHNICIAN**: View assigned jobs, update status
- **CUSTOMER**: View own jobs and invoices

## 📊 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user
- `POST /auth/me` - Get current user

### Users
- `GET /users` - List all users (Admin)
- `POST /users` - Create user (Admin)
- `GET /users/:id` - Get user details
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Deactivate user

### Customers
- `GET /customers` - List customers
- `POST /customers` - Create customer
- `GET /customers/:id` - Get customer with jobs
- `PATCH /customers/:id` - Update customer
- `DELETE /customers/:id` - Deactivate customer

### Jobs
- `GET /jobs` - List jobs (with filters)
- `POST /jobs` - Create job
- `GET /jobs/:id` - Get job details
- `PATCH /jobs/:id` - Update job
- `PATCH /jobs/:id/status` - Update job status
- `DELETE /jobs/:id` - Delete job

### Technicians
- `GET /technicians` - List technicians
- `POST /technicians` - Create technician profile
- `GET /technicians/:id` - Get technician with assignments
- `GET /technicians/user/:userId` - Get by user ID
- `PATCH /technicians/:id` - Update technician
- `PATCH /technicians/:id/location` - Update GPS location
- `DELETE /technicians/:id` - Delete technician

## 🗄️ Database

### Prisma Commands

```bash
# Generate Prisma Client
npm run prisma:generate

# Create new migration
npm run prisma:migrate

# Open Prisma Studio (GUI)
npm run prisma:studio

# Seed database
npm run prisma:seed
```

### Database Schema

The database includes 45 entities:
- Users & Authentication
- Customers & Jobs
- Technicians & Scheduling
- Invoices & Payments
- Assets & Maintenance
- GPS Tracking & Geofencing
- Forms & Automation
- Notifications & Alerts
- And more...

See `prisma/schema.prisma` for complete schema.

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📦 Build

```bash
# Build for production
npm run build

# Start production server
npm run start:prod
```

## 🐳 Docker

### Build Image

```bash
docker build -t fieldpro-backend .
```

### Run Container

```bash
docker run -p 3001:3001 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_ACCESS_SECRET="secret" \
  fieldpro-backend
```

### Docker Compose

```bash
# Start all services (PostgreSQL + Backend)
docker-compose up -d

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## 🔍 Health Check

```bash
# Check API health
curl http://localhost:3001/api/v1/health
```

Response:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2025-11-22T10:30:00.000Z",
    "uptime": 3600,
    "memory": {
      "used": "150 MB",
      "total": "200 MB"
    }
  }
}
```

## 📖 API Documentation

Interactive Swagger documentation is available at:

- **Development**: http://localhost:3001/api/docs
- **Production**: Configure SWAGGER_ENABLED=true in .env

## 🔒 Security

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with expiration
- Refresh token rotation
- CORS enabled (configurable)
- Rate limiting (10 req/min default)
- Input validation with class-validator
- SQL injection protection (Prisma)
- Role-based access control (RBAC)

## 🌍 Environment Variables

See `.env.example` for all available configuration options.

Critical variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_ACCESS_SECRET` - Secret for access tokens
- `JWT_REFRESH_SECRET` - Secret for refresh tokens
- `CORS_ORIGIN` - Allowed frontend origin

## 📝 Migration from Base44

This backend replaces all Base44 serverless functions with REST endpoints:

| Base44 Function | New REST Endpoint |
|----------------|-------------------|
| `createCustomer` | `POST /customers` |
| `getJobs` | `GET /jobs` |
| `assignTechnician` | `PATCH /jobs/:id` |
| `savePushSubscription` | `POST /notifications/subscribe` |
| `setupDatabase` | Not needed (Prisma migrations) |

## 🚧 Roadmap

**Phase 2**: ✅ NestJS Backend Scaffold (COMPLETE)
- ✅ Project structure
- ✅ Prisma integration
- ✅ Authentication (JWT)
- ✅ 4 core modules (Users, Customers, Jobs, Technicians)
- ✅ Docker configuration

**Phase 3**: Authentication & RBAC Extensions
- Email verification
- Password reset
- Two-factor authentication

**Phase 4**: Remaining API Endpoints (41 more entities)
- Invoices & Payments
- Assets & Maintenance
- GPS Tracking
- Forms & Automation
- Notifications

**Phase 5**: Frontend Migration to Next.js
- Replace Base44 SDK calls
- Update authentication flow
- Connect to NestJS backend

**Phase 6**: Production Deployment
- Nginx reverse proxy
- SSL certificates
- Monitoring & logging

## 📞 Support

For issues or questions:
- See main project `SETUP.md`
- Check Prisma schema: `prisma/schema.prisma`
- Review API docs: http://localhost:3001/api/docs

## 📄 License

MIT
