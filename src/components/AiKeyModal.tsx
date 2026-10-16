import React, { useState, useEffect } from "react";
import {
  Key,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  Sparkles,
  X,
  Copy,
} from "lucide-react";
import { getActiveGeminiKey, saveGeminiKey, removeGeminiKey, verifyGeminiApiKey } from "../services/aiKeyService";

interface AiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  onKeyChanged?: (hasKey: boolean) => void;
}

export const AiKeyModal: React.FC<AiKeyModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  onKeyChanged,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState<string>("");
  const [currentSavedKey, setCurrentSavedKey] = useState<string>("");
  const [showPlainKey, setShowPlainKey] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Load key khi modal mở ra
  useEffect(() => {
    if (isOpen) {
      setStatusMessage(null);
      setShowPlainKey(false);
      getActiveGeminiKey(userEmail).then((key) => {
        setCurrentSavedKey(key);
        setApiKeyInput(key);
      });
    }
  }, [isOpen, userEmail]);

  if (!isOpen) return null;

  const handleVerify = async () => {
    const keyToTest = apiKeyInput.trim();
    if (!keyToTest) {
      setStatusMessage({ type: "error", text: "Vui lòng nhập API Key để kiểm tra." });
      return;
    }

    setIsVerifying(true);
    setStatusMessage(null);
    try {
      const result = await verifyGeminiApiKey(keyToTest);
      if (result.valid) {
        setStatusMessage({
          type: "success",
          text: result.message || "Kết nối Gemini API thành công! Key đã sẵn sàng sử dụng.",
        });
      } else {
        setStatusMessage({
          type: "error",
          text: result.message || "API Key không hợp lệ. Vui lòng kiểm tra lại.",
        });
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSave = async () => {
    const keyToSave = apiKeyInput.trim();
    if (!keyToSave) {
      setStatusMessage({ type: "error", text: "Vui lòng nhập API Key trước khi lưu." });
      return;
    }

    if (!userEmail) {
      setStatusMessage({
        type: "error",
        text: "Vui lòng đăng nhập Google Workspace trước khi lưu API Key.",
      });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);
    try {
      const ok = await saveGeminiKey(userEmail, keyToSave);
      if (ok) {
        setCurrentSavedKey(keyToSave);
        setStatusMessage({
          type: "success",
          text: "Đã lưu và đồng bộ Gemini API Key thành công qua Google Drive!",
        });
        onKeyChanged?.(true);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setStatusMessage({ type: "error", text: "Không thể lưu API Key. Vui lòng thử lại." });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!userEmail) return;
    if (!window.confirm("Bạn có chắc chắn muốn xóa Gemini API Key khỏi thiết bị và Google Drive?")) {
      return;
    }

    setIsSaving(true);
    try {
      await removeGeminiKey(userEmail);
      setCurrentSavedKey("");
      setApiKeyInput("");
      setStatusMessage({ type: "info", text: "Đã xóa API Key thành công." });
      onKeyChanged?.(false);
    } finally {
      setIsSaving(false);
    }
  };

  // Masked string representation
  const maskedKey = currentSavedKey
    ? `${currentSavedKey.substring(0, 7)}...${currentSavedKey.substring(currentSavedKey.length - 4)}`
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[calc(100dvh-2rem)] sm:max-h-[88vh] flex flex-col">
        {/* Header - Cố định */}
        <div className="shrink-0 px-5 py-3.5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-tight">Cài đặt Gemini AI Key cá nhân</h3>
              <p className="text-[11px] text-blue-200/80">Tự động đọc, OCR và trích yếu văn bản thông minh</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body - Cuộn mượt mà khi màn hình thấp */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs">
          {/* Email user context */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Tài khoản Google đang kết nối:</span>
            <span className="font-bold text-blue-700 font-mono text-[11px] sm:text-xs truncate max-w-[220px]">
              {userEmail || "Chưa đăng nhập (chế độ xem)"}
            </span>
          </div>

          {/* Key Input Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between font-bold text-slate-700">
              <label htmlFor="input-gemini-key" className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-500" />
                <span>Google Gemini API Key</span>
              </label>
              {currentSavedKey && (
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-semibold text-[10px]">
                  Đã kích hoạt: {maskedKey}
                </span>
              )}
            </div>

            <div className="relative">
              <input
                id="input-gemini-key"
                type={showPlainKey ? "text" : "password"}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="Dán chuỗi khóa bắt đầu bằng AIzaSy..."
                className="w-full px-3 py-2 pr-12 font-mono text-xs rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowPlainKey(!showPlainKey)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 cursor-pointer"
                  title={showPlainKey ? "Ẩn khóa" : "Hiện khóa"}
                >
                  {showPlainKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <p className="text-[10px] text-slate-500">
              Key được mã hóa và đồng bộ riêng tư vào phân vùng <strong>Google Drive appDataFolder</strong> của bạn, không bị chia sẻ.
            </p>
          </div>

          {/* Test & Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleVerify}
              disabled={isVerifying || !apiKeyInput.trim()}
              className="flex-1 py-1.5 px-3 font-semibold rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer transition-all text-xs"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
                  <span>Đang kiểm tra...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Kiểm tra kết nối</span>
                </>
              )}
            </button>

            {currentSavedKey && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={isSaving}
                className="py-1.5 px-3 font-semibold rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 flex items-center justify-center gap-1.5 cursor-pointer transition-all text-xs"
                title="Xóa khóa này"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa key</span>
              </button>
            )}
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-2.5 rounded-xl text-xs flex items-start gap-2 animate-in fade-in ${
                statusMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : statusMessage.type === "error"
                  ? "bg-rose-50 text-rose-800 border border-rose-200"
                  : "bg-blue-50 text-blue-800 border border-blue-200"
              }`}
            >
              {statusMessage.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed text-[11px] sm:text-xs">{statusMessage.text}</span>
            </div>
          )}

          {/* Guide to get free API key */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 space-y-1 text-amber-900 text-[11px]">
            <div className="flex items-center justify-between font-bold text-amber-950">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600" />
                Nhận API Key miễn phí 100% trong 30 giây:
              </span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-blue-700 hover:text-blue-800 font-semibold underline flex items-center gap-0.5"
              >
                Mở AI Studio <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <ol className="list-decimal list-inside space-y-0.5 text-amber-900/90 leading-tight pl-1">
              <li>Đăng nhập tài khoản Google tại trang AI Studio.</li>
              <li>Bấm nút <strong>&quot;Create API Key&quot;</strong> để tạo khóa mới.</li>
              <li>Dán mã vào ô trên rồi bấm <strong>Lưu cài đặt & Đồng bộ</strong>.</li>
            </ol>
          </div>
        </div>

        {/* Footer - Cố định ở đáy, luôn luôn nhìn thấy nút bấm */}
        <div className="shrink-0 px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl cursor-pointer transition-colors"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !apiKeyInput.trim() || apiKeyInput.trim() === currentSavedKey}
            className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5"
          >
            {isSaving ? "Đang lưu..." : "Lưu cài đặt & Đồng bộ"}
          </button>
        </div>
      </div>
    </div>
  );
};
