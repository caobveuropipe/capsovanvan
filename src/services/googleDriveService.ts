export interface GoogleDriveConfig {
  clientId: string;
  apiKey: string;
  userEmail?: string;
  userName?: string;
  userAvatar?: string;
  accessToken?: string;
  tokenExpiresAt?: number;
  folderId?: string;
  folderName?: string;
  folderPath?: string;
  autoUpload: boolean;
}

export interface GoogleDriveFileResult {
  id: string;
  name: string;
  webViewLink: string;
  thumbnailLink?: string;
}

export const DEFAULT_GOOGLE_CLIENT_ID =
  (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
  "37756221918-fp4k2sm04mc7ep9jkmbjnocjstjnnn43.apps.googleusercontent.com";

export const DEFAULT_DRIVE_CONFIG: GoogleDriveConfig = {
  clientId: DEFAULT_GOOGLE_CLIENT_ID,
  apiKey: "",
  autoUpload: true,
};

export function getGoogleDriveConfig(): GoogleDriveConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Đảm bảo luôn có clientId mặc định nếu trước đó chưa lưu hoặc đang rỗng
      return {
        ...DEFAULT_DRIVE_CONFIG,
        ...parsed,
        clientId: parsed.clientId || DEFAULT_GOOGLE_CLIENT_ID,
      };
    }
  } catch (e) {
    console.error("Failed to load Google Drive config from storage", e);
  }
  return DEFAULT_DRIVE_CONFIG;
}

export function saveGoogleDriveConfig(config: GoogleDriveConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error("Failed to save Google Drive config to storage", e);
  }
}

export function clearGoogleDriveConfig(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error("Failed to clear Google Drive config", e);
  }
}

// Convert Base64 or URL-encoded dataURL to Blob safely
export function dataURLtoBlob(dataurl: string): Blob {
  if (!dataurl) {
    return new Blob([""], { type: "text/plain" });
  }

  // Handle URL-encoded SVG (data:image/svg+xml;utf8,...)
  if (dataurl.startsWith("data:image/svg+xml;utf8,")) {
    const rawSvg = decodeURIComponent(dataurl.replace("data:image/svg+xml;utf8,", ""));
    return new Blob([rawSvg], { type: "image/svg+xml;charset=utf-8" });
  }

  if (dataurl.startsWith("data:image/svg+xml,")) {
    const rawSvg = decodeURIComponent(dataurl.replace("data:image/svg+xml,", ""));
    return new Blob([rawSvg], { type: "image/svg+xml;charset=utf-8" });
  }

  // Standard Base64 dataURL
  const parts = dataurl.split(",");
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const b64Data = parts[1] || "";

  try {
    const bstr = atob(b64Data);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (e) {
    console.warn("Base64 decode failed, falling back to raw blob", e);
    return new Blob([b64Data], { type: mime });
  }
}

// Upload file to Google Drive using multipart upload with automatic parent fallback
export async function uploadFileToGoogleDrive(
  accessToken: string,
  folderId: string | undefined,
  fileName: string,
  dataUrl: string,
  description?: string
): Promise<GoogleDriveFileResult> {
  const blob = dataURLtoBlob(dataUrl);

  const uploadOnce = async (targetParent?: string): Promise<Response> => {
    const metadata: any = {
      name: fileName,
      description: description || "Văn bản lưu trữ từ DocNum AI",
    };

    if (targetParent && targetParent !== "root") {
      metadata.parents = [targetParent];
    }

    const form = new FormData();
    form.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json" })
    );
    form.append("file", blob);

    return await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,thumbnailLink",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: form,
      }
    );
  };

  let response = await uploadOnce(folderId);

  // If failed with 404 or 403 (folder ID not found or not created by app), fallback to root or auto folder
  if (!response.ok && folderId && folderId !== "root") {
    console.warn(`Lỗi khi tải vào folder ${folderId} (${response.status}), đang thử lưu vào thư mục gốc Drive...`);
    response = await uploadOnce(undefined);
  }

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(
      errJson.error?.message || `Lỗi tải tệp lên Google Drive (${response.status})`
    );
  }

  const result = await response.json();
  return result as GoogleDriveFileResult;
}

// Create subfolder on Google Drive
export async function createDriveFolder(
  accessToken: string,
  folderName: string,
  parentFolderId?: string
): Promise<{ id: string; name: string }> {
  const metadata: any = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
  };

  if (parentFolderId && parentFolderId !== "root") {
    metadata.parents = [parentFolderId];
  }

  const response = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(metadata),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || "Không thể tạo thư mục trên Google Drive");
  }

  return await response.json();
}

// Delete file from Google Drive
export async function deleteFileFromGoogleDrive(
  accessToken: string,
  fileId: string
): Promise<boolean> {
  try {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.ok || response.status === 204 || response.status === 404;
  } catch (err) {
    console.warn("Lỗi khi xóa file trên Google Drive:", err);
    return false;
  }
}

// ----------------------------------------------------
// GOOGLE DRIVE CENTRAL DATABASE SYNC (Multi-Browser Sync)
// ----------------------------------------------------

export const DRIVE_DB_FILENAME = "vcc_documents_database.json";

export interface DriveDatabasePayload {
  version: number;
  lastUpdated: string;
  updatedBy?: string;
  categories: any[];
  documents: any[];
}

// Find a file by name inside a folder (or root) and cleanup duplicates if any
export async function findDriveFileByName(
  accessToken: string,
  fileName: string,
  folderId?: string
): Promise<{ id: string; name: string } | null> {
  try {
    let query = `name = '${fileName}' and trashed = false`;
    if (folderId && folderId !== "root") {
      query += ` and '${folderId}' in parents`;
    }

    // List all matches (sorted newest first)
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc&pageSize=10`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (data.files && data.files.length > 0) {
      const primaryFile = data.files[0];

      // If there are duplicate files, delete older duplicates in the background to clean up
      if (data.files.length > 1) {
        for (let i = 1; i < data.files.length; i++) {
          deleteFileFromGoogleDrive(accessToken, data.files[i].id).catch(() => {});
        }
      }

      return primaryFile;
    }
    return null;
  } catch (err) {
    console.warn("Error finding file on Google Drive:", err);
    return null;
  }
}

// Read JSON database from Google Drive
export async function readDatabaseFromGoogleDrive(
  accessToken: string,
  fileId: string
): Promise<DriveDatabasePayload | null> {
  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) return null;
    return (await res.json()) as DriveDatabasePayload;
  } catch (err) {
    console.warn("Error downloading database from Google Drive:", err);
    return null;
  }
}

// Save or Update JSON database to Google Drive (Deduplicated)
export async function saveDatabaseToGoogleDrive(
  accessToken: string,
  folderId: string | undefined,
  payload: DriveDatabasePayload
): Promise<string> {
  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });

  // 1. Check if database file already exists
  const existingFile = await findDriveFileByName(accessToken, DRIVE_DB_FILENAME, folderId);

  if (existingFile) {
    // Update existing file content directly via PATCH
    const res = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: blob,
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || "Không thể cập nhật database trên Google Drive");
    }

    return existingFile.id;
  } else {
    // Create new database file
    const metadata: any = {
      name: DRIVE_DB_FILENAME,
      description: "Hồ sơ đăng ký số và danh mục văn bản dùng chung VCCORP",
      mimeType: "application/json",
    };

    if (folderId && folderId !== "root") {
      metadata.parents = [folderId];
    }

    const form = new FormData();
    form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    form.append("file", blob);

    const res = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: form,
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || "Không thể tạo file database trên Google Drive");
    }

    const result = await res.json();
    return result.id;
  }
}

