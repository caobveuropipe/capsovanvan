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

    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: "Xin chào",
      });
    } catch (err: any) {
      if (err?.message?.includes("not found") || err?.message?.includes("404")) {
        response = await ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: "Xin chào",
        });
      } else {
        throw err;
      }
    }

    if (response && response.text) {
      return res.json({ success: true, message: "Kết nối Gemini API thành công!" });
    }

    return res.json({ success: true, message: "API Key hợp lệ." });
  } catch (error: any) {
    console.warn("Vercel verify Gemini key error:", error?.message || error);
    return res.status(400).json({
      success: false,
      error: error?.message || "API Key không hợp lệ hoặc đã bị vô hiệu hóa.",
    });
  }
}
