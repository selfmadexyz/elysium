import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

test('the build pre-renders only its public page allowlist', () => {
  const publicDirectory = join(process.cwd(), 'packages/web/.output/public');
  for (const file of ['index.html', 'get-started/index.html']) {
    const html = readFileSync(join(publicDirectory, file), 'utf8');
    expect(html).toContain('<h1');
    expect(html).toContain('property="og:title"');
    expect(html).toContain('rel="canonical"');
  }
  for (const file of ['posts/index.html', 'sign-in/index.html', 'sign-up/index.html']) {
    expect(existsSync(join(publicDirectory, file))).toBe(false);
  }
});
