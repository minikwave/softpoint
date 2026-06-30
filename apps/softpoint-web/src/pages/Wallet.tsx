import { useState, useEffect } from 'react';

const LS_ADDRESS = 'paypoint_wallet_demo_address';
const LS_CHAIN = 'paypoint_chain_id';

const CHAINS = [
  { id: '1', name: 'Ethereum', hint: '메인넷' },
  { id: '137', name: 'Polygon', hint: 'PoS' },
  { id: '42161', name: 'Arbitrum One', hint: 'L2' },
  { id: '8453', name: 'Base', hint: 'L2' },
  { id: '100', name: 'Gnosis Chain', hint: 'xDAI' },
] as const;

function randomDemoAddress(): string {
  const hex = Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return `0x${hex}`;
}

function shortAddr(a: string): string {
  if (a.length < 12) return a;
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export default function Wallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState('1');

  useEffect(() => {
    try {
      setAddress(localStorage.getItem(LS_ADDRESS));
      const c = localStorage.getItem(LS_CHAIN);
      if (c) setChainId(c);
    } catch {
      /* ignore */
    }
  }, []);

  const persistAddress = (v: string | null) => {
    setAddress(v);
    try {
      if (v) localStorage.setItem(LS_ADDRESS, v);
      else localStorage.removeItem(LS_ADDRESS);
    } catch {
      /* ignore */
    }
  };

  const persistChain = (id: string) => {
    setChainId(id);
    try {
      localStorage.setItem(LS_CHAIN, id);
    } catch {
      /* ignore */
    }
  };

  const connectDemo = () => persistAddress(randomDemoAddress());
  const disconnect = () => persistAddress(null);

  const chainName = CHAINS.find((c) => c.id === chainId)?.name ?? `체인 ${chainId}`;

  return (
    <>
      <h1 className="page-title">지갑 · 체인</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
        실제 지갑 서명·RPC 연동 없이, UI·증빙용으로만 주소와 선호 체인을 저장합니다.{' '}
        <span className="demo-pill" title="프로덕션에서는 WalletConnect 등으로 교체">
          표시 전용
        </span>
      </p>

      <div className="card">
        <p className="card-title">연결 상태</p>
        {address ? (
          <>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', wordBreak: 'break-all' }}>{address}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.35rem' }}>짧게: {shortAddr(address)}</p>
            <button type="button" className="btn" style={{ marginTop: '0.75rem' }} onClick={disconnect}>
              연결 해제
            </button>
          </>
        ) : (
          <>
            <p className="empty" style={{ marginBottom: '0.75rem' }}>데모 지갑이 연결되어 있지 않습니다.</p>
            <button type="button" className="btn btn-primary" onClick={connectDemo}>
              데모 지갑 연결 (랜덤 주소)
            </button>
          </>
        )}
      </div>

      <div className="card">
        <label className="card-title" htmlFor="chain-select">
          선호 체인 (네트워크 ID)
        </label>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          전환·정산 옵션과 별개로, 표시·향후 온체인 연동 시 참고할 네트워크를 고릅니다.
        </p>
        <select
          id="chain-select"
          value={chainId}
          onChange={(e) => persistChain(e.target.value)}
          style={{
            padding: '0.65rem 0.85rem',
            minWidth: '240px',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            color: 'var(--text)',
          }}
        >
          {CHAINS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.hint}) — {c.id}
            </option>
          ))}
        </select>
        <p style={{ marginTop: '0.75rem', fontSize: '0.9rem' }}>
          현재 선택: <strong>{chainName}</strong>
        </p>
      </div>
    </>
  );
}
