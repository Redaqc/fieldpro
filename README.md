# FieldPro - Multi-Tenant Field Service Management SaaS

A complete, self-hosted Field Service Management (FSM) platform with multi-tenant architecture, migrated from Base44 to a custom PostgreSQL/NestJS backend.

## Features

- **Multi-Tenant Architecture**: Schema-per-tenant isolation for complete data separation
- **Customer Management**: Track customers, contacts, locations, and history
- **Job Management**: Schedule, assign, and track service jobs
- **Service Calls**: Handle emergency and scheduled service requests
- **Invoicing**: Create, send, and track invoices with multiple payment options
- **Quotations**: Generate quotes and convert them to jobs
- **Technician Management**: Manage technicians, skills, and schedules
- **Inventory Management**: Track materials, stock levels, and adjustments
- **Asset Management**: Monitor customer assets and maintenance history
- **Real-time Updates**: WebSocket support for live updates
- **API Documentation**: Auto-generated Swagger/OpenAPI docs
- **Authentication**: JWT-based auth with refresh tokens
- **Role-Based Access**: Granular permissions system

## Tech Stack

### Backend
- **NestJS** - Progressive Node.js framework
- **PostgreSQL** - Primary database with PostGIS for geo features
- **Prisma** - Type-safe ORM
- **Redis** - Caching and job queues
- **Bull** - Job queue management
- **Passport** - Authentication middleware
- **Swagger** - API documentation

### Frontend
- **React** - UI library
- **TypeScript** - Type safety
- **React Query** - Server state management
- **Axios** - HTTP client
- **Vite** - Build tool

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Local development orchestration

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd fieldpro
```

2. **Run the setup script**
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

This script will:
- Install all dependencies (backend and frontend)
- Set up environment files
- Start Docker services (PostgreSQL, Redis)
- Run database migrations
- Generate Prisma client

3. **Start development servers**
```bash
./scripts/dev.sh
```

Or manually:

Backend:
```bash
cd backend
npm run start:dev
```

Frontend:
```bash
npm run dev
```

## Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **API Documentation**: http://localhost:3000/api/docs
- **Adminer (DB Admin)**: http://localhost:8080

## Database Setup

### Creating a New Tenant

```bash
./scripts/create-tenant.sh <tenant-slug> "<Tenant Name>"

# Example:
./scripts/create-tenant.sh acme-corp "Acme Corporation"
```

This creates:
- A tenant record in the public schema
- A dedicated schema for the tenant (e.g., `tenant_acme_corp`)
- All necessary tables in the tenant schema

### Migrating from Base44

If you have data from Base44, export it and use the migration script:

```bash
cd backend
npm run migrate:base44 -- --tenant-slug=acme-corp --json-file=../base44-export.json
```

The migration script handles:
- Customers
- Technicians
- Jobs
- Service Calls
- Invoices
- Quotations
- Materials
- Assets

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for detailed migration instructions.

## Project Structure

```
fieldpro/
├── backend/                 # NestJS backend
│   ├── src/
│   │   ├── auth/           # Authentication module
│   │   ├── common/         # Shared utilities, guards, decorators
│   │   ├── customers/      # Customer management
│   │   ├── jobs/           # Job management
│   │   ├── service-calls/  # Service call management
│   │   ├── invoices/       # Invoice management
│   │   ├── quotations/     # Quotation management
│   │   ├── technicians/    # Technician management
│   │   ├── materials/      # Material/inventory management
│   │   ├── assets/         # Asset management
│   │   ├── prisma/         # Prisma service and tenant service
│   │   ├── tenants/        # Tenant management
│   │   └── users/          # User management
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   └── package.json
├── src/                    # React frontend
│   ├── api/               # API client modules
│   ├── components/        # React components
│   ├── pages/            # Page components
│   └── ...
├── database/
│   └── init.sql          # DB initialization with tenant schema function
├── scripts/
│   ├── setup.sh          # Complete setup script
│   ├── dev.sh            # Development script
│   ├── create-tenant.sh  # Tenant creation script
│   └── migrate-from-base44.ts  # Base44 migration script
├── docker-compose.yml    # Docker services configuration
└── README.md
```

## API Documentation

Once the backend is running, visit http://localhost:3000/api/docs for complete API documentation with:
- All endpoints documented
- Request/response schemas
- Try-it-out functionality
- Authentication examples

## Environment Variables

### Backend (.env in /backend/)

```env
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/fieldpro_saas"

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Optional: Stripe for payments
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Frontend (.env in root)

```env
VITE_API_URL=http://localhost:3000/api
```

## Multi-Tenant Architecture

FieldPro uses a **schema-per-tenant** approach:

1. **Public Schema**: Contains tenant metadata, users, and authentication
2. **Tenant Schemas**: Each tenant gets a dedicated PostgreSQL schema (e.g., `tenant_acme_corp`)

### How It Works

1. **Request Arrives**: Tenant identified from subdomain, header, or JWT
2. **Middleware**: `TenantMiddleware` extracts and validates tenant
3. **Service Layer**: `TenantPrismaService` dynamically switches to tenant schema
4. **Query Execution**: All queries run in the tenant's isolated schema

### Benefits

- **Data Isolation**: Complete separation between tenants
- **Compliance**: Easier to meet data residency requirements
- **Scalability**: Can move schemas to different databases
- **Customization**: Per-tenant schema modifications if needed

## Development

### Running Tests

```bash
cd backend
npm run test              # Unit tests
npm run test:e2e          # E2E tests
npm run test:cov          # Coverage report
```

### Database Operations

```bash
cd backend

# Generate Prisma client after schema changes
npm run prisma:generate

# Create and apply migration
npm run prisma:migrate

# Open Prisma Studio (DB GUI)
npm run prisma:studio
```

### Linting and Formatting

```bash
cd backend
npm run lint              # ESLint
npm run format            # Prettier
```

## Deployment

### Production Build

Backend:
```bash
cd backend
npm run build
npm run start:prod
```

Frontend:
```bash
npm run build
# Serve the dist/ directory with your preferred web server
```

## Security Considerations

- All passwords are hashed with bcrypt
- JWT tokens expire after 15 minutes
- Refresh tokens for extended sessions
- Tenant isolation enforced at database level
- Rate limiting with ThrottlerGuard
- Helmet.js for security headers
- Input validation with class-validator

## Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Submit a pull request

## License

Proprietary - All rights reserved

## Support

For issues and questions:
- GitHub Issues: [repository-url]/issues
- Migration Guide: [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)

---

Built with ❤️ for field service teams everywhere
