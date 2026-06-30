import React, { useState, useRef } from "react";
import { Upload, FileText, Trash2, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { PDFFile } from "../types";

interface PDFUploaderProps {
  files: PDFFile[];
  onFilesChange: React.Dispatch<React.SetStateAction<PDFFile[]>>;
}

export default function PDFUploader({ files, onFilesChange }: PDFUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [parsingProgress, setParsingProgress] = useState<{ [key: string]: { current: number; total: number } }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newFileEntry: PDFFile = {
      id,
      name: file.name,
      size: file.size,
      status: 'loading',
    };

    // Append to current list immediately
    onFilesChange(prev => [...prev, newFileEntry]);

    try {
      if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
        throw new Error("Tệp không đúng định dạng PDF. Vui lòng chọn tệp PDF.");
      }

      const pdfjs = (window as any).pdfjsLib;
      if (!pdfjs) {
        throw new Error("Thư viện đọc PDF đang được tải, vui lòng thử lại sau vài giây.");
      }

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;

      setParsingProgress(prev => ({
        ...prev,
        [id]: { current: 0, total: numPages }
      }));

      let extractedText = "";

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        extractedText += pageText + "\n";

        setParsingProgress(prev => ({
          ...prev,
          [id]: { ...prev[id], current: i }
        }));
      }

      // Update the file entry with success
      onFilesChange(prevFiles =>
        prevFiles.map(f =>
          f.id === id
            ? { ...f, status: 'success', text: extractedText }
            : f
        )
      );
    } catch (err: any) {
      console.error("Lỗi đọc PDF:", err);
      onFilesChange(prevFiles =>
        prevFiles.map(f =>
          f.id === id
            ? { ...f, status: 'error', error: err.message || "Không thể phân tích tệp PDF này." }
            : f
        )
      );
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach(processFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      Array.from(e.dataTransfer.files).forEach(processFile);
    }
  };

  const removeFile = (id: string) => {
    onFilesChange(prev => prev.filter(f => f.id !== id));
    setParsingProgress(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1.5">
          <FileText className="h-4 w-4 text-sky-400" /> Tài liệu tham khảo (PDF)
        </label>
        <span className="text-xs text-slate-500 font-medium">
          {files.length} file đã tải
        </span>
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? "border-sky-500 bg-sky-950/20 scale-[0.99]"
            : "border-slate-800 hover:border-sky-500/50 bg-slate-900/20 hover:bg-slate-900/40"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept=".pdf"
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="p-3 bg-slate-900 text-slate-400 rounded-full border border-slate-800 group-hover:text-sky-400 transition-colors">
            <Upload className="h-5 w-5" />
          </div>
          <div className="text-xs font-semibold text-slate-300">
            Kéo thả file PDF tại đây hoặc click để chọn file
          </div>
          <div className="text-[10px] text-slate-500 leading-relaxed max-w-xs mx-auto">
            Hỗ trợ đọc lý thuyết, đề thi, sách giáo khoa Toán
          </div>
        </div>
      </div>

      {/* Files List */}
      {files.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {files.map((file) => {
            const progress = parsingProgress[file.id];
            const isParsing = file.status === 'loading' && progress;

            return (
              <div
                key={file.id}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-900/30 shadow-sm hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                  <div className={`p-2 rounded ${
                    file.status === 'success'
                      ? 'bg-sky-950 text-sky-400 border border-sky-850'
                      : file.status === 'error'
                      ? 'bg-rose-950/30 text-rose-400 border border-rose-950'
                      : 'bg-slate-800 text-slate-500 animate-pulse'
                  }`}>
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-slate-300 truncate">
                      {file.name}
                    </p>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-500 mt-0.5">
                      <span>{formatSize(file.size)}</span>
                      <span>•</span>
                      {file.status === 'success' && (
                        <span className="text-emerald-400 flex items-center">
                          <CheckCircle2 className="h-3 w-3 mr-0.5 inline" /> Đã phân tích
                        </span>
                      )}
                      {file.status === 'error' && (
                        <span className="text-rose-400 flex items-center" title={file.error}>
                          <AlertTriangle className="h-3 w-3 mr-0.5 inline" /> Lỗi đọc
                        </span>
                      )}
                      {file.status === 'loading' && (
                        <span className="text-slate-400 flex items-center">
                          <RefreshCw className="h-2.5 w-2.5 mr-1 inline animate-spin" />
                          {isParsing
                            ? `Đang đọc: trang ${progress.current}/${progress.total}`
                            : "Đang tải..."}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeFile(file.id)}
                  className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded transition-colors ml-2"
                  title="Xóa tệp khỏi danh sách"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
