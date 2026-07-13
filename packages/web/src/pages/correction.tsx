import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { trpc } from "../lib/trpc";

// ==============================
// CorrectionPage — AI 视觉批改（部件级拆解）
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
  const summary = data?.result.summary;
  const isAnomalous = data?.result.anomalous;

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
              <p className="text-slate-300 text-sm">
                拍照上传学生听写纸，系统自动批改
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
              <div className="grid grid-cols-3 gap-4">
                <div className="h-24 bg-white/40 rounded-3xl" />
                <div className="h-24 bg-white/40 rounded-3xl" />
                <div className="h-24 bg-white/40 rounded-3xl" />
              </div>
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

  // ===== 成功态 =====
  const allCorrect = summary!.errorCount === 0;

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
          {allCorrect ? (
            <span className="inline-block rounded-full bg-green-100 text-green-600 px-4 py-1 text-sm font-bold">
              🎉 全对！太棒了！
            </span>
          ) : (
            <span className="inline-block rounded-full bg-red-100 text-red-500 px-4 py-1 text-sm font-bold">
              发现 {summary!.errorCount} 处错误
            </span>
          )}
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-3xl bg-white/50 backdrop-blur-lg border border-white/60 shadow-xl p-6 text-center">
          <div className="text-3xl font-extrabold text-green-500">
            {summary!.correctChars}
          </div>
          <div className="mt-2 text-sm text-slate-400 font-medium">正确字数</div>
        </div>
        <div className="rounded-3xl bg-white/50 backdrop-blur-lg border border-white/60 shadow-xl p-6 text-center">
          <div className="text-3xl font-extrabold text-sky-500">
            {summary!.totalChars}
          </div>
          <div className="mt-2 text-sm text-slate-400 font-medium">总字数</div>
        </div>
        <div className="rounded-3xl bg-white/50 backdrop-blur-lg border border-white/60 shadow-xl p-6 text-center">
          <div className="text-3xl font-extrabold text-orange-500">
            {summary!.accuracyRate}%
          </div>
          <div className="mt-2 text-sm text-slate-400 font-medium">正确率</div>
        </div>
      </div>

      {/* 异常警告 */}
      {isAnomalous && (
        <div className="rounded-2xl bg-yellow-50 border border-yellow-300 p-4 flex items-center gap-3">
          <span className="text-2xl shrink-0">⚠️</span>
          <div>
            <div className="font-bold text-yellow-800">
              批改结果可能存在异常
            </div>
            <div className="text-sm text-yellow-700">
              建议重新上传更清晰的图片重试
            </div>
          </div>
        </div>
      )}

      {/* 原图展示 */}
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
            src={ossImageUrl}
            alt="听写原图"
            className="w-full rounded-2xl shadow-md object-contain bg-purple-50/30"
          />
        </div>
      </div>

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

      {/* 逐词批改卡片 */}
      <div className="space-y-4">
        {data.result.wordResults.map((wr, wordIdx) => (
          <div
            key={wordIdx}
            className="rounded-3xl bg-white/50 backdrop-blur-lg border border-white/60 shadow-xl p-5"
          >
            {/* 词标签 */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm text-slate-400">
                第 {wordIdx + 1} 词
              </span>
              <span className="text-base font-bold text-slate-700">
                {wr.word}
              </span>
              {wr.isCorrect ? (
                <span className="text-green-500 text-sm font-bold ml-auto">
                  ✓ 正确
                </span>
              ) : (
                <span className="text-red-500 text-sm font-bold ml-auto">
                  ✗ 有误
                </span>
              )}
            </div>

            {/* 逐字结果 */}
            <div className="space-y-2">
              {wr.chars.map((cr, ci) => (
                <div
                  key={ci}
                  className={`rounded-xl p-3 text-sm ${
                    cr.isCorrect
                      ? "bg-green-50/70 border border-green-100"
                      : "bg-red-50/70 border border-red-100"
                  }`}
                >
                  {cr.isCorrect ? (
                    <span className="text-green-600 font-medium">
                      {cr.expected} ✓
                    </span>
                  ) : (
                    <div>
                      <span className="text-red-500 font-bold">
                        {cr.expected}
                      </span>
                      <span className="text-slate-400"> → </span>
                      <span className="text-red-500">
                        {cr.written || "（空缺）"}
                      </span>
                      {cr.note && (
                        <p className="text-xs text-slate-500 mt-1">
                          {cr.note}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
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
