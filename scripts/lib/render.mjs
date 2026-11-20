import { isBreaking, parseSubject } from './commits.mjs';

const GROUPS = [
  { heading: 'Added', types: ['feat'] },
  { heading: 'Changed', types: ['refactor', 'perf'] },
  { heading: 'Deprecated', types: [] },
  { heading: 'Removed', types: [] },
  { heading: 'Fixed', types: ['fix'] },
];
const IGNORED_TYPES = new Set(['docs', 'style', 'test', 'build', 'ci', 'chore']);
const UNRELEASED_HEADING = '## [Unreleased]';
const NEXT_HEADING = /^## /m;

export function groupCommits(commits) {
  const groups = new Map(GROUPS.map((group) => [group.heading, { regular: [], breaking: [] }]));

  for (const commit of commits) {
    const parsed = parseSubject(commit.subject);
    if (!parsed || IGNORED_TYPES.has(parsed.type)) {
      continue;
    }

    const group = GROUPS.find((entry) => entry.types.includes(parsed.type));
    if (!group) {
      continue;
    }

    const breaking = isBreaking({ ...commit, breaking: parsed.breaking });
    const target = breaking ? 'Changed' : group.heading;
    const entry = {
      shortHash: commit.shortHash,
      text: parsed.scope ? `${parsed.scope}: ${parsed.description}` : parsed.description,
    };
    const bucket = groups.get(target);
    if (breaking) {
      bucket.breaking.push(entry);
    } else {
      bucket.regular.push(entry);
    }
  }

  return groups;
}

function renderItem({ text, shortHash, breaking }) {
  return `- ${breaking ? '破坏性：' : ''}${text}（\`${shortHash}\`）`;
}

export function renderUnreleased(commits) {
  const groups = groupCommits(commits);
  const sections = [];

  for (const [heading, { regular, breaking }] of groups) {
    if (!regular.length && !breaking.length) {
      continue;
    }
    const items = [
      ...breaking.map((entry) => renderItem({ ...entry, breaking: true })),
      ...regular.map((entry) => renderItem(entry)),
    ];
    sections.push(`### ${heading}\n\n${items.join('\n')}`);
  }

  if (!sections.length) {
    return `${UNRELEASED_HEADING}\n\n暂无未发布变更\n`;
  }

  return `${UNRELEASED_HEADING}\n\n${sections.join('\n\n')}\n`;
}

export function replaceUnreleased(markdown, block) {
  const start = markdown.indexOf(UNRELEASED_HEADING);
  if (start === -1) {
    throw new Error('CHANGELOG.md 缺少 ## [Unreleased] 区块');
  }

  const rest = markdown.slice(start + UNRELEASED_HEADING.length);
  const next = rest.search(NEXT_HEADING);
  if (next === -1) {
    return `${markdown.slice(0, start)}${block}`;
  }

  return `${markdown.slice(0, start)}${block}\n${rest.slice(next)}`;
}
