# BBP Backend - Deployment Guide

This document describes the production deployment of the **BestBikePaths (BBP) Backend**
on a Hetzner VPS using Docker.

The backend is deployed alongside other services on the same server and is exposed
through a shared reverse proxy, without interfering with existing applications.

This document focuses exclusively on **infrastructure and deployment concerns**.
Local development and backend usage are documented in the main `README.md`.

> Note: `api.example.com` and `example.com` are placeholders.

## Deployment Overview

### Dockerized Deployment + VPS

The BBP backend is deployed as a containerized service on a Hetzner VPS.

Docker is used to:
- ensure a consistent runtime environment
- simplify deployment and scaling
- isolate the backend from other services on the server

The backend is shipped as Docker containers:
- `api` - Node.js backend service
- `redis` - caching layer

The database is accessed remotely via **Prisma Accelerate**, configured through
the `DATABASE_URL` environment variable.

## Architecture Overview

- **Server:** Hetzner VPS (Ubuntu)
- **Container runtime:** Docker + Docker Compose
- **Reverse proxy:** Shared NGINX container
- **TLS termination:** Cloudflare Origin Certificates
- **Database:** PostgreSQL via Prisma Accelerate
- **Backend:** Node.js (Express) + Prisma

### Key Architectural Principles

- NGINX is the **only component exposing ports 80 and 443**
- The backend listens on **port 3000**, reachable only inside Docker
- All internal services communicate over a **private Docker network (`proxy`)**
- The backend is **stateless** and horizontally scalable
- TLS is terminated at the reverse proxy
- Internal traffic is trusted and isolated

## Server Directory Walkthrough

```
/opt/
|—— nginx/                             # Shared NGINX reverse proxy
|   |—— conf.d/                        # Virtual hosts and routing configuration
|   |   |—— 00_cloudflare_realip.conf  # Cloudflare real IP handling
|   |   |—— 00_globals.conf            # Global NGINX settings
|   |   |—— 01_upstreams.conf          # Upstream definitions
|   |   |—— api.conf                   # BBP backend API proxy rules
|   |   |__site.conf                   # Additional hosted site configuration
|   |—— ssl/                           # TLS certificates (Cloudflare Origin)
|   |   |—— ...
|   |—— log/                           # NGINX logs
|   |   |—— access.log
|   |   |__error.log
|   |__update-cloudflare-ips.sh        # Script to update Cloudflare IP ranges
|
|—— bbp-backend/                       # BestBikePaths backend service
|   |—— Dockerfile                     # Backend container definition
|   |—— docker-compose.yml             # Backend service orchestration
|   |—— .env                           # Environment configuration
|   |__...
|
|—— osrm/                              # OSRM routing service
|   |—— docker-compose.yml             # OSRM service orchestration
|   |—— pavia-milano.osm.pbf           # OpenStreetMap extract
|   |—— pavia-milano.osrm*             # Preprocessed routing datasets
|   |__*.osrm.*                        # OSRM auxiliary data files
|
|—— other-app/                         # Additional hosted application
|   |—— docker-compose.yml             # Service orchestration
|   |—— app/                           # Application source code
|   |__nginx/                          # Service-specific NGINX config
```

## Backend Production Configuration

To deploy the backend in production, several configuration files and settings are used.

### Environment Variables

Create the `.env` file on the server, as explained in `README.md`.:

```bash
cd /opt/bbp-backend
nano .env
```

### Docker Compose Configuration

File: `docker-compose.yml`

Notes:
- The backend does not expose public ports
- Port 3000 is exposed only inside Docker
- Redis port 6379 is exposed only inside Docker (no public host binding)
- Redis requires authentication via `REDIS_PASSWORD`
- The backend joins the shared `proxy` network
- The service is designed to be replicated horizontally

### Dockerfile

File: `Dockerfile`

Notes:
- The backend uses a multi-stage Dockerfile
- Build stage compiles TypeScript and generates Prisma client
- Runtime stage contains only production dependencies
- Database migrations are executed explicitly via a dedicated migration container

### Logger Configuration (Production-safe)

File: `src/utils/logger.ts`

Notes:
- `pino-pretty` is disabled in production
- Log level is controlled via `LOG_LEVEL`
- HTTP requests are logged via middleware

### Docker Network Setup

The proxy network is a shared, infrastructure-level Docker network and is usually created once when provisioning the server.

```bash
docker network create proxy || true
```

Connect containers (if you need to attach an existing container to the `proxy` network):

```bash
docker network connect proxy <nginx_container> || true
```

In our specific setup, NGINX and backend containers are attached to this network:

```bash
docker network connect proxy shared_nginx || true
```

Then verify:

```bash
docker network inspect proxy
```

### NGINX Reverse Proxy Configuration

NGINX is part of the shared server infrastructure and is not included in the bbp-backend Docker Compose stack.

NGINX acts as:
- Single entry point
- TLS termination layer
- Reverse proxy
- Load balancer
- Rate limiting and request filtering layer

Backend instances are resolved dynamically using Docker DNS and balanced by NGINX.

Reverse proxy from `api.example.com` to `api:3000`.
TLS is handled via Cloudflare Origin Certificate.

File: `/opt/nginx/conf.d/api.conf`

```nginx
# HTTP -> HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name api.example.com;
    return 301 https://$host$request_uri;
}

# HTTPS reverse proxy
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;

    server_name api.example.com;

    ssl_certificate     /etc/nginx/ssl/example-origin.crt;
    ssl_certificate_key /etc/nginx/ssl/example-origin.key;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    add_header Strict-Transport-Security "max-age=31536000" always;

    # --------------------------------------------------
    # Health endpoint (NO aggressive rate limit)
    # --------------------------------------------------
    location = /health {
        proxy_pass http://bbp_api_upstream;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;

        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        proxy_connect_timeout 5s;
        proxy_read_timeout 10s;
    }

    # --------------------------------------------------
    # Main API
    # --------------------------------------------------
    location / {
        proxy_pass http://bbp_api_upstream;
        proxy_http_version 1.1;

        # Rate limiting (per real client IP)
        limit_req zone=api_ratelimit burst=20 nodelay;

        # Standard forwarded headers
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;

        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # WebSocket / Upgrade support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;

        proxy_connect_timeout 10s;
        proxy_send_timeout 60s;
        proxy_read_timeout 120s;

        client_max_body_size 25m;

        proxy_buffering off;
    }
}
```

Upstream file : `/opt/nginx/conf.d/01_upstreams.conf`

```nginx
upstream bbp_api_upstream {
  zone bbp_api_upstream 64k;
  server api:3000 resolve;
}
```

Globals file: `/opt/nginx/conf.d/00_globals.conf`

```nginx
# Needed for WebSocket/HTTP upgrade handling
map $http_upgrade $connection_upgrade {
  default upgrade;
  ''      close;
}

# Basic rate limit zone (per-IP)
limit_req_zone $binary_remote_addr zone=api_ratelimit:10m rate=10r/s;

# Docker embedded DNS resolver
resolver 127.0.0.11 ipv6=off valid=10s;
resolver_timeout 2s;
```

## Deploying the Backend

### 1. Copying the Project to the Server

From the local machine:

```bash
rsync -avz ./BACKEND/ user@<HETZNER_IP>:/opt/bbp-backend/
```

### 2. Starting the Backend

From the server:

```bash
cd /opt/bbp-backend
docker compose build --no-cache
docker compose --profile tools run --rm migrate
docker compose up -d --scale api=3
docker compose ps
```

Note: run migrations only when needed.

### 3. Testing the Deployment

Check status:

```bash
docker compose ps
docker logs -f bbp-backend-api-1 --tail=50
```

Health check:

```bash
curl -i https://api.example.com/health
```

From the server (force Host header):

```bash
curl -i -k -H "Host: api.example.com" https://127.0.0.1/
```

From outside:

```bash
curl -i https://api.example.com/api/v1/users/me
```

Expected: `ACCESS_TOKEN_MISSING` because no token is provided.

## Cloudflare Configuration

A Cloudflare account manages `example.com`. The API is exposed on the subdomain `api.example.com`.

DNS setup:

| Type | Name | Content    | Proxy   |
| ---- | ---- | ---------- | ------- |
| A    | api  | Hetzner IP | Proxied |

SSL/TLS:
- Mode: Full (strict)
- Origin certificate: covers `example.com` and `*.example.com`, installed inside the NGINX container
- If SSL is misconfigured, Cloudflare returns error 526

Cloudflare is used as DNS provider, CDN, and additional security layer:
- DNS: `api.example.com` → Hetzner VPS (proxied)
- SSL/TLS mode: Full (strict)
- TLS certificates: Cloudflare Origin Certificates

Real client IPs are extracted using the `CF-Connecting-IP` header.
Cloudflare IP ranges are automatically synchronized using official endpoints.

### Cloudflare Real IP configuration sync

We maintain an autogenerated file containing Cloudflare IP ranges so that rate limiting and logs use the real client IP.
A cron runs weekly (Sunday at 04:00) to refresh the ranges from Cloudflare official endpoints.

File: `/opt/nginx/update-cloudflare-ips.sh`

```bash
#!/bin/sh
set -e

OUT_FILE="/opt/nginx/conf.d/00_cloudflare_realip.conf"

echo "# Auto-generated Cloudflare IP ranges" > "$OUT_FILE"
echo "# DO NOT EDIT MANUALLY" >> "$OUT_FILE"
echo "" >> "$OUT_FILE"

echo "real_ip_header CF-Connecting-IP;" >> "$OUT_FILE"
echo "real_ip_recursive on;" >> "$OUT_FILE"
echo "" >> "$OUT_FILE"

for ip in $(curl -fsSL https://www.cloudflare.com/ips-v4); do
  echo "set_real_ip_from $ip;" >> "$OUT_FILE"
done

for ip in $(curl -fsSL https://www.cloudflare.com/ips-v6); do
  echo "set_real_ip_from $ip;" >> "$OUT_FILE"
done
```

Make it executable:

```bash
chmod +x /opt/nginx/update-cloudflare-ips.sh
```

## OSRM Configuration and Deployment

We use OSRM to snap user-drawn polylines to real roads (cycling profile). OSRM is a separate service from the
backend API and must run on the server. The backend calls OSRM via HTTP using `OSRM_BASE_URL` and exposes
`POST /api/v1/paths/snap`.

### What OSRM does and why we chose it

OSRM (Open Source Routing Machine) is an open-source routing engine built on OpenStreetMap data.
In BBP it is used to snap a freehand polyline to the nearest road network, so the path follows real
streets instead of raw finger points.

How it works in our flow:
- The app collects raw points while the user draws
- The backend sends those points to OSRM `/route` (cycling profile)
- OSRM returns a road-following polyline
- The backend returns snapped `{lat, lng}` points to the app
- The app shows and saves the snapped path

Why OSRM:
- Open-source and self-hostable
- Fast and reliable for routing and snapping
- Uses OpenStreetMap data
- Supports cycling profiles

### Server setup (OSRM service)

We host OSRM as a separate container and keep the dataset as small as possible, covering only
the area of interest (Pavia and Milano) to reduce resource usage, since the server has limited RAM and CPU.
For Pavia and Milano we use a custom extract from the Nord-Ovest region.

Create a folder for OSRM data:

```bash
mkdir -p /opt/osrm
cd /opt/osrm
```

Download the regional map and create a small extract (bbox around Milano and Pavia):

```bash
sudo apt-get update && sudo apt-get install -y osmium-tool

curl -L -o nord-ovest-latest.osm.pbf https://download.geofabrik.de/europe/italy/nord-ovest-latest.osm.pbf
osmium extract -b 8.85,45.05,9.55,45.75 -o pavia-milano.osm.pbf nord-ovest-latest.osm.pbf
rm -f nord-ovest-latest.osm.pbf
```

Preprocess the extract (generates the `.osrm` files):

```bash
docker compose run --rm osrm osrm-extract -p /opt/bicycle.lua /data/pavia-milano.osm.pbf
docker compose run --rm osrm osrm-partition /data/pavia-milano.osrm
docker compose run --rm osrm osrm-customize /data/pavia-milano.osrm
```

Create `/opt/osrm/docker-compose.yml`:

```yaml
version: "3.9"

services:
  osrm:
    image: osrm/osrm-backend
    container_name: osrm
    volumes:
      - /opt/osrm:/data
    command: >
      osrm-routed --algorithm mld /data/pavia-milano.osrm
    ports:
      - "5000:5000"
    restart: unless-stopped
```

Start OSRM:

```bash
cd /opt/osrm
docker compose up -d osrm
```

OSRM is ready when `.osrm` files exist for the dataset you configured:

```bash
ls -lh /opt/osrm | grep "pavia-milano.osrm"
```

Test OSRM directly:

```bash
curl "http://localhost:5000/route/v1/cycling/9.19,45.4642;9.21,45.466?overview=full&geometries=geojson"
```

If you change the dataset file name, you must also update the `osrm-routed` command in the compose file.

### Backend configuration

Be sure to have in the `.env`:

```bash
OSRM_BASE_URL=http://osrm:5000
OSRM_TIMEOUT_MS=8000
GEOCODING_TIMEOUT_MS=8000
OPENMETEO_TIMEOUT_MS=8000
```

Rebuild backend:

```bash
cd /opt/bbp-backend
docker compose build --no-cache
docker compose up -d
```

### Endpoint test (backend)

```bash
curl -X POST https://api.example.com/api/v1/paths/snap   -H "Authorization: Bearer <TOKEN>"   -H "Content-Type: application/json"   -d '{"coordinates":[{"lat":45.4642,"lng":9.19},{"lat":45.466,"lng":9.21}]}'
```

## Request flow

When a client calls the API, the request goes through Cloudflare first, which handles DNS, HTTPS, and basic traffic filtering.
Then the request reaches the NGINX reverse proxy, which is the only component exposed to the internet.

NGINX terminates TLS, applies rate limiting, extracts the real client IP using Cloudflare headers, and forwards the request internally.
The backend itself is not exposed and listens only on port 3000 inside a private Docker network.

We run multiple backend replicas (3 instances). The backend is stateless and JWT-based, so it can be load balanced.
NGINX load balances requests across replicas using Docker service discovery. Internal traffic between NGINX and the backend is HTTP on the isolated Docker network.

To keep IP handling correct over time, the Cloudflare IP list is synchronized automatically using the update script, so logs and rate limiting always use the real client IP without manual maintenance.

## Note on NGINX usage

In the other project hosted, NGINX is defined inside that project's Docker Compose file because it is a complete web application.

That application:
- serves HTML content
- handles HTTP to HTTPS redirection
- terminates TLS
- exposes ports 80 and 443 directly to the internet

For these reasons, NGINX is part of that application stack and is deployed together with the frontend.

In contrast, BBP Backend is a pure API service.

The backend:
- does not serve static or HTML content
- does not manage TLS certificates
- does not expose public ports directly
- is meant to be consumed by a mobile application

Because of this, NGINX is not included in the bbp-backend Docker Compose file.
Instead, the backend is exposed through a shared NGINX reverse proxy, which acts as infrastructure and routes incoming requests to the correct internal service based on the requested domain.

This separation keeps the backend lightweight, reusable, and independent from the HTTP/TLS layer.
