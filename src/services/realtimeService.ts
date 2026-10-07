/**
 * Realtime Synchronization Service
 * Kết hợp WebSocket hai chiều (Instant Push) và Tab-Focus/Visibility Sync (Catch-up Sync)
 * Tương thích hoàn toàn với React StrictMode và Vite HMR (chống đóng/mở kết nối liên tục)
 */

export interface RealtimeChangeEvent {
  type: "DOCUMENT_CHANGED";
  folderId?: string;
  changeType: "create" | "update" | "delete" | "config";
  docNumber?: string;
  senderId?: string;
  timestamp: string;
}

interface RealtimeConfig {
  onDocumentChanged: (event: RealtimeChangeEvent) => void;
  getFolderId: () => string;
}

// Client session ID ngẫu nhiên để tránh xử lý lại tin nhắn do chính client này phát
const CLIENT_ID = "client_" + Math.random().toString(36).substring(2, 10);

let wsInstance: WebSocket | null = null;
let reconnectTimer: any = null;
let closeDebounceTimer: any = null;
let circuitBreakerCooldownTimer: any = null;
let subscribersCount = 0;
let currentConfig: RealtimeConfig | null = null;

// Circuit Breaker State (EFR-05)
let isCircuitBroken = false;
let abnormalCloseCount = 0;
const BACKOFF_DELAYS = [2000, 5000, 10000];
const CIRCUIT_BREAKER_COOLDOWN_MS = 5 * 60 * 1000; // 5 phút cooldown

function getWebSocketUrl(): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  return `${protocol}//${host}/api/realtime`;
}

/**
 * Đặt lại Circuit Breaker cho Realtime WebSocket (khi bấm nút Đồng bộ hoặc sau cooldown)
 */
export function resetRealtimeCircuitBreaker() {
  isCircuitBroken = false;
  abnormalCloseCount = 0;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (circuitBreakerCooldownTimer) {
    clearTimeout(circuitBreakerCooldownTimer);
    circuitBreakerCooldownTimer = null;
  }
  if (subscribersCount > 0) {
    connectWebSocket();
  }
}

/**
 * Lấy trạng thái Circuit Breaker hiện tại (cho mục đích kiểm thử / giám sát)
 */
export function getRealtimeCircuitStatus(): { isCircuitBroken: boolean; isBroken: boolean; abnormalCloseCount: number } {
  return {
    isCircuitBroken,
    isBroken: isCircuitBroken,
    abnormalCloseCount,
  };
}

/**
 * Khởi tạo kết nối WebSocket với Server (Singleton an toàn với React StrictMode)
 */
export function initRealtime(config: RealtimeConfig): () => void {
  currentConfig = config;
  subscribersCount++;

  // Nếu đang có lệnh đóng dở (do StrictMode unmount tạm), hủy ngay để giữ kết nối liên tục
  if (closeDebounceTimer) {
    clearTimeout(closeDebounceTimer);
    closeDebounceTimer = null;
  }

  connectWebSocket();

  // Trả về hàm cleanup khi unmount
  return () => {
    subscribersCount--;
    if (subscribersCount <= 0) {
      subscribersCount = 0;
      // Delay đóng 1000ms: nếu React StrictMode hoặc HMR remount ngay thì không ngắt kết nối
      closeDebounceTimer = setTimeout(() => {
        if (subscribersCount === 0 && wsInstance) {
          const socketToClose = wsInstance;
          wsInstance = null;
          if (socketToClose.readyState === WebSocket.OPEN) {
            socketToClose.close(1000, "Clean close");
          } else if (socketToClose.readyState === WebSocket.CONNECTING) {
            socketToClose.onopen = () => {
              socketToClose.close(1000, "Clean close");
            };
          }
        }
      }, 1000);
    }
  };
}

function connectWebSocket() {
  // Chốt chặn Circuit Breaker: nếu đã ngắt mạch, chặn ngay mọi đường gọi vào (EFR-05)
  if (isCircuitBroken) return;
  if (subscribersCount <= 0 && !currentConfig) return;

  // Nếu đang mở hoặc đang kết nối thì tái sử dụng
  if (
    wsInstance &&
    (wsInstance.readyState === WebSocket.CONNECTING ||
      wsInstance.readyState === WebSocket.OPEN)
  ) {
    return;
  }

  try {
    const wsUrl = getWebSocketUrl();
    const ws = new WebSocket(wsUrl);
    wsInstance = ws;

    ws.onopen = () => {
      // Kết nối thành công: reset bộ đếm lỗi
      abnormalCloseCount = 0;
      isCircuitBroken = false;
      if (circuitBreakerCooldownTimer) {
        clearTimeout(circuitBreakerCooldownTimer);
        circuitBreakerCooldownTimer = null;
      }

      // Đăng ký nhận thông báo cho Thư mục Google Drive hiện tại
      const folderId = currentConfig ? currentConfig.getFolderId() : "";
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            action: "join",
            folderId,
            clientId: CLIENT_ID,
          })
        );
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "DOCUMENT_CHANGED") {
          // Bỏ qua nếu tin nhắn xuất phát từ chính tab/client này
          if (data.senderId === CLIENT_ID) return;

          if (currentConfig && currentConfig.onDocumentChanged) {
            currentConfig.onDocumentChanged(data);
          }
        }
      } catch (err) {
        // Silent catch JSON parse
      }
    };

    ws.onclose = (event) => {
      wsInstance = null;
      // Nếu đóng bình thường từ client thì không reconnect
      if (event.code === 1000) {
        abnormalCloseCount = 0;
        return;
      }

      // Đóng bất thường: tăng bộ đếm lỗi
      abnormalCloseCount++;
      if (abnormalCloseCount >= 3) {
        isCircuitBroken = true;
        console.warn(
          "[Realtime] WebSocket đã đóng bất thường 3 lần liên tiếp. Kích hoạt Circuit Breaker, dừng kết nối lại để bảo vệ hệ thống."
        );
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }
        if (circuitBreakerCooldownTimer) clearTimeout(circuitBreakerCooldownTimer);
        circuitBreakerCooldownTimer = setTimeout(() => {
          console.info("[Realtime] Circuit Breaker: Thử phục hồi kết nối sau cooldown (Half-Open)...");
          resetRealtimeCircuitBreaker();
        }, CIRCUIT_BREAKER_COOLDOWN_MS);
        return;
      }

      // Tự động kết nối lại theo Exponential Backoff (2s, 5s, 10s)
      if (subscribersCount > 0 && !isCircuitBroken) {
        const delay = BACKOFF_DELAYS[abnormalCloseCount - 1] || 10000;
        if (reconnectTimer) clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(() => {
          connectWebSocket();
        }, delay);
      }
    };

    ws.onerror = () => {
      // Xử lý im lặng, onclose sẽ tự kích hoạt xử lý
    };
  } catch (err) {
    // Silent catch
  }
}

/**
 * Cập nhật folderId khi người dùng đổi thư mục Drive trong cấu hình
 */
export function updateRealtimeFolder(newFolderId: string) {
  if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
    wsInstance.send(
      JSON.stringify({
        action: "join",
        folderId: newFolderId,
        clientId: CLIENT_ID,
      })
    );
  }
}

/**
 * Phát tín hiệu thay đổi dữ liệu tới toàn bộ các thiết bị khác trong tích tắc (0.1s)
 */
export function broadcastDocumentChange(payload: {
  changeType: "create" | "update" | "delete" | "config";
  docNumber?: string;
  folderId?: string;
}) {
  if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
    wsInstance.send(
      JSON.stringify({
        action: "notify_change",
        ...payload,
        clientId: CLIENT_ID,
      })
    );
  } else {
    // Nếu WebSocket đang tạm ngắt, kích hoạt kết nối lại
    connectWebSocket();
  }
}

/**
 * Lắng nghe sự kiện bật sáng màn hình / chuyển tab (Tab-Focus & Visibility Sync)
 * Ngay khi người dùng mở khóa màn hình hoặc chạm tay quay lại app, tự động sync ngay
 */
export function setupVisibilityAndFocusSync(onActive: () => void): () => void {
  let lastSyncTime = 0;
  const THROTTLE_MS = 3000; // Tối thiểu cách nhau 3 giây giữa các lần tự động kích hoạt

  const handleTrigger = () => {
    const now = Date.now();
    if (now - lastSyncTime < THROTTLE_MS) return;
    lastSyncTime = now;

    // Đảm bảo WebSocket kết nối lại nếu bị suspend khi tắt màn hình
    if (!wsInstance || wsInstance.readyState !== WebSocket.OPEN) {
      connectWebSocket();
    }

    // Kích hoạt đồng bộ kiểm tra dữ liệu mới
    onActive();
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      handleTrigger();
    }
  };

  const handleFocus = () => {
    handleTrigger();
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("focus", handleFocus);

  return () => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("focus", handleFocus);
  };
}
