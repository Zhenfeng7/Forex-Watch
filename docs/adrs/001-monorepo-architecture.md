# ADR-001: Monorepo Architecture with npm Workspaces

## Status

Accepted

## Date

2025-10-01 (Milestone M0)

## Context

Need to build a full-stack TypeScript application with:

- Backend API server
- Frontend web application
- Shared types and validation logic
- Future mobile application support

Requirements:

- Type safety across frontend/backend
- Single source of truth for data models
- Efficient development workflow
- Code reuse between packages

## Decision

Use a **monorepo structure** with npm workspaces and Turbo for orchestration.

Structure:

```
forex-watch/
├── apps/
│   ├── backend/    (Express API)
│   ├── frontend/   (React web app)
│   └── mobile/     (React Native - future)
├── packages/
│   └── shared/     (Types, schemas, validation)
```

## Alternatives Considered

### Alternative 1: Separate Repositories (Polyrepo)

- **Pros**:
  - Independent versioning
  - Clearer ownership boundaries
  - Separate CI/CD pipelines
- **Cons**:
  - Hard to share types (need npm publishing)
  - Breaking changes require coordinated releases
  - Duplication of validation logic
  - More complex dependency management
- **Why rejected**: Too much overhead for a solo developer. Type sync between repos would be painful.

### Alternative 2: Single Repository, No Workspace

- **Pros**:
  - Simplest setup
  - All code in one place
- **Cons**:
  - No clear boundaries
  - Can't independently build packages
  - Backend/frontend would share node_modules (dependency conflicts)
  - Hard to scale later
- **Why rejected**: Doesn't scale, poor separation of concerns

### Alternative 3: Lerna/Yarn Workspaces

- **Pros**:
  - More mature than npm workspaces
  - Better tooling (historically)
- **Cons**:
  - npm workspaces now stable (npm 7+)
  - Added complexity with Lerna
  - Yarn introduces another package manager
- **Why rejected**: npm workspaces are sufficient and native

## Consequences

### Positive

- ✅ **Type safety**: Shared types prevent API contract mismatches
- ✅ **Single refactor**: Change a type once, TypeScript enforces everywhere
- ✅ **Fast development**: No need to publish packages to test changes
- ✅ **Atomic commits**: Frontend/backend changes can be committed together
- ✅ **Code reuse**: Validation logic (Zod schemas) shared across stack
- ✅ **Mobile ready**: Can add React Native app and reuse `@forex-watch/shared`

### Negative

- ❌ **Build complexity**: Need Turbo to manage build order
- ❌ **Larger repo**: Can't clone just frontend or backend
- ❌ **Shared CI/CD**: Changes in one package trigger CI for all (mitigated by Turbo caching)

### Neutral

- ℹ️ **Learning curve**: Need to understand workspace dependencies
- ℹ️ **Tooling setup**: Requires Turbo configuration for optimal DX

## Implementation Notes

**Key Setup:**

```json
// Root package.json
{
  "workspaces": ["apps/*", "packages/*"]
}
```

**Turbo for orchestration:**

- Handles build dependencies (shared must build before apps)
- Caches build outputs
- Parallel task execution

**Shared package usage:**

```typescript
// In frontend/backend
import { CreateAlertSchema, type Alert } from '@forex-watch/shared';
```

**Build order:**

1. `packages/shared` (TypeScript compilation)
2. `apps/backend` and `apps/frontend` (parallel)

## Interview Talking Points

1. **"Why monorepo?"**
   - Answer: Type safety across stack, especially important for API contracts. If I change the Alert model, TypeScript will catch mismatches in frontend immediately. In a polyrepo, I'd need to publish a package, update versions, and hope I didn't miss anything.

2. **"What are the trade-offs?"**
   - Answer: Monorepo adds complexity (Turbo setup, build orchestration) but saves massive time on type synchronization. For a solo developer, the productivity gain from shared types outweighs the setup cost. At scale (100+ services), polyrepo might make sense, but not for this project size.

3. **"How does it help with mobile?"**
   - Answer: When I add React Native, I can immediately use the same TypeScript types and Zod validation schemas. This means ~40% code reuse (all domain logic, API client, validation) without any package publishing.

4. **"Performance considerations?"**
   - Answer: Turbo caches build outputs, so rebuilding only what changed. In CI, this means if I only touch frontend, backend doesn't rebuild. Local dev is fast because shared package stays in watch mode.

5. **Demonstrates:**
   - Understanding of architecture patterns
   - Thinking about developer experience
   - Planning for scale (mobile)
   - Trade-off analysis (not just picking what's trendy)

## References

- [npm workspaces documentation](https://docs.npmjs.com/cli/v7/using-npm/workspaces)
- [Turbo documentation](https://turbo.build/repo/docs)
- [Monorepo tools comparison](https://monorepo.tools/)
