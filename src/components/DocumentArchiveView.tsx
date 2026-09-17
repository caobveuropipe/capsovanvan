import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Grid,
  List,
  Eye,
  Printer,
  Download,
  Trash2,
  Copy,
  Check,
  Calendar,
  Sparkles,
  FileText,
  Building,
  UserCheck,
  Tag,
  FileSpreadsheet,
  Layers,
  ArrowUpDown,
  FileCheck,
  Clock,
  Mail,
  Camera,
  ExternalLink,
  HardDrive,
  Upload,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { DocumentCategory, DocumentRecord, IntakeSource } from "../types";
import { formatVietnameseDate, formatVietnameseDateTime } from "../utils/numberGenerator";

interface DocumentArchiveViewProps {
  documents: DocumentRecord[];
  categories: DocumentCategory[];
  onViewDetail: (doc: DocumentRecord) => void;
  onPrintDocument: (doc: DocumentRecord) => void;
  onDeleteDocument: (id: string) => void;
  onOpenIntake: () => void;
}

export const DocumentArchiveView: React.FC<DocumentArchiveViewProps> = ({
  documents,
  categories,
  onViewDetail,
  onPrintDocument,
  onDeleteDocument,
  onOpenIntake,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("ALL");
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "number">("newest");
  const categoryScrollRef = React.useRef<HTMLDivElement | null>(null);

  const scrollCategories = (direction: "left" | "right") => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({
        left: direction === "left" ? -240 : 240,
        behavior: "smooth",
      });
    }
  };

  // Chỉ hiển thị các loại văn bản thực tế đã phát sinh tài liệu trong kho lưu trữ
  const activeCategories = useMemo(() => {
    if (documents.length === 0) return [];
    // Tập hợp categoryId hoặc categoryCode có trong documents
    const docCategoryIds = new Set(documents.map((d) => d.categoryId));
    const docCategoryCodes = new Set(documents.map((d) => d.categoryCode));
    
    return categories.filter(
      (c) => docCategoryIds.has(c.id) || docCategoryCodes.has(c.code)
    );
  }, [categories, documents]);

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      // Category filter
      if (selectedCategoryFilter !== "ALL" && doc.categoryId !== selectedCategoryFilter && doc.categoryCode !== selectedCategoryFilter) {
        return false;
      }
      // Source filter
      if (selectedSourceFilter !== "ALL" && doc.intakeSource !== selectedSourceFilter) {
        return false;
      }
      // Search text filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNumber = doc.docNumber.toLowerCase().includes(q);
        const matchTitle = doc.title.toLowerCase().includes(q);
        const matchAuthority = doc.issuingAuthority.toLowerCase().includes(q);
        const matchSigner = doc.signer.toLowerCase().includes(q);
        const matchRecipient = doc.recipient.toLowerCase().includes(q);
        const matchOcr = doc.ocrFullText.toLowerCase().includes(q);
        const matchSummary = doc.summary.toLowerCase().includes(q);
        const matchCode = doc.verificationCode.toLowerCase().includes(q);

        if (!matchNumber && !matchTitle && !matchAuthority && !matchSigner && !matchRecipient && !matchOcr && !matchSummary && !matchCode) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime();
      } else if (sortBy === "oldest") {
        return new Date(a.registrationDate).getTime() - new Date(b.registrationDate).getTime();
      } else {
        return a.sequenceNumber - b.sequenceNumber;
      }
    });
  }, [documents, searchQuery, selectedCategoryFilter, selectedSourceFilter, sortBy]);

  const handleCopyNumber = (docNumber: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(docNumber);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCSV = () => {
    if (filteredDocs.length === 0) {
      alert("Không có dữ liệu văn bản để xuất file.");
      return;
    }

    const headers = [
      "Số văn bản",
      "Loại văn bản",
      "Trích yếu",
      "Cơ quan ban hành",
      "Người ký",
      "Nơi nhận",
      "Ngày văn bản",
      "Ngày cấp số",
      "Phòng ban",
      "Nguồn tiếp nhận",
      "Mức độ khẩn",
      "Mức độ mật",
      "Mã xác thực",
    ];

    const rows = filteredDocs.map((d) => [
      `"${d.docNumber.replace(/"/g, '""')}"`,
      `"${d.categoryName}"`,
      `"${d.title.replace(/"/g, '""')}"`,
      `"${d.issuingAuthority.replace(/"/g, '""')}"`,
      `"${d.signer.replace(/"/g, '""')}"`,
      `"${d.recipient.replace(/"/g, '""')}"`,
      `"${d.documentDate}"`,
      `"${d.registrationDate}"`,
      `"${d.departmentCode}"`,
      `"${d.intakeSource}"`,
      `"${d.urgency}"`,
      `"${d.secrecy}"`,
      `"${d.verificationCode}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `So_Dang_Ky_Van_Ban_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSourceIcon = (source: IntakeSource) => {
    switch (source) {
      case "UPLOAD":
        return <Upload className="w-3 h-3 text-blue-500" />;
      case "CAMERA":
        return <Camera className="w-3 h-3 text-emerald-500" />;
      case "EMAIL":
        return <Mail className="w-3 h-3 text-indigo-500" />;
      default:
        return <FileText className="w-3 h-3 text-slate-500" />;
    }
  };

  const getSourceLabel = (source: IntakeSource) => {
    switch (source) {
      case "UPLOAD":
        return "Tải tệp";
      case "CAMERA":
        return "Chụp ảnh";
      case "EMAIL":
        return "Email";
      default:
        return "Thủ công";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-documents"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tra cứu theo số văn bản, trích yếu, người ký, cơ quan ban hành, nội dung OCR..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Xóa
              </button>
            )}
          </div>

          {/* Quick Actions (Sort, View Mode, Export) */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 rounded-xl border border-slate-200 text-slate-700 cursor-pointer"
            >
              <option value="newest">Mới nhất trước</option>
              <option value="oldest">Cũ nhất trước</option>
              <option value="number">Theo số thứ tự</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                id="btn-view-mode-grid"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-white text-blue-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Dạng lưới hình ảnh"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                id="btn-view-mode-table"
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === "table"
                    ? "bg-white text-blue-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Dạng bảng chi tiết"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Export CSV button */}
            <button
              id="btn-export-excel-csv"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition-colors cursor-pointer"
              title="Xuất Sổ đăng ký văn bản ra file CSV/Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Xuất Sổ CSV</span>
            </button>
          </div>
        </div>

        {/* Category Filter Chips Bar with Scroll Buttons & Visible Scrollbar */}
        <div className="relative flex items-center group">
          {/* Scroll Left Button (chỉ hiện khi có nhiều danh mục) */}
          {activeCategories.length > 4 && (
            <button
              type="button"
              onClick={() => scrollCategories("left")}
              className="hidden sm:flex items-center justify-center w-7 h-7 rounded-full bg-white/90 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-sm cursor-pointer shrink-0 mr-1 z-10 transition-all hover:scale-105"
              title="Cuộn sang trái"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Scrollable Container with custom visible scrollbar */}
          <div
            ref={categoryScrollRef}
            className="flex-1 flex items-center gap-1.5 overflow-x-auto pb-2 pt-1 scroll-smooth category-filter-scrollbar"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#94a3b8 #f1f5f9",
            }}
          >
            <button
              onClick={() => setSelectedCategoryFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
                selectedCategoryFilter === "ALL"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              Tất cả ({documents.length})
            </button>

            {activeCategories.map((c) => {
              const count = documents.filter(
                (d) => d.categoryId === c.id || d.categoryCode === c.code
              ).length;
              const isSelected = selectedCategoryFilter === c.id;

              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategoryFilter(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  <span>{c.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}

            <div className="border-l border-slate-200 pl-2 ml-1 flex items-center gap-1 shrink-0">
              <span className="text-[11px] text-slate-400 font-medium mr-1">Nguồn:</span>
              {["ALL", "UPLOAD", "CAMERA", "EMAIL"].map((src) => (
                <button
                  key={src}
                  onClick={() => setSelectedSourceFilter(src)}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold cursor-pointer ${
                    selectedSourceFilter === src
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {src === "ALL" ? "Tất cả nguồn" : getSourceLabel(src as IntakeSource)}
                </button>
              ))}
            </div>
          </div>

          {/* Scroll Right Button (chỉ hiện khi có nhiều danh mục) */}
          {activeCategories.length > 4 && (
            <button
              type="button"
              onClick={() => scrollCategories("right")}
              className="hidden sm:flex items-center justify-center w-7 h-7 rounded-full bg-white/90 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-sm cursor-pointer shrink-0 ml-1 z-10 transition-all hover:scale-105"
              title="Cuộn sang phải"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Document Results Content */}
      {filteredDocs.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Không tìm thấy văn bản nào phù hợp
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Thử thay đổi từ khóa tìm kiếm hoặc bấm nút bên dưới để tiếp nhận & cấp số mới.
            </p>
          </div>
          <button
            onClick={onOpenIntake}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" /> Tiếp nhận văn bản ngay
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* 1. GRID VIEW WITH IMAGE PREVIEWS */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocs.map((doc) => {
            const hasImage = doc.images && doc.images.length > 0;
            const primaryImg = hasImage ? doc.images[0] : null;
            const primaryThumb = primaryImg?.dataUrl || null;
            const thumbMime = primaryImg?.mimeType?.toLowerCase() || "";
            const thumbName = primaryImg?.name?.toLowerCase() || "";
            const isThumbPdf = thumbMime.includes("pdf") || thumbName.endsWith(".pdf") || primaryThumb?.startsWith("data:application/pdf");
            const isThumbDocx = thumbMime.includes("word") || thumbMime.includes("officedocument") || thumbName.endsWith(".docx") || thumbName.endsWith(".doc");
            const isThumbImage = primaryThumb && !isThumbPdf && !isThumbDocx && (primaryThumb.startsWith("data:image/") || thumbMime.startsWith("image/"));

            return (
              <div
                key={doc.id}
                onClick={() => onViewDetail(doc)}
                className="bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col justify-between group cursor-pointer"
              >
                {/* Card Header & Scanned Document Thumbnail Preview */}
                <div>
                  <div className="relative aspect-16/10 bg-slate-100 overflow-hidden border-b border-slate-100">
                    {isThumbImage ? (
                      <img
                        src={primaryThumb}
                        alt={doc.title}
                        className="w-full h-full object-cover object-top group-hover:scale-103 transition-transform duration-300"
                      />
                    ) : isThumbPdf ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-rose-50/50 text-rose-500">
                        <FileText className="w-12 h-12 stroke-1" />
                        <span className="text-[11px] font-bold mt-1 text-rose-700 bg-rose-100 px-2 py-0.5 rounded">Tệp PDF</span>
                      </div>
                    ) : isThumbDocx ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-blue-50/50 text-blue-500">
                        <FileText className="w-12 h-12 stroke-1" />
                        <span className="text-[11px] font-bold mt-1 text-blue-700 bg-blue-100 px-2 py-0.5 rounded">Tệp Word</span>
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                        <FileText className="w-12 h-12 stroke-1" />
                        <span className="text-[10px] text-slate-400 mt-1">Văn bản số hóa</span>
                      </div>
                    )}

                    {/* Official Number Stamp Overlay on thumbnail */}
                    <div className="absolute top-2.5 left-2.5 bg-slate-950/85 backdrop-blur-xs text-white px-2.5 py-1 rounded-lg border border-white/20 shadow-md flex items-center gap-1.5 font-mono text-xs font-bold">
                      <span className="text-emerald-400">{doc.docNumber}</span>
                    </div>

                    {/* Source Badge */}
                    <div className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-700 shadow-sm flex items-center gap-1 border border-slate-200">
                      {getSourceIcon(doc.intakeSource)}
                      <span>{getSourceLabel(doc.intakeSource)}</span>
                    </div>

                    {/* Urgency Badge (if not THUONG) */}
                    {doc.urgency !== "THUONG" && (
                      <div className="absolute bottom-2.5 right-2.5 bg-rose-600 text-white px-2 py-0.5 rounded-md text-[10px] font-bold shadow-md uppercase tracking-wider">
                        {doc.urgency}
                      </div>
                    )}
                  </div>

                  {/* Document Card Info */}
                  <div className="p-4 space-y-2.5">
                    {/* Category & Date */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-[11px]">
                        {doc.categoryName}
                      </span>
                      <span className="text-slate-400 text-[11px] flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatVietnameseDate(doc.registrationDate)}
                      </span>
                    </div>

                    {/* Document Title / Trích yếu */}
                    <h4 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                      {doc.title}
                    </h4>

                    {/* Issuing Authority & Signer */}
                    <div className="text-xs text-slate-500 space-y-1 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 truncate">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{doc.issuingAuthority}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{doc.signer}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-mono text-slate-400 font-medium truncate max-w-[120px]">
                    {doc.verificationCode}
                  </span>

                  <div className="flex items-center gap-1">
                    {/* Copy number */}
                    <button
                      onClick={(e) => handleCopyNumber(doc.docNumber, doc.id, e)}
                      title="Sao chép số văn bản"
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-white transition-colors"
                    >
                      {copiedId === doc.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Google Drive Link if synced */}
                    {doc.driveWebViewLink && (
                      <a
                        href={doc.driveWebViewLink}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title="Mở file trên Google Drive"
                        className="p-1.5 text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-medium"
                      >
                        <HardDrive className="w-3.5 h-3.5" />
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    {/* Print */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPrintDocument(doc);
                      }}
                      title="In phiếu hoặc văn bản có dấu"
                      className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-white transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>

                    {/* View Detail */}
                    <button
                      onClick={() => onViewDetail(doc)}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 shadow-xs transition-colors"
                    >
                      <Eye className="w-3 h-3" /> Xem & In
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* 2. TABLE LIST VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3.5 font-bold">Số văn bản</th>
                  <th className="px-4 py-3.5 font-bold">Loại văn bản</th>
                  <th className="px-4 py-3.5 font-bold">Trích yếu nội dung</th>
                  <th className="px-4 py-3.5 font-bold">Cơ quan ban hành</th>
                  <th className="px-4 py-3.5 font-bold">Người ký</th>
                  <th className="px-4 py-3.5 font-bold">Ngày cấp</th>
                  <th className="px-4 py-3.5 font-bold">Nguồn</th>
                  <th className="px-4 py-3.5 text-right font-bold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredDocs.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => onViewDetail(doc)}
                    className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-blue-600 whitespace-nowrap">
                      {doc.docNumber}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold text-[11px]">
                        {doc.categoryName}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 max-w-xs truncate">
                      {doc.title}
                    </td>
                    <td className="px-4 py-3 text-slate-600 truncate max-w-[150px]">
                      {doc.issuingAuthority}
                    </td>
                    <td className="px-4 py-3 text-slate-600 truncate max-w-[120px]">
                      {doc.signer}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {formatVietnameseDate(doc.registrationDate)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-semibold text-slate-700">
                        {getSourceIcon(doc.intakeSource)}
                        {getSourceLabel(doc.intakeSource)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => handleCopyNumber(doc.docNumber, doc.id, e)}
                          title="Sao chép số"
                          className="p-1 text-slate-400 hover:text-blue-600"
                        >
                          {copiedId === doc.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        {/* Google Drive Link if synced */}
                        {doc.driveWebViewLink && (
                          <a
                            href={doc.driveWebViewLink}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title="Mở trên Google Drive"
                            className="p-1 text-emerald-600 hover:text-emerald-700 bg-emerald-50 rounded"
                          >
                            <HardDrive className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPrintDocument(doc);
                          }}
                          title="In ấn"
                          className="p-1 text-slate-400 hover:text-slate-800"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewDetail(doc);
                          }}
                          className="px-2 py-1 bg-slate-100 group-hover:bg-blue-600 group-hover:text-white rounded text-[11px] font-semibold transition-colors"
                        >
                          Chi tiết
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
