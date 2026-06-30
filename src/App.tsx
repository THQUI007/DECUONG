import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Copy, 
  Check, 
  Play, 
  Edit3, 
  Eye, 
  Download, 
  BookOpen, 
  RefreshCw,
  HelpCircle,
  FileText,
  AlertCircle
} from "lucide-react";
import PDFUploader from "./components/PDFUploader";
import ConfigForm from "./components/ConfigForm";
import { PDFFile, OutlineConfig } from "./types";
import { exportToDocx } from "./components/DocxExporter";

const INSPIRATIONAL_QUOTES = [
  "Toán học là âm nhạc của tư duy. – James Joseph Sylvester",
  "Bản chất của toán học không phải là làm cho những điều đơn giản trở nên phức tạp, mà là làm cho những điều phức tạp trở nên đơn giản. – S. Gudder",
  "Trong toán học, nghệ thuật đặt câu hỏi có giá trị hơn việc giải quyết chúng. – Georg Cantor",
  "Toán học là cánh cửa và là chìa khóa để đi vào các ngành khoa học. – Roger Bacon",
  "Đừng lo lắng về khó khăn của bạn trong toán học. Tôi có thể đảm bảo với bạn rằng những khó khăn của tôi còn lớn hơn nhiều. – Albert Einstein"
];

const LOADING_STATUSES = [
  "Đang phân tích và đối chiếu nội dung các file PDF...",
  "Đang lọc bỏ các phần trùng lặp giữa các tài liệu...",
  "Đang nhận diện các định lý, công thức trọng tâm...",
  "Đang tóm tắt lý thuyết cốt lõi sư phạm...",
  "Đang biên soạn phương pháp giải chi tiết cho từng dạng toán...",
  "Đang tạo các ví dụ minh họa kèm lời giải mẫu chi tiết...",
  "Đang biên tập hệ thống bài tập tự luyện từ Nhận biết đến Vận dụng cao...",
  "Đang tổng hợp bài tập tổng hợp bao phủ toàn bộ chương học...",
  "Đang thiết lập bảng đáp án và giải chi tiết các câu khó..."
];

export default function App() {
  // App states
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [config, setConfig] = useState<OutlineConfig>({
    chapterName: "",
    gradeLevel: "11",
    exampleCountMin: 1,
    exampleCountMax: 3,
    exerciseCountMin: 5,
    exerciseCountMax: 15,
    exerciseCountPerType: 5,
    difficultyLevels: ["Nhận biết", "Thông hiểu", "Vận dụng"],
    supplementFromInternet: true,
    hasAnswers: true
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [generationError, setGenerationError] = useState<string | null>(null);
  
  const [outlineText, setOutlineText] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"preview" | "edit">("preview");
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Interval for changing loading statuses and quotes during generation
  useEffect(() => {
    let statusInterval: NodeJS.Timeout;
    let quoteInterval: NodeJS.Timeout;

    if (isGenerating) {
      statusInterval = setInterval(() => {
        setCurrentStatusIndex((prev) => (prev + 1) % LOADING_STATUSES.length);
      }, 3500);

      quoteInterval = setInterval(() => {
        setCurrentQuoteIndex((prev) => (prev + 1) % INSPIRATIONAL_QUOTES.length);
      }, 5500);
    } else {
      setCurrentStatusIndex(0);
      setCurrentQuoteIndex(0);
    }

    return () => {
      clearInterval(statusInterval);
      clearInterval(quoteInterval);
    };
  }, [isGenerating]);

  // Typeset MathJax equations when preview output changes or when active tab switches
  useEffect(() => {
    if (activeTab === "preview" && outlineText) {
      // Small timeout to ensure the DOM is updated before running MathJax
      const timer = setTimeout(() => {
        const mathjax = (window as any).MathJax;
        if (mathjax && mathjax.typesetPromise) {
          mathjax.typesetPromise([previewContainerRef.current]).catch((err: any) => {
            console.error("MathJax typesetting error:", err);
          });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [outlineText, activeTab]);

  // Handles copying to clipboard
  const handleCopy = async () => {
    if (!outlineText) return;
    try {
      await navigator.clipboard.writeText(outlineText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Lỗi khi sao chép:", err);
    }
  };

  // Handles Word (.docx) export
  const handleExportWord = async () => {
    if (!outlineText) return;
    setIsExporting(true);
    try {
      const docTitle = config.chapterName 
        ? `De_cuong_on_tap_${config.chapterName.replace(/\s+/g, "_")}`
        : `De_cuong_on_tap_Chuong_Toan_Lop_${config.gradeLevel}`;

      const blob = await exportToDocx(config.chapterName || "Đề cương ôn tập Toán", outlineText);
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${docTitle}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Lỗi xuất file Word:", err);
      alert("Đã xảy ra lỗi khi tạo file Word: " + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Handles submitting and generating outline
  const handleGenerate = async () => {
    setGenerationError(null);
    setIsGenerating(true);

    try {
      // Gather successfully parsed text from files
      const parsedTexts = files
        .filter(f => f.status === 'success' && f.text)
        .map(f => f.text as string);

      const response = await fetch("/api/generate-outline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          pdfTexts: parsedTexts,
          chapterName: config.chapterName,
          gradeLevel: config.gradeLevel,
          exampleCountMin: config.exampleCountMin,
          exampleCountMax: config.exampleCountMax,
          exerciseCountMin: config.exerciseCountMin,
          exerciseCountMax: config.exerciseCountMax,
          exerciseCountPerType: config.exerciseCountPerType,
          difficultyLevels: config.difficultyLevels,
          supplementFromInternet: config.supplementFromInternet,
          hasAnswers: config.hasAnswers
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Không thể kết nối với máy chủ AI.");
      }

      setOutlineText(data.outlineText);
      setActiveTab("preview");
    } catch (err: any) {
      console.error("Lỗi tạo đề cương:", err);
      setGenerationError(err.message || "Đã xảy ra lỗi không mong muốn khi liên hệ với mô hình AI.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper renderer to parse outline markdown lines into safe HTML paragraphs
  const renderHTMLContent = () => {
    if (!outlineText) return "";
    
    return outlineText
      .split("\n")
      .map((line, idx) => {
        let trimmed = line.trim();
        if (!trimmed) return '<div class="h-4"></div>';
        
        // Headers Matchers
        const romanMatch = trimmed.match(/^(I|II|III|IV|V|VI|VII|VIII|IX|X)\.\s+(.*)/);
        const hashMatch = trimmed.match(/^#+\s+(.*)/);
        
        if (romanMatch) {
          return `<h2 class="text-lg font-bold text-slate-900 uppercase mt-8 mb-4 border-b-2 border-slate-900 pb-1 flex items-center select-all">${romanMatch[0]}</h2>`;
        }
        
        if (hashMatch) {
          return `<h3 class="text-base font-bold text-slate-800 mt-6 mb-3 border-l-4 border-slate-800 pl-2.5">${hashMatch[1]}</h3>`;
        }

        // Exercise Formats: "Dạng 1:" or "**Dạng 1:**"
        if (trimmed.startsWith("Dạng ") || trimmed.startsWith("**Dạng ")) {
          let clean = trimmed.replace(/\*\*/g, "");
          return `<h4 class="text-sm font-bold text-slate-800 mt-4 mb-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded select-all italic">${clean}</h4>`;
        }

        // Subheaders "1. Phương pháp giải" or similar
        if (trimmed.match(/^\d+\.\s+/)) {
          let clean = trimmed.replace(/\*\*/g, "");
          return `<h5 class="text-sm font-bold text-slate-800 mt-3 mb-1.5 flex items-center"><span class="inline-block w-1.5 h-1.5 bg-sky-500 rounded-full mr-2"></span>${clean}</h5>`;
        }

        // Bullets
        if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
          let content = trimmed.substring(1).trim();
          let boldParsed = content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
          return `<li class="ml-6 list-disc text-slate-700 text-sm py-1 leading-relaxed">${boldParsed}</li>`;
        }

        // Regular text
        let boldParsed = trimmed.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        return `<p class="text-slate-700 text-sm leading-relaxed mb-2">${boldParsed}</p>`;
      })
      .join("");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans border-t-4 border-sky-500 overflow-x-hidden">
      {/* Header */}
      <header className="h-16 border-b border-slate-900 bg-slate-950/60 sticky top-0 z-10 backdrop-blur-md px-4 md:px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-sky-500 rounded-lg flex items-center justify-center shadow-lg shadow-sky-500/20 text-white">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm md:text-base font-semibold tracking-tight text-slate-100 flex items-center gap-1.5">
              Công cụ tạo đề cương Toán theo chương từ PDF
            </h1>
            <p className="text-[10px] text-slate-500 hidden md:block mt-0.5">
              Giải pháp sư phạm đồng hành cùng Giáo viên Toán biên soạn đề cương tự động từ tài liệu PDF
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
          <span>Tác giả: <span className="text-sky-400">Trần Hoàng Quí</span></span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Column: Config Panel / Sidebar */}
        <aside className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-slate-900 bg-slate-900/10 p-5 flex flex-col gap-5 shrink-0 overflow-y-auto max-h-[40rem] lg:max-h-none">
          
          <div className="space-y-4">
            <PDFUploader files={files} onFilesChange={setFiles} />
          </div>

          <div className="space-y-4">
            <ConfigForm config={config} onChange={setConfig} />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || (files.length > 0 && files.some(f => f.status === 'loading'))}
            className={`w-full py-2.5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white rounded font-semibold text-xs shadow-lg shadow-sky-900/10 transition-all flex items-center justify-center gap-2`}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>ĐANG BIÊN SOẠN...</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>TẠO ĐỀ CƯƠNG NGAY</span>
              </>
            )}
          </button>
        </aside>

        {/* Right Column: Output / Editor View */}
        <section className="flex-1 flex flex-col bg-slate-900 overflow-hidden">
          
          {/* Generation Error State */}
          {generationError && (
            <div className="m-4 p-4 rounded border border-rose-900/50 bg-rose-950/20 text-rose-200 text-xs flex items-start space-x-3 shadow-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-400 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold uppercase tracking-wider">Lỗi tạo đề cương:</span>
                <p className="text-rose-300 leading-relaxed">{generationError}</p>
                <button 
                  onClick={handleGenerate} 
                  className="mt-2 text-sky-400 hover:underline font-semibold flex items-center"
                >
                  Thử lại ngay <span className="ml-1">→</span>
                </button>
              </div>
            </div>
          )}

          {/* Core Content Switching State */}
          {isGenerating ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-950/30 overflow-y-auto">
              <div className="max-w-md w-full space-y-6">
                <div className="relative w-20 h-20 mx-auto">
                  <div className="absolute inset-0 h-20 w-20 rounded-full border-4 border-slate-850 border-t-sky-500 animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-sky-400 animate-bounce" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-100 text-sm animate-pulse">
                    {LOADING_STATUSES[currentStatusIndex]}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Hệ thống AI đang đọc hiểu tài liệu, phân tích các dạng câu hỏi Toán học và biên soạn lý thuyết kèm phương pháp giải cụ thể cho từng bài tập. Vui lòng chờ...
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-850 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-sky-500 h-full rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(95, (currentStatusIndex + 1) * 11)}%` }}
                  />
                </div>

                {/* Quote Container */}
                <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-lg max-w-lg mx-auto">
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Cảm hứng Toán học
                  </p>
                  <p className="text-xs italic text-slate-300 font-medium leading-relaxed">
                    "{INSPIRATIONAL_QUOTES[currentQuoteIndex]}"
                  </p>
                </div>
              </div>
            </div>
          ) : outlineText ? (
            /* Results Layout with Document Sheet preview */
            <div className="flex-1 flex flex-col overflow-hidden">
              
              {/* Preview Header */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/20 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-[10px] font-bold rounded border border-green-500/20">
                    CHẾ ĐỘ XEM TRƯỚC
                  </span>
                  {config.chapterName && (
                    <span className="text-xs text-slate-500 truncate max-w-[120px] md:max-w-xs">
                      Tài liệu: {config.chapterName.replace(/\s+/g, "_")}.docx
                    </span>
                  )}
                </div>

                {/* Toolbar tabs */}
                <div className="flex items-center gap-3">
                  <div className="flex gap-1 bg-slate-950/60 p-0.5 rounded border border-slate-850">
                    <button
                      onClick={() => setActiveTab("preview")}
                      className={`px-3 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all ${
                        activeTab === "preview"
                          ? "bg-slate-800 text-sky-400 border border-slate-700/50"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <Eye className="h-3 w-3" />
                      <span>Xem trang in</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("edit")}
                      className={`px-3 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all ${
                        activeTab === "edit"
                          ? "bg-slate-800 text-sky-400 border border-slate-700/50"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>Sửa đề cương</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Copy Button */}
                    <button
                      onClick={handleCopy}
                      className="p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded border border-slate-700/80 transition-colors"
                      title="Sao chép toàn bộ"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>

                    {/* Word Export */}
                    <button
                      onClick={handleExportWord}
                      disabled={isExporting}
                      className="px-4 py-1.5 bg-slate-200 hover:bg-white disabled:bg-slate-800 text-slate-950 disabled:text-slate-600 rounded text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      {isExporting ? (
                        <>
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          <span>Đang xuất...</span>
                        </>
                      ) : (
                        <>
                          <Download className="h-3 w-3" />
                          <span>Xuất file Word</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Document Rendering Workspace */}
              {activeTab === "preview" ? (
                <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-slate-950/40">
                  <div className="max-w-[700px] mx-auto bg-white text-slate-900 p-6 md:p-12 shadow-2xl min-h-[1000px] border border-slate-200 font-serif rounded-sm relative">
                    <div 
                      ref={previewContainerRef}
                      className="prose prose-slate max-w-none mathjax-render-area"
                      dangerouslySetInnerHTML={{ __html: renderHTMLContent() }}
                    />
                    
                    {/* Footer sign */}
                    <div className="mt-20 border-t border-slate-200 pt-4 flex justify-between items-end text-[10px] text-slate-500 font-sans">
                      <div>
                        <p>Biên soạn: <span className="font-bold text-slate-800">Trần Hoàng Quí</span></p>
                        <p>Nguồn tham khảo: Sách Giáo Khoa & PDF</p>
                      </div>
                      <p>Hệ thống tự động biên soạn</p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Editor Workspace */
                <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-slate-950/20 flex flex-col h-full">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mb-2">
                    <span>Chỉnh sửa nội dung trực tiếp tại đây. Thay đổi sẽ tự động áp dụng khi Copy/Xuất file Word.</span>
                    <span>Số kí tự: {outlineText.length}</span>
                  </div>
                  <textarea
                    value={outlineText}
                    onChange={(e) => setOutlineText(e.target.value)}
                    className="w-full flex-1 min-h-[450px] p-4 font-mono text-xs border border-slate-800 rounded bg-slate-950/60 text-slate-300 placeholder-slate-700 leading-relaxed resize-none focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20"
                    placeholder="Nội dung đề cương của bạn..."
                  />
                </div>
              )}
            </div>
          ) : (
            /* Idle / Empty Workspace */
            <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto bg-slate-950/20">
              <div className="max-w-md w-full bg-slate-900/30 border border-slate-800/40 p-8 rounded-xl text-center space-y-6">
                <div className="p-4 bg-sky-950/40 border border-sky-900/30 text-sky-400 rounded-full w-16 h-16 flex items-center justify-center mx-auto shadow-inner">
                  <Sparkles className="h-8 w-8 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-200 text-base">
                    Chưa có Đề cương nào được tạo
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Vui lòng tải lên tài liệu PDF tham khảo, điều chỉnh tên chương, khối lớp và số lượng bài tập tự luyện rồi bấm nút <strong>"Tạo Đề cương"</strong> ở cột bên trái để bắt đầu.
                  </p>
                </div>

                <div className="pt-4 grid grid-cols-1 gap-2.5 text-left">
                  <div className="p-3 border border-slate-850 bg-slate-950/35 rounded flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-sky-950 text-sky-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</div>
                    <div>
                      <div className="text-xs font-bold text-slate-300">Nạp tài liệu PDF</div>
                      <div className="text-[10px] text-slate-500">Phân tích sâu định nghĩa, định lý từ sách giáo khoa hay tài liệu ôn tập của bạn.</div>
                    </div>
                  </div>
                  <div className="p-3 border border-slate-850 bg-slate-950/35 rounded flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-sky-950 text-sky-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</div>
                    <div>
                      <div className="text-xs font-bold text-slate-300">Biên soạn tự động</div>
                      <div className="text-[10px] text-slate-500">Tóm tắt lý thuyết, lập bản đồ phương pháp giải toán, kèm bài tập phân bậc độ khó.</div>
                    </div>
                  </div>
                  <div className="p-3 border border-slate-850 bg-slate-950/35 rounded flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-sky-950 text-sky-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</div>
                    <div>
                      <div className="text-xs font-bold text-slate-300">Xuất file Word chuẩn</div>
                      <div className="text-[10px] text-slate-500">Dễ dàng tải về tệp tin .docx trình bày chuyên nghiệp, sẵn sàng để in ấn và phân phát.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </section>
      </main>

      {/* Global Status/Footer Bar */}
      <footer className="h-10 border-t border-slate-900 bg-slate-950/80 px-4 md:px-8 flex items-center justify-between shrink-0 text-[10px] text-slate-500">
        <div className="flex items-center gap-3 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
            Hệ thống sẵn sàng
          </span>
          <span className="text-slate-800">|</span>
          <span>Đã nạp {files.length} tài liệu tham khảo</span>
        </div>
        <div className="uppercase tracking-wider">
          v2.4.0-stable
        </div>
      </footer>
    </div>
  );
}
