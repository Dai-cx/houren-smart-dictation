import type { CorrectionAnalysis } from "@smart-dictation/shared";

const QWEN_API_URL =
  "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
const QWEN_MODEL = "qwen-vl-plus";

function getApiKey(): string {
  const key = process.env.DASHSCOPE_API_KEY;
  if (!key) {
    throw new Error("DASHSCOPE_API_KEY environment variable is not set");
  }
  return key;
}

const SYSTEM_PROMPT = `你是一位资深的小学语文教学专家，拥有20年一线教学经验。你将会看到学生的手写听写图片，请仔细观察每个字的实际书写情况，从教育学角度给出专业、温和的分析。

## 关键分析原则
1. **必须仔细查看图片中的实际字迹**，而不是仅凭OCR文本猜测
2. 如果OCR识别的字和学生想写的正确字不同，先判断：
   - 学生确实写成了OCR识别的那个字 → 字形混淆/替代错误
   - 学生写的就是正确字但笔画不规范（偏旁写错、多笔少笔） → 笔画/结构错误，OCR误识
   - 字迹过于潦草，难以辨认 → 书写规范问题
3. 基于图片中的真实书写给出准确判断

## 输出格式
你必须返回严格的JSON对象，格式如下：
{
  "overallSummary": "1-2句话概括本次听写的主要问题和整体改进方向",
  "errorAnalyses": [
    {
      "charIndex": 0,
      "expectedChar": "蝴",
      "actualChar": "胡",
      "errorType": "偏旁遗漏",
      "reason": "从图片看，学生书写时遗漏了'虫'字旁，只写了'胡'部分",
      "suggestion": "引导孩子理解'蝴蝶'是昆虫，所以有虫字旁，用归类法记忆同类字"
    }
  ]
}

## 错误类型分类标准
- 偏旁遗漏: 观察图片，正确字有偏旁但学生写漏了
- 偏旁误用: 观察图片，偏旁写成了另一个偏旁
- 笔画错误: 观察图片，字的结构对但某笔画写错（如"基"下面的"土"写成了"木"）
- 形近混淆: 观察图片，学生确实写成了另一个字形相近的字
- 同音混淆: 学生写了同音或近音的另一个字
- 完全错误: 完全不相关的字
- 书写潦草: 字迹过于潦草，难以辨认具体笔画
- OCR误识: 图片中学生字写对了，是OCR识别有误

## 分析要求
- 每个错字必须独立分析，不要合并
- reason 必须基于图片中的实际书写情况，具体说明看到了什么
- suggestion 要给出可操作的具体方法，面向家长
- 语气温和、鼓励，不用否定性语言`;

/**
 * 调用通义千问视觉模型分析听写错误（传入手写图片）。
 *
 * @param words - 原词列表
 * @param recognizedText - OCR 识别文本
 * @param errors - 错误字列表（期望 vs 实际）
 * @param ossImageUrl - 手写图片 OSS URL，供模型直接查看字迹
 * @returns 分析结果，失败时返回 null
 */
export async function analyzeDictationErrors(
  words: string[],
  recognizedText: string,
  errors: { expected: string; actual: string }[],
  ossImageUrl: string,
): Promise<CorrectionAnalysis | null> {
  const userMessage = `请分析以下小学生听写错误。请务必仔细观察图片中每个字的实际书写情况，做出准确判断。

原词列表：${words.join("、")}
OCR识别结果：${recognizedText}

错误详情（OCR识别的错误字对应关系）：
${JSON.stringify(errors, null, 2)}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    const response = await fetch(QWEN_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getApiKey()}`,
      },
      body: JSON.stringify({
        model: QWEN_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: ossImageUrl } },
              { type: "text", text: userMessage },
            ],
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 2000,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error(
        `[qwen] API error: ${response.status} ${response.statusText}`,
      );
      return null;
    }

    const data = (await response.json()) as {
      choices: { message: { content: string } }[];
    };

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.error("[qwen] Empty response content");
      return null;
    }

    const parsed = JSON.parse(content) as CorrectionAnalysis;

    // 基础校验
    if (
      typeof parsed.overallSummary !== "string" ||
      !Array.isArray(parsed.errorAnalyses)
    ) {
      console.error("[qwen] Response format mismatch:", content);
      return null;
    }

    return parsed;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      console.error("[qwen] Request timeout");
    } else {
      console.error("[qwen] Unexpected error:", err);
    }
    return null;
  }
}
