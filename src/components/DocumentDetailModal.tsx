import React, { useState } from "react";
import {
  X,
  Printer,
  Download,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  FileText,
  Building,
  UserCheck,
  Calendar,
  Sparkles,
  Mail,
  Shield,
  Layers,
  History,
  Tag,
  Hash,
  Share2,
  ExternalLink,
  HardDrive,
  File,
  Eye,
  AlertCircle,
} from "lucide-react";
import { DocumentRecord } from "../types";
import {
  formatVietnameseDate,
  formatVietnameseDateTime,
} from "../utils/numberGenerator";

interface DocumentDetailModalProps {
  document: DocumentRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onPrint: (doc: DocumentRecord) => void;
  onDelete: (id: string) => void;
}

export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  document: doc,
  isOpen,
  onClose,
  onPrint,
  onDelete,
}) => {
  const [activeTab, setActiveTab] = useState<"info" | "ocr" | "email" | "history">("info");
  const [mobileView, setMobileView] = useState<"image" | "details">("image");
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [showElectronicStamp, setShowElectronicStamp] = useState<boolean>(true);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isOcrCopied, setIsOcrCopied] = useState<boolean>(false);

  if (!isOpen || !doc) return null;

  const currentImage = doc.images && doc.images[activeImageIndex] ? doc.images[activeImageIndex] : null;

  // Detect file formats
  const imgName = currentImage?.name?.toLowerCase() || "";
  const imgMime = currentImage?.mimeType?.toLowerCase() || "";
  const imgData = currentImage?.dataUrl || "";

  const isPdf =
    imgMime.includes("pdf") ||
    imgName.endsWith(".pdf") ||
    imgData.startsWith("data:application/pdf");

  const isDocx =
    imgMime.includes("word") ||
    imgMime.includes("officedocument") ||
    imgName.endsWith(".docx") ||
    imgName.endsWith(".doc");

  const isRawImage =
    !isPdf &&
    !isDocx &&
    (imgMime.startsWith("image/") ||
      imgData.startsWith("data:image/") ||
      imgName.endsWith(".png") ||
      imgName.endsWith(".jpg") ||
      imgName.endsWith(".jpeg") ||
      imgName.endsWith(".webp"));

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(doc.docNumber);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCopyOcr = () => {
    navigator.clipboard.writeText(doc.ocrFullText);
    setIsOcrCopied(true);
    setTimeout(() => setIsOcrCopied(false), 2000);
  };

  const handleDownloadImage = () => {
    if (!currentImage?.dataUrl) return;
    const link = window.document.createElement("a");
    link.href = currentImage.dataUrl;
    const ext = isPdf ? "pdf" : isDocx ? "docx" : "png";
    link.download = currentImage.name || `Van_Ban_${doc.docNumber.replace(/[\/\\]/g, "_")}_Trang_${activeImageIndex + 1}.${ext}`;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  return (
    <div
      id="document-detail-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl border-0 sm:border border-slate-200 w-full max-w-6xl overflow-hidden flex flex-col h-full sm:h-auto max-h-[100dvh] sm:max-h-[94vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-3.5 sm:px-6 py-3 sm:py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-mono text-sm sm:text-base font-bold text-emerald-400 truncate">
                  {doc.docNumber}
                </span>
                <span className="text-[10px] sm:text-xs bg-slate-800 text-slate-300 px-1.5 sm:px-2 py-0.5 rounded border border-slate-700 font-semibold shrink-0">
                  {doc.categoryName}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate max-w-xs sm:max-w-lg hidden xs:block">
                {doc.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {doc.driveWebViewLink && (
              <a
                href={doc.driveWebViewLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-emerald-700/60 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer min-h-[36px] border border-emerald-500/40"
                title="Mở tài liệu gốc trên Google Drive"
              >
                <HardDrive className="w-3.5 h-3.5 text-emerald-300" />
                <span className="hidden xs:inline">Google Drive</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <button
              onClick={() => onPrint(doc)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer min-h-[36px]"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">In văn bản / Phiếu</span>
              <span className="xs:hidden">In</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile View Switcher (lg:hidden) */}
        <div className="lg:hidden bg-slate-800 border-b border-slate-700 px-3 py-2 flex items-center justify-between gap-2 shrink-0">
          <div className="grid grid-cols-2 gap-2 w-full">
            <button
              type="button"
              onClick={() => setMobileView("image")}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                mobileView === "image"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200"
              }`}
            >
              {isPdf ? "Tệp PDF" : isDocx ? "Tệp Word" : `Ảnh văn bản (${doc.images?.length || 0})`}
            </button>
            <button
              type="button"
              onClick={() => setMobileView("details")}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                mobileView === "details"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200"
              }`}
            >
              Thông tin & OCR
            </button>
          </div>
        </div>

        {/* Content: 2-column layout (Left: Image/Document viewer, Right: Metadata & OCR) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Column: Interactive Document Viewer (7 cols) */}
          <div className={`lg:col-span-7 bg-slate-950 p-3 sm:p-4 overflow-y-auto ${mobileView === "image" ? "flex flex-col justify-between" : "hidden lg:flex lg:flex-col lg:justify-between"} border-r border-slate-800 select-none`}>
            {/* Viewer Toolbar */}
            <div className="flex items-center justify-between bg-slate-900/90 backdrop-blur-xs p-2 rounded-xl border border-slate-800 mb-3 text-xs text-slate-300">
              {isRawImage ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setZoomLevel((prev) => Math.max(50, prev - 25))}
                    title="Thu nhỏ"
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="px-2 font-mono text-[11px] text-slate-400">
                    {zoomLevel}%
                  </span>
                  <button
                    onClick={() => setZoomLevel((prev) => Math.min(250, prev + 25))}
                    title="Phóng to"
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setRotation((prev) => (prev + 90) % 360)}
                    title="Xoay 90 độ"
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white ml-1"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-slate-400 px-1">
                  <File className="w-4 h-4 text-blue-400" />
                  <span className="truncate max-w-[220px]">
                    {currentImage?.name || (isPdf ? "Tài liệu PDF" : isDocx ? "Tài liệu DOCX" : "Tài liệu văn bản")}
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {isRawImage && (
                  <label className="flex items-center gap-1.5 text-[11px] cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={showElectronicStamp}
                      onChange={(e) => setShowElectronicStamp(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                    />
                    <span>Hiện Dấu số điện tử</span>
                  </label>
                )}

                {currentImage?.dataUrl && (
                  <button
                    onClick={handleDownloadImage}
                    title="Tải tệp đính kèm về máy"
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-[11px] hidden sm:inline">Tải về</span>
                  </button>
                )}
              </div>
            </div>

            {/* Document Canvas Preview Box */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-2 rounded-xl bg-slate-900/50 border border-slate-800/80 min-h-[380px] max-h-[520px] relative">
              {isPdf ? (
                /* PDF Interactive Viewer */
                <div className="w-full h-full min-h-[460px] flex flex-col items-center justify-center relative">
                  {currentImage?.dataUrl ? (
                    <iframe
                      src={currentImage.dataUrl}
                      title={`Xem trước tài liệu ${doc.docNumber}`}
                      className="w-full h-full min-h-[460px] rounded-lg border border-slate-700 bg-white"
                    />
                  ) : doc.driveFileId ? (
                    /* Trực tiếp nhúng bản xem trước PDF từ Google Drive qua Google Drive Viewer */
                    <iframe
                      src={`https://drive.google.com/file/d/${doc.driveFileId}/preview`}
                      title={`Xem trước tài liệu ${doc.docNumber}`}
                      className="w-full h-full min-h-[460px] rounded-lg border border-slate-700 bg-white"
                      allow="autoplay"
                    />
                  ) : doc.driveWebViewLink ? (
                    /* Nhúng qua Google Drive Preview URL */
                    <iframe
                      src={doc.driveWebViewLink.replace(/\/view(\?.*)?$/, "/preview")}
                      title={`Xem trước tài liệu ${doc.docNumber}`}
                      className="w-full h-full min-h-[460px] rounded-lg border border-slate-700 bg-white"
                      allow="autoplay"
                    />
                  ) : (
                    <div className="text-slate-400 text-xs">Không có dữ liệu xem trước tệp PDF</div>
                  )}
                </div>
              ) : isDocx ? (
                /* Word Document (.docx, .doc) Viewer Card */
                <div className="text-center p-8 max-w-md space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/30 shadow-inner">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">Tài liệu Microsoft Word (.docx)</h4>
                    <p className="text-slate-400 text-xs mt-1.5">
                      {currentImage?.name || "Tệp văn bản Word đính kèm"}
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    {doc.driveWebViewLink ? (
                      <a
                        href={doc.driveWebViewLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Mở Google Docs / Drive
                      </a>
                    ) : null}
                    {currentImage?.dataUrl && (
                      <button
                        onClick={handleDownloadImage}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Tải file về máy
                      </button>
                    )}
                  </div>
                </div>
              ) : isRawImage && currentImage ? (
                /* Standard Image Rendering with Zoom & Stamp */
                <div
                  className="relative transition-transform duration-200 origin-center"
                  style={{
                    transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                  }}
                >
                  <img
                    src={currentImage.dataUrl}
                    alt={doc.title}
                    className="max-h-[500px] w-auto shadow-2xl rounded-sm object-contain bg-white ring-1 ring-slate-700"
                  />

                  {/* Stamp Overlay Widget on Image */}
                  {showElectronicStamp && (
                    <div className="absolute top-6 left-6 bg-emerald-950/90 border-2 border-emerald-500 text-emerald-300 p-2.5 rounded-lg shadow-xl text-left pointer-events-none backdrop-blur-xs font-sans">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-white border-b border-emerald-500/50 pb-1 mb-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        ĐÃ CẤP SỐ VĂN BẢN
                      </div>
                      <div className="font-mono text-xs font-black text-emerald-300">
                        {doc.docNumber}
                      </div>
                      <div className="text-[9px] text-slate-300">
                        Ngày: {formatVietnameseDate(doc.registrationDate)}
                      </div>
                      <div className="text-[8px] text-slate-400 font-mono">
                        Mã: {doc.verificationCode}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Fallback: Clear Document Presentation (Tránh broken image & alt text đè tem) */
                <div className="w-full max-w-md bg-white rounded-xl p-6 shadow-2xl border border-slate-200 text-slate-900 space-y-4 text-left">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="font-mono text-sm font-bold text-blue-600">{doc.docNumber}</div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2 py-0.5 rounded">
                      ĐÃ CẤP SỐ
                    </span>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-500 uppercase">Trích yếu văn bản</h5>
                    <p className="text-sm font-semibold text-slate-800 mt-1 leading-snug">{doc.title}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Cơ quan ban hành:</span>
                      <span className="font-medium text-slate-800">{doc.issuingAuthority || "Nội bộ"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Ngày văn bản:</span>
                      <span className="font-medium text-slate-800">{doc.documentDate}</span>
                    </div>
                  </div>
                  {doc.driveWebViewLink && (
                    <div className="pt-2">
                      <a
                        href={doc.driveWebViewLink}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                      >
                        <HardDrive className="w-3.5 h-3.5" />
                        Mở xem tệp gốc trên Google Drive
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Multi-page thumbnails footer */}
            {doc.images && doc.images.length > 1 && (
              <div className="flex items-center gap-2 pt-3 overflow-x-auto">
                {doc.images.map((img, idx) => {
                  const thumbMime = img.mimeType?.toLowerCase() || "";
                  const thumbName = img.name?.toLowerCase() || "";
                  const thumbIsPdf = thumbMime.includes("pdf") || thumbName.endsWith(".pdf");
                  const thumbIsDocx = thumbMime.includes("word") || thumbName.endsWith(".docx");

                  return (
                    <button
                      key={img.id}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-12 h-16 rounded overflow-hidden border-2 shrink-0 cursor-pointer flex items-center justify-center ${
                        activeImageIndex === idx ? "border-blue-500 bg-slate-800" : "border-slate-700 bg-slate-900 opacity-60"
                      }`}
                    >
                      {thumbIsPdf ? (
                        <div className="flex flex-col items-center justify-center text-rose-400">
                          <FileText className="w-5 h-5" />
                          <span className="text-[7px] font-bold">PDF</span>
                        </div>
                      ) : thumbIsDocx ? (
                        <div className="flex flex-col items-center justify-center text-blue-400">
                          <FileText className="w-5 h-5" />
                          <span className="text-[7px] font-bold">DOCX</span>
                        </div>
                      ) : img.dataUrl ? (
                        <img src={img.dataUrl} alt={`Trang ${idx + 1}`} className="w-full h-full object-cover" />
                      ) : (
                        <FileText className="w-5 h-5 text-slate-400" />
                      )}
                      <span className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[8px] text-center">
                        {idx + 1}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Metadata, OCR Text, Email, Audit Trail (5 cols) */}
          <div className={`lg:col-span-5 p-4 sm:p-5 bg-white overflow-y-auto ${mobileView === "details" ? "flex flex-col justify-between" : "hidden lg:flex lg:flex-col lg:justify-between"} space-y-4`}>
            <div className="space-y-4">
              {/* Navigation Tabs */}
              <div className="flex items-center border-b border-slate-200 text-xs font-bold">
                <button
                  onClick={() => setActiveTab("info")}
                  className={`pb-2 px-3 border-b-2 transition-all cursor-pointer ${
                    activeTab === "info"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Thông tin văn bản
                </button>
                {doc.ocrFullText && (
                  <button
                    onClick={() => setActiveTab("ocr")}
                    className={`pb-2 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1 ${
                      activeTab === "ocr"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <FileText className="w-3 h-3 text-slate-400" />
                    Trích xuất văn bản
                  </button>
                )}
                {doc.emailMetadata && (
                  <button
                    onClick={() => setActiveTab("email")}
                    className={`pb-2 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1 ${
                      activeTab === "email"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Mail className="w-3 h-3" />
                    Thư điện tử
                  </button>
                )}
                <button
                  onClick={() => setActiveTab("history")}
                  className={`pb-2 px-3 border-b-2 transition-all cursor-pointer ${
                    activeTab === "history"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Lịch sử
                </button>
              </div>

              {/* Tab 1: Info */}
              {activeTab === "info" && (
                <div className="space-y-3.5 text-xs">
                  {/* Official Number highlight card */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-500 block">Số hiệu chính thức</span>
                      <span className="font-mono text-lg font-black text-blue-700">
                        {doc.docNumber}
                      </span>
                    </div>
                    <button
                      onClick={handleCopyNumber}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-700 font-semibold flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? "Đã chép" : "Sao chép"}</span>
                    </button>
                  </div>

                  {/* Title */}
                  <div>
                    <span className="font-bold text-slate-600 block mb-0.5">Trích yếu nội dung:</span>
                    <p className="text-sm font-bold text-slate-900 leading-snug bg-blue-50/40 p-2.5 rounded-lg border border-blue-100">
                      {doc.title}
                    </p>
                  </div>

                  {/* Grid details */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Loại văn bản</span>
                      <span className="font-bold text-slate-800">{doc.categoryName}</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Phòng ban xử lý</span>
                      <span className="font-mono font-bold text-slate-800">{doc.departmentCode}</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Cơ quan ban hành</span>
                      <span className="font-semibold text-slate-800 truncate block">{doc.issuingAuthority}</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Người ký & chức danh</span>
                      <span className="font-semibold text-slate-800 truncate block">{doc.signer}</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Ngày văn bản</span>
                      <span className="font-semibold text-slate-800">{formatVietnameseDate(doc.documentDate)}</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Ngày cấp số vào sổ</span>
                      <span className="font-semibold text-slate-800">{formatVietnameseDateTime(doc.registrationDate)}</span>
                    </div>
                  </div>

                  {/* Summary */}
                  {doc.summary && (
                    <div>
                      <span className="font-bold text-slate-600 block mb-0.5">Tóm tắt văn bản:</span>
                      <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                        {doc.summary}
                      </p>
                    </div>
                  )}

                  {/* Verification & QR Code */}
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">
                        Mã xác thực số hóa
                      </span>
                      <span className="font-mono font-bold text-xs text-emerald-950">
                        {doc.verificationCode}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 text-[10px] font-bold">
                      HỢP LỆ
                    </span>
                  </div>
                </div>
              )}

              {/* Tab 2: OCR Fulltext */}
              {activeTab === "ocr" && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">
                      Nội dung chữ trích xuất tự động (OCR AI):
                    </span>
                    <button
                      onClick={handleCopyOcr}
                      className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      {isOcrCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isOcrCopied ? "Đã sao chép" : "Sao chép toàn văn"}</span>
                    </button>
                  </div>

                  <div className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] leading-relaxed max-h-[360px] overflow-y-auto whitespace-pre-wrap selection:bg-blue-600">
                    {doc.ocrFullText || "Không có nội dung OCR."}
                  </div>

                  {/* Keywords tags */}
                  {doc.keywords && doc.keywords.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <Tag className="w-3 h-3 text-slate-400" />
                      {doc.keywords.map((k, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-medium"
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Email Metadata */}
              {activeTab === "email" && doc.emailMetadata && (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Người gửi</span>
                      <span className="font-bold text-slate-900">{doc.emailMetadata.senderName}</span>
                      <span className="text-slate-500 font-mono ml-1">({doc.emailMetadata.senderEmail})</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Tiêu đề thư</span>
                      <span className="font-semibold text-slate-800">{doc.emailMetadata.subject}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Thời gian nhận</span>
                      <span className="text-slate-700">{doc.emailMetadata.receivedDate}</span>
                    </div>
                  </div>

                  {/* Attached files section */}
                  {doc.emailMetadata.attachments && doc.emailMetadata.attachments.length > 0 && (
                    <div>
                      <span className="font-bold text-slate-700 block mb-1.5 flex items-center justify-between">
                        <span>Tệp đính kèm trong email ({doc.emailMetadata.attachments.length}):</span>
                        <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Nguồn trích xuất OCR
                        </span>
                      </span>
                      <div className="space-y-1.5">
                        {doc.emailMetadata.attachments.map((att) => (
                          <div
                            key={att.id}
                            className="p-2 rounded-lg bg-blue-50/50 border border-blue-200 flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                              <div className="truncate">
                                <div className="font-bold text-slate-800 text-[11px] truncate">
                                  {att.filename}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  {(att.size / 1024).toFixed(1)} KB • {att.mimeType}
                                </div>
                              </div>
                            </div>

                            {att.dataUrl && (
                              <a
                                href={att.dataUrl}
                                download={att.filename}
                                className="px-2 py-1 bg-white hover:bg-blue-100 text-blue-700 border border-blue-300 rounded text-[10px] font-bold shrink-0 transition-colors"
                              >
                                Tải về
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {doc.emailMetadata.rawBody && (
                    <div>
                      <span className="font-bold text-slate-700 block mb-1">Nội dung thư gốc:</span>
                      <div className="p-3 bg-slate-100 rounded-xl font-mono text-[11px] whitespace-pre-wrap max-h-40 overflow-y-auto text-slate-800">
                        {doc.emailMetadata.rawBody}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: History / Audit Log */}
              {activeTab === "history" && (
                <div className="space-y-3 text-xs">
                  <span className="font-bold text-slate-700 block">Nhật ký xử lý & cấp số:</span>
                  <div className="space-y-2.5">
                    {doc.history && doc.history.map((h) => (
                      <div key={h.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-bold text-blue-700">{h.action}</span>
                          <span className="text-slate-400 font-mono">{formatVietnameseDateTime(h.timestamp)}</span>
                        </div>
                        <p className="text-slate-600 text-[11px]">{h.details}</p>
                        <span className="text-[10px] text-slate-400 block mt-1">Thực hiện bởi: {h.user}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                onClick={() => {
                  if (confirm(`Bạn có chắc muốn xóa văn bản ${doc.docNumber} khỏi sổ đăng ký?`)) {
                    onDelete(doc.id);
                    onClose();
                  }
                }}
                className="text-rose-600 hover:text-rose-700 text-xs font-semibold cursor-pointer"
              >
                Xóa văn bản này
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  onClick={() => onPrint(doc)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> In lại văn bản
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
