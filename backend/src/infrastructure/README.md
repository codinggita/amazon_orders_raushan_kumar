# Infrastructure Layer (src/infrastructure)

This layer deals with low-level details and third-party systems.

## Subdirectories
- **`database/`**: Mongoose schemas, connections, and index setups.
- **`cache/`**: Redis client wrappers, key management, and cache-invalidation scripts.
- **`logger/`**: Winston or Pino configurations for structured JSON logging.
- **`queue/`**: Message broker or in-process queue implementations (e.g., BullMQ or basic event queue) for asynchronous event processing.
