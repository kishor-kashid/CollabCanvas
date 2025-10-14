# CollabCanvas Test Suite

This directory contains the test suite for the CollabCanvas application. The tests are organized into unit tests and integration tests, using Vitest as the test runner and React Testing Library for component testing.

## Table of Contents

- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Test Coverage](#test-coverage)
- [Writing Tests](#writing-tests)
- [Mocking Firebase](#mocking-firebase)
- [Best Practices](#best-practices)

## Test Structure

```
tests/
├── setup.js                 # Test environment setup
├── unit/                    # Unit tests
│   ├── contexts/           # Context provider tests
│   │   └── AuthContext.test.jsx
│   ├── hooks/              # Custom hook tests
│   │   └── useAuth.test.jsx
│   ├── services/           # Service layer tests
│   │   ├── auth.test.js
│   │   ├── canvas.test.js
│   │   └── cursors.test.js
│   └── utils/              # Utility function tests
│       └── helpers.test.js
└── integration/            # Integration tests
    ├── auth-flow.test.js
    ├── canvas-sync.test.js
    └── multiplayer.test.js
```

## Running Tests

### Prerequisites

Install dependencies:
```bash
npm install
```

### Test Commands

Run all tests:
```bash
npm test
```

Run tests in watch mode (re-runs on file changes):
```bash
npm test -- --watch
```

Run tests with UI (visual test runner):
```bash
npm run test:ui
```

Run tests with coverage report:
```bash
npm run test:coverage
```

Run specific test file:
```bash
npm test tests/unit/utils/helpers.test.js
```

Run tests matching a pattern:
```bash
npm test -- --grep "generateUserColor"
```

## Test Coverage

The test suite covers the following important areas with **140+ passing tests**:

### 1. **Utility Functions** (`utils/helpers.test.js`) - 21 tests
- ✅ Color generation for user cursors (consistent hashing)
- ✅ Throttling function for performance optimization
- ✅ Name truncation for display (with edge cases)
- ✅ Handles null/undefined inputs
- ✅ Unicode character support

### 2. **Authentication Service** (`services/auth.test.js`) - 14 tests
- ✅ User sign up with email/password
- ✅ User sign in with email/password
- ✅ Google OAuth sign in
- ✅ User sign out
- ✅ Display name truncation (20 char limit)
- ✅ Error handling for network failures
- ✅ Invalid credential handling

### 3. **Canvas Service** (`services/canvas.test.js`) - 23 tests
- ✅ Shape creation with metadata
- ✅ Shape updates (position, size, color)
- ✅ Shape deletion
- ✅ Shape locking mechanism (optimistic locking)
- ✅ Shape unlocking
- ✅ Stale lock cleanup (5 second timeout)
- ✅ Real-time Firestore subscription
- ✅ Error handling and edge cases

### 4. **Cursor Service** (`services/cursors.test.js`) - 19 tests
- ✅ User session initialization
- ✅ Cursor position updates (with throttling)
- ✅ Real-time cursor subscription
- ✅ Session cleanup on disconnect (onDisconnect handler)
- ✅ Stale session cleanup (5 minute timeout)
- ✅ Negative and large coordinate handling
- ✅ Error handling

### 5. **Presence Service** (`services/presence.test.js`) - 19 tests
- ✅ User online/offline status management
- ✅ Presence subscription
- ✅ Full user lifecycle (online → offline)
- ✅ Very long user IDs and display names
- ✅ Special characters in names
- ✅ Rapid online/offline toggles
- ✅ Error handling

### 6. **Auth Context** (`contexts/AuthContext.test.jsx`) - 9 tests
- ✅ Context provider functionality
- ✅ Loading states
- ✅ User state management
- ✅ Signup, login, Google OAuth methods
- ✅ Logout with session cleanup
- ✅ Auth state change handling

### 7. **Canvas Context** (`contexts/CanvasContext.test.jsx`) - 21 tests
- ✅ Provider initialization
- ✅ Shape operations (add, update, delete, select)
- ✅ Shape locking/unlocking
- ✅ Zoom operations (in, out, reset)
- ✅ Stale session cleanup on mount
- ✅ User authorization checks
- ✅ Unique shape ID generation

### 8. **Custom Hooks** (`hooks/useAuth.test.jsx`) - 6 tests
- ✅ Hook returns correct context values
- ✅ Error thrown when used outside provider
- ✅ Access to auth methods and state
- ✅ Loading and error states

### 9. **Integration Tests** (`integration/`) - 8 tests
- ✅ Authentication flow (signup → login → logout)
- ✅ Canvas synchronization across clients
- ✅ Multiplayer features (cursors, presence)

## Writing Tests

### Test File Naming Convention

- Unit tests: `[filename].test.js` or `[filename].test.jsx`
- Place tests in the same directory structure as source files
- Use `.jsx` extension for tests that include JSX

### Basic Test Structure

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { functionToTest } from '../../../src/path/to/module';

describe('Module or Component Name', () => {
  beforeEach(() => {
    // Setup before each test
    vi.clearAllMocks();
  });
  
  describe('functionToTest', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test input';
      
      // Act
      const result = functionToTest(input);
      
      // Assert
      expect(result).toBe('expected output');
    });
  });
});
```

### Testing React Components

```javascript
import { render, screen, waitFor } from '@testing-library/react';
import { MyComponent } from '../../../src/components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
  
  it('should handle user interactions', async () => {
    render(<MyComponent />);
    const button = screen.getByRole('button');
    button.click();
    
    await waitFor(() => {
      expect(screen.getByText('Updated Text')).toBeInTheDocument();
    });
  });
});
```

## Mocking Firebase

Firebase services are mocked in the test setup to avoid actual network calls and provide predictable test results.

### Mocking Firebase Auth

```javascript
vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  // ... other auth methods
}));

import { signInWithEmailAndPassword } from 'firebase/auth';

// In your test
signInWithEmailAndPassword.mockResolvedValue({
  user: { uid: 'test-uid', email: 'test@example.com' }
});
```

### Mocking Firestore

```javascript
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  onSnapshot: vi.fn(),
  // ... other firestore methods
}));

import { getDoc } from 'firebase/firestore';

// In your test
getDoc.mockResolvedValue({
  exists: () => true,
  data: () => ({ shapes: [] })
});
```

### Mocking Realtime Database

```javascript
vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  set: vi.fn(),
  update: vi.fn(),
  onValue: vi.fn(),
  // ... other database methods
}));
```

## Best Practices

### 1. Test Isolation
- Each test should be independent and not rely on other tests
- Use `beforeEach` to reset state between tests
- Clear all mocks with `vi.clearAllMocks()`

### 2. Descriptive Test Names
- Use clear, descriptive test names that explain what is being tested
- Follow the pattern: "should [expected behavior] when [condition]"

### 3. Arrange-Act-Assert Pattern
```javascript
it('should calculate total correctly', () => {
  // Arrange - Set up test data
  const items = [10, 20, 30];
  
  // Act - Execute the code under test
  const total = calculateTotal(items);
  
  // Assert - Verify the result
  expect(total).toBe(60);
});
```

### 4. Test Edge Cases
- Test with empty inputs
- Test with null/undefined values
- Test with maximum/minimum values
- Test error conditions

### 5. Mock External Dependencies
- Mock Firebase services
- Mock API calls
- Mock complex dependencies
- Keep mocks simple and focused

### 6. Use Async Testing Properly
```javascript
it('should handle async operations', async () => {
  const promise = asyncFunction();
  await expect(promise).resolves.toBe('result');
  
  // OR
  
  const result = await asyncFunction();
  expect(result).toBe('result');
});
```

### 7. Test User Interactions
```javascript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('should handle button click', async () => {
  const user = userEvent.setup();
  render(<MyComponent />);
  
  await user.click(screen.getByRole('button'));
  expect(screen.getByText('Clicked!')).toBeInTheDocument();
});
```

### 8. Avoid Testing Implementation Details
- Focus on testing behavior, not implementation
- Test what the user sees and does
- Don't test internal state unless necessary

### 9. Keep Tests Simple
- One assertion per test (when possible)
- Clear and focused test cases
- Easy to understand at a glance

### 10. Maintain Tests
- Update tests when requirements change
- Remove obsolete tests
- Keep test code clean and refactored

## Continuous Integration

These tests are designed to run in CI/CD pipelines. They:
- Run quickly (mocked Firebase)
- Are deterministic (no random failures)
- Don't require external services
- Provide clear error messages

## Troubleshooting

### Common Issues

**Tests fail with "Cannot find module"**
- Ensure all dependencies are installed: `npm install`
- Check import paths are correct

**Tests hang or timeout**
- Check for unresolved promises
- Ensure async operations use `await` or `.resolves`/`.rejects`
- Verify mock implementations return values

**Mocks not working**
- Ensure mocks are defined before imports
- Clear mocks between tests with `vi.clearAllMocks()`
- Check mock implementation matches expected interface

**React component tests fail**
- Ensure `@testing-library/react` is installed
- Use `waitFor` for async updates
- Check that test environment is set to 'jsdom' in config

## Test Statistics

- **Total Test Files**: 11
- **Total Tests**: 140
- **Test Coverage**: 80%+ of critical paths
- **All Tests Passing**: ✅

### Breakdown by Category
- Unit Tests: 132
- Integration Tests: 8
- Services: 75 tests
- Contexts: 30 tests  
- Hooks: 6 tests
- Utils: 21 tests

## Contributing

When adding new features:
1. Write tests for new functionality
2. Ensure existing tests still pass
3. Maintain test coverage above 80%
4. Follow existing test patterns and conventions
5. Update this README if adding new test categories

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Firebase Testing Guide](https://firebase.google.com/docs/rules/unit-tests)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

