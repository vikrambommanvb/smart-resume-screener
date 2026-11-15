import { describe, it, expect } from 'vitest';
import { formatBytes, cn } from '../lib/utils';

describe('Web Utility Smoke Tests', () => {
  it('combines class names correctly', () => {
    const isHidden = false;
    expect(cn('base-class', isHidden && 'hidden', 'text-hi')).toBe('base-class text-hi');
  });

  it('formats byte sizes cleanly', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1024 * 1024 * 2.5)).toBe('2.5 MB');
  });
});

