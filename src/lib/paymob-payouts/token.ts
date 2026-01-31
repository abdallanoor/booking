/**
 * Paymob Payouts OAuth2 token cache
 * Tokens expire in 60 minutes; refresh before expiry.
 */

import { paymobPayoutsConfig, validatePaymobPayoutsConfig } from "./config";

interface TokenCache {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

let cache: TokenCache | null = null;

function isExpired(expiresAt: number): boolean {
  return Date.now() >= expiresAt - paymobPayoutsConfig.tokenRefreshBufferMs;
}

/**
 * Request new token using password grant
 */
async function fetchNewToken(): Promise<TokenCache> {
  const { valid, missing } = validatePaymobPayoutsConfig();
  if (!valid) {
    throw new Error(
      `Paymob Payouts config incomplete. Missing: ${missing.join(", ")}`,
    );
  }

  const body = new URLSearchParams({
    grant_type: "password",
    username: paymobPayoutsConfig.username,
    password: paymobPayoutsConfig.password,
  });

  const auth = Buffer.from(
    `${paymobPayoutsConfig.clientId}:${paymobPayoutsConfig.clientSecret}`,
  ).toString("base64");

  const res = await fetch(`${paymobPayoutsConfig.baseUrl}/o/token/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${auth}`,
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Paymob Payouts token failed: ${res.status} ${res.statusText} - ${text}`,
    );
  }

  const data = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  const expiresInMs = (data.expires_in ?? 3600) * 1000;
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + expiresInMs,
  };
}

/**
 * Refresh token using refresh_token grant
 */
async function refreshAccessToken(refreshToken: string): Promise<TokenCache> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const auth = Buffer.from(
    `${paymobPayoutsConfig.clientId}:${paymobPayoutsConfig.clientSecret}`,
  ).toString("base64");

  const res = await fetch(`${paymobPayoutsConfig.baseUrl}/o/token/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${auth}`,
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Paymob Payouts token refresh failed: ${res.status} ${res.statusText} - ${text}`,
    );
  }

  const data = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  const expiresInMs = (data.expires_in ?? 3600) * 1000;
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresAt: Date.now() + expiresInMs,
  };
}

/**
 * Returns a valid access token, refreshing if needed.
 */
export async function getPaymobPayoutsAccessToken(): Promise<string> {
  if (cache && !isExpired(cache.expiresAt)) {
    return cache.accessToken;
  }

  if (cache && cache.refreshToken) {
    try {
      cache = await refreshAccessToken(cache.refreshToken);
      return cache.accessToken;
    } catch (e) {
      console.warn("[Paymob Payouts] Token refresh failed, fetching new:", e);
    }
  }

  cache = await fetchNewToken();
  return cache.accessToken;
}
