import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useI18n } from '../i18n/context';
import PageIntro from '../components/PageIntro';
import { Card, CardLabel, Input, Select, Button, Alert, EmptyState } from '../design-system/components';
import { formatAmount, formatDate } from '../utils/format';

const DEFAULT_STORE_ID = 'STORE_01';

function statusBadge(status: string): string {
  const s = status.toLowerCase();
  if (s === 'requested') return 'badge-spend';
  if (s === 'authorized' || s === 'executing') return 'badge-issue';
  if (s === 'settled') return 'badge-issue';
  if (s === 'failed') return 'badge-adjust';
  return '';
}

export default function Store() {
  const { t, locale } = useI18n();
  const [storeId, setStoreId] = useState(DEFAULT_STORE_ID);
  const [amount, setAmount] = useState('');
  const [toAsset, setToAsset] = useState('USDC');
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<Array<{ id: string; type: string; fromAmount: string; toAsset: string; status: string; createdAt: string; txHash?: string; settlementRef?: string }>>([]);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchList = async () => {
    setListLoading(true);
    const { data } = await api.getConversions(storeId);
    setListLoading(false);
    if (data?.items) setList(data.items);
  };

  useEffect(() => {
    fetchList();
  }, [storeId]);

  const handleRequestSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
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
      user_id: storeId,
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
      setSuccess(t('store.requestSuccess'));
      setAmount('');
      fetchList();
    }
  };

  return (
    <>
      <PageIntro title={t('store.title')} lead={t('store.lead')} />

      <Card elevated className="settlement-flow-card">
        <CardLabel>{t('store.flowTitle')}</CardLabel>
        <ol className="settlement-steps">
          <li><strong>REQUESTED</strong> — {t('store.step1')}</li>
          <li><strong>AUTHORIZED</strong> — {t('store.step2')}</li>
          <li><strong>EXECUTING</strong> — {t('store.step3')}</li>
          <li><strong>SETTLED</strong> — {t('store.step4')}</li>
          <li><strong>FAILED</strong> — {t('store.step5')}</li>
        </ol>
        <p className="sp-field-hint" style={{ marginTop: '0.75rem' }}>{t('store.flowHint')}</p>
      </Card>

      <Card>
        <CardLabel>{t('forms.merchantId')}</CardLabel>
        <Input
          type="text"
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
          placeholder="STORE_01"
          style={{ maxWidth: '200px' }}
        />
      </Card>

      <Card>
        <CardLabel>{t('store.requestTitle')}</CardLabel>
        <form onSubmit={handleRequestSettlement}>
          <FormField label={t('forms.amountSp')}>
            <Input
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="10000"
            />
          </FormField>
          <FormField label={t('forms.settlementAsset')}>
            <Select value={toAsset} onChange={(e) => setToAsset(e.target.value)}>
              <option value="USDC">USDC</option>
              <option value="USDT">USDT</option>
            </Select>
          </FormField>
          {error && <Alert variant="error">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? t('forms.requesting') : t('conversion.submit')}
          </Button>
        </form>
      </Card>

      <Card>
        <CardLabel>{t('store.listTitle')}</CardLabel>
        {!listLoading && list.length > 0 && (
          <div className="settlement-summary">
            <span>{t('store.summaryTotal', { n: list.length })}</span>
            <span>{t('store.summarySettled', { n: list.filter((c) => c.status === 'SETTLED').length })}</span>
            <span>{t('store.summaryPending', { n: list.filter((c) => ['REQUESTED', 'AUTHORIZED', 'EXECUTING'].includes(c.status)).length })}</span>
          </div>
        )}
        {listLoading && <p className="loading">{t('forms.querying')}</p>}
        {!listLoading && list.length === 0 && <EmptyState>{t('store.empty')}</EmptyState>}
        {!listLoading && list.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('store.colType')}</th>
                  <th>{t('store.colAmount')}</th>
                  <th>{t('store.colAsset')}</th>
                  <th>{t('store.colStatus')}</th>
                  <th>{t('store.colDeposit')}</th>
                  <th>{t('store.colDate')}</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id}>
                    <td>{c.type}</td>
                    <td>{formatAmount(c.fromAmount, locale)} {t('brand.points')}</td>
                    <td>{c.toAsset}</td>
                    <td><span className={`badge ${statusBadge(c.status)}`}>{c.status}</span></td>
                    <td>
                      {c.status === 'SETTLED' && (c.txHash || c.settlementRef) ? (
                        <span className="settled-info">
                          {c.txHash && <>tx: {c.txHash.slice(0, 10)}…</>}
                          {c.settlementRef && <> · ref: {c.settlementRef}</>}
                        </span>
                      ) : c.status === 'SETTLED' ? (
                        t('store.depositDone')
                      ) : (
                        t('forms.noData')
                      )}
                    </td>
                    <td>{formatDate(c.createdAt, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
