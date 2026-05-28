# Domain Layer (src/domain)

This is the core of the system. It contains the business rules and domain logic. It is completely isolated from HTTP details or database details.

## Subdirectories
- **`services/`**: Contain the actual business logic (e.g. calculation of dynamic pricing, state transitions for orders).
- **`repositories/`**: Interfaces and implementation for database persistence operations. Only these files contain database access (e.g., Mongoose queries).
- **`validators/`**: Input and payload validators (e.g., validation rules for creating a product or an order).
- **`policies/`**: Business policies and authorization checks (e.g., permission assertions for custom access control).
