import { describe, it, expect } from 'vitest';
import { detectCapabilities } from './capabilities';

describe('detectCapabilities', () => {
  it('returns webgpu: false in Node environment', () => {
    const caps = detectCapabilities();
    expect(caps.webgpu).toBe(false);
  });

  it('returns indexeddb: false in Node environment', () => {
    const caps = detectCapabilities();
    expect(caps.indexeddb).toBe(false);
  });

  it('returns serviceWorker: false in Node environment', () => {
    const caps = detectCapabilities();
    expect(caps.serviceWorker).toBe(false);
  });

  it('returns a frozen object', () => {
    const caps = detectCapabilities();
    expect(Object.isFrozen(caps)).toBe(true);
  });

  it('includes a recommendedDevice field', () => {
    const caps = detectCapabilities();
    expect(caps.recommendedDevice).toBeDefined();
    expect(['webgpu', 'wasm', 'cpu']).toContain(caps.recommendedDevice);
  });
});
