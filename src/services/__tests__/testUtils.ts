import { vi } from 'vitest';

/** Builds a fetch Response with an optional JSON body. */
export function jsonResponse(status: number, body?: unknown, statusText = ''): Response {
  const hasBody = body !== undefined && status !== 204;
  return new Response(hasBody ? JSON.stringify(body) : null, {
    status,
    statusText,
    headers: hasBody ? { 'Content-Type': 'application/json' } : {},
  });
}

/** Installs a mocked global fetch and returns it for assertions. */
export function mockFetch(...responses: Array<Response | Error>) {
  const fetchMock = vi.fn();
  responses.forEach((response) => {
    if (response instanceof Error) {
      fetchMock.mockRejectedValueOnce(response);
    } else {
      fetchMock.mockResolvedValueOnce(response);
    }
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

/** Minimal browser session storage so auth persistence can be exercised under Node. */
export function installSessionStorage(): Storage {
  const store = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key) => store.get(key) ?? null,
    key: (index) => Array.from(store.keys())[index] ?? null,
    removeItem: (key) => {
      store.delete(key);
    },
    setItem: (key, value) => {
      store.set(key, String(value));
    },
  };
  vi.stubGlobal('window', globalThis);
  vi.stubGlobal('sessionStorage', storage);
  return storage;
}

export function requestHeaders(fetchMock: ReturnType<typeof vi.fn>, callIndex = 0): Headers {
  const init = fetchMock.mock.calls[callIndex][1] as RequestInit;
  return init.headers as Headers;
}
