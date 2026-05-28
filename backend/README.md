# Commerce Intelligence Platform - Backend

This is the production-grade, highly scalable commerce intelligence backend platform.

## Architecture Guidelines
- **Strict Clean Architecture**: Layers are strictly isolated (`src/api`, `src/domain`, `src/infrastructure`, `src/middlewares`, `src/utils`).
- **Data Model**: Implements rich taxonomy, analytics aggregation, atomic inventory reservation, and immutable order history.
- **Security**: Features JWT auth, strict authorization, schema validations, rate limiting, and comprehensive sanitization.
