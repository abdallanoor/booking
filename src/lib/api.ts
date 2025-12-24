import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// API utility with Next.js caching
const baseURL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface FetchOptions extends RequestInit {
  revalidate?: number | false;
  tags?: string[];
}

export async function fetchAPI<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { revalidate, tags, ...fetchOptions } = options;

  // Get cookies for server-side requests
  const cookieStore = await cookies();
  const cookie = cookieStore.toString();

  const response = await fetch(`${baseURL}/api${endpoint}`, {
    ...fetchOptions,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
      ...fetchOptions.headers,
    },
    next: {
      revalidate,
      tags,
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
  options: FetchOptions = {}
): Promise<T> {
  return fetchAPI<T>(endpoint, { ...options, method: "GET" });
}

export async function apiPost<T>(
  endpoint: string,
  data?: unknown,
  options: FetchOptions = {}
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
  options: FetchOptions = {}
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
  options: FetchOptions = {}
): Promise<T> {
  return fetchAPI<T>(endpoint, {
    ...options,
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function apiDelete<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  return fetchAPI<T>(endpoint, { ...options, method: "DELETE" });
}
