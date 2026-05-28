# API Layer (src/api)

This layer is responsible for handling network requests and returning appropriate responses.

## Subdirectories
- **`controllers/`**: Orchestrate the request/response flow. They validate parameters, invoke domain services, and return REST-compliant JSON responses. Controllers **MUST NOT** execute database logic directly.
- **`routes/`**: Map endpoint URIs to appropriate middlewares and controllers.
