import { useState } from 'react';
import { api } from '../api/client';
import { useI18n } from '../i18n/context';
import PageIntro from '../components/PageIntro';
import { Card, FormField, Input, Select, Button, Alert } from '../design-system/components';
import { formatAmount } from '../utils/format';

const DEFAULT_USER = 'U1';

export default function Spend() {
  const { t, locale } = useI18n();
  const [userId, setUserId] = useState(DEFAULT_USER);
  const [amount, setAmount] = useState('');
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    receiptId: string;
    amount: string;
    paymentEarn?: { amount: string; policyId: string; policyVersion: string };
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    const amt = amount.trim();
    const oid = orderId.trim();
    if (!amt || !oid) {
      setError(t('forms.enterAmountAndOrder'));
      return;
    }
    const n = Number(amt);
    if (Number.isNaN(n) || n <= 0) {
      setError(t('forms.amountPositive'));
      return;
    }
    setLoading(true);
    const { data, error: e2 } = await api.spend({
      user_id: userId,
      amount: String(Math.floor(n)),
      order_id: oid,
    });
    setLoading(false);
    if (e2) {
      setError(e2.message);
      return;
    }
    if (data) {
      setResult({
        receiptId: data.receiptId,
        amount: data.amount,
        paymentEarn: data.paymentEarn ?? undefined,
      });
      setAmount('');
      setOrderId('');
    }
  };

  return (
    <>
      <PageIntro title={t('spend.title')} lead={t('spend.lead')} />

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
              placeholder="2000"
              required
            />
          </FormField>
          <FormField label={t('forms.orderId')}>
            <Input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder={t('forms.orderIdPlaceholder')}
              required
            />
          </FormField>
          {error && <Alert variant="error">{error}</Alert>}
          {result && (
            <Alert variant="success">
              {t('spend.success', {
                receipt: result.receiptId,
                amount: formatAmount(result.amount, locale),
              })}
              {result.paymentEarn && (
                <div style={{ marginTop: '0.5rem' }}>
                  {t('spend.earnBonus', {
                    amount: formatAmount(result.paymentEarn.amount, locale),
                    policy: result.paymentEarn.policyId,
                    version: result.paymentEarn.policyVersion,
                  })}
                </div>
              )}
            </Alert>
          )}
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? t('forms.processing') : t('spend.submit')}
          </Button>
        </form>
      </Card>
    </>
  );
}
