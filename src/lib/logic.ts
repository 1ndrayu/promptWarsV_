export type Entitlements = {
  wifi: boolean;
  lounge: boolean;
  backstage: boolean;
  premiumDining: boolean;
};

/**
 * Hex-code generation — first 6 chars of UID, uppercased.
 */
export function generateHexCode(uid: string): string {
  if (!uid) return "000000";
  return uid.substring(0, 6).toUpperCase();
}

/* ────────────────────── Bitmask helpers ────────────────────── */

export function entitlementsToBitmask(entitlements: Entitlements): number {
  let bitmask = 0;
  if (entitlements.wifi) bitmask |= 1 << 0;
  if (entitlements.lounge) bitmask |= 1 << 1;
  if (entitlements.backstage) bitmask |= 1 << 2;
  if (entitlements.premiumDining) bitmask |= 1 << 3;
  return bitmask;
}

export function bitmaskToEntitlements(bitmask: number): Entitlements {
  return {
    wifi: (bitmask & (1 << 0)) !== 0,
    lounge: (bitmask & (1 << 1)) !== 0,
    backstage: (bitmask & (1 << 2)) !== 0,
    premiumDining: (bitmask & (1 << 3)) !== 0,
  };
}

/* ────────────────── QR payload (browser-safe) ────────────────── */

/**
 * Build a signed QR payload using the Web Crypto–compatible
 * approach: base-64 encode { uid, bitmask, timestamp, hmac }.
 *
 * The HMAC uses a simple XOR-rotate derivation so it runs
 * anywhere without Node `crypto`.  For production swap in
 * SubtleCrypto or a server-side signer.
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
): string {
  const timestamp = Date.now();
  const bitmask = entitlementsToBitmask(entitlements);
  const payload = JSON.stringify({ u: uid, b: bitmask, t: timestamp });
  const sig = simpleHmac(payload, SECRET);
  return btoa(`${payload}|${sig}`);
}

export function decryptQRPayload(
  encoded: string,
): { uid: string; entitlements: Entitlements; timestamp: number } | null {
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
      entitlements: bitmaskToEntitlements(data.b),
      timestamp: data.t,
    };
  } catch {
    console.error("Failed to decrypt QR payload");
    return null;
  }
}
