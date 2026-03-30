# lamina-flow

A high-performance, language-agnostic workflow execution engine. Define workflows as directed acyclic graphs (DAGs) of nodes, deploy them, and execute them at scale.

## Requirements

- [Rust](https://rustup.rs/) 1.77+
- [NATS Server](https://nats.io/download/) 2.10+
- [Docker](https://www.docker.com/) (optional, for containerized deployment)
- Python 3 / Node.js (optional, only needed if running Python or JS nodes)

## Quick Start

### 1. Start NATS

```bash
docker run -p 4222:4222 -p 8222:8222 nats:2.10-alpine -js -m 8222
```

Or if you have NATS installed locally:

```bash
nats-server -js
```

### 2. Configure

Create a `.env` file at the project root:

```env
RUST_LOG=info
REST_ADDR=0.0.0.0:3000
NATS_URL=nats://localhost:4222
```

Optional logging to a database:

```env
LOG_ADAPTER=sqlite
LOG_URL=sqlite://logs.db

# or

LOG_ADAPTER=postgres
LOG_URL=postgres://user:password@localhost:5432/lamina
```

### 3. Run

**Linux / macOS:**

```bash
make dev
```

**Windows (two terminals):**

```powershell
# Terminal 1
cargo run --bin orchestrator

# Terminal 2
cargo run --bin worker -- --nodes-dir .\test\nodes
```

The orchestrator REST API will be available at `http://localhost:3000`.

---

## Docker Deployment

Run the full stack (NATS + orchestrator + worker) in one command:

```bash
make docker-up
```

Scale workers:

```bash
make docker-scale-workers n=4
```

Tear down:

```bash
make docker-down
```

---

## Submitting a Workflow

A workflow is a JSON file describing a DAG of nodes. Submit it to the engine:

```bash
curl -X POST http://localhost:3000/executions \
  -H "Content-Type: application/json" \
  -d @your-workflow.json
```

Response:

```json
{ "execution_id": "uuid-here" }
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/executions` | Submit a workflow for execution |
| `GET` | `/executions/:id` | Get execution state + per-node states |
| `GET` | `/executions/:id/nodes/:node_id` | Get state of a specific node |
| `GET` | `/executions/:id/logs` | Get logs for an execution |
| `GET` | `/executions/:id/stream` | SSE stream of real-time node state changes |
| `DELETE` | `/executions/:id` | Cancel a running execution |
| `GET` | `/health` | Health check |

---

## Node Manifest

Every node is described by a `node.json`:

```json
{
  "id": "my-node",
  "version": "1.0.0",
  "runtime": "persistent",
  "executor": "python",
  "protocol": "json_rpc",
  "entry": "node.py",
  "inputs": ["input_port"],
  "outputs": ["output_port"],
  "eager_init": false,
  "config": {}
}
```

**Runtime modes:**

| Mode | Description |
|------|-------------|
| `persistent` | Long-lived process, reused across executions. Ideal for AI models, DB connections. |
| `ephemeral` | Fresh process per execution. Isolated, stateless. |
| `endpoint` | No process. HTTP or WebSocket call to an external service. |

**Executors:** `python`, `node`, `binary`, `http`, `websocket`

**`eager_init`:** If `true`, the node is initialized when the worker starts rather than on first trigger.

---

## Node Lifecycle

Nodes receive lifecycle messages from the engine:

| Hook | When |
|------|------|
| `on_init` | Node process starts (workflow boot for eager, first trigger for lazy) |
| `on_ready` | After init completes |
| `on_trigger` | Every execution trigger |
| `on_dispose` | Worker shutdown or workflow stop |
| `on_error` | Execution failure |

**Example Python persistent node:**

```python
import sys, json

def on_init(config):
    # load model, open connections
    pass

def on_trigger(inputs):
    return {
        "emit": {
            "output_port": {"result": inputs.get("input_port")}
        }
    }

def on_dispose():
    # cleanup
    pass

for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    msg = json.loads(line)
    req_id = msg["id"]
    method = msg["method"]

    if method == "lifecycle":
        hook = msg["params"]["hook"]
        if hook == "on_init":
            on_init(msg["params"].get("data", {}))
        elif hook == "on_dispose":
            on_dispose()
        print(json.dumps({"jsonrpc": "2.0", "id": req_id, "result": {}}))
    elif method == "trigger":
        result = on_trigger(msg["params"]["inputs"])
        print(json.dumps({"jsonrpc": "2.0", "id": req_id, "result": result}))

    sys.stdout.flush()
```

---

## Workflow Structure

```json
{
  "workflow": {
    "id": "my-workflow",
    "version": "1.0.0",
    "name": "My Workflow",
    "nodes": [...],
    "edges": [
      {
        "from": { "node_id": "node-a", "port": "output" },
        "to":   { "node_id": "node-b", "port": "input" },
        "feedback": false
      }
    ]
  },
  "inputs": {}
}
```

**Feedback edges** allow controlled cycles — a node can feed data back into itself or an upstream node for retry loops or finite iterations. Mark the back-edge with `"feedback": true`.

---

## Worker Node Path Resolution

The worker resolves node `entry` paths in this order:

1. Absolute path — used as-is
2. Relative path + `--nodes-dir` flag — resolved relative to the nodes directory
3. Relative path in workflow manifest — resolved relative to worker cwd

Pass a nodes directory to the worker:

```bash
cargo run --bin worker -- --nodes-dir /path/to/your/nodes
```

---

## Run Modes

| Mode | Command |
|------|---------|
| Development (with debug logs) | `make dev` |
| Production (local) | `make run-orchestrator` + `make run-worker` |
| Docker (full stack) | `make docker-up` |
| Docker (detached) | `make docker-up-detached` |