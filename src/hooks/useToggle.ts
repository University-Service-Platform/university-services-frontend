import { useState, useCallback } from 'react';

/**
 * Basic reusable toggle state hook
 */
export function useToggle(initialState = false): [boolean, () => void, (value: boolean) => void] {
  const [state, setState] = useState<boolean>(initialState);
  
  const toggle = useCallback(() => {
    setState((prev) => !prev);
  }, []);

  return [state, toggle, setState];
}
