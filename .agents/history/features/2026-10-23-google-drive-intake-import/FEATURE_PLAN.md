# Feature Plan: Nhập văn bản trực tiếp từ Google Drive vào Tiếp nhận văn bản

> **Trạng thái**: 🎉 HOÀN THÀNH - ĐÃ NGHIỆM THU PHƯƠNG ÁN A  
> **Review gate**: Đã qua hội đồng review kỹ thuật (`EXPERT_REVIEW.md`), đã triển khai và hoàn tất kiểm thử E2E  
> **Phương án chốt**: Phương án A (Nút chọn tệp Drive tích hợp trong tab "Tải tệp", tab bar 2 tabs tinh gọn)  
> **Feature slug**: `google-drive-intake-import`  
> **Tạo bởi**: feature-plan  
> **Ngày cập nhật**: 2026-10-23  

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Hiện tại hệ thống đã liên kết tài khoản Google và cấp quyền truy cập Google Drive (`https://www.googleapis.com/auth/drive`), nhưng trong modal **Tiếp nhận văn bản** (`IntakeModal.tsx`), người dùng chỉ có thể tải tệp từ máy tính cục bộ (UPLOAD) hoặc chụp ảnh qua camera (CAMERA). Nếu văn bản/scan đã được scan và lưu trên Google Drive của cơ quan hoặc cá nhân, người dùng phải tải về máy rồi mới upload lại lên hệ thống.
- **Vấn đề cần giải quyết:** Tốn thao tác trung gian tải về - tải lên; chưa tận dụng được kết nối Google Drive sẵn có của tài khoản đã đăng nhập. Đồng thời, cần đánh giá trải nghiệm thực tế giữa 2 phương án thiết kế giao diện (nút tích hợp trong tab Tải tệp vs. tab Google Drive độc lập).
- **Mục tiêu:** Cho phép người dùng duyệt và chọn trực tiếp file văn bản (PDF, ảnh JPG/PNG/WEBP) từ Google Drive để nạp vào hệ thống tiếp nhận, trích xuất OCR và cấp số tự động. Cung cấp một **bong bóng chuyển đổi giao diện (Floating UX Switcher Pill)** để User thử nghiệm thực tế cả 2 phương án thiết kế trước khi chốt bản chính thức.
- **Kết quả mong đợi:** 
  1. Người dùng chọn được file từ Google Drive, dữ liệu được tải vào danh sách trang văn bản (`DocumentImage[]`).
  2. Có nút/bong bóng chuyển đổi qua lại giữa Phương án A (Nút trong tab Tải tệp) và Phương án B (Tab thứ 3 riêng biệt) ngay trong modal.
  3. Luồng OCR Gemini và cấp số hoạt động hoàn toàn đồng nhất với các nguồn tải tệp truyền thống.

---

## 2. Phạm vi

### In scope
- Bổ sung hàm API đọc nội dung tệp nhị phân từ Google Drive (`downloadDriveFileAsBlob` / `readDriveFileAsBase64`) trong `src/services/googleDriveService.ts`.
- Xây dựng component duyệt / chọn file Google Drive (`DriveFileSelectorModal.tsx` hoặc sub-view) hỗ trợ lọc MIME type (PDF, ảnh), tìm kiếm theo tên tệp và duyệt thư mục.
- Cập nhật `src/components/IntakeModal.tsx`:
  - **Phương án A:** Bổ sung nút `[ ☁️ Chọn từ Google Drive ]` trong khu vực kéo thả tệp của tab "Tải tệp".
  - **Phương án B:** Bổ sung tab thứ 3 `[ ☁️ Google Drive ]` trên thanh chọn nguồn tiếp nhận (`grid-cols-3`).
  - **Bong bóng chuyển đổi (Floating UX Switcher):** Nút/pill nổi ghim linh hoạt trên modal cho phép chuyển đổi tức thì giữa Layout A và Layout B để người dùng thẩm định.
<!-- Sửa theo EFR-02: Chuẩn hóa contract xử lý tệp PDF từ Drive: nạp nguyên vẹn tài liệu PDF đính kèm, dùng pdf-lib sẵn có đọc số trang chính xác cho UI, Gemini OCR xử lý trực tiếp MIME application/pdf -->
- Cơ chế nạp dữ liệu: Convert tệp từ Drive thành `DocumentImage` (ảnh JPG/PNG hoặc tệp tài liệu PDF đính kèm nguyên bản; sử dụng `pdf-lib` đã có trong dự án để đọc số trang thực tế mà không cần thêm thư viện canvas nặng).
<!-- Sửa theo EFR-01 (Vòng 2, 3, 4 & 5): Phân tách rõ ràng ID nguồn Drive (provenance) khỏi ID asset do hệ thống quản lý, bảo toàn provenance khi biên dịch ảnh tổng hợp, hỗ trợ batch trộn PDF + ảnh không mất file, chặn cấp số nếu có tệp lỗi và bảo vệ file gốc người dùng khi xóa record -->
- Quản lý định danh và vòng đời tệp: Bổ sung `sourceDriveFileId`, `sourceDriveFileIds?: string[]` và `driveAssetOwnership: "EXTERNAL_REFERENCE" | "MANAGED"`. Khi biên dịch tệp tổng hợp (`compileImagesToPdf`), sử dụng `pdf-lib` để sao chép nguyên vẹn trang của tệp PDF đính kèm song song với nhúng ảnh (tránh mất file PDF khi nạp batch trộn); áp dụng quy tắc giao dịch nghiêm ngặt: nếu bất kỳ file nào trong batch bị lỗi/khóa/hỏng, dừng ngay lập tức và ném lỗi rõ ràng (không âm thầm bỏ qua rồi lưu bản thiếu trang). Khi `autoUpload` bật, hệ thống tạo bản sao lưu trữ chuẩn hóa theo số hiệu vào thư mục chung của cơ quan; khi xóa văn bản (`handleDeleteDocument`), dọn dẹp toàn bộ danh sách file do hệ thống quản lý (`MANAGED`) thông qua `driveFileIds` trên Tombstone, tuyệt đối không đụng vào tệp gốc của người dùng (`EXTERNAL_REFERENCE`).
<!-- Sửa theo Round 3, 4 & 5 EFR-02: Đồng bộ hóa metadata tham chiếu ngoài (external reference) trong serializer registry Drive và bảo toàn hiển thị đa thiết bị -->
- Đồng bộ hóa đa thiết bị & Registry: Bổ sung serialize `sourceDriveFileId`, `sourceDriveFileIds`, `driveAssetOwnership` và `driveWebViewLink` trong `sanitizeDatabasePayload` của `googleDriveService.ts`. Đối với trường hợp nhiều ảnh ghép PDF khi `autoUpload: false`, lưu giữ metadata của từng ảnh nguồn để các thiết bị khác khi đồng bộ về vẫn mở xem được từng trang qua Drive preview link của từng file nguồn. Nếu có file cục bộ trong batch trộn khi `autoUpload: false`, `IntakeModal` hiển thị thông báo lưu ý và `DocumentDetailModal` hiển thị nhãn trạng thái rõ ràng ("Tệp lưu cục bộ trên thiết bị gốc") trên máy thứ hai thay vì khung xem rỗng.
<!-- Sửa theo EFR-03 (Vòng 2 & 3): Mở rộng IntakeSource thêm "DRIVE" và đồng bộ hiển thị toàn diện trên giao diện -->
- Nguồn tiếp nhận dữ liệu & Thống kê: Mở rộng kiểu dữ liệu `IntakeSource` thêm `"DRIVE"`. Bất kể người dùng chọn file qua Phương án A (nút trong tab Tải tệp) hay Phương án B (tab Google Drive riêng), bản ghi đều được gắn `intakeSource: "DRIVE"` chính xác. Đồng thời, đồng bộ hiển thị icon/nhãn/bộ lọc nguồn "Google Drive" trên Kho lưu trữ (`DocumentArchiveView`), Phiếu in văn bản (`PrintDocumentModal`), và Biểu đồ thống kê (`DashboardStats`).

### Out of scope
- Chưa xử lý đồng bộ realtime hai chiều các chỉnh sửa file trên Drive (chỉ pull nội dung tại thời điểm tiếp nhận).
- Chưa can thiệp vào các nguồn văn bản khác ngoài IntakeModal (như phục hồi backup JSON từ Drive - đã có ở module khác).

---

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:**
  - Quyết định ngày 2026-10-16: Đã có sẵn Google Identity Services token với scope `https://www.googleapis.com/auth/drive`, sử dụng cơ chế token hiện hữu trong `googleDriveService.ts`, không yêu cầu người dùng cấp thêm scope mới.
  - Xử lý OCR với Gemini Flash SDK thông qua `executeDirectGoogleOcr` hoặc server endpoint chuẩn hóa.
- **"Cấm kỵ" cần tránh:**
  - Không hardcode API keys hoặc token; luôn lấy qua `getGoogleDriveConfig()` và kiểm tra `isDriveTokenExpired`.
  - Không phá vỡ cấu trúc state hiện tại của `IntakeModal` (giữ nguyên flow cấp số, validation form, combobox options).
  - Tránh làm lag hoặc mất dữ liệu đã nhập trong form khi người dùng bấm bong bóng chuyển đổi layout.

---

## 4. Giả định và câu hỏi mở

### Giả định
- Tài khoản người dùng đang đăng nhập có quyền đọc các tệp văn bản trên Google Drive (thư mục lưu trữ hệ thống hoặc My Drive cá nhân).
- Kích thước tệp văn bản phổ biến từ Google Drive dưới 25MB (đảm bảo tải nhanh vào client mà không nghẽn bộ nhớ trình duyệt).

### Câu hỏi mở
- [Non-blocking] Sau khi người dùng duyệt xong 2 phương án và chốt phương án chính thức, bong bóng chuyển đổi sẽ được gỡ bỏ để giữ giao diện tối giản.

---

## 5. Acceptance Criteria

- [ ] Người dùng chưa đăng nhập Google hoặc hết hạn token sẽ nhận được thông báo/gợi ý gia hạn phiên kết nối Google trước khi mở Drive.
- [ ] Giao diện có **Bong bóng chuyển đổi giao diện** (Floating Pill) hiển thị rõ ràng, cho phép bấm chuyển giữa **Phương án A (Tích hợp trong Tải tệp)** và **Phương án B (Tab Google Drive riêng)**.
- [ ] Khi chuyển đổi giữa 2 layout, toàn bộ dữ liệu đang nhập (tiêu đề, loại văn bản, ảnh đã chọn) **không bị mất**.
<!-- Sửa theo EFR-02: Chuẩn hóa hiển thị PDF và tính số trang thực tế qua pdf-lib -->
- [ ] Chọn thành công tệp từ Google Drive: hiển thị rõ tên tệp, thumbnail (đối với ảnh) hoặc icon định dạng tài liệu, và số trang chính xác (được tính bằng `pdf-lib` cho tệp PDF).
- [ ] Luồng AI OCR nhận diện đúng nội dung trích yếu, cơ quan ban hành, số hiệu từ file tải từ Drive (hỗ trợ cả ảnh và tài liệu PDF).
<!-- Sửa theo EFR-01 (Vòng 2, 3, 4 & 5): Bảo vệ tệp gốc người dùng, an toàn khi ghép trộn PDF + ảnh, chặn cấp số nếu có tệp hỏng và quản lý asset an toàn -->
- [ ] Cấp số và lưu văn bản thành công vào kho lưu trữ với `intakeSource: "DRIVE"`. Nếu nạp batch trộn cả file PDF và ảnh, nội dung tệp PDF không bị mất; nếu có tệp PDF bị lỗi/khóa, hệ thống chặn lưu và thông báo lỗi rõ ràng thay vì âm thầm lưu thiếu trang. Nếu `autoUpload` bật, hệ thống tạo bản sao lưu trữ chuẩn hóa theo số hiệu vào thư mục chung của cơ quan; khi xóa văn bản có nhiều asset, toàn bộ danh sách managed asset trên Drive đều được dọn dẹp sạch sẽ, tuyệt đối không xóa/chuyển thùng rác tệp gốc của người dùng trên Drive.
<!-- Sửa theo Round 3, 4 & 5 EFR-02: Phục hồi và hiển thị khi đồng bộ đa thiết bị -->
- [ ] Khi đồng bộ registry lên Drive (ngay cả khi `autoUpload: false`), metadata nguồn `sourceDriveFileId` và `driveWebViewLink` được bảo toàn; thiết bị khác có thể mở xem văn bản qua liên kết Drive của các tệp nguồn. Đối với các file cục bộ không tải lên Drive, hiển thị rõ trạng thái lưu cục bộ trên thiết bị thứ hai.
<!-- Sửa theo EFR-03 (Vòng 2 & 3): Ghi nhận intakeSource chuẩn xác cho cả Phương án A và B, hiển thị đồng bộ trên mọi màn hình -->
- [ ] Cả hai phương án giao diện A và B đều ghi nhận đúng nguồn gốc `intakeSource = "DRIVE"` vào bản ghi và nhật ký tiếp nhận.
- [ ] Nguồn "Google Drive" được hiển thị đúng nhãn/icon trên Kho lưu trữ (`DocumentArchiveView`), có thể lọc riêng theo nguồn Drive, hiển thị chuẩn trong Phiếu in (`PrintDocumentModal`), và được tính vào Biểu đồ thống kê (`DashboardStats`).

---

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `src/services/googleDriveService.ts` | Sửa | Thêm hàm `downloadDriveFileContent` / `listDocumentFilesFromDrive`, escape search query; serialize `sourceDriveFileId`/ownership trong `sanitizeDatabasePayload` | 🟢 Thấp | Giữ nguyên API cũ |
| `src/utils/pdfGenerator.ts` | Sửa | Hỗ trợ sao chép trang PDF (`copyPages`) bên cạnh ảnh canvas khi biên dịch PDF để không làm mất tệp PDF trong batch trộn | 🟢 Thấp | Tương thích ngược |
| `src/components/DriveFileSelectorModal.tsx` | Tạo mới | Modal duyệt danh sách file/tìm kiếm trên Google Drive của người dùng | 🟢 Thấp | Độc lập |
| `src/components/IntakeModal.tsx` | Sửa | Tích hợp 2 phương án giao diện, nạp file từ Drive, thêm Floating Switcher Pill, xử lý `intakeSource: "DRIVE"` | 🟡 Trung bình | Cần bảo toàn state form |
| `src/types.ts` | Sửa | Mở rộng `IntakeSource` thêm `"DRIVE"`, thêm `sourceDriveFileId`, `sourceDriveFileIds`, `driveAssetOwnership`; mở rộng `TombstoneRecord` thêm `driveFileIds?: string[]` | 🟢 Thấp | Tương thích ngược |
| `src/App.tsx` | Sửa | Bảo toàn provenance khi biên dịch PDF; dọn dẹp toàn bộ danh sách managed asset IDs khi xóa văn bản (`handleDeleteDocument` và tombstone retry) | 🟡 Trung bình | Bảo vệ an toàn dữ liệu người dùng |
| `src/components/DocumentDetailModal.tsx` | Sửa | Hỗ trợ fallback xem tài liệu qua `driveWebViewLink`/`sourceDriveFileId` khi không có local `dataUrl` | 🟢 Thấp | Trải nghiệm đa thiết bị |
| `src/components/DocumentArchiveView.tsx` | Sửa | Thêm icon, nhãn "Google Drive" và tab lọc nguồn `DRIVE` | 🟢 Thấp | Hiển thị nhất quán |
| `src/components/PrintDocumentModal.tsx` | Sửa | Hiển thị phương thức tiếp nhận "Tiếp nhận trực tiếp từ Google Drive" | 🟢 Thấp | Mẫu in chuẩn hóa |
| `src/components/DashboardStats.tsx` | Sửa | Thống kê số lượng và tỷ lệ văn bản tiếp nhận từ nguồn `DRIVE` | 🟢 Thấp | Thống kê đầy đủ |

---

## 7. Risk Triage và Review Focus

- **Review required:** Yes (Khuyến nghị chạy `feature-review`)
- **Risk hotspots:**
  - Quản lý tải tệp kích thước lớn từ Drive về Blob/DataURL mà không làm đơ UI (cần hiển thị spinner / progress loading).
  - Chuyển đổi giữa 2 phương án giao diện không được reset form state ngoài ý muốn.
- **Review focus areas:**
  - Token handling: Đảm bảo kiểm tra và tự động renew session nếu token hết hạn khi mở Drive.
  - Trải nghiệm responsive trên mobile của cả 2 layout.

---

## 8. Chiến lược triển khai

- **Phase strategy:** 3 Phase tinh gọn
  - **Phase 1: Service Layer & Drive File Selector Component** (Chuẩn bị API tải file Drive và modal chọn tệp).
  - **Phase 2: Tích hợp 2 Phương án UI & Bong bóng chuyển đổi trong `IntakeModal`** (Dựng layout A, layout B, gắn Floating Switcher).
  - **Phase 3: E2E Integration, OCR Testing & User Feedback Gate** (Kiểm thử nạp file, quét AI OCR, lưu cấp số và nghiệm thu cùng User).

---

## 9. Test Strategy

- **Test harness:** Chạy local dev server (`npm run dev`), test trực tiếp trên trình duyệt với tài khoản Google thực tế.
- **Automated / Manual verification:**
  - Case 1: Bấm bong bóng chuyển đổi kiểm tra xem giao diện đổi mượt mà giữa Phương án A và B không.
  - Case 2: Tìm kiếm và chọn 1 file PDF từ Drive $\rightarrow$ kiểm tra nạp thành công các trang ảnh.
  - Case 3: Chọn 1 file ảnh PNG/JPG từ Drive $\rightarrow$ kiểm tra hiển thị thumbnail.
  - Case 4: Kích hoạt nút "Quét AI & Tự động trích yếu" $\rightarrow$ kiểm tra OCR trích xuất chính xác.
  - Case 5: Bấm cấp số $\rightarrow$ kiểm tra văn bản được lưu trữ thành công.

---

## 10. Rollback Plan

- Nếu có lỗi phát sinh, giao diện tự động fallback về tab "Tải tệp" truyền thống. Các thay đổi tập trung trong nhánh feature hoặc có thể hoàn tác mã nguồn nhanh chóng qua Git mà không ảnh hưởng cơ sở dữ liệu local.

---

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
