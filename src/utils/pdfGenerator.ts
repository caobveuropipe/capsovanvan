import { PDFDocument, degrees } from "pdf-lib";

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
 * Đọc số trang thực tế của tệp PDF qua pdf-lib
 */
export async function getPdfPageCount(dataUrl: string): Promise<number> {
  try {
    const bytes = dataUrlToUint8Array(dataUrl);
    const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
    return pdf.getPageCount();
  } catch (err) {
    console.debug("Không thể đọc số trang PDF qua pdf-lib:", err);
    return 1;
  }
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
 * Ghép danh sách tệp đính kèm (ảnh JPG/PNG hoặc tệp tài liệu PDF) thành 1 tệp PDF A4 chuẩn hóa.
 * Hỗ trợ batch hỗn hợp gồm cả PDF và ảnh; với tệp PDF thì sao chép nguyên vẹn trang qua pdfDoc.copyPages.
 * Áp dụng fail-fast giao dịch: nếu bất kỳ tệp nào không đọc được, ném ngoại lệ rõ ràng để chặn cấp số thiếu trang.
 */
export async function compileImagesToPdf(
  images: Array<{ dataUrl: string; mimeType?: string; name?: string; rotation?: number }>
): Promise<CompilePdfResult> {
  if (!images || images.length === 0) {
    throw new Error("Không có tệp đính kèm nào để tạo tệp PDF");
  }

  const pdfDoc = await PDFDocument.create();
  let embeddedCount = 0;

  for (let i = 0; i < images.length; i++) {
    const item = images[i];
    if (!item.dataUrl) continue;

    const isPdfItem = Boolean(
      item.mimeType?.includes("pdf") ||
      item.name?.toLowerCase().endsWith(".pdf") ||
      item.dataUrl.startsWith("data:application/pdf")
    );

    if (isPdfItem) {
      // Xử lý tệp PDF: sao chép nguyên vẹn toàn bộ các trang sang tài liệu tổng hợp
      try {
        const srcBytes = dataUrlToUint8Array(item.dataUrl);
        const srcDoc = await PDFDocument.load(srcBytes, { ignoreEncryption: true });
        const pageIndices = srcDoc.getPageIndices();
        const copiedPages = await pdfDoc.copyPages(srcDoc, pageIndices);

        for (const page of copiedPages) {
          if (item.rotation) {
            const currentRotation = page.getRotation().angle;
            page.setRotation(degrees((currentRotation + item.rotation) % 360));
          }
          pdfDoc.addPage(page);
          embeddedCount++;
        }
      } catch (pdfErr: any) {
        throw new Error(
          `Không thể đọc tệp PDF "${item.name || `Tệp ${i + 1}`}". Tệp có thể bị khóa mật khẩu hoặc hư hại định dạng: ${pdfErr.message}`
        );
      }
    } else {
      // Xử lý tệp hình ảnh: căn chỉnh A4 qua Canvas
      try {
        const processed = await processImageCanvas(item.dataUrl, item.rotation || 0);
        const embeddedImage = await pdfDoc.embedJpg(processed.bytes);

        const imgW = processed.width;
        const imgH = processed.height;

        const isLandscape = imgW > imgH;
        const pageWidth = isLandscape ? A4_HEIGHT : A4_WIDTH;
        const pageHeight = isLandscape ? A4_WIDTH : A4_HEIGHT;

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
      } catch (imgErr: any) {
        throw new Error(
          `Không thể xử lý trang ảnh "${item.name || `Trang ${i + 1}`}". Vui lòng kiểm tra định dạng ảnh: ${imgErr.message}`
        );
      }
    }
  }

  if (embeddedCount === 0) {
    throw new Error("Không thể xử lý trang tài liệu nào vào tệp PDF");
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
