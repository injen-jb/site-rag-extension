import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('scaffold', () => {
  it('defines manifest with MV3 and wasm-unsafe-eval CSP', () => {
    const manifestPath = resolve(process.cwd(), 'extension/manifest.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
      readonly manifest_version: number;
      readonly content_security_policy?: { readonly extension_pages?: string };
    };

    expect(manifest.manifest_version).toBe(3);
    expect(manifest.content_security_policy?.extension_pages).toContain('wasm-unsafe-eval');
  });
});
