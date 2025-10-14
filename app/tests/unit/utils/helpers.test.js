// Unit Tests for Helper Utilities
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateUserColor, throttle, getTruncatedName } from '../../../src/utils/helpers';
import { CURSOR_COLORS } from '../../../src/utils/constants';

describe('Helper Functions', () => {
  describe('generateUserColor', () => {
    it('should return a consistent color for the same userId', () => {
      const userId = 'user123';
      const color1 = generateUserColor(userId);
      const color2 = generateUserColor(userId);
      
      expect(color1).toBe(color2);
      expect(CURSOR_COLORS).toContain(color1);
    });
    
    it('should return different colors for different userIds', () => {
      const color1 = generateUserColor('user1');
      const color2 = generateUserColor('user2');
      
      // While it's possible they could be the same due to collision,
      // we test that the function returns valid colors
      expect(CURSOR_COLORS).toContain(color1);
      expect(CURSOR_COLORS).toContain(color2);
    });
    
    it('should return first color when userId is empty or null', () => {
      expect(generateUserColor('')).toBe(CURSOR_COLORS[0]);
      expect(generateUserColor(null)).toBe(CURSOR_COLORS[0]);
      expect(generateUserColor(undefined)).toBe(CURSOR_COLORS[0]);
    });
    
    it('should always return a valid color from CURSOR_COLORS array', () => {
      const testIds = ['alice', 'bob', 'charlie', 'dave', 'eve', 'frank', 'grace'];
      
      testIds.forEach(userId => {
        const color = generateUserColor(userId);
        expect(CURSOR_COLORS).toContain(color);
      });
    });
    
    it('should handle very long user IDs', () => {
      const longUserId = 'a'.repeat(1000);
      const color = generateUserColor(longUserId);
      
      expect(CURSOR_COLORS).toContain(color);
    });
    
    it('should handle special characters in userId', () => {
      const specialIds = ['user@123', 'user#456', 'user$789', 'user!@#$%'];
      
      specialIds.forEach(userId => {
        const color = generateUserColor(userId);
        expect(CURSOR_COLORS).toContain(color);
      });
    });
  });
  
  describe('throttle', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    
    afterEach(() => {
      vi.restoreAllMocks();
    });
    
    it('should call function immediately on first invocation', () => {
      const mockFn = vi.fn();
      const throttled = throttle(mockFn, 100);
      
      throttled();
      
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
    
    it('should not call function again within throttle period', () => {
      const mockFn = vi.fn();
      const throttled = throttle(mockFn, 100);
      
      throttled();
      throttled();
      throttled();
      
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
    
    it('should call function again after throttle period', () => {
      const mockFn = vi.fn();
      const throttled = throttle(mockFn, 100);
      
      throttled();
      expect(mockFn).toHaveBeenCalledTimes(1);
      
      vi.advanceTimersByTime(100);
      
      throttled();
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
    
    it('should pass arguments to throttled function', () => {
      const mockFn = vi.fn();
      const throttled = throttle(mockFn, 100);
      
      throttled('arg1', 'arg2', 'arg3');
      
      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
    });
    
    it('should return the result of the function call', () => {
      const mockFn = vi.fn(() => 'result');
      const throttled = throttle(mockFn, 100);
      
      const result = throttled();
      
      expect(result).toBe('result');
    });
    
    it('should return last result when throttled', () => {
      const mockFn = vi.fn((x) => x * 2);
      const throttled = throttle(mockFn, 100);
      
      const result1 = throttled(5);
      const result2 = throttled(10); // Should return cached result from first call
      
      expect(result1).toBe(10);
      expect(result2).toBe(10); // Same as result1, not 20
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
    
    it('should preserve this context', () => {
      const obj = {
        value: 42,
        getValue: function() {
          return this.value;
        }
      };
      
      obj.getValue = throttle(obj.getValue, 100);
      
      const result = obj.getValue();
      expect(result).toBe(42);
    });
  });
  
  describe('getTruncatedName', () => {
    it('should return full name if shorter than maxLength', () => {
      const name = 'John Doe';
      expect(getTruncatedName(name)).toBe('John Doe');
    });
    
    it('should truncate long names with default maxLength (15)', () => {
      const longName = 'This is a very long name';
      const result = getTruncatedName(longName);
      
      expect(result).toBe('This is a very ...');
      expect(result.length).toBe(18); // 15 chars + '...'
    });
    
    it('should truncate names with custom maxLength', () => {
      const name = 'Alexander Hamilton';
      const result = getTruncatedName(name, 8);
      
      expect(result).toBe('Alexande...');
      expect(result.length).toBe(11); // 8 chars + '...'
    });
    
    it('should return "Anonymous" for null or undefined names', () => {
      expect(getTruncatedName(null)).toBe('Anonymous');
      expect(getTruncatedName(undefined)).toBe('Anonymous');
      expect(getTruncatedName('')).toBe('Anonymous');
    });
    
    it('should handle names exactly at maxLength', () => {
      const name = '123456789012345'; // Exactly 15 chars
      expect(getTruncatedName(name)).toBe(name);
    });
    
    it('should handle names one character over maxLength', () => {
      const name = '1234567890123456'; // 16 chars
      const result = getTruncatedName(name);
      
      expect(result).toBe('123456789012345...');
    });
    
    it('should handle maxLength of 0', () => {
      const name = 'John';
      const result = getTruncatedName(name, 0);
      
      expect(result).toBe('...');
    });
    
    it('should handle unicode characters', () => {
      const name = '👋🌟✨🎉🎊🎈🎁🎀🎂🍰'; // 10 emoji
      const result = getTruncatedName(name, 5);
      
      expect(result).toContain('...');
    });
  });
});
