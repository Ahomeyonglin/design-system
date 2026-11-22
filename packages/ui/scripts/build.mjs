import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src');
const dist = join(root, 'dist');

rmSync(dist, { recursive: true, force: true });
execFileSync('tsc', ['-p', 'tsconfig.build.json'], { cwd: root, stdio: 'inherit' });

function copyCss(from, to) {
  for (const entry of readdirSync(from)) {
    const source = join(from, entry);
    const target = join(to, entry);
    if (statSync(source).isDirectory()) {
      copyCss(source, target);
    } else if (entry.endsWith('.css')) {
      mkdirSync(to, { recursive: true });
      cpSync(source, target);
    }
  }
}

copyCss(src, dist);
