import changelogMarkdown from '../../../../CHANGELOG.md?raw';

export type ChangelogBlock =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] };

export function parseChangelog(markdown: string): ChangelogBlock[] {
  const blocks: ChangelogBlock[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: 'paragraph', text: paragraph.join(' ') });
      paragraph = [];
    }
  };

  const flushList = () => {
    if (list.length) {
      blocks.push({ type: 'list', items: list });
      list = [];
    }
  };

  const flush = () => {
    flushParagraph();
    flushList();
  };

  for (const rawLine of markdown.split('\n')) {
    const line = rawLine.trim();
    if (!line) {
      flush();
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      flush();
      blocks.push({
        type: 'heading',
        level: heading[1].length as 1 | 2 | 3,
        text: heading[2].trim(),
      });
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      flushParagraph();
      list.push(line.replace(/^[-*]\s+/, '').trim());
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flush();
  return blocks;
}

export function latestChanges(markdown: string, count: number): string[] {
  const blocks = parseChangelog(markdown);
  let inVersion = false;

  for (const block of blocks) {
    if (block.type === 'heading' && block.level === 2) {
      inVersion = true;
      continue;
    }
    if (inVersion && block.type === 'list') {
      return block.items.slice(0, count);
    }
  }

  return [];
}

export { changelogMarkdown };
