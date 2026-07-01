import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";

export default function InputTaskPage() {
  const navigate = useNavigate();
  const [text, setText] = useState("");

  // 按行分割，过滤空行和纯空格行
  const words = useMemo(
    () => text.split("\n").filter((w) => w.trim() !== ""),
    [text]
  );

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setText(e.target.value);
    },
    []
  );

  const handleDeleteWord = useCallback(
    (index: number) => {
      setText((prev) => {
        const lines = prev.split("\n").filter((w) => w.trim() !== "");
        lines.splice(index, 1);
        return lines.join("\n");
      });
    },
    []
  );

  const handleClear = useCallback(() => {
    setText("");
  }, []);

  const handleGo = useCallback(() => {
    if (words.length === 0) return;
    navigate("/dictation", { state: { words } });
  }, [words, navigate]);

  return (
    <div className="mx-auto max-w-3xl pt-6 space-y-6">
      {/* 卡片区域 */}
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
            <h2 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-rose-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              📋 输入听写任务
            </h2>
          </div>

          {/* 文本输入框 */}
          <textarea
            value={text}
            onChange={handleTextChange}
            placeholder="请输入要听写的词语，每行一个词语..."
            rows={5}
            className="w-full rounded-[1.5rem] border-2 border-dashed border-pink-300 bg-white/70 backdrop-blur p-5 text-slate-700 text-lg placeholder:text-slate-300 resize-none outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100 transition-all"
          />

          {/* 实时统计 */}
          <p className="text-center text-slate-400 text-sm font-medium">
            已输入{" "}
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
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/80 border border-pink-200 px-3.5 py-1.5 text-sm font-medium text-slate-600 shadow-sm hover:shadow-md transition-all group"
                >
                  {word}
                  <button
                    onClick={() => handleDeleteWord(i)}
                    className="w-4 h-4 rounded-full bg-pink-200 text-pink-500 flex items-center justify-center text-xs leading-none hover:bg-pink-400 hover:text-white transition-colors"
                    title={`删除「${word}」`}
                  >
                    ×
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
              onClick={handleGo}
              disabled={words.length === 0}
              className="rounded-full bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500 px-10 py-3.5 text-white font-extrabold text-xl shadow-xl shadow-orange-200/50 hover:scale-105 hover:shadow-2xl hover:shadow-orange-200/60 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              go go go 🚀
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
