import { FormMetadataOptions, mergeFormMetadataOptions } from "./storage";

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

export interface DriveFolderItem {
  id: string;
  name: string;
  modifiedTime?: string;
  shared?: boolean;
  isDatabaseHost?: boolean;
}

const STORAGE_KEY = "docnum_google_drive_config_v1";

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

// Kiểm tra token đã hết hạn hay chưa (hoặc sắp hết hạn trong vòng 1 phút)
export function isDriveTokenExpired(config: GoogleDriveConfig): boolean {
  if (!config.accessToken) return true;
  if (!config.tokenExpiresAt) return false;
  // Buffer 60 giây trước khi thực sự hết hạn
  return Date.now() >= config.tokenExpiresAt - 60000;
}

// Declare Google Identity Services global
declare global {
  interface Window {
    google?: any;
  }
}

// Tải script Google Identity Services (GIS) nếu chưa tồn tại
export function loadGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return resolve();
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
    script.onerror = () =>
      reject(new Error("Không thể tải Google Identity Services (GIS). Vui lòng kiểm tra kết nối mạng."));
    document.body.appendChild(script);
  });
}

export interface RequestTokenOptions {
  clientId?: string;
  hint?: string;
  prompt?: "" | "consent" | "select_account";
}

export interface GoogleTokenResult {
  accessToken: string;
  expiresIn: number;
  expiresAt: number;
}

export interface GoogleUserProfile {
  email: string;
  name: string;
  picture?: string;
}

// Lấy Access Token từ Google Identity Services với hỗ trợ hint và prompt
export async function requestGoogleAccessToken(
  options?: RequestTokenOptions
): Promise<GoogleTokenResult> {
  await loadGisScript();

  if (!window.google?.accounts?.oauth2) {
    throw new Error("Dịch vụ Google Identity Services chưa sẵn sàng.");
  }

  const currentConfig = getGoogleDriveConfig();
  const clientId = (options?.clientId || currentConfig.clientId || DEFAULT_GOOGLE_CLIENT_ID).trim();
  if (!clientId) {
    throw new Error("Thiếu Google Client ID.");
  }

  const hint = options?.hint || currentConfig.userEmail;
  // Nếu đã có hint (email) và không chỉ định prompt cụ thể, dùng "" để không bắt hỏi lại consent
  const prompt = options?.prompt !== undefined ? options.prompt : (hint ? "" : "consent");

  return new Promise((resolve, reject) => {
    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope:
          "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
        callback: (tokenResponse: any) => {
          if (tokenResponse.error) {
            const errDetail = tokenResponse.error_description || tokenResponse.error;
            return reject(new Error(`Lỗi ủy quyền Google: ${errDetail}`));
          }
          const accessToken = tokenResponse.access_token;
          const expiresIn = parseInt(tokenResponse.expires_in || "3600", 10);
          const expiresAt = Date.now() + expiresIn * 1000;
          appDataScopeForbidden = false; // Reset cờ vì đây là token mới
          resolve({ accessToken, expiresIn, expiresAt });
        },
        error_callback: (nonOAuthErr: any) => {
          reject(new Error(nonOAuthErr?.message || "Lỗi khởi tạo token client của Google"));
        },
      });

      const requestArgs: any = {};
      if (prompt !== undefined) {
        requestArgs.prompt = prompt;
      }
      if (hint) {
        requestArgs.hint = hint;
      }

      tokenClient.requestAccessToken(requestArgs);
    } catch (e: any) {
      reject(e);
    }
  });
}

// Lấy profile người dùng từ Google
export async function fetchGoogleUserProfile(accessToken: string): Promise<GoogleUserProfile> {
  const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!userRes.ok) {
    throw new Error("Không thể lấy thông tin người dùng từ Google");
  }
  return (await userRes.json()) as GoogleUserProfile;
}

// Gia hạn phiên làm việc Google Drive (1 chạm) - Giữ nguyên tuyệt đối Folder ID và Email đã nhớ
export async function renewGoogleDriveSession(options?: {
  prompt?: "" | "consent" | "select_account";
}): Promise<GoogleDriveConfig> {
  const currentConfig = getGoogleDriveConfig();
  if (!currentConfig.userEmail) {
    throw new Error("Chưa có tài khoản Google nào được liên kết trước đó để gia hạn.");
  }

  let tokenResult: GoogleTokenResult;
  try {
    tokenResult = await requestGoogleAccessToken({
      clientId: currentConfig.clientId,
      hint: currentConfig.userEmail,
      prompt: options?.prompt !== undefined ? options.prompt : "",
    });
  } catch (err: any) {
    // Nếu prompt: "" bị lỗi vì cần tương tác lại từ người dùng, thử lại với select_account
    if (
      options?.prompt === undefined &&
      (err.message?.includes("interaction_required") || err.message?.includes("immediate_failed"))
    ) {
      tokenResult = await requestGoogleAccessToken({
        clientId: currentConfig.clientId,
        hint: currentConfig.userEmail,
        prompt: "select_account",
      });
    } else {
      throw err;
    }
  }

  // Bảo toàn 100% các cấu hình quan trọng đã lưu: folderId, folderName, userEmail, userName...
  const updatedConfig: GoogleDriveConfig = {
    ...currentConfig,
    accessToken: tokenResult.accessToken,
    tokenExpiresAt: tokenResult.expiresAt,
  };

  saveGoogleDriveConfig(updatedConfig);
  return updatedConfig;
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
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,webViewLink,thumbnailLink",
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

// Find folder by name (to avoid creating duplicate folders when logging in from multiple devices)
export async function findDriveFolderByName(
  accessToken: string,
  folderName: string,
  parentFolderId?: string
): Promise<{ id: string; name: string } | null> {
  try {
    let query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    if (parentFolderId && parentFolderId !== "root") {
      query += ` and '${parentFolderId}' in parents`;
    }

    // Sắp xếp createdTime asc để luôn lấy thư mục ĐẦU TIÊN đã tạo trên Drive của người dùng
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,createdTime)&supportsAllDrives=true&includeItemsFromAllDrives=true&orderBy=createdTime asc&pageSize=10`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return { id: data.files[0].id, name: data.files[0].name };
    }
    return null;
  } catch (err) {
    console.warn("Lỗi tìm thư mục trên Google Drive:", err);
    return null;
  }
}

// Find existing folder or create new subfolder on Google Drive
// Thông minh: Nếu đã có file database tồn tại ở đâu đó trên Drive, trỏ thẳng vào folder đó!
export async function findOrCreateDriveFolder(
  accessToken: string,
  folderName: string,
  parentFolderId?: string
): Promise<{ id: string; name: string }> {
  // 1. Nếu đang tìm folder con cụ thể (có parentFolderId), tìm hoặc tạo folder con bên trong parentFolderId
  if (parentFolderId && parentFolderId !== "root") {
    const existing = await findDriveFolderByName(accessToken, folderName, parentFolderId);
    if (existing) {
      return existing;
    }
    return createDriveFolder(accessToken, folderName, parentFolderId);
  }

  // 2. Chỉ khi tìm thư mục ứng dụng chính (không có parentFolderId cụ thể):
  // Kiểm tra xem trên toàn bộ Drive đã có file database vcc_documents_database.json chưa
  try {
    const existingDb = await findDriveFileByName(accessToken, DRIVE_DB_FILENAME);
    if (existingDb && existingDb.parents && existingDb.parents.length > 0) {
      const parentId = existingDb.parents[0];
      // Lấy thông tin folder cha của file database
      const folderRes = await fetch(`https://www.googleapis.com/drive/v3/files/${parentId}?fields=id,name&supportsAllDrives=true`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (folderRes.ok) {
        const folderData = await folderRes.json();
        if (folderData.id) {
          return { id: folderData.id, name: folderData.name || folderName };
        }
      }
      return { id: parentId, name: folderName };
    }
  } catch (dbErr) {
    console.warn("Không thể tìm file database cũ:", dbErr);
  }

  // 3. Tìm thư mục theo tên (lấy thư mục cũ nhất đã tạo)
  const existing = await findDriveFolderByName(accessToken, folderName, parentFolderId);
  if (existing) {
    return existing;
  }

  // 4. Nếu chưa có bất kỳ thư mục nào, mới tạo thư mục mới
  return createDriveFolder(accessToken, folderName, parentFolderId);
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

// Lấy thông tin chi tiết thư mục (tên thật)
export async function getDriveFolderDetails(
  accessToken: string,
  folderId: string
): Promise<{ id: string; name: string } | null> {
  try {
    if (!folderId || folderId === "root") {
      return { id: "root", name: "Google Drive (Thư mục gốc)" };
    }
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name&supportsAllDrives=true`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return { id: data.id, name: data.name };
  } catch (err) {
    console.warn("Lỗi lấy thông tin thư mục Google Drive:", err);
    return null;
  }
}

// Đăng nhập hệ thống bằng Google Workspace / Google Account
export async function loginWithGoogle(options?: {
  prompt?: "" | "consent" | "select_account";
  clientId?: string;
}): Promise<GoogleDriveConfig> {
  const currentConfig = getGoogleDriveConfig();
  const clientId = (options?.clientId || currentConfig.clientId || DEFAULT_GOOGLE_CLIENT_ID).trim();
  const prompt = options?.prompt !== undefined ? options.prompt : (currentConfig.userEmail ? "select_account" : "consent");

  const tokenResult = await requestGoogleAccessToken({
    clientId,
    prompt,
    hint: currentConfig.userEmail,
  });

  const accessToken = tokenResult.accessToken;
  const expiresAt = tokenResult.expiresAt;

  // Lấy hồ sơ tài khoản Google
  const userData = await fetchGoogleUserProfile(accessToken);

  // 1. Kiểm tra trước trên Drive xem tài khoản này đã có thư mục lưu trữ được cấu hình từ thiết bị khác chưa
  let targetFolderId = currentConfig.folderId;
  let targetFolderName = currentConfig.folderName;

  try {
    const remoteFolder = await syncActiveFolderFromDrive(accessToken);
    if (remoteFolder?.folderId) {
      targetFolderId = remoteFolder.folderId;
      targetFolderName = remoteFolder.folderName;
    }
  } catch (_) {}

  // 2. Nhận diện hoặc tạo thư mục mặc định nếu chưa cấu hình
  if (!targetFolderId) {
    try {
      const folderRes = await findOrCreateDriveFolder(accessToken, "[VCC] Sổ Văn Bản Điện Tử");
      targetFolderId = folderRes.id;
      targetFolderName = folderRes.name || "[VCC] Sổ Văn Bản Điện Tử";
      // Lưu lại lên Drive để các thiết bị khác đồng bộ
      await saveActiveFolderToDrive(accessToken, targetFolderId, targetFolderName);
    } catch (fErr) {
      console.warn("Could not find or create folder, using root", fErr);
      targetFolderId = "root";
      targetFolderName = "Google Drive (Thư mục gốc)";
    }
  } else {
    // Đảm bảo thông tin thư mục đã chọn được đồng bộ lên Drive appDataFolder
    saveActiveFolderToDrive(accessToken, targetFolderId, targetFolderName || "").catch(() => {});
  }

  const updatedConfig: GoogleDriveConfig = {
    ...currentConfig,
    clientId,
    userEmail: userData.email,
    userName: userData.name,
    userAvatar: userData.picture,
    accessToken,
    tokenExpiresAt: expiresAt,
    folderId: targetFolderId,
    folderName: targetFolderName,
  };

  saveGoogleDriveConfig(updatedConfig);
  return updatedConfig;
}

// Đăng xuất khỏi Google session hiện tại (giữ lại cấu hình và thông tin tài khoản gần nhất để tiện đăng nhập lại)
export function logoutGoogle(clearAll: boolean = false): GoogleDriveConfig {
  const current = getGoogleDriveConfig();
  let updated: GoogleDriveConfig;
  if (clearAll) {
    updated = {
      ...DEFAULT_DRIVE_CONFIG,
    };
  } else {
    updated = {
      ...current,
      accessToken: undefined,
      tokenExpiresAt: undefined,
    };
  }
  saveGoogleDriveConfig(updated);
  return updated;
}

// Liệt kê CHỈ các thư mục có chứa tệp tin vcc_documents_database.json trên Google Drive
export async function listDriveFolders(
  accessToken: string,
  currentFolderId?: string
): Promise<DriveFolderItem[]> {
  try {
    // 1. Quét các tệp database trên Google Drive (bao gồm cả thư mục được chia sẻ)
    const dbQuery = `name = '${DRIVE_DB_FILENAME}' and trashed = false`;
    const dbUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      dbQuery
    )}&fields=files(id,name,parents,modifiedTime)&supportsAllDrives=true&includeItemsFromAllDrives=true&orderBy=modifiedTime desc&pageSize=20`;

    const dbRes = await fetch(dbUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const folderMap = new Map<string, DriveFolderItem>();

    if (dbRes.ok) {
      const dbData = await dbRes.json();
      const files: any[] = dbData.files || [];

      // Với mỗi file database tìm thấy, lấy thư mục cha
      for (const file of files) {
        if (file.parents && file.parents.length > 0) {
          const parentId = file.parents[0];
          if (!folderMap.has(parentId)) {
            const details = await getDriveFolderDetails(accessToken, parentId);
            if (details) {
              folderMap.set(parentId, {
                id: details.id,
                name: details.name,
                modifiedTime: file.modifiedTime,
                isDatabaseHost: true,
              });
            }
          }
        }
      }
    }

    // Nếu người dùng hiện đang kết nối 1 folder cụ thể mà folder đó chưa có trong map, vẫn hiển thị folder đó lên
    if (currentFolderId && currentFolderId !== "root" && !folderMap.has(currentFolderId)) {
      const currentDetails = await getDriveFolderDetails(accessToken, currentFolderId);
      if (currentDetails) {
        folderMap.set(currentFolderId, {
          id: currentDetails.id,
          name: currentDetails.name,
          isDatabaseHost: false,
        });
      }
    }

    return Array.from(folderMap.values());
  } catch (err) {
    console.warn("Lỗi tìm kiếm các thư mục chứa database trên Google Drive:", err);
    return [];
  }
}

// Delete or remove file from Google Drive (Luôn chuyển vào thư mục con _ThungRac_DaXoa để minh bạch và dễ khôi phục)
export async function deleteFileFromGoogleDrive(
  accessToken: string,
  fileId: string,
  folderId?: string
): Promise<boolean> {
  try {
    // 1. Luôn di chuyển file vào thư mục con "_ThungRac_DaXoa" bên trong thư mục làm việc chung
    // Giúp file biến mất khỏi danh sách chính, cả phòng đều thấy và có thể đối soát/khôi phục bất cứ lúc nào
    if (folderId && folderId !== "root") {
      try {
        const trashSubfolder = await findOrCreateDriveFolder(accessToken, "_ThungRac_DaXoa", folderId);
        if (trashSubfolder && trashSubfolder.id && trashSubfolder.id !== folderId) {
          const moveRes = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}?addParents=${encodeURIComponent(trashSubfolder.id)}&removeParents=${encodeURIComponent(folderId)}&supportsAllDrives=true`,
            {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({}),
            }
          );
          if (moveRes.ok || moveRes.status === 404) {
            console.info(`[Drive Asset] Đã chuyển tệp ${fileId} vào thư mục con [_ThungRac_DaXoa] thành công.`);
            return true;
          }
        }
      } catch (moveErr) {
        console.warn("[Drive Asset] Không thể chuyển vào thư mục _ThungRac_DaXoa, thử gỡ liên kết trực tiếp:", moveErr);
      }

      // Fallback 1b: Gỡ file khỏi thư mục cha nếu không chuyển được
      try {
        const removeRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}?removeParents=${encodeURIComponent(folderId)}&supportsAllDrives=true`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({}),
          }
        );
        if (removeRes.ok || removeRes.status === 404) {
          console.info(`[Drive Asset] Đã gỡ tệp ${fileId} khỏi thư mục làm việc.`);
          return true;
        }
      } catch (parentErr) {
        // Tiếp tục thử đưa vào thùng rác
      }
    }

    // 2. Fallback nếu không có folderId cụ thể: Đưa vào Thùng rác Google Drive (trashed: true)
    try {
      const trashRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?supportsAllDrives=true`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ trashed: true }),
        }
      );
      if (trashRes.ok || trashRes.status === 404) {
        console.info(`[Drive Asset] Đã đưa tệp ${fileId} vào Thùng rác Google Drive.`);
        return true;
      }
    } catch (trashErr) {
      // Bỏ qua
    }

    return false;
  } catch (err) {
    console.warn(`Lỗi khi dọn dẹp tệp ${fileId} trên Google Drive:`, err);
    return false;
  }
}

// ----------------------------------------------------
// GOOGLE DRIVE CENTRAL DATABASE SYNC (Multi-Browser Sync)
// ----------------------------------------------------

export const DRIVE_DB_FILENAME = "vcc_documents_database.json";

export interface DriveDatabasePayload {
  version: number;
  revision?: number;
  lastUpdated: string;
  updatedBy?: string;
  categories: any[];
  documents: any[];
  deletedRecords?: { id: string; deletedAt: number }[];
  formMetadataOptions?: FormMetadataOptions;
}

/**
 * Hàm hợp nhất văn bản và dấu xóa (Tombstone-Wins) dùng chung (EFR-03, EFR-06 & EFR-20)
 */
export function mergeDocumentsAndTombstones(
  docsAOrPayloadA: any[] | { documents?: any[]; deletedRecords?: any[]; revision?: number } = [],
  docsBOrPayloadB: any[] | { documents?: any[]; deletedRecords?: any[]; revision?: number } = [],
  tombstonesA: { id: string; deletedAt: number }[] = [],
  tombstonesB: { id: string; deletedAt: number }[] = []
): { documents: any[]; deletedRecords: { id: string; deletedAt: number }[]; revision?: number } {
  let docsA: any[] = [];
  let docsB: any[] = [];
  let tA = tombstonesA;
  let tB = tombstonesB;
  let maxRevision: number | undefined;

  if (docsAOrPayloadA && !Array.isArray(docsAOrPayloadA) && typeof docsAOrPayloadA === "object") {
    docsA = docsAOrPayloadA.documents || [];
    tA = docsAOrPayloadA.deletedRecords || [];
    if (typeof docsAOrPayloadA.revision === "number") maxRevision = docsAOrPayloadA.revision;
  } else if (Array.isArray(docsAOrPayloadA)) {
    docsA = docsAOrPayloadA;
  }

  if (docsBOrPayloadB && !Array.isArray(docsBOrPayloadB) && typeof docsBOrPayloadB === "object") {
    docsB = docsBOrPayloadB.documents || [];
    tB = docsBOrPayloadB.deletedRecords || [];
    if (typeof docsBOrPayloadB.revision === "number") {
      maxRevision = Math.max(maxRevision ?? 0, docsBOrPayloadB.revision);
    }
  } else if (Array.isArray(docsBOrPayloadB)) {
    docsB = docsBOrPayloadB;
  }

  // 1. Union tombstones, giữ deletedAt mới nhất
  const tombstoneMap = new Map<string, number>();
  for (const t of [...(tA || []), ...(tB || [])]) {
    if (!t || !t.id) continue;
    const existing = tombstoneMap.get(t.id);
    if (!existing || t.deletedAt > existing) {
      tombstoneMap.set(t.id, t.deletedAt);
    }
  }

  const mergedTombstones: { id: string; deletedAt: number }[] = Array.from(tombstoneMap.entries()).map(
    ([id, deletedAt]) => ({ id, deletedAt })
  );
  const deletedIds = new Set(tombstoneMap.keys());

  // 2. Union documents theo ID, giữ bản ghi có thời gian mới hơn
  const docMap = new Map<string, any>();
  for (const doc of [...(docsA || []), ...(docsB || [])]) {
    if (!doc || !doc.id) continue;
    // Tombstone-Wins: loại bỏ ngay nếu nằm trong danh sách đã xóa
    if (deletedIds.has(doc.id)) continue;

    const existing = docMap.get(doc.id);
    if (!existing) {
      docMap.set(doc.id, doc);
    } else {
      const timeDoc = new Date(doc.updatedAt || doc.createdAt || doc.registrationDate || 0).getTime();
      const timeExisting = new Date(existing.updatedAt || existing.createdAt || existing.registrationDate || 0).getTime();
      if (timeDoc > timeExisting) {
        docMap.set(doc.id, doc);
      }
    }
  }

  // Triệt để lọc sạch theo Tombstone-Wins
  const mergedDocs = Array.from(docMap.values()).filter((d) => !deletedIds.has(d.id));

  return {
    documents: mergedDocs,
    deletedRecords: mergedTombstones,
    ...(maxRevision !== undefined ? { revision: maxRevision + 1 } : {}),
  };
}

/**
 * Tìm file trên Google Drive theo tên (lọc bỏ các file .bak, deprecated, trashed)
 */
export async function findDriveFileByName(
  accessToken: string,
  fileName: string,
  folderId?: string
): Promise<{ id: string; name: string; etag?: string; parents?: string[]; modifiedTime?: string } | null> {
  try {
    let query = `name = '${fileName}' and trashed = false`;
    if (folderId && folderId !== "root") {
      query += ` and '${folderId}' in parents`;
    }

    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,parents,modifiedTime,properties,version,headRevisionId)&supportsAllDrives=true&includeItemsFromAllDrives=true&orderBy=modifiedTime desc&pageSize=10`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (data.files && data.files.length > 0) {
      const validFiles = data.files.filter((f: any) => {
        if (f.name?.endsWith(".bak")) return false;
        if (f.properties?.deprecated === "true") return false;
        return true;
      });
      return validFiles.length > 0 ? validFiles[0] : null;
    }
    return null;
  } catch (err) {
    console.warn("Lỗi khi tìm file trên Google Drive:", err);
    return null;
  }
}

/**
 * Điểm nhập chung phân giải file database canonical và tự động kích hoạt reconciliation (EFR-21 & EFR-22)
 */
export async function resolveCanonicalDriveDatabase(
  accessToken: string,
  folderId?: string
): Promise<{ id: string; name: string; etag?: string; parents?: string[]; modifiedTime?: string } | null> {
  let query = `name = '${DRIVE_DB_FILENAME}' and trashed = false`;
  if (folderId && folderId !== "root") {
    query += ` and '${folderId}' in parents`;
  }

  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,parents,modifiedTime,properties,version,headRevisionId)&supportsAllDrives=true&includeItemsFromAllDrives=true&orderBy=modifiedTime desc&pageSize=20`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch (netErr: any) {
    // EFR-22: Mọi lỗi mạng/fetch reject BẮT BUỘC ném ngoại lệ dừng luồng, không trả null
    throw new Error(`Không thể kết nối Google Drive (Lỗi mạng): ${netErr.message || netErr}`);
  }

  // EFR-22: Mọi lỗi HTTP (!res.ok, 401, 403, 500) BẮT BUỘC ném ngoại lệ dừng luồng
  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`Lỗi kiểm tra Google Drive (HTTP ${res.status}): ${errorText || res.statusText}`);
  }

  let data: any;
  try {
    data = await res.json();
  } catch (parseErr: any) {
    throw new Error(`Lỗi đọc phản hồi từ Google Drive: ${parseErr.message || parseErr}`);
  }

  const allFiles = data.files || [];
  // Lọc bỏ các file đã bị fence thành .bak hoặc deprecated
  const validFiles = allFiles.filter((f: any) => {
    if (f.name?.endsWith(".bak")) return false;
    if (f.properties?.deprecated === "true") return false;
    return true;
  });

  // CHỈ trả về null khi và chỉ khi liệt kê thành công và tập kết quả rỗng (EFR-22)
  if (validFiles.length === 0) {
    return null;
  }

  if (validFiles.length === 1) {
    return validFiles[0];
  }

  // Có > 1 file trùng: Tự động kích hoạt quy trình Lock-First Safe Reconciliation (EFR-21)
  console.info(`[Drive Database] Phát hiện ${validFiles.length} file database trùng tên. Tiến hành Lock-First Reconciliation...`);
  const canonicalFile = await reconcileDuplicateDriveDatabases(accessToken, validFiles);
  return canonicalFile;
}

/**
 * Quy trình Lock-First Safe Reconciliation cho duplicate registries (EFR-15, EFR-17, EFR-18, EFR-19 & EFR-20)
 */
export async function reconcileDuplicateDriveDatabases(
  accessToken: string,
  files: any[]
): Promise<{ id: string; name: string; etag?: string; parents?: string[]; modifiedTime?: string }> {
  if (!files || files.length === 0) {
    throw new Error("Không có file nào để reconcile");
  }
  if (files.length === 1) {
    return files[0];
  }

  // Chọn canonical file (file mới nhất theo modifiedTime)
  const canonicalFile = files[0];
  const secondaryFiles = files.slice(1);

  // Bước 1 (Lock First - Metadata only): Khóa ghi tất cả file phụ trước bằng metadata update
  for (const secFile of secondaryFiles) {
    const newName = `${DRIVE_DB_FILENAME}.merged.${secFile.id}.bak`;
    const lockMetadata = {
      name: newName,
      contentRestrictions: [
        {
          readOnly: true,
          reason: "Migrated to canonical database",
        },
      ],
      properties: {
        deprecated: "true",
        canonicalFileId: canonicalFile.id,
      },
    };

    const lockRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${secFile.id}?supportsAllDrives=true`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(lockMetadata),
      }
    );

    if (!lockRes.ok) {
      console.warn(`[Reconciliation] Không thể áp dụng Lock-First trên file phụ ${secFile.id}:`, await lockRes.text());
    }
  }

  // Bước 2 (Read Final Frozen Snapshot): Đọc nội dung snapshot đóng băng cuối cùng của từng file phụ
  const allPayloads: DriveDatabasePayload[] = [];

  const canonicalPayload = await readDatabaseFromGoogleDrive(accessToken, canonicalFile.id);
  if (canonicalPayload) {
    allPayloads.push(canonicalPayload);
  }

  for (const secFile of secondaryFiles) {
    const secPayload = await readDatabaseFromGoogleDrive(accessToken, secFile.id);
    if (secPayload) {
      allPayloads.push(secPayload);
    }
  }

  // Bước 3 (Merge with Tombstone-Wins): Hợp nhất toàn bộ dữ liệu
  let mergedCategories: any[] = canonicalPayload?.categories || [];
  let mergedDocuments: any[] = canonicalPayload?.documents || [];
  let mergedTombstones: { id: string; deletedAt: number }[] = canonicalPayload?.deletedRecords || [];
  let mergedFormMetadata: FormMetadataOptions | undefined = canonicalPayload?.formMetadataOptions;

  for (const p of allPayloads) {
    if (p === canonicalPayload) continue;

    // Hợp nhất formMetadataOptions
    if (p.formMetadataOptions) {
      if (!mergedFormMetadata) {
        mergedFormMetadata = p.formMetadataOptions;
      } else {
        const { merged } = mergeFormMetadataOptions(mergedFormMetadata, p.formMetadataOptions);
        mergedFormMetadata = merged;
      }
    }

    // Hợp nhất categories
    if (Array.isArray(p.categories)) {
      for (const cat of p.categories) {
        const existingIdx = mergedCategories.findIndex(
          (c) => c.id === cat.id || c.code?.toUpperCase() === cat.code?.toUpperCase()
        );
        if (existingIdx !== -1) {
          mergedCategories[existingIdx] = {
            ...mergedCategories[existingIdx],
            currentCount: Math.max(mergedCategories[existingIdx].currentCount || 0, cat.currentCount || 0),
          };
        } else {
          mergedCategories.push(cat);
        }
      }
    }

    // Hợp nhất documents & tombstones với quy tắc Tombstone-Wins
    const mergedResult = mergeDocumentsAndTombstones(
      mergedDocuments,
      p.documents || [],
      mergedTombstones,
      p.deletedRecords || []
    );
    mergedDocuments = mergedResult.documents;
    mergedTombstones = mergedResult.deletedRecords;
  }

  // Bước 4 (Canonical CAS Write): Ghi lại canonical file
  const updatedCanonicalPayload: DriveDatabasePayload = {
    version: 1,
    revision: (canonicalPayload?.revision || 0) + 1,
    lastUpdated: new Date().toISOString(),
    categories: mergedCategories,
    documents: mergedDocuments,
    deletedRecords: mergedTombstones,
    formMetadataOptions: mergedFormMetadata,
  };

  const sanitized = sanitizeDatabasePayload(updatedCanonicalPayload);
  const jsonBlob = new Blob([JSON.stringify(sanitized, null, 2)], { type: "application/json" });

  const patchHeaders: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
  if (canonicalFile.etag) {
    patchHeaders["If-Match"] = canonicalFile.etag;
  }

  const saveRes = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${canonicalFile.id}?uploadType=media&supportsAllDrives=true`,
    {
      method: "PATCH",
      headers: patchHeaders,
      body: jsonBlob,
    }
  );

  if (!saveRes.ok) {
    const errText = await saveRes.text().catch(() => "");
    throw new Error(`[Reconciliation] Không thể lưu canonical database: ${errText}`);
  }

  return canonicalFile;
}

// Read JSON database from Google Drive
export async function readDatabaseFromGoogleDrive(
  accessToken: string,
  fileId: string
): Promise<DriveDatabasePayload | null> {
  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`, {
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

// Strip heavy base64 dataUrl from documents before uploading to Google Drive JSON registry
function sanitizeDatabasePayload(payload: DriveDatabasePayload): DriveDatabasePayload {
  const sanitizedDocs = (payload.documents || []).map((doc: any) => {
    // If doc has images, strip dataUrl from each image to keep JSON lightweight
    const sanitizedImages = (doc.images || []).map((img: any) => ({
      id: img.id,
      name: img.name,
      mimeType: img.mimeType,
      size: img.size,
      capturedAt: img.capturedAt,
      pageNumber: img.pageNumber,
      rotation: img.rotation,
      driveFileId: img.driveFileId,
      driveWebViewLink: img.driveWebViewLink,
      driveThumbnailLink: img.driveThumbnailLink,
      sourceDriveFileId: img.sourceDriveFileId,
      driveAssetOwnership: img.driveAssetOwnership,
      pageCount: img.pageCount,
      // Do NOT include img.dataUrl here (already uploaded as a separate file on Drive or referenced from Drive)
    }));

    // If doc has email attachments, also strip attachment dataUrl
    let sanitizedEmail = doc.emailMetadata;
    if (sanitizedEmail && sanitizedEmail.attachments) {
      sanitizedEmail = {
        ...sanitizedEmail,
        attachments: sanitizedEmail.attachments.map((att: any) => ({
          id: att.id,
          filename: att.filename,
          mimeType: att.mimeType,
          size: att.size,
          extractedText: att.extractedText,
          isMainDocument: att.isMainDocument,
          // Do NOT include att.dataUrl
        })),
      };
    }

    return {
      ...doc,
      images: sanitizedImages,
      emailMetadata: sanitizedEmail,
    };
  });

  return {
    ...payload,
    documents: sanitizedDocs,
  };
}

/**
 * Cập nhật cơ sở dữ liệu trên Google Drive có chống xung đột và giải quyết CAS (EFR-12, EFR-14 & EFR-21)
 */
export async function saveDatabaseWithConflictResolution(
  accessToken: string,
  folderId: string | undefined,
  updateFn: (currentPayload: DriveDatabasePayload | null) => DriveDatabasePayload,
  maxRetries = 3
): Promise<string> {
  let attempt = 0;

  while (attempt < maxRetries) {
    attempt++;
    // Luôn truy vấn canonical file mới nhất qua resolveCanonicalDriveDatabase (EFR-21)
    const canonicalFile = await resolveCanonicalDriveDatabase(accessToken, folderId);

    if (!canonicalFile) {
      // Kho chưa tồn tại trên Drive -> Tạo mới bằng multipart POST
      const initialPayload = updateFn(null);
      const sanitized = sanitizeDatabasePayload(initialPayload);
      const blob = new Blob([JSON.stringify(sanitized, null, 2)], { type: "application/json" });

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
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name",
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

    // Đọc payload hiện tại và etag từ Drive
    const readRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${canonicalFile.id}?alt=media&supportsAllDrives=true`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!readRes.ok) {
      throw new Error(`Không thể đọc database từ Google Drive (HTTP ${readRes.status})`);
    }

    const etagHeader = readRes.headers.get("ETag") || canonicalFile.etag || "";
    const currentPayload: DriveDatabasePayload = await readRes.json();

    // Áp dụng updateFn
    const newPayload = updateFn(currentPayload);
    newPayload.revision = (currentPayload.revision || 0) + 1;
    newPayload.lastUpdated = new Date().toISOString();

    const sanitized = sanitizeDatabasePayload(newPayload);
    const blob = new Blob([JSON.stringify(sanitized, null, 2)], { type: "application/json" });

    const patchHeaders: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };
    if (etagHeader) {
      patchHeaders["If-Match"] = etagHeader;
    }

    const patchRes = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${canonicalFile.id}?uploadType=media&supportsAllDrives=true`,
      {
        method: "PATCH",
        headers: patchHeaders,
        body: blob,
      }
    );

    if (patchRes.ok) {
      return canonicalFile.id;
    }

    // Bắt lỗi 412 (Precondition Failed: ETag bị thay đổi do thiết bị khác ghi đè)
    if (patchRes.status === 412) {
      console.warn(`[Drive CAS] Phát hiện xung đột ghi đè đồng thời (412 Precondition Failed). Thử lại lần ${attempt}/${maxRetries}...`);
      await new Promise((r) => setTimeout(r, 100 * Math.pow(2, attempt) + Math.random() * 50));
      continue;
    }

    // Bắt lỗi 403 (bị Write Fence khóa readOnly trên file phụ)
    if (patchRes.status === 403) {
      console.warn(`[Drive CAS] File ${canonicalFile.id} đã bị khóa ghi (Write Fence). Đang chuyển hướng sang canonical file mới...`);
      await new Promise((r) => setTimeout(r, 200));
      continue;
    }

    const errObj = await patchRes.json().catch(() => ({}));
    throw new Error(errObj.error?.message || `Lỗi cập nhật Google Drive (HTTP ${patchRes.status})`);
  }

  throw new Error(`Không thể cập nhật cơ sở dữ liệu sau ${maxRetries} lần thử do xung đột đồng thời.`);
}

// Save or Update JSON database to Google Drive (Deduplicated wrapper)
export async function saveDatabaseToGoogleDrive(
  accessToken: string,
  folderId: string | undefined,
  payload: DriveDatabasePayload
): Promise<string> {
  return saveDatabaseWithConflictResolution(accessToken, folderId, (current) => {
    // Nếu có dữ liệu hiện tại, gộp categories và documents với Tombstone-Wins
    if (current) {
      const mergedCats = [...current.categories];
      for (const cat of payload.categories || []) {
        const idx = mergedCats.findIndex((c) => c.id === cat.id || c.code?.toUpperCase() === cat.code?.toUpperCase());
        if (idx !== -1) {
          mergedCats[idx] = {
            ...mergedCats[idx],
            currentCount: Math.max(mergedCats[idx].currentCount || 0, cat.currentCount || 0),
          };
        } else {
          mergedCats.push(cat);
        }
      }

      const merged = mergeDocumentsAndTombstones(
        current.documents || [],
        payload.documents || [],
        current.deletedRecords || [],
        payload.deletedRecords || []
      );

      let mergedFormMetadata = current.formMetadataOptions;
      if (payload.formMetadataOptions) {
        if (!mergedFormMetadata) {
          mergedFormMetadata = payload.formMetadataOptions;
        } else {
          const { merged: m } = mergeFormMetadataOptions(mergedFormMetadata, payload.formMetadataOptions);
          mergedFormMetadata = m;
        }
      }

      return {
        ...payload,
        categories: mergedCats,
        documents: merged.documents,
        deletedRecords: merged.deletedRecords,
        formMetadataOptions: mergedFormMetadata,
      };
    }
    return payload;
  });
}

// Ghi nhớ phiên Google OAuth hiện tại chưa có scope drive.appdata để không gửi lại request 403
let appDataScopeForbidden = false;

export function resetAppDataScopeForbidden(): void {
  appDataScopeForbidden = false;
}

/**
 * Đọc file dữ liệu từ phân vùng riêng tư appDataFolder của tài khoản Google
 */
export async function readAppDataFile<T = any>(
  accessToken: string,
  filename: string
): Promise<{ fileId: string; data: T } | null> {
  if (appDataScopeForbidden || !accessToken) {
    return null;
  }

  try {
    const listUrl = `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='${encodeURIComponent(
      filename
    )}' and trashed=false&fields=files(id,name,modifiedTime)`;

    const listRes = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!listRes.ok) {
      if (listRes.status === 403) {
        // Đánh dấu phiên hiện tại chưa có scope drive.appdata -> chặn toàn bộ request appDataFolder sau đó
        appDataScopeForbidden = true;
        console.debug(`[Drive appDataFolder] Token chưa có quyền drive.appdata, tạm dừng đồng bộ Drive cho đến lần đăng nhập sau.`);
      } else if (listRes.status === 401) {
        console.debug(`[Drive appDataFolder] Token Google đã hết hạn (401), dùng local cache.`);
      } else {
        console.warn(`[Drive appDataFolder] Lỗi tìm kiếm tệp ${filename}:`, listRes.status);
      }
      return null;
    }

    const listData = await listRes.json();
    if (!listData.files || listData.files.length === 0) {
      return null;
    }

    const fileId = listData.files[0].id;
    const contentRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!contentRes.ok) {
      if (contentRes.status === 401 || contentRes.status === 403) {
        console.debug(`[Drive appDataFolder] Bỏ qua tải nội dung tệp (${contentRes.status}).`);
      } else {
        console.warn(`[Drive appDataFolder] Lỗi tải nội dung tệp ${fileId}:`, contentRes.status);
      }
      return null;
    }

    const data = await contentRes.json();
    return { fileId, data: data as T };
  } catch (err) {
    console.debug(`[Drive appDataFolder] Không thể đọc tệp ${filename}, dùng local cache.`, err);
    return null;
  }
}

/**
 * Lưu hoặc cập nhật file dữ liệu vào phân vùng riêng tư appDataFolder
 */
export async function saveAppDataFile<T = any>(
  accessToken: string,
  filename: string,
  data: T
): Promise<string | null> {
  if (appDataScopeForbidden || !accessToken) {
    return null;
  }
  try {
    // 1. Kiểm tra file đã tồn tại trong appDataFolder chưa
    const existing = await readAppDataFile(accessToken, filename);
    const contentStr = JSON.stringify(data, null, 2);

    if (existing?.fileId) {
      // Cập nhật file đã có
      const patchRes = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${existing.fileId}?uploadType=media`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json; charset=UTF-8",
          },
          body: contentStr,
        }
      );

      if (!patchRes.ok) {
        throw new Error(`PATCH appDataFolder failed: ${patchRes.status}`);
      }
      return existing.fileId;
    } else {
      // Tạo mới file trong appDataFolder bằng multipart upload
      const metadata = {
        name: filename,
        parents: ["appDataFolder"],
      };

      const boundary = "-------314159265358979323846";
      const delimiter = "\r\n--" + boundary + "\r\n";
      const closeDelim = "\r\n--" + boundary + "--";

      const multipartRequestBody =
        delimiter +
        "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
        JSON.stringify(metadata) +
        delimiter +
        "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
        contentStr +
        closeDelim;

      const createRes = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      });

      if (!createRes.ok) {
        throw new Error(`CREATE appDataFolder file failed: ${createRes.status}`);
      }

      const result = await createRes.json();
      return result.id;
    }
  } catch (err) {
    console.error(`[Drive appDataFolder] Lỗi ghi tệp ${filename}:`, err);
    return null;
  }
}

export const DRIVE_FOLDER_CONFIG_FILENAME = "config_active_folder.json";

export interface ActiveFolderConfig {
  folderId: string;
  folderName: string;
  updatedAt: number;
}

/**
 * Đồng bộ cấu hình thư mục Google Drive giữa các thiết bị thông qua appDataFolder
 */
export async function syncActiveFolderFromDrive(
  accessToken: string
): Promise<{ folderId: string; folderName: string } | null> {
  if (!accessToken) return null;
  try {
    const res = await readAppDataFile<ActiveFolderConfig>(accessToken, DRIVE_FOLDER_CONFIG_FILENAME);
    if (res?.data?.folderId) {
      return {
        folderId: res.data.folderId,
        folderName: res.data.folderName || "[VCC] Sổ Văn Bản Điện Tử",
      };
    }
  } catch (err) {
    console.warn("[Drive appDataFolder] Lỗi đồng bộ thư mục active:", err);
  }
  return null;
}

/**
 * Lưu cấu hình thư mục Google Drive đang chọn lên appDataFolder để các thiết bị khác tự đồng bộ
 */
export async function saveActiveFolderToDrive(
  accessToken: string,
  folderId: string,
  folderName: string
): Promise<void> {
  if (!accessToken || !folderId) return;
  try {
    const data: ActiveFolderConfig = {
      folderId,
      folderName,
      updatedAt: Date.now(),
    };
    await saveAppDataFile(accessToken, DRIVE_FOLDER_CONFIG_FILENAME, data);
  } catch (err) {
    console.warn("[Drive appDataFolder] Lỗi lưu cấu hình thư mục lên Drive:", err);
  }
}

// Convert Blob to Base64 Data URL safely
export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(blob);
  });
}

export interface DrivePickerFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  modifiedTime?: string;
  thumbnailLink?: string;
  webViewLink?: string;
  iconLink?: string;
  isFolder: boolean;
}

export interface ListDriveFilesOptions {
  query?: string;
  folderId?: string;
  pageSize?: number;
  pageToken?: string;
  includeFolders?: boolean;
  sharedWithMe?: boolean;
  recentOnly?: boolean;
}

export interface ListDriveFilesResult {
  files: DrivePickerFile[];
  nextPageToken?: string;
}

/**
 * Trích xuất Folder ID từ URL liên kết Google Drive hoặc ID thô
 */
export function extractDriveFolderIdFromInput(input: string): string {
  const trimmed = input.trim();
  const folderUrlMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderUrlMatch) return folderUrlMatch[1];
  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch) return idParamMatch[1];
  return trimmed;
}


/**
 * Liệt kê các tệp tài liệu (PDF, ảnh) và thư mục từ Google Drive phục vụ tiếp nhận văn bản.
 * Đã áp dụng bộ lọc chuẩn MIME type, thoát ký tự đặc biệt trong truy vấn và kiểm tra quyền truy cập.
 */
export async function listDocumentFilesFromDrive(
  accessToken: string,
  options: ListDriveFilesOptions = {}
): Promise<ListDriveFilesResult> {
  if (!accessToken) {
    throw new Error("Chưa có Access Token Google Drive.");
  }

  const {
    query = "",
    folderId,
    pageSize = 40,
    pageToken,
    includeFolders = true,
    sharedWithMe = false,
    recentOnly = false,
  } = options;

  // Xây dựng điều kiện lọc an toàn
  const conditions: string[] = ["trashed = false"];

  // Bộ lọc MIME type: chỉ nhận PDF, Ảnh, hoặc Thư mục con
  if (includeFolders) {
    conditions.push(
      "(mimeType = 'application/vnd.google-apps.folder' or mimeType = 'application/pdf' or mimeType contains 'image/')"
    );
  } else {
    conditions.push("(mimeType = 'application/pdf' or mimeType contains 'image/')");
  }

  // Phân vùng duyệt thư mục:
  if (sharedWithMe) {
    conditions.push("sharedWithMe = true");
  } else if (!recentOnly) {
    if (folderId) {
      const safeParent = folderId.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
      conditions.push(`'${safeParent}' in parents`);
    }
  }

  // Tìm kiếm theo tên file (chuẩn hóa và escape ký tự nháy đơn)
  if (query.trim()) {
    const safeQuery = query.trim().replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    conditions.push(`name contains '${safeQuery}'`);
  }

  const q = conditions.join(" and ");

  const url = new URL("https://www.googleapis.com/drive/v3/files");
  url.searchParams.set("q", q);
  url.searchParams.set(
    "fields",
    "nextPageToken, files(id, name, mimeType, size, modifiedTime, thumbnailLink, webViewLink, iconLink, parents)"
  );
  url.searchParams.set("pageSize", String(Math.min(pageSize, 100)));
  url.searchParams.set("supportsAllDrives", "true");
  url.searchParams.set("includeItemsFromAllDrives", "true");
  url.searchParams.set("orderBy", "folder desc, modifiedTime desc");

  if (pageToken) {
    url.searchParams.set("pageToken", pageToken);
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      const err: any = new Error("Phiên làm việc Google Drive đã hết hạn (401 Unauthorized).");
      err.status = 401;
      throw err;
    }
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Lỗi tải danh sách tệp Google Drive (${response.status})`);
  }

  const data = await response.json();
  const rawFiles: any[] = data.files || [];

  const files: DrivePickerFile[] = rawFiles.map((f) => ({
    id: f.id,
    name: f.name || "Tệp không tên",
    mimeType: f.mimeType || "application/octet-stream",
    size: f.size ? Number(f.size) : undefined,
    modifiedTime: f.modifiedTime,
    thumbnailLink: f.thumbnailLink,
    webViewLink: f.webViewLink,
    iconLink: f.iconLink,
    isFolder: f.mimeType === "application/vnd.google-apps.folder",
  }));

  return {
    files,
    nextPageToken: data.nextPageToken,
  };
}

/**
 * Tải nội dung nhị phân của tệp từ Google Drive về client dưới dạng Base64 Data URL.
 */
export async function downloadDriveFileContent(
  accessToken: string,
  fileId: string,
  knownMimeType?: string
): Promise<{ dataUrl: string; size: number; mimeType: string; name?: string }> {
  if (!accessToken) {
    throw new Error("Chưa có Access Token Google Drive.");
  }

  // 1. Tải metadata của tệp trước để lấy thông tin MIME và tên nếu chưa rõ
  let finalMimeType = knownMimeType || "application/pdf";
  let fileName = "";

  try {
    const metaRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size&supportsAllDrives=true`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (metaRes.ok) {
      const meta = await metaRes.json();
      if (meta.mimeType) finalMimeType = meta.mimeType;
      if (meta.name) fileName = meta.name;
    }
  } catch (metaErr) {
    console.debug("Không thể đọc metadata trước khi tải media:", metaErr);
  }

  // 2. Chặn các loại tệp Google Workspace thuần (Docs, Sheets, Slides)
  if (finalMimeType.startsWith("application/vnd.google-apps.")) {
    throw new Error(
      "Tệp Google Docs/Sheets thuần túy không hỗ trợ tải trực tiếp dưới dạng nhị phân. Vui lòng xuất tệp ra PDF trên Google Drive trước khi tiếp nhận."
    );
  }

  // 3. Tải nội dung nhị phân qua alt=media
  const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`;
  const response = await fetch(downloadUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      const err: any = new Error("Phiên làm việc Google Drive đã hết hạn (401 Unauthorized).");
      err.status = 401;
      throw err;
    }
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Lỗi tải nội dung tệp từ Google Drive (${response.status})`);
  }

  const blob = await response.blob();
  const dataUrl = await blobToDataURL(blob);

  return {
    dataUrl,
    size: blob.size,
    mimeType: finalMimeType || blob.type || "application/pdf",
    name: fileName,
  };
}



