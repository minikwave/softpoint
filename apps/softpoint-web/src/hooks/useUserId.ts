import { useCallback, useState } from 'react';

const STORAGE_KEY = 'softpoint_user_id';
const DEFAULT = 'U1';

function readInitial(): string {
  if (typeof window === 'undefined') return DEFAULT;
  return localStorage.getItem(STORAGE_KEY)?.trim() || DEFAULT;
}

/** Persist demo / integrated user id across D-App pages */
export function useUserId(defaultId = DEFAULT) {
  const [userId, setUserIdState] = useState(() => readInitial() || defaultId);

  const setUserId = useCallback((id: string) => {
    const trimmed = id.trim() || defaultId;
    setUserIdState(trimmed);
    localStorage.setItem(STORAGE_KEY, trimmed);
  }, [defaultId]);

  return { userId, setUserId };
}
