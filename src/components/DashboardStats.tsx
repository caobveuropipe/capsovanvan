import React from "react";
import {
  FileText,
  Upload,
  Camera,
  Mail,
  Layers,
  Sparkles,
  TrendingUp,
  Clock,
  Printer,
  Eye,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { DocumentCategory, DocumentRecord } from "../types";
import { formatVietnameseDate, formatVietnameseDateTime } from "../utils/numberGenerator";

interface DashboardStatsProps {
  documents: DocumentRecord[];
  categories: DocumentCategory[];
  onViewDoc: (doc: DocumentRecord) => void;
  onOpenIntake: () => void;
  onOpenConfig: () => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  documents,
  categories,
  onViewDoc,
  onOpenIntake,
  onOpenConfig,
}) => {
  const totalDocs = documents.length;

  const uploadCount = documents.filter((d) => d.intakeSource === "UPLOAD").length;
  const cameraCount = documents.filter((d) => d.intakeSource === "CAMERA").length;
  const emailCount = documents.filter((d) => d.intakeSource === "EMAIL").length;

  const uploadPct = totalDocs > 0 ? Math.round((uploadCount / totalDocs) * 100) : 0;
  const cameraPct = totalDocs > 0 ? Math.round((cameraCount / totalDocs) * 100) : 0;
  const emailPct = totalDocs > 0 ? Math.round((emailCount / totalDocs) * 100) : 0;

  // Recent 5 documents
  const recentDocs = [...documents]
    .sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top 4 KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Docs */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Tổng văn bản đã cấp
            </span>
            <div className="text-2xl font-black font-mono text-slate-900 mt-1">
              {totalDocs}
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5" /> Hoạt động tự động
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Upload Intake */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Tải tệp trực tiếp
            </span>
            <div className="text-2xl font-black font-mono text-slate-900 mt-1">
              {uploadCount}
            </div>
            <span className="text-[11px] text-slate-500 font-medium mt-1 block">
              Chiếm {uploadPct}% tổng lưu lượng
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Upload className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Camera Scan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Quét qua Camera
            </span>
            <div className="text-2xl font-black font-mono text-slate-900 mt-1">
              {cameraCount}
            </div>
            <span className="text-[11px] text-slate-500 font-medium mt-1 block">
              Chiếm {cameraPct}% tổng lưu lượng
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Camera className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Email Gateway */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Tiếp nhận từ Email
            </span>
            <div className="text-2xl font-black font-mono text-slate-900 mt-1">
              {emailCount}
            </div>
            <span className="text-[11px] text-slate-500 font-medium mt-1 block">
              Chiếm {emailPct}% tổng lưu lượng
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Mail className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2-Column Analytics Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Category Distribution & Numbering Rule Master (6 cols) */}
        <div className="lg:col-span-6 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                Phân bổ Cấp số theo Loại văn bản
              </h3>
              <p className="text-xs text-slate-500">
                Quy tắc sinh số &amp; số lượng văn bản đã cấp của từng danh mục
              </p>
            </div>
            <button
              onClick={onOpenConfig}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
            >
              Tùy chỉnh &rarr;
            </button>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {categories.map((cat) => {
              const countInDb = documents.filter(
                (d) => d.categoryId === cat.id || d.categoryCode === cat.code
              ).length;
              const pct = totalDocs > 0 ? Math.round((countInDb / totalDocs) * 100) : 0;

              return (
                <div
                  key={cat.id}
                  className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono text-[10px]">
                        {cat.code}
                      </span>
                      <span>{cat.name}</span>
                    </div>
                    <span className="font-mono text-blue-700">
                      {countInDb} văn bản ({pct}%)
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, pct)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 font-mono">
                    <span>
                      Tiền/Hậu tố: <strong className="text-slate-700">{cat.prefix || "Ø"}</strong> ... <strong className="text-slate-700">{cat.suffix || "Ø"}</strong>
                    </span>
                    <span>Số tiếp theo: <strong className="text-emerald-700">{cat.currentCount + 1}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Recent Document Timeline (6 cols) */}
        <div className="lg:col-span-6 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                Nhật ký Cấp số gần nhất
              </h3>
              <p className="text-xs text-slate-500">
                Các văn bản vừa được tiếp nhận và cấp số tự động
              </p>
            </div>
            <button
              onClick={onOpenIntake}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
            >
              + Cấp số mới
            </button>
          </div>

          <div className="space-y-3">
            {recentDocs.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                Chưa có văn bản nào trong hệ thống.
              </div>
            ) : (
              recentDocs.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => onViewDoc(doc)}
                  className="p-3 bg-slate-50 hover:bg-blue-50/60 rounded-xl border border-slate-200 transition-all flex items-center justify-between cursor-pointer group"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-blue-700">
                        {doc.docNumber}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 text-[10px] font-semibold">
                        {doc.categoryName}
                      </span>
                    </div>
                    <h5 className="text-xs font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                      {doc.title}
                    </h5>
                    <span className="text-[10px] text-slate-400">
                      {formatVietnameseDateTime(doc.registrationDate)}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDoc(doc);
                    }}
                    className="px-2.5 py-1 bg-white group-hover:bg-blue-600 group-hover:text-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors shrink-0 shadow-2xs"
                  >
                    Xem & In
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
