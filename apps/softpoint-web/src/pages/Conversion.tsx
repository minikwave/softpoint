import { useState } from 'react';
import { api } from '../api/client';
import { useI18n } from '../i18n/context';
import PageIntro from '../components/PageIntro';
import { Card, FormField, Input, Select, Button, Alert } from '../design-system/components';

const DEFAULT_USER = 'U1';

export default function Conversion() {
  const { t } = useI18n();
  const [userId, setUserId] = useState(DEFAULT_USER);
  const [amount, setAmount] = useState('');
  const [toAsset, setToAsset] = useState('USDC');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ id: string; status: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    const amt = amount.trim();
    if (!amt) {
      setError(t('forms.enterAmount'));
      return;
    }
    const n = Number(amt);
    if (Number.isNaN(n) || n <= 0) {
      setError(t('forms.amountPositive'));
      return;
    }
    setLoading(true);
    const { data, error: e2 } = await api.requestConversion({
      user_id: userId,
      type: 'MERCHANT_SETTLEMENT',
      from_amount: String(Math.floor(n)),
      to_asset: toAsset,
    });
    setLoading(false);
    if (e2) {
      setError(e2.message);
      return;
    }
    if (data) {
      setResult({ id: data.id, status: data.status });
      setAmount('');
    }
  };

  return (
    <>
      <PageIntro title={t('conversion.title')} lead={t('conversion.lead')} />

      <Card>
        <form onSubmit={handleSubmit}>
          <FormField label={t('forms.userId')}>
            <Input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder={t('forms.userIdPlaceholder')}
              required
            />
          </FormField>
          <FormField label={t('forms.amountSp')}>
            <Input
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="10000"
              required
            />
          </FormField>
          <FormField label={t('forms.settlementAsset')}>
            <Select value={toAsset} onChange={(e) => setToAsset(e.target.value)}>
              <option value="USDC">USDC</option>
              <option value="USDT">USDT</option>
            </Select>
          </FormField>
          {error && <Alert variant="error">{error}</Alert>}
          {result && (
            <Alert variant="success">
              {t('conversion.success', { id: result.id.slice(0, 8), status: result.status })}
            </Alert>
          )}
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? t('forms.requesting') : t('conversion.submit')}
          </Button>
        </form>
      </Card>
    </>
  );
}
