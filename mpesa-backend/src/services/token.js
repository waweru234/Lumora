// In-memory cache for the Daraja OAuth access token.
// Tokens live ~3599s. We cache for 55 minutes to stay safely under the limit.
let cachedToken = null;
let cachedAt = 0;
const TTL_MS = 55 * 60 * 1000;

export async function getAccessToken({ consumerKey, consumerSecret, oauthUrl, fetchImpl = fetch }) {
  if (cachedToken && Date.now() - cachedAt < TTL_MS) {
    return cachedToken;
  }
  if (!consumerKey || !consumerSecret) {
    throw new Error("Missing DARAJA_CONSUMER_KEY / DARAJA_CONSUMER_SECRET");
  }
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
  const res = await fetchImpl(oauthUrl, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OAuth failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  if (!data.access_token) {
    throw new Error(`OAuth response missing access_token: ${JSON.stringify(data)}`);
  }
  cachedToken = data.access_token;
  cachedAt = Date.now();
  return cachedToken;
}

export function _resetTokenCache() {
  cachedToken = null;
  cachedAt = 0;
}
