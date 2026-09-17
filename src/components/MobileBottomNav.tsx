import React from "react";
import {
  Archive,
  BarChart3,
  Plus,
  Settings,
  Sparkles,
  HardDrive,
  RefreshCw,
} from "lucide-react";

interface MobileBottomNavProps {
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

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
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
    <nav
      id="mobile-bottom-navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 text-white shadow-[0_-4px_20px_rgba(0,0,0,0.3)] px-2 py-1 pb-safe flex items-center justify-between"
    >
      {/* 1. Kho lưu trữ Tab */}
      <button
        type="button"
        id="mobile-nav-archive"
        onClick={() => onTabChange("archive")}
        className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all flex-1 min-h-[48px] cursor-pointer ${
          currentTab === "archive"
            ? "text-blue-400 font-bold bg-blue-500/10"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        <div className="relative">
          <Archive className="w-5 h-5" />
          {totalDocsCount > 0 && (
            <span className="absolute -top-1.5 -right-2.5 bg-blue-600 text-white text-[9px] font-bold px-1 rounded-full min-w-[14px] text-center border border-slate-900">
              {totalDocsCount > 99 ? "99+" : totalDocsCount}
            </span>
          )}
        </div>
        <span className="text-[10px] mt-0.5">Kho lưu trữ</span>
      </button>

      {/* 2. Thống kê Tab */}
      <button
        type="button"
        id="mobile-nav-stats"
        onClick={() => onTabChange("stats")}
        className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all flex-1 min-h-[48px] cursor-pointer ${
          currentTab === "stats"
            ? "text-blue-400 font-bold bg-blue-500/10"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        <BarChart3 className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Thống kê</span>
      </button>

      {/* 3. Primary Center Action: New Intake & Numbering */}
      <button
        type="button"
        id="mobile-nav-intake-btn"
        onClick={onOpenIntake}
        className="flex flex-col items-center justify-center -mt-4 px-1 group cursor-pointer"
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 group-hover:from-blue-500 group-hover:to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/40 ring-4 ring-slate-900 transform active:scale-95 transition-all">
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </div>
        <span className="text-[9px] font-bold text-blue-400 mt-1 tracking-tight flex items-center gap-0.5">
          <Sparkles className="w-2.5 h-2.5 text-blue-300" /> Cấp số
        </span>
      </button>

      {/* 4. Google Drive Sync / Connect Tab */}
      <button
        type="button"
        id="mobile-nav-drive"
        onClick={() => {
          if (isDriveConnected && !isDriveTokenExpired && onSyncDrive) {
            onSyncDrive();
          } else if (onOpenGoogleDrive) {
            onOpenGoogleDrive();
          }
        }}
        className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all flex-1 min-h-[48px] cursor-pointer ${
          isDriveConnected
            ? isDriveTokenExpired
              ? "text-amber-400"
              : "text-emerald-400"
            : "text-slate-400 hover:text-slate-200"
        }`}
        title="Google Drive Sync"
      >
        <div className="relative">
          {isSyncing ? (
            <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
          ) : (
            <HardDrive className="w-5 h-5" />
          )}
          <span
            className={`absolute -top-1 -right-1 w-2 h-2 rounded-full border border-slate-900 ${
              isDriveConnected
                ? isDriveTokenExpired
                  ? "bg-amber-400 animate-ping"
                  : "bg-emerald-400"
                : "bg-slate-500"
            }`}
          />
        </div>
        <span className="text-[10px] mt-0.5">
          {isSyncing ? "Đang đồng bộ" : isDriveConnected ? (isDriveTokenExpired ? "Hết hạn" : "Đồng bộ") : "Drive"}
        </span>
      </button>

      {/* 5. Cấu hình Button */}
      <button
        type="button"
        id="mobile-nav-config"
        onClick={onOpenConfig}
        className="flex flex-col items-center justify-center py-1 px-1.5 rounded-xl text-slate-400 hover:text-slate-200 flex-1 min-h-[48px] cursor-pointer"
      >
        <Settings className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Cấu hình</span>
      </button>
    </nav>
  );
};
