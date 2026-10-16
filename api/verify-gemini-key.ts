import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const rawKey = (req.headers["x-gemini-api-key"] as string) || req.body?.apiKey;
    const apiKey = (rawKey || "").trim();

    if (!apiKey) {
      return res.status(400).json({ success: false, error: "Vui lòng cung cấp Gemini API Key để kiểm tra." });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const candidateModels = ["gemini-3.5-flash", "gemini-3.7-flash", "gemini-3.8-flash", "gemini-flash-latest"];
    let response: any = null;
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: "Xin chào",
        });
        if (response && response.text) {
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[Vercel verify] Model ${model} gặp lỗi:`, err?.message || err);
      }
    }

    if (response && response.text) {
      return res.json({ success: true, message: "Kết nối Gemini API thành công!" });
    }

    if (lastError) {
      throw lastError;
    }

    return res.json({ success: true, message: "API Key hợp lệ." });
  } catch (error: any) {
    console.warn("Vercel verify Gemini key error:", error?.message || error);
    let errMsg = error?.message || "API Key không hợp lệ hoặc đã bị vô hiệu hóa.";
    try {
      const parsed = JSON.parse(errMsg);
      if (parsed?.error?.message) {
        if (parsed.error.code === 503 || parsed.error.status === "UNAVAILABLE") {
          errMsg = "Máy chủ AI của Google đang quá tải tạm thời (503 High Demand). Vui lòng thử lại sau vài giây.";
        } else {
          errMsg = parsed.error.message;
        }
      }
    } catch (_) {}

    return res.status(400).json({
      success: false,
      error: errMsg,
    });
  }
}
