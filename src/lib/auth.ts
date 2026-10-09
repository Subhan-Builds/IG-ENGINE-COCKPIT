/**
 * Edge-compatible Web Crypto HMAC session signer & validator.
 * Compatible with Next.js Edge Middleware and Node.js App Router API handlers.
 */

const encoder = new TextEncoder();

export async function createHmacSignature(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function createSessionToken(secret: string): Promise<string> {
  const timestamp = Date.now().toString();
  const sig = await createHmacSignature(timestamp, secret);
  return `${timestamp}.${sig}`;
}

export async function verifySessionToken(token: string | undefined | null, secret: string): Promise<boolean> {
  if (!token || !secret) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [timestampStr, providedSig] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return false;

  // Session expiry: 30 days
  const maxAgeMs = 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  if (now < timestamp || now - timestamp > maxAgeMs) {
    return false;
  }

  const expectedSig = await createHmacSignature(timestampStr, secret);
  return expectedSig === providedSig;
}
