export type Entitlements = Record<string, boolean>;

/**
 * Hex-code generation — first 6 chars of UID, uppercased.
 */
export function generateHexCode(uid: string): string {
  if (!uid) return "000000";
  return uid.substring(0, 6).toUpperCase();
}

/* ────────────────── QR payload (browser-safe) ────────────────── */

/**
 * Build a signed QR payload using the Web Crypto–compatible
 * approach: base-64 encode { uid, entitlements, timestamp, hmac }.
 */
function simpleHmac(message: string, key: string): string {
  let hash = 0;
  const combined = key + message;
  for (let i = 0; i < combined.length; i++) {
    const ch = combined.charCodeAt(i);
    hash = ((hash << 5) - hash + ch) | 0;          // imul-style
    hash = (hash ^ (hash >>> 16)) | 0;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

const SECRET = "nexus-secret-2026";                 // env-inject in prod

export function encryptQRPayload(
  uid: string,
  entitlements: Entitlements,
  eventId: string = "default"
): string {
  const timestamp = Date.now();
  const payload = JSON.stringify({ u: uid, e: entitlements, t: timestamp, ev: eventId });
  const sig = simpleHmac(payload, SECRET);
  return btoa(`${payload}|${sig}`);
}

export function decryptQRPayload(
  encoded: string,
): { uid: string; entitlements: Entitlements; timestamp: number; eventId: string } | null {
  try {
    const decoded = atob(encoded);
    const pipeIdx = decoded.lastIndexOf("|");
    if (pipeIdx === -1) return null;

    const payload = decoded.slice(0, pipeIdx);
    const sig = decoded.slice(pipeIdx + 1);

    if (simpleHmac(payload, SECRET) !== sig) {
      console.error("Invalid QR signature");
      return null;
    }

    const data = JSON.parse(payload);

    // Replay-attack guard — 5-minute window
    if (Date.now() - data.t > 5 * 60 * 1000) {
      console.error("QR Code expired");
      return null;
    }

    return {
      uid: data.u,
      entitlements: data.e,
      timestamp: data.t,
      eventId: data.ev || "default"
    };
  } catch {
    console.error("Failed to decrypt QR payload");
    return null;
  }
}
