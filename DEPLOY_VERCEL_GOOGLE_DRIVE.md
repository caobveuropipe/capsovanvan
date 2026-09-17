# HƯỚNG DẪN TRIỂN KHAI VERCEL & TÍCH HỢP GOOGLE DRIVE BYOS

Hệ thống đã được thiết kế sẵn sàng theo mô hình **Multi-Tenant BYOS (Bring Your Own Storage)**:
- **Mã nguồn**: Quản lý trên **GitHub**.
- **Hosting & Tên miền**: Triển khai tự động trên **Vercel** (`https://ten-du-an.vercel.app` hoặc tên miền riêng miễn phí).
- **Lưu trữ tài liệu**: Trực tiếp trên **Google Drive** của từng người dùng thông qua tài khoản Gmail của họ.

---

## BƯỚC 1: ĐƯA LÊN GITHUB & DEPLOY LÊN VERCEL (1 Click)

1. **Đẩy mã nguồn lên GitHub**:
   ```bash
   git add .
   git commit -m "feat: add personal Google Drive BYOS storage and Vercel serverless integration"
   git push origin main
   ```

2. **Kết nối dự án với Vercel**:
   - Truy cập: [https://vercel.com](https://vercel.com) và đăng nhập bằng tài khoản **GitHub**.
   - Bấm **"Add New..."** -> Chọn **"Project"**.
   - Chọn kho lưu trữ `caobveuropipe/capsovanvan` (hoặc tên repo của anh).
   - Trong mục **Environment Variables** (Biến môi trường) trên Vercel, thêm biến:
     - `GEMINI_API_KEY`: *(Dán API Key Gemini của anh vào)*
   - Bấm **Deploy**.
   - Sau ~1 phút, Vercel sẽ cấp cho anh 1 đường link công khai (ví dụ: `https://capsovanban.vercel.app`).

---

## BƯỚC 2: TẠO GOOGLE CLIENT ID ĐỂ NGƯỜI DÙNG ĐĂNG NHẬP DRIVE CÁ NHÂN

Để người dùng có thể kết nối Drive của họ, cần 1 **OAuth 2.0 Client ID** từ Google Cloud Console (hoàn toàn miễn phí):

1. Truy cập [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
2. Tạo một Project mới (Ví dụ: `DocNum-Platform`).
3. Vào menu **APIs & Services** -> **Library** -> Tìm và bật **Google Drive API**.
4. Vào mục **OAuth consent screen**:
   - Chọn User Type: **External** (để người dùng bất kỳ dùng Gmail đều đăng nhập được).
   - Nhập tên ứng dụng: `DocNum AI - Sổ Văn Bản`.
   - Chọn các Scopes: `.../auth/drive.file`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`.
5. Vào mục **Credentials** -> **Create Credentials** -> **OAuth client ID**:
   - Application type: **Web application**.
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` *(Dành cho test local)*
     - `https://ten-du-an.vercel.app` *(Link Vercel của anh)*
6. Copy mã **Client ID** (dạng `xxxx-yyyy.apps.googleusercontent.com`).

---

## BƯỚC 3: TRẢI NGHIỆM TRÊN HỆ THỐNG

1. Mở trang web (local hoặc trên Vercel).
2. Trên thanh điều hướng (Navbar), bấm vào nút **"Google Drive"**.
3. Dán **Google Client ID** đã tạo ở Bước 2.
4. Bấm **"Kết nối Google Drive"**:
   - Cửa sổ Google Popup xuất hiện -> Người dùng chọn Gmail cá nhân và cấp quyền.
   - Hệ thống tự động tạo thư mục `[VCC] Sổ Văn Bản Điện Tử` trên Drive của người đó.
   - Người dùng cũng có thể dán `Folder ID` của thư mục có sẵn nếu muốn lưu vào folder riêng biệt.
5. **Tiếp nhận & Cấp số**:
   - Người dùng tải văn bản/ảnh scan lên -> AI OCR đọc tự động.
   - Bấm **"Xác nhận cấp số & Lưu trữ"**:
     - File scan được đẩy thẳng lên thư mục Google Drive của họ.
     - Trả về link Google Drive xem trực tiếp ngay trên thẻ văn bản và trong cửa sổ chi tiết.
