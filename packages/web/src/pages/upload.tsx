export function PhotoUploadPage() {
  return (
    <div className="mx-auto max-w-2xl pt-6 space-y-6">
      <div
        className="relative rounded-[2.5rem] shadow-2xl shadow-purple-200/40 overflow-hidden"
        style={{
          backgroundImage: "url('/images/card-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="relative bg-white/30 backdrop-blur-[2px] p-8 md:p-10 text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            拍照上传
          </h2>
          <p className="text-slate-500 text-lg font-medium">
            拍摄或上传学生听写纸的照片，系统将自动识别手写内容。
          </p>
        </div>
      </div>

      <div className="rounded-3xl bg-white/50 backdrop-blur-lg border border-white/60 shadow-xl">
        <div className="rounded-[1.5rem] border-2 border-dashed border-purple-200 bg-purple-50/30 m-4 p-12 text-center">
          <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-lg shadow-purple-200/50">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
          </div>
          <p className="mt-4 text-purple-500 font-bold text-lg">
            点击拍照或拖拽上传照片
          </p>
        </div>
      </div>
    </div>
  );
}
