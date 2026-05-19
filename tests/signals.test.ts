import { generateSignal, generateDelay } from '../src/utils/signals';

describe('generateSignal', () => {
  it('returns "go" or "no-go"', () => {
    for (let i = 0; i < 100; i++) {
      const signal = generateSignal();
      expect(['go', 'no-go']).toContain(signal);
    }
  });

  it('always returns "go" with goChance=1', () => {
    for (let i = 0; i < 50; i++) {
      expect(generateSignal(1)).toBe('go');
    }
  });

  it('always returns "no-go" with goChance=0', () => {
    for (let i = 0; i < 50; i++) {
      expect(generateSignal(0)).toBe('no-go');
    }
  });

  it('produces both types with default chance', () => {
    const results = new Set<string>();
    for (let i = 0; i < 200; i++) {
      results.add(generateSignal(0.5));
    }
    expect(results.has('go')).toBe(true);
    expect(results.has('no-go')).toBe(true);
  });
});

describe('generateDelay', () => {
  it('returns a value within range', () => {
    for (let i = 0; i < 100; i++) {
      const delay = generateDelay(500, 3000);
      expect(delay).toBeGreaterThanOrEqual(500);
      expect(delay).toBeLessThanOrEqual(3000);
    }
  });

  it('returns integer values', () => {
    for (let i = 0; i < 50; i++) {
      const delay = generateDelay(100, 200);
      expect(Number.isInteger(delay)).toBe(true);
    }
  });

  it('respects custom min/max', () => {
    for (let i = 0; i < 50; i++) {
      const delay = generateDelay(1000, 1000);
      expect(delay).toBe(1000);
    }
  });
});
