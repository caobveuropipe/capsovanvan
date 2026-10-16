import React, { useState, useRef, useEffect } from "react";
import {
  FileText,
  PlusCircle,
  Settings,
  Archive,
  BarChart3,
  Sparkles,
  RefreshCw,
  LogOut,
  ChevronDown,
  HardDrive,
} from "lucide-react";

interface NavbarProps {
  currentTab: "archive" | "stats";
  onTabChange: (tab: "archive" | "stats") => void;
  onOpenIntake: () => void;
  onOpenConfig: () => void;
  onOpenGoogleDrive?: () => void;
  onSyncDrive?: () => void;
  onRenewDrive?: () => void;
  onLogout?: () => void;
  onLogin?: () => void;
  onOpenAiKey?: () => void;
  hasAiKey?: boolean;
  isDriveConnected?: boolean;
  isDriveTokenExpired?: boolean;
  isRenewingDrive?: boolean;
  isSyncing?: boolean;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  folderName?: string;
  totalDocsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  onOpenIntake,
  onOpenConfig,
  onOpenGoogleDrive,
  onSyncDrive,
  onLogout,
  onLogin,
  onOpenAiKey,
  hasAiKey = false,
  isDriveConnected = false,
  isDriveTokenExpired = false,
  isSyncing = false,
  userName,
  userEmail,
  userAvatar,
  folderName,
  totalDocsCount,
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    }
    if (isProfileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  // Fallback initial
  const displayInitial = (userName || userEmail || "U")[0].toUpperCase();

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 text-slate-800 sticky top-0 z-40 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          {/* 1 - LỀ TRÁI: Logo + Tên, căn lề trái */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 ring-1 ring-blue-600/30 text-white shrink-0">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 truncate">
              Documents Number
            </span>
          </div>

          {/* 2 - LỀ PHẢI THEO THỨ TỰ TỪ TRÁI QUA PHẢI: */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* 2.1 - Nút cấp số (icon dấu + trong vòng tròn và chữ Cấp số, bỏ bớt dấu + bằng chữ) */}
            <button
              id="btn-open-intake-modal"
              type="button"
              onClick={onOpenIntake}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/25 ring-2 ring-blue-500/20 hover:shadow-blue-500/35 transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98] min-h-[38px] whitespace-nowrap"
              title="Tiếp nhận hồ sơ mới và cấp số văn bản tự động"
            >
              <PlusCircle className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
              <span>Cấp số</span>
            </button>

            {/* 2.2 & 2.3 - Nút chuyển đổi thẻ Kho & Thẻ Thống kê */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 shrink-0">
              {/* 2.2 - Nút chuyển đổi thẻ Kho */}
              <button
                id="btn-nav-archive"
                type="button"
                onClick={() => onTabChange("archive")}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentTab === "archive"
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200/80 font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
                title="Kho lưu trữ & Tra cứu văn bản"
              >
                <Archive className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>Kho</span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px]">
                  {totalDocsCount}
                </span>
              </button>

              {/* 2.3 - Nút chuyển đổi thẻ Thống kê */}
              <button
                id="btn-nav-stats"
                type="button"
                onClick={() => onTabChange("stats")}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentTab === "stats"
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200/80 font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
                title="Thống kê số liệu cấp số"
              >
                <BarChart3 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>Thống kê</span>
              </button>
            </div>

            {/* 2.4 - Setup */}
            <button
              id="btn-open-category-config"
              type="button"
              onClick={onOpenConfig}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 hover:text-slate-900 border border-slate-200/90 text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-xs min-h-[38px]"
              title="Cấu hình danh mục, tiền tố và hậu tố cấp số"
            >
              <Settings className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Setup</span>
            </button>

            {/* 2.5 - Reload */}
            <button
              id="btn-sync-google-drive"
              type="button"
              onClick={() => {
                if (onSyncDrive) {
                  onSyncDrive();
                } else {
                  window.location.reload();
                }
              }}
              disabled={isSyncing}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/90 transition-colors cursor-pointer shadow-xs min-h-[38px] min-w-[38px] flex items-center justify-center disabled:opacity-50"
              title={isSyncing ? "Đang tải / đồng bộ..." : "Reload dữ liệu"}
            >
              <RefreshCw
                className={`w-4 h-4 text-emerald-600 ${
                  isSyncing ? "animate-spin text-blue-600" : ""
                }`}
              />
            </button>

            {/* 2.6 - Người dùng */}
            {isDriveConnected ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  id="btn-user-profile-menu"
                  type="button"
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200/90 text-slate-800 text-xs font-medium transition-all cursor-pointer shadow-xs min-h-[38px]"
                  title={`Tài khoản: ${userName || userEmail || "Google Drive"}`}
                >
                  {/* Google-style initial letter avatar */}
                  <div className="relative shrink-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-xs select-none">
                      {displayInitial}
                    </div>
                    {/* Active sync indicator dot */}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                        isDriveTokenExpired
                          ? "bg-amber-500"
                          : isSyncing
                          ? "bg-blue-500 animate-ping"
                          : "bg-emerald-500"
                      }`}
                    />
                  </div>

                  {/* Name (Desktop only) */}
                  <span className="hidden sm:inline font-semibold text-slate-800 max-w-[130px] truncate">
                    {userName || userEmail?.split("@")[0] || "Tài khoản"}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:inline" />
                </button>

                {/* Dropdown Menu (Sáng sủa, bóng mờ cao cấp) */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white border border-slate-200 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs select-none">
                        {displayInitial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {userName || "Người dùng Google"}
                          </p>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                            Đã kết nối
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{userEmail}</p>
                      </div>
                    </div>

                    {/* Storage Info */}
                    <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-xs">
                      <div className="flex items-center gap-2 text-slate-700">
                        <HardDrive className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="text-[11px] text-slate-500 block">Thư mục Drive:</span>
                          <span className="font-semibold text-slate-800 truncate block">
                            {folderName || "[VCC] Sổ Văn Bản Điện Tử"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions List */}
                    <div className="p-1.5 space-y-0.5">
                      {onSyncDrive && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            onSyncDrive();
                          }}
                          disabled={isSyncing}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl hover:bg-slate-100 text-slate-700 transition-colors text-left cursor-pointer"
                        >
                          <RefreshCw
                            className={`w-4 h-4 text-blue-600 ${
                              isSyncing ? "animate-spin" : ""
                            }`}
                          />
                          <span>{isSyncing ? "Đang đồng bộ..." : "Đồng bộ dữ liệu ngay"}</span>
                        </button>
                      )}

                      {onOpenGoogleDrive && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            onOpenGoogleDrive();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl hover:bg-slate-100 text-slate-700 transition-colors text-left cursor-pointer"
                        >
                          <Settings className="w-4 h-4 text-slate-500" />
                          <span>Cài đặt & Đổi thư mục Drive</span>
                        </button>
                      )}

                      {onOpenAiKey && (
                        <button
                          type="button"
                          id="btn-navbar-ai-key"
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            onOpenAiKey();
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-colors text-left cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            <span>Cài đặt Gemini AI Key</span>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              hasAiKey
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {hasAiKey ? "Đã bật AI" : "Chưa cài"}
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Logout Option */}
                    {onLogout && (
                      <div className="border-t border-slate-100 p-1.5 mt-1">
                        <button
                          type="button"
                          id="btn-logout-google"
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            onLogout();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl hover:bg-rose-50 text-rose-600 transition-colors text-left cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Đăng xuất tài khoản</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Google Login Button when disconnected / offline */
              onLogin && (
                <button
                  id="btn-navbar-login"
                  type="button"
                  onClick={onLogin}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer min-h-[38px]"
                  title="Đăng nhập tài khoản Google Workspace"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span className="hidden xs:inline">Đăng nhập</span>
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
