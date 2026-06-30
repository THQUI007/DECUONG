import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Set generous limits for large PDF texts and payloads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please add it to your secrets or .env file.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Main endpoint to generate math chapter outline
app.post("/api/generate-outline", async (req, res) => {
  try {
    const {
      pdfTexts,
      chapterName,
      gradeLevel,
      exampleCountMin,
      exampleCountMax,
      exerciseCountMin,
      exerciseCountMax,
      exerciseCountPerType,
      difficultyLevels,
      supplementFromInternet,
      hasAnswers,
    } = req.body;

    // Inputs Validation
    if (!pdfTexts || !Array.isArray(pdfTexts)) {
      return res.status(400).json({ error: "Dữ liệu tài liệu PDF không hợp lệ hoặc thiếu." });
    }

    const ai = getAiClient();

    const systemInstruction = `Bạn là một Giáo viên Toán trung học phổ thông Việt Nam có chuyên môn cao và giàu kinh nghiệm biên soạn đề cương ôn tập Toán theo chương học.
Nhiệm vụ của bạn là tạo một đề cương ôn tập chi tiết, có chiều sâu, chính xác và đầy đủ dựa trên thông tin được cung cấp từ các file tài liệu PDF đã đọc và các cấu hình do người dùng chọn.

CÁC NGUYÊN TẮC QUAN TRỌNG:
1. Độc giả là học sinh phổ thông Việt Nam. Ngôn ngữ trình bày phải chuẩn mực Sư phạm Toán, dễ hiểu, súc tích, chính xác về định nghĩa toán học.
2. Tất cả công thức toán học PHẢI được viết ở dạng LaTeX bọc trong cặp dấu $ (cho công thức trong dòng) hoặc $$ (cho công thức ở dòng riêng). Ví dụ: $f(x) = ax^2 + bx + c$, $\\Delta = b^2 - 4ac$. Sử dụng ký hiệu chuẩn của chương trình giáo dục Việt Nam (như kí hiệu vectơ $\\vec{a}$, khoảng, đoạn, góc...).
3. Ưu tiên cao nhất cho nội dung, bài tập và ví dụ được cung cấp trong phần tài liệu PDF. Tuyệt đối không bỏ sót các dạng bài tập quan trọng có trong PDF.
4. Sắp xếp các kiến thức, các công thức và các dạng bài tập theo một trình tự logic khoa học và dễ nhớ.
5. Cuối tài liệu, luôn ghi rõ tên tác giả: "Trần Hoàng Quí".
6. Nếu có sử dụng bổ sung kiến thức/bài tập từ nguồn ngoài (khi người dùng chọn cho phép), luôn ghi chú ở cuối tài liệu (ngay trước tên tác giả): "Một số bài tập được biên soạn bổ sung dựa trên kiến thức tham khảo."`;

    const prompt = `Hãy soạn một đề cương ôn tập toán cho chương sau đây:
- Tên chương học: "${chapterName || 'Tự động nhận diện từ PDF'}"
- Khối lớp: Lớp ${gradeLevel || '10/11/12'}
- Số lượng ví dụ minh họa cho mỗi dạng bài tập: từ ${exampleCountMin || 1} đến ${exampleCountMax || 3} ví dụ.
- Số lượng bài tập tự luyện cho mỗi dạng: ${exerciseCountPerType || 5} bài tập (Mức độ chọn từ ${exerciseCountMin || 1} đến ${exerciseCountMax || 40} bài).
- Mức độ bài tập cần tạo: ${(difficultyLevels && difficultyLevels.length > 0) ? difficultyLevels.join(', ') : 'Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao'}
- Cho phép bổ sung bài tập từ internet (nếu nội dung PDF không đủ): ${supplementFromInternet ? 'Có' : 'Không'}
- Có phần đáp án và hướng dẫn giải chi tiết ở cuối: ${hasAnswers ? 'Có' : 'Không'}

Dưới đây là TOÀN BỘ nội dung văn bản trích xuất được từ các tài liệu PDF do người dùng tải lên:
--- BẮT ĐẦU NỘI DUNG PDF ---
${pdfTexts.length > 0 ? pdfTexts.join('\n\n=== FILE PDF TIẾP THEO ===\n\n') : '[Không tải lên file PDF nào hoặc file PDF trống. Hãy tự biên soạn dựa trên tên chương và khối lớp.]'}
--- KẾT THÚC NỘI DUNG PDF ---

Hãy phân tích kỹ tài liệu PDF trên, loại bỏ các phần trùng lặp và biên soạn đề cương theo cấu trúc chính xác như sau:

I. TÊN CHƯƠNG
[Tên chương chính thức học, viết hoa và in đậm]

II. TÓM TẮT LÝ THUYẾT
- Tóm tắt các kiến thức trọng tâm của chương.
- Trình bày mạch lạc theo từng bài hoặc từng chủ đề nhỏ trong chương.
- Định nghĩa, định lý, tính chất phải đầy đủ, chính xác khoa học nhưng ngắn gọn, dễ nhớ.

III. CÔNG THỨC CẦN NHỚ
- Liệt kê toàn bộ các công thức quan trọng phục vụ giải toán của chương này.
- Các công thức toán để ở dạng LaTeX bọc trong $ hoặc $$.
- Với mỗi công thức, giải thích rõ ràng ý nghĩa của từng kí hiệu, điều kiện áp dụng nếu có.

IV. CÁC DẠNG BÀI TẬP
Với mỗi dạng bài tập quan trọng tìm thấy trong tài liệu (hoặc bổ sung thêm), hãy trình bày theo cấu trúc:

Dạng X: [Tên dạng bài tập]
1. Phương pháp giải
- Nêu các bước tư duy và phương pháp biến đổi toán học cụ thể để giải dạng bài này.
- Chỉ ra các sai lầm, lưu ý thường gặp của học sinh.
2. Ví dụ minh họa
- Tạo ra từ ${exampleCountMin || 1} đến ${exampleCountMax || 3} ví dụ minh họa cho dạng này (ưu tiên lấy từ tài liệu PDF).
- Mỗi ví dụ phải có lời giải chi tiết, rõ ràng từng bước biến đổi, có lời giải thích sư phạm kèm theo công thức toán LaTeX.
3. Bài tập tự luyện
- Tạo chính xác ${exerciseCountPerType || 5} bài tập tự luyện cho dạng này.
- Các bài tập phải được sắp xếp theo mức độ từ dễ đến khó (Nhận biết -> Thông hiểu -> Vận dụng -> Vận dụng cao) dựa trên mức độ yêu cầu: ${(difficultyLevels && difficultyLevels.length > 0) ? difficultyLevels.join(', ') : 'Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao'}.
- Chỉ ghi đề bài và các lựa chọn hoặc câu hỏi tự luận, KHÔNG đưa ngay lời giải hay đáp án ở đây.

V. BÀI TẬP TỔNG HỢP
- Một phần bài tập tổng hợp bao quát toàn chương để học sinh tự ôn tập.
- Tạo khoảng 12 đến 15 bài tập tự luyện tổng hợp đa dạng.
- Sắp xếp tăng dần độ khó, bao phủ tất cả các mức độ: ${(difficultyLevels && difficultyLevels.length > 0) ? difficultyLevels.join(', ') : 'Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao'}.

VI. ĐÁP ÁN VÀ HƯỚNG DẪN GIẢI
${hasAnswers ? 'Hãy đưa ra đáp án ngắn gọn cho tất cả các bài tập tự luyện của mỗi dạng bài và bài tập tổng hợp. Với các câu hỏi mức độ vận dụng hoặc vận dụng cao (hoặc các câu hỏi khó), hãy cung cấp lời giải hoặc hướng dẫn giải chi tiết từng bước để học sinh có thể đối chiếu.' : 'Không tạo phần này vì người dùng không yêu cầu.'}

---
${supplementFromInternet ? 'Một số bài tập được biên soạn bổ sung dựa trên kiến thức tham khảo.\n' : ''}Tác giả: Trần Hoàng Quí
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2, // low temperature for precise, fact-based math construction
      }
    });

    if (!response || !response.text) {
      throw new Error("Không thể nhận được phản hồi từ mô hình AI.");
    }

    res.json({ outlineText: response.text });
  } catch (error: any) {
    console.error("Lỗi khi tạo đề cương:", error);
    res.status(500).json({ error: error.message || "Đã xảy ra lỗi không xác định trên máy chủ." });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
