import { useState, useCallback } from 'react';
import { adminApi, type AuditLogItem } from '../api/client';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ko-KR');
  } catch {
    return iso;
  }
}

function previewJson(v: unknown, max = 120): string {
  if (v == null) return '—';
  try {
    const s = JSON.stringify(v);
    return s.length <= max ? s : `${s.slice(0, max)}…`;
  } catch {
    return String(v);
  }
}

export default function AuditLogs() {
  const [actorId, setActorId] = useState('');
  const [action, setAction] = useState('');
  const [targetType, setTargetType] = useState('');
  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (cursor: string | undefined, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);
      const { data, error: e } = await adminApi.getAuditLogs({
        actor_id: actorId.trim() || undefined,
        action: action.trim() || undefined,
        target_type: targetType.trim() || undefined,
        limit: '40',
        cursor,
      });
      if (append) setLoadingMore(false);
      else setLoading(false);
      if (e) {
        setError(e.message);
        if (!append) {
          setItems([]);
          setNextCursor(null);
        }
        return;
      }
      const batch = data?.items ?? [];
      const next = data?.next_cursor ?? null;
      if (append) {
        setItems((prev) => [...prev, ...batch]);
      } else {
        setItems(batch);
      }
      setNextCursor(next);
    },
    [actorId, action, targetType]
  );

  const refresh = () => fetchPage(undefined, false);

  return (
    <>
      <h1 className="page-title">감사 로그</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
        운영자 수동 적립·전환 승인/정산/실패 등이 기록됩니다. (CREDITS_ISSUE, CONVERSION_*)
      </p>

      <div className="card">
        <div className="form-row">
          <label>액션 (부분 일치)</label>
          <input
            type="text"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder="예: CONVERSION_APPROVE"
          />
        </div>
        <div className="form-row">
          <label>actor_id (부분 일치)</label>
          <input
            type="text"
            value={actorId}
            onChange={(e) => setActorId(e.target.value)}
            placeholder="예: system"
          />
        </div>
        <div className="form-row">
          <label>target_type (부분 일치)</label>
          <input
            type="text"
            value={targetType}
            onChange={(e) => setTargetType(e.target.value)}
            placeholder="예: conversion"
          />
        </div>
        <button type="button" className="btn btn-primary" onClick={refresh} disabled={loading}>
          {loading ? '조회 중…' : '조회'}
        </button>
      </div>

      {error && <div className="msg-error">{error}</div>}

      <div className="card">
        {!loading && items.length === 0 && !error && (
          <p className="empty">필터를 설정하고 조회하세요.</p>
        )}
        {items.length > 0 && (
          <>
            <div className="table-wrap">
              <table className="table audit-table">
                <thead>
                  <tr>
                    <th>일시</th>
                    <th>액션</th>
                    <th>actor</th>
                    <th>대상</th>
                    <th>after</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => (
                    <tr key={row.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDate(row.created_at)}</td>
                      <td>{row.action}</td>
                      <td>
                        <span style={{ fontSize: '0.8rem' }}>{row.actor_id}</span>
                        <br />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {row.actor_role}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem' }}>{row.target_type}</span>
                        <br />
                        <span className="mono-small">{row.target_id.slice(0, 12)}…</span>
                      </td>
                      <td className="mono-small" title={previewJson(row.after, 2000)}>
                        {previewJson(row.after)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {nextCursor && (
              <button
                type="button"
                className="btn"
                style={{ marginTop: '1rem', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                disabled={loadingMore}
                onClick={() => fetchPage(nextCursor, true)}
              >
                {loadingMore ? '불러오는 중…' : '더 보기'}
              </button>
            )}
          </>
        )}
      </div>
    </>
  );
}
