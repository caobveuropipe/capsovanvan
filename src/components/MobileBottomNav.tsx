import React from "react";
import {
  Archive,
  BarChart3,
  Plus,
  Settings,
  Sparkles,
} from "lucide-react";

interface MobileBottomNavProps {
  currentTab: "archive" | "stats";
  onTabChange: (tab: "archive" | "stats") => void;
  onOpenIntake: () => void;
  onOpenConfig: () => void;
  totalDocsCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onTabChange,
  onOpenIntake,
  onOpenConfig,
  totalDocsCount,
}) => {
  return (
    <nav
      id="mobile-bottom-navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 text-white shadow-[0_-4px_20px_rgba(0,0,0,0.3)] px-3 py-1.5 pb-safe flex items-center justify-around"
    >
      {/* 1. Kho lưu trữ Tab */}
      <button
        type="button"
        id="mobile-nav-archive"
        onClick={() => onTabChange("archive")}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all min-w-[64px] min-h-[48px] cursor-pointer ${
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

      {/* 2. Primary Center Action: New Intake & Numbering */}
      <button
        type="button"
        id="mobile-nav-intake-btn"
        onClick={onOpenIntake}
        className="flex flex-col items-center justify-center -mt-4 group cursor-pointer"
      >
        <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 group-hover:from-blue-500 group-hover:to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/40 ring-4 ring-slate-900 transform active:scale-95 transition-all">
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </div>
        <span className="text-[10px] font-bold text-blue-400 mt-1 tracking-tight flex items-center gap-0.5">
          <Sparkles className="w-2.5 h-2.5 text-blue-300" /> Cấp số AI
        </span>
      </button>

      {/* 3. Thống kê Tab */}
      <button
        type="button"
        id="mobile-nav-stats"
        onClick={() => onTabChange("stats")}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all min-w-[64px] min-h-[48px] cursor-pointer ${
          currentTab === "stats"
            ? "text-blue-400 font-bold bg-blue-500/10"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        <BarChart3 className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Thống kê</span>
      </button>

      {/* 4. Cấu hình Button */}
      <button
        type="button"
        id="mobile-nav-config"
        onClick={onOpenConfig}
        className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-400 hover:text-slate-200 min-w-[64px] min-h-[48px] cursor-pointer"
      >
        <Settings className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Cấu hình</span>
      </button>
    </nav>
  );
};
