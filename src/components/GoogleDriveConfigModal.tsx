import React, { useState, useEffect } from "react";
import {
  X,
  FolderPlus,
  FolderCheck,
  Folder,
  FolderOpen,
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
  Search,
  Check,
  Database,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  GoogleDriveConfig,
  getGoogleDriveConfig,
  saveGoogleDriveConfig,
  clearGoogleDriveConfig,
  createDriveFolder,
  findOrCreateDriveFolder,
  isDriveTokenExpired,
  listDriveFolders,
  getDriveFolderDetails,
  DriveFolderItem,
  DRIVE_DB_FILENAME,
  findDriveFileByName,
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
  const [folders, setFolders] = useState<DriveFolderItem[]>([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState<boolean>(false);
  const [folderSearchQuery, setFolderSearchQuery] = useState<string>("");
  const [showManualInput, setShowManualInput] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Load folders list from Google Drive
  const loadFolders = async (token?: string, currentFolderId?: string) => {
    const activeToken = token || config.accessToken;
    if (!activeToken || isDriveTokenExpired({ ...config, accessToken: activeToken })) return;
    setIsLoadingFolders(true);
    try {
      const targetId = currentFolderId || config.folderId;
      const items = await listDriveFolders(activeToken, targetId);
      setFolders(items);

      // Cập nhật tên chuẩn nếu folder hiện tại có tên thật trên Drive
      const matched = items.find((f) => f.id === targetId);
      if (matched && (!config.folderName || config.folderName.startsWith("Thư mục ID:"))) {
        const updated = { ...config, folderName: matched.name, folderId: matched.id };
        setConfig(updated);
        saveGoogleDriveConfig(updated);
        if (onConfigUpdated) onConfigUpdated(updated);
      }
    } catch (err) {
      console.warn("Không thể tải danh sách thư mục:", err);
    } finally {
      setIsLoadingFolders(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const current = getGoogleDriveConfig();
      setConfig(current);
      setCustomFolderId(current.folderId || "");
      setStatusMessage(null);
      setFolderSearchQuery("");

      if (current.accessToken && !isDriveTokenExpired(current)) {
        loadFolders(current.accessToken, current.folderId);
      }
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
        scope: "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
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

            // Tự động nhận diện thư mục đã có database trên Drive của người dùng (Zero-Config cho PC/Điện thoại)
            let targetFolderId = config.folderId;
            let targetFolderName = config.folderName;

            if (!targetFolderId) {
              try {
                const dbFile = await findDriveFileByName(accessToken, DRIVE_DB_FILENAME);
                if (dbFile && dbFile.parents && dbFile.parents.length > 0) {
                  targetFolderId = dbFile.parents[0];
                  const details = await getDriveFolderDetails(accessToken, targetFolderId);
                  targetFolderName = details?.name || "[VCC] Sổ Văn Bản Điện Tử";
                } else {
                  const folderRes = await findOrCreateDriveFolder(
                    accessToken,
                    "[VCC] Sổ Văn Bản Điện Tử"
                  );
                  targetFolderId = folderRes.id;
                  targetFolderName = folderRes.name || "[VCC] Sổ Văn Bản Điện Tử";
                }
              } catch (fErr) {
                console.warn("Could not find or create folder, using root", fErr);
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
            setCustomFolderId(targetFolderId || "");
            if (onConfigUpdated) onConfigUpdated(newConfig);

            setStatusMessage({
              type: "success",
              text: `Kết nối thành công với tài khoản: ${userData.email}`,
            });

            // Tự động tải danh sách thư mục
            loadFolders(accessToken, targetFolderId);
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
    setFolders([]);
    if (onConfigUpdated) onConfigUpdated(fresh);
    setStatusMessage({
      type: "info",
      text: "Đã ngắt kết nối với Google Drive.",
    });
  };

  // Chọn nhanh thư mục từ danh sách
  const handleSelectFolder = (folder: DriveFolderItem) => {
    setCustomFolderId(folder.id);
    const updated: GoogleDriveConfig = {
      ...config,
      folderId: folder.id,
      folderName: folder.name,
    };
    saveGoogleDriveConfig(updated);
    setConfig(updated);
    if (onConfigUpdated) onConfigUpdated(updated);
    setStatusMessage({
      type: "success",
      text: `Đã chọn thư mục: "${folder.name}"`,
    });
  };

  // Lưu cấu hình thủ công hoặc sau khi dán ID/link
  const handleSaveSettings = async () => {
    let trimmedId = customFolderId.trim();
    const folderUrlMatch = trimmedId.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (folderUrlMatch && folderUrlMatch[1]) {
      trimmedId = folderUrlMatch[1];
    }

    let detectedName = config.folderName;

    // Tra cứu tên thật của thư mục nếu người dùng dán ID/URL mới
    if (trimmedId && config.accessToken) {
      try {
        const details = await getDriveFolderDetails(config.accessToken, trimmedId);
        if (details?.name) {
          detectedName = details.name;
        }
      } catch (_) {}
    }

    if (!detectedName || detectedName.startsWith("Thư mục ID:")) {
      detectedName = trimmedId ? `Thư mục ID: ...${trimmedId.slice(-6)}` : "[VCC] Sổ Văn Bản Điện Tử";
    }

    const updated: GoogleDriveConfig = {
      ...config,
      folderId: trimmedId || undefined,
      folderName: detectedName,
    };
    saveGoogleDriveConfig(updated);
    setConfig(updated);
    if (onConfigUpdated) onConfigUpdated(updated);
    setStatusMessage({
      type: "success",
      text: `Đã lưu cấu hình thư mục: "${detectedName}"`,
    });
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  // Lọc danh sách thư mục theo tìm kiếm
  const filteredFolders = folders.filter((f) =>
    f.name.toLowerCase().includes(folderSearchQuery.toLowerCase())
  );

  return (
    <div
      id="google-drive-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-[76px] sm:pb-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in overflow-y-auto"
    >
      <div
        id="google-drive-modal-card"
        className="relative w-full max-w-xl bg-slate-900 border border-slate-700/70 rounded-2xl shadow-2xl shadow-blue-900/20 overflow-hidden my-auto max-h-[calc(100dvh-85px)] sm:max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Cấu hình Google Drive dùng chung & cá nhân
              </h3>
              <p className="text-xs text-slate-400">
                Đồng bộ tài liệu và sổ văn bản tức thời giữa PC và Điện thoại
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
        <div className="p-6 space-y-5 text-sm text-slate-300 max-h-[75vh] overflow-y-auto">
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
                        <AlertTriangle className="w-3 h-3" /> Hết hạn phiên
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
                    <RefreshCw className={`w-3.5 h-3.5 ${isAuthorizing ? "animate-spin" : ""}`} />
                    Gia hạn phiên
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
                  Đăng nhập để đồng bộ văn bản dùng chung giữa PC và Điện thoại.
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

          {/* Current Active Folder Banner */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-slate-800/90 to-slate-800/50 border border-slate-700/80 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[11px] text-slate-400 block mb-0.5">Thư mục đang kết nối:</span>
              <div className="flex items-center gap-2">
                <FolderCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold text-white text-sm truncate">
                  {config.folderName || "[VCC] Sổ Văn Bản Điện Tử"}
                </span>
              </div>
            </div>
            {config.folderId && config.folderId !== "root" && (
              <a
                href={`https://drive.google.com/drive/folders/${config.folderId}`}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1.5 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center gap-1 shrink-0 transition-colors"
                title="Mở thư mục trên Google Drive"
              >
                <span>Mở Drive</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Visual Folder Selection List (PC & Mobile 1-Tap) */}
          {config.accessToken && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-blue-400" />
                  Thư mục có dữ liệu sổ (vcc_documents_database.json)
                </label>
                <button
                  type="button"
                  onClick={() => loadFolders()}
                  disabled={isLoadingFolders}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingFolders ? "animate-spin" : ""}`} />
                  Quét lại
                </button>
              </div>

              {/* Folder list */}
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 rounded-xl border border-slate-800 bg-slate-950/40 p-1.5">
                {isLoadingFolders ? (
                  <div className="py-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                    <span>Đang tìm các thư mục chứa tệp database trên Google Drive...</span>
                  </div>
                ) : folders.length > 0 ? (
                  folders.map((folder) => {
                    const isSelected = config.folderId === folder.id;
                    return (
                      <button
                        key={folder.id}
                        type="button"
                        onClick={() => handleSelectFolder(folder)}
                        className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center justify-between gap-2.5 cursor-pointer ${
                          isSelected
                            ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm"
                            : "bg-slate-800/40 hover:bg-slate-800/80 border-slate-700/40 hover:border-slate-600 text-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FolderOpen
                            className={`w-4 h-4 shrink-0 ${
                              isSelected ? "text-emerald-400" : "text-blue-400"
                            }`}
                          />
                          <div className="min-w-0">
                            <span className="font-medium text-xs truncate block">
                              {folder.name}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              {folder.isDatabaseHost ? (
                                <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium flex items-center gap-1">
                                  <Check className="w-2.5 h-2.5" /> Có tệp vcc_documents_database.json
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-700/50 text-slate-400 border border-slate-600/40">
                                  Thư mục được chỉ định
                                </span>
                              )}
                              {folder.shared && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                  Được chia sẻ
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                            <Check className="w-3.5 h-3.5" />
                            Đang kết nối
                          </span>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="py-5 text-center text-xs text-slate-400 px-3">
                    <p>Chưa tìm thấy thư mục nào có tệp <span className="text-amber-300 font-mono">vcc_documents_database.json</span> trên Drive của bạn.</p>
                    <p className="text-[11px] text-slate-500 mt-1">Bạn có thể dán link/ID thư mục được chia sẻ bên dưới để kết nối.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Toggle manual link/ID input */}
          <div className="pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowManualInput(!showManualInput)}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 cursor-pointer py-1"
            >
              {showManualInput ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              <span>{showManualInput ? "Thu gọn tùy chọn dán link/ID" : "Hoặc dán trực tiếp đường link / ID thư mục Google Drive"}</span>
            </button>

            {showManualInput && (
              <div className="mt-2.5 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-2 animate-fade-in">
                <label className="block text-[11px] text-slate-400">
                  Dán URL hoặc Folder ID Google Drive:
                </label>
                <input
                  id="input-drive-folder-url"
                  type="text"
                  value={customFolderId}
                  onChange={(e) => {
                    const rawVal = e.target.value;
                    const folderUrlMatch = rawVal.match(/\/folders\/([a-zA-Z0-9_-]+)/);
                    if (folderUrlMatch && folderUrlMatch[1]) {
                      setCustomFolderId(folderUrlMatch[1]);
                    } else {
                      setCustomFolderId(rawVal.trim());
                    }
                  }}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full px-3 py-2 text-xs bg-slate-950/80 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                />
                <p className="text-[10px] text-slate-500">
                  *Hệ thống sẽ tự động tra cứu Tên thư mục thật từ Google Drive khi bạn bấm Lưu cấu hình.
                </p>
              </div>
            )}
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
            id="btn-save-drive-settings"
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
