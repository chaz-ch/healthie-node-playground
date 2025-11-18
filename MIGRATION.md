# NestJS Migration Guide

## Overview

The backend has been successfully migrated from Express to NestJS. This document outlines the changes and how to work with the new architecture.

## What Changed

### Architecture
- **Before**: Simple Express server with route handlers in `server.js`
- **After**: Modular NestJS application with proper separation of concerns

### File Structure
```
src/
├── main.ts                    # Application entry point
├── app.module.ts              # Root module
├── dto/                       # Data Transfer Objects
│   ├── user-lookup.dto.ts
│   ├── conversation.dto.ts
│   └── create-note.dto.ts
└── healthie/                  # Healthie feature module
    ├── healthie.module.ts     # Module definition
    ├── healthie.controller.ts # HTTP endpoints
    └── healthie.service.ts    # Business logic & API calls
```

### Key Benefits

1. **Type Safety**: Full TypeScript support with compile-time type checking
2. **Modularity**: Code organized into modules, controllers, and services
3. **Dependency Injection**: Automatic dependency management
4. **Scalability**: Easy to add new features and modules
5. **Testing**: Better structure for unit and integration tests
6. **Logging**: Built-in logger with proper log levels
7. **Configuration**: Centralized config management with @nestjs/config

## Running the Application

### Development Mode (Recommended)
```bash
npm run start:dev
```
This uses `ts-node` to run TypeScript directly with auto-reload on file changes.

### Production Mode
```bash
# Build the application
npm run build

# Run the compiled JavaScript
npm start
```

### Legacy Express Server (Deprecated)
The old Express server is still available but deprecated:
```bash
npm run start:old
```

## API Endpoints

All endpoints remain the same - no breaking changes for the frontend:

- `GET /api/health` - Health check
- `POST /api/user` - Get user data and conversations
- `POST /api/conversation` - Get conversation messages
- `POST /api/create-note` - Create a new message
- `GET /api/websocket-url` - Get WebSocket URL

## Environment Configuration

The environment configuration works exactly the same as before:

```env
HEALTHIE_API_KEY=your_api_key_here
PORT=3001
HEALTHIE_ENV=staging  # or 'production'
```

Auto-detection based on API key prefix still works (keys starting with `gh_sbox_` default to staging).

## Code Examples

### Adding a New Endpoint

1. **Add DTO** (if needed):
```typescript
// src/dto/new-feature.dto.ts
export class NewFeatureDto {
  someField: string;
}
```

2. **Add Service Method**:
```typescript
// src/healthie/healthie.service.ts
async newFeature(data: string) {
  // Business logic here
  return result;
}
```

3. **Add Controller Endpoint**:
```typescript
// src/healthie/healthie.controller.ts
@Post('new-feature')
async newFeature(@Body() dto: NewFeatureDto) {
  return this.healthieService.newFeature(dto.someField);
}
```

## Testing

The NestJS structure makes testing much easier:

```typescript
// Example unit test for service
describe('HealthieService', () => {
  let service: HealthieService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [HealthieService, ConfigService],
    }).compile();

    service = module.get<HealthieService>(HealthieService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

## Migration Checklist

- [x] Install NestJS dependencies
- [x] Create NestJS project structure
- [x] Migrate API endpoints to controllers
- [x] Create Healthie service
- [x] Set up ConfigModule
- [x] Test all endpoints
- [x] Update README
- [x] Keep old server.js for reference (deprecated)

## Next Steps

1. **Add Validation**: Use `class-validator` for DTO validation
2. **Add Swagger**: Document API with `@nestjs/swagger`
3. **Add Tests**: Write unit and e2e tests
4. **Add Guards**: Implement authentication/authorization
5. **Add Interceptors**: Add logging, transformation, or caching
6. **Remove Legacy Code**: Delete `server.js` once fully migrated

## Troubleshooting

### TypeScript Errors
Make sure all dependencies are installed:
```bash
npm install
```

### Port Already in Use
Kill the old Express server if it's still running:
```bash
# Find the process
lsof -i :3001

# Kill it
kill -9 <PID>
```

### Module Not Found
Rebuild the application:
```bash
npm run build
```

## Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [NestJS CLI](https://docs.nestjs.com/cli/overview)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

