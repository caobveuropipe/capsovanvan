/**
 * Helper xác định đường dẫn API chính xác:
 * - Hỗ trợ cả Localhost trực tiếp (/)
 * - Hỗ trợ cả Reverse Proxy / Subpath Gateway trên Cloud (ví dụ: /app/cap-so-van-ban)
 */
export function getAppApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  if (typeof window === "undefined") {
    return cleanEndpoint;
  }

  const pathname = window.location.pathname;
  const appPrefix = "/app/cap-so-van-ban";
  if (pathname.startsWith(appPrefix)) {
    return `${appPrefix}${cleanEndpoint}`;
  }

  return cleanEndpoint;
}
