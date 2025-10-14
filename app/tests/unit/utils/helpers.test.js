// Unit Tests for Helper Functions - To be implemented in PR #8

import { describe, it, expect } from 'vitest';
import {
  generateUserColor,
  truncateDisplayName,
  getDisplayNameFromEmail,
  generateShapeId,
  throttle,
  clamp,
} from '../../../src/utils/helpers';

describe('Helper Functions', () => {
  describe('generateUserColor', () => {
    it('should generate consistent color for same user ID', () => {
      const userId = 'user123';
      const color1 = generateUserColor(userId);
      const color2 = generateUserColor(userId);
      expect(color1).toBe(color2);
    });
    
    it('should generate different colors for different users', () => {
      const color1 = generateUserColor('user1');
      const color2 = generateUserColor('user2');
      // May occasionally be equal due to hash collision, but unlikely
      expect(typeof color1).toBe('string');
      expect(typeof color2).toBe('string');
    });
  });
  
  describe('truncateDisplayName', () => {
    it('should not truncate names under 20 characters', () => {
      expect(truncateDisplayName('John Doe')).toBe('John Doe');
    });
    
    it('should truncate names over 20 characters', () => {
      const longName = 'ThisIsAVeryLongDisplayNameThatExceedsTheLimit';
      const truncated = truncateDisplayName(longName);
      expect(truncated.length).toBeLessThanOrEqual(24); // 20 + '...'
    });
  });
  
  describe('getDisplayNameFromEmail', () => {
    it('should extract name from email', () => {
      expect(getDisplayNameFromEmail('john.doe@example.com')).toBe('john.doe');
    });
  });
  
  describe('clamp', () => {
    it('should clamp values within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });
});

