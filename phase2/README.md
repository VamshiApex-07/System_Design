# Phase 2 — Microservices Learning Project

A system design learning project: a monolith refactored into **3 pods**, each with an **API Gateway + its own copy of 3 services (auth, order, product)**, load-balanced by **Nginx**, run with **Docker Compose**.

## Architecture

```
Client ──> Nginx (8080) ──> gateway1 / gateway2 / gateway3 ──> each gateway + its own services
```

- Nginx round-robins to gateway1/2/3
- Each gateway proxies `/auth`, `/order`, `/product` to **its own** copies of the services (pod isolation)

## Project Structure

```
phase2/
├── docker-compose.yml          # 13 containers (nginx + 3 gateways + 9 services)
├── backend/
│   ├── gateway/                # API gateway (runs 3x, one per pod)
│   └── services/
│       ├── auth/               # auth service
│       ├── order/              # order service
│       └── product/            # product service
├── frontend/                   # empty (not yet implemented)
└── nginx/
    └── nginx.conf              # load balancer config
```

## Ports

| Container | Internal | Host |
|---|---|---|
| nginx | 80 | 8080 |
| gateway1/2/3 | 8000 | 8001/8002/8003 |
| auth1/2/3 | 8001 | 5001/5002/5003 |
| order1/2/3 | 8002 | 5004/5005/5006 |
| product1/2/3 | 8003 | 5007/5008/5009 |

Entry point: `http://localhost:8080`

## Run

```bash
docker compose up --build
```

Test:

```bash
curl http://localhost:8080/          # alternates between the 3 gateways
curl http://localhost:8080/auth
curl http://localhost:8080/order
curl http://localhost:8080/product
```

Stop:

```bash
docker compose down
```

## How It Works

1. Client hits Nginx at `:8080`
2. Nginx sends the request to one gateway (round-robin)
3. The gateway proxies to its own pod's services: `/auth` → authN, `/order` → orderN, `/product` → productN
4. Gateway proxies are env-driven (`AUTH_SERVICE_URL`, `ORDER_SERVICE_URL`, `PRODUCT_SERVICE_URL`), so each gateway is pointed at its own set

## Notes

- Services are currently just stubs (`GET /` health check) — business logic not yet migrated from Phase 1
- No database or Redis yet; no auth/JWT yet
- Proxy targets use Docker container names, so they only resolve inside Compose