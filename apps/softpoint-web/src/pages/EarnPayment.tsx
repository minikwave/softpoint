import { useState } from 'react';
import { api } from '../api/client';
import { useI18n } from '../i18n/context';
import PageIntro from '../components/PageIntro';
import UserIdField from '../components/UserIdField';
import { Card, FormField, Input, Button, Alert } from '../design-system/components';
import { useUserId } from '../hooks/useUserId';
import { formatAmount } from '../utils/format';

export default function EarnPayment() {
  const { t, locale } = useI18n();
  const { userId, setUserId } = useUserId();
  const [paymentAmount, setPaymentAmount] = useState('');
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ skipped?: boolean; reason?: string; amount?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    const amt = paymentAmount.trim();
    const oid = orderId.trim();
    if (!amt || !oid) {
      setError(t('forms.enterAmountAndOrder'));
      return;
    }
    setLoading(true);
    const { data, error: e2 } = await api.earnFromPayment({
      user_id: userId,
      payment_amount: amt,
      order_id: oid,
    });
    setLoading(false);
    if (e2) {
      setError(e2.message);
      return;
    }
    if (data?.skipped) {
      setResult({ skipped: true, reason: data.reason });
      return;
    }
    if (data?.paymentEarn) {
      setResult({ amount: data.paymentEarn.amount });
      setPaymentAmount('');
      setOrderId('');
    }
  };

  return (
    <>
      <PageIntro title={t('earnPayment.title')} lead={t('earnPayment.lead')} />

      <Card>
        <form onSubmit={handleSubmit}>
          <UserIdField value={userId} onChange={setUserId} />
          <FormField label={t('earnPayment.paymentAmount')}>
            <Input
              type="text"
              inputMode="numeric"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="50000"
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
          {result?.skipped && (
            <Alert variant="info">{t('earnPayment.skipped', { reason: result.reason ?? '' })}</Alert>
          )}
          {result?.amount && (
            <Alert variant="success">
              {t('earnPayment.success', { amount: formatAmount(result.amount, locale) })}
            </Alert>
          )}
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? t('forms.processing') : t('earnPayment.submit')}
          </Button>
        </form>
      </Card>
    </>
  );
}
