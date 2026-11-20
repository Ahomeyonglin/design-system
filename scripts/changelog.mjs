import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isExempt, latestVersionTag, parseSubject, readCommits } from './lib/commits.mjs';
import { renderUnreleased, replaceUnreleased } from './lib/render.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const changelogPath = join(root, 'CHANGELOG.md');

const args = process.argv.slice(2);
const mode = args.includes('--write') ? 'write' : args.includes('--check') ? 'check' : null;
if (!mode) {
  console.error('用法：changelog.mjs --write | --check [range]');
  process.exit(2);
}

const explicitRange = args.find((arg) => !arg.startsWith('--'));
const tag = latestVersionTag();
if (!tag && !explicitRange) {
  console.warn('未找到 v* 标签，回退到最近一条提交');
}
const range = explicitRange ?? (tag ? `${tag}..HEAD` : 'HEAD~1..HEAD');
const commits = readCommits(range);

const invalid = commits.filter((commit) => !isExempt(commit.subject) && !parseSubject(commit.subject));
if (invalid.length) {
  for (const commit of invalid) {
    console.error(`${commit.shortHash} ${commit.subject}`);
  }
  console.error('存在不合规的提交信息，先运行 pnpm commit:check 修正');
  process.exit(1);
}

const block = renderUnreleased(commits);
const current = readFileSync(changelogPath, 'utf8');
const next = replaceUnreleased(current, block);

if (mode === 'write') {
  if (next !== current) {
    writeFileSync(changelogPath, next);
    console.log(`已更新 CHANGELOG.md（${commits.length} 条提交）`);
  } else {
    console.log('CHANGELOG.md 已是最新');
  }
  process.exit(0);
}

if (next === current) {
  console.log('CHANGELOG.md 校验通过');
  process.exit(0);
}

console.error('CHANGELOG.md 的 [Unreleased] 与提交历史不一致，运行 pnpm changelog:write 更新');
console.error('期望区块：');
console.error(block.split('\n').slice(0, 20).join('\n'));
process.exit(1);
