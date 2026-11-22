import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { latestVersionTag } from './lib/commits.mjs';
import { archiveUnreleased, BUMP_TYPES, collectIssues, nextVersion } from './lib/release.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const packageFiles = [
  'package.json',
  'packages/tokens/package.json',
  'packages/ui/package.json',
  'apps/docs/package.json',
];

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(root, relativePath), 'utf8'));
}

function writeJson(relativePath, value) {
  writeFileSync(join(root, relativePath), `${JSON.stringify(value, null, 2)}\n`);
}

function collectVersions() {
  return packageFiles.map((file) => ({ file, version: readJson(file).version }));
}

function collectDependencies() {
  return Object.fromEntries(
    packageFiles.map((file) => [file, readJson(file).dependencies ?? {}]),
  );
}

function isCleanTree() {
  try {
    execFileSync('git', ['diff', '--quiet'], { cwd: root });
    execFileSync('git', ['diff', '--cached', '--quiet'], { cwd: root });
    return true;
  } catch {
    return false;
  }
}

function today() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

const [command, ...rest] = process.argv.slice(2);

if (command === 'check') {
  const issues = collectIssues({
    versions: collectVersions(),
    dependencies: collectDependencies(),
    tag: latestVersionTag(),
    changelog: readFileSync(join(root, 'CHANGELOG.md'), 'utf8'),
  });

  if (!issues.length) {
    console.log('版本与发版状态校验通过');
    process.exit(0);
  }

  for (const issue of issues) {
    console.error(issue);
  }
  process.exit(1);
}

if (BUMP_TYPES.includes(command)) {
  const [type] = rest;
  if (type) {
    console.error(`未知参数：${type}`);
    process.exit(2);
  }

  if (!isCleanTree()) {
    console.error('工作区有未提交改动，发版前先提交或还原');
    process.exit(1);
  }

  const current = readJson('package.json').version;
  let version;
  let changelog;
  try {
    version = nextVersion(current, command);
    changelog = archiveUnreleased(
      readFileSync(join(root, 'CHANGELOG.md'), 'utf8'),
      version,
      today(),
    );
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }

  for (const file of packageFiles) {
    const manifest = readJson(file);
    manifest.version = version;
    writeJson(file, manifest);
  }
  writeFileSync(join(root, 'CHANGELOG.md'), changelog);

  console.log(`已准备 v${version}`);
  console.log('后续步骤：');
  console.log('1. 跑全量校验：tokens test / ui lint / docs lint / docs build');
  console.log(`2. 提交：git commit -m "chore(repo): 发布 v${version}"`);
  console.log(`3. 打 tag：git tag v${version}`);
  console.log('4. 先推送 tag，再推送 main，最后确认 CI 与部署');
  process.exit(0);
}

console.error('用法：release.mjs check | patch | minor | major');
process.exit(2);
