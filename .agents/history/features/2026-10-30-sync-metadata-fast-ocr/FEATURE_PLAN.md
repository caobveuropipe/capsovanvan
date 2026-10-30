# Feature Plan: Đồng bộ Người ký & Đơn vị qua Google Drive và Tối ưu OCR siêu tốc chỉ đọc V/v

> **Trạng thái**: ✅ HOÀN THÀNH
> **Review gate**: Đã phân tích rủi ro và xác định phạm vi thay đổi
> **Feature slug**: sync-metadata-fast-ocr
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-10-30

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** 
  1. Người dùng thêm thông tin Người ký & Chức vụ, Cơ quan ban hành, Nơi nhận nhưng chỉ lưu cục bộ ở `localStorage` trên trình duyệt đó, không được lưu vào file JSON mặc định và không đồng bộ qua Google Drive khi đăng nhập giữa các tài khoản/thiết bị khác nhau.
  2. Tính năng AI OCR hiện tại đang bắt buộc trích xuất toàn bộ bài viết (`ocrFullText`) và tóm tắt dài (`summary`), ngốn rất nhiều output token (1.000 - 2.500 tokens) và mất nhiều thời gian chờ (8 - 15 giây), trong khi nhu cầu cấp số văn bản chủ yếu chỉ cần trích yếu ("V/v", "Về việc"), Loại văn bản và Cơ quan ban hành ở phần đầu trang.
- **Vấn đề cần giải quyết:**
  - Danh sách preset Người ký / Đơn vị / Nơi nhận bị rỗng ban đầu và không đồng bộ giữa các tài khoản khi đăng nhập Google Drive.
  - Người dùng nhập Người ký vào form nhưng quên bấm nút "+" thì không được tự động nhớ vào danh sách chọn cho lần sau.
  - OCR quá tốn token và tốn thời gian cho việc cấp số văn bản.
- **Mục tiêu:**
  - Đồng bộ `formMetadataOptions` hai chiều qua file `vcc_documents_database.json` trên Google Drive.
  - Tự động nạp danh sách mẫu chuẩn và tự động ghi nhớ Người ký / Đơn vị mới khi bấm Cấp số văn bản thành công.
  - Tối ưu hóa OCR với chế độ "Cấp số siêu tốc (Chỉ đọc V/v)" giúp giảm >90% token output và rút ngắn thời gian xử lý xuống còn 1 - 2 giây, đồng thời vẫn giữ tùy chọn "OCR Toàn văn" khi cần.

## 2. Phạm vi

### In scope
- Cập nhật dữ liệu mặc định chuẩn cho `src/data/metadataOptions.json`.
- Cập nhật `src/services/storage.ts`: Thêm hàm hợp nhất metadata options từ remote, tự động lưu thông tin form khi cấp số.
- Cập nhật `src/services/googleDriveService.ts`: Bổ sung `formMetadataOptions` vào payload `DriveDatabasePayload` khi đọc, ghi và giải quyết xung đột trên Google Drive.
- Cập nhật `src/App.tsx`: Tích hợp đồng bộ `formMetadataOptions` trong luồng `syncWithGoogleDrive`.
- Cập nhật `server.ts` & `src/services/directGeminiOcr.ts`: Bổ sung tham số `mode: "fast" | "full"` cho OCR; trong chế độ `fast`, chỉ trích xuất trích yếu V/v, loại văn bản, cơ quan ban hành, ngày tháng, loại bỏ việc sinh toàn văn `ocrFullText` nặng nề.
- Cập nhật `src/components/IntakeModal.tsx`:
  - Thêm lựa chọn/nút "Trích xuất nhanh (V/v)" và "OCR Toàn văn".
  - Tự động lưu Người ký, Đơn vị, Nơi nhận vào danh mục khi cấp số văn bản thành công.

### Out of scope
- Thay đổi cấu trúc cơ sở dữ liệu IndexedDB của văn bản (`documents`).
- Đổi nhà cung cấp AI ngoài Google Gemini.

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** 
  - Kế thừa kiến trúc lưu trữ và đồng bộ Google Drive tập trung qua `vcc_documents_database.json`.
  - Kế thừa cơ chế Dynamic User Gemini API Key (EFR-01) và Direct Client Fallback (EFR-05).
- **"Cấm kỵ" cần tránh:**
  - Không phá vỡ tương thích ngược cấu trúc của `vcc_documents_database.json` (các phiên bản cũ đọc payload không có `formMetadataOptions` vẫn phải chạy bình thường).
  - Không làm mất danh sách options cũ của người dùng khi merge dữ liệu từ remote.

## 4. Giả định và câu hỏi mở

### Giả định
- Khi người dùng bấm "Cấp số", nếu các trường Người ký, Nơi nhận, Đơn vị có giá trị hợp lệ mà chưa có trong danh sách options thì tự động lưu vào options và đồng bộ lên Google Drive.
- Chế độ "Cấp số siêu tốc (Chỉ đọc V/v)" sẽ là chế độ mặc định khi người dùng bấm AI OCR trong IntakeModal vì đáp ứng đúng nhu cầu nhanh và tiết kiệm token nhất.

## 5. Acceptance Criteria

- [ ] `src/data/metadataOptions.json` có sẵn dữ liệu mẫu chuẩn (không bị rỗng ban đầu).
- [ ] Khi bấm cấp số văn bản, người ký/đơn vị mới được tự động thêm vào danh mục gợi ý mà không bắt buộc bấm nút `+`.
- [ ] Dữ liệu `formMetadataOptions` được lưu lên Google Drive (`vcc_documents_database.json`) và tự động tải về khi tài khoản khác hoặc thiết bị khác đăng nhập.
- [ ] Chế độ OCR nhanh chỉ đọc trích yếu "V/v", loại văn bản, đơn vị và ngày tháng, hoàn thành trong vòng 1-2 giây, giảm tối đa output tokens.
- [ ] Có thể chuyển đổi linh hoạt giữa "Trích xuất nhanh (V/v)" và "OCR Toàn văn" trong IntakeModal.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `src/data/metadataOptions.json` | Sửa | Thêm dữ liệu mẫu ban đầu | 🟢 Thấp | Chưa |
| `src/services/storage.ts` | Sửa | Bổ sung hàm merge metadata options và tự động lưu | 🟢 Thấp | Có |
| `src/services/googleDriveService.ts` | Sửa | Mở rộng `DriveDatabasePayload` chứa `formMetadataOptions` | 🟡 Trung bình | Có |
| `src/App.tsx` | Sửa | Tích hợp sync `formMetadataOptions` với Google Drive | 🟡 Trung bình | Có |
| `server.ts` | Sửa | Hỗ trợ mode fast/full trong endpoint `/api/ocr-classify` | 🟢 Thấp | Có |
| `src/services/directGeminiOcr.ts` | Sửa | Hỗ trợ mode fast/full khi gọi trực tiếp Gemini API | 🟢 Thấp | Có |
| `src/components/IntakeModal.tsx` | Sửa | Tự động lưu metadata khi submit và giao diện chọn mode OCR | 🟡 Trung bình | Có |

## 7. Chiến lược triển khai

- **Phase 1:** Hoàn thiện nạp dữ liệu mặc định và cơ chế tự động ghi nhớ Người ký / Đơn vị khi cấp số.
- **Phase 2:** Mở rộng đồng bộ hai chiều `formMetadataOptions` qua Google Drive (`vcc_documents_database.json`).
- **Phase 3:** Triển khai chế độ AI Fast OCR (chỉ đọc V/v & phần đầu trang) trên cả backend Express và frontend direct Gemini API.
- **Phase 4:** Tích hợp UI trong IntakeModal và kiểm thử toàn diện.

