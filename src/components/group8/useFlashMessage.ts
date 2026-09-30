import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Reads a one-time `flash` message passed via navigation state, then clears it from the
 * history entry so Back/Forward or a re-render does not show the same message again.
 */
export function useFlashMessage(): string | null {
  const location = useLocation();
  const navigate = useNavigate();
  const [flash] = useState<string | null>(() => (location.state as { flash?: string } | null)?.flash ?? null);

  useEffect(() => {
    if ((location.state as { flash?: string } | null)?.flash) {
      navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
    }
  }, [location, navigate]);

  return flash;
}
