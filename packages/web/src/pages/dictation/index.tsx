import { useState, useCallback, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export function DictationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const words: string[] = location.state?.words ?? [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // 播放当前词语
  const speak = useCallback(
    (index: number) => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(words[index]);
      utterance.lang = "zh-CN";
      utterance.rate = 0.9;
      utterance.pitch = 1.1;

      utterance.onend = () => {
        if (index < words.length - 1) {
          const next = index + 1;
          setCurrentIndex(next);
          speak(next);
        } else {
          setIsPlaying(false);
        }
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [words]
  );

  // 开始 / 暂停
  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      speak(currentIndex);
    }
  }, [isPlaying, currentIndex, speak]);

  // 上一个
  const handlePrev = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  // 下一个
  const handleNext = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setCurrentIndex((i) => Math.min(words.length - 1, i + 1));
  }, [words.length]);

  // 完成听写
  const handleFinish = useCallback(() => {
    window.speechSynthesis.cancel();
    navigate("/upload", { state: { words } });
  }, [words, navigate]);

  // 组件卸载时取消播报
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // ===== 无数据状态 =====
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
              <p className="text-slate-400 text-lg font-medium">
                请先输入词语
              </p>
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

  // ===== 播报状态 =====
  const currentWord = words[currentIndex];

  return (
    <div className="mx-auto max-w-3xl pt-6 space-y-6">
      {/* 主卡片 */}
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

          {/* 当前播报词语 */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-3xl blur-xl opacity-40 bg-gradient-to-r from-sky-300 to-blue-400" />
              <div className="relative rounded-3xl bg-white/80 backdrop-blur border-2 border-sky-200 px-10 py-6 text-center shadow-lg min-w-[200px]">
                <p className="text-5xl font-extrabold text-sky-600 tracking-widest">
                  {currentWord}
                </p>
              </div>
            </div>
          </div>

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
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
                </svg>
              ) : (
                <svg className="w-7 h-7 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
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
                  window.speechSynthesis.cancel();
                  setIsPlaying(false);
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

      {/* 完成听写按钮 */}
      <div className="flex justify-center">
        <button
          onClick={handleFinish}
          className="rounded-2xl bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-500 px-12 h-[60px] text-white font-bold text-xl shadow-2xl shadow-emerald-200/60 hover:scale-105 hover:shadow-emerald-300/70 transition-all duration-300 inline-flex items-center gap-2"
        >
          完成听写 ✅
        </button>
      </div>
    </div>
  );
}
