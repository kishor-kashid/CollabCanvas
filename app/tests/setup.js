// Test Setup - Testing environment configuration
import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mock Firebase modules
vi.mock('../src/services/firebase', () => ({
  auth: {
    currentUser: null,
  },
  db: {},
  rtdb: {},
}));

// Runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

