import { PDFDocument } from "pdf-lib";

export interface CompilePdfResult {
  dataUrl: string;
  size: number;
  pageCount: number;
}

/**
 * Khổ giấy chuẩn A4 theo Nghị định 30/2020/NĐ-CP (tính bằng PDF points)
 * 210mm x 297mm = 595.28 pt x 841.89 pt
 */
export const A4_WIDTH = 595.28;
export const A4_HEIGHT = 841.89;

/**
 * Chuyển chuỗi base64 dataUrl thành Uint8Array an toàn
 */
function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const commaIndex = dataUrl.indexOf(",");
  const base64 = commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : dataUrl;
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Xử lý ảnh qua Canvas:
 * - Tự động sửa EXIF orientation từ camera điện thoại
 * - Hỗ trợ góc xoay tùy chỉnh (rotation = 0, 90, 180, 270)
 * - Xuất ra JPEG chuẩn để nhúng vào trang A4
 */
async function processImageCanvas(
  dataUrl: string,
  rotation = 0
): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const naturalW = img.naturalWidth || img.width || 1200;
        const naturalH = img.naturalHeight || img.height || 1600;

        const rot = ((rotation % 360) + 360) % 360;
        const isSwapped = rot === 90 || rot === 270;

        const canvasW = isSwapped ? naturalH : naturalW;
        const canvasH = isSwapped ? naturalW : naturalH;

        const canvas = document.createElement("canvas");
        canvas.width = canvasW;
        canvas.height = canvasH;

        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Could not create 2d canvas context");

        // Nền trắng tinh tiêu chuẩn văn thư
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvasW, canvasH);

        ctx.save();
        ctx.translate(canvasW / 2, canvasH / 2);
        ctx.rotate((rot * Math.PI) / 180);
        ctx.drawImage(img, -naturalW / 2, -naturalH / 2, naturalW, naturalH);
        ctx.restore();

        const jpegUrl = canvas.toDataURL("image/jpeg", 0.92);
        resolve({
          bytes: dataUrlToUint8Array(jpegUrl),
          width: canvasW,
          height: canvasH,
        });
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = (e) => reject(new Error("Lỗi khi nạp ảnh để xử lý Canvas: " + String(e)));
    img.src = dataUrl;
  });
}

/**
 * Ghép các trang ảnh (JPG, PNG, WEBP, chụp ảnh từ Camera) thành một tệp PDF chuẩn khổ A4 duy nhất
 * Tự động scale vừa khít khung A4 đứng/ngang, căn lề thẩm mỹ, giữ đúng thứ tự trang 1 -> trang N
 */
export async function compileImagesToPdf(
  images: Array<{ dataUrl: string; mimeType?: string; name?: string; rotation?: number }>
): Promise<CompilePdfResult> {
  if (!images || images.length === 0) {
    throw new Error("Không có ảnh để tạo tệp PDF");
  }

  const pdfDoc = await PDFDocument.create();
  let embeddedCount = 0;

  for (let i = 0; i < images.length; i++) {
    const item = images[i];
    if (!item.dataUrl) continue;

    try {
      // Luôn chuẩn hóa ảnh qua Canvas để sửa góc quay EXIF và áp dụng rotation người dùng chọn
      const processed = await processImageCanvas(item.dataUrl, item.rotation || 0);
      const embeddedImage = await pdfDoc.embedJpg(processed.bytes);

      const imgW = processed.width;
      const imgH = processed.height;

      // Xác định khổ A4: Nếu chiều cao >= chiều rộng -> Khổ A4 đứng (595 x 842 pt); ngược lại -> Khổ A4 ngang (842 x 595 pt)
      const isLandscape = imgW > imgH;
      const pageWidth = isLandscape ? A4_HEIGHT : A4_WIDTH;
      const pageHeight = isLandscape ? A4_WIDTH : A4_HEIGHT;

      // Tính toán tỉ lệ scale để ảnh nằm gọn đẹp trong khổ giấy A4
      const scale = Math.min(pageWidth / imgW, pageHeight / imgH);
      const drawWidth = imgW * scale;
      const drawHeight = imgH * scale;
      const x = (pageWidth - drawWidth) / 2;
      const y = (pageHeight - drawHeight) / 2;

      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      page.drawImage(embeddedImage, {
        x,
        y,
        width: drawWidth,
        height: drawHeight,
      });

      embeddedCount++;
    } catch (err) {
      console.warn(`Lỗi khi xử lý trang ảnh ${i + 1} vào PDF:`, err);
    }
  }

  if (embeddedCount === 0) {
    throw new Error("Không thể xử lý trang ảnh nào vào tệp PDF");
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  return {
    dataUrl,
    size: blob.size,
    pageCount: embeddedCount,
  };
}
