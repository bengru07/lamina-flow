$env:RUST_LOG = "debug"

Start-Process -NoNewWindow cargo -ArgumentList "run --bin orchestrator"
cargo run --bin worker -- --nodes-dir "$PSScriptRoot/../test/nodes"