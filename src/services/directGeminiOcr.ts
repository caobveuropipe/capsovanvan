/**
 * directGeminiOcr.ts
 * Fallback gọi trực tiếp Google Generative Language REST API từ trình duyệt
 * Sử dụng khi backend proxy (/api/ocr-classify) bị chặn 405 bởi reverse proxy / gateway như hub.playai.vn
 */

export interface DirectOcrPayload {
  apiKey: string;
  imageBase64?: string;
  mimeType?: string;
  textHint?: string;
  categories?: { code: string; name: string }[];
  mode?: "fast" | "full";
}

export async function executeDirectGoogleOcr(payload: DirectOcrPayload): Promise<any> {
  const { apiKey, imageBase64, mimeType = "image/jpeg", textHint, categories = [], mode = "fast" } = payload;
  const isFastMode = mode === "fast";
  if (!apiKey?.trim()) {
    throw new Error("Vui lòng cấu hình Gemini API Key.");
  }

  const trimmedKey = apiKey.trim();
  const categoryListStr = categories.length > 0
    ? categories.map((c) => `${c.code}: ${c.name}`).join(", ")
    : "QĐ (Quyết định), CV (Công văn), TTr (Tờ trình), HĐ (Hợp đồng), TB (Thông báo), BB (Biên bản), KH (Kế hoạch), BC (Báo cáo), GM (Giấy mời), CT (Chỉ thị), ĐX (Đề xuất)";

  const systemPrompt = isFastMode
    ? `Bạn là trợ lý AI văn thư hành chính tốc độ cao theo thể thức văn bản Việt Nam (Nghị định 30/2020/NĐ-CP).
Nhiệm vụ: Trích xuất SIÊU TỐC thông tin đầu trang phục vụ CẤP SỐ VĂN BẢN NGAY LẬP TỨC.
QUY TẮC CỐT LÕI ĐỂ TIẾT KIỆM THỜI GIAN VÀ TOKEN:
1. CHỈ TẬP TRUNG đọc phần TRÍCH YẾU NỘI DUNG (các dòng bắt đầu bằng "V/v", "v/v", "Về việc", hoặc tiêu đề chính của văn bản ở nửa trên trang 1).
2. Xác định Loại văn bản phù hợp nhất trong danh sách danh mục: [${categoryListStr}].
3. Trích xuất Cơ quan ban hành, Ngày tháng văn bản, Người ký & chức vụ (nếu nhìn thấy).
4. TUYỆT ĐỐI KHÔNG nhận diện toàn văn (không OCR toàn bộ các điều khoản, căn cứ luật). Không viết tóm tắt dài dòng.
5. Chỉ trả về JSON ngắn gọn nhất theo định dạng:
{
  "categoryCode": "mã loại",
  "categoryName": "tên loại",
  "confidence": 0.95,
  "title": "trích yếu bắt đầu bằng V/v...",
  "issuingAuthority": "đơn vị ban hành",
  "recipient": "nơi nhận",
  "signer": "người ký & chức vụ",
  "documentDate": "YYYY-MM-DD",
  "departmentCode": "mã phòng ban gợi ý"
}
Chỉ trả về JSON thuần túy hợp lệ.`
    : `Bạn là một chuyên viên văn thư lưu trữ và công nghệ AI xử lý văn bản hành chính Việt Nam (theo thể thức văn bản Nghị định 30/2020/NĐ-CP).
Nhiệm vụ của bạn là:
1. Nhận diện toàn bộ chữ (OCR) chính xác từ hình ảnh/nội dung văn bản được cung cấp.
2. Phân tích nội dung và phân loại chính xác loại văn bản phù hợp nhất trong danh sách danh mục sau: [${categoryListStr}].
3. Trích xuất các trường thông tin quan trọng dưới dạng JSON:
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
   - keywords: Danh sách 3-6 từ khóa chính.
Chỉ trả về JSON thuần túy hợp lệ.`;

  const parts: any[] = [];
  if (imageBase64) {
    const cleanedBase64 = imageBase64.replace(/^data:[^;]+;base64,/, "");
    parts.push({
      inlineData: {
        mimeType: mimeType,
        data: cleanedBase64,
      },
    });
  }

  if (textHint) {
    parts.push({ text: `Nội dung / Ghi chú bổ sung:\n${textHint}` });
  } else {
    parts.push({
      text: isFastMode
        ? "Hãy đọc nhanh trích yếu (V/v...) và thông tin đầu trang để phân loại và cấp số văn bản ngay lập tức."
        : "Hãy đọc văn bản này, trích xuất toàn bộ nội dung OCR và phân loại chính xác theo định dạng JSON yêu cầu.",
    });
  }

  const candidateModels = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-3.8-flash",
    "gemini-3.5-flash",
    "gemini-flash-latest",
  ];
  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(trimmedKey)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts }],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      });

      const resJson = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errorMsg = resJson?.error?.message || `HTTP ${res.status}`;
        throw new Error(errorMsg);
      }

      const candidateParts = resJson?.candidates?.[0]?.content?.parts || [];
      const textPart = candidateParts.find((p: any) => p.text && !p.thought) || candidateParts[candidateParts.length - 1];
      const text = textPart?.text;
      if (!text) {
        throw new Error("Không nhận được nội dung từ mô hình AI.");
      }

      // Parse JSON an toàn
      const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      if (isFastMode) {
        if (!parsed.ocrFullText) parsed.ocrFullText = parsed.title || "";
        if (!parsed.summary) parsed.summary = parsed.title || "";
        if (!parsed.urgency) parsed.urgency = "THUONG";
        if (!parsed.secrecy) parsed.secrecy = "THUONG";
        if (!parsed.keywords || !Array.isArray(parsed.keywords) || parsed.keywords.length === 0) {
          parsed.keywords = [parsed.categoryName || "Văn bản", parsed.departmentCode || "VP"].filter(Boolean);
        }
      }

      return parsed;
    } catch (err: any) {
      lastError = err;
      console.warn(`[Direct Google OCR] Model ${model} gặp lỗi:`, err?.message || err);
    }
  }

  throw lastError || new Error("Không thể xử lý OCR qua Google AI.");
}
