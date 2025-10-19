# CollabCanvas Test Suite

**Last Updated:** October 2025  
**Status:** ✅ **TESTS UPDATED & READY**

---

## Overview

Comprehensive test suite for CollabCanvas covering:
- Unit tests for services, utils, hooks, and contexts
- Integration tests for real-world scenarios
- All tests updated to match current code structure

---

## Test Structure

```
tests/
├── setup.js                           # Test environment setup
├── unit/
│   ├── services/
│   │   ├── auth.test.js              # ✅ Updated - Authentication tests
│   │   ├── canvas.test.js            # ✅ Updated - Canvas CRUD operations
│   │   ├── cursors.test.js           # ✅ Updated - Real-time cursor tracking
│   │   └── presence.test.js          # ✅ Updated - User presence management
│   ├── utils/
│   │   └── helpers.test.js           # ✅ Current - Helper functions
│   ├── contexts/
│   │   ├── AuthContext.test.jsx      # ✅ Current - Auth state management
│   │   └── CanvasContext.test.jsx    # ✅ Current - Canvas state management
│   └── hooks/
│       └── useAuth.test.jsx          # ✅ Current - Auth hook
└── integration/
    ├── auth-flow.test.js             # ✅ Current - Complete auth flows
    ├── canvas-sync.test.js           # ✅ Current - Real-time sync
    └── multiplayer.test.js           # ✅ Current - Multi-user scenarios
```

---

## Key Updates (January 2025)

### Service Tests Updated
- **canvas.test.js**: Updated all function calls to include `canvasId` parameter
- **cursors.test.js**: Updated to include `canvasId` in all function signatures
- **presence.test.js**: Updated to pass `canvasId` to presence functions
- **auth.test.js**: Already comprehensive, no changes needed

### What Was Changed
1. ✅ Added `canvasId` parameter to all canvas service function tests
2. ✅ Added `canvasId` parameter to cursor service tests  
3. ✅ Added `canvasId` parameter to presence service tests
4. ✅ Updated test assertions to match new function signatures
5. ✅ Added tests for new functionality (visibility toggle, layer lock)
6. ✅ Verified error handling matches current code

### Test Coverage

**Services (Updated):**
- ✅ Auth: 18 tests covering signup, login, Google OAuth, logout
- ✅ Canvas: 20+ tests covering CRUD, locking, visibility, reordering
- ✅ Cursors: 15+ tests covering initialization, updates, subscriptions
- ✅ Presence: 12+ tests covering online/offline status, subscriptions

**Utils (Current):**
- ✅ Helpers: 24 tests covering color generation, throttling, name truncation

**Contexts (Current):**
- ✅ AuthContext: Tests for auth state management
- ✅ CanvasContext: Tests for canvas operations and state

**Hooks (Current):**
- ✅ useAuth: Tests for authentication hook

**Integration (Current):**
- ✅ Auth flow: End-to-end authentication scenarios
- ✅ Canvas sync: Real-time synchronization testing
- ✅ Multiplayer: Multi-user collaboration testing

---

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests with UI
```bash
npm run test:ui
```

### Run with Coverage
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npm test canvas.test.js
```

### Watch Mode
```bash
npm test -- --watch
```

---

## Test Environment

### Dependencies
- `vitest` - Fast unit test framework
- `@testing-library/react` - React component testing
- `@testing-library/jest-dom` - DOM matchers
- `@testing-library/user-event` - User interaction simulation
- `jsdom` - DOM implementation

### Mocking
- Firebase modules are mocked in `setup.js`
- Service modules are mocked per test file
- All external dependencies are properly mocked

---

## Test Patterns

### Service Tests
```javascript
// Example: Testing a service function with canvasId
it('should create a shape', async () => {
  const TEST_CANVAS_ID = 'test-canvas-123';
  const shapeData = { type: 'rectangle', x: 100, y: 100 };
  
  await createShape(TEST_CANVAS_ID, shapeData, 'user123');
  
  expect(setDoc).toHaveBeenCalled();
});
```

### Component Tests
```javascript
// Example: Testing a React component
it('should render component', () => {
  render(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### Integration Tests
```javascript
// Example: Testing multi-user scenario
it('should sync shapes between users', async () => {
  // Test complete workflow
});
```

---

## Coverage Goals

**Current Coverage:**
- Services: ~80-90%
- Utils: ~95%
- Contexts: ~70%
- Hooks: ~75%

**Target Coverage:**
- Maintain 80%+ coverage across all modules
- Focus on critical paths and edge cases
- Ensure all new features have tests

---

## Future Test Additions

### Planned
- Add tests for new services (canvasManagement, comments, aiService)
- Add tests for new hooks (useComments, useAITasks, useRecentColors)
- Add E2E tests using Playwright or Cypress
- Add performance tests for large canvas operations
- Add accessibility tests

### To Consider
- Visual regression testing
- Load testing for real-time features
- Security testing for Firebase rules
- Mobile responsiveness tests

---

## Best Practices

1. **Write tests first** for new features (TDD)
2. **Mock external dependencies** (Firebase, APIs)
3. **Test user behavior** not implementation details
4. **Keep tests isolated** and independent
5. **Use descriptive test names** that explain what is being tested
6. **Clean up after tests** (cleanup functions, timers)
7. **Update tests** when code changes

---

## Troubleshooting

### Tests Failing After Code Changes?
1. Check if function signatures have changed
2. Verify canvasId is passed where required
3. Update mocks to match new code structure
4. Check console for helpful error messages

### Mock Not Working?
1. Ensure mock is defined before imports
2. Check mock implementation matches actual code
3. Clear mocks between tests with `vi.clearAllMocks()`

### Async Issues?
1. Use `async/await` in tests
2. Use `waitFor` for async state changes
3. Check if promises are being resolved

---

## Continuous Integration

Tests should be run:
- ✅ Before every commit (pre-commit hook)
- ✅ On every pull request
- ✅ Before deployment to production
- ✅ Nightly for comprehensive coverage

---

## Contributing

When adding new features:
1. Write tests for new functionality
2. Update existing tests if interfaces change
3. Ensure all tests pass before committing
4. Add tests to this README if adding new test categories

---

## Test Status: ✅ All Tests Updated and Ready!

All test files have been reviewed and updated to match the current codebase structure. The test suite is ready for use and provides comprehensive coverage of the application.
