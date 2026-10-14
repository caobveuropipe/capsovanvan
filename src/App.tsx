/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { DocumentArchiveView } from "./components/DocumentArchiveView";
import { CategoryConfigModal } from "./components/CategoryConfigModal";
import { IntakeModal } from "./components/IntakeModal";
import { DocumentDetailModal } from "./components/DocumentDetailModal";
import { PrintDocumentModal } from "./components/PrintDocumentModal";
import { GoogleDriveConfigModal } from "./components/GoogleDriveConfigModal";
import { DashboardStats } from "./components/DashboardStats";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { LoginScreen } from "./components/LoginScreen";
import { HardDrive, AlertCircle, ArrowRight, FolderPlus, FileText } from "lucide-react";
import { DocumentCategory, DocumentRecord } from "./types";
import {
  getCategories,
  saveCategories,
  getAllDocuments,
  getDocumentById,
  saveDocument,
  deleteDocument,
  clearAllDocuments,
  seedInitialDocumentsIfEmpty,
  incrementCategoryCount,
  reconcileCategoryCounts,
  getTombstones,
  addTombstone,
  updateTombstone,
  pruneTombstones,
} from "./services/storage";
import {
  getGoogleDriveConfig,
  saveGoogleDriveConfig,
  GoogleDriveConfig,
  uploadFileToGoogleDrive,
  deleteFileFromGoogleDrive,
  findDriveFileByName,
  resolveCanonicalDriveDatabase,
  readDatabaseFromGoogleDrive,
  saveDatabaseToGoogleDrive,
  saveDatabaseWithConflictResolution,
  mergeDocumentsAndTombstones,
  DRIVE_DB_FILENAME,
  DriveDatabasePayload,
  isDriveTokenExpired,
  renewGoogleDriveSession,
  loginWithGoogle,
  logoutGoogle,
} from "./services/googleDriveService";
import {
  initRealtime,
  broadcastDocumentChange,
  updateRealtimeFolder,
  setupVisibilityAndFocusSync,
  resetRealtimeCircuitBreaker,
} from "./services/realtimeService";
import { compileImagesToPdf } from "./utils/pdfGenerator";

export default function App() {
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [currentTab, setCurrentTab] = useState<"archive" | "stats">("archive");

  // Modals state
  const [isIntakeOpen, setIsIntakeOpen] = useState<boolean>(false);
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [isGoogleDriveOpen, setIsGoogleDriveOpen] = useState<boolean>(false);
  const [driveConfig, setDriveConfig] = useState<GoogleDriveConfig>(getGoogleDriveConfig());
  const [selectedDocForDetail, setSelectedDocForDetail] = useState<DocumentRecord | null>(null);
  const [selectedDocForPrint, setSelectedDocForPrint] = useState<DocumentRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDriveSyncing, setIsDriveSyncing] = useState<boolean>(false);
  const [isDriveRenewing, setIsDriveRenewing] = useState<boolean>(false);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem("docnum_offline_mode") === "true";
    } catch {
      return false;
    }
  });

  // Toast Notification state
  const [toastNotification, setToastNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToastNotification({ message, type });
    setTimeout(() => {
      setToastNotification(null);
    }, 4500);
  };

  // Sync with Google Drive central database file
  const syncWithGoogleDrive = async (isManual = false) => {
    const currentConfig = getGoogleDriveConfig();
    if (!currentConfig.accessToken) {
      if (isManual) {
        showToast("Vui lòng kết nối tài khoản Google Drive trước để đồng bộ.", "info");
      }
      return;
    }

    // Reset circuit breaker nếu người dùng chủ động bấm đồng bộ thủ công (EFR-05)
    if (isManual) {
      resetRealtimeCircuitBreaker();
    }

    // Nếu token đã hết hạn, cố gắng làm mới ngầm tự động trước
    let activeConfig = currentConfig;
    if (isDriveTokenExpired(activeConfig) && activeConfig.userEmail) {
      try {
        activeConfig = await renewGoogleDriveSession({ prompt: "" });
        setDriveConfig(activeConfig);
      } catch (renewErr) {
        if (isManual) {
          showToast("Phiên đăng nhập Google Drive đã hết hạn. Vui lòng đăng nhập lại.", "error");
        }
        return;
      }
    }

    setIsDriveSyncing(true);
    try {
      // 1. Phân giải Canonical File qua resolveCanonicalDriveDatabase (tự động reconcile nếu có duplicate - EFR-21 & EFR-22)
      let canonicalDbFile = await resolveCanonicalDriveDatabase(
        currentConfig.accessToken,
        currentConfig.folderId
      );

      // Nếu người dùng chưa chọn thư mục cụ thể (hoặc đang là root) và chưa thấy file, tìm thử trên toàn bộ Drive
      if (!canonicalDbFile && (!currentConfig.folderId || currentConfig.folderId === "root")) {
        const globalDbFile = await resolveCanonicalDriveDatabase(
          currentConfig.accessToken
        );
        if (globalDbFile && globalDbFile.parents && globalDbFile.parents.length > 0) {
          canonicalDbFile = globalDbFile;
          const recoveredFolderId = globalDbFile.parents[0];
          currentConfig.folderId = recoveredFolderId;
          saveGoogleDriveConfig(currentConfig);
        }
      }

      if (canonicalDbFile) {
        // Read remote database
        const remoteData = await readDatabaseFromGoogleDrive(
          currentConfig.accessToken,
          canonicalDbFile.id
        );

        if (remoteData) {
          // Merge / Update categories: lấy cấu hình mới nhất và số đếm lớn nhất để không bao giờ bị nhảy lùi số
          if (Array.isArray(remoteData.categories) && remoteData.categories.length > 0) {
            const localCats = getCategories();
            const mergedCats = remoteData.categories.map((rCat: DocumentCategory) => {
              const lCat = localCats.find((c) => c.id === rCat.id || c.code.toUpperCase() === rCat.code.toUpperCase());
              if (!lCat) return rCat;
              return {
                ...rCat,
                currentCount: Math.max(rCat.currentCount || 0, lCat.currentCount || 0),
              };
            });

            for (const lCat of localCats) {
              if (!mergedCats.some((c: DocumentCategory) => c.id === lCat.id || c.code.toUpperCase() === lCat.code.toUpperCase())) {
                mergedCats.push(lCat);
              }
            }

            saveCategories(mergedCats);
            setCategories(mergedCats);
          }

          // Lấy tombstones cả từ remote và local (Tombstone-Wins toàn diện - EFR-20)
          const localTombstones = getTombstones();
          const remoteDeletedRecords = Array.isArray(remoteData.deletedRecords) ? remoteData.deletedRecords : [];
          
          // Đồng bộ các tombstone mới từ remote vào local
          for (const remT of remoteDeletedRecords) {
            const existsLocally = localTombstones.some((lt) => lt.id === remT.id);
            if (!existsLocally) {
              addTombstone({
                id: remT.id,
                deletedAt: remT.deletedAt,
                registrySynced: true,
                assetCleaned: true,
              });
            }
          }

          // Tập hợp tất cả ID đã xóa: remote ∪ local
          const effectiveDeletedIds = new Set([
            ...remoteDeletedRecords.map((r) => r.id),
            ...getTombstones().map((t) => t.id),
          ]);

          // Lọc sạch documents theo Tombstone-Wins trước khi lưu IndexedDB
          if (Array.isArray(remoteData.documents)) {
            const validDocs = remoteData.documents.filter((d: any) => !effectiveDeletedIds.has(d.id));
            
            await clearAllDocuments();
            for (const rDoc of validDocs) {
              await saveDocument(rDoc);
            }
            const refreshedDocs = await getAllDocuments();
            const reconciledCats = reconcileCategoryCounts(refreshedDocs);
            setDocuments(refreshedDocs);
            setCategories(reconciledCats);
          }

          // Dọn dẹp định kỳ các tombstone cũ
          pruneTombstones();

          if (isManual) {
            showToast(
              `Đã tải và đồng bộ thành công dữ liệu từ Google Drive (${remoteData.documents?.length || 0} văn bản).`,
              "success"
            );
          }
        }
      } else {
        // If file doesn't exist on Google Drive yet, push current local state to Google Drive as initial DB
        const localCats = getCategories();
        const localDocs = await getAllDocuments();
        const localTombstones = getTombstones();
        const effectiveDeletedIds = new Set(localTombstones.map((t) => t.id));
        const filteredDocs = localDocs.filter((d) => !effectiveDeletedIds.has(d.id));

        await saveDatabaseWithConflictResolution(currentConfig.accessToken, currentConfig.folderId, () => ({
          version: 1,
          lastUpdated: new Date().toISOString(),
          updatedBy: currentConfig.userEmail,
          categories: localCats,
          documents: filteredDocs,
          deletedRecords: localTombstones.map((t) => ({ id: t.id, deletedAt: t.deletedAt })),
        }));

        if (isManual) {
          showToast("Đã khởi tạo kho dữ liệu dùng chung trên Google Drive thành công!", "success");
        }
      }

      // Quét dọn dẹp các asset file còn tồn đọng (assetCleaned === false)
      const pendingTombstones = getTombstones().filter((t) => !t.assetCleaned && t.driveFileId);
      for (const pt of pendingTombstones) {
        if (pt.driveFileId) {
          deleteFileFromGoogleDrive(currentConfig.accessToken, pt.driveFileId, currentConfig.folderId)
            .then((cleaned) => {
              if (cleaned) updateTombstone(pt.id, { assetCleaned: true });
            })
            .catch((err: any) => {
              if (err?.status === 404) updateTombstone(pt.id, { assetCleaned: true });
            });
        }
      }
    } catch (syncErr: any) {
      const errMsg = syncErr.message || "";
      if (errMsg.includes("invalid authentication") || errMsg.includes("401") || errMsg.includes("Invalid Credentials")) {
        // Token đã hết hạn trên server Google
        const updatedConfig = { ...currentConfig, tokenExpiresAt: Date.now() - 1000 };
        saveGoogleDriveConfig(updatedConfig);
        if (isManual) {
          showToast("Phiên đăng nhập Google Drive đã hết hạn. Vui lòng đăng nhập lại để tiếp tục đồng bộ.", "error");
        }
      } else {
        console.warn("Lỗi đồng bộ cơ sở dữ liệu Google Drive:", syncErr);
        if (isManual) {
          showToast(`Chưa thể đồng bộ Google Drive: ${errMsg || "Lỗi kết nối"}`, "error");
        }
      }
    } finally {
      setIsDriveSyncing(false);
    }
  };

  // Tự động làm mới phiên Google Drive ngầm trước khi hết hạn 10 phút (Silent Background Auto-Renew)
  useEffect(() => {
    if (!driveConfig.userEmail) return;

    const intervalId = setInterval(async () => {
      const cfg = getGoogleDriveConfig();
      if (!cfg.userEmail || !cfg.tokenExpiresAt) return;

      const remainingMs = cfg.tokenExpiresAt - Date.now();
      // Nếu sắp hết hạn trong vòng 10 phút, tự làm mới ngầm êm ái
      if (remainingMs < 10 * 60 * 1000) {
        try {
          const updated = await renewGoogleDriveSession({ prompt: "" });
          setDriveConfig(updated);
          console.log("Đã tự động gia hạn token Google Drive ngầm thành công.");
        } catch (silentErr) {
          console.debug("Silent renew đang chờ tương tác người dùng:", silentErr);
        }
      }
    }, 60000);

    return () => clearInterval(intervalId);
  }, [driveConfig.userEmail]);

  // Đăng nhập hệ thống qua Google Workspace
  const handleLoginGoogle = async () => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const updated = await loginWithGoogle({ prompt: "select_account" });
      setDriveConfig(updated);
      setIsOfflineMode(false);
      localStorage.removeItem("docnum_offline_mode");
      showToast(`Đăng nhập Google Workspace (${updated.userEmail}) thành công!`, "success");
      // Tự động kéo dữ liệu về ngay sau khi đăng nhập
      setTimeout(() => {
        syncWithGoogleDrive(false);
      }, 500);
    } catch (err: any) {
      console.error("Lỗi đăng nhập Google:", err);
      setLoginError(err.message || "Đăng nhập Google không thành công");
      throw err;
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Đăng xuất tài khoản Google
  const handleLogoutGoogle = () => {
    const updated = logoutGoogle(false);
    setDriveConfig(updated);
    setIsOfflineMode(false);
    localStorage.removeItem("docnum_offline_mode");
    showToast("Đã đăng xuất tài khoản Google.", "info");
  };

  // Tiếp tục ở chế độ ngoại tuyến (Offline)
  const handleContinueOffline = () => {
    setIsOfflineMode(true);
    localStorage.setItem("docnum_offline_mode", "true");
    showToast("Đang ở chế độ xem ngoại tuyến.", "info");
  };

  // Gia hạn phiên làm việc Google Drive 1 chạm (Tự động nhận diện tài khoản cũ, không hỏi lại quyền)
  const handleRenewDriveSession = async () => {
    setIsDriveRenewing(true);
    try {
      const updated = await renewGoogleDriveSession();
      setDriveConfig(updated);
      showToast(`Đã gia hạn phiên Google Drive (${updated.userEmail}) thành công!`, "success");
      setTimeout(() => {
        syncWithGoogleDrive(false);
      }, 500);
    } catch (err: any) {
      console.warn("Lỗi gia hạn phiên Google Drive:", err);
      showToast(
        `Chưa thể gia hạn tự động: ${err.message || "Vui lòng mở cài đặt Drive để kết nối lại"}.`,
        "error"
      );
      setIsGoogleDriveOpen(true);
    } finally {
      setIsDriveRenewing(false);
    }
  };

  // Push local DB to Google Drive (with Tombstone-Wins & CAS Conflict Resolution - Task 3.4)
  const pushLocalDbToDrive = async (updatedCats: DocumentCategory[], updatedDocs: DocumentRecord[]) => {
    const currentConfig = getGoogleDriveConfig();
    if (!currentConfig.accessToken || isDriveTokenExpired(currentConfig)) return;

    try {
      const localTombstones = getTombstones();
      const deletedIds = new Set(localTombstones.map((t) => t.id));
      const cleanDocs = updatedDocs.filter((d) => !deletedIds.has(d.id));

      await saveDatabaseWithConflictResolution(currentConfig.accessToken, currentConfig.folderId, (current) => {
        if (!current) {
          return {
            version: 1,
            lastUpdated: new Date().toISOString(),
            updatedBy: currentConfig.userEmail,
            categories: updatedCats,
            documents: cleanDocs,
            deletedRecords: localTombstones.map((t) => ({ id: t.id, deletedAt: t.deletedAt })),
          };
        }

        const merged = mergeDocumentsAndTombstones(
          current.documents || [],
          cleanDocs,
          current.deletedRecords || [],
          localTombstones.map((t) => ({ id: t.id, deletedAt: t.deletedAt }))
        );

        return {
          ...current,
          lastUpdated: new Date().toISOString(),
          updatedBy: currentConfig.userEmail,
          categories: updatedCats,
          documents: merged.documents,
          deletedRecords: merged.deletedRecords,
        };
      });
    } catch (err: any) {
      const errMsg = err.message || "";
      if (errMsg.includes("invalid authentication") || errMsg.includes("401") || errMsg.includes("Invalid Credentials")) {
        const updatedConfig = { ...currentConfig, tokenExpiresAt: Date.now() - 1000 };
        saveGoogleDriveConfig(updatedConfig);
      } else {
        console.warn("Lỗi cập nhật database lên Google Drive:", err);
      }
    }
  };

  // Initialize data on mount
  useEffect(() => {
    async function initData() {
      try {
        await seedInitialDocumentsIfEmpty();
        const loadedDocs = await getAllDocuments();
        // Tự động cân chỉnh bộ đếm theo số văn bản thực tế lớn nhất đang có trong sổ
        const loadedCats = reconcileCategoryCounts(loadedDocs);
        setCategories(loadedCats);
        setDocuments(loadedDocs);

        // Auto-sync with Google Drive if already connected
        let currentConfig = getGoogleDriveConfig();
        if (currentConfig.userEmail && isDriveTokenExpired(currentConfig)) {
          try {
            currentConfig = await renewGoogleDriveSession({ prompt: "" });
            setDriveConfig(currentConfig);
          } catch (silentErr) {
            console.debug("Silent renew on mount:", silentErr);
          }
        }

        if (currentConfig.accessToken && !isDriveTokenExpired(currentConfig)) {
          await syncWithGoogleDrive(false);
        }
      } catch (e) {
        console.error("Failed to initialize database", e);
      } finally {
        setIsLoading(false);
      }
    }
    initData();

    // 1. Khởi tạo lắng nghe WebSocket Realtime hai chiều từ các thiết bị khác
    const cleanupWs = initRealtime({
      onDocumentChanged: (event) => {
        // Tự động kéo dữ liệu mới nhất về trong im lặng
        syncWithGoogleDrive(false);
        if (event.changeType === "create" && event.docNumber) {
          showToast(`⚡ Thiết bị khác vừa cấp số mới: ${event.docNumber}!`, "info");
        } else if (event.changeType === "delete") {
          showToast("⚡ Thiết bị khác vừa cập nhật/xóa văn bản!", "info");
        } else if (event.changeType === "config") {
          showToast("⚡ Thiết bị khác vừa cập nhật cấu hình phân loại!", "info");
        }
      },
      getFolderId: () => getGoogleDriveConfig().folderId || "",
    });

    // 2. Lắng nghe sự kiện bật sáng màn hình điện thoại / chuyển tab (Tab-Focus Catch-up Sync)
    const cleanupFocus = setupVisibilityAndFocusSync(() => {
      const cfg = getGoogleDriveConfig();
      if (cfg.accessToken && !isDriveTokenExpired(cfg)) {
        syncWithGoogleDrive(false);
      }
    });

    return () => {
      cleanupWs();
      cleanupFocus();
    };
  }, []);

  // Category changes handler
  const handleSaveCategories = async (updated: DocumentCategory[]) => {
    setCategories(updated);
    saveCategories(updated);
    const curDocs = await getAllDocuments();
    await pushLocalDbToDrive(updated, curDocs);

    // Bắn tín hiệu Realtime cho các thiết bị khác
    const currentDriveConfig = getGoogleDriveConfig();
    broadcastDocumentChange({
      changeType: "config",
      folderId: currentDriveConfig.folderId,
    });
  };

  // New Document Created handler (Includes BYOS Google Drive upload & Option B: Auto Compile Images to PDF)
  const handleDocumentCreated = async (newDoc: DocumentRecord) => {
    let docToSave = { ...newDoc };

    // Phương án B: Tự động ghép toàn bộ các trang ảnh (JPG/PNG/WEBP/Scan) thành 1 tệp PDF duy nhất
    const hasRawImages = docToSave.images?.some(
      (img) =>
        !img.mimeType?.includes("pdf") &&
        !img.name?.toLowerCase().endsWith(".pdf") &&
        !img.dataUrl?.startsWith("data:application/pdf")
    );

    if (docToSave.images && docToSave.images.length > 0 && hasRawImages) {
      try {
        const rawCount = docToSave.images.length;
        const safeTitle = docToSave.title.replace(/[\/\\:?*"<>|]/g, "_").slice(0, 40).trim();
        const pdfFileName = `${docToSave.docNumber.replace(/[\/\\:]/g, "-")}_${docToSave.categoryCode}_${safeTitle}.pdf`;

        const compiled = await compileImagesToPdf(docToSave.images);

        docToSave.images = [
          {
            id: `pdf-${Date.now()}`,
            name: pdfFileName,
            mimeType: "application/pdf",
            dataUrl: compiled.dataUrl,
            size: compiled.size,
            capturedAt: new Date().toISOString(),
            pageNumber: 1,
          },
        ];

        docToSave.history.push({
          id: `h-pdf-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: "SỐ HÓA PDF TỔNG HỢP",
          user: "Hệ thống Cấp số",
          details: `Đã tự động ghép ${rawCount} trang ảnh scan thành 1 tệp PDF duy nhất [${pdfFileName}]`,
        });
      } catch (compileErr) {
        console.warn("Không thể ghép ảnh thành PDF, giữ nguyên ảnh gốc:", compileErr);
      }
    }

    // If Google Drive is configured and user enabled auto-upload
    const currentDriveConfig = getGoogleDriveConfig();
    if (
      currentDriveConfig.accessToken &&
      currentDriveConfig.autoUpload &&
      docToSave.images &&
      docToSave.images.length > 0
    ) {
      let activeDriveConfig = currentDriveConfig;
      if (isDriveTokenExpired(activeDriveConfig) && activeDriveConfig.userEmail) {
        try {
          activeDriveConfig = await renewGoogleDriveSession({ prompt: "" });
          setDriveConfig(activeDriveConfig);
        } catch (renewErr) {
          console.debug("Silent renew during upload failed:", renewErr);
        }
      }

      if (isDriveTokenExpired(activeDriveConfig)) {
        showToast("Phiên đăng nhập Google Drive đã hết hạn. Vui lòng đăng nhập lại để tải tệp lên Drive.", "error");
      } else {
        showToast("Đang đồng bộ tệp văn bản lên Google Drive...", "info");
        try {
          const safeTitle = docToSave.title.replace(/[\/\\:?*"<>|]/g, "_").slice(0, 40).trim();
          let primaryResult: any = null;

          // Tải tệp văn bản lên Google Drive (1 file PDF tổng hợp hoặc các tệp đính kèm)
          for (let i = 0; i < docToSave.images.length; i++) {
            const curImg = docToSave.images[i];
            let ext = "pdf";
            if (curImg.name && curImg.name.includes(".")) {
              ext = curImg.name.split(".").pop()?.toLowerCase() || "pdf";
            } else if (curImg.mimeType) {
              if (curImg.mimeType.includes("pdf")) ext = "pdf";
              else if (curImg.mimeType.includes("png")) ext = "png";
              else if (curImg.mimeType.includes("jpeg") || curImg.mimeType.includes("jpg")) ext = "jpg";
            }

            const pageSuffix = docToSave.images.length > 1 ? `_trang${i + 1}` : "";
            const cleanDocName = curImg.name || `${docToSave.docNumber.replace(/[\/\\:]/g, "-")}_${docToSave.categoryCode}_${safeTitle}${pageSuffix}.${ext}`;

            const driveResult = await uploadFileToGoogleDrive(
              activeDriveConfig.accessToken,
              activeDriveConfig.folderId,
              cleanDocName,
              curImg.dataUrl,
              `Văn bản số ${docToSave.docNumber}${docToSave.images.length > 1 ? ` (Tệp ${i + 1}/${docToSave.images.length})` : ""}: ${docToSave.title}`
            );

            // Gán Drive metadata trực tiếp vào từng image item
            curImg.driveFileId = driveResult.id;
            curImg.driveWebViewLink = driveResult.webViewLink;
            curImg.driveThumbnailLink = driveResult.thumbnailLink;

            if (i === 0) {
              primaryResult = driveResult;
              docToSave.driveFileId = driveResult.id;
              docToSave.driveWebViewLink = driveResult.webViewLink;
              docToSave.driveThumbnailLink = driveResult.thumbnailLink;
            }
          }

          docToSave.history.push({
            id: `h-drive-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: "ĐỒNG BỘ GOOGLE DRIVE",
            user: currentDriveConfig.userEmail || "Google Drive Sync",
            details: `Đã lưu tệp văn bản gốc lên thư mục Google Drive: [${primaryResult?.name || docToSave.docNumber}]`,
          });

          showToast(
            `Đã lưu tệp văn bản gốc [${primaryResult?.name || docToSave.docNumber}] lên Google Drive thành công!`,
            "success"
          );
        } catch (driveErr: any) {
          console.warn("Không thể tải tệp lên Google Drive:", driveErr);
          const errMsg = driveErr.message || "";
          if (errMsg.includes("invalid authentication") || errMsg.includes("401") || errMsg.includes("Invalid Credentials")) {
            showToast("Phiên đăng nhập Google Drive đã hết hạn. Vui lòng đăng nhập lại.", "error");
          } else {
            showToast(`Chưa thể tải lên Google Drive: ${errMsg || "Lỗi kết nối"}`, "error");
          }
        }
      }
    } else if (!currentDriveConfig.accessToken) {
      showToast("Đã lưu cục bộ. Hãy kết nối Google Drive nếu muốn dùng chung dữ liệu nhiều máy.", "info");
    }

    await saveDocument(docToSave);
    const updatedDocs = await getAllDocuments();
    // Tự động cân chỉnh bộ đếm categories theo số lớn nhất thực tế trong sổ
    const updatedCats = reconcileCategoryCounts(updatedDocs);
    setCategories(updatedCats);
    setDocuments(updatedDocs);

    // Đồng bộ ngay số đếm và sổ văn bản mới lên file database Google Drive
    await pushLocalDbToDrive(updatedCats, updatedDocs);

    // Bắn tín hiệu Realtime tức thời tới các thiết bị khác (Mobile/PC)
    broadcastDocumentChange({
      changeType: "create",
      docNumber: docToSave.docNumber,
      folderId: currentDriveConfig.folderId,
    });
  };

  // Document Deleted handler (Tombstone State Machine & Safe Async Contract - Task 3.3)
  const handleDeleteDocument = async (id: string): Promise<{ success: boolean; driveSynced: boolean; message?: string }> => {
    try {
      const docToDelete = await getDocumentById(id);
      const currentDriveConfig = getGoogleDriveConfig();

      // 1. Tạo Tombstone ngay lập tức với snapshot đầy đủ (registrySynced: false, assetCleaned: false)
      addTombstone({
        id,
        docNumber: docToDelete?.docNumber,
        driveFileId: docToDelete?.driveFileId,
        deletedAt: Date.now(),
        registrySynced: false,
        assetCleaned: !docToDelete?.driveFileId,
      });

      // 2. Xóa khỏi cơ sở dữ liệu nội bộ IndexedDB & cân chỉnh categories
      await deleteDocument(id);
      const updatedDocs = await getAllDocuments();
      const updatedCats = reconcileCategoryCounts(updatedDocs);
      setCategories(updatedCats);
      setDocuments(updatedDocs);

      let isDriveSynced = false;

      // 3. Cập nhật ngay lập tức lên Google Drive Registry qua saveDatabaseWithConflictResolution
      if (currentDriveConfig.accessToken && !isDriveTokenExpired(currentDriveConfig)) {
        try {
          await saveDatabaseWithConflictResolution(currentDriveConfig.accessToken, currentDriveConfig.folderId, (current) => {
            const tombstoneItem = { id, deletedAt: Date.now() };
            if (!current) {
              return {
                version: 1,
                lastUpdated: new Date().toISOString(),
                categories: updatedCats,
                documents: updatedDocs.filter((d) => d.id !== id),
                deletedRecords: [tombstoneItem],
              };
            }

            const merged = mergeDocumentsAndTombstones(
              current.documents || [],
              updatedDocs,
              current.deletedRecords || [],
              [tombstoneItem]
            );

            return {
              ...current,
              categories: updatedCats,
              documents: merged.documents,
              deletedRecords: merged.deletedRecords,
            };
          });

          isDriveSynced = true;
          updateTombstone(id, { registrySynced: true });
        } catch (regErr) {
          console.warn("Chưa thể cập nhật dấu xóa lên Google Drive registry lúc này:", regErr);
        }
      }

      // 4. Xóa file asset trên Google Drive (nếu có)
      if (docToDelete?.driveFileId && currentDriveConfig.accessToken && !isDriveTokenExpired(currentDriveConfig)) {
        try {
          const isCleaned = await deleteFileFromGoogleDrive(
            currentDriveConfig.accessToken,
            docToDelete.driveFileId,
            currentDriveConfig.folderId
          );
          if (isCleaned) {
            updateTombstone(id, { assetCleaned: true });
          }
        } catch (delErr: any) {
          console.warn("Tệp trên Google Drive không còn tồn tại hoặc lỗi mạng:", delErr);
          if (delErr?.status === 404) {
            updateTombstone(id, { assetCleaned: true });
          }
        }
      }

      // 5. Bắn tín hiệu Realtime tức thời
      broadcastDocumentChange({
        changeType: "delete",
        folderId: currentDriveConfig.folderId,
      });

      if (isDriveSynced) {
        showToast(
          `Đã xóa văn bản ${docToDelete?.docNumber || id} khỏi sổ đăng ký và đồng bộ Google Drive thành công.`,
          "success"
        );
      } else {
        showToast(
          `Đã xóa văn bản ${docToDelete?.docNumber || id} trên máy. Dữ liệu Google Drive sẽ được cập nhật khi có mạng.`,
          "info"
        );
      }

      return { success: true, driveSynced: isDriveSynced };
    } catch (e: any) {
      console.error("Lỗi khi xóa văn bản:", e);
      showToast(`Không thể xóa văn bản: ${e.message}`, "error");
      return { success: false, driveSynced: false, message: e.message };
    }
  };

  // Active modal detection for bottom nav highlight on mobile
  const activeModal: "intake" | "config" | "drive" | "detail" | "print" | null =
    isIntakeOpen
      ? "intake"
      : isConfigOpen
      ? "config"
      : isGoogleDriveOpen
      ? "drive"
      : selectedDocForDetail
      ? "detail"
      : selectedDocForPrint
      ? "print"
      : null;

  const closeAllModals = () => {
    setIsIntakeOpen(false);
    setIsConfigOpen(false);
    setIsGoogleDriveOpen(false);
    setSelectedDocForDetail(null);
    setSelectedDocForPrint(null);
  };

  const handleMobileTabChange = (tab: "archive" | "stats") => {
    closeAllModals();
    setCurrentTab(tab);
  };

  const handleMobileOpenIntake = () => {
    setIsConfigOpen(false);
    setIsGoogleDriveOpen(false);
    setSelectedDocForDetail(null);
    setSelectedDocForPrint(null);
    setIsIntakeOpen(true);
  };

  const handleMobileOpenConfig = () => {
    setIsIntakeOpen(false);
    setIsGoogleDriveOpen(false);
    setSelectedDocForDetail(null);
    setSelectedDocForPrint(null);
    setIsConfigOpen(true);
  };

  const handleMobileOpenGoogleDrive = () => {
    setIsIntakeOpen(false);
    setIsConfigOpen(false);
    setSelectedDocForDetail(null);
    setSelectedDocForPrint(null);
    setIsGoogleDriveOpen(true);
  };

  // 1. Loading splash screen khi đang khởi tạo dữ liệu
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white font-sans">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-xl shadow-blue-500/30 animate-pulse mb-4">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <p className="text-sm font-semibold text-slate-300">Đang tải dữ liệu Sổ Cấp Số Văn Bản...</p>
      </div>
    );
  }

  // 2. Màn hình Đăng nhập (Authentication Gate)
  const isTokenExpired = isDriveTokenExpired(driveConfig);
  const requiresLogin = (!driveConfig.userEmail || isTokenExpired) && !isOfflineMode;

  if (requiresLogin) {
    return (
      <LoginScreen
        config={driveConfig}
        onLogin={handleLoginGoogle}
        onContinueOffline={handleContinueOffline}
        isLoading={isLoggingIn}
        errorMessage={loginError}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenIntake={() => setIsIntakeOpen(true)}
        onOpenConfig={() => setIsConfigOpen(true)}
        onOpenGoogleDrive={() => setIsGoogleDriveOpen(true)}
        onSyncDrive={() => syncWithGoogleDrive(true)}
        onRenewDrive={handleRenewDriveSession}
        onLogout={handleLogoutGoogle}
        onLogin={handleLoginGoogle}
        isDriveConnected={!!driveConfig.userEmail}
        isDriveTokenExpired={isTokenExpired}
        isRenewingDrive={isDriveRenewing}
        isSyncing={isDriveSyncing}
        userName={driveConfig.userName}
        userEmail={driveConfig.userEmail}
        userAvatar={driveConfig.userAvatar}
        folderName={driveConfig.folderName}
        totalDocsCount={documents.length}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-20 md:pb-2">
        {/* Banner thông báo nhắc nhở nếu chưa kết nối hoặc chưa cấu hình folder Google Drive */}
        {!driveConfig.userEmail ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
            <div className="p-4 sm:p-4.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-400/30 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 transition-all hover:border-amber-400/50">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 shrink-0">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-800">
                      Đang ở chế độ xem Ngoại tuyến (Offline)
                    </span>
                    <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-700 rounded-md border border-blue-200">
                      Ngoại tuyến
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Đăng nhập Google Workspace để tự động đồng bộ sổ văn bản, lưu trữ hồ sơ tập trung và dùng chung nhiều thiết bị.
                  </p>
                </div>
              </div>

              <button
                onClick={handleLoginGoogle}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-sm transition-all cursor-pointer shrink-0 hover:shadow-md hover:scale-[1.02]"
              >
                <span>Đăng nhập Google Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : !driveConfig.folderId ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
            <div className="p-4 sm:p-4.5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent border border-blue-400/30 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 transition-all hover:border-blue-400/50">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-600 shrink-0">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-800">
                      Chưa chọn thư mục lưu trữ trên Google Drive
                    </span>
                    <span className="text-xs text-slate-500 font-mono">({driveConfig.userEmail})</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Dán đường dẫn (URL) hoặc Folder ID thư mục Google Drive của bạn để toàn bộ tài liệu văn bản được tổ chức ngăn nắp vào đúng nơi.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsGoogleDriveOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-sm transition-all cursor-pointer shrink-0 hover:shadow-md hover:scale-[1.02]"
              >
                <span>Chọn thư mục lưu trữ</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-slate-500">
              Đang tải cơ sở dữ liệu văn bản và cấu hình số hóa...
            </p>
          </div>
        ) : currentTab === "archive" ? (
          <DocumentArchiveView
            documents={documents}
            categories={categories}
            onViewDetail={(doc) => setSelectedDocForDetail(doc)}
            onPrintDocument={(doc) => setSelectedDocForPrint(doc)}
            onDeleteDocument={handleDeleteDocument}
            onOpenIntake={() => setIsIntakeOpen(true)}
          />
        ) : (
          <DashboardStats
            documents={documents}
            categories={categories}
            onViewDoc={(doc) => setSelectedDocForDetail(doc)}
            onOpenIntake={() => setIsIntakeOpen(true)}
            onOpenConfig={() => setIsConfigOpen(true)}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation (Luôn hiển thị cố định ở chân trang trên Mobile cho mọi màn hình) */}
      <MobileBottomNav
        currentTab={currentTab}
        activeModal={activeModal}
        onTabChange={handleMobileTabChange}
        onOpenIntake={handleMobileOpenIntake}
        onOpenConfig={handleMobileOpenConfig}
        onOpenGoogleDrive={handleMobileOpenGoogleDrive}
        onSyncDrive={() => syncWithGoogleDrive(true)}
        onRenewDrive={handleRenewDriveSession}
        isDriveConnected={!!driveConfig.userEmail}
        isDriveTokenExpired={isDriveTokenExpired(driveConfig)}
        isSyncing={isDriveSyncing}
        totalDocsCount={documents.length}
      />

      {/* Modals */}
      {/* 0. Personal Google Drive BYOS Config Modal */}
      <GoogleDriveConfigModal
        isOpen={isGoogleDriveOpen}
        onClose={() => setIsGoogleDriveOpen(false)}
        onConfigUpdated={(cfg) => {
          setDriveConfig(cfg);
          updateRealtimeFolder(cfg.folderId || "");
          if (cfg.accessToken) {
            syncWithGoogleDrive(true);
          }
        }}
      />

      {/* 1. Category Prefix/Suffix & Numbering Master Config Modal */}
      <CategoryConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        categories={categories}
        onSaveCategories={handleSaveCategories}
      />

      {/* 2. Document Intake & AI OCR Modal (Upload / Camera / Email) */}
      <IntakeModal
        isOpen={isIntakeOpen}
        onClose={() => setIsIntakeOpen(false)}
        categories={categories}
        onDocumentCreated={handleDocumentCreated}
        onOpenPrintModal={(doc) => {
          setIsIntakeOpen(false);
          setSelectedDocForPrint(doc);
        }}
      />

      {/* 3. Document Detail & High-Res Viewer Modal */}
      <DocumentDetailModal
        document={selectedDocForDetail}
        isOpen={!!selectedDocForDetail}
        onClose={() => setSelectedDocForDetail(null)}
        onPrint={(doc) => {
          setSelectedDocForDetail(null);
          setSelectedDocForPrint(doc);
        }}
        onDelete={handleDeleteDocument}
      />

      {/* 4. Official Printable Document Modal (Slip / Stamped Scanned Document) */}
      <PrintDocumentModal
        document={selectedDocForPrint}
        isOpen={!!selectedDocForPrint}
        onClose={() => setSelectedDocForPrint(null)}
      />

      {/* Floating Toast Notification */}
      {toastNotification && (
        <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-[80] animate-bounce-in max-w-md">
          <div
            className={`px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-3 text-xs font-medium backdrop-blur-md ${
              toastNotification.type === "success"
                ? "bg-emerald-950/90 text-emerald-200 border-emerald-500/50 shadow-emerald-900/30"
                : toastNotification.type === "error"
                ? "bg-red-950/90 text-red-200 border-red-500/50 shadow-red-900/30"
                : "bg-slate-900/95 text-blue-200 border-blue-500/50 shadow-blue-900/30"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full shrink-0 ${
                toastNotification.type === "success"
                  ? "bg-emerald-400 animate-ping"
                  : toastNotification.type === "error"
                  ? "bg-red-400 animate-ping"
                  : "bg-blue-400 animate-pulse"
              }`}
            />
            <span className="leading-snug">{toastNotification.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
