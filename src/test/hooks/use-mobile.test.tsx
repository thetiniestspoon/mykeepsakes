import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIsMobile } from '@/hooks/use-mobile';

describe('useIsMobile', () => {
  const originalInnerWidth = window.innerWidth;
  let matchMediaMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    matchMediaMock = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    window.matchMedia = matchMediaMock;
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  it('returns false for desktop width (>= 768px)', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('returns true for mobile width (< 768px)', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('returns true for width exactly at breakpoint boundary (767px)', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 767,
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('returns false for width exactly at breakpoint (768px)', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });
});
