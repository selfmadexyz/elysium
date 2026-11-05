import { spawnSync } from 'node:child_process';
import { git } from './check-comments';

function run(args: string[]) {
  const result = spawnSync('bun', args, { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const refs = (await Bun.stdin.text()).trim().split('\n').filter(Boolean);
const pushes = refs.map((line) => line.split(/\s+/)).filter(([, localSha]) => localSha && !/^0+$/.test(localSha));
if (pushes.length) {
  run(['run', 'lint']);
  run(['run', 'typecheck']);
  run(['run', 'test:harness']);
}
for (const [, localSha, , remoteSha] of pushes) {
  if (!localSha || !remoteSha) throw new Error('Invalid pre-push reference');
  const base = /^0+$/.test(remoteSha) ? git(['merge-base', 'origin/main', localSha]) : remoteSha;
  run(['scripts/check-comments.ts', '--base', base, '--head', localSha]);
}
