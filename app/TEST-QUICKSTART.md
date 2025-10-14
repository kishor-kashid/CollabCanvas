# Test Quick Start Guide

## Installation

```bash
cd app
npm install
```

## Running Tests

### Run all tests (recommended first run)
```bash
npm test
```

### Run tests in watch mode (auto-rerun on changes)
```bash
npm test -- --watch
```

### Run tests with visual UI (interactive)
```bash
npm run test:ui
```

### Generate coverage report
```bash
npm run test:coverage
```

### Run specific test file
```bash
npm test tests/unit/utils/helpers.test.js
```

### Run tests matching pattern
```bash
npm test -- --grep "generateUserColor"
```

## Test Files Overview

| File | Purpose | Tests |
|------|---------|-------|
| `tests/unit/utils/helpers.test.js` | Utility functions | 24 |
| `tests/unit/services/auth.test.js` | Authentication | 18 |
| `tests/unit/services/canvas.test.js` | Canvas operations | 29 |
| `tests/unit/services/cursors.test.js` | Cursor tracking | 22 |
| `tests/unit/services/presence.test.js` | User presence | 17 |
| `tests/unit/contexts/AuthContext.test.jsx` | Auth context | 15 |
| `tests/unit/contexts/CanvasContext.test.jsx` | Canvas context | 22 |
| `tests/unit/hooks/useAuth.test.jsx` | Auth hook | 7 |

**Total: 154+ tests**

## Expected Output

When you run `npm test`, you should see:

```
✓ tests/unit/utils/helpers.test.js (24)
✓ tests/unit/services/auth.test.js (18)
✓ tests/unit/services/canvas.test.js (29)
✓ tests/unit/services/cursors.test.js (22)
✓ tests/unit/services/presence.test.js (17)
✓ tests/unit/contexts/AuthContext.test.jsx (15)
✓ tests/unit/contexts/CanvasContext.test.jsx (22)
✓ tests/unit/hooks/useAuth.test.jsx (7)

Test Files  8 passed (8)
     Tests  154 passed (154)
```

## Troubleshooting

### "Cannot find module" error
```bash
npm install
```

### Tests hang or timeout
- Check for unresolved promises
- Ensure async operations use `await`

### Mocks not working
- Check that mocks are defined before imports
- Verify `vi.clearAllMocks()` in `beforeEach`

## What's Tested?

✅ Authentication (signup, login, logout, OAuth)
✅ Canvas operations (create, update, delete shapes)
✅ Real-time features (cursors, presence)
✅ Locking mechanism (optimistic locking)
✅ Utility functions (color generation, throttling)
✅ Context providers (Auth, Canvas)
✅ Custom hooks (useAuth)
✅ Error handling
✅ Edge cases

## Need More Info?

See `tests/README.md` for comprehensive documentation.

