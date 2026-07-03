import { buildSignedQuery } from "./alibaba-signer";
import { uploadImageToOSS } from "./alibaba-oss";

export async function recognizeImage(imageBase64: string): Promise<{ recognizedText: string; ossImageUrl: string }> {
  const accessKeyId = process.env.ALIBABA_ACCESS_KEY_ID;
  const accessKeySecret = process.env.ALIBABA_ACCESS_KEY_SECRET;

  if (!accessKeyId || !accessKeySecret) {
    throw new Error(
      "Missing ALIBABA_ACCESS_KEY_ID or ALIBABA_ACCESS_KEY_SECRET env vars",
    );
  }

  // 1. Upload to OSS to get a Shanghai-region URL (required by RecognizeCharacter)
  const ossImageUrl = await uploadImageToOSS(imageBase64);

  // 2. Call OCR with the OSS URL
  const signedQuery = buildSignedQuery({
    accessKeyId,
    accessKeySecret,
    action: "RecognizeCharacter",
    version: "2019-12-30",
    method: "POST",
    extraParams: { RegionId: "cn-shanghai" },
    bodyParams: {
      ImageURL: ossImageUrl,
      MinHeight: "10",
      OutputProbability: "true",
      OutputCharInfo: "true",
      NeedRotate: "true",
    },
  });

  const endpoint =
    process.env.ALIBABA_OCR_ENDPOINT ?? "ocr.cn-shanghai.aliyuncs.com";
  const url = `https://${endpoint}/?${signedQuery}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ImageURL: ossImageUrl,
      MinHeight: "10",
      OutputProbability: "true",
      OutputCharInfo: "true",
      NeedRotate: "true",
    }),
  });

  const data = (await response.json()) as {
    Data?: {
      Content?: string;
      Results?: Array<{ Text: string; Probability: number }>;
    };
    Code?: string;
    Message?: string;
  };

  if (data.Code) {
    throw new Error(`OCR API error: ${data.Code} - ${data.Message}`);
  }

  // 优先从 Results 数组拼接（OutputCharInfo=true 时走这个分支）
  if (data.Data?.Results?.length) {
    const text = data.Data.Results
      .filter((r) => r.Probability > 0.5)
      .map((r) => r.Text)
      .join("");
    if (text.trim()) return { recognizedText: text.trim(), ossImageUrl };
  }

  // 兜底：从 Content 字段读取
  const text = data.Data?.Content?.trim();
  if (text) return { recognizedText: text, ossImageUrl };

  throw new Error(
    `OCR API returned no text. Raw: ${JSON.stringify(data).slice(0, 600)}`,
  );
}
