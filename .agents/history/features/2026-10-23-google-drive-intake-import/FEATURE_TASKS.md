# Feature Tasks: Nhập văn bản trực tiếp từ Google Drive vào Tiếp nhận văn bản

> **Trạng thái**: 🔄 Đang thực hiện  
> **Liên kết plan**: `FEATURE_PLAN.md`  
> **Ngày tạo**: 2026-10-23  

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

---

## Phase 1: Service Layer & Trình chọn tệp Google Drive

**Mục tiêu:** Xây dựng hàm kết nối Google Drive API để tìm kiếm, liệt kê và tải nội dung tệp nhị phân, cùng component modal chọn tệp.

- [x] Task 1.1: Bổ sung các hàm helper trong `src/services/googleDriveService.ts`:
  - `listDocumentFilesFromDrive(accessToken, query, folderId)`: Liệt kê các file tài liệu, có bộ lọc chuẩn MIME (`mimeType = 'application/pdf' or mimeType contains 'image/'`) tránh lỗi file Google Docs thuần (`FR-03`), đồng thời chuẩn hóa/escape ký tự đặc biệt trong câu truy vấn `query`.
  - `downloadDriveFileContent(accessToken, fileId, mimeType)`: Tải nội dung nhị phân từ Drive qua `?alt=media` và chuyển đổi thành base64 data URL.
- [x] Task 1.2: Tạo component `src/components/DriveFileSelectorModal.tsx`:
  - Cho phép người dùng tìm kiếm theo tên tệp, chọn thư mục hoặc xem danh sách tệp gần đây trên Google Drive.
  - Kiểm tra `isDriveTokenExpired`: nếu token hết hạn hoặc gặp lỗi 401, tự động hiển thị nút 1-chạm gia hạn phiên kết nối Google Drive (`FR-01`).
  <!-- Sửa theo EFR-01: Gán sourceDriveFileId provenance và link xem trước gốc, không nhầm lẫn với asset hệ thống sở hữu -->
  - Gán `sourceDriveFileId: file.id`, `driveWebViewLink: file.webViewLink`, `driveThumbnailLink: file.thumbnailLink` vào metadata tệp chọn (`EFR-01`, `FR-02`).
  - Hiển thị spinner loading khi tải danh sách và khi tải nội dung tệp được chọn.
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Bắt buộc)
  - Kiểm tra gọi API Google Drive lấy danh sách file và tải thành công nội dung 1 file test về client dạng dataUrl.

---

## Phase 2: Tích hợp 2 Phương án Giao diện & Bong bóng chuyển đổi trong `IntakeModal`

**Mục tiêu:** Triển khai cả Phương án A và B trong `IntakeModal.tsx`, kèm theo Floating Switcher Pill cho phép người dùng click đổi qua lại tức thì, chuẩn hóa data contract và an toàn asset.

<!-- Sửa theo EFR-01, EFR-02, EFR-03: Cập nhật types, contract tệp PDF và nguồn intakeSource -->
- [x] Task 2.1: Mở rộng `src/types.ts` và chuẩn hóa state nạp file trong `src/components/IntakeModal.tsx`:
  - Bổ sung `"DRIVE"` vào kiểu `IntakeSource` trong `src/types.ts` (`EFR-03`).
  - Bổ sung `sourceDriveFileId?: string;` và `driveAssetOwnership?: "EXTERNAL_REFERENCE" | "MANAGED";` trong `DocumentImage` và `DocumentRecord` (`EFR-01`).
  - Mở rộng `TombstoneRecord` thêm `driveFileIds?: string[];` để dọn dẹp triệt để mọi managed asset khi xóa record (`Round 4 EFR-03`).
  - State `driveUxMode: "INLINE_BUTTON" | "SEPARATE_TAB"` (mặc định "INLINE_BUTTON").
  - Xử lý tệp PDF từ Drive: nạp nguyên vẹn tệp PDF đính kèm (`mimeType: 'application/pdf'`), sử dụng `pdf-lib` đọc số trang thực tế để cập nhật badge số trang và nhãn UI chuẩn xác (`EFR-02`).
  - Xử lý nguồn tiếp nhận: Khi tiếp nhận file từ Drive (cả Phương án A và B), gán `intakeSource: "DRIVE"` vào bản ghi văn bản (`EFR-03`).
- [x] Task 2.2: Triển khai **Phương án A (Tích hợp trong tab Tải tệp)**:
  - Bổ sung nút `[ ☁️ Chọn từ Google Drive ]` trong khu vực kéo thả tệp.
- [x] Task 2.3: Triển khai **Phương án B (Tab Google Drive riêng)**:
  - Bổ sung tab thứ 3 trên thanh nguồn tiếp nhận (`grid-cols-3` thay vì `grid-cols-2`).
  - Giao diện tab Google Drive hiển thị nút mở Drive / khung duyệt file trực quan.
- [x] Task 2.4: Tạo **Bong bóng chuyển đổi giao diện (Floating Switcher Pill)**:
  - Đặt ở vị trí trang trọng, tinh tế cạnh tiêu đề tab hoặc góc header, tối ưu hiển thị không che khuất thao tác trên mobile (`FR-04`).
  - Cho phép bấm 1 click để toggle giữa Phương án A và Phương án B.
  - Đảm bảo giữ nguyên các dữ liệu form đã nhập khi toggle.
<!-- Sửa theo EFR-01, EFR-02, EFR-03 (Vòng 2, 3, 4 & 5): Xử lý biên dịch an toàn PDF + ảnh, bảo toàn đa thiết bị và dọn dẹp triệt để managed asset -->
- [x] Task 2.5: Cập nhật luồng biên dịch, lưu trữ và xóa văn bản trong `src/utils/pdfGenerator.ts` & `src/App.tsx`:
  - Trong `compileImagesToPdf` (`src/utils/pdfGenerator.ts`): hỗ trợ batch trộn cả PDF và ảnh; với tệp PDF, sử dụng `pdfDoc.copyPages` từ `pdf-lib` để sao chép nguyên vẹn trang, tránh lỗi nạp canvas `Image()` gây nuốt mất tệp PDF (`Round 4 EFR-01`). **Áp dụng cơ chế fail-fast nghiêm ngặt**: không âm thầm bắt lỗi rồi bỏ qua item bị hỏng/khóa; nếu bất kỳ trang hoặc tệp nào không đọc/sao chép được, ném ngoại lệ chỉ rõ tên tệp lỗi để chặn cấp số lưu thiếu trang (`Round 5 EFR-01`).
  - Trước khi biên dịch PDF trong `src/App.tsx`: trích xuất danh sách `sourceDriveFileId` của các ảnh nguồn và gán vào `docToSave.sourceDriveFileIds`, đồng thời gán vào item PDF biên dịch (`Round 3 EFR-01`). Nếu `autoUpload: false`, bảo toàn danh sách `DocumentImage` nguồn kèm Drive metadata để các client khác xem được từng trang qua Drive preview (`Round 4 EFR-02`).
  - Khi lưu văn bản với `autoUpload: true`: tạo bản sao lưu trữ chuẩn hóa theo số hiệu vào thư mục chung của cơ quan, đánh dấu `driveAssetOwnership: "MANAGED"`.
  - Trong `handleDeleteDocument` và `cleanPendingTombstones`: thu thập toàn bộ danh sách managed asset IDs của văn bản, dọn dẹp tất cả các asset này trên Drive và ghi đầy đủ vào `tombstone.driveFileIds` nếu cần retry; tuyệt đối không bỏ sót asset thứ hai trở đi và không xóa file gốc người dùng (`Round 4 EFR-03`).
<!-- Sửa theo Round 3, 4 & 5 EFR-02: Đồng bộ hóa Registry Google Drive & Đa thiết bị -->
- [x] Task 2.6: Đồng bộ hóa Registry Google Drive & Đa thiết bị:
  - Cập nhật `sanitizeDatabasePayload` trong `src/services/googleDriveService.ts` để bảo toàn các trường `sourceDriveFileId`, `sourceDriveFileIds`, `driveAssetOwnership` và `driveWebViewLink` vào payload đồng bộ Drive registry (`Round 3 EFR-02`).
  - Cập nhật `src/components/IntakeModal.tsx`: bổ sung cảnh báo lưu ý khi người dùng nạp file cục bộ lẫn file Drive trong khi tắt `autoUpload` (`Round 5 EFR-02`).
  - Cập nhật `src/components/DocumentDetailModal.tsx` để hỗ trợ fallback mở xem tài liệu trực tiếp qua `driveWebViewLink` hoặc Drive API khi xem từ thiết bị khác không có local `dataUrl` (`Round 3 EFR-02`); đối với tệp cục bộ không có trên Drive, hiển thị thông báo rõ ràng "Tệp lưu cục bộ trên thiết bị gốc" (`Round 5 EFR-02`).
<!-- Sửa theo Round 3 EFR-03: Đồng bộ hiển thị nguồn DRIVE trên toàn bộ giao diện -->
- [x] Task 2.7: Đồng bộ hiển thị nguồn `DRIVE` trên các màn hình hiển thị:
  - Cập nhật `src/components/DocumentArchiveView.tsx`: thêm icon `Cloud`, nhãn "Google Drive" và tab lọc nguồn `DRIVE` trong bộ lọc nguồn (`Round 3 EFR-03`).
  - Cập nhật `src/components/PrintDocumentModal.tsx`: bổ sung ánh xạ phương thức tiếp nhận cho `"DRIVE"` thành `"Tiếp nhận trực tiếp từ Google Drive"` (`Round 3 EFR-03`).
  - Cập nhật `src/components/DashboardStats.tsx`: bổ sung tính toán và hiển thị số lượng/tỷ lệ văn bản từ nguồn `DRIVE` (`driveCount`, `drivePct`) (`Round 3 EFR-03`).
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Bắt buộc)
  - Thử click đổi qua lại giữa Phương án A và B trên cả màn hình máy tính và thiết bị di động.
  - Kiểm tra tệp PDF nạp từ Drive hiển thị đúng số trang thực tế từ `pdf-lib`.
  - Kiểm tra nạp batch trộn cả 1 PDF và 1 ảnh: biên dịch thành công mà không làm mất trang PDF (`Round 4 EFR-01`).
  - Kiểm tra ghép nhiều ảnh Drive thành PDF vẫn giữ nguyên danh sách `sourceDriveFileIds`.
  - Xác nhận form không bị giật lag và không bị mất dữ liệu khi đổi qua lại.

---

## Phase 3: E2E Integration, OCR Testing & User Feedback Gate

**Mục tiêu:** Kiểm thử toàn diện quy trình: Chọn từ Drive $\rightarrow$ OCR AI $\rightarrow$ Cấp số $\rightarrow$ Lưu trữ, và thu thập ý kiến chốt phương án.

- [x] Task 3.1: Kiểm thử luồng OCR AI từ tệp tải qua Google Drive (ảnh chụp/scan, PDF nhiều trang).
- [x] Task 3.2: Kiểm thử cấp số văn bản tự động:
  - Kiểm tra `intakeSource: "DRIVE"` cho cả Phương án A & B, hiển thị đồng bộ trên Kho lưu trữ/Phiếu in/Dashboard.
  - Kiểm tra batch trộn PDF + ảnh giữ nguyên đầy đủ nội dung (`Round 4 EFR-01`).
  - Kiểm tra batch có tệp PDF lỗi/khóa: hệ thống dừng và báo lỗi, không lưu bản thiếu trang (`Round 5 EFR-01`).
  - Kiểm tra đồng bộ registry khi `autoUpload: false` và mở xem file trên client khác, hiển thị đúng thông báo tệp cục bộ (`Round 4 & 5 EFR-02`).
  - Kiểm tra xóa văn bản có từ 2 managed asset trở lên: toàn bộ file managed asset được dọn dẹp sạch sẽ, không xóa tệp gốc người dùng (`Round 4 EFR-03`).
- [x] Task 3.3: Demo cho User trải nghiệm 2 phương án thông qua bong bóng chuyển đổi để User chốt phương án ưng ý nhất.
- [x] Task 3.Final: 🧪 Test & Verify Phase 3 (Bắt buộc)
  - Toàn bộ flow chạy trơn tru, không có lỗi console, sẵn sàng cho nghiệm thu.

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-10-23 10:10 | Khởi tạo | Task Init | Tạo kế hoạch triển khai 2 phương án kèm switcher pill | done | Chờ User duyệt plan |
| 2026-10-23 12:40 | Rebuttal | Round 2 Rebuttal | Tiếp thu 3 finding từ Codex Desktop (EFR-01, 02, 03), bổ sung task ownership asset, PDF contract & intakeSource | done | Cập nhật plan & tasks hoàn tất |
| 2026-10-23 12:48 | Rebuttal | Round 3 Rebuttal | Tiếp thu 3 finding mới từ Codex Desktop (EFR-01 provenance ghép ảnh, EFR-02 registry serializer đa thiết bị, EFR-03 đồng bộ Archive/Print/Dashboard) | done | Cập nhật Task 2.5, thêm Task 2.6, 2.7 |
| 2026-10-23 13:52 | Rebuttal | Round 4 Rebuttal | Tiếp thu 3 finding từ Codex Desktop (EFR-01 batch trộn PDF+ảnh, EFR-02 phục hồi đa thiết bị khi autoUpload tắt, EFR-03 dọn dẹp đa managed asset) | done | Cập nhật Task 2.1, 2.5, 3.2 |
| 2026-10-23 14:14 | Rebuttal | Round 5 Rebuttal | Tiếp thu 2 finding từ Codex Desktop (EFR-01 fail-fast khi compile tệp lỗi, EFR-02 hiển thị trạng thái tệp cục bộ đa thiết bị khi tắt autoUpload) | done | Cập nhật Task 2.5, 2.6, 3.2 |
| 2026-10-23 14:35 | Phase 1 | Task 1.1 - 1.Final | Xây dựng helper Drive API, component `DriveFileSelectorModal.tsx` | done | Hỗ trợ tìm kiếm, phân trang thư mục, filter MIME, renew session 1-chạm |
| 2026-10-23 14:45 | Phase 2 | Task 2.1 - 2.Final | Tích hợp PA A & PA B vào `IntakeModal`, Switcher Pill, PDF copyPages fail-fast, Multi-Asset Tombstone, đồng bộ Archive/Print/Dashboard | done | `tsc --noEmit` đạt 0 lỗi, dev server port 3000 khởi động sẵn sàng |
| 2026-10-23 15:20 | Phase 3 | Task 3.1 - 3.Final | User nghiệm thu và chốt Phương án A. Cố định nút Drive trong tab Tải tệp, loại bỏ Switcher Pill và subview thừa | done | `tsc --noEmit` 0 lỗi, hoàn thành toàn bộ Phase 3 |
