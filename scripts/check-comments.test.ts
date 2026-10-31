import { describe, expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inspectDiff } from './check-comments';

const reviewMarker = ['pony', 'tail:'].join('');

describe('added comment guard', () => {
  test('reports new lines with accurate positions after deleted lines', () => {
    const findings = inspectDiff(
      `+++ b/src/a.ts\n@@ -3,2 +3,2 @@\n-// removed\n+const count = 1;\n+// ${reviewMarker} remove this\n`,
    );
    expect(findings).toEqual([{ file: 'src/a.ts', line: 4, blocked: true, text: `// ${reviewMarker} remove this` }]);
  });

  test('allows specs, seeds, biome directives and URL strings', () => {
    expect(
      inspectDiff(
        '+++ b/src/a.ts\n@@ -0,0 +1,4 @@\n+// spec: invariant\n+// seed: fixture\n+// biome-ignore lint: reason\n+const url = "https://example.com";',
      ),
    ).toEqual([]);
  });

  test('blocks shell, YAML and multiline markers while preserving paths with spaces', () => {
    for (const [file, marker] of [
      ['.githooks/pre-push', `# ${reviewMarker} cleanup`],
      ['ci.yml', `# ${reviewMarker} cleanup`],
      ['src/a b.ts', ` * ${reviewMarker} cleanup`],
    ] as const) {
      expect(inspectDiff(`+++ b/${file}\n@@ -0,0 +12 @@\n+${marker}`)).toEqual([
        { file, line: 12, blocked: true, text: marker.trim() },
      ]);
    }
  });

  test('ignores removed markers and non-source documentation', () => {
    expect(inspectDiff(`+++ b/readme.md\n@@ -1 +1 @@\n-// ${reviewMarker} old\n+// ${reviewMarker} example`)).toEqual(
      [],
    );
  });
});

test('CLI compares committed refs independently of working tree and fails on added markers', () => {
  const directory = mkdtempSync(join(tmpdir(), 'elysium-comments-'));
  const command = (args: string[]) => {
    const result = spawnSync('git', args, { cwd: directory, encoding: 'utf8' });
    if (result.status !== 0) throw new Error(result.stderr);
    return result.stdout.trim();
  };
  const check = (args: string[]) =>
    spawnSync(process.execPath, [join(import.meta.dir, 'check-comments.ts'), ...args], {
      cwd: directory,
      encoding: 'utf8',
    });
  try {
    command(['init', '-q']);
    command(['config', 'user.email', 'test@example.invalid']);
    command(['config', 'user.name', 'Harness test']);
    command(['config', 'commit.gpgsign', 'false']);
    writeFileSync(join(directory, 'a.ts'), 'export const a = 1;\n');
    command(['add', '.']);
    command(['commit', '-qm', 'base']);
    const base = command(['rev-parse', 'HEAD']);
    writeFileSync(join(directory, 'a.ts'), `export const a = 1;\n// ${reviewMarker} review marker\n`);
    command(['add', '.']);
    command(['commit', '-qm', 'marker']);
    const head = command(['rev-parse', 'HEAD']);
    writeFileSync(join(directory, 'a.ts'), 'export const a = 1;\n');
    const committed = check(['--base', base, '--head', head]);
    expect(committed.status).toBe(1);
    expect(committed.stdout).toContain('a.ts:2: ERROR');
    expect(check(['--base', base]).status).toBe(0);
    expect(check(['--base', 'missing-ref']).status).toBe(1);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('the guard and its fixtures can be committed without blocking themselves', () => {
  for (const name of ['check-comments.ts', 'check-comments.test.ts', 'pre-push.ts']) {
    const source = readFileSync(join(import.meta.dir, name), 'utf8');
    const diff = `+++ b/scripts/${name}\n@@ -0,0 +1 @@\n${source
      .split('\n')
      .map((line) => `+${line}`)
      .join('\n')}`;
    expect(inspectDiff(diff).filter((finding) => finding.blocked)).toEqual([]);
  }
});
