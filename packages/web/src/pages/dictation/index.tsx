import { useState, useCallback, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { trpc } from "@/lib/trpc";

export function DictationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const words: string[] = location.state?.words ?? [];

  // ---- playback state ----
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ---- settings ----
  const [speechRate, setSpeechRate] = useState(0); // -500 ~ 500
  const [interval, setInterval] = useState(8000); // ms

  // ---- refs for values accessed inside effects ----
  const intervalRef = useRef(interval);
  intervalRef.current = interval;
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const trpcUtils = trpc.useUtils();

  // stop any active audio
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
  }, []);

  // ---- playback loop (effect-driven) ----
  useEffect(() => {
    if (!isPlaying) return;
    if (currentIndex >= words.length) {
      setIsPlaying(false);
      return;
    }

    let cancelled = false;

    const playWord = async () => {
      setIsLoadingAudio(true);
      setErrorMsg(null);

      try {
        // fetch / reuse cached audio via tRPC (React Query dedupes same input)
        const result = await trpcUtils.tts.synthesize.fetch({
          text: words[currentIndex],
          speechRate,
          format: "mp3",
        });
        if (cancelled) return;

        // pre-fetch next word in background (don't block)
        const nextIdx = currentIndex + 1;
        if (nextIdx < words.length) {
          trpcUtils.tts.synthesize
            .fetch({ text: words[nextIdx], speechRate, format: "mp3" })
            .catch(() => {
              /* non-critical */
            });
        }

        const dataUri = `data:audio/${result.format};base64,${result.audioBase64}`;
        const audio = new Audio(dataUri);
        audioRef.current = audio;
        setIsLoadingAudio(false);

        // wait for playback to finish
        const playedOk = await new Promise<boolean>((resolve) => {
          audio.onended = () => resolve(true);
          audio.onerror = () => resolve(false);
          audio.play().catch(() => resolve(false));
        });
        if (cancelled) return;

        if (!playedOk) {
          setErrorMsg("音频播放失败，请重试");
          setIsPlaying(false);
          return;
        }

        // pause between words
        await new Promise<void>((r) => setTimeout(r, intervalRef.current));
        if (cancelled) return;

        // advance
        if (currentIndex < words.length - 1) {
          setCurrentIndex((i) => i + 1);
        } else {
          setIsPlaying(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("TTS error:", err);
          setErrorMsg("语音合成失败，请检查网络后重试");
          setIsPlaying(false);
          setIsLoadingAudio(false);
        }
      }
    };

    playWord();

    return () => {
      cancelled = true;
    };
  }, [currentIndex, isPlaying, speechRate, words, trpcUtils]);

  // ---- user actions ----

  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      stopAudio();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
    }
  }, [isPlaying, stopAudio]);

  const handlePrev = useCallback(() => {
    stopAudio();
    setIsPlaying(false);
    setErrorMsg(null);
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, [stopAudio]);

  const handleNext = useCallback(() => {
    stopAudio();
    setIsPlaying(false);
    setErrorMsg(null);
    setCurrentIndex((i) => Math.min(words.length - 1, i + 1));
  }, [stopAudio, words.length]);

  const handleFinish = useCallback(() => {
    stopAudio();
    navigate("/upload", { state: { words } });
  }, [stopAudio, words, navigate]);

  // ---- cleanup on unmount ----
  useEffect(() => {
    return () => stopAudio();
  }, [stopAudio]);

  // ---- computed ----
  const rateLabel = (() => {
    const mul = Math.pow(2, speechRate / 500);
    return `${mul.toFixed(1)}x`;
  })();

  // ===== empty state =====
  if (words.length === 0) {
    return (
      <div className="mx-auto max-w-2xl pt-6 space-y-6">
        <div
          className="relative rounded-[2.5rem] shadow-2xl shadow-sky-200/40 overflow-hidden"
          style={{
            backgroundImage: "url('/images/card-bg.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="relative bg-white/30 backdrop-blur-[2px] p-8 md:p-10 text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">
              语音播报
            </h2>

            <div className="rounded-[1.5rem] border-2 border-dashed border-sky-200 bg-sky-50/30 p-12 text-center space-y-4">
              <p className="text-slate-400 text-lg font-medium">请先输入词语</p>
              <p className="text-slate-300 text-sm">
                在词表输入页面添加听写内容后再开始
              </p>
            </div>

            <button
              onClick={() => navigate("/input")}
              className="rounded-full bg-gradient-to-r from-pink-400 to-rose-400 px-8 py-3 text-white font-bold text-lg shadow-lg shadow-pink-200/50 hover:scale-105 transition-all duration-200"
            >
              ← 去输入词表
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== playback state =====
  const currentWord = words[currentIndex];

  return (
    <div className="mx-auto max-w-3xl pt-6 space-y-6">
      {/* ────────── 主卡片 ────────── */}
      <div
        className="relative rounded-[2.5rem] shadow-2xl shadow-sky-200/40 overflow-hidden"
        style={{
          backgroundImage: "url('/images/card-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="relative bg-white/30 backdrop-blur-[2px] p-8 md:p-10 space-y-6">
          {/* 标题 */}
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">
              语音播报
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              共 {words.length} 个词语 · 第 {currentIndex + 1} 个
            </p>
          </div>

          {/* 当前播报词语 + loading overlay */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-3xl blur-xl opacity-40 bg-gradient-to-r from-sky-300 to-blue-400" />
              <div className="relative rounded-3xl bg-white/80 backdrop-blur border-2 border-sky-200 px-10 py-6 text-center shadow-lg min-w-[200px]">
                <p className="text-5xl font-extrabold text-sky-600 tracking-widest">
                  {currentWord}
                </p>
                {isLoadingAudio && (
                  <div className="absolute inset-0 rounded-3xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-sky-300 border-t-sky-500 rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* error message */}
          {errorMsg && (
            <p className="text-center text-amber-500 text-sm font-medium">
              {errorMsg}
            </p>
          )}

          {/* 播报控制按钮 */}
          <div className="flex items-center justify-center gap-4">
            {/* 上一个 */}
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="w-12 h-12 rounded-full bg-white/70 border border-sky-200 flex items-center justify-center text-sky-500 shadow-md hover:scale-110 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
              title="上一个"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>

            {/* 播放 / 暂停 */}
            <button
              onClick={handleTogglePlay}
              className="w-16 h-16 rounded-full bg-gradient-to-r from-sky-400 to-blue-500 flex items-center justify-center text-white shadow-xl shadow-sky-200/50 hover:scale-110 transition-all duration-200"
              title={isPlaying ? "暂停" : "播放"}
            >
              {isPlaying ? (
                <svg
                  className="w-7 h-7"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
                </svg>
              ) : (
                <svg
                  className="w-7 h-7 ml-0.5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M8 5.14v14.72a1 1 0 001.5.86l11-7.36a1 1 0 000-1.72l-11-7.36A1 1 0 008 5.14z" />
                </svg>
              )}
            </button>

            {/* 下一个 */}
            <button
              onClick={handleNext}
              disabled={currentIndex === words.length - 1}
              className="w-12 h-12 rounded-full bg-white/70 border border-sky-200 flex items-center justify-center text-sky-500 shadow-md hover:scale-110 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
              title="下一个"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>
          </div>

          {/* 词表一览 */}
          <div className="flex flex-wrap gap-2 justify-center">
            {words.map((w, i) => (
              <button
                key={`${w}-${i}`}
                onClick={() => {
                  stopAudio();
                  setIsPlaying(false);
                  setErrorMsg(null);
                  setCurrentIndex(i);
                }}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-200 hover:scale-105 ${
                  i === currentIndex
                    ? "bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-lg shadow-sky-200/50"
                    : i < currentIndex
                      ? "bg-green-100 text-green-600 border border-green-200"
                      : "bg-white/70 text-slate-500 border border-slate-200"
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ────────── 播报设置卡片 ────────── */}
      <div
        className="relative rounded-[2.5rem] shadow-2xl shadow-amber-200/40 overflow-hidden"
        style={{
          backgroundImage: "url('/images/card-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="relative bg-white/30 backdrop-blur-[2px] p-6 md:p-8 space-y-5">
          <h3 className="text-center text-lg font-bold text-amber-600">
            播报设置
          </h3>

          {/* 语速 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-500">
              <span>语速</span>
              <span className="font-medium text-amber-600">{rateLabel}</span>
            </div>
            <input
              type="range"
              min={-500}
              max={500}
              step={50}
              value={speechRate}
              onChange={(e) => setSpeechRate(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer accent-amber-500"
              style={{
                background:
                  "linear-gradient(to right, #86efac, #fde68a, #fca5a5)",
              }}
            />
            <div className="flex justify-between text-xs text-slate-400">
              <span>0.5x</span>
              <span>1.0x</span>
              <span>2.0x</span>
            </div>
          </div>

          {/* 词语间隔 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-500">
              <span>词语间隔</span>
              <span className="font-medium text-amber-600">
                {interval / 1000}s
              </span>
            </div>
            <input
              type="range"
              min={3000}
              max={15000}
              step={1000}
              value={interval}
              onChange={(e) => setInterval(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer accent-blue-500"
              style={{
                background: "linear-gradient(to right, #bae6fd, #3b82f6)",
              }}
            />
            <div className="flex justify-between text-xs text-slate-400">
              <span>3s</span>
              <span>8s</span>
              <span>15s</span>
            </div>
          </div>
        </div>
      </div>

      {/* ────────── 完成听写按钮 ────────── */}
      <div className="flex justify-center">
        <button
          onClick={handleFinish}
          className="rounded-2xl bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-500 px-12 h-[60px] text-white font-bold text-xl shadow-2xl shadow-emerald-200/60 hover:scale-105 hover:shadow-emerald-300/70 transition-all duration-300 inline-flex items-center gap-2"
        >
          完成听写
        </button>
      </div>
    </div>
  );
}
