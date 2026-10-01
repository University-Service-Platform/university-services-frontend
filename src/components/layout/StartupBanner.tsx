import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { checkServices, wakeServices } from '@/services/wakeService';

const POLL_MS = 5000;
// Give up on the notice after this long: a service that is still down is broken, not asleep
const MAX_WAIT_MS = 3 * 60 * 1000;

/**
 * Wakes the sleeping services when the app loads and, while any of them is still starting,
 * tells the visitor why the first pages may be slow.
 */
export const StartupBanner: React.FC = () => {
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const startedAt = Date.now();

    const poll = async () => {
      const status = await checkServices();
      if (cancelled) return;
      if (status.ready || Date.now() - startedAt > MAX_WAIT_MS) {
        setStarting(false);
        return;
      }
      setStarting(true);
      timer = setTimeout(poll, POLL_MS);
    };

    void wakeServices();
    void poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!starting) return null;
  return (
    <div className="startup-banner" role="status">
      <Loader2 size={16} className="startup-banner-icon" aria-hidden="true" />
      <span>
        Some services are starting up after being idle. This can take up to a minute; pages will load once
        they're ready.
      </span>
    </div>
  );
};
