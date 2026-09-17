import React, { useState, useEffect } from "react";
import {
  X,
  FolderPlus,
  FolderCheck,
  ExternalLink,
  ShieldCheck,
  Key,
  Info,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  RefreshCw,
  HardDrive,
  User,
} from "lucide-react";
import {
  GoogleDriveConfig,
  getGoogleDriveConfig,
  saveGoogleDriveConfig,
  clearGoogleDriveConfig,
  createDriveFolder,
  isDriveTokenExpired,
} from "../services/googleDriveService";

interface GoogleDriveConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated?: (config: GoogleDriveConfig) => void;
}

// Declare Google Identity Services global
declare global {
  interface Window {
    google?: any;
  }
}

export const GoogleDriveConfigModal: React.FC<GoogleDriveConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigUpdated,
}) => {
  const [config, setConfig] = useState<GoogleDriveConfig>(getGoogleDriveConfig());
  const [customFolderId, setCustomFolderId] = useState<string>("");
  const [isAuthorizing, setIsAuthorizing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const current = getGoogleDriveConfig();
      setConfig(current);
      setCustomFolderId(current.folderId || "");
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Load Google Identity Services script dynamically if not present
  const loadGisScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.google?.accounts?.oauth2) {
        return resolve();
      }
      const existingScript = document.getElementById("google-gis-script");
      if (existingScript) {
        existingScript.onload = () => resolve();
        return;
      }
      const script = document.createElement("script");
      script.id = "google-gis-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Không thể tải Google Identity Services"));
      document.body.appendChild(script);
    });
  };

  // Handle Google OAuth Login
  const handleConnectGoogle = async () => {
    if (!config.clientId.trim()) {
      setStatusMessage({
        type: "error",
        text: "Vui lòng nhập Google Client ID trước khi kết nối.",
      });
      return;
    }

    setIsAuthorizing(true);
    setStatusMessage(null);

    try {
      await loadGisScript();

      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: config.clientId.trim(),
        scope: "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            setIsAuthorizing(false);
            setStatusMessage({
              type: "error",
              text: `Lỗi ủy quyền Google: ${tokenResponse.error_description || tokenResponse.error}`,
            });
            return;
          }

          const accessToken = tokenResponse.access_token;
          const expiresIn = parseInt(tokenResponse.expires_in || "3600", 10);
          const expiresAt = Date.now() + expiresIn * 1000;

          // Fetch User Profile
          try {
            const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            const userData = await userRes.json();

            // Check or Auto Create default folder if none specified
            let targetFolderId = config.folderId;
            let targetFolderName = config.folderName;

            if (!targetFolderId) {
              try {
                const folderRes = await createDriveFolder(
                  accessToken,
                  "[VCC] Sổ Văn Bản Điện Tử"
                );
                targetFolderId = folderRes.id;
                targetFolderName = "[VCC] Sổ Văn Bản Điện Tử";
              } catch (fErr) {
                console.warn("Could not auto create folder, using root", fErr);
                targetFolderId = "root";
                targetFolderName = "Google Drive (Thư mục gốc)";
              }
            }

            const newConfig: GoogleDriveConfig = {
              ...config,
              userEmail: userData.email,
              userName: userData.name,
              userAvatar: userData.picture,
              accessToken,
              tokenExpiresAt: expiresAt,
              folderId: targetFolderId,
              folderName: targetFolderName,
            };

            saveGoogleDriveConfig(newConfig);
            setConfig(newConfig);
            if (onConfigUpdated) onConfigUpdated(newConfig);

            setStatusMessage({
              type: "success",
              text: `Kết nối thành công với tài khoản: ${userData.email}`,
            });
          } catch (profileErr: any) {
            setStatusMessage({
              type: "error",
              text: `Lấy thông tin người dùng thất bại: ${profileErr.message}`,
            });
          } finally {
            setIsAuthorizing(false);
          }
        },
      });

      tokenClient.requestAccessToken({ prompt: "consent" });
    } catch (err: any) {
      setIsAuthorizing(false);
      setStatusMessage({
        type: "error",
        text: err.message || "Không thể khởi tạo dịch vụ đăng nhập Google.",
      });
    }
  };

  const handleDisconnect = () => {
    clearGoogleDriveConfig();
    const fresh = getGoogleDriveConfig();
    setConfig(fresh);
    setCustomFolderId("");
    if (onConfigUpdated) onConfigUpdated(fresh);
    setStatusMessage({
      type: "info",
      text: "Đã ngắt kết nối với Google Drive.",
    });
  };

  const handleSaveSettings = () => {
    let trimmedId = customFolderId.trim();
    // Bóc tách nếu trimmedId là full URL
    const folderUrlMatch = trimmedId.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (folderUrlMatch && folderUrlMatch[1]) {
      trimmedId = folderUrlMatch[1];
    }

    const updated: GoogleDriveConfig = {
      ...config,
      folderId: trimmedId || undefined,
      folderName: trimmedId ? `Thư mục ID: ...${trimmedId.slice(-6)}` : "[VCC] Sổ Văn Bản Điện Tử",
    };
    saveGoogleDriveConfig(updated);
    setConfig(updated);
    if (onConfigUpdated) onConfigUpdated(updated);
    setStatusMessage({
      type: "success",
      text: "Đã lưu cài đặt cấu hình thành công!",
    });
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/70 rounded-2xl shadow-2xl shadow-blue-900/20 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Cấu hình Google Drive cá nhân (BYOS)
              </h3>
              <p className="text-xs text-slate-400">
                Lưu trữ văn bản và bản scan trực tiếp vào Gmail / Drive của bạn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 text-sm text-slate-300">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
                statusMessage.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : statusMessage.type === "error"
                  ? "bg-red-500/10 border-red-500/30 text-red-300"
                  : "bg-blue-500/10 border-blue-500/30 text-blue-300"
              }`}
            >
              {statusMessage.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Account Status Card */}
          {config.userEmail ? (
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {config.userAvatar ? (
                  <img
                    src={config.userAvatar}
                    alt="Avatar"
                    className="w-10 h-10 rounded-full border border-slate-600 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shrink-0">
                    {config.userName ? config.userName[0] : "U"}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white truncate">{config.userName}</span>
                    {isDriveTokenExpired(config) ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-medium border border-amber-500/30 shrink-0 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Hết hạn phiên (Cần bấm Đăng nhập lại)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-medium border border-emerald-500/30 shrink-0">
                        Đã kết nối Drive
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate">{config.userEmail}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                {isDriveTokenExpired(config) && (
                  <button
                    onClick={handleConnectGoogle}
                    disabled={isAuthorizing}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isAuthorizing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    Gia hạn phiên kết nối
                  </button>
                )}
                <button
                  onClick={handleDisconnect}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Ngắt kết nối
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-xs font-semibold text-amber-400">
                  Chưa kết nối tài khoản Google
                </span>
                <p className="text-xs text-slate-400">
                  Đăng nhập để hệ thống tự động lưu file bản scan văn bản vào Drive của bạn.
                </p>
              </div>
              <button
                onClick={handleConnectGoogle}
                disabled={isAuthorizing}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isAuthorizing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>Kết nối Google Drive</span>
              </button>
            </div>
          )}

          {/* Folder Target Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Thư mục lưu trữ đích trên Google Drive
            </label>
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Thư mục hiện tại:</span>
                <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <FolderCheck className="w-3.5 h-3.5" />
                  {config.folderName || "[VCC] Sổ Văn Bản Điện Tử"}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-700/40">
                <label className="block text-[11px] text-slate-400 mb-1">
                  Folder ID hoặc Đường dẫn (URL) thư mục Google Drive:
                </label>
                <input
                  type="text"
                  value={customFolderId}
                  onChange={(e) => {
                    const rawVal = e.target.value;
                    // Hỗ trợ trích xuất ID nếu người dùng dán nguyên đường dẫn URL Google Drive
                    // Ví dụ: https://drive.google.com/drive/folders/1e87__irSwgeEH07gOvCo5ZU6WU2sIMCr
                    // hoặc: https://drive.google.com/drive/u/0/folders/1e87__irSwgeEH07gOvCo5ZU6WU2sIMCr?usp=sharing
                    const folderUrlMatch = rawVal.match(/\/folders\/([a-zA-Z0-9_-]+)/);
                    if (folderUrlMatch && folderUrlMatch[1]) {
                      setCustomFolderId(folderUrlMatch[1]);
                    } else {
                      setCustomFolderId(rawVal.trim());
                    }
                  }}
                  placeholder="Dán link folder hoặc ID: https://drive.google.com/drive/folders/..."
                  className="w-full px-3 py-2 text-xs bg-slate-950/80 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  💡 Bạn có thể copy nguyên thanh địa chỉ trình duyệt khi đang mở folder Google Drive rồi dán trực tiếp vào đây.
                </p>
              </div>
            </div>
          </div>

          {/* Auto Upload Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <div className="space-y-0.5">
              <span className="text-xs font-medium text-white">
                Tự động đồng bộ khi cấp số
              </span>
              <p className="text-[11px] text-slate-400">
                Tự động đẩy file scan/ảnh lên Google Drive ngay khi bấm hoàn tất cấp số.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoUpload}
                onChange={(e) => setConfig({ ...config, autoUpload: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Đóng
          </button>
          <button
            onClick={handleSaveSettings}
            className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            Lưu cấu hình
          </button>
        </div>
      </div>
    </div>
  );
};
