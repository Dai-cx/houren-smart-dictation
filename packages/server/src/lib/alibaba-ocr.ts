import { buildSignedQuery } from "./alibaba-signer";
import { uploadImageToOSS } from "./alibaba-oss";

// ---- 类型定义 ----

/** OCR 返回的原始结果项（扩展 TextRectangles 解析） */
interface OcrResultItem {
  Text: string;
  Probability: number;
  TextRectangles?: {
    Left: number;
    Top: number;
    Width: number;
    Height: number;
    Angle?: number;
  };
}

interface OcrApiResponse {
  Data?: {
    Content?: string;
    Results?: OcrResultItem[];
  };
  Code?: string;
  Message?: string;
}

/** 单字 OCR 结果（含包围盒） */
export interface OcrCharResult {
  char: string;
  probability: number;
  position: { x: number; y: number; width: number; height: number };
}

/** OCR 识别结果（含位置） */
export interface OcrRecognizeResult {
  recognizedText: string;
  ossImageUrl: string;
  chars: OcrCharResult[];
}

// ---- 内部工具函数 ----

/**
 * 调用阿里云 OCR API（内部），接受已有的 OSS URL。
 */
async function callOcrApiWithUrl(
  ossImageUrl: string,
  retries = 3,
): Promise<OcrApiResponse> {
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

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < retries; attempt++) {
    if (attempt > 0) {
      const delay = attempt * 1500; // 1.5s, 3s, 4.5s
      console.log(`[OCR] 重试第 ${attempt} 次, 等待 ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    }

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

    const data = (await response.json()) as OcrApiResponse;

    // 限流时重试
    if (data.Code && /Throttling|QPS|限流/.test(data.Message ?? "")) {
      console.log(`[OCR] 被限流: ${data.Message}`);
      lastError = new Error(`OCR API error: ${data.Code} - ${data.Message}`);
      continue;
    }

    if (data.Code) {
      throw new Error(`OCR API error: ${data.Code} - ${data.Message}`);
    }

    // debug: 记录 OCR 原始响应
    console.log("[OCR] raw Results count:", data.Data?.Results?.length ?? 0);
    if (data.Data?.Results?.length) {
      data.Data.Results.forEach((r, i) => {
        const rect = r.TextRectangles;
        console.log(`[OCR]   [${i}] Text="${r.Text}" prob=${r.Probability} rect=${rect ? `${rect.Left},${rect.Top} ${rect.Width}x${rect.Height}` : "NONE"}`);
      });
    }

    return data;
  }

  throw lastError ?? new Error("OCR API retry exhausted");
}

/**
 * 调用阿里云 OCR API 并返回原始响应（含 OSS 上传）。
 */
async function callOcrApi(imageBase64: string): Promise<{
  data: OcrApiResponse;
  ossImageUrl: string;
}> {
  // 1. Upload to OSS to get a Shanghai-region URL (required by RecognizeCharacter)
  const ossImageUrl = await uploadImageToOSS(imageBase64);

  // 2. Call OCR with the OSS URL
  const data = await callOcrApiWithUrl(ossImageUrl);

  return { data, ossImageUrl };
}

/** 需要从位置数组中跳过的字符（与 grade 端点中 actualChars 过滤保持一致） */
const SKIP_CHARS = /[\s\n\r,，。、​]/;

/**
 * 从 TextRectangles 估算每个字符的包围盒。
 *
 * OCR API 返回的 TextRectangles 是文本行/词级别的区域，
 * 不含单字位置。对于中文田字格听写（字间距均匀），
 * 将区域宽/高按字符数均分来估算每字位置，精度足够。
 *
 * @param forceHorizontal 强制按横排切分，忽略 OCR 的竖排检测（听写场景文字始终横排）
 */
function estimateCharPositions(
  results: OcrResultItem[],
  opts?: { forceHorizontal?: boolean },
): OcrCharResult[] {
  const chars: OcrCharResult[] = [];

  for (const item of results) {
    if (item.Probability <= 0.5) continue;

    // 过滤掉空白/标点，仅保留有效汉字（与 recognizedText 后续处理一致）
    const text = item.Text;
    const validChars: { char: string; index: number }[] = [];
    for (let i = 0; i < text.length; i++) {
      if (!SKIP_CHARS.test(text[i])) {
        validChars.push({ char: text[i], index: i });
      }
    }
    if (validChars.length === 0) continue;

    const rect = item.TextRectangles;
    if (!rect) {
      for (const { char } of validChars) {
        chars.push({
          char,
          probability: item.Probability,
          position: { x: 0, y: 0, width: 0, height: 0 },
        });
      }
      continue;
    }

    // 判断竖排：Angle 接近 ±90° 且 高/宽 > 1.5（避免正方形区域被误判）
    const forceH = opts?.forceHorizontal ?? false;
    const heightOverWidth = rect.Height / Math.max(rect.Width, 1);
    const angleNearVertical =
      rect.Angle !== undefined && Math.abs(Math.abs(rect.Angle) - 90) < 10;
    const isVertical = !forceH && angleNearVertical && heightOverWidth > 1.5;

    if (isVertical) {
      // 竖排文字：按高度均分，但只对有效字符分配位置
      const charHeight = rect.Height / text.length;
      for (const { char, index } of validChars) {
        chars.push({
          char,
          probability: item.Probability,
          position: {
            x: rect.Left,
            y: rect.Top + index * charHeight,
            width: rect.Width,
            height: charHeight,
          },
        });
      }
    } else {
      // 横排文字：按宽度均分，但只对有效字符分配位置
      const charWidth = rect.Width / text.length;
      for (const { char, index } of validChars) {
        chars.push({
          char,
          probability: item.Probability,
          position: {
            x: rect.Left + index * charWidth,
            y: rect.Top,
            width: charWidth,
            height: rect.Height,
          },
        });
      }
    }
  }

  return chars;
}

// ---- 公开 API ----

/**
 * 识别图片中的文字（不含位置信息）。
 * 保持向后兼容，供 ocr.recognize 端点使用。
 */
export async function recognizeImage(
  imageBase64: string,
): Promise<{ recognizedText: string; ossImageUrl: string }> {
  const { data, ossImageUrl } = await callOcrApi(imageBase64);

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

/**
 * 识别图片中的文字，同时返回每个字符的包围盒位置。
 * 供 correction.grade 端点使用。
 */
export async function recognizeImageWithPositions(
  imageBase64: string,
): Promise<OcrRecognizeResult> {
  const { data, ossImageUrl } = await callOcrApi(imageBase64);

  if (data.Code) {
    throw new Error(`OCR API error: ${data.Code} - ${data.Message}`);
  }

  const results = data.Data?.Results ?? [];

  // 从 Results 拼接识别文本
  const recognizedText = results
    .filter((r) => r.Probability > 0.5)
    .map((r) => r.Text)
    .join("")
    .trim();

  // 兜底：从 Content 字段读取
  if (!recognizedText) {
    const content = data.Data?.Content?.trim();
    if (content) {
      return {
        recognizedText: content,
        ossImageUrl,
        chars: [],
      };
    }
    throw new Error(
      `OCR API returned no text. Raw: ${JSON.stringify(data).slice(0, 600)}`,
    );
  }

  // 估算每字位置
  const chars = estimateCharPositions(results);

  return { recognizedText, ossImageUrl, chars };
}

/**
 * 从已有的 OSS URL 直接调用 OCR 并返回带位置的识别结果。
 * 用于 correction 端点内部——图片已上传 OSS，无需重复上传。
 */
export async function recognizeImageWithPositionsFromUrl(
  ossImageUrl: string,
): Promise<OcrRecognizeResult> {
  const data = await callOcrApiWithUrl(ossImageUrl);

  if (data.Code) {
    throw new Error(`OCR API error: ${data.Code} - ${data.Message}`);
  }

  const results = data.Data?.Results ?? [];

  const recognizedText = results
    .filter((r) => r.Probability > 0.5)
    .map((r) => r.Text)
    .join("")
    .trim();

  if (!recognizedText) {
    const content = data.Data?.Content?.trim();
    if (content) {
      return { recognizedText: content, ossImageUrl, chars: [] };
    }
    throw new Error(
      `OCR API returned no text. Raw: ${JSON.stringify(data).slice(0, 600)}`,
    );
  }

  const chars = estimateCharPositions(results, { forceHorizontal: true });

  return { recognizedText, ossImageUrl, chars };
}
