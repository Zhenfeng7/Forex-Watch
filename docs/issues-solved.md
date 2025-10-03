# Issues & Solutions Log

> **Purpose**: Document bugs, debugging process, root causes, and learnings.
> These become your interview war stories.

---

## Issue Template

```markdown
## Issue #XXX: [Brief Description]

**Date**: YYYY-MM-DD
**Severity**: [Critical | High | Medium | Low]
**Time to resolve**: X hours/minutes
**Component**: [Backend | Frontend | Mobile | Shared | DevOps]

**Problem**:
What went wrong? What were the symptoms?

**Root Cause**:
What actually caused the issue? (Not just "it didn't work" - dig deeper)

**Debugging Process**:

1. How did you discover it?
2. What did you try?
3. How did you narrow it down?

**Solution**:
What fixed it? Include code snippets if relevant.

**Prevention**:
How to avoid this in the future? (Tests, linting, better patterns)

**Lessons Learned**:
What did you learn technically? What would you do differently?

**Interview Answer** (30-second version):
Quick explanation for "Tell me about a challenging bug."
```

---

## Issues Encountered

### Issue #001: [Template - Delete this when adding first real issue]

**Date**: 2025-10-01  
**Severity**: Low  
**Time to resolve**: 5 minutes  
**Component**: Documentation

**Problem**:
Needed a template for tracking issues during development.

**Root Cause**:
No structured way to document problems and solutions for interview prep.

**Solution**:
Created this template file with guidance on what to track.

**Lessons Learned**:
Good documentation during development makes interview prep 10x easier.

**Interview Answer**:
"I kept a detailed log of technical challenges during development so I could articulate my problem-solving process in interviews."

---

## Common Issue Categories to Watch For

### Backend

- [ ] MongoDB connection issues (authentication, network, replica sets)
- [ ] JWT token expiration edge cases
- [ ] CORS configuration problems
- [ ] Rate limiting false positives
- [ ] Cron job race conditions (multiple instances)
- [ ] Email sending failures (SMTP, SES)
- [ ] External API rate limits (rate providers)
- [ ] Mongoose schema validation vs Zod validation mismatches

### Frontend

- [ ] React Query cache staleness
- [ ] Form validation UX (when to show errors)
- [ ] Token refresh during active requests
- [ ] WebSocket connection management (if added)
- [ ] Responsive design breakpoints
- [ ] Browser compatibility (Safari quirks)

### Mobile (Future)

- [ ] AsyncStorage vs localStorage API differences
- [ ] Push notification permissions
- [ ] Deep linking configuration
- [ ] iOS vs Android styling differences
- [ ] Native module linking issues

### DevOps

- [ ] Environment variable not loaded
- [ ] Build failures in CI/CD
- [ ] Turbo cache invalidation
- [ ] Test database cleanup between tests
- [ ] TypeScript compilation order in monorepo

### Performance

- [ ] N+1 query problems (Mongoose)
- [ ] Large payload sizes
- [ ] Slow regex in validation
- [ ] Memory leaks in cron jobs
- [ ] Unnecessary re-renders (React)

---

## Debugging Techniques Used

Track which techniques you use so you can discuss them in interviews:

- [ ] `console.log` / `debugger` (don't be ashamed - everyone uses it)
- [ ] Chrome DevTools Network tab
- [ ] React Developer Tools
- [ ] VS Code debugger with breakpoints
- [ ] MongoDB Compass for query debugging
- [ ] Postman/Thunder Client for API testing
- [ ] `git bisect` to find regression commit
- [ ] Logging with correlation IDs (Pino request IDs)
- [ ] Integration test to reproduce issue
- [ ] Rubber duck debugging (explaining to someone/yourself)

---

## Bug Statistics (Update as you go)

| Milestone | Total Issues | Critical | High | Medium | Low | Avg Resolution Time |
| --------- | ------------ | -------- | ---- | ------ | --- | ------------------- |
| M0        | 0            | 0        | 0    | 0      | 0   | N/A                 |
| M1        | -            | -        | -    | -      | -   | -                   |
| M2        | -            | -        | -    | -      | -   | -                   |

**Notes on severity:**

- **Critical**: Blocks development, security vulnerability, data loss
- **High**: Major feature broken, significant UX problem
- **Medium**: Feature partially broken, workaround exists
- **Low**: Minor bug, edge case, cosmetic issue

---

## Most Valuable Debugging Lessons

_Fill this in as you encounter real issues_

1. **Read the error message carefully** - It usually tells you exactly what's wrong
2. **Check environment variables first** - So many issues are just config
3. **Isolate the problem** - Simplify until you can reproduce consistently
4. ...

---

## Questions That Led to Solutions

_Track the questions you asked yourself that led to breakthroughs_

- "What changed since this last worked?"
- "What assumptions am I making?"
- "Can I reproduce this in a test?"
- "What does the network request actually look like?"
- ...

---

_Last updated: October 1, 2025_
