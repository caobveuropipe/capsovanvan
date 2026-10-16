import { getGoogleDriveConfig, readAppDataFile, saveAppDataFile } from "./googleDriveService";
import { getAppApiUrl } from "../utils/apiUrl";

export interface AiKeyConfig {
  apiKey: string;
  updatedAt: number;
  isDeleted?: boolean;
}

const DRIVE_AI_CONFIG_FILENAME = "config_ai.json";
const LOCAL_STORAGE_PREFIX = "docnum_gemini_key_v1_";

// Bộ nhớ đệm in-memory cho session hiện tại
let inMemoryActiveKey: { email: string; apiKey: string } | null = null;

/**
 * Xóa sạch in-memory key khi người dùng đăng xuất hoặc chuyển tài khoản Google
 */
export function clearInMemoryAiKey(): void {
  inMemoryActiveKey = null;
}

/**
 * Lấy namespace lưu trữ trong localStorage cho từng email
 */
function getLocalStorageKey(email: string): string {
  const normalized = email.trim().toLowerCase();
  return `${LOCAL_STORAGE_PREFIX}${normalized}`;
}

/**
 * Đọc cấu hình từ localStorage
 */
function readLocalAiConfig(email: string): AiKeyConfig | null {
  try {
    const raw = localStorage.getItem(getLocalStorageKey(email));
    if (!raw) return null;
    return JSON.parse(raw) as AiKeyConfig;
  } catch (err) {
    console.warn(`[aiKeyService] Lỗi đọc local key cho ${email}:`, err);
    return null;
  }
}

/**
 * Ghi cấu hình vào localStorage
 */
function writeLocalAiConfig(email: string, config: AiKeyConfig): void {
  try {
    localStorage.setItem(getLocalStorageKey(email), JSON.stringify(config));
  } catch (err) {
    console.warn(`[aiKeyService] Lỗi ghi local key cho ${email}:`, err);
  }
}

// Ghi nhớ token bị 403 (chưa cấp scope drive.appdata) để không gọi lại lặp đi lặp lại
let lastForbiddenToken: string | null = null;

/**
 * Lấy Gemini API Key đang hoạt động của người dùng hiện tại
 * Đọc tức thì từ in-memory cache hoặc localStorage (0ms, không tạo request mạng)
 */
export async function getActiveGeminiKey(userEmail?: string): Promise<string> {
  const driveConfig = getGoogleDriveConfig();
  const email = (userEmail || driveConfig.userEmail || "").trim().toLowerCase();

  if (!email) {
    return "";
  }

  // 1. Kiểm tra in-memory cache nếu khớp email
  if (inMemoryActiveKey && inMemoryActiveKey.email === email && inMemoryActiveKey.apiKey) {
    return inMemoryActiveKey.apiKey;
  }

  // 2. Đọc local cache
  const localConfig = readLocalAiConfig(email);
  if (localConfig && !localConfig.isDeleted && localConfig.apiKey) {
    inMemoryActiveKey = { email, apiKey: localConfig.apiKey };
    return localConfig.apiKey;
  }

  return "";
}

/**
 * Lưu API Key mới cho người dùng
 * - Lưu local cache với updatedAt = Date.now()
 * - Đẩy lên Drive appDataFolder nếu đã đăng nhập Google
 */
export async function saveGeminiKey(email: string, apiKey: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !apiKey.trim()) {
    return false;
  }

  const newConfig: AiKeyConfig = {
    apiKey: apiKey.trim(),
    updatedAt: Date.now(),
    isDeleted: false,
  };

  // 1. Lưu local cache ngay lập tức
  writeLocalAiConfig(normalizedEmail, newConfig);
  inMemoryActiveKey = { email: normalizedEmail, apiKey: newConfig.apiKey };

  // 2. Đồng bộ lên Drive appDataFolder
  const driveConfig = getGoogleDriveConfig();
  if (driveConfig.accessToken && driveConfig.userEmail?.toLowerCase() === normalizedEmail) {
    try {
      await saveAppDataFile(driveConfig.accessToken, DRIVE_AI_CONFIG_FILENAME, newConfig);
    } catch (err) {
      console.warn("[aiKeyService] Lỗi đồng bộ key lên Google Drive:", err);
    }
  }

  return true;
}

/**
 * Xóa API Key của người dùng
 * - Đánh dấu Tombstone { apiKey: "", updatedAt: Date.now(), isDeleted: true }
 * - Đẩy Tombstone lên Drive appDataFolder để các thiết bị khác đồng bộ xóa cache
 */
export async function removeGeminiKey(email: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return false;

  const tombstone: AiKeyConfig = {
    apiKey: "",
    updatedAt: Date.now(),
    isDeleted: true,
  };

  // 1. Lưu tombstone vào local cache và dọn in-memory
  writeLocalAiConfig(normalizedEmail, tombstone);
  if (inMemoryActiveKey && inMemoryActiveKey.email === normalizedEmail) {
    inMemoryActiveKey = null;
  }

  // 2. Đẩy tombstone lên Drive appDataFolder
  const driveConfig = getGoogleDriveConfig();
  if (driveConfig.accessToken && driveConfig.userEmail?.toLowerCase() === normalizedEmail) {
    try {
      await saveAppDataFile(driveConfig.accessToken, DRIVE_AI_CONFIG_FILENAME, tombstone);
    } catch (err) {
      console.warn("[aiKeyService] Lỗi đẩy tombstone xóa key lên Google Drive:", err);
    }
  }

  return true;
}

/**
 * Đồng bộ hóa hai chiều khi ứng dụng khởi động hoặc khi người dùng đăng nhập tài khoản Google
 */
export async function syncGeminiKeyOnLogin(accessToken: string, email: string): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!accessToken || !normalizedEmail) return "";

  try {
    const driveResult = await readAppDataFile<AiKeyConfig>(accessToken, DRIVE_AI_CONFIG_FILENAME);
    const localConfig = readLocalAiConfig(normalizedEmail);

    if (driveResult?.data) {
      const driveData = driveResult.data;
      const driveUpdatedAt = driveData.updatedAt || 0;
      const localUpdatedAt = localConfig?.updatedAt || 0;

      if (driveUpdatedAt >= localUpdatedAt) {
        // Drive là chân lý
        writeLocalAiConfig(normalizedEmail, driveData);
        if (!driveData.isDeleted && driveData.apiKey) {
          inMemoryActiveKey = { email: normalizedEmail, apiKey: driveData.apiKey };
          return driveData.apiKey;
        } else {
          inMemoryActiveKey = null;
          return "";
        }
      } else if (localConfig && !localConfig.isDeleted && localConfig.apiKey) {
        // Local mới hơn, đẩy ngược lên Drive
        await saveAppDataFile(accessToken, DRIVE_AI_CONFIG_FILENAME, localConfig);
        inMemoryActiveKey = { email: normalizedEmail, apiKey: localConfig.apiKey };
        return localConfig.apiKey;
      }
    } else if (localConfig && !localConfig.isDeleted && localConfig.apiKey) {
      // Trên Drive chưa có file, khởi tạo từ local
      await saveAppDataFile(accessToken, DRIVE_AI_CONFIG_FILENAME, localConfig);
      inMemoryActiveKey = { email: normalizedEmail, apiKey: localConfig.apiKey };
      return localConfig.apiKey;
    }
  } catch (err) {
    console.warn("[aiKeyService] Lỗi đồng bộ key khi đăng nhập:", err);
  }

  return getActiveGeminiKey(normalizedEmail);
}

/**
 * Kiểm tra tính hợp lệ của Gemini API Key:
 * Gọi trực tiếp tới Google Generative Language API (CORS mở 100%, không đi qua proxy để tránh lỗi 405)
 */
export async function verifyGeminiApiKey(apiKey: string): Promise<{ valid: boolean; message?: string }> {
  if (!apiKey || !apiKey.trim()) {
    return { valid: false, message: "Vui lòng nhập API Key." };
  }

  const trimmedKey = apiKey.trim();

  try {
    // 1. Kiểm tra trực tiếp tới Google Generative Language API qua phương thức GET
    const googleUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(trimmedKey)}`;
    const googleRes = await fetch(googleUrl);
    const googleJson = await googleRes.json().catch(() => ({}));

    if (googleRes.ok && googleJson.models) {
      return { valid: true, message: "Kết nối Google Gemini API thành công! Key đã sẵn sàng." };
    }

    // Nếu Google trả về lỗi
    let errMsg = googleJson?.error?.message || "API Key không hợp lệ hoặc đã bị vô hiệu hóa.";
    if (errMsg.includes("API key not valid")) {
      errMsg = "API Key không chính xác hoặc đã bị vô hiệu hóa trên Google AI Studio.";
    }
    return { valid: false, message: errMsg };
  } catch (err: any) {
    // 2. Dự phòng: Thử qua backend nếu kết nối trực tiếp bị chặn mạng
    try {
      const verifyUrl = getAppApiUrl("/api/verify-gemini-key");
      const res = await fetch(verifyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": trimmedKey,
        },
        body: JSON.stringify({ apiKey: trimmedKey }),
      });

      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        return { valid: true, message: "API Key hoạt động hoàn hảo!" };
      }
      return {
        valid: false,
        message: json.error || "API Key không hợp lệ.",
      };
    } catch (_) {
      return {
        valid: false,
        message: "Không thể kết nối đến máy chủ Google AI. Vui lòng kiểm tra lại kết nối mạng.",
      };
    }
  }
}
