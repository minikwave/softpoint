import { useState, useEffect, useCallback } from 'react';
import { adminApi, type PolicyItem } from '../api/client';

const DEFAULT_JSON = '{\n  "percent_bps": 100,\n  "min_payment_amount": "1000",\n  "round_down": true\n}';

export default function Policies() {
  const [items, setItems] = useState<PolicyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterPolicyId, setFilterPolicyId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [draftPolicyId, setDraftPolicyId] = useState('');
  const [draftVersion, setDraftVersion] = useState('');
  const [draftJson, setDraftJson] = useState(DEFAULT_JSON);
  const [draftMsg, setDraftMsg] = useState<string | null>(null);
  const [draftErr, setDraftErr] = useState<string | null>(null);
  const [draftBusy, setDraftBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: e } = await adminApi.getPolicies({
      policy_id: filterPolicyId.trim() || undefined,
      status: filterStatus.trim() || undefined,
      limit: '100',
    });
    setLoading(false);
    if (e) {
      setError(e.message);
      setItems([]);
      return;
    }
    setItems(data?.items ?? []);
  }, [filterPolicyId, filterStatus]);

  useEffect(() => {
    load();
  }, []);

  const applyFilter = () => load();

  const createDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setDraftErr(null);
    setDraftMsg(null);
    let parsed: object;
    try {
      parsed = JSON.parse(draftJson) as object;
      if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        setDraftErr('policy_json은 객체(JSON)여야 합니다.');
        return;
      }
    } catch {
      setDraftErr('JSON 파싱 실패');
      return;
    }
    setDraftBusy(true);
    const { data, error: err } = await adminApi.createPolicyDraft({
      policy_id: draftPolicyId.trim(),
      version: draftVersion.trim(),
      policy_json: parsed,
    });
    setDraftBusy(false);
    if (err) {
      setDraftErr(err.message);
      return;
    }
    setDraftMsg(`초안 생성됨: ${data?.policy_id}@${data?.version}`);
    setDraftVersion('');
    setDraftJson(DEFAULT_JSON);
    await load();
  };

  const transition = async (
    label: string,
    fn: () => Promise<{ data?: PolicyItem; error?: { message: string } }>
  ) => {
    setError(null);
    const { error: e } = await fn();
    if (e) {
      setError(`${label}: ${e.message}`);
      return;
    }
    await load();
  };

  return (
    <>
      <h1 className="page-title">정책 (draft → submit → approve → activate)</h1>

      <div className="card">
        <p className="card-title">목록 필터</p>
        <div className="form-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
          <div>
            <label>policy_id</label>
            <input
              type="text"
              value={filterPolicyId}
              onChange={(e) => setFilterPolicyId(e.target.value)}
              placeholder="예: PAYMENT_EARN_POLICY"
            />
          </div>
          <div>
            <label>status</label>
            <input
              type="text"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              placeholder="DRAFT, SUBMITTED, …"
            />
          </div>
          <button type="button" className="btn btn-primary" onClick={applyFilter} disabled={loading}>
            조회
          </button>
        </div>
      </div>

      <div className="card">
        <p className="card-title">새 초안 (draft)</p>
        <form onSubmit={createDraft}>
          <div className="form-row">
            <label>policy_id</label>
            <input
              type="text"
              value={draftPolicyId}
              onChange={(e) => setDraftPolicyId(e.target.value)}
              required
              placeholder="PAYMENT_EARN_POLICY"
            />
          </div>
          <div className="form-row">
            <label>version</label>
            <input
              type="text"
              value={draftVersion}
              onChange={(e) => setDraftVersion(e.target.value)}
              required
              placeholder="2026.04.1"
            />
          </div>
          <div className="form-row">
            <label>policy_json</label>
            <textarea
              value={draftJson}
              onChange={(e) => setDraftJson(e.target.value)}
              rows={8}
              style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.85rem' }}
            />
          </div>
          {draftErr && <div className="msg-error">{draftErr}</div>}
          {draftMsg && <div className="msg-success">{draftMsg}</div>}
          <button type="submit" className="btn btn-primary" disabled={draftBusy}>
            {draftBusy ? '생성 중…' : '초안 생성'}
          </button>
        </form>
      </div>

      {error && <div className="msg-error">{error}</div>}

      <div className="card">
        <p className="card-title">정책 버전 목록</p>
        {loading && <p className="loading">불러오는 중…</p>}
        {!loading && items.length === 0 && <p className="empty">정책이 없습니다. 위에서 초안을 만드세요.</p>}
        {!loading && items.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>policy_id</th>
                  <th>version</th>
                  <th>status</th>
                  <th>effective_from</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={`${p.policy_id}:${p.version}`}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{p.policy_id}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{p.version}</td>
                    <td>
                      <span className="badge">{p.status}</span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{p.effective_from ?? '—'}</td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {p.status === 'DRAFT' && (
                          <button
                            type="button"
                            className="btn btn-sm"
                            onClick={() =>
                              transition('submit', () =>
                                adminApi.submitPolicy({ policy_id: p.policy_id, version: p.version })
                              )
                            }
                          >
                            제출
                          </button>
                        )}
                        {p.status === 'SUBMITTED' && (
                          <button
                            type="button"
                            className="btn btn-sm"
                            onClick={() =>
                              transition('approve', () =>
                                adminApi.approvePolicy({ policy_id: p.policy_id, version: p.version })
                              )
                            }
                          >
                            승인
                          </button>
                        )}
                        {p.status === 'APPROVED' && (
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            onClick={() =>
                              transition('activate', () =>
                                adminApi.activatePolicy({ policy_id: p.policy_id, version: p.version })
                              )
                            }
                          >
                            활성화
                          </button>
                        )}
                        {(p.status === 'ACTIVE' || p.status === 'SUPERSEDED') && (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
