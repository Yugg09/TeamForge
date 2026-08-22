import type { ApiErrorBody } from "./types";

const DEFAULT_API_BASE = "";

export function isMockMode(): boolean {
  const flag = import.meta.env.VITE_USE_MOCK;
  return flag === "1" || flag === "true";
}

/**
 * Resolved API root. Callers pass full paths like `/api/health`.
 * Uses VITE_API_BASE_URL when set (e.g. http://localhost:8000);
 * otherwise the empty base lets the Vite proxy handle `/api`.
 */
export function getApiBaseUrl(): string {
  if (isMockMode()) {
    return DEFAULT_API_BASE;
  }
  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!configured) {
    return DEFAULT_API_BASE;
  }
  return configured.replace(/\/$/, "");
}

export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody | undefined;

  constructor(status: number, message: string, body?: ApiErrorBody) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (isMockMode()) {
    const { mockApiFetch } = await import("./mock");
    return mockApiFetch<T>(path, options);
  }

  const base = getApiBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${base}${normalizedPath}`;

  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let body: ApiErrorBody | undefined;
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      body = undefined;
    }
    const message =
      body?.detail ?? `Request failed with status ${response.status}`;
    throw new ApiError(response.status, message, body);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
