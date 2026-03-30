import sys
import json

def on_init(config):
    sys.stderr.write("echo node initialized\n")
    sys.stderr.flush()

def on_trigger(inputs):
    message = inputs.get("message", "no message")
    return {
        "execute": True,
        "emit": {
            "result": {"echo": message}
        }
    }

def on_dispose():
    sys.stderr.write("echo node disposed\n")
    sys.stderr.flush()

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