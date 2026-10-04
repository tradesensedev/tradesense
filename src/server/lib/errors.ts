// Status codes we actually use. Our own type avoids depending on Hono's internal type names.
export type ErrorStatus = 400 | 401 | 403 | 404 | 409 | 413 | 415 | 422 | 429 | 500;

// Standard error body everywhere: { error: { code, message, details? } }
export class AppError extends Error {
  constructor(
    public status: ErrorStatus,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const badRequest = (msg = "Bad request", details?: unknown) => new AppError(400, "bad_request", msg, details);
export const unauthorized = (msg = "Not signed in") => new AppError(401, "unauthorized", msg);
export const forbidden = (msg = "Forbidden") => new AppError(403, "forbidden", msg);
export const notFound = (msg = "Not found") => new AppError(404, "not_found", msg);
export const conflict = (msg = "Conflict") => new AppError(409, "conflict", msg);
export const tooMany = (msg = "Too many attempts, try again later") => new AppError(429, "rate_limited", msg);
