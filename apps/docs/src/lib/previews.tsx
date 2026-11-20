import { useState } from 'react';
import { Badge, type BadgeTone } from '@ds/ui/Badge';
import { Button, type ButtonVariant } from '@ds/ui/Button';
import { Card } from '@ds/ui/Card';
import { Text, type TextTone, type TextVariant } from '@ds/ui/Text';
import { TextField } from '@ds/ui/TextField';

export interface PreviewState {
  variant?: string;
  tone?: string;
  disabled?: boolean;
  state?: string;
}

const PREVIEW_IDS = ['Badge', 'Button', 'Card', 'Text', 'TextField'];

const PREVIEW_STATES: Record<string, string[]> = {
  TextField: ['default', 'error', 'disabled'],
};

export function hasPreview(id: string): boolean {
  return PREVIEW_IDS.includes(id);
}

export function previewStates(id: string): string[] {
  return PREVIEW_STATES[id] ?? [];
}

function TextPreview({ state }: { state: PreviewState }) {
  return (
    <Text
      as="p"
      variant={(state.variant ?? 'body.md') as TextVariant}
      tone={(state.tone ?? 'primary') as TextTone}
    >
      设计系统 Design System 0123
    </Text>
  );
}

function ButtonPreview({ state }: { state: PreviewState }) {
  return (
    <Button variant={(state.variant ?? 'primary') as ButtonVariant} disabled={state.disabled}>
      保存
    </Button>
  );
}

function TextFieldPreview({ state }: { state: PreviewState }) {
  const [value, setValue] = useState('design-system');
  const mode = state.state ?? 'default';

  return (
    <TextField
      label="项目名称"
      description="用于列表与导出文件名。"
      error={mode === 'error' ? '项目名称已存在。' : undefined}
      value={value}
      onChange={setValue}
      disabled={mode === 'disabled'}
    />
  );
}

function CardPreview() {
  return (
    <Card>
      <Text as="p" variant="heading.md">
        项目概览
      </Text>
      <Text as="p" tone="secondary">
        卡片承载同一主题下的相关内容。
      </Text>
    </Card>
  );
}

function BadgePreview({ state }: { state: PreviewState }) {
  return <Badge tone={(state.tone ?? 'neutral') as BadgeTone}>状态</Badge>;
}

export function ComponentPreview({ id, state = {} }: { id: string; state?: PreviewState }) {
  switch (id) {
    case 'Text':
      return <TextPreview state={state} />;
    case 'Button':
      return <ButtonPreview state={state} />;
    case 'TextField':
      return <TextFieldPreview state={state} />;
    case 'Card':
      return <CardPreview />;
    case 'Badge':
      return <BadgePreview state={state} />;
    default:
      return null;
  }
}
