// Prefer a lightweight multimodal model for document intake. Only try another
// model when the current one is unavailable for this API key.
export const OCR_MODELS = ["gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-2.5-flash"] as const;

export function isModelUnavailable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /\b404\b|NOT_FOUND|not found|not supported for generateContent|no longer available/i.test(message);
}
