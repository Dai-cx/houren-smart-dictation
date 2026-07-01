export function MistakeBookPage() {
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
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.4-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0117.5 18.75h-11A2.25 2.25 0 014.25 16.5V6.108c0-1.135.845-2.098 1.976-2.192a47.424 47.424 0 011.124-.08M15 8.25h.008v.008H15V8.25zm-3 0h.008v.008H12V8.25z" />
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
