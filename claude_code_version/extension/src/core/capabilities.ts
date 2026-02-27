/** Detected browser capabilities relevant to the extension. */
export interface BrowserCapabilities {
  readonly webgpu: boolean;
  readonly wasm: boolean;
  readonly indexeddb: boolean;
  readonly serviceWorker: boolean;
  readonly recommendedDevice: 'webgpu' | 'wasm' | 'cpu';
}

/**
 * Detect browser capabilities for determining optimal inference strategy.
 * Returns a frozen object with boolean flags for each capability.
 */
export function detectCapabilities(): BrowserCapabilities {
  const webgpu = typeof navigator !== 'undefined' && 'gpu' in navigator;
  const wasm = typeof WebAssembly !== 'undefined';
  const indexeddb = typeof indexedDB !== 'undefined';
  const serviceWorker = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;

  let recommendedDevice: 'webgpu' | 'wasm' | 'cpu';
  if (webgpu) {
    recommendedDevice = 'webgpu';
  } else if (wasm) {
    recommendedDevice = 'wasm';
  } else {
    recommendedDevice = 'cpu';
  }

  return Object.freeze({
    webgpu,
    wasm,
    indexeddb,
    serviceWorker,
    recommendedDevice,
  });
}
