import React from "react";
import {
  FileText,
  PlusCircle,
  Settings,
  Archive,
  BarChart3,
  Layers,
  Sparkles,
  Printer,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

interface NavbarProps {
  currentTab: "archive" | "stats";
  onTabChange: (tab: "archive" | "stats") => void;
  onOpenIntake: () => void;
  onOpenConfig: () => void;
  onOpenGoogleDrive?: () => void;
  onSyncDrive?: () => void;
  isDriveConnected?: boolean;
  isDriveTokenExpired?: boolean;
  isSyncing?: boolean;
  totalDocsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  onOpenIntake,
  onOpenConfig,
  onOpenGoogleDrive,
  onSyncDrive,
  isDriveConnected = false,
  isDriveTokenExpired = false,
  isSyncing = false,
  totalDocsCount,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Brand & Logo */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/20 shrink-0">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-base sm:text-lg tracking-tight text-white truncate">
                  Documents Number
                </span>
                <span className="hidden xs:inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 shrink-0">
                  <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-300" /> Cấp số tự động
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-normal truncate max-w-[170px] sm:max-w-xs md:max-w-md hidden sm:block">
                Tiếp nhận và cấp số văn bản
              </p>
            </div>
          </div>

          {/* Navigation & Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* View Switcher Tabs (Desktop only) */}
            <div className="hidden md:flex items-center bg-slate-800/80 p-1 rounded-lg border border-slate-700/60">
              <button
                id="btn-nav-archive"
                onClick={() => onTabChange("archive")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  currentTab === "archive"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                <Archive className="w-3.5 h-3.5" />
                Kho lưu trữ & Tra cứu
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-black/30 text-[10px]">
                  {totalDocsCount}
                </span>
              </button>
              <button
                id="btn-nav-stats"
                onClick={() => onTabChange("stats")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  currentTab === "stats"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Thống kê số liệu
              </button>
            </div>

            {/* Google Drive BYOS Storage Config */}
            {onOpenGoogleDrive && (
              <div className="flex items-center gap-1">
                <button
                  id="btn-open-google-drive"
                  onClick={onOpenGoogleDrive}
                  className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border text-xs sm:text-sm font-medium transition-colors cursor-pointer shadow-sm min-h-[38px] ${
                    isDriveConnected
                      ? isDriveTokenExpired
                        ? "bg-amber-950/40 text-amber-300 border-amber-600/60 hover:bg-amber-900/40"
                        : "bg-emerald-950/40 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900/40"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:border-slate-600"
                  }`}
                  title={
                    isDriveTokenExpired
                      ? "Phiên kết nối Google Drive đã hết hạn - Bấm để gia hạn"
                      : "Lưu trữ văn bản trên Google Drive cá nhân (BYOS)"
                  }
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isDriveConnected
                        ? isDriveTokenExpired
                          ? "bg-amber-400 animate-ping"
                          : "bg-emerald-400 animate-pulse"
                        : "bg-slate-500"
                    }`}
                  />
                  <span className="hidden xs:inline">Google Drive</span>
                  <span className="xs:hidden font-mono text-[11px]">Drive</span>
                  {isDriveTokenExpired && (
                    <span className="text-[9px] sm:text-[10px] bg-amber-500/20 text-amber-300 px-1 sm:px-1.5 py-0.5 rounded border border-amber-500/30">
                      Hết hạn
                    </span>
                  )}
                </button>

                {/* Direct Sync Button if Connected (and token not expired) */}
                {isDriveConnected && !isDriveTokenExpired && onSyncDrive && (
                  <button
                    id="btn-sync-google-drive"
                    onClick={onSyncDrive}
                    disabled={isSyncing}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer shadow-sm min-h-[38px] min-w-[38px] flex items-center justify-center disabled:opacity-50"
                    title="Đồng bộ danh mục & sổ văn bản với Google Drive (Để dùng chung nhiều máy)"
                  >
                    <RefreshCw
                      className={`w-4 h-4 text-emerald-400 ${isSyncing ? "animate-spin text-blue-400" : ""}`}
                    />
                  </button>
                )}
              </div>
            )}

            {/* Category Prefix/Suffix Configuration (Desktop/Tablet) */}
            <button
              id="btn-open-category-config"
              onClick={onOpenConfig}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 text-xs sm:text-sm font-medium transition-colors cursor-pointer shadow-sm min-h-[38px]"
              title="Cấu hình danh mục, tiền tố và hậu tố cấp số"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Cấu hình Tiền/Hậu tố</span>
            </button>

            {/* Primary Action: New Intake & Numbering */}
            <button
              id="btn-open-intake-modal"
              onClick={onOpenIntake}
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-blue-600/30 ring-1 ring-white/20 hover:shadow-blue-500/40 transition-all cursor-pointer transform active:scale-98 min-h-[38px]"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden xs:inline">Tiếp nhận & Cấp số</span>
              <span className="xs:hidden">Cấp số</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
