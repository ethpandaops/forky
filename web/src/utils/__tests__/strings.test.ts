import { truncateHash, convertToHexColor } from '@utils/strings';

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

  describe('convertToHexColor', () => {
    it('should return different colors for different input strings', () => {
      const color1 = convertToHexColor('example1');
      const color2 = convertToHexColor('example3');
      const color3 = convertToHexColor('example5');

      expect(color1).not.toBe(color2);
      expect(color1).not.toBe(color3);
      expect(color2).not.toBe(color3);
    });

    it('should return the same color for the same input string', () => {
      const color1 = convertToHexColor('example1');
      const color2 = convertToHexColor('example1');

      expect(color1).toBe(color2);
    });

    it('should return a color in valid hex format', () => {
      const hexColorRegex = /^#[0-9a-fA-F]{6}$/;

      expect(convertToHexColor('example1')).toMatch(hexColorRegex);
      expect(convertToHexColor('example2')).toMatch(hexColorRegex);
      expect(convertToHexColor('example3')).toMatch(hexColorRegex);
    });

    it('should return the different color for strings with the same characters but different cases', () => {
      const color1 = convertToHexColor('Example1');
      const color2 = convertToHexColor('example1');

      expect(color1).not.toBe(color2);
    });

    it('should handle very long strings and return a valid web-safe color', () => {
      const hexColorRegex = /^#[0-9a-fA-F]{6}$/;

      expect(convertToHexColor('a'.repeat(10000))).toMatch(hexColorRegex);
    });
  });
});
