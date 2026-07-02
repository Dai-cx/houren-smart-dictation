import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface CharResult {
  expected: string;
  actual: string;
  isCorrect: boolean;
}

function computeComparison(
  words: string[],
  recognizedText: string,
): { correctCount: number; totalCount: number; accuracy: number; chars: CharResult[] } {
  const expected = words.join(""); // e.g. "蝴蝶蜻蜓蚂蚁"
  const actual = recognizedText.replace(/[\s\n\r,，。、​]/g, ''); // strip whitespace & punctuation

  const chars: CharResult[] = [];
  let correctCount = 0;
  const maxLen = Math.max(expected.length, actual.length);

  for (let i = 0; i < maxLen; i++) {
    const ec = expected[i] ?? '';
    const ac = actual[i] ?? '';
    const isCorrect = ec !== '' && ec === ac;
    if (isCorrect) correctCount++;
    chars.push({ expected: ec, actual: ac, isCorrect });
  }

  const totalCount = expected.length;
  const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  return { correctCount, totalCount, accuracy, chars };
}

export function CorrectionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const words: string[] = location.state?.words ?? [];
  const recognizedText: string = location.state?.recognizedText ?? '';

  const comparison = useMemo(
    () => (words.length > 0 && recognizedText ? computeComparison(words, recognizedText) : null),
    [words, recognizedText],
  );

  // ===== empty state =====
  if (!comparison) {
    return (
      <div className="mx-auto max-w-2xl pt-6 space-y-6">
        <div
          className="relative rounded-[2.5rem] shadow-2xl shadow-green-200/40 overflow-hidden"
          style={{
            backgroundImage: "url('/images/card-bg.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="relative bg-white/30 backdrop-blur-[2px] p-8 md:p-10 text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
              批改结果
            </h2>
            <div className="rounded-[1.5rem] border-2 border-dashed border-green-200 bg-green-50/30 p-12 text-center space-y-4">
              <p className="text-slate-400 text-lg font-medium">
                请先上传照片进行识别
              </p>
              <p className="text-slate-300 text-sm">
                拍照上传学生听写纸，系统识别后自动批改
              </p>
            </div>
            <button
              onClick={() => navigate("/upload", { state: { words } })}
              className="rounded-full bg-gradient-to-r from-purple-400 to-pink-400 px-8 py-3 text-white font-bold text-lg shadow-lg shadow-purple-200/50 hover:scale-105 transition-all duration-200"
            >
              ← 去上传照片
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { correctCount, totalCount, accuracy, chars } = comparison;

  const stats = [
    { label: "正确字数", value: correctCount, color: "text-green-500" },
    { label: "总字数", value: totalCount, color: "text-sky-500" },
    { label: "正确率", value: `${accuracy}%`, color: "text-orange-500" },
  ];

  return (
    <div className="mx-auto max-w-3xl pt-6 space-y-6">
      {/* 标题卡片 */}
      <div
        className="relative rounded-[2.5rem] shadow-2xl shadow-green-200/40 overflow-hidden"
        style={{
          backgroundImage: "url('/images/card-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="relative bg-white/30 backdrop-blur-[2px] p-8 md:p-10 text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
            批改结果
          </h2>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-3xl bg-white/50 backdrop-blur-lg border border-white/60 shadow-xl p-6 text-center"
          >
            <div className={`text-3xl font-extrabold ${stat.color}`}>
              {stat.value}
            </div>
            <div className="mt-2 text-sm text-slate-400 font-medium">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* 逐字比对 */}
      <div
        className="relative rounded-[2.5rem] shadow-2xl shadow-sky-200/40 overflow-hidden"
        style={{
          backgroundImage: "url('/images/card-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="relative bg-white/30 backdrop-blur-[2px] p-6 md:p-8 space-y-4">
          <h3 className="text-center text-lg font-bold text-slate-500">
            逐字比对
          </h3>

          {/* 原词列表 */}
          <div className="flex flex-wrap gap-2 justify-center">
            <span className="text-xs text-slate-400 font-medium self-center mr-1">原词：</span>
            {words.map((w, i) => (
              <span
                key={i}
                className="rounded-full bg-white/70 border border-slate-200 px-3 py-1 text-sm font-medium text-slate-500"
              >
                {w}
              </span>
            ))}
          </div>

          {/* 逐字结果 */}
          <div className="flex flex-wrap gap-1.5 justify-center">
            {chars.map((c, i) => (
              <div
                key={i}
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm ${
                  c.isCorrect
                    ? "bg-green-100 text-green-600 border border-green-200"
                    : c.expected
                      ? "bg-red-100 text-red-500 border border-red-200"
                      : "bg-gray-100 text-gray-300 border border-gray-200"
                }`}
                title={c.expected ? `期望「${c.expected}」识别「${c.actual}」` : `多余「${c.actual}」`}
              >
                {c.expected || c.actual}
              </div>
            ))}
          </div>

          {/* 识别原文 */}
          {recognizedText && (
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-400 mb-2 text-center">识别原文：</p>
              <p className="text-sm text-slate-500 text-center bg-white/50 rounded-2xl p-4 whitespace-pre-wrap">
                {recognizedText}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 底部按钮 */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => navigate("/upload", { state: { words } })}
          className="rounded-full bg-purple-100 text-purple-500 px-6 py-3 font-semibold text-sm hover:bg-purple-200 transition-colors"
        >
          ← 重新上传
        </button>
        <button
          onClick={() => navigate("/input")}
          className="rounded-full bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-500 px-8 py-3 text-white font-bold text-base shadow-lg shadow-emerald-200/50 hover:scale-105 transition-all duration-200"
        >
          完成批改
        </button>
      </div>
    </div>
  );
}
