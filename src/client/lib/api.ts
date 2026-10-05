import { CSRF_HEADER } from "@shared/constants";

let csrf: string | null = null;
export const setCsrf = (t: string | null) => {
  csrf = t;
};

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

async function handle<T>(res: Response): Promise<T> {
  const text = await res.text();
  let data: { error?: { code?: string; message?: string; details?: unknown } } | null = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }
  if (!res.ok) {
    throw new ApiError(res.status, data?.error?.code ?? "error", data?.error?.message ?? res.statusText, data?.error?.details);
  }
  return data as T;
}

// One fetch wrapper for the whole app. Adds the CSRF header to unsafe methods.
export async function api<T>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const method = opts.method ?? "GET";
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (method !== "GET" && csrf) headers[CSRF_HEADER] = csrf;
  const res = await fetch(path, {
    method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    credentials: "same-origin",
  });
  return handle<T>(res);
}

// Multipart upload (screenshots). The browser sets the multipart boundary itself.
export async function apiForm<T>(path: string, form: FormData): Promise<T> {
  const headers: Record<string, string> = {};
  if (csrf) headers[CSRF_HEADER] = csrf;
  const res = await fetch(path, { method: "POST", headers, body: form, credentials: "same-origin" });
  return handle<T>(res);
}

// Turns any error into one readable sentence (includes the server's list of problems or field errors).
export function errorMessage(e: unknown): string {
  if (!(e instanceof ApiError)) return e instanceof Error ? e.message : "Something went wrong";
  const d = e.details as { problems?: string[]; fieldErrors?: Record<string, string[]>; fields?: string[] } | undefined;
  if (d?.problems?.length) return `${e.message}: ${d.problems.join("; ")}`;
  if (d?.fieldErrors) {
    const parts = Object.entries(d.fieldErrors).map(([k, v]) => `${k}: ${v.join(", ")}`);
    if (parts.length) return `${e.message} (${parts.join("; ")})`;
  }
  return e.message;
}
