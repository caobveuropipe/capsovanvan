/**
 * imageOptimizer.ts
 * Tối ưu hóa dung lượng và cắt cúp hình ảnh thông minh trước khi gửi AI OCR
 * Giúp giảm dung lượng từ 3MB - 10MB xuống còn ~100KB - 250KB:
 * - Tránh lỗi 503 (Model Overloaded / Unavailable) của Google Gemini
 * - Tránh lỗi quá tải bộ nhớ trình duyệt & timeout mạng
 * - Tăng tốc độ OCR từ 10-15s xuống 1-2s
 */

export interface OptimizedImageResult {
  dataUrl: string;
  mimeType: string;
  originalSizeKb: number;
  optimizedSizeKb: number;
}

export async function optimizeImageForOcr(
  dataUrl: string,
  mode: "fast" | "full" = "fast"
): Promise<OptimizedImageResult> {
  const originalSizeKb = Math.round((dataUrl.length * 0.75) / 1024);

  // Nếu không phải ảnh bitmap (VD: SVG vector, PDF placeholder), giữ nguyên
  if (!dataUrl || !dataUrl.startsWith("data:image/")) {
    return {
      dataUrl,
      mimeType: "image/jpeg",
      originalSizeKb,
      optimizedSizeKb: originalSizeKb,
    };
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const srcWidth = img.naturalWidth || img.width;
        const srcHeight = img.naturalHeight || img.height;

        if (!srcWidth || !srcHeight) {
          return resolve({ dataUrl, mimeType: "image/jpeg", originalSizeKb, optimizedSizeKb: originalSizeKb });
        }

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return resolve({ dataUrl, mimeType: "image/jpeg", originalSizeKb, optimizedSizeKb: originalSizeKb });
        }

        // Chế độ FAST: Cắt 50% phần trên trang 1 (vùng chứa V/v, số hiệu, loại văn bản, cơ quan ban hành)
        const isFast = mode === "fast";
        const cropHeight = isFast ? Math.round(srcHeight * 0.50) : srcHeight;

        // Giới hạn chiều rộng tối đa 1600px để giữ chữ nét cho OCR mà không bị phình dung lượng
        const MAX_WIDTH = 1600;
        let targetWidth = srcWidth;
        let targetHeight = cropHeight;

        if (targetWidth > MAX_WIDTH) {
          const ratio = MAX_WIDTH / targetWidth;
          targetWidth = MAX_WIDTH;
          targetHeight = Math.round(cropHeight * ratio);
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Nền trắng chống trong suốt
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        // Vẽ ảnh (nếu crop thì lấy 0,0 đến srcWidth, cropHeight)
        ctx.drawImage(
          img,
          0,
          0,
          srcWidth,
          cropHeight,
          0,
          0,
          targetWidth,
          targetHeight
        );

        // Nén chất lượng JPEG 0.82 (giữ độ sắc nét của chữ văn bản tốt nhất)
        const optimizedDataUrl = canvas.toDataURL("image/jpeg", 0.82);
        const optimizedSizeKb = Math.round((optimizedDataUrl.length * 0.75) / 1024);

        resolve({
          dataUrl: optimizedDataUrl,
          mimeType: "image/jpeg",
          originalSizeKb,
          optimizedSizeKb,
        });
      } catch (err) {
        console.warn("Lỗi tối ưu hóa ảnh trước OCR:", err);
        resolve({ dataUrl, mimeType: "image/jpeg", originalSizeKb, optimizedSizeKb: originalSizeKb });
      }
    };

    img.onerror = () => {
      resolve({ dataUrl, mimeType: "image/jpeg", originalSizeKb, optimizedSizeKb: originalSizeKb });
    };

    img.src = dataUrl;
  });
}
