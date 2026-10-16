import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const rawKey = (req.headers["x-gemini-api-key"] as string) || req.body?.apiKey;
    const apiKey = (rawKey || "").trim();

    // Bắt buộc dùng key cá nhân, TUYỆT ĐỐI KHÔNG fallback key hệ thống (EFR-01)
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: "Yêu cầu cung cấp Gemini API Key cá nhân để sử dụng tính năng OCR & Trích yếu văn bản.",
      });
    }

    const { imageBase64, mimeType = "image/jpeg", textHint = "", categories = [] } = req.body;

    if (!imageBase64 && !textHint) {
      return res.status(400).json({ error: "No image or text provided for analysis." });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

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
   - title: Trích yếu / Tiêu đề văn bản.
   - issuingAuthority: Cơ quan / Tổ chức / Đơn vị ban hành.
   - recipient: Nơi nhận.
   - signer: Người ký và chức vụ.
   - documentDate: Ngày tháng năm ban hành văn bản.
   - departmentCode: Mã phòng ban phù hợp gợi ý.
   - summary: Tóm tắt nội dung chính của văn bản trong 2-4 câu súc tích.
   - ocrFullText: Toàn bộ văn bản đã nhận diện.
   - urgency: Mức độ khẩn ('THUONG' | 'KHAN' | 'THUONG_KHAN' | 'HOA_TOC').
   - secrecy: Mức độ mật ('THUONG' | 'MAT' | 'TOI_MAT' | 'TUYET_MAT').
   - keywords: Danh sách 3-6 từ khóa chính.`;

    const contents: any = [];

    if (imageBase64) {
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

    const candidateModels = ["gemini-3.5-flash", "gemini-3.7-flash", "gemini-3.8-flash", "gemini-flash-latest"];
    const modelConfig = {
      contents: { parts: contents },
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            categoryCode: { type: Type.STRING },
            categoryName: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            title: { type: Type.STRING },
            issuingAuthority: { type: Type.STRING },
            recipient: { type: Type.STRING },
            signer: { type: Type.STRING },
            documentDate: { type: Type.STRING },
            departmentCode: { type: Type.STRING },
            summary: { type: Type.STRING },
            ocrFullText: { type: Type.STRING },
            urgency: { type: Type.STRING },
            secrecy: { type: Type.STRING },
            keywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["categoryCode", "categoryName", "title", "ocrFullText", "summary"],
        },
      },
    };

    let response: any = null;
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        console.log(`[Vercel OCR] Đang gọi model ${modelName}...`);
        response = await ai.models.generateContent({
          model: modelName,
          ...modelConfig,
        });
        if (response && response.text) {
          console.log(`[Vercel OCR] Model ${modelName} phản hồi thành công.`);
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[Vercel OCR] Model ${modelName} gặp lỗi:`, err?.message || err);
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error("Không thể kết nối đến máy chủ AI Google.");
    }

    const parsedResult = JSON.parse(response.text || "{}");
    return res.json({ success: true, data: parsedResult });
  } catch (error: any) {
    console.error("Vercel OCR error:", error);
    let errorMsg = error?.message || "Lỗi xử lý OCR và phân loại văn bản.";
    try {
      const parsed = JSON.parse(errorMsg);
      if (parsed?.error?.message) {
        if (parsed.error.code === 503 || parsed.error.status === "UNAVAILABLE") {
          errorMsg = "Máy chủ AI của Google đang quá tải tạm thời (503 High Demand). Vui lòng thử lại sau vài giây.";
        } else {
          errorMsg = parsed.error.message;
        }
      }
    } catch (_) {}

    return res.status(500).json({
      success: false,
      error: errorMsg,
    });
  }
}
