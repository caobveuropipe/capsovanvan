import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured on Vercel." });
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

    const systemPrompt = `Bạn là trợ lý văn thư lưu trữ điện tử AI cao cấp.
Nhiệm vụ: Phân tích email đến và ĐẶC BIỆT LÀ TRÍCH XUẤT VĂN BẢN TRONG FILE ĐÍNH KÈM (Attachment) của email để đăng ký cấp số và lưu trữ vào sổ văn bản.
QUY TẮC QUAN TRỌNG:
1. Nếu email có tệp đính kèm (hình ảnh scan/nội dung file đính kèm), bạn PHẢI ưu tiên trích xuất thông tin hành chính (Trích yếu, Cơ quan ban hành, Người ký & chức vụ, Ngày văn bản, Toàn văn OCR) TRỰC TIẾP TỪ NỘI DUNG TỆP ĐÍNH KÈM chứ không chỉ lấy tiêu đề email.
2. Phân loại loại văn bản chính xác nhất theo danh mục: [${categoryListStr}].
3. Trích xuất đầy đủ các trường thông tin: senderEmail, senderName, subject, receivedDate, categoryCode, categoryName, title, issuingAuthority, signer, recipient, documentDate, departmentCode, summary, ocrFullText, urgency, secrecy, confidence, keywords.`;

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
            senderEmail: { type: Type.STRING },
            senderName: { type: Type.STRING },
            subject: { type: Type.STRING },
            receivedDate: { type: Type.STRING },
            categoryCode: { type: Type.STRING },
            categoryName: { type: Type.STRING },
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
            confidence: { type: Type.NUMBER },
            keywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["categoryCode", "categoryName", "title", "summary", "ocrFullText"],
        },
      },
    });

    const parsedResult = JSON.parse(response.text || "{}");
    return res.json({ success: true, data: parsedResult });
  } catch (error: any) {
    console.error("Vercel Parse email error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to parse email and attachment.",
    });
  }
}
