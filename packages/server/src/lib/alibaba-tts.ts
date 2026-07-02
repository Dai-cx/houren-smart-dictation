import { buildSignedQuery } from "./alibaba-signer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TokenCache {
  token: string;
  expiresAt: number; // ms timestamp
}

export interface SynthesizeOptions {
  voice?: string;
  speechRate?: number; // -500 ~ 500
  pitchRate?: number; // -500 ~ 500
  volume?: number; // 0 ~ 100
  format?: string; // 'mp3' | 'wav'
}

// ---------------------------------------------------------------------------
// Token
// ---------------------------------------------------------------------------

let tokenCache: TokenCache | null = null;

export async function getAccessToken(): Promise<string> {
  // Reuse cached token with 5‑minute safety margin
  if (tokenCache && tokenCache.expiresAt > Date.now() + 300_000) {
    return tokenCache.token;
  }

  const accessKeyId = process.env.ALIBABA_ACCESS_KEY_ID;
  const accessKeySecret = process.env.ALIBABA_ACCESS_KEY_SECRET;

  if (!accessKeyId || !accessKeySecret) {
    throw new Error(
      "Missing ALIBABA_ACCESS_KEY_ID or ALIBABA_ACCESS_KEY_SECRET env vars",
    );
  }

  const signedQuery = buildSignedQuery({
    accessKeyId,
    accessKeySecret,
    action: "CreateToken",
    version: "2019-02-28",
    method: "GET",
  });

  const url = `https://nls-meta.cn-shanghai.aliyuncs.com/?${signedQuery}`;

  const response = await fetch(url, { method: "GET" });
  if (!response.ok) {
    throw new Error(`Token request failed: HTTP ${response.status}`);
  }

  const data = (await response.json()) as {
    Token?: { Id: string; ExpireTime: number };
    Code?: string;
    Message?: string;
  };

  if (!data.Token) {
    throw new Error(`Token API error: ${data.Code} - ${data.Message}`);
  }

  tokenCache = {
    token: data.Token.Id,
    expiresAt: data.Token.ExpireTime * 1000,
  };
  return tokenCache.token;
}

// ---------------------------------------------------------------------------
// Synthesize
// ---------------------------------------------------------------------------

export async function synthesizeSpeech(
  text: string,
  options: SynthesizeOptions = {},
): Promise<Buffer> {
  const token = await getAccessToken();
  const appkey = process.env.ALIBABA_TTS_APP_KEY;

  if (!appkey) {
    throw new Error("Missing ALIBABA_TTS_APP_KEY env var");
  }

  const body = {
    appkey,
    token,
    text,
    format: options.format ?? "mp3",
    sample_rate: 16000,
    voice: options.voice ?? "xiaoyun",
    volume: options.volume ?? 50,
    speech_rate: options.speechRate ?? 0,
    pitch_rate: options.pitchRate ?? 0,
  };

  const response = await fetch(
    "https://nls-gateway.cn-shanghai.aliyuncs.com/stream/v1/tts",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  // Alibaba TTS returns JSON error bodies even with 200 status sometimes
  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok || contentType.includes("application/json")) {
    const errorText = await response.text();
    throw new Error(`TTS synthesis failed (${response.status}): ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
