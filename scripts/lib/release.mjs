const SEMVER_PATTERN = /^(\d+)\.(\d+)\.(\d+)$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const VERSION_HEADING = /^## \[(\d+\.\d+\.\d+)\]/gm;

export const BUMP_TYPES = ['patch', 'minor', 'major'];

export function nextVersion(current, type) {
  const match = SEMVER_PATTERN.exec(current);
  if (!match) {
    throw new Error(`当前版本不是合法 semver：${current}`);
  }
  if (!BUMP_TYPES.includes(type)) {
    throw new Error(`版本类型必须是 ${BUMP_TYPES.join(' / ')}，实际为 ${type}`);
  }

  const [major, minor, patch] = match.slice(1).map(Number);
  if (type === 'major') {
    return `${major + 1}.0.0`;
  }
  if (type === 'minor') {
    return `${major}.${minor + 1}.0`;
  }
  return `${major}.${minor}.${patch + 1}`;
}

export function archiveUnreleased(markdown, version, date) {
  if (!DATE_PATTERN.test(date)) {
    throw new Error(`发布日期格式必须是 YYYY-MM-DD，实际为 ${date}`);
  }

  const heading = '## [Unreleased]';
  const start = markdown.indexOf(heading);
  if (start === -1) {
    throw new Error('CHANGELOG.md 缺少 ## [Unreleased] 区块');
  }
  if (markdown.includes(`## [${version}]`)) {
    throw new Error(`CHANGELOG.md 已存在 ## [${version}] 区块，不能重复发版`);
  }

  const rest = markdown.slice(start + heading.length);
  const next = rest.search(/^## /m);
  const body = (next === -1 ? rest : rest.slice(0, next)).trim();
  const tail = next === -1 ? '' : rest.slice(next);
  if (!/^- /m.test(body)) {
    throw new Error('[Unreleased] 没有可归档的条目，先运行 pnpm changelog:write');
  }

  const block = `${heading}\n\n暂无未发布变更\n\n## [${version}] - ${date}\n\n${body}\n`;
  return `${markdown.slice(0, start)}${block}${tail ? `\n${tail}` : ''}`;
}

export function collectIssues({ versions, dependencies, tag, changelog }) {
  const issues = [];

  const [{ version: expected }] = versions;
  for (const entry of versions) {
    if (!SEMVER_PATTERN.test(entry.version)) {
      issues.push(`${entry.file} 的版本不是合法 semver：${entry.version}`);
    } else if (entry.version !== expected) {
      issues.push(`${entry.file} 版本为 ${entry.version}，与 ${versions[0].file} 的 ${expected} 不一致`);
    }
  }

  for (const [file, deps] of Object.entries(dependencies)) {
    for (const [name, range] of Object.entries(deps)) {
      if (name.startsWith('@ahomeyonglin/') && range !== 'workspace:*') {
        issues.push(`${file} 中 ${name} 应使用 workspace:*，实际为 ${range}`);
      }
    }
  }

  if (!tag) {
    issues.push('仓库没有 v* 标签，先运行 pnpm release:prepare');
  } else if (tag !== `v${expected}`) {
    issues.push(`最新标签为 ${tag}，与当前版本 ${expected} 不一致，先运行 pnpm release:prepare`);
  }

  if (!changelog.includes('## [Unreleased]')) {
    issues.push('CHANGELOG.md 缺少 ## [Unreleased] 区块');
  }

  const released = [...changelog.matchAll(VERSION_HEADING)];
  if (!released.length) {
    issues.push('CHANGELOG.md 没有任何版本区块，先运行 pnpm release:prepare');
  } else {
    const [first] = released;
    if (first[1] !== expected) {
      issues.push(`CHANGELOG.md 最新版本区块为 ${first[1]}，与当前版本 ${expected} 不一致`);
    }
    if (changelog.indexOf('## [Unreleased]') > first.index) {
      issues.push('CHANGELOG.md 的版本区块必须位于 ## [Unreleased] 之后');
    }
    const dateLine = changelog.slice(first.index).split('\n')[0];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateLine.replace(/^## \[[^\]]+\] - /, ''))) {
      issues.push(`CHANGELOG.md 版本区块缺少合法日期：${dateLine}`);
    }
  }

  return issues;
}
