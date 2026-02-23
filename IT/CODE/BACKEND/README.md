# BestBikePaths - Backend API

This repository contains the backend API for BestBikePaths (BBP).
The backend is a RESTful service consumed by the mobile application and is responsible for
authentication, trip and path management, route processing, and integration with external services
such as routing, geocoding, and weather providers.

## Tech Stack

The backend is implemented using **Node.js** and **TypeScript**.

Using TypeScript ensures strong consistency with the mobile application, which is also written in
TypeScript, and provides compile-time safety across the entire stack.

### Backend Framework

The project uses **Express.js** as HTTP framework.

Express was chosen because it is lightweight, flexible, and easy to adapt to a custom architecture.
In this project, Express is structured using routes, managers, middleware, and services in order to
keep route handlers thin and move business logic into dedicated components.

Validation is handled via **Joi schemas** and custom middleware, while logging is implemented using
**Pino** together with a custom HTTP logger.

Other frameworks such as NestJS and Fastify were evaluated during design, but Express was preferred
for its simplicity and lower architectural overhead for the current scope of the project.

### Database and ORM

The backend uses **PostgreSQL** as relational database.

The relational model fits the BBP domain well (users, trips, paths, reports, snapshots) and allows
clear modeling of relationships and constraints. PostgreSQL also provides a solid foundation for
future extensions, such as spatial indexing via PostGIS.

Database access is handled using **Prisma ORM**, which provides strong TypeScript integration,
type-safe queries, and a clear migration workflow.

## Directory Walkthrough

```
backend/
|—— prisma/                              # Prisma ORM configuration
|   |—— schema.prisma                    # Database schema definition
|   |—— migrations/                      # Database migrations
|   |__ json.types.d.ts                  # Custom Prisma JSON type definitions
|—— src/                                 # Source code
|   |—— constants/                       # Application-wide constants
|   |   |__ appConfig.ts                 # General app constants
|   |—— errors/                          # Custom error classes
|   |   |—— app.errors.ts                # Application-specific errors
|   |   |__ index.ts                     # Export all error classes
|   |—— managers/                        # Business logic
|   |   |—— auth/                        # Authentication logic
|   |   |—— path/                        #  Path management logic
|   |   |__ ...                          # Other managers
|   |—— middleware/                      # Middlewares
|   |   |—— jwt.auth.ts                  # JWT authentication middleware
|   |   |—— http.logger.ts               # HTTP request logging middleware
|   |   |__ ...                          # Other middlewares
|   |—— routes/                          # API route definitions
|   |   |—— v1/                          # Version 1 of the API
|   |       |—— index.ts                 # API version entry point
|   |       |—— auth.routes.ts           # Authentication routes
|   |       |—— user.routes.ts           # User routes
|   |       |__ ...                      # Other routes
|   |—— schemas/                         # Validation schemas
|   |   |—— auth.schema.ts               # Auth-related schemas
|   |   |—— user.schema.ts               # User-related schemas
|   |   |__ ...                          # Other schemas
|   |—— services/                        # External service integrations
|   |   |—— weather.service.ts           # OpenMeteo API integration
|   |   |__ ...                          # Other services
|   |—— tests/                           # Test files
|   |   |—— integration/                 # Integration tests
|   |   |   |—— auth.integration.test.ts # Auth integration tests
|   |   |   |__ ...                      # Other integration tests
|   |   |—— unit/                        # Unit tests
|   |       |——  auth.manager.test.ts    # Auth manager tests
|   |       |__ ...                      # Other unit tests
|   |—— types/                           # TypeScript type definitions
|   |   |—— express/                     # Express-related types
|   |   |   |—— index.d.ts               # Custom Express types
|   |   |__ coordinate.types.ts          # Coordinate types
|   |   |__ ...                          # Other type definitions
|   |—— utils/                           # Utility functions
|   |   |—— prisma-client.ts             # Prisma client instance
|   |   |—— geo.ts                       # Geospatial utility functions
|   |   |__ ...                          # Other utility functions
|   |__ server.ts                        # Server entry point
|—— .env                                 # Environment variables
|—— .gitignore                           # Git ignore rules
|—— docker-compose.yml                   # Docker Compose configuration
|—— docker-compose.dev.yml               # Dev Docker Compose configuration
|—— Dockerfile                           # Dockerfile for backend service
|—— Dockerfile.dev                       # Dev Dockerfile
|—— jest.config.mjs                      # Jest configuration
|—— node_modules/                        # Installed dependencies
|—— package.json                         # Dependencies and scripts
|—— package-lock.json                    # Locked dependency versions
|—— prisma.config.ts                     # Prisma configuration
|—— setup.test.ts                        # Global test setup
|__ tsconfig.json                        # TypeScript configuration
```

## Prerequisites

Before running the backend, ensure you have the following installed:

- **Node.js**
- **npm**
- **PostgreSQL**
- **Docker & Docker Compose**
- **Prisma CLI** (Optional)

### Runtime Configuration

The backend is configured entirely through environment variables.
Create a `.env` file in the project root `IT/CODE/BACKEND` starting from the example below.

### Environment Variables

```env
# Server configuration
PORT=3000
DEBUG=false

# Authentication
JWT_SECRET=
JWT_REFRESH_SECRET=

# Database connection to prisma accelerate
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_API_KEY"

# OSRM
OSRM_BASE_URL=http://osrm:5000
OSRM_TIMEOUT_MS=8000

# External services timeouts
GEOCODING_TIMEOUT_MS=8000
OPENMETEO_TIMEOUT_MS=8000

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=change-me-to-a-long-random-secret
```

## Database & Prisma

Prisma is used for database schema definition, migrations, and type-safe data access.

Common commands:

```bash
npx prisma migrate dev --name <migration_name>
npx prisma migrate deploy
npx prisma generate
```

### Prisma Accelerate

The backend relies on Prisma Accelerate connection for database access.

Prisma Accelerate is a managed data access layer provided by Prisma that:

- provides built-in connection pooling
- avoids direct database connections from application containers
- simplifies deployment in Dockerized and cloud environments
- improves reliability under concurrent load

When using Prisma Accelerate, the database connection is configured via the DATABASE_URL
environment variable using the prisma+postgres:// protocol.
Prisma Accelerate projects and API keys can be managed from the Prisma dashboard.

## First-time Setup (Quick Start)

The backend can be run either directly using Node.js or through Docker Compose.
Both approaches rely on Prisma Accelerate for database access and require a valid
configuration of the `.env` file.

### Running locally with Node.js

From the project root:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Apply database migrations:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`.

### Running with Docker

For local Docker-based development, a compose override is provided that exposes port 3000 and mounts
the source code inside the container:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

Check container status and follow backend logs:

```bash
docker compose ps
docker logs -f bbp-backend-api-1 --tail=50
```

Health Check:

```
curl -i http://localhost:3000/health
```

## External Services

The backend integrates with several external services to support routing, search,
and data enrichment features required by the mobile application.
All integrations are handled server-side to keep the client lightweight and
centralize provider logic.

### Geocoding (Nominatim)

Geocoding is handled entirely on the backend.
The mobile application only sends plain-text addresses, while the backend resolves
them into geographic coordinates.

How it works:
- the app calls  
  `GET /api/v1/paths/search?origin=...&destination=...`
- the backend uses **Nominatim** to geocode both origin and destination strings
- the resolved `{lat, lng}` coordinates are used to perform path search
- matching paths are returned to the client

Why server-side geocoding:
- keeps the mobile app simple and provider-agnostic
- avoids embedding geocoding logic or API constraints in the client
- allows future provider replacement without client changes
- enables centralized caching and rate limiting

Timeouts for geocoding requests are configurable via `GEOCODING_TIMEOUT_MS`.

### OSRM (Routing and Snapping)

OSRM (Open Source Routing Machine) is used to snap user-drawn polylines to real roads
using OpenStreetMap data and a cycling profile.

OSRM is **self-hosted** and runs as a **separate service**.
The backend accesses it via HTTP using the `OSRM_BASE_URL` environment variable and
exposes this functionality to the mobile app through: `POST /api/v1/paths/snap`

#### What OSRM does and why it is used

In the BBP workflow:
- the app collects raw points while the user draws a path
- the backend forwards those points to OSRM `/route` (cycling profile)
- OSRM returns a road-following polyline
- the backend returns snapped `{lat, lng}` points to the app
- the app displays and stores the snapped path

OSRM was chosen because:
- it is open-source and fully self-hostable
- it provides fast and reliable routing and snapping
- it is based on OpenStreetMap data
- it supports cycling profiles, which fit BBP’s use case

#### Local development note

OSRM is **not a public API** and is **not provided automatically** in local development.

If OSRM is not running and reachable at `OSRM_BASE_URL`:
- the snapping endpoint will not be available

To enable snapping locally, a developer must:
- download OpenStreetMap data
- preprocess it with OSRM tools
- run the OSRM service locally or in Docker

The full OSRM setup and deployment process is documented in the
**Backend Deployment README**, which describes how OSRM is built, configured,
and run in production.

Request timeouts are configurable via `OSRM_TIMEOUT_MS`.

### Weather (Open-Meteo)

Weather data is retrieved using the **Open-Meteo** API.
No API key is required, making it suitable for free and unrestricted use.

The backend enriches routes with weather information by:
- sampling coordinates along the route
- querying the Open-Meteo *current* endpoint for each sample
- aggregating weather data across the path

This approach:
- limits the number of API calls
- stays within free-tier limits
- provides more accurate weather information along long routes

Only current conditions are used.
These are based on 15-minutely weather model data and provide up-to-date information
without relying on forecasts or historical datasets.

Timeouts are configurable via `OPENMETEO_TIMEOUT_MS`.

### Caching (Redis)

Redis is used as an in-memory cache to improve performance.

Redis is accessed via the `REDIS_HOST`, `REDIS_PORT`, and `REDIS_PASSWORD` environment variables.
In production, Redis should never be published on a public interface (`6379`) and must be reachable
only from internal Docker networks.

## Testing Strategy

Testing is performed using **Jest**.

Unit tests focus on individual modules and mock external dependencies.
Integration tests import the Express app instance and use **Supertest** to simulate real HTTP requests,
covering the full request flow without starting a separate server process.

To run all tests:

```bash
npm test
```

To run tests in watch mode:

```bash
npm run test:watch
```

Some integration tests interact with real external services, such as weather,
geocoding, and snapping APIs. These tests are intentionally **disabled by default**
to avoid network instability, external rate limits, and long execution times.

Live tests can be enabled explicitly by setting the environment variable
`RUN_LIVE_TESTS=1` when running the test suite.

## Troubleshooting

This section collects common issues that may occur during local development
or Docker-based execution of the backend, together with their solutions.

### Redis not starting or cache not working

In some cases, Redis may fail to start correctly or the backend may not be able
to connect to it. This can happen due to:
- stale Docker containers
- conflicting container names
- leftover Docker networks from previous runs
- partially failed Docker Compose executions

Typical symptoms include:
- connection errors to Redis
- cache-related features not working
- backend logs showing Redis connection failures

A full Docker cleanup usually resolves the issue.

**Suggested fix:**

```bash
docker compose down
docker rm -f exciting_newton 2>/dev/null || true
docker network rm backend_proxy 2>/dev/null || true
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

## Deployment

The BBP backend is deployed on a **Hetzner VPS** and runs in a production
Docker-based environment.

The deployment follows these principles:
- containerized backend service (Docker + Docker Compose)
- stateless API design
- PostgreSQL accessed via Prisma Accelerate
- external services (OSRM) running as separate containers
- reverse proxy and TLS termination handled outside the backend service

The full deployment setup is documented in a dedicated file: `README_DEPLOYMENT.md`

## Available Commands

| Command                                     | Description                                                                 |
|---------------------------------------------|-----------------------------------------------------------------------------|
| `npm install`                               | Install backend dependencies.                                               |
| `npm run dev`                               | Start the backend in development mode with auto-reload.                     |
| `npm run build`                             | Compile the TypeScript source code into the `dist/` folder.                 |
| `npm run start`                             | Start the backend using the compiled production build.                      |
| `npm test`                                  | Run all unit and integration tests (external services mocked).              |
| `npm run test:watch`                        | Run tests in watch mode.                                                    |
| `npm run test --...`                        | Run specific test suites or files, e.g. `npm run test -- tests/integration`.|
| `RUN_LIVE_TESTS=1 npm test`                 | Run tests with real external services enabled (OSRM, geocoding, weather).   |
| `npx prisma migrate dev`                    | Create and apply database migrations in development.                        |
| `npx prisma migrate deploy`                 | Apply pending migrations in production.                                     |
| `npx prisma generate`                       | Generate the Prisma Client from the schema.                                 |
| `npx prisma studio`                         | Open Prisma Studio to inspect and edit database data.                       |
| `docker compose up -d`                      | Start backend services using Docker Compose (production-style).             |
| `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build` | Start backend in Docker-based local development mode. |
| `docker compose ps`                         | Show status of running Docker containers.                                   |
| `docker logs -f bbp-backend-api`            | Follow backend container logs.                                              |
| `docker compose run --rm api npm test`      | Run unit + integration tests inside the backend container.                  |
| `docker compose run --rm api npm run test:watch` | Run tests in watch mode inside Docker.                                 |
| `docker compose run --rm api sh`            | Open a shell inside the backend container (debugging).                      |
| `RUN_LIVE_TESTS=1 docker compose run --rm api npm test` | Run tests with real external services enabled inside Docker.    |
