import { readCommits, validateSubject } from './lib/commits.mjs';

const range = process.argv[2] ?? process.env.COMMIT_RANGE ?? 'HEAD~1..HEAD';
const commits = readCommits(range);

const failures = commits
  .map((commit) => ({ ...commit, error: validateSubject(commit.subject) }))
  .filter((commit) => commit.error);

if (!failures.length) {
  console.log(`提交信息校验通过（${commits.length} 条）`);
  process.exit(0);
}

for (const failure of failures) {
  console.error(`${failure.shortHash} ${failure.subject}`);
  console.error(`  期望：${failure.error}`);
}
process.exit(1);
