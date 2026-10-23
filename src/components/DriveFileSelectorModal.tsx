import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  X,
  Search,
  Folder,
  FileText,
  Image as ImageIcon,
  RefreshCw,
  ChevronRight,
  Cloud,
  AlertCircle,
  Loader2,
  CheckCircle2,
  HardDrive,
  Users,
  Building,
  Clock,
  Link2,
  CornerDownRight,
  FolderOpen,
} from "lucide-react";
import {
  getGoogleDriveConfig,
  isDriveTokenExpired,
  renewGoogleDriveSession,
  listDocumentFilesFromDrive,
  downloadDriveFileContent,
  getDriveFolderDetails,
  extractDriveFolderIdFromInput,
  DrivePickerFile,
} from "../services/googleDriveService";

export interface SelectedDriveFileResult {
  id: string;
  name: string;
  dataUrl: string;
  mimeType: string;
  size: number;
  sourceDriveFileId: string;
  driveWebViewLink?: string;
  driveThumbnailLink?: string;
}

export interface DriveFileSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFile?: (file: SelectedDriveFileResult) => void;
  onSelectFiles?: (files: DrivePickerFile[], token: string) => Promise<void> | void;
  allowMultiple?: boolean;
}

interface FolderBreadcrumb {
  id: string;
  name: string;
}

type DriveScope = "MY_DRIVE" | "SHARED_WITH_ME" | "SETUP_FOLDER" | "RECENT";

export const DriveFileSelectorModal: React.FC<DriveFileSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectFile,
  onSelectFiles,
  allowMultiple = false,
}) => {
  const [driveConfig, setDriveConfig] = useState(getGoogleDriveConfig());
  const [isTokenExpired, setIsTokenExpired] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);

  // Phân vùng vị trí hiện tại
  const [scope, setScope] = useState<DriveScope>("MY_DRIVE");

  // Ô nhập đường link / ID thư mục tùy ý
  const [isCustomFolderInputOpen, setIsCustomFolderInputOpen] = useState(false);
  const [customFolderInput, setCustomFolderInput] = useState("");
  const [customFolderLoading, setCustomFolderLoading] = useState(false);
  const [customFolderError, setCustomFolderError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [breadcrumbs, setBreadcrumbs] = useState<FolderBreadcrumb[]>([
    { id: "root", name: "Google Drive của tôi" },
  ]);

  const [files, setFiles] = useState<DrivePickerFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingFileName, setDownloadingFileName] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Danh sách tệp được chọn
  const [selectedFiles, setSelectedFiles] = useState<DrivePickerFile[]>([]);

  const currentFolderId = breadcrumbs[breadcrumbs.length - 1]?.id || "root";

  // Kiểm tra hạn token khi modal mở
  useEffect(() => {
    if (isOpen) {
      const cfg = getGoogleDriveConfig();
      setDriveConfig(cfg);
      const expired = !cfg.accessToken || isDriveTokenExpired(cfg);
      setIsTokenExpired(expired);
      setErrorMsg(null);
      setSelectedFiles([]);
      setIsCustomFolderInputOpen(false);
      setCustomFolderInput("");
      setCustomFolderError(null);
    }
  }, [isOpen]);

  // Tải danh sách tệp từ Drive theo Scope và Thư mục hiện tại
  const loadFiles = useCallback(
    async (
      folderId: string,
      query: string,
      currentScope: DriveScope = scope
    ) => {
      const cfg = getGoogleDriveConfig();
      if (!cfg.accessToken || isDriveTokenExpired(cfg)) {
        setIsTokenExpired(true);
        return;
      }

      setIsLoading(true);
      setErrorMsg(null);

      try {
        const isShared = currentScope === "SHARED_WITH_ME";
        const isRecent = currentScope === "RECENT";

        const result = await listDocumentFilesFromDrive(cfg.accessToken, {
          folderId: query.trim() || isShared || isRecent ? undefined : folderId,
          query: query.trim(),
          pageSize: 50,
          includeFolders: !query.trim() && !isRecent,
          sharedWithMe: isShared && !query.trim(),
          recentOnly: isRecent && !query.trim(),
        });

        setFiles(result.files);
      } catch (err: any) {
        console.error("Lỗi tải tệp Drive:", err);
        if (
          err.status === 401 ||
          err.message?.includes("401") ||
          err.message?.includes("hết hạn")
        ) {
          setIsTokenExpired(true);
          setErrorMsg("Phiên làm việc Google Drive đã hết hạn. Vui lòng gia hạn phiên 1 chạm.");
        } else {
          setErrorMsg(err.message || "Không thể tải danh sách tệp từ Google Drive.");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [scope]
  );

  // Kích hoạt nạp tệp khi đổi folder, scope hoặc tìm kiếm
  useEffect(() => {
    if (isOpen && !isTokenExpired && driveConfig.accessToken) {
      loadFiles(currentFolderId, searchQuery, scope);
    }
  }, [isOpen, isTokenExpired, driveConfig.accessToken, currentFolderId, scope, loadFiles]);

  // Đổi phân vùng duyệt (Drive của tôi, Được chia sẻ, Thư mục Setup, Gần đây)
  const handleSelectScope = (newScope: DriveScope) => {
    setScope(newScope);
    setSearchQuery("");
    setSelectedFiles([]);
    setIsCustomFolderInputOpen(false);

    if (newScope === "MY_DRIVE") {
      setBreadcrumbs([{ id: "root", name: "Google Drive của tôi" }]);
    } else if (newScope === "SHARED_WITH_ME") {
      setBreadcrumbs([{ id: "sharedWithMe", name: "Được chia sẻ với tôi" }]);
    } else if (newScope === "SETUP_FOLDER") {
      const targetId = driveConfig.folderId || "root";
      const targetName = driveConfig.folderName || "Thư mục Cơ quan (Setup)";
      setBreadcrumbs([{ id: targetId, name: targetName }]);
    } else if (newScope === "RECENT") {
      setBreadcrumbs([{ id: "recent", name: "Tệp tài liệu gần đây" }]);
    }
  };

  // Mở thư mục tùy chọn theo Link URL hoặc Folder ID
  const handleOpenCustomFolder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customFolderInput.trim()) return;

    const extractedId = extractDriveFolderIdFromInput(customFolderInput);
    if (!extractedId) {
      setCustomFolderError("Vui lòng nhập đường link Google Drive Folder hoặc Folder ID hợp lệ.");
      return;
    }

    const cfg = getGoogleDriveConfig();
    if (!cfg.accessToken || isDriveTokenExpired(cfg)) {
      setIsTokenExpired(true);
      return;
    }

    setCustomFolderLoading(true);
    setCustomFolderError(null);

    try {
      // Đọc thông tin chi tiết của thư mục để lấy tên chuẩn
      const folderDetails = await getDriveFolderDetails(cfg.accessToken, extractedId);
      const folderName = folderDetails?.name || `Thư mục (${extractedId.slice(0, 10)}...)`;

      setScope("MY_DRIVE");
      setBreadcrumbs([
        { id: "root", name: "Drive của tôi" },
        { id: extractedId, name: folderName },
      ]);
      setSearchQuery("");
      setIsCustomFolderInputOpen(false);
      setCustomFolderInput("");
    } catch (err: any) {
      console.warn("Không thể tìm thấy thư mục:", err);
      setCustomFolderError("Không thể truy cập thư mục này. Vui lòng kiểm tra lại đường link hoặc quyền truy cập của tài khoản.");
    } finally {
      setCustomFolderLoading(false);
    }
  };

  // Xử lý gia hạn phiên làm việc Google Drive 1 chạm
  const handleRenewSession = async () => {
    setIsRenewing(true);
    setErrorMsg(null);
    try {
      const updatedConfig = await renewGoogleDriveSession({ prompt: "" });
      setDriveConfig(updatedConfig);
      setIsTokenExpired(false);
      await loadFiles(currentFolderId, searchQuery, scope);
    } catch (err: any) {
      console.warn("Silent renew failed, requesting select_account:", err);
      try {
        const updatedConfig = await renewGoogleDriveSession({ prompt: "select_account" });
        setDriveConfig(updatedConfig);
        setIsTokenExpired(false);
        await loadFiles(currentFolderId, searchQuery, scope);
      } catch (promptErr: any) {
        setErrorMsg("Không thể gia hạn phiên: " + (promptErr.message || "Vui lòng đăng nhập lại Google Drive trong Cài đặt."));
      }
    } finally {
      setIsRenewing(false);
    }
  };

  // Điều hướng vào thư mục con
  const handleOpenFolder = (folder: DrivePickerFile) => {
    setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }]);
    setSearchQuery("");
    setSelectedFiles([]);
  };

  // Nhảy breadcrumb
  const handleNavigateBreadcrumb = (index: number) => {
    setBreadcrumbs((prev) => prev.slice(0, index + 1));
    setSearchQuery("");
    setSelectedFiles([]);
  };

  // Chọn hoặc bỏ chọn file
  const handleToggleSelectFile = (file: DrivePickerFile) => {
    if (file.isFolder) return;
    if (allowMultiple) {
      setSelectedFiles((prev) => {
        const exists = prev.some((f) => f.id === file.id);
        if (exists) {
          return prev.filter((f) => f.id !== file.id);
        } else {
          return [...prev, file];
        }
      });
    } else {
      setSelectedFiles([file]);
    }
  };

  // Xác nhận nạp tệp vào hệ thống tiếp nhận
  const handleConfirmSelect = async () => {
    if (selectedFiles.length === 0) return;
    const cfg = getGoogleDriveConfig();
    if (!cfg.accessToken || isDriveTokenExpired(cfg)) {
      setIsTokenExpired(true);
      return;
    }

    // Nếu consumer hỗ trợ onSelectFiles (batch nạp trực tiếp)
    if (onSelectFiles) {
      await onSelectFiles(selectedFiles, cfg.accessToken);
      onClose();
      return;
    }

    // Nếu consumer dùng onSelectFile (tải về client rồi truyền result)
    if (onSelectFile && selectedFiles.length > 0) {
      const fileToLoad = selectedFiles[0];
      setIsDownloading(true);
      setDownloadingFileName(fileToLoad.name);
      setErrorMsg(null);

      try {
        const downloaded = await downloadDriveFileContent(
          cfg.accessToken,
          fileToLoad.id,
          fileToLoad.mimeType
        );

        onSelectFile({
          id: `drive-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: fileToLoad.name,
          dataUrl: downloaded.dataUrl,
          mimeType: downloaded.mimeType,
          size: downloaded.size,
          sourceDriveFileId: fileToLoad.id,
          driveWebViewLink: fileToLoad.webViewLink,
          driveThumbnailLink: fileToLoad.thumbnailLink,
        });

        onClose();
      } catch (err: any) {
        console.error("Lỗi tải nội dung tệp:", err);
        setErrorMsg("Không thể tải tệp về: " + (err.message || "Lỗi không xác định"));
      } finally {
        setIsDownloading(false);
        setDownloadingFileName("");
      }
    }
  };

  // Định dạng kích thước file
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Định dạng ngày
  const formatDate = (isoStr?: string) => {
    if (!isoStr) return "";
    try {
      const d = new Date(isoStr);
      return `${d.toLocaleDateString("vi-VN")} ${d.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } catch {
      return "";
    }
  };

  // Sắp xếp: Thư mục luôn đứng đầu, sau đó đến các tệp tài liệu
  const sortedFiles = useMemo(() => {
    return [...files].sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return 0;
    });
  }, [files]);

  const folderCount = files.filter((f) => f.isFolder).length;
  const fileCount = files.filter((f) => !f.isFolder).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl h-[92vh] max-h-[760px] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Cloud className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2 truncate">
                <span>Chọn tài liệu từ Google Drive</span>
                {driveConfig.userEmail && (
                  <span className="text-[11px] font-medium text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-200 shrink-0 shadow-2xs font-mono">
                    {driveConfig.userEmail}
                  </span>
                )}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                Duyệt thư mục, mở theo link hoặc chọn tệp PDF / hình ảnh trực tiếp từ tài khoản Google Drive
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDownloading}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Token Expired Banner */}
        {isTokenExpired && (
          <div className="px-5 py-3.5 bg-amber-50 border-b border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in slide-in-from-top duration-200">
            <div className="flex items-start gap-2.5 text-amber-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-bold">Phiên kết nối Google Drive cần được làm mới</p>
                <p className="text-amber-700 text-[11px] mt-0.5">
                  Token truy cập đã hết hạn. Nhấn nút bên cạnh để làm mới phiên ngay tức thì.
                </p>
              </div>
            </div>
            <button
              onClick={handleRenewSession}
              disabled={isRenewing}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shrink-0 transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isRenewing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang gia hạn...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Gia hạn phiên (1 chạm)</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Navigation Scope Tabs (Phân vùng Drive theo tài khoản email) */}
        <div className="px-5 py-2.5 bg-slate-100/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <button
              type="button"
              onClick={() => handleSelectScope("MY_DRIVE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                scope === "MY_DRIVE"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200"
              }`}
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>Drive của tôi</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectScope("SHARED_WITH_ME")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                scope === "SHARED_WITH_ME"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Được chia sẻ với tôi</span>
            </button>

            {driveConfig.folderId && driveConfig.folderId !== "root" && (
              <button
                type="button"
                onClick={() => handleSelectScope("SETUP_FOLDER")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  scope === "SETUP_FOLDER"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200"
                }`}
                title={`Thư mục lưu trữ: ${driveConfig.folderName || driveConfig.folderId}`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>Thư mục Cơ quan</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSelectScope("RECENT")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                scope === "RECENT"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Tệp gần đây</span>
            </button>
          </div>

          {/* Nút mở theo Link / ID Thư mục tùy ý */}
          <button
            type="button"
            onClick={() => {
              setIsCustomFolderInputOpen((prev) => !prev);
              setCustomFolderError(null);
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
              isCustomFolderInputOpen
                ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-bold"
                : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-2xs"
            }`}
          >
            <Link2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Dán Link / ID Thư mục</span>
          </button>
        </div>

        {/* Khung nhập Link / ID Thư mục Google Drive tùy ý */}
        {isCustomFolderInputOpen && (
          <form
            onSubmit={handleOpenCustomFolder}
            className="px-5 py-3 bg-indigo-50/60 border-b border-indigo-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 animate-in slide-in-from-top duration-150"
          >
            <div className="flex-1 relative">
              <CornerDownRight className="w-4 h-4 text-indigo-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Dán link Google Drive Folder hoặc Folder ID (VD: https://drive.google.com/drive/folders/1abc...)"
                value={customFolderInput}
                onChange={(e) => setCustomFolderInput(e.target.value)}
                autoFocus
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="submit"
                disabled={customFolderLoading || !customFolderInput.trim()}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {customFolderLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FolderOpen className="w-3.5 h-3.5" />
                )}
                <span>Mở thư mục này</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCustomFolderInputOpen(false)}
                className="px-2.5 py-1.5 border border-slate-300 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-medium cursor-pointer"
              >
                Đóng
              </button>
            </div>
            {customFolderError && (
              <p className="text-[11px] text-rose-600 font-medium sm:basis-full">{customFolderError}</p>
            )}
          </form>
        )}

        {/* Toolbar: Breadcrumbs & Search */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1 text-xs text-slate-600 overflow-x-auto py-1 scrollbar-none min-w-0 flex-1">
            {breadcrumbs.map((bc, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={bc.id}>
                  {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                  <button
                    onClick={() => handleNavigateBreadcrumb(idx)}
                    disabled={isLast || isLoading}
                    className={`shrink-0 px-2 py-1 rounded-md transition-colors ${
                      isLast
                        ? "font-bold text-blue-700 bg-blue-100/70"
                        : "hover:bg-slate-200 text-slate-600 cursor-pointer"
                    }`}
                  >
                    {idx === 0 ? (
                      <span className="flex items-center gap-1.5">
                        {scope === "SHARED_WITH_ME" ? (
                          <Users className="w-3.5 h-3.5 text-blue-600" />
                        ) : scope === "RECENT" ? (
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                        ) : (
                          <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                        )}
                        <span>{bc.name}</span>
                      </span>
                    ) : (
                      bc.name
                    )}
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative shrink-0 w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên tệp..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  loadFiles(currentFolderId, searchQuery, scope);
                }
              }}
              className="w-full pl-9 pr-8 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  loadFiles(currentFolderId, "", scope);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && !isTokenExpired && (
          <div className="px-5 py-2 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => loadFiles(currentFolderId, searchQuery, scope)}
              className="text-xs font-bold text-rose-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Thử lại</span>
            </button>
          </div>
        )}

        {/* Status / Items summary */}
        {!isLoading && files.length > 0 && (
          <div className="px-5 py-1.5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
            <span>
              {folderCount > 0 ? `${folderCount} thư mục con • ` : ""}
              {fileCount} tệp tài liệu
            </span>
            {allowMultiple && (
              <span className="text-blue-600 font-medium">
                (Có thể chọn nhiều tệp cùng lúc)
              </span>
            )}
          </div>
        )}

        {/* File & Folder Grid Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 relative">
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10 space-y-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-xs text-slate-500 font-medium">
                Đang tải dữ liệu từ Google Drive...
              </p>
            </div>
          ) : files.length === 0 ? (
            <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <Cloud className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">
                  {searchQuery ? "Không tìm thấy tệp nào phù hợp" : "Thư mục này hiện không có tài liệu PDF hoặc hình ảnh"}
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  {searchQuery
                    ? `Thử tìm kiếm với từ khóa khác hoặc xóa tìm kiếm để xem toàn bộ tệp.`
                    : `Hệ thống tự động lọc các tệp văn bản PDF và hình ảnh scan.`}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sortedFiles.map((file) => {
                const isSelected = selectedFiles.some((f) => f.id === file.id);
                const isPdf = file.mimeType === "application/pdf";
                const isFolder = file.isFolder;

                return (
                  <div
                    key={file.id}
                    onClick={() => {
                      if (isFolder) {
                        handleOpenFolder(file);
                      } else {
                        handleToggleSelectFile(file);
                      }
                    }}
                    onDoubleClick={() => {
                      if (isFolder) {
                        handleOpenFolder(file);
                      } else {
                        setSelectedFiles([file]);
                        handleConfirmSelect();
                      }
                    }}
                    className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer relative ${
                      isFolder
                        ? "bg-amber-50/40 hover:bg-amber-100/60 border-amber-200/80 hover:border-amber-300 shadow-2xs"
                        : isSelected
                        ? "bg-blue-50/80 border-blue-500 shadow-sm ring-2 ring-blue-500/20"
                        : "bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 shadow-2xs"
                    }`}
                  >
                    {/* Thumbnail / Icon */}
                    <div
                      className={`w-11 h-11 rounded-lg shrink-0 flex items-center justify-center overflow-hidden border ${
                        isFolder
                          ? "bg-amber-100/80 border-amber-300 text-amber-600 shadow-2xs"
                          : isPdf
                          ? "bg-rose-50 border-rose-200 text-rose-500"
                          : "bg-emerald-50 border-emerald-200 text-emerald-500"
                      }`}
                    >
                      {file.thumbnailLink && !isFolder ? (
                        <img
                          src={file.thumbnailLink}
                          alt={file.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : isFolder ? (
                        <Folder className="w-6 h-6 fill-amber-400 text-amber-500" />
                      ) : isPdf ? (
                        <FileText className="w-6 h-6" />
                      ) : (
                        <ImageIcon className="w-6 h-6" />
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs font-semibold truncate ${
                          isFolder
                            ? "text-slate-900 font-bold"
                            : isSelected
                            ? "text-blue-800 font-bold"
                            : "text-slate-800"
                        }`}
                        title={file.name}
                      >
                        {file.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                        {isFolder ? (
                          <span className="text-amber-700 font-semibold bg-amber-100/70 px-1.5 py-0.2 rounded text-[10px]">
                            Thư mục
                          </span>
                        ) : (
                          <span>{formatFileSize(file.size)}</span>
                        )}
                        {file.modifiedTime && (
                          <>
                            <span>•</span>
                            <span>{formatDate(file.modifiedTime)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Selection Indicator */}
                    {isSelected && !isFolder && (
                      <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    )}

                    {/* Arrow hint for folder */}
                    {isFolder && (
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 self-center" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 truncate min-w-0">
            {selectedFiles.length > 0 ? (
              <span className="flex items-center gap-1.5 text-slate-700 truncate">
                <span className="font-semibold text-slate-500 shrink-0">Đã chọn:</span>
                <span className="font-bold text-blue-700 truncate">
                  {selectedFiles.length === 1
                    ? selectedFiles[0].name
                    : `${selectedFiles.length} tệp tài liệu`}
                </span>
                {selectedFiles.length === 1 && (
                  <span className="text-[11px] text-slate-400 shrink-0">
                    ({formatFileSize(selectedFiles[0].size)})
                  </span>
                )}
              </span>
            ) : (
              <span>Chọn một tệp PDF hoặc ảnh để tiếp tục (click đúp để nạp nhanh)</span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClose}
              disabled={isDownloading}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              onClick={handleConfirmSelect}
              disabled={selectedFiles.length === 0 || isDownloading || isTokenExpired}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 ${
                selectedFiles.length === 0 || isDownloading || isTokenExpired
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 cursor-pointer active:scale-95"
              }`}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang tải tệp ({downloadingFileName.slice(0, 15)}...)...</span>
                </>
              ) : (
                <>
                  <Cloud className="w-4 h-4" />
                  <span>
                    Nạp vào Tiếp nhận
                    {selectedFiles.length > 1 ? ` (${selectedFiles.length})` : ""}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
