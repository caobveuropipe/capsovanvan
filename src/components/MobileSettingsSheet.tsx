import React from "react";
import {
  X,
  User,
  LogOut,
  LogIn,
  HardDrive,
  Sparkles,
  Settings,
  RefreshCw,
  Folder,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Archive,
} from "lucide-react";

interface MobileSettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  // Account info
  userName?: string;
  userEmail?: string;
  isDriveConnected?: boolean;
  isDriveTokenExpired?: boolean;
  onLogin?: () => void;
  onLogout?: () => void;
  // Drive & Sync
  folderName?: string;
  onOpenGoogleDrive?: () => void;
  onSyncDrive?: () => void;
  isSyncing?: boolean;
  // Gemini AI Key
  hasAiKey?: boolean;
  onOpenAiKey?: () => void;
  // Setup config
  onOpenConfig: () => void;
  // Tab navigation
  currentTab: "archive" | "stats";
  onTabChange: (tab: "archive" | "stats") => void;
  totalDocsCount: number;
}

export const MobileSettingsSheet: React.FC<MobileSettingsSheetProps> = ({
  isOpen,
  onClose,
  userName,
  userEmail,
  isDriveConnected = false,
  isDriveTokenExpired = false,
  onLogin,
  onLogout,
  folderName,
  onOpenGoogleDrive,
  onSyncDrive,
  isSyncing = false,
  hasAiKey = false,
  onOpenAiKey,
  onOpenConfig,
  currentTab,
  onTabChange,
  totalDocsCount,
}) => {
  if (!isOpen) return null;

  const displayInitial = (userName || userEmail || "U")[0].toUpperCase();

  return (
    <div className="fixed inset-0 z-[80] md:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-up Sheet */}
      <div className="fixed bottom-0 inset-x-0 bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 max-h-[85vh] flex flex-col z-10 animate-in slide-in-from-bottom duration-300">
        {/* Handle bar & Header */}
        <div className="pt-3 pb-2 px-5 flex flex-col border-b border-slate-100">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">Cài đặt & Tài khoản</h3>
              <p className="text-xs text-slate-500">Quản lý kết nối, lưu trữ và thiết lập hệ thống</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="overflow-y-auto p-4 space-y-3.5 pb-safe">
          {/* 1. Tài khoản Google */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/80 border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                {displayInitial}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-sm text-slate-900 truncate">
                    {userName || (isDriveConnected ? "Tài khoản Google" : "Chưa đăng nhập")}
                  </p>
                  {isDriveConnected ? (
                    <span className="px-1.5 py-0.2 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                      Đã kết nối
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.2 text-[10px] font-bold rounded bg-slate-200 text-slate-700 shrink-0">
                      Ngoại tuyến
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {userEmail || "Đăng nhập để tự động sao lưu và đồng bộ đa thiết bị"}
                </p>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-end gap-2">
              {isDriveConnected ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onLogout?.();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Đăng xuất</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onLogin?.();
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-sm cursor-pointer transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Đăng nhập Google</span>
                </button>
              )}
            </div>
          </div>

          {/* 2. Google Gemini AI API Key */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-slate-900">Gemini AI Key cá nhân</span>
                    {hasAiKey ? (
                      <span className="px-1.5 py-0.2 text-[10px] font-bold rounded bg-purple-100 text-purple-800 border border-purple-200">
                        Đã sẵn sàng
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 text-[10px] font-bold rounded bg-amber-100 text-amber-800 border border-amber-200">
                        Chưa cấu hình
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tự động nhận diện OCR & phân loại văn bản theo chuẩn NĐ 30
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAiKey?.();
                }}
                className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold border border-purple-200/80 cursor-pointer transition-colors"
              >
                <span>{hasAiKey ? "Quản lý / Thay đổi AI Key" : "Nhập Gemini AI Key"}</span>
                <ChevronRight className="w-4 h-4 text-purple-600" />
              </button>
            </div>
          </div>

          {/* 3. Thư mục Google Drive */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                <HardDrive className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-bold text-sm text-slate-900">Thư mục Google Drive</span>
                <p className="text-xs text-slate-600 truncate mt-0.5">
                  {folderName ? `Thư mục: ${folderName}` : "Chưa chọn thư mục lưu trữ"}
                </p>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenGoogleDrive?.();
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 cursor-pointer transition-colors"
              >
                <Folder className="w-3.5 h-3.5 text-slate-500" />
                <span>Đổi thư mục</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSyncDrive?.();
                }}
                disabled={isSyncing || !isDriveConnected}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 cursor-pointer transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-blue-600" : ""}`} />
                <span>{isSyncing ? "Đang đồng bộ..." : "Đồng bộ ngay"}</span>
              </button>
            </div>
          </div>

          {/* 4. Cấu hình Cấp số & Thể thức (Setup) */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
                <Settings className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-bold text-sm text-slate-900">Thiết lập danh mục cấp số (Setup)</span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cấu hình các loại văn bản, tiền tố số hiệu, hậu tố và phòng ban
                </p>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenConfig();
                }}
                className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-bold border border-blue-200/80 cursor-pointer transition-colors"
              >
                <span>Mở bảng thiết lập danh mục</span>
                <ChevronRight className="w-4 h-4 text-blue-600" />
              </button>
            </div>
          </div>

          {/* 5. Chuyển đổi màn hình nhanh */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <span className="font-bold text-xs text-slate-700 uppercase tracking-wider block mb-2">
              Chuyển nhanh màn hình
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  onTabChange("archive");
                  onClose();
                }}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentTab === "archive"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                }`}
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Kho lưu trữ ({totalDocsCount})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onTabChange("stats");
                  onClose();
                }}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentTab === "stats"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Thống kê</span>
              </button>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center pt-2 pb-1">
            <p className="text-[11px] text-slate-400 font-medium">
              Hệ thống Cấp số Văn bản & Quản lý Hành chính • Documents Number
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
