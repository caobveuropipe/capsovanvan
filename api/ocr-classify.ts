import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { imageBase64, mimeType = "image/jpeg", textHint = "", categories = [] } = req.body;

    if (!imageBase64 && !textHint) {
      return res.status(400).json({ error: "No image or text provided for analysis." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured on Vercel environment." });
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

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
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
    });

    const parsedResult = JSON.parse(response.text || "{}");
    return res.json({ success: true, data: parsedResult });
  } catch (error: any) {
    console.error("Vercel OCR error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to process OCR and classification.",
    });
  }
}
