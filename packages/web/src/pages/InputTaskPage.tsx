import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";

export default function InputTaskPage() {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [showEmptyWarning, setShowEmptyWarning] = useState(false);

  // 按空格、逗号（中英文）、换行分割，过滤空字符串
  const words = useMemo(
    () =>
      text
        .split(/[\s,，\n]+/)
        .map((w) => w.trim())
        .filter((w) => w !== ""),
    [text],
  );

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setText(e.target.value);
      if (showEmptyWarning) setShowEmptyWarning(false);
    },
    [showEmptyWarning],
  );

  const handleDeleteWord = useCallback((index: number) => {
    setText((prev) => {
      const parsed = prev
        .split(/[\s,，\n]+/)
        .map((w) => w.trim())
        .filter((w) => w !== "");
      parsed.splice(index, 1);
      return parsed.join("\n");
    });
  }, []);

  const handleClear = useCallback(() => {
    setText("");
    setShowEmptyWarning(false);
  }, []);

  const handleStart = useCallback(() => {
    if (words.length === 0) {
      setShowEmptyWarning(true);
      return;
    }
    navigate("/dictation", { state: { words } });
  }, [words, navigate]);

  return (
    <div className="mx-auto max-w-3xl pt-6 space-y-6">
      {/* 卡片区域 */}
      <div
        className="relative rounded-[2.5rem] shadow-2xl shadow-pink-200/40 overflow-hidden"
        style={{
          backgroundImage: "url('/images/card-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="relative bg-white/30 backdrop-blur-xl p-8 md:p-10 space-y-6">
          {/* 标题 */}
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-rose-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              📝 输入词表
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              粘贴老师发的听写词语，自动识别并拆分
            </p>
          </div>

          {/* 文本输入框 */}
          <div className="space-y-2">
            <textarea
              value={text}
              onChange={handleTextChange}
              placeholder="请粘贴听写词语，例如：蝴蝶 蜻蜓 蚂蚁..."
              rows={6}
              className="w-full rounded-2xl border-2 border-dashed border-pink-300 bg-white/70 backdrop-blur p-6 text-slate-700 text-lg placeholder:text-slate-300 resize-none outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100 transition-all"
            />
            {showEmptyWarning && (
              <p className="text-center text-pink-500 text-sm font-medium animate-pulse">
                ⚠️ 请输入听写词语
              </p>
            )}
          </div>

          {/* 实时统计 */}
          <p className="text-center text-slate-400 text-sm font-medium">
            已识别{" "}
            <span className="text-pink-500 font-bold text-lg">
              {words.length}
            </span>{" "}
            个词语
          </p>

          {/* 词语标签展示 */}
          {words.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {words.map((word, i) => (
                <span
                  key={`${word}-${i}`}
                  className="inline-flex items-center gap-1.5 bg-pink-100 text-pink-600 rounded-full px-3 py-1 text-sm font-medium"
                >
                  {word}
                  <button
                    onClick={() => handleDeleteWord(i)}
                    className="text-xs leading-none hover:scale-125 transition-transform"
                    title={`删除「${word}」`}
                  >
                    ❌
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* 按钮组 */}
          <div className="flex gap-4 justify-center pt-2">
            <button
              onClick={handleClear}
              disabled={words.length === 0}
              className="rounded-full bg-gray-200 px-8 py-3 text-gray-500 font-bold text-lg shadow-md hover:bg-gray-300 hover:scale-105 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              清空
            </button>
            <button
              onClick={handleStart}
              className="rounded-full bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-500 px-10 py-3.5 text-white font-extrabold text-xl shadow-xl shadow-emerald-200/50 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-200/60 transition-all duration-200"
            >
              开始听写
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
