# Rebuttal Log: google-drive-intake-import

## Round 2 - 2026-10-23T12:42:00+07:00

### Tổng kết
- EFR: 3 (accepted: 3, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded:
  - `src/App.tsx:620-685, 730-800` (kiểm tra luồng autoUpload và handleDeleteDocument/tombstone)
  - `src/types.ts:15-40` (kiểm tra DocumentImage, DocumentRecord và IntakeSource)
  - `src/components/IntakeModal.tsx:260-300, 628-660, 940-975` (kiểm tra nạp file, contract PDF và intakeSource)
  - `package.json:1-35` (kiểm tra thư viện pdf-lib vs pdfjs-dist)
  - `src/services/googleDriveService.ts:620-660` (kiểm tra cơ chế deleteFileFromGoogleDrive và _ThungRac_DaXoa)

### EFR Đã Chấp Nhận
- **[EFR-01]: Phân biệt file Drive nguồn với asset do ứng dụng sở hữu**
  - **Sửa**: Bổ sung `sourceDriveFileId?: string;` và `driveAssetOwnership?: "EXTERNAL_REFERENCE" | "MANAGED";` vào `DocumentImage` và `DocumentRecord`. Phân định rõ ràng: tệp được chọn từ Drive người dùng lưu giữ dưới dạng nguồn tham chiếu (`EXTERNAL_REFERENCE`); khi `autoUpload` bật, hệ thống tạo bản sao chuẩn hóa theo số hiệu vào thư mục chung của cơ quan (`MANAGED`). Trong `handleDeleteDocument` và tombstone cleanup, chỉ xóa tệp trên Drive nếu `driveAssetOwnership === "MANAGED"`, tuyệt đối không xóa/chuyển thùng rác tệp gốc của người dùng (`sourceDriveFileId`). Đã cập nhật `FEATURE_PLAN.md` và `FEATURE_TASKS.md` (Task 1.2, Task 2.1, Task 2.5, Task 3.2).
- **[EFR-02]: PDF nhiều trang không đạt contract trang/thumbnail/xoay**
  - **Sửa**: Chuẩn hóa contract xử lý tệp PDF từ Drive: hệ thống nạp nguyên vẹn tài liệu PDF đính kèm (`mimeType: 'application/pdf'`), không ép render tách trang canvas giả định; tận dụng thư viện `pdf-lib` đã có sẵn trong dự án (`package.json`) để đọc số trang thực tế chính xác, cập nhật nhãn số trang UI chuẩn xác. Luồng OCR Gemini tiếp tục xử lý trực tiếp MIME `application/pdf`. Đã cập nhật `FEATURE_PLAN.md` và `FEATURE_TASKS.md` (Task 2.1, Task 2.Final).
- **[EFR-03]: `intakeSource` của phương án A vẫn là `UPLOAD`**
  - **Sửa**: Bổ sung `"DRIVE"` vào định nghĩa kiểu `IntakeSource` trong `src/types.ts`. Đồng nhất cơ chế gán nguồn: bất kể người dùng chọn file từ Drive qua Phương án A (nút trong tab Tải tệp) hay Phương án B (tab Google Drive riêng), bản ghi văn bản đều được gán chính xác `intakeSource: "DRIVE"` và ghi nhận lịch sử tiếp nhận minh bạch. Đã cập nhật `FEATURE_PLAN.md` và `FEATURE_TASKS.md` (Task 2.1, Task 3.2).

### EFR Đã Bác Bỏ
- Không có.

### EFR Chưa Kết Luận
- Không có.

### Phát Hiện Bổ Sung
- Không có phát hiện bổ sung.

### Vùng đã scan khi không có SFR
- `src/services/googleDriveService.ts:115-320`: kiểm tra hàm tìm kiếm file và escaping ký tự trong câu truy vấn `query` (`name contains '...'`) -> Đã bổ sung yêu cầu escape ký tự đặc biệt trực tiếp vào Task 1.1 để ngăn ngừa lỗi HTTP 400 Bad Request.

---

## Round 3 - 2026-10-23T12:48:00+07:00

### Tổng kết
- EFR: 3 (accepted: 3, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded:
  - `src/App.tsx:580-615` (kiểm tra nhánh compileImagesToPdf làm mất metadata provenance)
  - `src/services/googleDriveService.ts:1050-1085` (kiểm tra hàm sanitizeDatabasePayload strip dataUrl và serialize thiếu sourceDriveFileId)
  - `src/components/DocumentDetailModal.tsx:110-165` (kiểm tra fallback driveWebViewLink khi xem tài liệu đa thiết bị)
  - `src/components/DocumentArchiveView.tsx:190-220, 500-525` (kiểm tra getSourceLabel, getSourceIcon và filter tabs thiếu DRIVE)
  - `src/components/PrintDocumentModal.tsx:230-250` (kiểm tra ánh xạ intakeSource thiếu DRIVE)
  - `src/components/DashboardStats.tsx:30-50` (kiểm tra thống kê phân bổ nguồn thiếu DRIVE)

### EFR Đã Chấp Nhận
- **[Round 3 EFR-01]: Nhánh ghép ảnh thành PDF làm mất provenance trước khi lưu**
  - **Sửa**: Trong `src/App.tsx`, trước khi gọi `compileImagesToPdf`, gom tất cả `sourceDriveFileId` của các ảnh nguồn và gán vào `docToSave.sourceDriveFileIds`, đồng thời gán vào item PDF biên dịch mới. Đã cập nhật `FEATURE_PLAN.md` và `FEATURE_TASKS.md` (Task 2.5, Task 2.Final, Task 3.2).
- **[Round 3 EFR-02]: Registry Drive loại bỏ ID nguồn khi `autoUpload` tắt**
  - **Sửa**: Trong `src/services/googleDriveService.ts`, bổ sung serialize `sourceDriveFileId`, `sourceDriveFileIds`, `driveAssetOwnership` và `driveWebViewLink` trong `sanitizeDatabasePayload` để duy trì khả năng truy xuất tệp từ các máy khác. Cập nhật `DocumentDetailModal.tsx` để hỗ trợ mở xem/tải tài liệu qua `driveWebViewLink` hoặc Drive API khi không có `dataUrl` cục bộ. Đã cập nhật `FEATURE_PLAN.md` và `FEATURE_TASKS.md` (Task 2.6, Task 3.2).
- **[Round 3 EFR-03]: Các màn hình hiện hữu hiển thị `DRIVE` thành “Thủ công”**
  - **Sửa**: Bổ sung icon Cloud/Drive, nhãn "Google Drive" và tab lọc nguồn `DRIVE` trong `DocumentArchiveView.tsx`; map phương thức tiếp nhận "Tiếp nhận trực tiếp từ Google Drive" trong `PrintDocumentModal.tsx`; bổ sung tính toán và hiển thị thống kê nguồn `DRIVE` trong `DashboardStats.tsx`. Đã cập nhật `FEATURE_PLAN.md` và `FEATURE_TASKS.md` (Task 2.7, Task 3.2).

### EFR Đã Bác Bỏ
- Không có.

### EFR Chưa Kết Luận
- Không có.

### Phát Hiện Bổ Sung
- Không có phát hiện bổ sung.

### Vùng đã scan khi không có SFR
- `src/components/DocumentDetailModal.tsx:500-540`: kiểm tra nút tải file và xem trước file PDF blob -> Đã xác nhận cơ chế blob URL hoạt động tốt khi có `dataUrl`, và sẵn sàng đón nhận fallback qua `driveWebViewLink`.

---

## Round 4 - 2026-10-23T13:52:00+07:00

### Tổng kết
- EFR: 3 (accepted: 3, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded:
  - `src/App.tsx:580-609, 650-681, 735-800` (kiểm tra luồng compileImagesToPdf với batch trộn, và vòng lặp xóa file trên Drive chỉ xóa 1 file)
  - `src/utils/pdfGenerator.ts:91-141` (kiểm tra hàm compileImagesToPdf ném PDF vào processImageCanvas làm mất trang PDF)
  - `src/types.ts:60-95` (kiểm tra TombstoneRecord chỉ có 1 driveFileId)
  - `src/components/DocumentDetailModal.tsx:500-540` (kiểm tra cơ chế preview khi autoUpload tắt)

### EFR Đã Chấp Nhận
- **[Round 4 EFR-01]: PDF và ảnh trộn chung có thể làm mất tệp PDF khi cấp số**
  - **Sửa**: Trong `src/utils/pdfGenerator.ts`, nâng cấp `compileImagesToPdf` để hỗ trợ batch trộn: nếu item là PDF (`mimeType: 'application/pdf'`), sử dụng `pdf-lib` (`pdfDoc.copyPages`) để sao chép nguyên vẹn trang vào PDF tổng hợp, tránh lỗi nạp canvas `Image()` gây nuốt mất tệp PDF. Đã cập nhật `FEATURE_PLAN.md` và `FEATURE_TASKS.md` (Task 2.5, Task 2.Final, Task 3.2).
- **[Round 4 EFR-02]: Bản PDF tổng hợp không thể phục hồi chỉ từ danh sách ID ảnh nguồn**
  - **Sửa**: Khi nạp nhiều ảnh từ Drive tạo PDF tổng hợp: nếu `autoUpload: false`, bảo toàn danh sách `DocumentImage` nguồn kèm `sourceDriveFileId` và `driveWebViewLink` trên từng item để các client khác khi đồng bộ registry vẫn xem được từng trang qua Drive preview link thay vì chỉ có 1 file PDF rỗng. Đã cập nhật `FEATURE_PLAN.md` và `FEATURE_TASKS.md` (Task 2.5, Task 3.2).
- **[Round 4 EFR-03]: Xóa record nhiều asset chỉ dọn asset đầu tiên**
  - **Sửa**: Mở rộng `TombstoneRecord` trong `src/types.ts` thêm `driveFileIds?: string[]`. Trong `src/App.tsx` (`handleDeleteDocument` và `cleanPendingTombstones`), thu thập toàn bộ danh sách managed asset IDs của văn bản (`driveAssetOwnership === "MANAGED"`), gọi xóa triệt để tất cả các asset này trên Drive, không bỏ sót asset thứ hai trở đi và không đụng vào tệp gốc của người dùng. Đã cập nhật `FEATURE_PLAN.md` và `FEATURE_TASKS.md` (Task 2.1, Task 2.5, Task 3.2).

### EFR Đã Bác Bỏ
- Không có.

### EFR Chưa Kết Luận
- Không có.

### Phát Hiện Bổ Sung
- Không có phát hiện bổ sung.

### Vùng đã scan khi không có SFR
- `src/App.tsx:275-290`: kiểm tra hàm cleanPendingTombstones -> Đã xác nhận cần cập nhật vòng lặp xóa cho mảng `pt.driveFileIds || [pt.driveFileId]`.

---

## Round 5 - 2026-10-23T14:15:00+07:00

### Tổng kết
- EFR: 2 (accepted: 2, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded:
  - `src/utils/pdfGenerator.ts:101-141` (kiểm tra try/catch nuốt lỗi từng item trong compileImagesToPdf)
  - `src/services/googleDriveService.ts:30-60, 1056-1073` (kiểm tra autoUpload setting và cơ chế đồng bộ registry bỏ dataUrl)
  - `src/components/IntakeModal.tsx:115-130, 250-300` (kiểm tra nạp mảng images khi trộn file local và file Drive)
  - `src/components/DocumentDetailModal.tsx:500-540` (kiểm tra fallback hiển thị trên máy thứ 2)

### EFR Đã Chấp Nhận
- **[Round 5 EFR-01]: Lỗi copy một PDF vẫn có thể lưu batch thiếu trang**
  - **Sửa**: Trong `src/utils/pdfGenerator.ts` (`compileImagesToPdf`), loại bỏ việc bỏ qua lỗi âm thầm khi một item không xử lý được. Áp dụng cơ chế fail-fast: nếu bất kỳ file nào (PDF bị khóa/hỏng hoặc ảnh không giải mã được) gặp lỗi, hàm ném ngoại lệ rõ ràng chỉ rõ tên file lỗi để dừng quá trình lưu cấp số, bảo đảm tuyệt đối không lưu văn bản thiếu trang. Đã cập nhật `FEATURE_PLAN.md` và `FEATURE_TASKS.md` (Task 2.5, Task 3.2).
- **[Round 5 EFR-02]: File cục bộ trong batch trộn mất nội dung trên thiết bị khác khi autoUpload=false**
  - **Sửa**: Khi người dùng trộn file cục bộ và file Drive trong khi tắt `autoUpload`: `IntakeModal` hiển thị cảnh báo lưu ý rằng tệp từ máy tính chỉ lưu cục bộ trên thiết bị hiện tại; tại `DocumentDetailModal`, với các file cục bộ không có trên Drive khi xem từ thiết bị thứ 2, hệ thống hiển thị rõ ràng thông báo "Tệp lưu cục bộ trên thiết bị gốc (không đồng bộ qua Drive do tắt tự động tải lên)" thay vì khung xem rỗng. Đã cập nhật `FEATURE_PLAN.md` và `FEATURE_TASKS.md` (Task 2.6, Task 3.2).

### EFR Đã Bác Bỏ
- Không có.

### EFR Chưa Kết Luận
- Không có.

### Phát Hiện Bổ Sung
- Không có phát hiện bổ sung.

### Vùng đã scan khi không có SFR
- `src/components/IntakeModal.tsx:253-296`: kiểm tra luồng nạp file cục bộ -> Đã xác nhận cơ chế gắn cảnh báo và state quản lý ổn định.



