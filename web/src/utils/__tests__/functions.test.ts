import { vi } from 'vitest';

import { randomHex, randomInt, randomBigInt } from '@utils/functions';

describe('functions', () => {
  describe('randomHex', () => {
    it('should return a string of the specified size plus 2 characters for the "0x" prefix', () => {
      const size = 4;
      const result = randomHex(size);
      expect(typeof result).toBe('string');
      expect(result.length).toBe(size + 2);
    });

    it('should return a string starting with "0x" prefix', () => {
      const size = 6;
      const result = randomHex(size);
      expect(result.startsWith('0x')).toBe(true);
    });

    it('should return a string containing only hexadecimal characters', () => {
      const size = 8;
      const result = randomHex(size);
      const hexPattern = /^0x[a-fA-F0-9]+$/;
      expect(hexPattern.test(result)).toBe(true);
    });

    it('should return different strings for multiple calls', () => {
      const size = 12;
      const result1 = randomHex(size);
      const result2 = randomHex(size);
      expect(result1).not.toBe(result2);
    });
  });

  describe('randomInt', () => {
    it('should throw an error if min is greater than max', () => {
      const min = 10;
      const max = 5;
      expect(() => randomInt(min, max)).toThrow(
        'Invalid range: min must be less than or equal to max',
      );
    });

    it('should return a number between min and max, inclusive', () => {
      const min = 1;
      const max = 10;
      const result = randomInt(min, max);
      expect(result).toBeGreaterThanOrEqual(min);
      expect(result).toBeLessThanOrEqual(max);
    });

    it('should return an integer', () => {
      const min = 3;
      const max = 15;
      const result = randomInt(min, max);
      expect(Number.isInteger(result)).toBe(true);
    });

    it('should return the same number if min and max are equal', () => {
      const min = 7;
      const max = 7;
      const result = randomInt(min, max);
      expect(result).toBe(min);
    });

    it('should return different numbers for multiple calls within the same range', () => {
      const min = 1;
      const max = 100;
      const result1 = randomInt(min, max);
      const result2 = randomInt(min, max);
      expect(result1).not.toBe(result2);
    });
  });

  describe('randomBigInt', () => {
    it('should throw an error if min is greater than max', () => {
      const min = BigInt(10);
      const max = BigInt(5);
      expect(() => randomBigInt(min, max)).toThrow(
        'Invalid range: min must be less than or equal to max',
      );
    });

    it('should return a bigint between min and max, inclusive', () => {
      const min = BigInt(1);
      const max = BigInt(10);
      const result = randomBigInt(min, max);
      expect(result).toBeGreaterThanOrEqual(min);
      expect(result).toBeLessThanOrEqual(max);
    });

    it('should return the same bigint if min and max are equal', () => {
      const min = BigInt(7);
      const max = BigInt(7);
      const result = randomBigInt(min, max);
      expect(result).toBe(min);
    });

    it('should return different bigints for multiple calls within the same range', () => {
      const min = BigInt(1);
      const max = BigInt(100);
      const result1 = randomBigInt(min, max);
      const result2 = randomBigInt(min, max);
      expect(result1).not.toBe(result2);
    });

    it('should return a bigint within large range', () => {
      const min = BigInt('12345678901234567890');
      const max = BigInt('12345678909876543210');
      const result = randomBigInt(min, max);
      expect(result).toBeGreaterThanOrEqual(min);
      expect(result).toBeLessThanOrEqual(max);
    });
  });
});
