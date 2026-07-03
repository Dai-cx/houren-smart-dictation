import { useState, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { trpc } from "@/lib/trpc";

function compressImage(
  file: File,
): Promise<{ dataUrl: string; base64: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1920;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
        resolve({ dataUrl, base64 });
      };
      img.onerror = () => reject(new Error("图片加载失败"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsDataURL(file);
  });
}

export function PhotoUploadPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const words: string[] = location.state?.words ?? [];

  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const recognizeMutation = trpc.ocr.recognize.useMutation({
    onSuccess: (data) => {
      navigate("/correction", {
        state: { words, recognizedText: data.recognizedText, ossImageUrl: data.ossImageUrl },
      });
    },
    onError: (err) => {
      setError(err.message || "识别失败，请重试");
    },
  });

  const processFile = useCallback(async (file: File) => {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("请选择图片文件");
      return;
    }
    try {
      const { dataUrl, base64 } = await compressImage(file);
      setImageDataUrl(dataUrl);
      setImageBase64(base64);
    } catch {
      setError("图片处理失败，请重试");
    }
  }, []);

  // file input change
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      // reset so the same file can be re-selected
      e.target.value = "";
    },
    [processFile],
  );

  // drag & drop
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
    },
    [],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleSubmit = useCallback(() => {
    if (!imageBase64) return;
    setError(null);
    recognizeMutation.mutate({ imageBase64 });
  }, [imageBase64, recognizeMutation]);

  const handleReset = useCallback(() => {
    setImageDataUrl(null);
    setImageBase64(null);
    setError(null);
  }, []);

  // ===== empty state =====
  if (words.length === 0) {
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
          <div className="relative bg-white/30 backdrop-blur-[2px] p-8 md:p-10 text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              拍照上传
            </h2>
            <div className="rounded-[1.5rem] border-2 border-dashed border-purple-200 bg-purple-50/30 p-12 text-center space-y-4">
              <p className="text-slate-400 text-lg font-medium">
                请先输入词语
              </p>
              <p className="text-slate-300 text-sm">
                在词表输入页面添加听写内容后再上传批改
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

  // ===== main state =====
  const isProcessing = recognizeMutation.isPending;

  return (
    <div className="mx-auto max-w-2xl pt-6 space-y-6">
      {/* 标题卡片 */}
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
          <p className="text-slate-500 text-sm">
            共 {words.length} 个词语待批改
          </p>
        </div>
      </div>

      {/* 上传区 / 预览 */}
      <div className="rounded-3xl bg-white/50 backdrop-blur-lg border border-white/60 shadow-xl overflow-hidden">
        {imageDataUrl ? (
          /* ── 图片预览 ── */
          <div className="p-4 space-y-4">
            <img
              src={imageDataUrl}
              alt="上传预览"
              className="w-full rounded-2xl shadow-md object-contain max-h-80 bg-purple-50/30"
            />
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleReset}
                disabled={isProcessing}
                className="rounded-full bg-gray-200 px-6 py-2 text-gray-500 font-semibold text-sm hover:bg-gray-300 transition-colors disabled:opacity-40"
              >
                重新选择
              </button>
              <button
                onClick={handleSubmit}
                disabled={isProcessing}
                className="rounded-full bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-500 px-8 py-2.5 text-white font-bold text-base shadow-lg shadow-emerald-200/50 hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100 inline-flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    识别中...
                  </>
                ) : (
                  "开始识别"
                )}
              </button>
            </div>
          </div>
        ) : (
          /* ── 上传区 ── */
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`m-4 rounded-[1.5rem] border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-200 ${
              isDragOver
                ? "border-purple-400 bg-purple-100/50 scale-[1.02]"
                : "border-purple-200 bg-purple-50/30 hover:bg-purple-50/50"
            }`}
          >
            <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-lg shadow-purple-200/50">
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
                  d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
                />
              </svg>
            </div>
            <p className="mt-4 text-purple-500 font-bold text-lg">
              点击或拖拽上传照片
            </p>
            <p className="mt-1 text-slate-400 text-sm">
              支持 JPG、PNG 格式
            </p>
          </div>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <p className="text-center text-amber-500 text-sm font-medium">
          {error}
        </p>
      )}

      {/* hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
