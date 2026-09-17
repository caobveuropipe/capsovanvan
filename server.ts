import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// High limit for base64 scanned documents and camera photos
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Lazy init Gemini AI
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in the environment.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// API: OCR and Intelligent Document Classification
app.post("/api/ocr-classify", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg", textHint = "", categories = [] } = req.body;

    if (!imageBase64 && !textHint) {
      return res.status(400).json({ error: "No image or text provided for analysis." });
    }

    const ai = getGeminiClient();

    const categoryListStr = categories.length > 0
      ? categories.map((c: any) => `${c.code}: ${c.name}`).join(", ")
      : "QĐ (Quyết định), CV (Công văn), TTr (Tờ trình), HĐ (Hợp đồng), TB (Thông báo), BB (Biên bản), KH (Kế hoạch), BC (Báo cáo), GM (Giấy mời), CT (Chỉ thị), ĐX (Đề xuất)";

    const systemPrompt = `Bạn là một chuyên viên văn thư lưu trữ và công nghệ AI xử lý văn bản hành chính Việt Nam (theo thể thức văn bản Nghị định 30/2020/NĐ-CP).
Nhiệm vụ của bạn là:
1. Nhận diện toàn bộ chữ (OCR) chính xác từ hình ảnh/nội dung văn bản được cung cấp.
2. Phân tích nội dung và phân loại chính xác loại văn bản phù hợp nhất trong danh sách danh mục sau: [${categoryListStr}].
3. Trích xuất các trường thông tin quan trọng:
   - categoryCode: Mã loại văn bản phù hợp nhất (ví dụ: QD, CV, TTR, HD, TB, BB, KH, BC, GM, CT, DX).
   - categoryName: Tên loại văn bản tiếng Việt.
   - confidence: Độ tin cậy nhận diện và phân loại (từ 0.0 đến 1.0).
   - title: Trích yếu / Tiêu đề văn bản (Ví dụ: "V/v phê duyệt kế hoạch triển khai dự án quý III", "Quyết định ban hành quy chế làm việc",...).
   - issuingAuthority: Cơ quan / Tổ chức / Đơn vị ban hành (Ví dụ: "ỦY BAN NHÂN DÂN THÀNH PHỐ", "CÔNG TY CỔ PHẦN VCCORP", "BỘ THÔNG TIN VÀ TRUYỀN THÔNG").
   - recipient: Nơi nhận (Ví dụ: "Như điều 3; Lưu: VT, TCKT", "Ban Giám đốc, Phòng Kế hoạch").
   - signer: Người ký và chức vụ (Ví dụ: "Nguyễn Văn A - Tổng Giám đốc", "Trần Thị B - Trưởng phòng Hành chính").
   - documentDate: Ngày tháng năm ban hành văn bản (định dạng YYYY-MM-DD nếu có hoặc dạng chuỗi chuẩn).
   - departmentCode: Mã phòng ban phù hợp gợi ý (ví dụ: VP, TCKT, HCNS, KD, IT, DADT, BGD).
   - summary: Tóm tắt nội dung chính của văn bản trong 2-4 câu súc tích.
   - ocrFullText: Toàn bộ văn bản đã nhận diện (giữ định dạng xuống dòng rõ ràng).
   - urgency: Mức độ khẩn ('THUONG' | 'KHAN' | 'THUONG_KHAN' | 'HOA_TOC').
   - secrecy: Mức độ mật ('THUONG' | 'MAT' | 'TOI_MAT' | 'TUYET_MAT').
   - keywords: Danh sách 3-6 từ khóa chính.`;

    const contents: any = [];

    if (imageBase64) {
      // Clean base64 header if present
      const cleanedBase64 = imageBase64.replace(/^data:[^;]+;base64,/, "");
      contents.push({
        inlineData: {
          mimeType: mimeType,
          data: cleanedBase64,
        },
      });
    }

    if (textHint) {
      contents.push({
        text: `Nội dung / Ghi chú bổ sung:\n${textHint}`,
      });
    } else {
      contents.push({
        text: "Hãy đọc văn bản này, trích xuất toàn bộ nội dung OCR và phân loại chính xác theo định dạng JSON yêu cầu.",
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: { parts: contents },
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            categoryCode: { type: Type.STRING, description: "Mã loại danh mục phù hợp nhất" },
            categoryName: { type: Type.STRING, description: "Tên loại văn bản" },
            confidence: { type: Type.NUMBER, description: "Độ tin cậy từ 0 đến 1" },
            title: { type: Type.STRING, description: "Trích yếu / Tiêu đề văn bản" },
            issuingAuthority: { type: Type.STRING, description: "Cơ quan/đơn vị ban hành" },
            recipient: { type: Type.STRING, description: "Nơi nhận" },
            signer: { type: Type.STRING, description: "Người ký và chức danh" },
            documentDate: { type: Type.STRING, description: "Ngày tháng văn bản" },
            departmentCode: { type: Type.STRING, description: "Mã phòng ban gợi ý" },
            summary: { type: Type.STRING, description: "Tóm tắt ngắn gọn nội dung" },
            ocrFullText: { type: Type.STRING, description: "Toàn bộ nội dung OCR đã nhận diện" },
            urgency: { type: Type.STRING, description: "Mức độ khẩn (THUONG, KHAN, THUONG_KHAN, HOA_TOC)" },
            secrecy: { type: Type.STRING, description: "Mức độ mật (THUONG, MAT, TOI_MAT, TUYET_MAT)" },
            keywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Các từ khóa chính",
            },
          },
          required: ["categoryCode", "categoryName", "title", "ocrFullText", "summary"],
        },
      },
    });

    const parsedResult = JSON.parse(response.text || "{}");
    res.json({ success: true, data: parsedResult });
  } catch (error: any) {
    console.error("OCR & Classification error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to process OCR and classification.",
    });
  }
});

// API: Parse Email & Extract Attached Document Content for Registration
app.post("/api/parse-email", async (req, res) => {
  try {
    const {
      emailRawText = "",
      attachmentBase64 = "",
      attachmentMimeType = "image/jpeg",
      attachmentFilename = "",
      attachmentText = "",
      categories = [],
    } = req.body;

    if (!emailRawText && !attachmentBase64 && !attachmentText) {
      return res.status(400).json({ error: "Email content or attachment is required." });
    }

    const ai = getGeminiClient();

    const categoryListStr = categories.length > 0
      ? categories.map((c: any) => `${c.code}: ${c.name}`).join(", ")
      : "QĐ (Quyết định), CV (Công văn), TTr (Tờ trình), HĐ (Hợp đồng), TB (Thông báo), BB (Biên bản), KH (Kế hoạch), BC (Báo cáo), GM (Giấy mời), CT (Chỉ thị), ĐX (Đề xuất)";

    const systemPrompt = `Bạn là trợ lý văn thư lưu trữ điện tử AI cao cấp.
Nhiệm vụ: Phân tích email đến và ĐẶC BIỆT LÀ TRÍCH XUẤT VĂN BẢN TRONG FILE ĐÍNH KÈM (Attachment) của email để đăng ký cấp số và lưu trữ vào sổ văn bản.
QUY TẮC QUAN TRỌNG:
1. Nếu email có tệp đính kèm (hình ảnh scan/nội dung file đính kèm), bạn PHẢI ưu tiên trích xuất thông tin hành chính (Trích yếu, Cơ quan ban hành, Người ký & chức vụ, Ngày văn bản, Toàn văn OCR) TRỰC TIẾP TỪ NỘI DUNG TỆP ĐÍNH KÈM chứ không chỉ lấy tiêu đề email.
2. Phân loại loại văn bản chính xác nhất theo danh mục: [${categoryListStr}].
3. Trích xuất đầy đủ các trường thông tin:
   - senderEmail, senderName, subject, receivedDate từ thông tin email.
   - categoryCode, categoryName: Mã và tên loại văn bản được nhận diện từ văn bản đính kèm.
   - title: Trích yếu / Tiêu đề chính thức của văn bản đính kèm.
   - issuingAuthority: Cơ quan / đơn vị ban hành trong văn bản đính kèm.
   - signer: Người ký và chức vụ trong văn bản đính kèm.
   - recipient: Nơi nhận ghi trong văn bản đính kèm.
   - documentDate: Ngày tháng ghi trên văn bản đính kèm.
   - departmentCode: Mã phòng ban phù hợp để tiếp nhận xử lý (VP, TCKT, HCNS, KD, IT, BGD,...).
   - summary: Tóm tắt nội dung văn bản đính kèm và mục đích email.
   - ocrFullText: Toàn bộ nội dung chữ nhận diện được từ tệp đính kèm (hoặc nội dung email nếu không có file).
   - urgency: Mức độ khẩn ('THUONG' | 'KHAN' | 'THUONG_KHAN' | 'HOA_TOC').
   - secrecy: Mức độ mật ('THUONG' | 'MAT' | 'TOI_MAT' | 'TUYET_MAT').
   - confidence: Độ tin cậy từ 0.0 đến 1.0.`;

    const contents: any = [];

    if (attachmentBase64) {
      const cleanedBase64 = attachmentBase64.replace(/^data:[^;]+;base64,/, "");
      contents.push({
        inlineData: {
          mimeType: attachmentMimeType || "image/jpeg",
          data: cleanedBase64,
        },
      });
    }

    let textPrompt = `--- THÔNG TIN EMAIL ĐẾN ---\n${emailRawText}\n`;
    if (attachmentFilename) {
      textPrompt += `\n--- TỆP ĐÍNH KÈM TRONG EMAIL ---\nTên file: ${attachmentFilename}\n`;
    }
    if (attachmentText) {
      textPrompt += `Nội dung tệp đính kèm:\n${attachmentText}\n`;
    }
    textPrompt += `\nHãy đọc và trích xuất thông tin văn bản từ tệp đính kèm trong email này để cấp số vào sổ lưu trữ.`;

    contents.push({ text: textPrompt });

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: { parts: contents },
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            senderEmail: { type: Type.STRING, description: "Email người gửi" },
            senderName: { type: Type.STRING, description: "Tên hoặc đơn vị người gửi" },
            subject: { type: Type.STRING, description: "Tiêu đề thư điện tử" },
            receivedDate: { type: Type.STRING, description: "Ngày giờ nhận email" },
            categoryCode: { type: Type.STRING, description: "Mã loại văn bản trong tệp đính kèm" },
            categoryName: { type: Type.STRING, description: "Tên loại văn bản" },
            title: { type: Type.STRING, description: "Trích yếu văn bản trong tệp đính kèm" },
            issuingAuthority: { type: Type.STRING, description: "Cơ quan ban hành của văn bản đính kèm" },
            recipient: { type: Type.STRING, description: "Nơi nhận" },
            signer: { type: Type.STRING, description: "Người ký & chức danh" },
            documentDate: { type: Type.STRING, description: "Ngày tháng văn bản đính kèm" },
            departmentCode: { type: Type.STRING, description: "Phòng ban phụ trách xử lý gợi ý" },
            summary: { type: Type.STRING, description: "Tóm tắt nội dung văn bản đính kèm" },
            ocrFullText: { type: Type.STRING, description: "Toàn văn nội dung văn bản trích xuất từ file đính kèm" },
            urgency: { type: Type.STRING, description: "Mức độ khẩn (THUONG, KHAN, THUONG_KHAN, HOA_TOC)" },
            secrecy: { type: Type.STRING, description: "Mức độ mật (THUONG, MAT, TOI_MAT, TUYET_MAT)" },
            confidence: { type: Type.NUMBER, description: "Độ tin cậy từ 0 đến 1" },
            keywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Các từ khóa chính",
            },
          },
          required: ["categoryCode", "categoryName", "title", "summary", "ocrFullText"],
        },
      },
    });

    const parsedResult = JSON.parse(response.text || "{}");
    res.json({ success: true, data: parsedResult });
  } catch (error: any) {
    console.error("Parse email error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to parse email and attachment.",
    });
  }
});

async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Document Numbering & Management Server running on port ${PORT}`);
  });
}

start();
