"use client";

import { useCallback, useEffect, useState } from "react";

type RemoteState<T> = {
  key: string | null;
  attempt: number;
  data: T | null;
  error: unknown;
};

export function useRemote<T>(key: string | null, fetcher: () => Promise<T>) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<RemoteState<T>>({ key: null, attempt: 0, data: null, error: null });

  useEffect(() => {
    if (key === null) {
      return;
    }

    let active = true;

    fetcher().then(
      (data) => {
        if (active) {
          setState({ key, attempt, data, error: null });
        }
      },
      (error: unknown) => {
        if (active) {
          setState((previous) => ({ key, attempt, data: previous.data, error }));
        }
      },
    );

    return () => {
      active = false;
    };
  }, [key, fetcher, attempt]);

  const replace = useCallback(
    (data: T) => {
      if (key !== null) {
        setState({ key, attempt, data, error: null });
      }
    },
    [key, attempt],
  );

  const reload = useCallback(() => setAttempt((current) => current + 1), []);

  const settled = key !== null && state.key === key && state.attempt === attempt;

  return {
    data: state.data,
    error: settled ? state.error : null,
    loading: !settled,
    replace,
    reload,
  };
}
