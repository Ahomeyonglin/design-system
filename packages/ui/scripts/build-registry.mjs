import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const componentsDir = join(root, 'src/components');

function byText(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function readMeta(id) {
  return JSON.parse(readFileSync(join(componentsDir, id, 'component.meta.json'), 'utf8'));
}

const components = readdirSync(componentsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => {
    const id = entry.name;
    const meta = readMeta(id);
    return {
      id,
      name: meta.name,
      category: meta.category,
      importPath: `@ds/ui/${id}`,
      $description: meta.$description,
      props: meta.props.map((prop) => {
        const entry = {
          name: prop.name,
          type: prop.type,
          required: prop.required,
        };
        if (prop.defaultValue !== undefined) {
          entry.defaultValue = prop.defaultValue;
        }
        entry.description = prop.description;
        return entry;
      }),
      tokens: [...meta.tokens].sort(byText),
    };
  })
  .sort((a, b) => byText(a.id, b.id));

const registry = {
  schemaVersion: 1,
  generatedFrom: 'src/components/*/component.meta.json',
  components,
};

writeFileSync(join(root, 'registry.json'), `${JSON.stringify(registry, undefined, 2)}\n`);
