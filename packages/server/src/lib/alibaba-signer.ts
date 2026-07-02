import crypto from "node:crypto";

// ---------------------------------------------------------------------------
// Low-level helpers
// ---------------------------------------------------------------------------

/**
 * Alibaba Cloud special percent-encoding.
 * A-Z a-z 0-9 - _ . ~ stay as-is; everything else → %XY.
 */
export function percentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, "%21")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/\*/g, "%2A")
    .replace(/\+/g, "%20");
}

export function buildCanonicalQuery(
  params: Record<string, string>,
): string {
  return Object.keys(params)
    .sort()
    .map(
      (key) => `${percentEncode(key)}=${percentEncode(String(params[key]))}`,
    )
    .join("&");
}

export function hmacSha1(key: string, data: string): string {
  return crypto.createHmac("sha1", key).update(data).digest("base64");
}

// ---------------------------------------------------------------------------
// RPC signature
// ---------------------------------------------------------------------------

export interface SignOptions {
  accessKeyId: string;
  accessKeySecret: string;
  action: string;
  version: string;
  method?: "GET" | "POST";
  extraParams?: Record<string, string>;
  /** Params included in signature calculation but sent via POST body, NOT in the URL */
  bodyParams?: Record<string, string>;
}

/**
 * Build a fully signed Alibaba Cloud RPC query string (URL params only).
 *
 * `extraParams`   → included in BOTH the signature and the URL query string.
 * `bodyParams`    → included in the signature but NOT in the URL;
 *                    the caller must send them separately in the POST body.
 */
export function buildSignedQuery(opts: SignOptions): string {
  const urlParams: Record<string, string> = {
    AccessKeyId: opts.accessKeyId,
    Action: opts.action,
    Format: "JSON",
    SignatureMethod: "HMAC-SHA1",
    SignatureNonce: crypto.randomUUID(),
    SignatureVersion: "1.0",
    Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    Version: opts.version,
    ...opts.extraParams,
  };

  // Signature computed over ALL params (URL + body)
  const allParams = { ...urlParams, ...opts.bodyParams };
  const canonicalQuery = buildCanonicalQuery(allParams);
  const method = opts.method ?? "GET";
  const stringToSign = `${method}&${percentEncode("/")}&${percentEncode(canonicalQuery)}`;
  const signature = hmacSha1(`${opts.accessKeySecret}&`, stringToSign);

  // URL only carries system + extra params (body params are separate)
  const urlCanonical = buildCanonicalQuery(urlParams);
  return `${urlCanonical}&Signature=${percentEncode(signature)}`;
}
