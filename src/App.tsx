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
import { HardDrive, AlertCircle, ArrowRight, FolderPlus } from "lucide-react";
import { DocumentCategory, DocumentRecord } from "./types";
import {
  getCategories,
  saveCategories,
  getAllDocuments,
  getDocumentById,
  saveDocument,
  deleteDocument,
  seedInitialDocumentsIfEmpty,
  incrementCategoryCount,
} from "./services/storage";
import {
  getGoogleDriveConfig,
  GoogleDriveConfig,
  uploadFileToGoogleDrive,
  deleteFileFromGoogleDrive,
  findDriveFileByName,
  readDatabaseFromGoogleDrive,
  saveDatabaseToGoogleDrive,
  DRIVE_DB_FILENAME,
  DriveDatabasePayload,
  isDriveTokenExpired,
} from "./services/googleDriveService";

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

    // Nếu token đã hết hạn, không gửi request nền để tránh báo lỗi đỏ 401 trên console
    if (isDriveTokenExpired(currentConfig)) {
      if (isManual) {
        showToast("Phiên đăng nhập Google Drive đã hết hạn. Hãy bấm vào icon Drive để gia hạn phiên.", "error");
      }
      return;
    }

    setIsDriveSyncing(true);
    try {
      // 1. Check if database file exists on Google Drive in current folder
      let remoteDbFile = await findDriveFileByName(
        currentConfig.accessToken,
        DRIVE_DB_FILENAME,
        currentConfig.folderId
      );

      // Nếu trong thư mục hiện tại không có file database, tìm thử trên toàn bộ Drive của user
      // (Xử lý trường hợp điện thoại kết nối vào folder mới tạo nhầm thay vì folder gốc của PC)
      if (!remoteDbFile) {
        const globalDbFile = await findDriveFileByName(
          currentConfig.accessToken,
          DRIVE_DB_FILENAME
        );
        if (globalDbFile && globalDbFile.parents && globalDbFile.parents.length > 0) {
          remoteDbFile = globalDbFile;
          const recoveredFolderId = globalDbFile.parents[0];
          // Tự động khôi phục cấu hình về đúng folder chứa database
          currentConfig.folderId = recoveredFolderId;
          saveGoogleDriveConfig(currentConfig);
        }
      }

      if (remoteDbFile) {
        // Read remote database
        const remoteData = await readDatabaseFromGoogleDrive(
          currentConfig.accessToken,
          remoteDbFile.id
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
                // Lấy số đếm lớn nhất giữa 2 thiết bị để tránh cấp trùng số
                currentCount: Math.max(rCat.currentCount || 0, lCat.currentCount || 0),
              };
            });

            // Bổ sung các danh mục mới chỉ có ở local (nếu có)
            for (const lCat of localCats) {
              if (!mergedCats.some((c: DocumentCategory) => c.id === lCat.id || c.code.toUpperCase() === lCat.code.toUpperCase())) {
                mergedCats.push(lCat);
              }
            }

            saveCategories(mergedCats);
            setCategories(mergedCats);
          }

          // Merge / Save documents into local IndexedDB
          if (Array.isArray(remoteData.documents)) {
            for (const rDoc of remoteData.documents) {
              const existingLocalDoc = await getDocumentById(rDoc.id);
              if (existingLocalDoc && existingLocalDoc.images && existingLocalDoc.images.length > 0) {
                // Giữ lại dataUrl gốc ở local IndexedDB nếu remote đã được bóc tách base64
                const mergedImages = rDoc.images?.map((remImg: any, idx: number) => {
                  const locImg = existingLocalDoc.images[idx];
                  return {
                    ...remImg,
                    dataUrl: remImg.dataUrl || locImg?.dataUrl || "",
                  };
                }) || existingLocalDoc.images;

                await saveDocument({
                  ...rDoc,
                  images: mergedImages,
                });
              } else {
                await saveDocument(rDoc);
              }
            }
            const refreshedDocs = await getAllDocuments();
            setDocuments(refreshedDocs);
          }

          if (isManual) {
            showToast(
              `Đã tải và đồng bộ thành công dữ liệu từ Google Drive (${remoteData.documents.length} văn bản).`,
              "success"
            );
          }
        }
      } else {
        // If file doesn't exist on Google Drive yet, push current local state to Google Drive as initial DB
        const localCats = getCategories();
        const localDocs = await getAllDocuments();
        const payload: DriveDatabasePayload = {
          version: 1,
          lastUpdated: new Date().toISOString(),
          updatedBy: currentConfig.userEmail,
          categories: localCats,
          documents: localDocs,
        };

        await saveDatabaseToGoogleDrive(currentConfig.accessToken, currentConfig.folderId, payload);
        if (isManual) {
          showToast("Đã khởi tạo kho dữ liệu dùng chung trên Google Drive thành công!", "success");
        }
      }
    } catch (syncErr: any) {
      const errMsg = syncErr.message || "";
      if (errMsg.includes("invalid authentication") || errMsg.includes("401") || errMsg.includes("Invalid Credentials")) {
        // Token đã hết hạn trên server Google
        const updatedConfig = { ...currentConfig, tokenExpiresAt: Date.now() - 1000 };
        saveGoogleDriveConfig(updatedConfig);
        if (isManual) {
          showToast("Phiên đăng nhập Google Drive đã hết hạn. Hãy bấm vào icon Drive để gia hạn phiên.", "error");
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

  // Push local DB to Google Drive
  const pushLocalDbToDrive = async (updatedCats: DocumentCategory[], updatedDocs: DocumentRecord[]) => {
    const currentConfig = getGoogleDriveConfig();
    if (!currentConfig.accessToken || isDriveTokenExpired(currentConfig)) return;

    try {
      const payload: DriveDatabasePayload = {
        version: 1,
        lastUpdated: new Date().toISOString(),
        updatedBy: currentConfig.userEmail,
        categories: updatedCats,
        documents: updatedDocs,
      };
      await saveDatabaseToGoogleDrive(currentConfig.accessToken, currentConfig.folderId, payload);
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
        const loadedCats = getCategories();
        const loadedDocs = await getAllDocuments();
        setCategories(loadedCats);
        setDocuments(loadedDocs);

        // Auto-sync with Google Drive if already connected
        const currentConfig = getGoogleDriveConfig();
        if (currentConfig.accessToken) {
          await syncWithGoogleDrive(false);
        }
      } catch (e) {
        console.error("Failed to initialize database", e);
      } finally {
        setIsLoading(false);
      }
    }
    initData();
  }, []);

  // Category changes handler
  const handleSaveCategories = async (updated: DocumentCategory[]) => {
    setCategories(updated);
    saveCategories(updated);
    const curDocs = await getAllDocuments();
    pushLocalDbToDrive(updated, curDocs);
  };

  // New Document Created handler (Includes BYOS Google Drive upload)
  const handleDocumentCreated = async (newDoc: DocumentRecord) => {
    let docToSave = { ...newDoc };

    // If Google Drive is configured and user enabled auto-upload
    const currentDriveConfig = getGoogleDriveConfig();
    if (
      currentDriveConfig.accessToken &&
      currentDriveConfig.autoUpload &&
      docToSave.images &&
      docToSave.images.length > 0
    ) {
      if (isDriveTokenExpired(currentDriveConfig)) {
        showToast("Phiên đăng nhập Google Drive đã hết hạn. Vui lòng bấm vào icon Drive ở góc trên để gia hạn phiên.", "error");
      } else {
        showToast("Đang đồng bộ bản scan lên Google Drive...", "info");
        try {
          const primaryImg = docToSave.images[0];
          // Lấy đúng phần mở rộng gốc của tệp (ví dụ .pdf, .docx, .png, .jpg...)
          let ext = "pdf";
          if (primaryImg.name && primaryImg.name.includes(".")) {
            ext = primaryImg.name.split(".").pop()?.toLowerCase() || "pdf";
          } else if (primaryImg.mimeType) {
            if (primaryImg.mimeType.includes("pdf")) ext = "pdf";
            else if (primaryImg.mimeType.includes("png")) ext = "png";
            else if (primaryImg.mimeType.includes("jpeg") || primaryImg.mimeType.includes("jpg")) ext = "jpg";
          }

          const safeTitle = docToSave.title.replace(/[\/\\:?*"<>|]/g, "_").slice(0, 40).trim();
          const cleanDocName = `${docToSave.docNumber.replace(/[\/\\:]/g, "-")}_${docToSave.categoryCode}_${safeTitle}.${ext}`;
          const driveResult = await uploadFileToGoogleDrive(
            currentDriveConfig.accessToken,
            currentDriveConfig.folderId,
            cleanDocName,
            primaryImg.dataUrl,
            `Văn bản số ${docToSave.docNumber}: ${docToSave.title}`
          );

          docToSave.driveFileId = driveResult.id;
          docToSave.driveWebViewLink = driveResult.webViewLink;
          docToSave.driveThumbnailLink = driveResult.thumbnailLink;
          docToSave.history.push({
            id: `h-drive-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: "ĐỒNG BỘ GOOGLE DRIVE",
            user: currentDriveConfig.userEmail || "Google Drive Sync",
            details: `Đã lưu bản scan lên thư mục Google Drive: [${driveResult.name}]`,
          });

          showToast(`Đã lưu bản scan lên Google Drive thành công! (${driveResult.name})`, "success");
        } catch (driveErr: any) {
          console.warn("Không thể tải tệp lên Google Drive:", driveErr);
          const errMsg = driveErr.message || "";
          if (errMsg.includes("invalid authentication") || errMsg.includes("401") || errMsg.includes("Invalid Credentials")) {
            showToast("Phiên đăng nhập Google Drive đã hết hạn. Vui lòng bấm vào icon Drive ở góc trên để gia hạn phiên.", "error");
          } else {
            showToast(`Chưa thể tải lên Google Drive: ${errMsg || "Lỗi kết nối"}`, "error");
          }
        }
      }
    } else if (!currentDriveConfig.accessToken) {
      showToast("Đã lưu cục bộ. Hãy kết nối Google Drive nếu muốn dùng chung dữ liệu nhiều máy.", "info");
    }

    await saveDocument(docToSave);
    incrementCategoryCount(docToSave.categoryId);
    const updatedCats = getCategories();
    const updatedDocs = await getAllDocuments();
    setCategories(updatedCats);
    setDocuments(updatedDocs);

    // Đồng bộ ngay số đếm và sổ văn bản mới lên file database Google Drive
    await pushLocalDbToDrive(updatedCats, updatedDocs);
  };

  // Document Deleted handler (Sync delete from Google Drive + show Toast)
  const handleDeleteDocument = async (id: string) => {
    try {
      const docToDelete = await getDocumentById(id);
      const currentDriveConfig = getGoogleDriveConfig();

      if (docToDelete?.driveFileId && currentDriveConfig.accessToken) {
        showToast(`Đang xóa tệp ${docToDelete.docNumber} trên Google Drive...`, "info");
        await deleteFileFromGoogleDrive(currentDriveConfig.accessToken, docToDelete.driveFileId);
      }

      await deleteDocument(id);
      const updatedDocs = await getAllDocuments();
      setDocuments(updatedDocs);

      showToast(
        `Đã xóa văn bản ${docToDelete?.docNumber || id} khỏi sổ đăng ký và dọn dẹp Google Drive.`,
        "success"
      );
    } catch (e: any) {
      console.error("Lỗi khi xóa văn bản:", e);
      showToast(`Không thể xóa văn bản: ${e.message}`, "error");
    }
  };

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
        isDriveConnected={!!driveConfig.userEmail}
        isDriveTokenExpired={isDriveTokenExpired(driveConfig)}
        isSyncing={isDriveSyncing}
        totalDocsCount={documents.length}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-24 md:pb-12">
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
                      Chưa kết nối Google Drive lưu trữ chung
                    </span>
                    <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700 rounded-md border border-amber-200">
                      Khuyến nghị
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Hãy kết nối Google Drive và cấu hình thư mục lưu trữ để tự động đồng bộ sổ văn bản, lưu file scan và dùng chung dữ liệu trên nhiều thiết bị.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsGoogleDriveOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 rounded-xl shadow-sm transition-all cursor-pointer shrink-0 hover:shadow-md hover:scale-[1.02]"
              >
                <span>Cấu hình Google Drive ngay</span>
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

      {/* Mobile Bottom Navigation (Floating on Mobile) */}
      <MobileBottomNav
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenIntake={() => setIsIntakeOpen(true)}
        onOpenConfig={() => setIsConfigOpen(true)}
        onOpenGoogleDrive={() => setIsGoogleDriveOpen(true)}
        onSyncDrive={() => syncWithGoogleDrive(true)}
        isDriveConnected={!!driveConfig.accessToken}
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
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-in max-w-md">
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
