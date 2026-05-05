const BASE_URL = import.meta.env.VITE_API_URL as string;

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data: unknown,
  ) {
    super(`API Error ${status}: ${statusText}`);
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {}
    throw new ApiError(res.status, res.statusText, data);
  }
  return res.json() as Promise<T>;
}

type GetTokenFn = () => Promise<string | null>;

let _getToken: GetTokenFn = () => Promise.resolve(null);

export function setTokenProvider(fn: GetTokenFn) {
  _getToken = fn;
}

async function authHeaders(): Promise<HeadersInit> {
  const token = await _getToken();
  return token
    ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    : { "Content-Type": "application/json" };
}

export const apiClient = {
  get: async <T>(path: string): Promise<T> => {
    const headers = await authHeaders();
    const res = await fetch(`${BASE_URL}${path}`, { headers });
    return handleResponse<T>(res);
  },

  post: async <T>(path: string, body: unknown): Promise<T> => {
    const headers = await authHeaders();
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    return handleResponse<T>(res);
  },

  patch: async <T>(path: string, body: unknown): Promise<T> => {
    const headers = await authHeaders();
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });
    return handleResponse<T>(res);
  },

  delete: async <T>(path: string): Promise<T> => {
    const headers = await authHeaders();
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "DELETE",
      headers,
    });
    return handleResponse<T>(res);
  },
};
