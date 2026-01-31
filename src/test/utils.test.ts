import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn utility', () => {
  it('merges class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', true && 'visible')).toBe('base visible');
  });

  it('handles undefined and null values', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end');
  });

  it('deduplicates Tailwind classes', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });

  it('merges conflicting Tailwind classes correctly', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('handles empty inputs', () => {
    expect(cn()).toBe('');
    expect(cn('')).toBe('');
  });

  it('handles array inputs', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });

  it('handles object inputs for conditional classes', () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
  });
});
