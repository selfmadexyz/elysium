import { spawnSync } from 'node:child_process';

const SOURCE_FILE = /\.(?:[cm]?[jt]sx?)$/;
const SCANNED_FILE = /\.(?:[cm]?[jt]sx?|css|sh|ya?ml)$|^\.githooks\//;
const PONYTAIL = /(?:\/\/|\/\*+|^\s*\*+|#)\s*ponytail:/i;
const ALLOWED = /^\s*\/\/ (?:spec:|seed:|biome-ignore )/;

export function inspectDiff(diff: string) {
  const findings: { file: string; line: number; blocked: boolean; text: string }[] = [];
  let file = '';
  let line = 0;
  for (const entry of diff.split('\n')) {
    if (entry.startsWith('+++ b/')) {
      file = entry.slice(6);
      continue;
    }
    const hunk = entry.match(/^@@ -\S+ \+(\d+)/);
    if (hunk) {
      line = Number(hunk[1]);
      continue;
    }
    if (entry.startsWith(' ')) line++;
    if (!entry.startsWith('+') || entry.startsWith('+++ ')) continue;
    const added = entry.slice(1);
    const lineNumber = line++;
    const blocked = SCANNED_FILE.test(file) && PONYTAIL.test(added);
    if (blocked || (SOURCE_FILE.test(file) && /(^|[^:])(\/\/|\/\*)/.test(added) && !ALLOWED.test(added))) {
      findings.push({ file, line: lineNumber, blocked, text: added.trim() });
    }
  }
  return findings;
}

export function git(args: string[]) {
  const result = spawnSync('git', args, { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr.trim() || `git ${args[0]} failed`);
  return result.stdout.trimEnd();
}

function option(name: string) {
  const index = process.argv.indexOf(name);
  if (index < 0) return undefined;
  const value = process.argv[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${name} requires a revision`);
  return value;
}

if (import.meta.main) {
  try {
    const requestedBase = option('--base') ?? process.env.COMMENTS_BASE;
    const head = option('--head');
    const base = requestedBase ?? git(['merge-base', 'origin/main', head ?? 'HEAD']);
    const baseSha = git(['rev-parse', '--verify', `${base}^{commit}`]);
    const headArgs = head ? [git(['rev-parse', '--verify', `${head}^{commit}`])] : [];
    const diff = git([
      '-c',
      'core.quotePath=false',
      'diff',
      '--no-ext-diff',
      '--no-color',
      '--unified=0',
      '--diff-filter=AMR',
      baseSha,
      ...headArgs,
      '--',
    ]);
    const findings = inspectDiff(diff);
    for (const finding of findings) {
      console.log(
        `${finding.file}:${finding.line}: ${finding.blocked ? 'ERROR: remove ponytail review marker' : 'Review comment: keep only useful invariants, units or quirks'}: ${finding.text}`,
      );
    }
    const blocked = findings.filter((finding) => finding.blocked).length;
    console.log(`${findings.length - blocked} comment(s) to review, ${blocked} blocked marker(s)`);
    if (blocked) process.exitCode = 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
