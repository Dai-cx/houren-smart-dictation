import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { trpc } from "../lib/trpc";

// ==============================
// CorrectionPage — 标注图片展示
// ==============================
export function CorrectionPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const words: string[] = location.state?.words ?? [];
  const ossImageUrl: string | undefined = location.state?.ossImageUrl;

  const analyzeMutation = trpc.correction.analyze.useMutation();

  useEffect(() => {
    if (ossImageUrl && words.length > 0) {
      analyzeMutation.mutate({ ossImageUrl, words });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const data = analyzeMutation.data;

  // 批改成功后自动收录错词到错题本
  useEffect(() => {
    if (!data) return;
    const wrongWords = data.result.wordResults
      .filter((wr) => !wr.isCorrect)
      .map((wr) => wr.word);
    if (wrongWords.length === 0) return;
    try {
      const stored = JSON.parse(
        localStorage.getItem("smart-dictation-mistakes") ?? "[]",
      ) as string[];
      const merged = [...new Set([...stored, ...wrongWords])];
      localStorage.setItem("smart-dictation-mistakes", JSON.stringify(merged));
    } catch {
      // localStorage 不可用时静默失败
    }
  }, [data]);
  const summary = data?.result.summary;
  const annotatedImageUrl = data?.annotatedImageUrl;
  const allCorrect = summary?.errorCount === 0;

  // ===== 空状态 =====
  if (!ossImageUrl || words.length === 0) {
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
                请先上传照片进行批改
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

  // ===== 加载态 =====
  if (analyzeMutation.isPending) {
    return (
      <div className="mx-auto max-w-3xl pt-6 space-y-6">
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
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-green-100/50 rounded-full w-48 mx-auto" />
              <div className="h-64 bg-white/40 rounded-3xl" />
              <p className="text-sm text-slate-400">AI 正在批改中，请稍候...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== 错误态 =====
  if (analyzeMutation.isError || !data) {
    return (
      <div className="mx-auto max-w-3xl pt-6 space-y-6">
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
            <div className="rounded-[1.5rem] border-2 border-dashed border-red-200 bg-red-50/30 p-12 text-center space-y-4">
              <p className="text-red-400 text-lg font-medium">
                批改服务暂时不可用
              </p>
              <p className="text-slate-300 text-sm">
                请稍后重试，或检查网络连接
              </p>
            </div>
            <button
              onClick={() => navigate("/upload", { state: { words } })}
              className="rounded-full bg-gradient-to-r from-purple-400 to-pink-400 px-8 py-3 text-white font-bold text-lg shadow-lg shadow-purple-200/50 hover:scale-105 transition-all duration-200"
            >
              ← 重新上传
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== 成功态 — 只展示标注图片 =====
  const imageUrl = annotatedImageUrl || ossImageUrl;

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
        <div className="relative bg-white/30 backdrop-blur-[2px] p-6 md:p-8 text-center space-y-3">
          <h2 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
            批改结果
          </h2>
          {allCorrect ? (
            <span className="inline-block rounded-full bg-green-100 text-green-600 px-4 py-1 text-sm font-bold">
              全对！太棒了！
            </span>
          ) : (
            <span className="inline-block rounded-full bg-red-100 text-red-500 px-4 py-1 text-sm font-bold">
              发现 {summary!.errorCount} 处错误
            </span>
          )}
          <div className="text-xs text-slate-400">
            {summary!.correctChars}/{summary!.totalChars} 字正确 · 正确率 {summary!.accuracyRate}%
          </div>
          {!annotatedImageUrl && (
            <div className="text-xs text-amber-500">
              标注生成失败，显示原图
            </div>
          )}
        </div>
      </div>

      {/* 标注图片 */}
      <div
        className="relative rounded-[2.5rem] shadow-2xl shadow-sky-200/40 overflow-hidden"
        style={{
          backgroundImage: "url('/images/card-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="relative bg-white/30 backdrop-blur-[2px] p-4 md:p-6">
          <img
            src={imageUrl}
            alt="批改结果"
            className="w-full rounded-2xl shadow-md object-contain"
          />
        </div>
      </div>

      {/* 原词列表 */}
      <div className="flex flex-wrap gap-2 justify-center">
        {words.map((w, i) => (
          <span
            key={i}
            className="rounded-full bg-white/70 border border-slate-200 px-3 py-1 text-sm font-medium text-slate-500"
          >
            {w}
          </span>
        ))}
      </div>

      {/* 底部按钮 */}
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
