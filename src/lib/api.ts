import { redirect } from "next/navigation";

// API utility
const baseURL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

type FetchOptions = RequestInit;

export async function fetchAPI<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const { ...fetchOptions } = options;

  let headers = { ...fetchOptions.headers };

  // Get cookies for server-side requests
  if (typeof window === "undefined") {
    try {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      const cookie = cookieStore.toString();
      if (cookie) {
        headers = { ...headers, Cookie: cookie };
      }
    } catch {
      // Ignore error if next/headers is not available
    }
  }

  const response = await fetch(`${baseURL}/api${endpoint}`, {
    ...fetchOptions,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  if (response.status === 401) {
    redirect("/api/auth/logout?redirect=/");
  }

  if (response.status === 403) {
    redirect("/");
  }

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function apiGet<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  return fetchAPI<T>(endpoint, { ...options, method: "GET" });
}

export async function apiPost<T>(
  endpoint: string,
  data?: unknown,
  options: FetchOptions = {},
): Promise<T> {
  return fetchAPI<T>(endpoint, {
    ...options,
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  });
}

export async function apiPut<T>(
  endpoint: string,
  data: unknown,
  options: FetchOptions = {},
): Promise<T> {
  return fetchAPI<T>(endpoint, {
    ...options,
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function apiPatch<T>(
  endpoint: string,
  data: unknown,
  options: FetchOptions = {},
): Promise<T> {
  return fetchAPI<T>(endpoint, {
    ...options,
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function apiDelete<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  return fetchAPI<T>(endpoint, { ...options, method: "DELETE" });
}
