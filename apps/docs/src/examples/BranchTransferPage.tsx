import { useState } from 'react';
import { Badge } from '@ahomeyonglin/ui/Badge';
import { Button } from '@ahomeyonglin/ui/Button';
import { Card } from '@ahomeyonglin/ui/Card';
import { Text } from '@ahomeyonglin/ui/Text';
import { TextField } from '@ahomeyonglin/ui/TextField';
import './branch-transfer.css';

interface TransferForm {
  fromAccount: string;
  toAccount: string;
  amount: string;
}

const INITIAL_FORM: TransferForm = {
  fromAccount: '',
  toAccount: '',
  amount: '',
};

type Step = 1 | 2 | 3;
type VerifyMethod = 'sms' | 'phone' | 'signature';

const METHOD_LABEL: Record<VerifyMethod, string> = {
  sms: '短信验证码',
  phone: '手机验证',
  signature: '客户签名',
};

const STEP_BADGE: Record<Step, { tone: 'neutral' | 'warning' | 'success'; label: string }> = {
  1: { tone: 'neutral', label: '录入中' },
  2: { tone: 'warning', label: '待客户验证' },
  3: { tone: 'success', label: '已完成' },
};

function formatAmount(value: string): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return '—';
  }
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(amount);
}

function validate(form: TransferForm): Partial<Record<keyof TransferForm, string>> {
  const errors: Partial<Record<keyof TransferForm, string>> = {};
  if (!form.fromAccount.trim()) {
    errors.fromAccount = '请输入转出账户。';
  }
  if (!form.toAccount.trim()) {
    errors.toAccount = '请输入转入账户。';
  } else if (form.toAccount.trim() === form.fromAccount.trim()) {
    errors.toAccount = '转入账户不能与转出账户相同。';
  }
  if (!(Number(form.amount) > 0)) {
    errors.amount = '请输入大于 0 的金额。';
  }
  return errors;
}

export default function BranchTransferPage() {
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<TransferForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof TransferForm, string>>>({});
  const [method, setMethod] = useState<VerifyMethod>('sms');
  const [code, setCode] = useState('');
  const [signature, setSignature] = useState('');
  const [codeError, setCodeError] = useState('');
  const [signatureError, setSignatureError] = useState('');
  const [reference, setReference] = useState('');
  const [completedAt, setCompletedAt] = useState('');

  const badge = STEP_BADGE[step];

  function updateField(field: keyof TransferForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleNext() {
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      setStep(2);
    }
  }

  function handleVerify() {
    if (method === 'signature') {
      if (!signature.trim()) {
        setSignatureError('请录入客户签名编号。');
        return;
      }
    } else if (!/^\d{6}$/.test(code)) {
      setCodeError('请输入 6 位验证码。');
      return;
    }
    setReference(`BR-${Date.now().toString().slice(-8)}`);
    setCompletedAt(
      new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(
        new Date(),
      ),
    );
    setStep(3);
  }

  function handleReset() {
    setForm(INITIAL_FORM);
    setErrors({});
    setMethod('sms');
    setCode('');
    setSignature('');
    setCodeError('');
    setSignatureError('');
    setReference('');
    setCompletedAt('');
    setStep(1);
  }

  function summaryRow(label: string, value: string) {
    return (
      <div className="branch-transfer__row" key={label}>
        <Text as="span" variant="label.md" tone="secondary">
          {label}
        </Text>
        <Text as="span" variant="body.md">
          {value}
        </Text>
      </div>
    );
  }

  return (
    <div className="branch-transfer">
      <header className="docs-page-header">
        <div>
          <div className="branch-transfer__title">
            <Text as="h1" variant="display.lg">
              分行转账
            </Text>
            <Badge tone={badge.tone}>{badge.label}</Badge>
          </div>
          <Text as="p" variant="body.sm" tone="secondary">
            柜员代客办理行内转账：录入、复核与客户验证、完成。本页为本地演示，不连接后端。
          </Text>
        </div>
      </header>

      <div className="branch-transfer__steps">
        <Text as="span" variant="label.md" tone="secondary">
          第 {step} 步 / 共 3 步
        </Text>
      </div>

      {step === 1 ? (
        <Card>
          <div className="branch-transfer__section">
            <Text as="h2" variant="heading.md">
              录入转账信息
            </Text>
            <TextField
              label="转出账户"
              description="核对客户身份证件后输入。"
              placeholder="例如 6222 0000 0000 1234"
              value={form.fromAccount}
              onChange={(value) => updateField('fromAccount', value)}
              error={errors.fromAccount}
              required
            />
            <TextField
              label="转入账户"
              description="行内账户，需与客户确认户名。"
              placeholder="例如 6222 0000 0000 5678"
              value={form.toAccount}
              onChange={(value) => updateField('toAccount', value)}
              error={errors.toAccount}
              required
            />
            <TextField
              label="转账金额"
              description="以人民币计，最多两位小数。"
              placeholder="0.00"
              type="number"
              value={form.amount}
              onChange={(value) => updateField('amount', value)}
              error={errors.amount}
              required
            />
            <div className="branch-transfer__actions">
              <Button onClick={handleNext}>下一步：复核</Button>
              <Button variant="secondary" onClick={handleReset}>
                取消
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      {step === 2 ? (
        <>
          <Card>
            <div className="branch-transfer__section">
              <Text as="h2" variant="heading.md">
                复核转账信息
              </Text>
              <div className="branch-transfer__summary">
                {summaryRow('转出账户', form.fromAccount)}
                {summaryRow('转入账户', form.toAccount)}
                {summaryRow('转账金额', formatAmount(form.amount))}
              </div>
              <Text as="p" variant="body.sm" tone="secondary">
                请向客户逐项朗读以上信息，确认无误后再进行验证。
              </Text>
            </div>
          </Card>

          <Card>
            <div className="branch-transfer__section">
              <Text as="h2" variant="heading.md">
                客户验证
              </Text>
              <Text as="p" variant="body.sm" tone="secondary">
                三种方式任选其一：已选方式为「{METHOD_LABEL[method]}」。
              </Text>
              <div className="branch-transfer__methods">
                <Button
                  variant={method === 'sms' ? 'primary' : 'secondary'}
                  onClick={() => setMethod('sms')}
                >
                  短信验证码
                </Button>
                <Button
                  variant={method === 'phone' ? 'primary' : 'secondary'}
                  onClick={() => setMethod('phone')}
                >
                  手机验证
                </Button>
                <Button
                  variant={method === 'signature' ? 'primary' : 'secondary'}
                  onClick={() => setMethod('signature')}
                >
                  客户签名
                </Button>
              </div>

              {method === 'sms' ? (
                <TextField
                  label="短信验证码"
                  description="系统已向客户预留手机号发送 6 位验证码。"
                  placeholder="6 位数字"
                  value={code}
                  onChange={(value) => {
                    setCode(value);
                    setCodeError('');
                  }}
                  error={codeError}
                  required
                />
              ) : null}

              {method === 'phone' ? (
                <TextField
                  label="通话验证码"
                  description="柜员回拨客户预留手机号，口头确认后录入通话中收到的验证码。"
                  placeholder="6 位数字"
                  value={code}
                  onChange={(value) => {
                    setCode(value);
                    setCodeError('');
                  }}
                  error={codeError}
                  required
                />
              ) : null}

              {method === 'signature' ? (
                <TextField
                  label="客户签名编号"
                  description="客户在纸质回单签名后，由柜员录入签名编号。"
                  placeholder="例如 SIG-20261122-001"
                  value={signature}
                  onChange={(value) => {
                    setSignature(value);
                    setSignatureError('');
                  }}
                  error={signatureError}
                  required
                />
              ) : null}

              <div className="branch-transfer__actions">
                <Button onClick={handleVerify}>确认并完成</Button>
                <Button variant="secondary" onClick={() => setStep(1)}>
                  返回修改
                </Button>
              </div>
            </div>
          </Card>
        </>
      ) : null}

      {step === 3 ? (
        <Card>
          <div className="branch-transfer__section">
            <div className="branch-transfer__title">
              <Text as="h2" variant="heading.md">
                转账已提交
              </Text>
              <Badge tone="success">已完成</Badge>
            </div>
            <Text as="p" variant="body.sm" tone="secondary">
              请向客户提供回单编号，并提示保留至到账确认。
            </Text>
            <div className="branch-transfer__summary">
              {summaryRow('回单编号', reference)}
              {summaryRow('转出账户', form.fromAccount)}
              {summaryRow('转入账户', form.toAccount)}
              {summaryRow('转账金额', formatAmount(form.amount))}
              {summaryRow('验证方式', METHOD_LABEL[method])}
              {summaryRow('完成时间', completedAt)}
            </div>
            <div className="branch-transfer__actions">
              <Button onClick={handleReset}>新建转账</Button>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
