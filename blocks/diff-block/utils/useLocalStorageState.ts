import { SetStateAction, Dispatch, useState, useEffect } from 'react';

export function useLocalStorageState<T>(keyId: string, defaultValue: T): [T, Dispatch<SetStateAction<T>>] {
  const key = `diff-block-state-${keyId}`;

  const [state, setState] = useState<T>(() => {
    const valueInLocalStorage = localStorage.getItem(key);
    if (valueInLocalStorage) {
      return JSON.parse(valueInLocalStorage) as T;
    }
    return typeof defaultValue === 'function' ? (defaultValue as Function)() : defaultValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
}
