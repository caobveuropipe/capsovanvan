import React, { useState, useMemo, useEffect, useRef } from "react";
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
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  AlertCircle,
  Shield,
  Cloud,
} from "lucide-react";
import { DocumentCategory, DocumentRecord, IntakeSource } from "../types";
import { formatVietnameseDate, formatVietnameseDateTime } from "../utils/numberGenerator";

interface DocumentArchiveViewProps {
  documents: DocumentRecord[];
  categories: DocumentCategory[];
  onViewDetail: (doc: DocumentRecord) => void;
  onPrintDocument: (doc: DocumentRecord) => void;
  onDeleteDocument: (id: string) => Promise<{ success: boolean; driveSynced: boolean; message?: string }> | void;
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
  const [docToDeleteConfirm, setDocToDeleteConfirm] = useState<DocumentRecord | null>(null);
  const [isDeletingDocId, setIsDeletingDocId] = useState<string | null>(null);
  const categoryScrollRef = useRef<HTMLDivElement | null>(null);

  // Phân trang danh sách văn bản
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Tự động trở về trang 1 khi thay đổi tìm kiếm, bộ lọc hoặc thứ tự sắp xếp
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategoryFilter, selectedSourceFilter, sortBy]);

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
      case "DRIVE":
        return <Cloud className="w-3 h-3 text-sky-500" />;
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
      case "DRIVE":
        return "Google Drive";
      default:
        return "Thủ công";
    }
  };

  // Tính toán dữ liệu phân trang
  const totalDocs = filteredDocs.length;
  const totalPages = Math.max(1, Math.ceil(totalDocs / pageSize));
  const activePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (activePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalDocs);

  const paginatedDocs = useMemo(() => {
    return filteredDocs.slice(startIndex, endIndex);
  }, [filteredDocs, startIndex, endIndex]);

  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (activePage > 3) {
        pages.push("...");
      }
      const start = Math.max(2, activePage - 1);
      const end = Math.min(totalPages - 1, activePage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (activePage < totalPages - 2) {
        pages.push("...");
      }
      pages.push(totalPages);
    }
    return pages;
  };

  // Component thanh phân trang dùng chung cho cả Grid và Table
  const renderPagination = () => {
    if (totalDocs === 0) return null;

    return (
      <div className="px-3.5 py-1.5 sm:py-2 bg-slate-50/90 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
        {/* Thông tin số lượng bản ghi */}
        <div className="flex items-center gap-1.5 font-medium text-slate-600">
          <span>Hiển thị</span>
          <span className="font-bold text-slate-900 font-mono">
            {startIndex + 1} - {endIndex}
          </span>
          <span>trên tổng số</span>
          <span className="font-bold text-slate-900 font-mono">{totalDocs}</span>
          <span>văn bản</span>
        </div>

        {/* Cụm điều khiển phân trang */}
        <div className="flex flex-wrap items-center justify-end gap-3">
          {/* Lựa chọn số dòng hiển thị */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 text-[11px] hidden sm:inline">Số dòng:</span>
            <select
              id="select-page-size"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 text-xs font-semibold bg-white rounded-lg border border-slate-200 text-slate-700 cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
            >
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
              <option value={100}>100 / trang</option>
            </select>
          </div>

          {/* Các nút chuyển trang */}
          <div className="flex items-center gap-1">
            {/* Trang đầu */}
            <button
              type="button"
              id="btn-page-first"
              disabled={activePage <= 1}
              onClick={() => setCurrentPage(1)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Trang đầu"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>

            {/* Trang trước */}
            <button
              type="button"
              id="btn-page-prev"
              disabled={activePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Trang trước"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* Danh sách nút số trang */}
            <div className="flex items-center gap-1">
              {getPageNumbers().map((p, idx) =>
                p === "..." ? (
                  <span
                    key={`dots-${idx}`}
                    className="px-1.5 py-1 text-slate-400 font-bold select-none text-xs"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={`page-${p}`}
                    type="button"
                    onClick={() => setCurrentPage(p as number)}
                    className={`min-w-[28px] h-7 px-2 flex items-center justify-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activePage === p
                        ? "bg-blue-600 text-white font-bold shadow-xs shadow-blue-500/20"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            </div>

            {/* Trang sau */}
            <button
              type="button"
              id="btn-page-next"
              disabled={activePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Trang sau"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Trang cuối */}
            <button
              type="button"
              id="btn-page-last"
              disabled={activePage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Trang cuối"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-2.5 max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-10 py-2 sm:py-2.5">
      {/* Top Search & Filter Bar - Thu gọn theo Hình 2 */}
      <div className="bg-white rounded-xl p-2.5 sm:p-3 shadow-2xs border border-slate-200 space-y-2">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-documents"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tra cứu theo số văn bản, trích yếu, người ký, cơ quan ban hành, nội dung OCR..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 focus:bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-1.5 focus:ring-blue-500 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
              >
                Xóa
              </button>
            )}
          </div>

          {/* Quick Actions (Sort, View Mode, Export) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-semibold bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 text-slate-700 cursor-pointer transition-colors"
            >
              <option value="newest">Mới nhất trước</option>
              <option value="oldest">Cũ nhất trước</option>
              <option value="number">Theo số thứ tự</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                id="btn-view-mode-grid"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-white text-blue-600 shadow-2xs font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Dạng lưới hình ảnh"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                id="btn-view-mode-table"
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  viewMode === "table"
                    ? "bg-white text-blue-600 shadow-2xs font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Dạng bảng chi tiết"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Export CSV button */}
            <button
              id="btn-export-excel-csv"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition-colors cursor-pointer shadow-2xs"
              title="Xuất Sổ đăng ký văn bản ra file CSV/Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Xuất Số CSV</span>
            </button>
          </div>
        </div>

        {/* Row 2: Category Filter Chips & Intake Source Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 flex-1">
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCategoryFilter === "ALL"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              <span>Tất cả</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                selectedCategoryFilter === "ALL" ? "bg-white/25 text-white" : "bg-slate-200 text-slate-600"
              }`}>
                {documents.length}
              </span>
            </button>

            {activeCategories.map((c) => {
              const count = documents.filter(
                (d) => d.categoryId === c.id || d.categoryCode === c.code
              ).length;
              const isSelected = selectedCategoryFilter === c.id || selectedCategoryFilter === c.code;

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(c.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-2xs font-bold"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  <span>{c.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isSelected ? "bg-white/25 text-white" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Source Tabs */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[11px] text-slate-400 font-medium mr-0.5">Nguồn:</span>
            {(["ALL", "UPLOAD", "CAMERA", "EMAIL", "DRIVE"] as const).map((src) => (
              <button
                key={src}
                onClick={() => setSelectedSourceFilter(src)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-semibold cursor-pointer transition-colors ${
                  selectedSourceFilter === src
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {src === "ALL" ? "Tất cả nguồn" : getSourceLabel(src)}
              </button>
            ))}
          </div>
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
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-5">
            {paginatedDocs.map((doc) => {
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
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPrintDocument(doc);
                        }}
                        title="In phiếu hoặc văn bản có dấu"
                        className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-white transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDocToDeleteConfirm(doc);
                        }}
                        title="Xóa văn bản"
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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

          {/* Phân trang cho Grid View */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {renderPagination()}
          </div>
        </div>
      ) : (
        /* 2. TABLE LIST VIEW CÓ STICKY HEADER VÀ PHÂN TRANG */
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          {/* Scrollable table viewport: cố định thead khi cuộn */}
          <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-210px)] min-h-[300px] relative">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-20 bg-slate-50 border-b border-slate-200 text-slate-700 uppercase text-[11px] font-bold tracking-wider shadow-2xs">
                <tr>
                  <th className="sticky top-0 z-20 bg-slate-50 px-3.5 py-2.5 font-bold text-slate-700 whitespace-nowrap">
                    Số văn bản
                  </th>
                  <th className="sticky top-0 z-20 bg-slate-50 px-3.5 py-2.5 font-bold text-slate-700 whitespace-nowrap">
                    Loại văn bản
                  </th>
                  <th className="sticky top-0 z-20 bg-slate-50 px-3.5 py-2.5 font-bold text-slate-700 whitespace-nowrap">
                    Trích yếu nội dung
                  </th>
                  <th className="sticky top-0 z-20 bg-slate-50 px-3.5 py-2.5 font-bold text-slate-700 whitespace-nowrap">
                    Cơ quan ban hành
                  </th>
                  <th className="sticky top-0 z-20 bg-slate-50 px-3.5 py-2.5 font-bold text-slate-700 whitespace-nowrap">
                    Người ký
                  </th>
                  <th className="sticky top-0 z-20 bg-slate-50 px-3.5 py-2.5 font-bold text-slate-700 whitespace-nowrap">
                    Ngày cấp
                  </th>
                  <th className="sticky top-0 z-20 bg-slate-50 px-3.5 py-2.5 font-bold text-slate-700 whitespace-nowrap">
                    Nguồn
                  </th>
                  <th className="sticky top-0 z-20 bg-slate-50 px-3.5 py-2.5 text-right font-bold text-slate-700 whitespace-nowrap">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {paginatedDocs.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => onViewDetail(doc)}
                    className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-3.5 py-2 font-mono font-bold text-blue-600 whitespace-nowrap">
                      {doc.docNumber}
                    </td>
                    <td className="px-3.5 py-2 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold text-[11px]">
                        {doc.categoryName}
                      </span>
                    </td>
                    <td
                      className="px-3.5 py-2 font-medium text-slate-900 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-3xl truncate"
                      title={doc.title}
                    >
                      {doc.title}
                    </td>
                    <td
                      className="px-3.5 py-2 text-slate-600 truncate max-w-[150px] lg:max-w-[220px] xl:max-w-[280px] 2xl:max-w-[340px]"
                      title={doc.issuingAuthority}
                    >
                      {doc.issuingAuthority}
                    </td>
                    <td
                      className="px-3.5 py-2 text-slate-600 truncate max-w-[120px] lg:max-w-[160px] xl:max-w-[200px] 2xl:max-w-[240px]"
                      title={doc.signer}
                    >
                      {doc.signer}
                    </td>
                    <td className="px-3.5 py-2 text-slate-500 whitespace-nowrap">
                      {formatVietnameseDate(doc.registrationDate)}
                    </td>
                    <td className="px-3.5 py-2 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-semibold text-slate-700">
                        {getSourceIcon(doc.intakeSource)}
                        {getSourceLabel(doc.intakeSource)}
                      </span>
                    </td>
                    <td className="px-3.5 py-2 text-right whitespace-nowrap">
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
                          type="button"
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
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDocToDeleteConfirm(doc);
                          }}
                          title="Xóa văn bản"
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
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

          {/* Footer Phân trang cố định ở chân bảng */}
          {renderPagination()}
        </div>
      )}

      {/* In-App Delete Confirmation Modal for Archive View */}
      {docToDeleteConfirm && (
        <div 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-60 flex items-center justify-center p-4"
          onClick={(e) => {
            e.stopPropagation();
            if (!isDeletingDocId) setDocToDeleteConfirm(null);
          }}
        >
          <div 
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Xác nhận xóa văn bản
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Bạn có chắc chắn muốn xóa văn bản{" "}
                  <strong className="text-slate-900 font-mono font-bold">{docToDeleteConfirm.docNumber}</strong>?
                </p>
                <p className="text-[11px] text-slate-500 italic">
                  "{docToDeleteConfirm.title}"
                </p>
              </div>
            </div>

            <div className="bg-amber-50 rounded-xl p-3 border border-amber-200/80 text-[11px] text-amber-800 space-y-1">
              <p className="font-semibold flex items-center gap-1 text-amber-900">
                <Shield className="w-3.5 h-3.5" /> Lưu ý an toàn:
              </p>
              <p>
                Văn bản sẽ được đánh dấu xóa khỏi sổ đăng ký. Tệp đính kèm trên Google Drive (nếu có) cũng sẽ được dọn dẹp theo quy định.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeletingDocId !== null}
                onClick={(e) => {
                  e.stopPropagation();
                  setDocToDeleteConfirm(null);
                }}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isDeletingDocId !== null}
                onClick={async (e) => {
                  e.stopPropagation();
                  if (isDeletingDocId || !docToDeleteConfirm) return;
                  const docId = docToDeleteConfirm.id;
                  setIsDeletingDocId(docId);
                  try {
                    await onDeleteDocument(docId);
                    setIsDeletingDocId(null);
                    setDocToDeleteConfirm(null);
                  } catch (err) {
                    setIsDeletingDocId(null);
                    setDocToDeleteConfirm(null);
                  }
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeletingDocId ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Xác nhận xóa
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
