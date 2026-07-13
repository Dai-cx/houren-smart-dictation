import { useState } from "react";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = "smart-dictation-mistakes";

function loadMistakes(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function saveMistakes(words: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
}

export function MistakeBookPage() {
  const navigate = useNavigate();

  const [mistakeWords, setMistakeWords] = useState<string[]>(loadMistakes);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // ---- handlers ----

  const removeWord = (index: number) => {
    const next = mistakeWords.filter((_, i) => i !== index);
    setMistakeWords(next);
    saveMistakes(next);
    // 如果移除的词已被选中，取消选中
    setSelected((prev) => {
      const nextSet = new Set(prev);
      nextSet.delete(index);
      // 调整后续索引（所有 > index 的索引减 1）
      const adjusted = new Set<number>();
      for (const i of nextSet) {
        adjusted.add(i > index ? i - 1 : i);
      }
      return adjusted;
    });
  };

  const toggleSelect = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const enterSelectMode = () => {
    setSelectMode(true);
    setSelected(new Set());
  };

  const cancelSelect = () => {
    setSelectMode(false);
    setSelected(new Set());
  };

  const confirmDictation = () => {
    const words = [...selected]
      .sort((a, b) => a - b)
      .map((i) => mistakeWords[i]);
    setSelectMode(false);
    setSelected(new Set());
    navigate("/dictation", { state: { words, from: "mistakes" } });
  };

  // ---- empty state ----
  if (mistakeWords.length === 0) {
    return (
      <div className="mx-auto max-w-2xl pt-6 space-y-6">
        <div
          className="relative rounded-[2.5rem] shadow-2xl shadow-amber-200/40 overflow-hidden"
          style={{
            backgroundImage: "url('/images/card-bg.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="relative bg-white/30 backdrop-blur-[2px] p-8 md:p-10 text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              错题本
            </h2>
            <p className="text-slate-500 text-lg font-medium">
              自动收录每次听写中的错字错词，支持反复复习和强化练习。
            </p>
          </div>
        </div>

        <div className="rounded-3xl bg-white/50 backdrop-blur-lg border border-white/60 shadow-xl">
          <div className="rounded-[1.5rem] border-2 border-dashed border-amber-200 bg-amber-50/30 m-4 p-8 text-center">
            <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-amber-300 to-orange-400 flex items-center justify-center shadow-lg shadow-amber-200/50">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.4-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0117.5 18.75h-11A2.25 2.25 0 014.25 16.5V6.108c0-1.135.845-2.098 1.976-2.192a47.424 47.424 0 011.124-.08M15 8.25h.008v.008H15V8.25zm-3 0h.008v.008H12V8.25z"
                />
              </svg>
            </div>
            <p className="mt-4 text-amber-500 font-bold text-lg">
              还没有错题记录，继续加油！
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ---- main state ----
  return (
    <div className="mx-auto max-w-3xl pt-6 space-y-6">
      {/* 标题卡片 */}
      <div
        className="relative rounded-[2.5rem] shadow-2xl shadow-amber-200/40 overflow-hidden"
        style={{
          backgroundImage: "url('/images/card-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="relative bg-white/30 backdrop-blur-[2px] p-6 md:p-8 text-center space-y-3">
          <h2 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            错题本
          </h2>
          <p className="text-slate-400 text-sm">
            {selectMode
              ? `已选择 ${selected.size} 个词`
              : `共 ${mistakeWords.length} 个错词`}
          </p>
        </div>
      </div>

      {/* 错词列表 */}
      <div
        className="relative rounded-[2.5rem] shadow-2xl shadow-amber-200/40 overflow-hidden"
        style={{
          backgroundImage: "url('/images/card-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="relative bg-white/30 backdrop-blur-[2px] p-6 md:p-8">
          <div className="flex flex-wrap gap-3 justify-center">
            {mistakeWords.map((word, i) => {
              const isSelected = selected.has(i);
              return (
                <span
                  key={`${word}-${i}`}
                  onClick={() => selectMode && toggleSelect(i)}
                  className={`relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-all duration-200 ${
                    selectMode
                      ? isSelected
                        ? "bg-pink-100 text-pink-600 border-2 border-pink-300 ring-2 ring-pink-200 cursor-pointer shadow-md"
                        : "bg-white/60 text-slate-400 border-2 border-slate-200 cursor-pointer hover:border-pink-200 hover:text-pink-500"
                      : "bg-amber-100 text-amber-700 pr-7"
                  }`}
                >
                  {word}
                  {!selectMode && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeWord(i);
                      }}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-400 text-white text-xs flex items-center justify-center hover:bg-red-500 hover:scale-110 transition-all duration-200 shadow-md"
                      title={`移除「${word}」`}
                    >
                      ×
                    </button>
                  )}
                  {selectMode && isSelected && (
                    <svg
                      className="w-4 h-4 text-pink-500"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* 底部操作区 */}
      <div className="flex justify-end gap-3 pb-6">
        {selectMode ? (
          <>
            <button
              onClick={cancelSelect}
              className="rounded-full bg-gray-200 px-6 py-3 text-gray-500 font-semibold text-sm hover:bg-gray-300 transition-colors"
            >
              取消
            </button>
            <button
              onClick={confirmDictation}
              disabled={selected.size === 0}
              className="rounded-full bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-500 px-8 py-3 text-white font-bold text-base shadow-lg shadow-emerald-200/50 hover:scale-105 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              确定({selected.size})
            </button>
          </>
        ) : (
          <button
            onClick={enterSelectMode}
            disabled={mistakeWords.length === 0}
            className="rounded-full bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-500 px-8 py-3 text-white font-bold text-base shadow-lg shadow-emerald-200/50 hover:scale-105 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            再次听写
          </button>
        )}
      </div>
    </div>
  );
}
