import type {
  CorrectionResult,
  WordResult,
  CharResult,
  ErrorType,
} from "@smart-dictation/shared";

const QWEN_API_URL =
  "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
const QWEN_MODEL = "qwen-vl-plus";
const REQUEST_TIMEOUT_MS = 60_000;

function getApiKey(): string {
  const key = process.env.DASHSCOPE_API_KEY;
  if (!key) {
    throw new Error("DASHSCOPE_API_KEY environment variable is not set");
  }
  return key;
}

// ==============================
// 共享封装：调用通义千问视觉模型
// ==============================

interface QwenMessage {
  role: "system" | "user";
  content:
    | string
    | Array<{ type: "image_url"; image_url: { url: string } } | { type: "text"; text: string }>;
}

interface QwenCallParams {
  messages: QwenMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "json_object" | "text";
}

async function callQwenVLPlus(params: QwenCallParams): Promise<string> {
  const {
    messages,
    temperature = 0.1,
    maxTokens = 2000,
    responseFormat = "json_object",
  } = params;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(QWEN_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getApiKey()}`,
      },
      body: JSON.stringify({
        model: QWEN_MODEL,
        messages,
        response_format: { type: responseFormat },
        temperature,
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(
        `Qwen API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as {
      choices: { message: { content: string } }[];
    };

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Qwen API returned empty content");
    }

    return content;
  } finally {
    clearTimeout(timeout);
  }
}

// ==============================
// 共享：部件描述标准化
// ==============================

function normalizeParts(s: string): string {
  return s
    .trim()
    .replace(/\s+/g, "")           // 去空格
    .replace(/[（(]/g, "(")        // 统一左括号
    .replace(/[）)]/g, ")")        // 统一右括号
    .replace(/[＋+]/g, "+");       // 统一加号
}

// ==============================
// JSON 提取与修复
// ==============================

function extractJSON(text: string): string | null {
  // 优先匹配完整的 {...}
  const fullMatch = text.match(/\{[\s\S]*\}/);
  if (fullMatch) return fullMatch[0];

  // 如果没有完整闭合，回退到从第一个 { 开始取所有内容
  const start = text.indexOf("{");
  if (start === -1) return null;
  return text.slice(start);
}

function repairTruncatedJSON(text: string): string | null {
  // 统计未闭合的括号
  let braceDepth = 0;
  let bracketDepth = 0;
  let inString = false;
  let escape = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") braceDepth++;
    if (ch === "}") braceDepth--;
    if (ch === "[") bracketDepth++;
    if (ch === "]") bracketDepth--;
  }

  // 如果在字符串中间被截断，去掉最后不完整的字符串
  let repaired = text;
  if (inString) {
    // 找到最后一个完整的 ", 截断到那里
    const lastComplete = text.replace(/"[^"]*$/, '"');
    if (lastComplete !== text) {
      repaired = lastComplete;
    }
  }

  // 补全缺失的 ] 和 }
  while (bracketDepth > 0) { repaired += "]"; bracketDepth--; }
  while (braceDepth > 0) { repaired += "}"; braceDepth--; }

  if (repaired === text) return null; // 没有做任何修复
  return repaired;
}

/** AI 返回的单字判断 */
interface RawCharJudgment {
  w: number;     // wordIndex
  c: number;     // charIndex
  e: string;     // expected（AI 回显）
  seen: string;  // AI 在图片中实际看到的字
  ok: boolean;   // 是否正确
  why: string;   // 错因简述（正确时留空）
}

interface RawGradeResponse {
  chars?: RawCharJudgment[];
}

// ==============================
// 汉字部件拆解字典
// ==============================

const CHAR_DECOMPOSE: Record<string, string> = {
  // 慰藉
  "慰": "尉(上)+心(下)",
  "藉": "艹(上)+耤(下)",
  "籍": "⺮(上)+耤(下)",
  // 无赖
  "无": "无(独体)",
  "赖": "束(左)+负(右)",
  "懒": "忄(左)+赖(右)",
  // 宽厚
  "宽": "宀(上)+苋(下)",
  "厚": "厂(外)+日(上内)+子(下内)",
  // 常见字
  "睐": "目(左)+来(右)",
  "青": "龶(上)+月(下)",
  "龄": "齿(左)+令(右)",
  "绊": "纟(左)+半(右)",
  "羁": "罒(上)+革(中)+马(下)",
  "聊": "耳(左)+卯(右)",
  // 常见偏旁/部件
  "尉": "尸(左上)+示(左下)+寸(右)",
  "耤": "耒(左)+昔(右)",
  "束": "木(中)+口(中)",
  "负": "⺈(上)+贝(下)",
  "苋": "艹(上)+见(下)",
  "昔": "龷(上)+日(下)",
  "卯": "卬(左)+卩(右)",
};

function decomposeChar(c: string): string {
  return CHAR_DECOMPOSE[c] ?? c;
}

/**
 * V6 批改：AI 作为"改卷老师"做简单判断（看到什么字 + 对不对），
 * 后端用 CHAR_DECOMPOSE 字典做部件级字符串比对。
 * 三步法：抄写 → 整字判断 → 笔画/结构判断。
 */
export async function gradeByComponents(params: {
  imageUrl: string;
  words: string[];
}): Promise<CorrectionResult> {
  const { imageUrl, words } = params;

  const wordList = words
    .map((w, i) => {
      const chars = [...w].map((c, j) => `  [${j}] ${c}`).join("\n");
      return `第${i + 1}词：${w}\n${chars}`;
    })
    .join("\n\n");

  const systemPrompt = `你是一位严格的小学语文老师，正在批改学生的听写作业。
原则：看到什么就说什么，对打✓错打✗。绝不"善意"地把错误猜成正确。
你不会因为期望学生写某个字，就假装看到了那个字——你只相信自己的眼睛。`;

  const userPrompt = `【听写内容】
${wordList}

【批改方法 — 严格按顺序执行】

第一步：抄写
先别看期望词！只用眼睛看图片中学生写的字。
从左到右，看清楚每个字长什么样。
看到"籍"就是"籍"，看到"赖"就是"赖"——如实记下来。
不要因为后面看到期望词就改口。

第二步：整字判断（优先级1 — 最高）
把你看到的字和期望字对比：
- 看到的字 ≠ 期望字 → ✗ 直接判错！学生写了另一个字
- 例如期望"藉"但看到"籍" → ok=false, seen="籍"

第三步：笔画判断（优先级2）
如果整字相同，仔细检查每个笔画：
- 多一笔？少一笔？笔画形状歪了？→ ✗ 判错
- 例如"日"里面多一撇变成"白" → ok=false

第四步：结构判断（优先级3）
如果笔画也没问题，拆开看结构：
- 上下结构看上下部件，左右结构看左右部件，包围结构看内外部件

【易错提醒】
以下形近部件批改时特别注意：
- "艹"（草字头，横+两竖，3笔）≠ "⺮"（竹字头，6笔）
- "负"（⺈+贝）≠ "攵"（反文旁，撇+横+撇+捺）
- "日"（框中2横，无撇）≠ "白"（框中2横+一撇）

【输出JSON — 只输出JSON，不要markdown标记】
{
  "chars": [
    {"w":0,"c":0,"e":"青","seen":"青","ok":true,"why":""},
    {"w":0,"c":1,"e":"睐","seen":"睐","ok":true,"why":""},
    {"w":1,"c":0,"e":"聊","seen":"柳","ok":false,"why":"右边卯写错，整字为柳"},
    {"w":1,"c":1,"e":"绊","seen":"绊","ok":false,"why":"绞丝旁少了一笔"}
  ]
}

w=词序号(0开始) c=词内字序号(0开始) e=期望字 seen=实际看到的字 ok=对/错 why=错因(对时留空)`;

  try {
    const content = await callQwenVLPlus({
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: imageUrl } },
            { type: "text", text: userPrompt },
          ],
        },
      ],
      temperature: 0.5,
      maxTokens: 8000,
    });

    console.log("[qwen] === RAW AI RESPONSE ===");
    console.log(content);
    console.log("[qwen] === END RAW RESPONSE ===");

    const jsonText = extractJSON(content);
    if (!jsonText) {
      console.error("[qwen gradeByComponents] AI 返回无 JSON:", content.slice(0, 300));
      return createFallbackResult(words);
    }

    let parsed: RawGradeResponse;
    try {
      parsed = JSON.parse(jsonText) as RawGradeResponse;
    } catch (parseErr) {
      console.error("[qwen gradeByComponents] JSON 解析失败，尝试修复:", String(parseErr).slice(0, 200));
      const repaired = repairTruncatedJSON(jsonText);
      if (!repaired) {
        console.error("[qwen gradeByComponents] JSON 修复失败，原始内容长度:", jsonText.length);
        return createFallbackResult(words);
      }
      try {
        parsed = JSON.parse(repaired) as RawGradeResponse;
      } catch {
        console.error("[qwen gradeByComponents] 修复后仍无法解析");
        return createFallbackResult(words);
      }
    }
    if (!parsed.chars || !Array.isArray(parsed.chars)) {
      console.error("[qwen gradeByComponents] 缺少 chars 数组");
      return createFallbackResult(words);
    }

    return buildResultFromParts(words, parsed.chars);
  } catch (err) {
    console.error("[qwen gradeByComponents] 批改失败:", err);
    return createFallbackResult(words);
  }
}

// ==============================
// 内部：从 AI 判断构建 CorrectionResult
// ==============================

function buildResultFromParts(
  expectedWords: string[],
  rawChars: RawCharJudgment[],
): CorrectionResult {
  // 建立查找索引
  const judgmentMap = new Map<string, RawCharJudgment>();
  for (const j of rawChars) {
    judgmentMap.set(`${j.w}-${j.c}`, j);
  }

  const wordResults: WordResult[] = [];

  for (let i = 0; i < expectedWords.length; i++) {
    const expected = expectedWords[i];
    const chars: CharResult[] = [];
    let wordCorrect = true;

    for (let j = 0; j < expected.length; j++) {
      const expChar = expected[j];
      const judgment = judgmentMap.get(`${i}-${j}`);

      if (!judgment) {
        wordCorrect = false;
        chars.push({
          expected: expChar,
          written: null,
          isCorrect: false,
          confidence: 0,
          note: `期望"${expChar}"，AI 未返回该位置数据`,
          errorType: "uncertain" as ErrorType,
        });
        continue;
      }

      const { seen, ok, why } = judgment;

      // ===== 优先级1：整字不同 → 直接判错 =====
      if (seen && seen !== expChar) {
        wordCorrect = false;
        const note = why
          ? `写了"${seen}"，${why}`
          : `期望"${expChar}"，学生写了"${seen}"`;
        chars.push({
          expected: expChar,
          written: seen,
          isCorrect: false,
          confidence: 1.0,
          note,
          errorType: "wrong_char",
        });
        continue;
      }

      // ===== 优先级2 & 3：AI 判断笔画/结构有误 =====
      if (!ok) {
        wordCorrect = false;
        chars.push({
          expected: expChar,
          written: seen || expChar,
          isCorrect: false,
          confidence: 1.0,
          note: why || `"${expChar}"书写有误`,
          errorType: "wrong_char",
        });
        continue;
      }

      // ===== 正确 =====
      chars.push({
        expected: expChar,
        written: seen || expChar,
        isCorrect: true,
        confidence: 1.0,
        note: "",
        errorType: "correct",
      });
    }

    wordResults.push({ word: expected, chars, isCorrect: wordCorrect });
  }

  // ===== 强制计算统计 =====
  let totalChars = 0;
  let correctChars = 0;
  let correctWords = 0;

  for (const wr of wordResults) {
    if (wr.isCorrect) correctWords++;
    for (const cr of wr.chars) {
      totalChars++;
      if (cr.isCorrect) correctChars++;
    }
  }

  const errorCount = totalChars - correctChars;
  const accuracyRate =
    totalChars > 0
      ? Math.round((correctChars / totalChars) * 1000) / 10
      : 0;

  const anomalous =
    accuracyRate < 0 ||
    accuracyRate > 100 ||
    correctChars > totalChars ||
    errorCount < 0;

  if (anomalous) {
    console.error(
      "[qwen buildResultFromParts] 统计数据异常:",
      JSON.stringify({ totalChars, correctChars, errorCount, accuracyRate }),
    );
  }

  return {
    wordResults,
    summary: {
      totalWords: expectedWords.length,
      correctWords,
      totalChars,
      correctChars,
      errorCount,
      accuracyRate,
    },
    anomalous,
  };
}

// ==============================
// 降级
// ==============================

function createFallbackResult(words: string[]): CorrectionResult {
  const wordResults: WordResult[] = words.map((w) => ({
    word: w,
    chars: [...w].map((c) => ({
      expected: c,
      written: null,
      isCorrect: false,
      confidence: 0,
      errorType: "uncertain" as ErrorType,
      note: "批改服务暂时不可用，请稍后重试",
    })),
    isCorrect: false,
  }));

  const totalChars = words.reduce((s, w) => s + w.length, 0);

  return {
    wordResults,
    summary: {
      totalWords: words.length,
      correctWords: 0,
      totalChars,
      correctChars: 0,
      errorCount: totalChars,
      accuracyRate: 0,
    },
    anomalous: true,
  };
}
