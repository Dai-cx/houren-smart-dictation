export function CorrectionPage() {
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
        <div className="relative bg-white/30 backdrop-blur-[2px] p-8 md:p-10 text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
            批改结果
          </h2>
          <p className="text-slate-500 text-lg font-medium">
            查看智能批改结果，包括正确字数、错误标注和成绩统计。
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "正确字数", value: "--", color: "text-green-500" },
          { label: "总字数", value: "--", color: "text-sky-500" },
          { label: "正确率", value: "--%", color: "text-orange-500" },
        ].map((stat) => (
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
    </div>
  );
}
