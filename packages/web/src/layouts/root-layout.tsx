import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const stepLabels: Record<string, string> = {
  "/": "🏠 首页",
  "/input": "📝 词表输入",
  "/dictation": "🔊 语音播报",
  "/upload": "📷 拍照上传",
  "/correction": "✅ 批改结果",
  "/mistakes": "📖 错题本",
};

const backTargets: Record<string, string> = {
  "/input": "/",
  "/dictation": "/input",
  "/upload": "/input",
  "/correction": "/upload",
  "/mistakes": "/",
};

export function RootLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentStep =
    stepLabels[location.pathname] ?? stepLabels["/"];
  const backTo = backTargets[location.pathname];
  const isHome = location.pathname === "/";

  return (
    <div className="relative min-h-screen">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-50 px-4 pt-3 pb-2">
        <div className="mx-auto max-w-5xl rounded-full bg-white/50 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5">
          <div className="flex items-center justify-between px-4 py-2">
            {/* 左侧：返回按钮 + 吉祥物 + 标题 */}
            <div className="flex items-center gap-2 shrink-0">
              {!isHome && backTo && (
                <button
                  onClick={() => navigate(backTo)}
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-white/70 border border-pink-200 text-pink-400 shadow-md hover:scale-110 hover:bg-pink-50 hover:border-pink-300 hover:text-pink-500 transition-all duration-200"
                  title="返回"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <img
                src="/images/mascot.png"
                alt="吉祥物"
                className="w-10 h-10 rounded-full object-cover shadow-md"
              />
              <span className="text-base font-extrabold bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent whitespace-nowrap">
                听写小助手
              </span>
            </div>

            {/* 中间：当前步骤名称（纯文字，不可点击） */}
            <span className="text-sm font-semibold text-slate-400 select-none">
              {currentStep}
            </span>

            {/* 右侧：错题本按钮 */}
            <NavLink
              to="/mistakes"
              className={({ isActive }) =>
                cn(
                  "rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200 shrink-0",
                  "hover:scale-105 hover:shadow-lg",
                  isActive
                    ? "bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-lg shadow-pink-200/50"
                    : "text-slate-500 hover:text-slate-700 hover:bg-white/70"
                )
              }
            >
              📖 错题本
            </NavLink>
          </div>
        </div>
      </header>

      {/* 页面内容 */}
      <main className="relative px-4 pb-12">
        <Outlet />
      </main>
    </div>
  );
}
