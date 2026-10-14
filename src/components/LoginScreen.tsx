import React, { useState } from "react";
import {
  FileText,
  ShieldCheck,
  Cloud,
  Sparkles,
  ArrowRight,
  RefreshCw,
  FolderLock,
  Zap,
  Users,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { GoogleDriveConfig, isDriveTokenExpired } from "../services/googleDriveService";

interface LoginScreenProps {
  onLogin: () => Promise<void>;
  onContinueOffline: () => void;
  config: GoogleDriveConfig;
  isLoading?: boolean;
  errorMessage?: string | null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onContinueOffline,
  config,
  isLoading = false,
  errorMessage = null,
}) => {
  const [internalError, setInternalError] = useState<string | null>(errorMessage);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const hasPreviousAccount = !!config.userEmail;
  const isExpired = isDriveTokenExpired(config);

  const handleLoginClick = async () => {
    setIsSubmitting(true);
    setInternalError(null);
    try {
      await onLogin();
    } catch (err: any) {
      console.error("Login failed:", err);
      setInternalError(err.message || "Đăng nhập Google không thành công. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const busy = isLoading || isSubmitting;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col justify-between relative overflow-hidden font-sans selection:bg-blue-600 selection:text-white">
      {/* Decorative ambient background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[550px] h-[550px] rounded-full bg-indigo-600/15 blur-[140px] pointer-events-none" />
      <div className="absolute top-[40%] right-[20%] w-[350px] h-[350px] rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none" />

      {/* Top Simple Header */}
      <header className="relative z-10 px-6 sm:px-12 py-6 flex items-center justify-between border-b border-white/5 backdrop-blur-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30 ring-1 ring-white/20">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-white block">
              Documents Number
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Văn phòng Ban Hành chính - Văn thư VCC
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Bảo mật BYOS • Dữ liệu trên Google Drive nội bộ</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-xl">
          {/* Main Card */}
          <div className="relative rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/60 p-6 sm:p-10 transition-all">
            {/* Header of Card */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold uppercase tracking-wider mb-4">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                Hệ thống Cấp số & Quản lý Văn bản
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {hasPreviousAccount
                  ? isExpired
                    ? "Phiên làm việc đã hết hạn"
                    : "Chào mừng trở lại"
                  : "Đăng nhập hệ thống"}
              </h1>
              <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
                {hasPreviousAccount
                  ? "Vui lòng xác thực lại tài khoản Google Workspace để tiếp tục đồng bộ số văn bản và hồ sơ lưu trữ."
                  : "Kết nối Google Workspace để tự động cấp số, trích xuất OCR văn bản và đồng bộ kho dữ liệu tập trung."}
              </p>
            </div>

            {/* Error Message */}
            {(internalError || errorMessage) && (
              <div className="mb-6 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <div className="flex-1 font-medium">{internalError || errorMessage}</div>
              </div>
            )}

            {/* Previous Account Pill if available */}
            {hasPreviousAccount && (
              <div className="mb-6 p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-md select-none">
                    {(config.userName || config.userEmail || "U").trim().charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {config.userName || "Người dùng Google"}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{config.userEmail}</p>
                  </div>
                </div>
                <div className="shrink-0">
                  <span className="text-[10px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    Cần xác thực
                  </span>
                </div>
              </div>
            )}

            {/* Primary Action Button: Google Sign In */}
            <button
              id="btn-login-google"
              type="button"
              disabled={busy}
              onClick={handleLoginClick}
              className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm sm:text-base shadow-xl hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60 disabled:pointer-events-none group"
            >
              {busy ? (
                <>
                  <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                  <span>Đang kết nối Google...</span>
                </>
              ) : (
                <>
                  {/* Google SVG Icon */}
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                  <span>
                    {hasPreviousAccount
                      ? "Tiếp tục với Google Workspace"
                      : "Đăng nhập bằng Google Workspace"}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>

            {/* Offline Mode Option */}
            <div className="mt-4 text-center">
              <button
                type="button"
                id="btn-login-offline"
                onClick={onContinueOffline}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors underline decoration-slate-600 hover:decoration-slate-400 cursor-pointer py-1 px-2"
              >
                Hoặc tiếp tục ở chế độ xem Ngoại tuyến (Offline)
              </button>
            </div>

            {/* Feature Highlights Grid */}
            <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Nghị định 30/2020</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                    Cấp số tự động, định dạng chuẩn thể thức.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Gemini AI OCR</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                    Tự động nhận diện trích yếu & người ký.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Cloud className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Đồng bộ đa máy</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                    Lưu trữ trực tiếp trên Google Drive công ty.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <p className="text-center text-[11px] text-slate-500 mt-6 flex items-center justify-center gap-1.5">
            <FolderLock className="w-3.5 h-3.5 text-slate-400" />
            <span>Mô hình BYOS: Dữ liệu thuộc quyền sở hữu 100% của cơ quan/doanh nghiệp bạn.</span>
          </p>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="relative z-10 px-6 py-4 text-center text-xs text-slate-500 border-t border-white/5">
        Hệ thống Quản lý Văn bản Hành chính & Cấp số • Phiên bản 2.5
      </footer>
    </div>
  );
};
