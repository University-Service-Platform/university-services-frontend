/**
 * Waking the platform's free-tier services.
 *
 * Free Render services sleep after ~15 idle minutes, and requests the gateway forwards don't wake
 * them; a request from the visitor's browser does. So on load the app calls every service's public
 * health address (listed by the gateway), and shows a notice until the gateway reports them ready.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

/** The gateway's address: the API base without its /api/v1 path. */
export function gatewayOrigin(apiBase: string = API_BASE): string {
  try {
    const base = new URL(apiBase, typeof window === 'undefined' ? 'http://localhost' : window.location.origin);
    return base.origin;
  } catch {
    return '';
  }
}

interface WakeTargets {
  targets?: Array<{ service: string; url: string }>;
}

/** Calls every service's health address from the browser. Never throws; the answers don't matter. */
export async function wakeServices(origin: string = gatewayOrigin()): Promise<number> {
  let urls: string[];
  try {
    const response = await fetch(`${origin}/gateway/wake-targets`, { cache: 'no-store' });
    const body = (await response.json()) as WakeTargets;
    urls = (body.targets || []).map((target) => target.url).filter((url) => url.startsWith('https://'));
  } catch {
    return 0;
  }
  // no-cors: the services don't list this site as an allowed origin, and only the request matters
  await Promise.allSettled(urls.map((url) => fetch(url, { mode: 'no-cors', cache: 'no-store' })));
  return urls.length;
}

export interface ServicesStatus {
  ready: boolean;
  starting: string[];
}

/** Asks the gateway which services are up. */
export async function checkServices(origin: string = gatewayOrigin()): Promise<ServicesStatus> {
  try {
    const response = await fetch(`${origin}/health/services`, { cache: 'no-store' });
    const body = (await response.json()) as { services?: Record<string, { status?: string }> };
    const starting = Object.entries(body.services || {})
      .filter(([, result]) => result.status === 'down')
      .map(([service]) => service);
    return { ready: starting.length === 0, starting };
  } catch {
    // The gateway itself is waking up
    return { ready: false, starting: ['gateway'] };
  }
}
