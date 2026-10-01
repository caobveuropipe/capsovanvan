# Project Structure - HC-ADM-CapSoVanBan

> Tạo ngày: 2026-09-17
> Cập nhật gần nhất: 2026-09-17
> Mục đích: Lưu snapshot cấu trúc codebase để AI có thể onboard và resume nhanh.

---

## 1. Snapshot cây thư mục

```text
HC-ADM-CapSoVanBan/
|-- .agents/
|   |-- CONTEXT.md                  # Bản đồ tổng quan dự án cho AI
|   |-- PROJECT_STRUCTURE.md        # Snapshot cấu trúc, services, commands
|   |-- KNOWLEDGE_BASE.md           # Các quyết định kiến trúc cốt lõi
|   |-- architecture/
|   |   `-- MASTER.md               # Kiến trúc tổng thể hệ thống
|   `-- skills/                     # Bộ skill pack chuẩn hóa
|-- src/
|   |-- App.tsx                     # Component chính điều phối view (Dashboard, Quản lý danh mục, Sổ lưu trữ)
|   |-- main.tsx                    # Entry point React
|   |-- types.ts                    # Toàn bộ Interface & Type định nghĩa dữ liệu văn bản, danh mục, email
|   |-- index.css                   # Tailwind styles
|   |-- components/
|   |   |-- CategoryConfigModal.tsx # Modal cấu hình danh mục và quy tắc định dạng số văn bản
|   |   |-- DashboardStats.tsx      # Thống kê số lượng, tiến độ cấp số, biểu đồ danh mục
|   |   |-- DocumentArchiveView.tsx # Sổ lưu trữ văn bản, tìm kiếm, lọc theo ngày/loại/phòng ban, xuất dữ liệu
|   |   |-- DocumentDetailModal.tsx # Xem chi tiết văn bản, lịch sử chỉnh sửa, toàn văn OCR
|   |   |-- IntakeModal.tsx         # Modal tiếp nhận & cấp số đa nguồn (Upload, Camera, Email, Thủ công)
|   |   |-- MobileBottomNav.tsx     # Thanh điều hướng cho màn hình di động
|   |   |-- Navbar.tsx              # Thanh tiêu đề, thông tin đơn vị, nút thao tác nhanh
|   |   `-- PrintDocumentModal.tsx  # In phiếu cấp số, nhãn dán văn thư, biên nhận
|   |-- services/
|   |   `-- storage.ts              # Service quản lý lưu trữ client-side qua localStorage
|   `-- utils/
|       `-- numberGenerator.ts      # Hàm sinh số văn bản theo mẫu cấu hình template
|-- server.ts                       # Express server + Gemini AI endpoints + Vite middleware
|-- index.html                      # HTML template
|-- vite.config.ts                  # Cấu hình Vite & Tailwind plugin
|-- tsconfig.json                   # Cấu hình TypeScript compiler
|-- package.json                    # Dependencies & npm scripts
`-- .env.example                    # Mẫu cấu hình biến môi trường (GEMINI_API_KEY)
```

## 2. Entry Points

| Loại | File/Path | Vai trò | Ghi chú |
|------|-----------|---------|---------|
| Backend / Dev Server | [server.ts](file:///d:/Project_VCC/HC-ADM-CapSoVanBan/server.ts) | Khởi động Express API, lazy init Gemini client, nhúng Vite dev server middleware | Chạy qua lệnh `npm run dev` |
| Frontend Root | [src/main.tsx](file:///d:/Project_VCC/HC-ADM-CapSoVanBan/src/main.tsx) | Mount root component React vào `#root` DOM element | Vite bundle |
| Application Layout | [src/App.tsx](file:///d:/Project_VCC/HC-ADM-CapSoVanBan/src/App.tsx) | Điều phối state toàn cục, tab view (Dashboard, Sổ lưu trữ), modal tiếp nhận | Component trung tâm |

## 3. Services / Modules chính

| Module/Service | Path | Trách nhiệm | Phụ thuộc chính |
|----------------|------|-------------|------------------|
| Gemini AI OCR & Classifier | [server.ts](file:///d:/Project_VCC/HC-ADM-CapSoVanBan/server.ts) (`/api/ocr-classify`, `/api/parse-email`) | OCR hình ảnh văn bản, bóc tách email và file đính kèm, phân loại theo danh mục NĐ 30/2020/NĐ-CP | `@google/genai`, Gemini 3.7 Flash |
| Local Storage Service | [src/services/storage.ts](file:///d:/Project_VCC/HC-ADM-CapSoVanBan/src/services/storage.ts) | CRUD văn bản, danh mục, lịch sử; khởi tạo danh mục mẫu chuẩn NĐ 30; import/export dữ liệu | `localStorage`, [src/types.ts](file:///d:/Project_VCC/HC-ADM-CapSoVanBan/src/types.ts) |
| Number Generator | [src/utils/numberGenerator.ts](file:///d:/Project_VCC/HC-ADM-CapSoVanBan/src/utils/numberGenerator.ts) | Parse template chuỗi (VD: `{NUM}{SUFFIX}`, `{PREFIX}{NUM_PAD3}/{YEAR}`) để render số hiệu văn bản | [src/types.ts](file:///d:/Project_VCC/HC-ADM-CapSoVanBan/src/types.ts) |
| Intake Modal | [src/components/IntakeModal.tsx](file:///d:/Project_VCC/HC-ADM-CapSoVanBan/src/components/IntakeModal.tsx) | Xử lý đa luồng nạp văn bản: Tải file scan, Chụp camera, Trích xuất email, Nhập form thủ công | API `/api/ocr-classify`, `/api/parse-email`, Canvas/Video APIs |

## 4. Config / Infra quan trọng

| File | Nhóm | Ý nghĩa | Lưu ý khi chỉnh sửa |
|------|------|---------|---------------------|
| [package.json](file:///d:/Project_VCC/HC-ADM-CapSoVanBan/package.json) | Build/Deps | Quản lý dependencies React 19, Express, Tailwind, Vite | Cấu hình script `dev` chạy `tsx server.ts` |
| [vite.config.ts](file:///d:/Project_VCC/HC-ADM-CapSoVanBan/vite.config.ts) | Build | Cấu hình Vite bundler & plugin Tailwind v4 | Cần đồng bộ alias nếu cấu hình thêm |
| [.env.example](file:///d:/Project_VCC/HC-ADM-CapSoVanBan/.env.example) | Runtime config | Mẫu file cấu hình API Key cho Gemini AI | Cần tạo `.env` hoặc `.env.local` chứa `GEMINI_API_KEY` |
| [tsconfig.json](file:///d:/Project_VCC/HC-ADM-CapSoVanBan/tsconfig.json) | Typescript | Cấu hình compiler options cho React & Node | `moduleResolution: bundler` |

## 5. Commands

| Mục đích | Lệnh | Điều kiện | Ghi chú |
|----------|------|-----------|---------|
| Chạy dev | `npm run dev` | Có `GEMINI_API_KEY` trong `.env` để dùng tính năng AI OCR | Khởi chạy server tại `http://localhost:5174` |
| Build production | `npm run build` | Cần `dist/` và `dist/server.cjs` | Đóng gói cả frontend (Vite) và backend bundle (esbuild) |
| Chạy production | `npm start` | Sau khi đã `npm run build` | Chạy Node server phục vụ file tĩnh và API |
| Kiểm tra kiểu | `npm run lint` | TypeScript installed | Chạy `tsc --noEmit` để rà soát lỗi type |

---

## 4. Key Boundaries & Invariants

- Quy tắc sinh số văn bản phải qua hàm [generateDocumentNumber](file:///d:/Project_VCC/HC-ADM-CapSoVanBan/src/utils/numberGenerator.ts), không được ghép chuỗi tùy tiện tại component UI.
- Mọi thao tác lưu dữ liệu văn bản vào localStorage phải đồng thời cập nhật số đếm của danh mục tương ứng thông qua [incrementCategoryCount](file:///d:/Project_VCC/HC-ADM-CapSoVanBan/src/services/storage.ts).
- Khóa lưu trữ localStorage chuẩn: `doc_categories`, `doc_records`, `doc_audit_logs`.
- Điểm dễ nhầm: Backend không tách riêng port với frontend ở dev; `server.ts` đóng vai trò vừa là API server vừa là Vite dev middleware trên port 5174.
- Khi sửa quy tắc sinh số hiệu văn bản: đọc [src/utils/numberGenerator.ts](file:///d:/Project_VCC/HC-ADM-CapSoVanBan/src/utils/numberGenerator.ts) và [src/components/CategoryConfigModal.tsx](file:///d:/Project_VCC/HC-ADM-CapSoVanBan/src/components/CategoryConfigModal.tsx).
- Khi sửa cấu trúc dữ liệu lưu trữ văn bản hoặc danh mục: đọc [src/types.ts](file:///d:/Project_VCC/HC-ADM-CapSoVanBan/src/types.ts) và [src/services/storage.ts](file:///d:/Project_VCC/HC-ADM-CapSoVanBan/src/services/storage.ts).

## 7. Ghi chú từ lần quét đầu

- Package manager: `npm` (có `package.json`, dùng `tsx` ở dev).
- Kiểu repo: Single fullstack repo (Express backend và React frontend chia sẻ một root package).
- Test framework: Chưa cấu hình test runner (chưa có Vitest/Jest).
- Điểm dễ nhầm: Backend không tách riêng port với frontend ở dev; `server.ts` đóng vai trò vừa là API server vừa là Vite dev middleware trên port 3000.
