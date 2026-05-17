import { clearAuth, getToken } from "@/lib/auth";

const DEFAULT_API_URL = "http://localhost:8000/api";

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | Record<string, unknown> | null;
};

function apiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");
  if (!configured) {
    return DEFAULT_API_URL;
  }

  return configured.endsWith("/api") ? configured : `${configured}/api`;
}

function redirectToLogin() {
  if (typeof window === "undefined") {
    return;
  }

  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

function messageFromPayload(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (typeof record.message === "string") {
      return record.message;
    }
    if (typeof record.error === "string") {
      return record.error;
    }
    if (typeof record.msg === "string") {
      return record.msg;
    }
  }

  return fallback;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  const body = options.body;

  headers.set("Accept", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let requestBody: BodyInit | undefined;
  if (body instanceof FormData) {
    requestBody = body;
  } else if (body) {
    headers.set("Content-Type", "application/json");
    requestBody = JSON.stringify(body);
  }

  const response = await fetch(`${apiBaseUrl()}${path}`, {
    ...options,
    headers,
    body: requestBody,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    if (response.status === 401) {
      clearAuth();
      redirectToLogin();
    }

    const errors =
      payload && typeof payload === "object"
        ? (payload as { errors?: Record<string, string[]> }).errors
        : undefined;

    throw new ApiError(
      messageFromPayload(payload, "The request could not be completed."),
      response.status,
      errors,
    );
  }

  return payload as T;
}

export function unwrapData<T>(payload: T | { data: T }): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data;
  }

  return payload as T;
}

export function formatApiError(error: unknown) {
  if (error instanceof ApiError) {
    const fieldErrors = error.errors
      ? Object.values(error.errors).flat().join(" ")
      : "";
    return [error.message, fieldErrors].filter(Boolean).join(" ");
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
}
