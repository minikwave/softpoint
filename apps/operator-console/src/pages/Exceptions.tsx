import { useState, useEffect, useCallback } from 'react';
import { adminApi, type ExceptionItem } from '../api/client';

export default function Exceptions() {
  const [items, setItems] = useState<ExceptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('OPEN');
  const [filterUser, setFilterUser] = useState('');

  const [refType, setRefType] = useState('transaction');
  const [refId, setRefId] = useState('');
  const [title, setTitle] = useState('');
  const [userId, setUserId] = useState('');
  const [detailJson, setDetailJson] = useState('');
  const [formErr, setFormErr] = useState<string | null>(null);
  const [formOk, setFormOk] = useState<string | null>(null);
  const [formBusy, setFormBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: e } = await adminApi.getExceptions({
      status: filterStatus.trim() || undefined,
      user_id: filterUser.trim() || undefined,
      limit: '100',
    });
    setLoading(false);
    if (e) {
      setError(e.message);
      setItems([]);
      return;
    }
    setItems(data?.items ?? []);
  }, [filterStatus, filterUser]);

  useEffect(() => {
    load();
  }, []);

  const applyFilter = () => load();

  const enqueue = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErr(null);
    setFormOk(null);
    let detail: object | undefined;
    if (detailJson.trim()) {
      try {
        const p = JSON.parse(detailJson) as unknown;
        if (p === null || typeof p !== 'object' || Array.isArray(p)) {
          setFormErr('detail은 JSON 객체여야 합니다.');
          return;
        }
        detail = p as object;
      } catch {
        setFormErr('detail JSON 파싱 실패');
        return;
      }
    }
    setFormBusy(true);
    const { data, error: err } = await adminApi.enqueueException({
      reference_type: refType.trim(),
      reference_id: refId.trim(),
      title: title.trim(),
      user_id: userId.trim() || undefined,
      detail,
    });
    setFormBusy(false);
    if (err) {
      setFormErr(err.message);
      return;
    }
    setFormOk(`등록됨: ${data?.id}`);
    setRefId('');
    setTitle('');
    setDetailJson('');
    await load();
  };

  const resolve = async (id: string, disposition: 'RESOLVED' | 'DISMISSED') => {
    setError(null);
    const note = window.prompt(disposition === 'RESOLVED' ? '처리 메모 (선택)' : '기각 사유 (선택)') ?? '';
    const { error: e } = await adminApi.resolveException(id, {
      disposition,
      resolution_note: note.trim() || undefined,
    });
    if (e) {
      setError(e.message);
      return;
    }
    await load();
  };

  return (
    <>
      <h1 className="page-title">예외 큐</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
        HOLD·수동 검토 항목을 등록하고, 처리 후 RESOLVED / DISMISSED로 닫습니다.
      </p>

      <div className="card">
        <p className="card-title">필터</p>
        <div className="form-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
          <div>
            <label>status</label>
            <input
              type="text"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              placeholder="OPEN (비우면 전체)"
            />
          </div>
          <div>
            <label>user_id</label>
            <input
              type="text"
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              placeholder="선택"
            />
          </div>
          <button type="button" className="btn btn-primary" onClick={applyFilter} disabled={loading}>
            조회
          </button>
        </div>
      </div>

      <div className="card">
        <p className="card-title">큐에 등록</p>
        <form onSubmit={enqueue}>
          <div className="form-row">
            <label>reference_type</label>
            <input type="text" value={refType} onChange={(e) => setRefType(e.target.value)} required />
          </div>
          <div className="form-row">
            <label>reference_id</label>
            <input type="text" value={refId} onChange={(e) => setRefId(e.target.value)} required placeholder="tx UUID 등" />
          </div>
          <div className="form-row">
            <label>title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="form-row">
            <label>user_id (선택)</label>
            <input type="text" value={userId} onChange={(e) => setUserId(e.target.value)} />
          </div>
          <div className="form-row">
            <label>detail JSON (선택)</label>
            <textarea
              value={detailJson}
              onChange={(e) => setDetailJson(e.target.value)}
              rows={4}
              style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.85rem' }}
              placeholder='{"hold_reason":"..."}'
            />
          </div>
          {formErr && <div className="msg-error">{formErr}</div>}
          {formOk && <div className="msg-success">{formOk}</div>}
          <button type="submit" className="btn btn-primary" disabled={formBusy}>
            {formBusy ? '등록 중…' : '등록'}
          </button>
        </form>
      </div>

      {error && <div className="msg-error">{error}</div>}

      <div className="card">
        <p className="card-title">목록</p>
        {loading && <p className="loading">불러오는 중…</p>}
        {!loading && items.length === 0 && <p className="empty">항목이 없습니다.</p>}
        {!loading && items.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>상태</th>
                  <th>제목</th>
                  <th>참조</th>
                  <th>user</th>
                  <th>생성</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((x) => (
                  <tr key={x.id}>
                    <td>
                      <span className="badge">{x.status}</span>
                    </td>
                    <td>{x.title}</td>
                    <td className="mono-small">
                      {x.reference_type}:{x.reference_id}
                    </td>
                    <td>{x.user_id ?? '—'}</td>
                    <td style={{ fontSize: '0.8rem' }}>{new Date(x.created_at).toLocaleString('ko-KR')}</td>
                    <td>
                      {x.status === 'OPEN' ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          <button type="button" className="btn btn-sm btn-primary" onClick={() => resolve(x.id, 'RESOLVED')}>
                            처리
                          </button>
                          <button type="button" className="btn btn-sm" onClick={() => resolve(x.id, 'DISMISSED')}>
                            기각
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                      )}
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
