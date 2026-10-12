import { getToken, sessionExpiredEvent, setToken } from './auth/session';

//code mode usuarios: transporte HTTP compartido solo por los módulos conectados.
export const baseUrl = (import.meta.env.VITE_API_URL || '/api').replace(
  /\/$/,
  '',
);

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { authenticated?: boolean } = {},
): Promise<T> {
  const { authenticated = true, ...init } = options;
  const token = authenticated ? getToken() : null;
  const headers = new Headers(init.headers);
  //code mode S3: el navegador define el boundary de multipart/form-data.
  if (init.body && !(init.body instanceof FormData))
    headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, { ...init, headers });
  } catch (error) {
    if (init.signal?.aborted) throw error;
    throw new ApiError(
      'No se pudo conectar con la API. Revisa tu conexión e intenta nuevamente.',
      0,
    );
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && authenticated && token === getToken()) {
      setToken(null);
      window.dispatchEvent(new Event(sessionExpiredEvent));
    }
    throw new ApiError(
      data?.msg || 'No se pudo completar la operación.',
      response.status,
    );
  }
  if (data === null)
    throw new ApiError('La API devolvió una respuesta no válida.', 502);
  return data as T;
}
