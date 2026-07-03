import { useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { alignCharacters, computeStats } from "../lib/diff";
import { trpc } from "../lib/trpc";
import type { AlignedChar } from "@smart-dictation/shared";

// ---- helper: per-char card style ----
function charCardStyle(c: AlignedChar): string {
  if (c.isCorrect) {
    return "bg-green-100 text-green-600 border-green-200";
  }
  switch (c.errorType) {
    case "substitution":
      return "bg-red-100 text-red-500 border-red-200";
    case "deletion":
      return "bg-amber-100 text-amber-600 border-amber-300 border-dashed";
    case "insertion":
      return "bg-orange-100 text-orange-500 border-orange-300 border-dotted";
    default:
      return "bg-gray-100 text-gray-300 border-gray-200";
  }
}

function errorTypeLabel(t: string): string {
  switch (t) {
    case "substitution":
      return "错字";
    case "deletion":
      return "漏字";
    case "insertion":
      return "多字";
    default:
      return "";
  }
}

// ==============================
// CorrectionPage
// ==============================
export function CorrectionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const words: string[] = location.state?.words ?? [];
  const recognizedText: string = location.state?.recognizedText ?? "";
  const ossImageUrl: string = location.state?.ossImageUrl ?? "";

  // ---- 编辑距离对齐 ----
  const alignment = useMemo(() => {
    if (words.length === 0 || !recognizedText) return null;
    const expected = [...words.join("")];
    const actual = [...recognizedText.replace(/[\s\n\r,，。、​]/g, "")];
    return alignCharacters(expected, actual);
  }, [words, recognizedText]);

  const stats = useMemo(
    () => (alignment ? computeStats(alignment) : null),
    [alignment],
  );

  // 错误项列表（仅错误），用于 API 调用
  const errorItems = useMemo(() => {
    if (!alignment) return [];
    return alignment
      .filter((c) => !c.isCorrect && c.expected && c.actual)
      .map((c) => ({
        expected: c.expected!,
        actual: c.actual!,
      }));
  }, [alignment]);

  const hasErrors = errorItems.length > 0;

  // ---- AI 错因分析（有错字时自动触发） ----
  const aiAnalysis = trpc.correction.analyze.useMutation();

  useEffect(() => {
    if (hasErrors && words.length > 0 && recognizedText && ossImageUrl) {
      aiAnalysis.mutate({ words, recognizedText, errors: errorItems, ossImageUrl });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasErrors, words, recognizedText, ossImageUrl]);

  // ===== empty state =====
  if (!alignment || !stats) {
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

  const { correctCount, totalCount, accuracy } = stats;

  const statCards = [
    { label: "正确字数", value: correctCount, color: "text-green-500" },
    { label: "总字数", value: totalCount, color: "text-sky-500" },
    { label: "正确率", value: `${accuracy}%`, color: "text-orange-500" },
  ];

  return (
    <div className="mx-auto max-w-3xl pt-6 space-y-6">
      {/* ===== 标题卡片 ===== */}
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

      {/* ===== 统计卡片 ===== */}
      <div className="grid grid-cols-3 gap-4">
        {statCards.map((stat) => (
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

      {/* ===== 逐字比对卡片 ===== */}
      <div
        className="relative rounded-[2.5rem] shadow-2xl shadow-sky-200/40 overflow-hidden"
        style={{
          backgroundImage: "url('/images/card-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="relative bg-white/30 backdrop-blur-[2px] p-6 md:p-8 space-y-5">
          <h3 className="text-center text-lg font-bold text-slate-500">
            逐字比对
          </h3>

          {/* 原词列表 */}
          <div className="flex flex-wrap gap-2 justify-center">
            <span className="text-xs text-slate-400 font-medium self-center mr-1">
              原词：
            </span>
            {words.map((w, i) => (
              <span
                key={i}
                className="rounded-full bg-white/70 border border-slate-200 px-3 py-1 text-sm font-medium text-slate-500"
              >
                {w}
              </span>
            ))}
          </div>

          {/* 图例 */}
          <div className="flex flex-wrap gap-4 justify-center text-xs text-slate-400">
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-green-100 border border-green-200" />
              正确
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-red-100 border border-red-200" />
              错字
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-amber-100 border border-dashed border-amber-300" />
              漏字
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-orange-100 border border-dotted border-orange-300" />
              多字
            </span>
          </div>

          {/* 逐字结果 */}
          <div className="flex flex-wrap gap-1.5 justify-center">
            {alignment.map((c, i) => (
              <div
                key={i}
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm relative group ${charCardStyle(c)}`}
                title={
                  c.isCorrect
                    ? `正确「${c.expected}」`
                    : c.errorType === "substitution"
                      ? `期望「${c.expected}」识别「${c.actual}」`
                      : c.errorType === "deletion"
                        ? `漏字：期望「${c.expected}」未识别`
                        : `多字：识别「${c.actual}」无对应`
                }
              >
                {c.expected || c.actual}
                {/* 错误类型小标签 */}
                {!c.isCorrect && (
                  <span className="absolute -top-1.5 -right-1.5 text-[9px] leading-none bg-white/80 rounded-full px-1 py-0.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {errorTypeLabel(c.errorType)}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* 识别原文 */}
          {recognizedText && (
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-400 mb-2 text-center">
                识别原文：
              </p>
              <p className="text-sm text-slate-500 text-center bg-white/50 rounded-2xl p-4 whitespace-pre-wrap">
                {recognizedText}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ===== AI 错因分析卡片 ===== */}
      {hasErrors && (
        <div
          className="relative rounded-[2.5rem] shadow-2xl shadow-blue-200/40 overflow-hidden"
          style={{
            backgroundImage: "url('/images/card-bg.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="relative bg-white/30 backdrop-blur-[2px] p-6 md:p-8 space-y-5">
            <h3 className="text-center text-lg font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
              AI 错因分析
            </h3>

            {/* ---- 加载态 ---- */}
            {aiAnalysis.isPending && (
              <div className="space-y-4 animate-pulse">
                <div className="h-16 bg-blue-100/50 rounded-2xl" />
                {errorItems.slice(0, 3).map((_, i) => (
                  <div key={i} className="h-24 bg-slate-100/50 rounded-2xl" />
                ))}
                <p className="text-center text-sm text-slate-400">
                  AI 正在分析错因...
                </p>
              </div>
            )}

            {/* ---- 成功态 ---- */}
            {aiAnalysis.isSuccess && aiAnalysis.data && (
              <div className="space-y-4">
                {/* 整体总结 */}
                <div className="rounded-2xl bg-blue-50/70 border border-blue-200 p-5">
                  <p className="text-sm font-semibold text-blue-600 mb-1">
                    📝 整体评价
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {aiAnalysis.data.overallSummary}
                  </p>
                </div>

                {/* 逐字分析 */}
                <div className="space-y-3">
                  {aiAnalysis.data.errorAnalyses.map((err, i) => (
                    <div
                      key={i}
                      className="rounded-2xl bg-white/60 border border-slate-200 p-5 space-y-3"
                    >
                      <div className="flex items-center gap-3">
                        {/* 错字展示 */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="w-8 h-8 rounded-lg bg-red-100 text-red-500 flex items-center justify-center text-lg font-bold">
                            {err.actualChar}
                          </span>
                          <span className="text-slate-300 text-sm">→</span>
                          <span className="w-8 h-8 rounded-lg bg-green-100 text-green-500 flex items-center justify-center text-lg font-bold">
                            {err.expectedChar}
                          </span>
                        </div>
                        {/* 错误类型标签 */}
                        <span className="rounded-full bg-red-100 text-red-500 px-3 py-1 text-xs font-semibold">
                          {err.errorType}
                        </span>
                      </div>
                      {/* 错因 */}
                      <div>
                        <span className="text-xs text-slate-400 font-semibold">
                          错因
                        </span>
                        <p className="text-sm text-slate-600 mt-0.5">
                          {err.reason}
                        </p>
                      </div>
                      {/* 建议 */}
                      <div>
                        <span className="text-xs text-slate-400 font-semibold">
                          纠正建议
                        </span>
                        <p className="text-sm text-slate-600 mt-0.5">
                          {err.suggestion}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ---- 失败态：静默不显示 ---- */}
            {aiAnalysis.isError && (
              <p className="text-center text-sm text-slate-300">
                AI 分析暂不可用
              </p>
            )}
          </div>
        </div>
      )}

      {/* ===== 底部按钮 ===== */}
      <div className="flex justify-center gap-4 pb-6">
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
