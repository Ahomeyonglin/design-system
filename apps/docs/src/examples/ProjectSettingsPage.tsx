import { useState } from 'react';
import { Badge } from '@ahomeyonglin/ui/Badge';
import { Button } from '@ahomeyonglin/ui/Button';
import { Card } from '@ahomeyonglin/ui/Card';
import { Text } from '@ahomeyonglin/ui/Text';
import { TextField } from '@ahomeyonglin/ui/TextField';
import './project-settings.css';

interface ProjectForm {
  name: string;
  slug: string;
  owner: string;
}

const INITIAL_FORM: ProjectForm = {
  name: '设计系统',
  slug: 'design-system',
  owner: 'lin',
};

type StatusTone = 'neutral' | 'success' | 'danger';

export default function ProjectSettingsPage() {
  const [saved, setSaved] = useState<ProjectForm>(INITIAL_FORM);
  const [form, setForm] = useState<ProjectForm>(INITIAL_FORM);
  const [status, setStatus] = useState('未保存');

  const tone: StatusTone =
    status === '已归档' ? 'danger' : status === '已保存' ? 'success' : 'neutral';

  function updateField(field: keyof ProjectForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setStatus('未保存');
  }

  function handleSave() {
    setSaved(form);
    setStatus('已保存');
  }

  function handleCancel() {
    setForm(saved);
  }

  function handleArchive() {
    setStatus('已归档');
  }

  return (
    <div className="project-settings">
      <header className="docs-page-header">
        <div>
          <div className="project-settings__title">
            <Text as="h1" variant="display.lg">
              项目设置
            </Text>
            <Badge tone={tone}>{status}</Badge>
          </div>
          <Text as="p" variant="body.sm" tone="secondary">
            修改项目基本信息，保存后才会更新。本页是 page-assembly 的参考产物。
          </Text>
        </div>
      </header>

      <div className="project-settings__layout">
        <Card>
          <div className="project-settings__section">
            <Text as="h2" variant="heading.md">
              基本信息
            </Text>
            <TextField
              label="项目名称"
              description="用于列表与导出文件名。"
              value={form.name}
              onChange={(value) => updateField('name', value)}
            />
            <TextField
              label="项目标识"
              description="只能包含小写字母、数字与连字符。"
              value={form.slug}
              onChange={(value) => updateField('slug', value)}
            />
            <TextField
              label="负责人"
              description="由管理员分配，可随时修改。"
              value={form.owner}
              onChange={(value) => updateField('owner', value)}
            />
          </div>
        </Card>

        <Card>
          <div className="project-settings__section">
            <Text as="h2" variant="heading.md">
              操作
            </Text>
            <div className="project-settings__actions">
              <Button onClick={handleSave}>保存</Button>
              <Button variant="secondary" onClick={handleCancel}>
                取消
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <div className="project-settings__section">
            <div className="project-settings__head">
              <Text as="h2" variant="heading.md">
                危险操作
              </Text>
              <Badge tone="danger">不可撤销</Badge>
            </div>
            <Text as="p" variant="body.sm" tone="secondary">
              归档后项目不再出现在默认列表，仍可通过筛选找回。
            </Text>
            <div className="project-settings__actions">
              <Button variant="secondary" onClick={handleArchive}>
                归档
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
