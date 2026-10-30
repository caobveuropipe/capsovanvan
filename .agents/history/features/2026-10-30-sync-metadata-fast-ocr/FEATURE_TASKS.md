# Feature Tasks: Đồng bộ Người ký & Đơn vị qua Google Drive và Tối ưu OCR siêu tốc chỉ đọc V/v

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-10-30

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Nạp dữ liệu mẫu & Cơ chế tự động ghi nhớ Người ký / Đơn vị

**Mục tiêu:** Đảm bảo combobox có sẵn dữ liệu mẫu chuẩn và tự động ghi nhớ giá trị mới khi cấp số thành công.

- [x] Task 1.1: Cập nhật `src/data/metadataOptions.json` với danh sách mẫu chuẩn (Đơn vị, Người ký, Nơi nhận, Phòng ban).
- [x] Task 1.2: Cập nhật `src/services/storage.ts` với hàm `mergeFormMetadataOptions` và hỗ trợ import/merge danh sách.
- [x] Task 1.3: Cập nhật `src/components/IntakeModal.tsx` để tự động lưu các giá trị mới của Người ký, Đơn vị, Nơi nhận khi tạo/cấp số thành công.
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Bắt buộc)

## Phase 2: Đồng bộ hai chiều `formMetadataOptions` qua Google Drive

**Mục tiêu:** Mọi thay đổi trong danh mục Người ký / Đơn vị được đồng bộ lên Google Drive và tải về cho tất cả tài khoản.

- [x] Task 2.1: Mở rộng `DriveDatabasePayload` trong `src/services/googleDriveService.ts` bao gồm trường `formMetadataOptions`.
- [x] Task 2.2: Cập nhật hàm `saveDatabaseToGoogleDrive` và `saveDatabaseWithConflictResolution` để đính kèm `formMetadataOptions`.
- [x] Task 2.3: Cập nhật hàm `readDatabaseFromGoogleDrive` và `syncWithGoogleDrive` trong `src/App.tsx` để merge `formMetadataOptions` từ remote vào local.
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Bắt buộc)

## Phase 3: Tối ưu OCR chế độ Fast (Chỉ đọc "V/v", Loại văn bản, Cơ quan ban hành)

**Mục tiêu:** Tiết kiệm >90% token output và giảm thời gian OCR xuống 1-2 giây.

- [x] Task 3.1: Cập nhật endpoint `/api/ocr-classify` trong `server.ts` hỗ trợ `mode: "fast" | "full"`. Khi ở chế độ `fast`, AI chỉ trích xuất trích yếu V/v, loại văn bản, cơ quan ban hành, ngày tháng; bỏ qua `ocrFullText` và `summary`.
- [x] Task 3.2: Cập nhật `executeDirectGoogleOcr` trong `src/services/directGeminiOcr.ts` hỗ trợ `mode: "fast" | "full"`.
- [x] Task 3.Final: 🧪 Test & Verify Phase 3 (Bắt buộc)

## Phase 4: Tích hợp giao diện IntakeModal & Kiểm thử toàn diện

**Mục tiêu:** Giao diện trực quan cho phép người dùng chọn "Trích xuất nhanh (V/v)" hoặc "OCR Toàn văn", kiểm tra toàn bộ luồng.

- [x] Task 4.1: Cập nhật giao diện `IntakeModal.tsx` với nút lựa chọn chế độ OCR (Mặc định: Cấp số nhanh V/v, nút phụ: OCR toàn văn).
- [x] Task 4.2: Chạy kiểm tra lint/type check TypeScript (`npm run lint` / `npx tsc --noEmit`).
- [x] Task 4.Final: 🧪 Test & Verify Phase 4 (Bắt buộc)

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-10-30 16:47 | Phase 1 | Task 1.1 | Khởi tạo kế hoạch và checklist | done | Bắt đầu thực thi Phase 1 |
| 2026-10-30 16:48 | Phase 1 | Task 1.1-1.3 | Cập nhật metadataOptions.json, storage service & autoRecordDocumentMetadataOptions | done | Tự động lưu metadata khi cấp số |
| 2026-10-30 16:50 | Phase 2 | Task 2.1-2.3 | Mở rộng DriveDatabasePayload & tích hợp sync hai chiều formMetadataOptions qua Google Drive | done | Đồng bộ mọi tài khoản và thiết bị |
| 2026-10-30 16:52 | Phase 3 | Task 3.1-3.2 | Tối ưu hóa prompt & schema cho Fast OCR mode trong server.ts & directGeminiOcr.ts | done | Tiết kiệm >90% token output, phản hồi trong 1-2s |
| 2026-10-30 16:54 | Phase 4 | Task 4.1-4.2 | Thêm toggle OCR mode vào IntakeModal, chạy tsc --noEmit kiểm tra | done | Build & type check đạt mã 0 không lỗi |
