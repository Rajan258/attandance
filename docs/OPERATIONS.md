# EMS Backend Operations Guide

## Authentication and RBAC
- Auth uses JWT access token (`Authorization: Bearer <token>`).
- Refresh token flow is available at `POST /api/auth/refresh`.
- Role-based access is enforced through `roleMiddleware`.

## Error Handling and Logging
- Centralized error handler: `src/middlewares/errorMiddleware.js`.
- Structured logs via Winston: `src/config/logger.js`.
- HTTP access logs are routed through Morgan into Winston.
- Each request gets an `x-request-id` for traceability.

## Caching
- Dashboard overview is cached via `cacheMiddleware`.
- Cache service supports:
  - In-memory cache by default.
  - Optional Redis cache when `REDIS_URL` is set and `redis` package is installed.

## Health and Monitoring
- Health endpoint: `GET /api/health`.
- Returns uptime, timestamp, host, and request ID.

## Environment Variables
- `PORT` (default: `5001`)
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_EXPIRES_IN` (default fallback: `15m`)
- `JWT_REFRESH_EXPIRES_IN` (default fallback: `7d`)
- `LOG_LEVEL` (default: `info`)
- `CACHE_TTL_SECONDS` (default: `60`)
- `REDIS_URL` (optional)

## CI/CD
- GitHub Actions pipeline at `.github/workflows/backend-ci.yml`.
- Runs dependency install and backend test suite on push/PR.

## Deployment Checklist
1. Configure production environment variables.
2. Use a managed DB and set DB creds in env.
3. Set strong JWT secrets.
4. Enable process manager (PM2/systemd/Docker) with restart policy.
5. Configure reverse proxy (Nginx/ALB) and TLS.
6. Set `NODE_ENV=production`.
