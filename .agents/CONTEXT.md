# HC-ADM-CapSoVanBan - Context for AI Assistants

---

## 1. Project Overview

- **Tên dự án**: Hệ thống Cấp số & Quản lý Văn bản Hành chính (HC-ADM-CapSoVanBan)
- **Repo**: [caobveuropipe/capsovanvan](https://github.com/caobveuropipe/capsovanvan)
- **Trạng thái**: Active Development (Đã hoàn thiện các chức năng lõi: Intake modal đa nguồn, Cấp số văn bản tự động theo danh mục chuẩn NĐ 30/2020/NĐ-CP, OCR & Phân loại văn bản với Gemini 3.7 Flash, Dashboard thống kê, In trích yếu/nhãn văn thư, Lưu trữ Client-side)

### Tech Stack
- **Frontend**: React 19, TypeScript ~5.8, Tailwind CSS v4 (`@tailwindcss/vite`), Vite 6, Motion (Framer Motion), Lucide React
- **Backend**: Node.js, Express 4.21, TypeScript, `@google/genai` (Gemini 3.7 Flash SDK)
- **Runtime & Dev Server**: `tsx` (chạy trực tiếp TypeScript), Express tích hợp Vite middleware trong môi trường dev, bundle `esbuild` cho production
- **Database / Persistence**: Client-side storage (`localStorage` qua [storage.ts](file:///d:/Project_VCC/HC-ADM-CapSoVanBan/src/services/storage.ts))
- **Auth**: Chưa tích hợp (đang chạy local/single-user)
- **Infrastructure**: Node.js server độc lập, hỗ trợ port 3000

---

## 2. `.agents/` Directory Navigation

### Core Maps
| File | Mô tả |
|------|------|
| [CONTEXT.md](./CONTEXT.md) | Bản đồ nhanh để onboard và resume |
| [KNOWLEDGE_BASE.md](./KNOWLEDGE_BASE.md) | Quyết định kiến trúc và lý do chiến lược |
| [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) | Snapshot cấu trúc thư mục, entry points, services và commands |

### Architecture
| File | Mô tả |
|------|------|
| [architecture/MASTER.md](./architecture/MASTER.md) | Kiến trúc tổng thể hệ thống, data flow & boundary AI |

### Agent Skills
| Skill | Mô tả |
|------|------|
| [skills/README.md](./skills/README.md) | Tổng quan skill pack và flow chuẩn |
| [skills/project-init/SKILL.md](./skills/project-init/SKILL.md) | Chuẩn hóa, bổ sung, hoặc audit bộ `.agents/` |
| [skills/feature-plan/SKILL.md](./skills/feature-plan/SKILL.md) | Lập kế hoạch cho feature mới |
| [skills/feature-review/SKILL.md](./skills/feature-review/SKILL.md) | Review plan về kiến trúc, bảo mật, logic và rollout |
| [skills/feature-coordinator/SKILL.md](./skills/feature-coordinator/SKILL.md) | Triển khai feature theo phase và checklist |
| [skills/update-docs/SKILL.md](./skills/update-docs/SKILL.md) | Cập nhật docs sau khi code thay đổi |
| [skills/check-issue/SKILL.md](./skills/check-issue/SKILL.md) | Điều tra root cause của bug hoặc sự cố |
| [skills/docs-hygiene/SKILL.md](./skills/docs-hygiene/SKILL.md) | Rà soát sức khỏe hệ thống tài liệu và read-path |
| [skills/git-sync/SKILL.md](./skills/git-sync/SKILL.md) | Đồng bộ Git sau khi đã chốt docs và commit message |

---

## 3. Critical Files

| File | Mức độ | Ghi chú |
|------|------|---------|
| [server.ts](file:///d:/Project_VCC/HC-ADM-CapSoVanBan/server.ts) | CRITICAL | Backend entry point: phục vụ API OCR/Phân loại email & văn bản với Gemini 3.7 Flash, đồng thời chạy Vite dev middleware |
| [src/services/storage.ts](file:///d:/Project_VCC/HC-ADM-CapSoVanBan/src/services/storage.ts) | CRITICAL | Quản lý dữ liệu nguồn (records, categories, logs) qua localStorage, khởi tạo danh mục mẫu theo NĐ 30 |
| [src/utils/numberGenerator.ts](file:///d:/Project_VCC/HC-ADM-CapSoVanBan/src/utils/numberGenerator.ts) | HIGH | Logic sinh số văn bản theo template cấu hình danh mục (`formatTemplate`, `paddingDigits`, `prefix`, `suffix`) |
| [src/components/IntakeModal.tsx](file:///d:/Project_VCC/HC-ADM-CapSoVanBan/src/components/IntakeModal.tsx) | HIGH | Modal tiếp nhận văn bản đa nguồn: Tải ảnh/scan, Camera trực tiếp, Email/tệp đính kèm, Nhập tay thủ công |
| [src/types.ts](file:///d:/Project_VCC/HC-ADM-CapSoVanBan/src/types.ts) | HIGH | Định nghĩa type hệ thống: DocumentCategory, DocumentRecord, IntakeSource, UrgencyLevel, SecrecyLevel |
