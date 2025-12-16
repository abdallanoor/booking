// Client-side API utilities (for use in browser/client components)

async function fetchAPIClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include", // Include cookies in client-side requests
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function clientGet<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  return fetchAPIClient<T>(endpoint, { ...options, method: "GET" });
}

export async function clientPost<T>(
  endpoint: string,
  data?: unknown,
  options: RequestInit = {}
): Promise<T> {
  return fetchAPIClient<T>(endpoint, {
    ...options,
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  });
}

export async function clientPut<T>(
  endpoint: string,
  data: unknown,
  options: RequestInit = {}
): Promise<T> {
  return fetchAPIClient<T>(endpoint, {
    ...options,
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function clientPatch<T>(
  endpoint: string,
  data: unknown,
  options: RequestInit = {}
): Promise<T> {
  return fetchAPIClient<T>(endpoint, {
    ...options,
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function clientDelete<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  return fetchAPIClient<T>(endpoint, { ...options, method: "DELETE" });
}
