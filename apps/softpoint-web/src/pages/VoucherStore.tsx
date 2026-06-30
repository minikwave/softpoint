import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, type CreditProductItem } from '../api/client';
import { useI18n } from '../i18n/context';
import PageIntro from '../components/PageIntro';
import { Card, FormField, Input, Select, Button, Alert, EmptyState } from '../design-system/components';
import { formatAmount } from '../utils/format';

const DEFAULT_USER = 'U1';

export default function VoucherStore() {
  const { t, locale } = useI18n();
  const [userId, setUserId] = useState(DEFAULT_USER);
  const [products, setProducts] = useState<CreditProductItem[]>([]);
  const [category, setCategory] = useState('');
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const fetchBalance = () => {
    api.getBalance(userId).then(({ data }) => {
      if (data) setBalance(data.available);
    });
  };

  useEffect(() => {
    fetchBalance();
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.getCreditProducts(category || undefined).then(({ data, error }) => {
      if (cancelled) return;
      setLoading(false);
      if (error) {
        setProducts([]);
        return;
      }
      setProducts(data?.items ?? []);
    });
    return () => { cancelled = true; };
  }, [category]);

  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))] as string[];

  const handleRedeem = async (product: CreditProductItem) => {
    setMessage(null);
    setPurchasingId(product.id);
    const key = `redeem:${userId}:${product.id}:${Date.now()}`;
    const { data, error } = await api.redeemProduct({
      user_id: userId,
      product_id: product.id,
      idempotency_key: key,
    });
    setPurchasingId(null);
    if (error) {
      setMessage({ type: 'err', text: error.message });
      return;
    }
    if (data) {
      setMessage({
        type: 'ok',
        text: t('vouchers.redeemSuccess', {
          code: data.codeDisplay ?? t('vouchers.issued'),
          receipt: data.receiptId.slice(0, 8),
        }),
      });
      fetchBalance();
    }
  };

  return (
    <>
      <PageIntro
        title={t('vouchers.title')}
        lead={
          <>
            {t('vouchers.lead')}{' '}
            <Link to="/app/my-credits">{t('vouchers.myRedemptions')}</Link>
          </>
        }
      />

      <Card>
        <FormField label={t('forms.userId')}>
          <Input type="text" value={userId} onChange={(e) => setUserId(e.target.value)} />
        </FormField>
        {balance != null && (
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            {t('forms.available')}: <strong>{formatAmount(balance, locale)} {t('brand.points')}</strong>
          </p>
        )}
        <FormField label={t('forms.category')}>
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">{t('forms.categoryAll')}</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </FormField>
      </Card>

      {message && (
        <Alert variant={message.type === 'ok' ? 'success' : 'error'}>{message.text}</Alert>
      )}

      {loading && <p className="loading">{t('vouchers.loadingProducts')}</p>}

      {!loading && (
        <div className="voucher-grid">
          {products.map((p) => (
            <Card key={p.id} className="voucher-card">
              <div className="voucher-name">{p.name}</div>
              <div className="voucher-desc">{p.description ?? p.product_type}</div>
              <div className="voucher-price">{formatAmount(p.price_paypoint, locale)} {t('brand.points')}</div>
              <div className="place-meta" style={{ marginBottom: '0.5rem' }}>
                {p.category ?? p.product_type}
              </div>
              <Button
                variant="primary"
                disabled={purchasingId === p.id}
                onClick={() => handleRedeem(p)}
              >
                {purchasingId === p.id ? t('forms.redeeming') : t('vouchers.redeem')}
              </Button>
            </Card>
          ))}
        </div>
      )}

      {!loading && products.length === 0 && (
        <EmptyState>{t('vouchers.empty')}</EmptyState>
      )}
    </>
  );
}
