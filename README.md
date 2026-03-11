# Nexus Monitoring Dashboard

Real-time e-commerce operations dashboard connected to a live CDC pipeline. All data originates from actual pipeline computations — no simulation, no in-browser data generation.

## Architecture

The dashboard is the frontend layer of a full-stack CDC pipeline:

```
PostgreSQL → Debezium → Kafka → Spark Streaming → Redis → FastAPI → Dashboard (React)
```

The dashboard connects to the FastAPI backend via a single WebSocket (`ws://localhost:8000/ws`). On connect, the API sends a full snapshot of all data types, then pushes incremental updates as Redis pub/sub events fire.

See [`DESCRIPTION.md`](DESCRIPTION.md) for full data schemas, Redis keys, and architecture details.

## Running Locally

Start the CDC pipeline stack first (requires the [cdc-pipeline repo](../cdc-pipeline-feature-debezium-mode-worktree/)):

```bash
docker compose up -d
docker compose exec nexus-data-generator python generate_test_data.py --preset demo
```

Then start the dashboard dev server:

```bash
npm install
npm run dev
```

The dashboard is served at `http://localhost:5173` and will connect to the API at `http://localhost:8000`.

## Data Flow

| Data type | Redis key | Update frequency |
|---|---|---|
| KPI metrics (active users, revenue, orders, errors, latency) | `nexus:kpi:current` | ~30s |
| Traffic time-series | `nexus:traffic:timeseries` | ~30s |
| Activity feed | `nexus:activity:feed` | Per event |
| Region metrics + data flows | `nexus:regions:current`, `nexus:flows:current` | ~30s |
| Device platform breakdown | `nexus:platform:breakdown` | ~30s |
| Infrastructure health | `nexus:health:current` | ~30s |
| Geo monitor header | `nexus:geo:header` | ~30s |
| Alert rules | `nexus:alert:rules` | On state change |

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 19 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Charts | Recharts 3 |
| Globe/Map | D3.js 7 (orthographic projection) |
| Icons | Lucide React |
| Data transport | WebSocket (`services/wsClient.ts`) |
| State management | React context (`hooks/useNexusData.tsx`) |
# nexus-dash
