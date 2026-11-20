import registryFile from '../../../../packages/ui/registry.json';

export interface RegistryProp {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  description: string;
}

export interface RegistryComponent {
  id: string;
  name: string;
  category: string;
  importPath: string;
  $description: string;
  props: RegistryProp[];
  tokens: string[];
}

export interface RegistryFile {
  schemaVersion: number;
  generatedFrom: string;
  components: RegistryComponent[];
}

export const registry = registryFile as RegistryFile;

export const components = registry.components;

export function findComponent(id: string): RegistryComponent | undefined {
  return components.find((component) => component.id === id);
}

export function componentIds(): string[] {
  return components.map((component) => component.id);
}

export function enumValues(component: RegistryComponent, propName: string): string[] {
  const prop = component.props.find((item) => item.name === propName);
  if (!prop) {
    return [];
  }
  return Array.from(prop.type.matchAll(/"([^"]+)"/g)).map((match) => match[1]);
}

export function hasProp(component: RegistryComponent, propName: string): boolean {
  return component.props.some((prop) => prop.name === propName);
}
