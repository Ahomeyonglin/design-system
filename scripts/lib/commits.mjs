import { execFileSync } from 'node:child_process';

export const TYPES = [
  'feat',
  'fix',
  'refactor',
  'perf',
  'docs',
  'style',
  'test',
  'build',
  'ci',
  'chore',
];

export const SCOPES = ['tokens', 'ui', 'docs', 'repo', 'skills'];

const SUBJECT_PATTERN = new RegExp(
  `^(${TYPES.join('|')})(?:\\(([a-z0-9-]+)\\))?(!)?: (.+)$`,
);
const EXEMPT_PATTERNS = [/^Merge /, /^Revert "/, /^(?:fixup|squash)! /];
const BREAKING_PATTERN = /^BREAKING[ -]CHANGE:/m;

export function isExempt(subject) {
  return EXEMPT_PATTERNS.some((pattern) => pattern.test(subject));
}

export function validateSubject(subject) {
  if (isExempt(subject)) {
    return null;
  }

  const match = subject.match(SUBJECT_PATTERN);
  if (!match) {
    return `格式应为 type(scope): 描述，type 限定 ${TYPES.join(' / ')}`;
  }

  const [, , scope, , description] = match;
  if (scope && !SCOPES.includes(scope)) {
    return `scope 必须是 ${SCOPES.join(' / ')}，实际为 ${scope}`;
  }
  if (!description.trim()) {
    return '描述不能为空';
  }
  if ([...subject].length > 72) {
    return `标题不超过 72 个字符，实际 ${[...subject].length}`;
  }

  return null;
}

export function parseSubject(subject) {
  if (validateSubject(subject) !== null) {
    return null;
  }

  const match = subject.match(SUBJECT_PATTERN);
  if (!match) {
    return null;
  }

  const [, type, scope, bang, description] = match;
  return { type, scope, breaking: Boolean(bang), description: description.trim() };
}

export function isBreaking(commit) {
  return Boolean(commit.breaking) || BREAKING_PATTERN.test(commit.body ?? '');
}

export function latestVersionTag() {
  try {
    return execFileSync('git', ['describe', '--tags', '--abbrev=0', '--match', 'v*'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

export function readCommits(range) {
  const output = execFileSync(
    'git',
    ['log', range, '--format=%H%x1f%h%x1f%s%x1f%b%x1e'],
    { encoding: 'utf8' },
  );

  return output
    .split('\x1e')
    .map((record) => record.replace(/^\n/, ''))
    .filter(Boolean)
    .map((record) => {
      const [hash, shortHash, subject, body] = record.split('\x1f');
      return { hash, shortHash, subject, body: body ?? '' };
    });
}
