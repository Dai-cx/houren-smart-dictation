import { useNavigate } from "react-router-dom";

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-2xl pt-12">
      {/* 中央欢迎区域 */}
      <div className="flex flex-col items-center text-center space-y-8">
        {/* 吉祥物大图 */}
        <div className="relative">
          <div
            className="absolute inset-0 rounded-full blur-2xl opacity-30"
            style={{
              background:
                "radial-gradient(circle, rgba(251,207,232,0.6) 0%, rgba(165,243,252,0.4) 50%, transparent 70%)",
              transform: "scale(1.5)",
            }}
          />
          <img
            src="/images/mascot.png"
            alt="吉祥物"
            className="relative w-[150px] h-[150px] object-cover rounded-full shadow-2xl shadow-pink-200/50 ring-4 ring-white/60"
          />
        </div>

        {/* 标题区 */}
        <div className="space-y-3">
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-rose-400 via-pink-400 to-orange-400 bg-clip-text text-transparent leading-tight">
            欢迎来到听写小助手！
          </h1>
          <p className="text-xl md:text-2xl text-slate-400 font-medium">
            让听写变得更有趣~
          </p>
        </div>

        {/* 开始听写按钮 */}
        <button
          onClick={() => navigate("/input")}
          className="group relative rounded-full bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-500 py-5 px-14 text-white font-extrabold text-2xl shadow-2xl shadow-emerald-200/60 hover:scale-105 hover:shadow-emerald-300/70 transition-all duration-300 active:scale-100"
        >
          <span className="relative inline-flex items-center gap-3">
            <svg
              className="w-7 h-7 transition-transform duration-300 group-hover:translate-x-0.5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M8 5.14v14.72a1 1 0 001.5.86l11-7.36a1 1 0 000-1.72l-11-7.36A1 1 0 008 5.14z" />
            </svg>
            开始听写 ▶
          </span>
        </button>
      </div>
    </div>
  );
}
