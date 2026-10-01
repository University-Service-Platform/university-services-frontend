import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkServices, gatewayOrigin, wakeServices } from '../wakeService';
import { jsonResponse, mockFetch } from './testUtils';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('wakeService', () => {
  it('finds the gateway from the API base URL', () => {
    expect(gatewayOrigin('https://university-api-gateway.onrender.com/api/v1')).toBe(
      'https://university-api-gateway.onrender.com',
    );
  });

  it('calls every listed health address from the browser', async () => {
    const fetchMock = mockFetch(
      jsonResponse(200, { targets: [
        { service: 'identity', url: 'https://identity.onrender.com/health' },
        { service: 'internal', url: 'http://directory:10000/health' },
      ] }),
      jsonResponse(200, {}),
    );

    expect(await wakeServices('https://gw.example')).toBe(1);
    expect(fetchMock.mock.calls[0][0]).toBe('https://gw.example/gateway/wake-targets');
    expect(fetchMock.mock.calls[1][0]).toBe('https://identity.onrender.com/health');
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ mode: 'no-cors' });
  });

  it('never fails when the gateway is unreachable', async () => {
    mockFetch(new TypeError('Failed to fetch'));
    await expect(wakeServices('https://gw.example')).resolves.toBe(0);
  });

  it('reports which services are still starting', async () => {
    mockFetch(jsonResponse(200, { status: 'degraded', services: {
      identity: { status: 'up' }, directory: { status: 'down' }, event: { status: 'not_configured' },
    } }));
    await expect(checkServices('https://gw.example')).resolves.toEqual({ ready: false, starting: ['directory'] });
  });
});
