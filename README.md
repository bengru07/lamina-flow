# lamina-flow

This project started as a school project by Benjamin Gruber. If you use this software in your own project, please link back to this repository!

/v2
├── .env
├── .env.example
├── docker-compose.yml
├── Makefile
├── turbo.json
├── package.json
│
├── /apps
│   ├── /frontend
│   │   ├── ...
│   └── /gateway
│       ├── ...
│
├── /services
│   ├── /orchestrator
│   │   ├── ...
│   │   └── main.go
│   ├── /storage-provider
│   │   ├── /src
│   │   └── Dockerfile
│   └── /nats-bridge
│       ├── /src
│       └── Dockerfile
│
├── /packages
│   ├── /protocol
│   │   ├── /schemas
│   │   │   ├── node.proto
│   │   │   └── manifest.schema.json
│   │   └── /gen
│   ├── /sdk-ts
│   │   ├── /src
│   │   └── package.json
│   ├── /sdk-python
│   │   ├── /lamina_sdk
│   │   └── pyproject.toml
│   └── /...
│
├── /nodes
│   ├── /registry
│   │   └── node-name.json
│   └── /internal
│       └── node-name.json
│
└── /infrastructure
    ├── /nats
    │   └── nats-server.conf
    └── /redis
        └── redis.conf