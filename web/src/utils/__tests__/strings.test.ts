import { truncateHash } from '@utils/strings';

describe('strings', () => {
  describe('truncateHash', () => {
    it('should return an empty string if no hash is passed', () => {
      expect(truncateHash()).toBe('');
    });

    it('should return the first 6 characters and the last 4 characters of a hash', () => {
      expect(truncateHash('0x1234567890abcdef')).toBe('0x1234...cdef');
    });

    it('should return full hash if length of 10 or under', () => {
      expect(truncateHash('0x12cdef')).toBe('0x12cdef');
      expect(truncateHash('0x1234abcd')).toBe('0x1234abcd');
    });
  });
});
