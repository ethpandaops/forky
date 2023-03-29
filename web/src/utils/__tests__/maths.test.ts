import { arcToRadiansByPercentage } from '@utils/maths';

describe('maths', () => {
  describe('arcToRadiansByPercentage', () => {
    it('should return half circle radians', () => {
      const fromRadians = 0;
      const percentage = 50;
      const expected = Math.PI.toFixed(6);
      const actual = arcToRadiansByPercentage(fromRadians, percentage).toFixed(6);
      expect(expected).toBe(actual);
    });

    it('should return full circle radians', () => {
      const fromRadians = 0;
      const percentage = 100;
      const expected = (2 * Math.PI).toFixed(6);
      const actual = arcToRadiansByPercentage(fromRadians, percentage).toFixed(6);
      expect(expected).toBe(actual);
    });

    it('should return 0 radians', () => {
      const fromRadians = 0;
      const percentage = 0;
      const expected = 0;
      const actual = arcToRadiansByPercentage(fromRadians, percentage);
      expect(expected).toBe(actual);
    });

    it('should return 0 radians if percentage is negative', () => {
      const fromRadians = 0;
      const percentage = -1;
      const expected = 0;
      const actual = arcToRadiansByPercentage(fromRadians, percentage);
      expect(expected).toBe(actual);
    });

    it('should return 0 radians if percentage is NaN', () => {
      const fromRadians = 0;
      const percentage = NaN;
      const expected = 0;
      const actual = arcToRadiansByPercentage(fromRadians, percentage);
      expect(expected).toBe(actual);
    });

    it('should return half circle radians with alternate start angle', () => {
      const fromRadians = Math.PI;
      const percentage = 50;
      const expected = (2 * Math.PI).toFixed(6);
      const actual = arcToRadiansByPercentage(fromRadians, percentage).toFixed(6);
      expect(expected).toBe(actual);
    });

    it('should return full circle radians with alternate start angle', () => {
      const fromRadians = Math.PI;
      const percentage = 100;
      const expected = (3 * Math.PI).toFixed(6);
      const actual = arcToRadiansByPercentage(fromRadians, percentage).toFixed(6);
      expect(expected).toBe(actual);
    });
  });
});
