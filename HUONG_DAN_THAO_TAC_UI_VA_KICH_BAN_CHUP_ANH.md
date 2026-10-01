# HƯỚNG DẪN THAO TÁC GIAO DIỆN & KỊCH BẢN CHỤP ẢNH TỰ ĐỘNG (UI USER GUIDE & AI AUTOMATION SPEC)

> **Hệ thống**: Cấp số & Quản lý Văn bản Hành chính Điện tử (`HC-ADM-CapSoVanBan`)  
> **Phiên bản chuẩn hóa**: 2026.1 (Tương thích Nghị định 30/2020/NĐ-CP)  
> **Mục đích tài liệu**:  
> 1. **Dành cho Người dùng (Cán bộ Văn thư, Hành chính, Nhân viên)**: Hướng dẫn chi tiết từng bước thao tác, đặc biệt là **chỉ rõ chính xác phải copy cái gì, ở chỗ nào, dán vào đâu** trong từng luồng công việc.  
> 2. **Dành cho AI Agent (Browser Subagent, Playwright, Chrome DevTools MCP, Puppeteer)**: Hướng dẫn kỹ thuật **chụp ảnh đúng vị trí phần tử / hộp thoại**, khắc phục triệt để lỗi AI luôn chụp toàn bộ màn hình (Full-Page Viewport) gây thừa viền đen và mờ chi tiết.

---

## MỤC LỤC

1. [Cẩm Nang Kỹ Thuật Chụp Ảnh Cho AI (Khắc phục lỗi chụp cả màn hình)](#1-cẩm-nang-kỹ-thuật-chụp-ảnh-cho-ai-khắc-phục-lỗi-chụp-cả-màn-hình)
2. [Sổ Tay Tra Cứu Thao Tác Copy - Dán (Clipboard & Data Entry Guide)](#2-sổ-tay-tra-cứu-thao-tác-copy---dán-clipboard--data-entry-guide)
3. [Tổng quan Giao diện & Thanh Điều hướng (Navbar)](#3-tổng-quan-giao-diện--thanh-điều-hướng-navbar)
4. [Quy trình 1: Tiếp nhận & Cấp số Văn bản Tự động](#4-quy-trình-1-tiếp-nhận--cấp-số-văn-bản-tự-động)
   - [4.1 Tiếp nhận bằng Tải tệp (Scan/Ảnh/PDF)](#41-tiếp-nhận-bằng-tải-tệp-scanảnhpdf)
   - [4.2 Tiếp nhận bằng Chụp ảnh Camera trực tiếp](#42-tiếp-nhận-bằng-chụp-ảnh-camera-trực-tiếp)
   - [4.3 Nhập dữ liệu trích yếu & Lựa chọn danh mục cấp số (Copy - Dán Trích yếu)](#43-nhập-dữ-liệu-trích-yếu--lựa-chọn-danh-mục-cấp-số-copy---dán-trích-yếu)
   - [4.4 Tùy chỉnh số hiệu thủ công (Ghi đè số bù / số hồi tố)](#44-tùy-chỉnh-số-hiệu-thủ-công-ghi-đè-số-bù--số-hồi-tố)
   - [4.5 Xác nhận Cấp số & Lấy số hiệu đã cấp (Copy số vào văn bản Word)](#45-xác-nhận-cấp-số--lấy-số-hiệu-đã-cấp-copy-số-vào-văn-bản-word)
5. [Quy trình 2: Tra cứu, Lọc & Quản lý Kho Lưu trữ](#5-quy-trình-2-tra-cứu-lọc--quản-lý-kho-lưu-trữ)
   - [5.1 Tìm kiếm thông minh đa trường (Copy - Dán từ khóa tra cứu)](#51-tìm-kiếm-thông-minh-đa-trường-copy---dán-từ-khóa-tra-cứu)
   - [5.2 Thanh lọc theo Danh mục & Nguồn tiếp nhận](#52-thanh-lọc-theo-danh-mục--nguồn-tiếp-nhận)
   - [5.3 Chuyển đổi hiển thị & Sao chép nhanh số hiệu từ danh sách](#53-chuyển-đổi-hiển-thị--sao-chép-nhanh-số-hiệu-từ-danh-sách)
   - [5.4 Xuất Sổ đăng ký văn bản ra file CSV / Excel](#54-xuất-sổ-đăng-ký-văn-bản-ra-file-csv--excel)
6. [Quy trình 3: Xem Chi tiết Văn bản & Khai thác OCR](#6-quy-trình-3-xem-chi-tiết-văn-bản--khai-thác-ocr)
   - [6.1 Xem tài liệu số hóa độ phân giải cao & Dấu điện tử](#61-xem-tài-liệu-số-hóa-độ-phân-giải-cao--dấu-điện-tử)
   - [6.2 Khai thác toàn văn OCR (Copy chữ bóc tách dán vào Word/Email)](#62-khai-thác-toàn-văn-ocr-copy-chữ-bóc-tách-dán-vào-wordemail)
7. [Quy trình 4: In ấn Phiếu Cấp số & Văn bản Đóng dấu](#7-quy-trình-4-in-ấn-phiếu-cấp-số--văn-bản-đóng-dấu)
   - [7.1 Mẫu in Phiếu Tiếp nhận & Cấp số hành chính A4](#71-mẫu-in-phiếu-tiếp-nhận--cấp-số-hành-chính-a4)
   - [7.2 Mẫu in Văn bản Scan có đóng dấu số hiệu điện tử](#72-mẫu-in-văn-bản-scan-có-đóng-dấu-số-hiệu-điện-tử)
8. [Quy trình 5: Cấu hình Tiền tố, Hậu tố & Mẫu số](#8-quy-trình-5-cấu-hình-tiền-tố-hậu-tố--mẫu-số)
   - [8.1 Quản lý Danh mục chuẩn Nghị định 30](#81-quản-lý-danh-mục-chuẩn-nghị-định-30)
   - [8.2 Tùy biến mẫu số định dạng (Copy - Dán chuỗi token `{NUM}/{CODE}-{DEPT}`)](#82-tùy-biến-mẫu-số-định-dạng-copy---dán-chuỗi-token-numcode-dept)
9. [Quy trình 6: Kết nối & Đồng bộ Google Drive Dùng Chung](#9-quy-trình-6-kết-nối--đồng-bộ-google-drive-dùng-chung)
   - [9.1 Đăng nhập ủy quyền & Cấu hình Thư mục (Copy URL/ID thư mục Drive)](#91-đăng-nhập-ủy-quyền--cấu-hình-thư-mục-copy-urlid-thư-mục-drive)
   - [9.2 Trạng thái đồng bộ đa thiết bị](#92-trạng-thái-đồng-bộ-đa-thiết-bị)
10. [Bảng Phân tích Thống kê Số liệu (Dashboard Stats)](#10-bảng-phân-tích-thống-kê-số-liệu-dashboard-stats)
11. [Bảng Tổng hợp 12 Ảnh Chụp Màn Hình AI Cần Thực Hiện](#11-bảng-tổng-hợp-12-ảnh-chụp-màn-hình-ai-cần-thực-hiện)

---

## 1. CẨM NANG KỸ THUẬT CHỤP ẢNH CHO AI (KHẮC PHỤC LỖI CHỤP CẢ MÀN HÌNH)

### 1.1 Nguyên nhân AI luôn chụp toàn bộ màn hình
Khi AI Agent (Browser Subagent, Playwright, Chrome DevTools MCP) chụp ảnh màn hình, nếu chỉ gọi lệnh:
- `page.screenshot({ path: '...' })` hoặc `take_screenshot(full_page=True)`
thì trình duyệt sẽ chụp **toàn bộ Viewport 1440x900**. Kết quả là:
- Khi đang mở Modal (hộp thoại), 70% bức ảnh là khoảng tối mờ (backdrop đen), phần nội dung hộp thoại bị thu nhỏ ở giữa, chữ bé và mờ.
- Khi cần minh họa thanh Navbar, bức ảnh lại chứa cả trang trắng dài ngoằng phía dưới.
- Người xem tài liệu không thể đọc rõ các nút bấm và thông số.

### 1.2 Quy tắc BẮT BUỘC dành cho AI khi chụp ảnh
AI Agent **KHÔNG ĐƯỢC CHỤP CẢ MÀN HÌNH** trừ khi kịch bản yêu cầu rõ `capture_mode: "FULL_VIEWPORT"`. Trong mọi trường hợp khác, AI phải áp dụng 1 trong 3 cơ chế chụp định vị sau:

| Chế độ chụp (`capture_mode`) | Cách thức thực thi | Đối tượng áp dụng | Ví dụ lệnh Playwright |
|:---|:---|:---|:---|
| **`MODAL_CARD_ONLY`** | Chụp **riêng chiếc thẻ hộp thoại màu trắng/tối**, loại bỏ 100% nền tối đen mờ xung quanh | Các cửa sổ bật lên (Modal Intake, Detail, Print, Config, Drive) | `await page.locator('#intake-modal-card').screenshot({ path: '...' })` |
| **`ELEMENT_ONLY`** | Chụp **chính xác một phần tử DOM cụ thể** | Thanh Navbar, Phiếu in A4, Form bảng kê | `await page.locator('header').screenshot({ path: '...' })` |
| **`COMPONENT_CROP`** | Chụp một khối chức năng kèm vùng đệm (padding 12px) | Khung tìm kiếm, Khối thẻ lưới văn bản, Bảng chỉ số KPI | `await page.locator('.space-y-4').first().screenshot({ path: '...' })` |
| **`FULL_VIEWPORT`** | Chụp toàn màn hình (chỉ áp dụng cho trang tổng quan) | Trang Dashboard thống kê số liệu | `await page.screenshot({ path: '...' })` |

### 1.3 Cấu trúc Đặc tả Máy đọc (`ai_automation_step`) Mới
Trong tài liệu này, mỗi bước chụp ảnh của AI được chuẩn hóa với các trường định vị chính xác:

```yaml
ai_automation_step:
  step_id: "INTAKE_01_UPLOAD_FILE"
  route_or_view: "Giao diện chính -> Bấm #btn-open-intake-modal"
  
  # Chỉ dẫn kỹ thuật crop chụp hình
  capture_mode: "MODAL_CARD_ONLY" # MODAL_CARD_ONLY | ELEMENT_ONLY | COMPONENT_CROP | FULL_VIEWPORT
  crop_selector: "#intake-modal-card" # BẮT BUỘC chụp đúng selector này, KHÔNG chụp cả màn hình
  clip_bounding_box_hint: { x: 140, y: 30, width: 1160, height: 840 } # Tọa độ tham khảo
  visual_boundary: "Khung hộp thoại màu trắng bo góc ở trung tâm màn hình, cắt bỏ viền mờ backdrop"
  
  # Câu lệnh chụp mẫu dành cho AI
  ai_execution_code: "await page.locator('#intake-modal-card').screenshot({ path: 'docs/images/02_intake_modal_upload_tab.png' })"
  
  actions: [...]
  screenshot:
    file_name: "02_intake_modal_upload_tab.png"
    viewport: { width: 1440, height: 900 }
    caption_vn: "Lời bình chú thích ảnh tiếng Việt"
```

---

## 2. SỔ TAY TRA CỨU THAO TÁC COPY - DÁN (CLIPBOARD & DATA ENTRY GUIDE)

Bảng tra cứu dưới đây giải quyết triệt để câu hỏi: **"Người dùng phải copy cái gì, ở chỗ nào, dán vào đâu?"** trong toàn bộ hệ thống:

| STT | Luồng nghiệp vụ | Người dùng copy CÁI GÌ? | Copy Ở ĐÂU? (Nguồn dữ liệu) | DÁN VÀO ĐÂU? (Đích thao tác) | Thao tác thực hiện | Mục đích |
|:---:|:---|:---|:---|:---|:---|:---|
| **1** | **Cấp số văn bản mới** | Tên trích yếu nội dung văn bản | File Word dự thảo, PDF scan công văn đến, hoặc email chỉ đạo | Ô **"Trích yếu / Tiêu đề văn bản"** (`#input-intake-title`) trong Modal Tiếp nhận | Bôi đen -> `Ctrl + C` -> Bấm vào ô -> `Ctrl + V` | Đưa nội dung vào sổ đăng ký tự động |
| **2** | **Ghi đè số bù / số hồi tố** | Số hiệu văn bản giấy cũ hoặc số đối tác gửi | Bản cứng công văn đối tác gửi (Ví dụ: `125/QĐ-BGDĐT/2026`) | Mở mục *"Tùy chỉnh số hiệu thủ công"* -> Ô `#input-override-doc-number` | `Ctrl + C` -> `Ctrl + V` vào ô ghi đè số | Cấp số hồi tố hoặc số đặc thù ngoài luồng |
| **3** | **Lấy số hiệu sau khi cấp** | Chuỗi số hiệu văn bản chính thức (Ví dụ: `01/QĐ-VP`) | Bấm nút **"Sao chép số"** (`#btn-copy-success-doc-number`) tại màn hình Thành công | File Word văn bản chính thức cần phát hành (tại vị trí `Số: ....../QĐ-VP` ở góc trên bên trái) | Bấm nút **"Sao chép số"** -> Chuyển sang Word -> Bôi đen `Số: ...` -> `Ctrl + V` | Điền số hiệu chính thức lên văn bản phát hành |
| **4** | **Tra cứu nhanh văn bản** | Số hiệu văn bản hoặc từ khóa cần tìm (Ví dụ: `01/QĐ-VP`) | Tin nhắn chat Zalo/Teams hoặc Email yêu cầu của sếp/phòng ban | Ô tìm kiếm **"Tra cứu theo số văn bản..."** (`#input-search-documents`) trên thanh công cụ | `Ctrl + C` từ tin nhắn -> Click ô tìm kiếm -> `Ctrl + V` | Lọc tức thì văn bản trong sổ lưu trữ |
| **5** | **Chia sẻ số hiệu từ kho** | Số hiệu văn bản từ danh sách lưu trữ | Bấm biểu tượng Sao chép (nút `Copy`) ở cột "Số văn bản" trong bảng hoặc thẻ ảnh | Khung chat Zalo/Teams hoặc email phúc đáp cho người yêu cầu | Click nút Copy tại dòng văn bản -> Chuyển sang chat -> `Ctrl + V` | Cung cấp số hiệu cho đồng nghiệp phối hợp |
| **6** | **Khai thác nội dung OCR** | Toàn bộ chữ văn bản do AI bóc tách từ ảnh scan | Mở Modal Chi tiết -> Tab **"Nội dung OCR"** -> Bấm nút **"Sao chép toàn văn"** (`#btn-copy-detail-ocr-text`) | File Microsoft Word mới hoặc khung soạn thảo Email phúc đáp | Click nút "Sao chép toàn văn" -> Mở Word -> `Ctrl + V` | Lấy nội dung văn bản giấy để trích dẫn mà không phải gõ lại |
| **7** | **Cấu hình mẫu số** | Mẫu chuỗi token sinh số (Ví dụ: `{NUM}/{CODE}-{DEPT}`) | Bảng gợi ý mẫu chuẩn hoặc sổ tay quy chế văn thư | Ô **"Mẫu định dạng sinh số"** (`#input-category-format-template`) trong modal Cấu hình | `Ctrl + C` -> Click ô -> `Ctrl + V` -> Bấm Lưu cấu hình | Thiết lập định dạng số hiệu theo NĐ 30 |
| **8** | **Kết nối Google Drive** | Đường dẫn URL thư mục Google Drive hoặc Folder ID | Thanh địa chỉ trình duyệt Web khi đang mở thư mục Google Drive | Ô **"Folder ID hoặc Đường dẫn (URL) thư mục Google Drive"** (`#input-drive-folder-url`) | Click thanh địa chỉ URL của Google Drive -> `Ctrl + C` -> Dán vào ô `#input-drive-folder-url` (`Ctrl + V`) | Kết nối lưu trữ đám mây an toàn |

---

## 3. TỔNG QUAN GIAO DIỆN & THANH ĐIỀU HƯỚNG (NAVBAR)

### Hướng dẫn Người dùng
Thanh điều hướng trên cùng (Navbar) là trung tâm điều khiển xuyên suốt toàn bộ ứng dụng:
- **Logo & Tiêu đề**: "Documents Number - Cấp số tự động".
- **Tab Kho lưu trữ & Tra cứu (`#btn-nav-archive`)**: Xem danh sách toàn bộ văn bản trong sổ, lọc và xuất dữ liệu.
- **Tab Thống kê số liệu (`#btn-nav-stats`)**: Xem biểu đồ tỷ lệ tiếp nhận, số lượng từng danh mục và báo cáo số liệu.
- **Nút Trạng thái Google Drive (`#btn-open-google-drive`)**: Đèn xanh/vàng thông báo trạng thái đồng bộ đám mây và mở cửa sổ cấu hình lưu trữ cá nhân (BYOS).
- **Nút Đồng bộ nhanh (`#btn-sync-google-drive`)**: Kéo dữ liệu mới nhất từ Google Drive về máy.
- **Nút Cấu hình Tiền/Hậu tố (`#btn-open-category-config`)**: Quản lý các loại văn bản, quy tắc định dạng số và mẫu số.
- **Nút Cấp số mới (`#btn-open-intake-modal`)**: Mở cửa sổ tiếp nhận và sinh số văn bản.

### Kịch bản Chụp ảnh cho AI (Chỉ chụp thanh Navbar, không chụp cả màn hình)
```yaml
ai_automation_step:
  step_id: "NAV_01_OVERVIEW"
  route_or_view: "Giao diện chính - Kho lưu trữ"
  
  # Cấu hình chụp định vị
  capture_mode: "ELEMENT_ONLY"
  crop_selector: "header"
  clip_bounding_box_hint: { x: 0, y: 0, width: 1440, height: 68 }
  visual_boundary: "Chỉ chụp đúng dải thanh Header màu trắng trên cùng, cắt bỏ toàn bộ phần nội dung bên dưới"
  ai_execution_code: "await page.locator('header').screenshot({ path: 'docs/images/01_navbar_tong_quan.png' })"
  
  actions:
    - action: "GOTO"
      url: "https://capsovanban.vercel.app" # hoặc "http://localhost:5174"
    - action: "WAIT_FOR"
      selector: "header"
  screenshot:
    file_name: "01_navbar_tong_quan.png"
    viewport: { width: 1440, height: 900 }
    target: "ELEMENT"
    selector: "header"
    annotations:
      - selector: "#btn-nav-archive"
        label: "1"
        title: "Tab Kho lưu trữ & Tra cứu"
      - selector: "#btn-nav-stats"
        label: "2"
        title: "Tab Thống kê số liệu"
      - selector: "#btn-open-google-drive"
        label: "3"
        title: "Trạng thái & Cấu hình Google Drive"
      - selector: "#btn-open-category-config"
        label: "4"
        title: "Cấu hình Tiền/Hậu tố & Danh mục"
      - selector: "#btn-open-intake-modal"
        label: "5"
        title: "Nút Tiếp nhận & Cấp số Văn bản"
    caption_vn: "Thanh điều hướng trung tâm điều khiển hệ thống Cấp số văn bản"
```

---

## 4. QUY TRÌNH 1: TIẾP NHẬN & CẤP SỐ VĂN BẢN TỰ ĐỘNG

### 4.1 Tiếp nhận bằng Tải tệp (Scan/Ảnh/PDF)

#### Hướng dẫn Người dùng
1. Bấm nút màu xanh **"Tiếp nhận & Cấp số"** trên thanh điều hướng (`#btn-open-intake-modal`).
2. Mặc định hệ thống chọn tab **"Tải tệp"** (`#tab-intake-upload`).
3. Kéo thả file ảnh scan hoặc file PDF văn bản vào khung nét đứt, hoặc bấm trực tiếp để chọn file từ máy tính.
4. Hệ thống hỗ trợ nạp **nhiều trang cùng lúc** (Multi-page document). Mỗi trang sẽ được đánh số thứ tự từ 1 đến N kèm dung lượng chi tiết.
5. Nếu chọn nhầm trang, người dùng bấm biểu tượng thùng rác màu xám cạnh trang đó để gỡ bỏ.

#### Kịch bản Chụp ảnh cho AI (Chỉ chụp hộp thoại modal, không chụp nền mờ)
```yaml
ai_automation_step:
  step_id: "INTAKE_01_UPLOAD_FILE"
  route_or_view: "Modal Tiếp nhận & Cấp số - Tab Tải tệp"
  
  # Cấu hình chụp định vị
  capture_mode: "MODAL_CARD_ONLY"
  crop_selector: "#intake-modal-card"
  clip_bounding_box_hint: { x: 140, y: 30, width: 1160, height: 840 }
  visual_boundary: "Chỉ chụp hộp thoại màu trắng #intake-modal-card, không lấy nền tối đen mờ xung quanh"
  ai_execution_code: "await page.locator('#intake-modal-card').screenshot({ path: 'docs/images/02_intake_modal_upload_tab.png' })"
  
  actions:
    - action: "CLICK"
      selector: "#btn-open-intake-modal"
    - action: "WAIT_FOR"
      selector: "#intake-modal-card"
    - action: "CLICK"
      selector: "#tab-intake-upload"
  screenshot:
    file_name: "02_intake_modal_upload_tab.png"
    viewport: { width: 1440, height: 900 }
    target: "MODAL"
    selector: "#intake-modal-card"
    annotations:
      - selector: "#tab-intake-upload"
        label: "1"
        title: "Tab Tải tệp tài liệu / Scan"
      - selector: "label[for='file-upload-input']"
        label: "2"
        title: "Khu vực kéo thả và chọn tệp đính kèm"
      - selector: "#select-intake-category"
        label: "3"
        title: "Hộp chọn Danh mục văn bản"
      - selector: "#input-intake-title"
        label: "4"
        title: "Ô nhập Trích yếu / Tiêu đề văn bản"
    caption_vn: "Giao diện Cửa sổ Tiếp nhận & Cấp số văn bản tự động ở chế độ Tải tệp"
```

---

### 4.2 Tiếp nhận bằng Chụp ảnh Camera trực tiếp

#### Hướng dẫn Người dùng
1. Tại cột trái của cửa sổ Tiếp nhận, bấm chọn tab **"Chụp ảnh"** (`#tab-intake-camera`).
2. Cho phép trình duyệt truy cập Webcam / Camera của thiết bị khi xuất hiện thông báo cấp quyền.
3. Đặt văn bản vào khung hình chữ nhật căn chỉnh màu xanh lá cây (`KHUNG CĂN CHỈNH TÀI LIỆU`).
4. Nếu đang dùng máy tính bảng hoặc điện thoại có nhiều camera, bấm nút **"Đổi góc máy"** để chuyển đổi giữa camera trước và camera sau.
5. Bấm nút màu xanh lục **"Chụp & Phân tích OCR"** (`#btn-capture-camera`). Tấm ảnh chụp sẽ được tự động đưa vào danh sách các trang tài liệu.

#### Kịch bản Chụp ảnh cho AI
```yaml
ai_automation_step:
  step_id: "INTAKE_02_CAMERA_SCAN"
  route_or_view: "Modal Tiếp nhận - Tab Chụp ảnh Camera"
  
  capture_mode: "MODAL_CARD_ONLY"
  crop_selector: "#intake-modal-card"
  clip_bounding_box_hint: { x: 140, y: 30, width: 1160, height: 840 }
  visual_boundary: "Chụp riêng hộp thoại modal #intake-modal-card đang mở tab Camera"
  ai_execution_code: "await page.locator('#intake-modal-card').screenshot({ path: 'docs/images/03_intake_camera_tab.png' })"
  
  actions:
    - action: "CLICK"
      selector: "#tab-intake-camera"
    - action: "WAIT_FOR"
      selector: "#btn-capture-camera"
  screenshot:
    file_name: "03_intake_camera_tab.png"
    viewport: { width: 1440, height: 900 }
    target: "MODAL"
    selector: "#intake-modal-card"
    annotations:
      - selector: "#tab-intake-camera"
        label: "1"
        title: "Tab Chụp ảnh trực tiếp"
      - selector: "video, .aspect-4\\/3"
        label: "2"
        title: "Khung căn chỉnh chụp tài liệu từ Camera"
      - selector: "#btn-capture-camera"
        label: "3"
        title: "Nút bấm Chụp ảnh & Đưa vào hồ sơ"
    caption_vn: "Tính năng chụp ảnh văn bản trực tiếp từ Camera máy tính / điện thoại"
```

---

### 4.3 Nhập dữ liệu trích yếu & Lựa chọn danh mục cấp số (Copy - Dán Trích yếu)

#### Hướng dẫn Người dùng & Thao tác Copy - Dán
Tại cột bên phải của cửa sổ Tiếp nhận:

1. **Khung Số văn bản chính thức (Banner đầu form)**:
   - Hệ thống lập tức hiển thị số hiệu văn bản sẽ được cấp với định dạng chuẩn, ví dụ: `01/QĐ-VP`, `15/CV-VP`, `03/HĐ-KD`.
2. **Chọn Danh mục Văn bản (`#select-intake-category`)**:
   - Chọn loại văn bản: Quyết định, Công văn, Tờ trình, Hợp đồng, Biên bản, Kế hoạch...
   - Ngay khi thay đổi danh mục, số hiệu văn bản sẽ tự động nhảy số kế tiếp theo bộ đếm riêng của danh mục đó mà không làm ảnh hưởng đến các danh mục khác.
3. 📋 **Hành động Copy - Dán Trích yếu nội dung**:
   - **Copy cái gì**: Câu trích yếu nội dung tóm tắt văn bản.
   - **Copy ở đâu**: Từ file Word dự thảo (ví dụ dòng: *"Về việc phê duyệt kế hoạch chuyển đổi số năm 2026"*), hoặc bôi đen trích yếu trên bản scan PDF/email đến rồi bấm `Ctrl + C`.
   - **Dán vào đâu**: Bấm chuột vào ô **"Trích yếu / Tiêu đề văn bản"** (`#input-intake-title`) rồi bấm `Ctrl + V`.
4. **Cơ quan ban hành & Người ký**:
   - Mặc định là tên đơn vị công tác (ví dụ: *Công ty Cổ phần VCCORP*).
   - Nhập họ tên và chức vụ người ký duyệt (ví dụ: *Nguyễn Văn An - Tổng Giám đốc*).
5. **Nơi nhận & Phòng ban xử lý**:
   - Nhập nơi nhận văn bản (ví dụ: *Ban Giám đốc, Phòng HCNS, Kế toán...*).
   - Nhập mã phòng ban viết tắt (ví dụ: `VP`, `HCNS`, `KD`, `TCKT`). Mã này sẽ xuất hiện trên số hiệu văn bản nếu mẫu số có chứa `{DEPT}`.
6. **Mức độ khẩn & Mật**:
   - Mức độ khẩn: *Thường, Khẩn, Thượng khẩn, Hỏa tốc*.
   - Mức độ mật: *Thường, Mật, Tối mật, Tuyệt mật*.

#### Kịch bản Chụp ảnh cho AI
```yaml
ai_automation_step:
  step_id: "INTAKE_03_FORM_FILL"
  route_or_view: "Modal Tiếp nhận - Nhập thông tin & Preview số hiệu"
  
  capture_mode: "MODAL_CARD_ONLY"
  crop_selector: "#intake-modal-card"
  clip_bounding_box_hint: { x: 140, y: 30, width: 1160, height: 840 }
  visual_boundary: "Chụp riêng hộp thoại modal #intake-modal-card đã điền dữ liệu"
  ai_execution_code: "await page.locator('#intake-modal-card').screenshot({ path: 'docs/images/04_intake_form_details.png' })"
  
  clipboard_actions:
    copy_from: "File Word dự thảo / Kế hoạch công tác năm 2026"
    paste_to: "#input-intake-title"
    sample_value: "Quyết định ban hành Quy chế tiếp nhận và quản lý văn bản hành chính năm 2026"
  
  actions:
    - action: "SELECT"
      selector: "#select-intake-category"
      value: "cat-1" # Mã Quyết định
    - action: "FILL"
      selector: "#input-intake-title"
      value: "Quyết định ban hành Quy chế tiếp nhận và quản lý văn bản hành chính năm 2026"
    - action: "WAIT_FOR"
      selector: "#btn-issue-number-submit:not([disabled])"
  screenshot:
    file_name: "04_intake_form_details.png"
    viewport: { width: 1440, height: 900 }
    target: "MODAL"
    selector: "#intake-modal-card"
    annotations:
      - selector: ".bg-gradient-to-r.from-blue-900"
        label: "1"
        title: "Banner hiển thị số hiệu văn bản tự động chính thức"
      - selector: "#select-intake-category"
        label: "2"
        title: "Hộp chọn Danh mục văn bản"
      - selector: "#input-intake-title"
        label: "3"
        title: "Trích yếu nội dung văn bản (đã dán dữ liệu)"
      - selector: "#btn-issue-number-submit"
        label: "4"
        title: "Nút bấm Xác nhận Cấp số & Lưu trữ vào sổ"
    caption_vn: "Điền thông tin trích yếu và hệ thống xem trước số hiệu tự động được cấp"
```

---

### 4.4 Tùy chỉnh số hiệu thủ công (Ghi đè số bù / số hồi tố)

#### Hướng dẫn Người dùng & Thao tác Copy - Dán
Trong trường hợp văn thư cần đăng ký số bù, số hồi tố hoặc số đặc thù từ đối tác chuyển giao:
1. Kéo xuống dưới cùng của form bên phải, bấm vào dòng chữ màu xanh: **"Tùy chỉnh số hiệu thủ công (Nếu muốn ghi đè số tự động)"** (`details`).
2. 📋 **Hành động Copy - Dán Số hiệu thủ công**:
   - **Copy cái gì**: Số hiệu đặc biệt hoặc số hồi tố (ví dụ: `99/QĐ-ĐẶC_BIỆT/2026` hoặc `125/QĐ-BGDĐT/2026`).
   - **Copy ở đâu**: Từ văn bản giấy của đối tác hoặc từ sổ tay văn thư lưu trữ cũ.
   - **Dán vào đâu**: Dán vào ô văn bản **"Nhập số hiệu ghi đè"** (`#input-override-doc-number`).
3. Khung số văn bản chính thức trên banner sẽ lập tức cập nhật theo giá trị ghi đè này. Để trống nếu muốn dùng lại số tự động của hệ thống.

---

### 4.5 Xác nhận Cấp số & Lấy số hiệu đã cấp (Copy số vào văn bản Word)

#### Hướng dẫn Người dùng & Thao tác Copy - Dán
1. Bấm nút màu xanh **"Xác nhận Cấp số & Lưu trữ vào sổ"** (`#btn-issue-number-submit`).
2. Hệ thống tiến hành ghi sổ, cập nhật số đếm danh mục và tải tệp lên Google Drive.
3. Màn hình thông báo **"ĐÃ CẤP SỐ THÀNH CÔNG VÀO SỔ LƯU TRỮ"** xuất hiện.
4. 📋 **Hành động Copy Số hiệu đã cấp để dán vào file Word phát hành**:
   - **Copy cái gì**: Số văn bản chính thức vừa sinh (ví dụ: `01/QĐ-VP`).
   - **Copy ở đâu**: Bấm nút **"Sao chép số"** (`#btn-copy-success-doc-number`) ngay cạnh dòng số to màu đen trên màn hình. Nút sẽ chuyển sang nhãn màu xanh lá **"Đã sao chép!"**.
   - **Dán vào đâu**: Mở file Microsoft Word quyết định/văn bản cần ban hành trên máy tính của bạn -> Đặt con trỏ tại vị trí `Số: ....../QĐ-VP` ở góc trên bên trái văn bản -> Bấm `Ctrl + V` để chèn số hiệu chính thức.
5. Người dùng có 3 hành động nhanh tiếp theo:
   - **In Phiếu tiếp nhận & Cấp số (`#btn-print-slip-after-issue`)**: Mở ngay phiếu cấp số chuẩn để in kẹp vào hồ sơ.
   - **Tiếp tục cấp số văn bản khác**: Xóa trắng form để cấp văn bản tiếp theo.
   - **Về Kho lưu trữ**: Đóng modal và chuyển về danh sách tổng hợp.

#### Kịch bản Chụp ảnh cho AI (Chỉ chụp hộp thoại thành công, không chụp nền mờ)
```yaml
ai_automation_step:
  step_id: "INTAKE_04_SUCCESS_SCREEN"
  route_or_view: "Modal Tiếp nhận - Màn hình Cấp số thành công"
  
  capture_mode: "MODAL_CARD_ONLY"
  crop_selector: "#intake-modal-card"
  clip_bounding_box_hint: { x: 380, y: 150, width: 680, height: 600 }
  visual_boundary: "Chụp riêng hộp thoại thành công #intake-modal-card"
  ai_execution_code: "await page.locator('#intake-modal-card').screenshot({ path: 'docs/images/05_intake_success_result.png' })"
  
  clipboard_actions:
    copy_from: "Bấm nút #btn-copy-success-doc-number tại màn hình thành công"
    paste_to: "File Word quyết định chính thức tại mục 'Số: ......'"
  
  actions:
    - action: "CLICK"
      selector: "#btn-issue-number-submit"
    - action: "WAIT_FOR"
      selector: "#btn-copy-success-doc-number"
  screenshot:
    file_name: "05_intake_success_result.png"
    viewport: { width: 1440, height: 900 }
    target: "MODAL"
    selector: "#intake-modal-card"
    annotations:
      - selector: "h3.font-mono"
        label: "1"
        title: "Số văn bản chính thức đã vào sổ đăng ký"
      - selector: "#btn-copy-success-doc-number"
        label: "2"
        title: "Nút Sao chép số hiệu để dán vào file Word phát hành"
      - selector: "#btn-print-slip-after-issue"
        label: "3"
        title: "Nút In phiếu tiếp nhận kẹp hồ sơ"
      - selector: "button:has-text('Tiếp tục cấp số văn bản khác')"
        label: "4"
        title: "Tiếp tục cấp số mới"
    caption_vn: "Màn hình thông báo cấp số thành công kèm nút sao chép số và in phiếu kẹp hồ sơ"
```

---

## 5. QUY TRÌNH 2: TRA CỨU, LỌC & QUẢN LÝ KHO LƯU TRỮ

### 5.1 Tìm kiếm thông minh đa trường (Copy - Dán từ khóa tra cứu)

#### Hướng dẫn Người dùng & Thao tác Copy - Dán
1. Tại màn hình chính (Tab **Kho lưu trữ & Tra cứu**), định vị thanh công cụ phía trên danh sách.
2. 📋 **Hành động Copy - Dán Từ khóa tra cứu**:
   - **Copy cái gì**: Số văn bản (ví dụ: `01/QĐ-VP`), hoặc trích yếu nội dung (ví dụ: *"an toàn thông tin"*), hoặc mã xác thực (ví dụ: `VCC-2026-AB12`).
   - **Copy ở đâu**: Từ tin nhắn chat Zalo/Teams của sếp, từ email yêu cầu phối hợp của phòng ban, hoặc từ sổ tay công việc.
   - **Dán vào đâu**: Bấm chuột vào ô tìm kiếm **"Tra cứu theo số văn bản, trích yếu, người ký..."** (`#input-search-documents`) rồi bấm `Ctrl + V`.
3. Cơ chế tìm kiếm hoạt động tức thời (Real-time Instant Search) quét đồng thời:
   - Số hiệu văn bản.
   - Trích yếu tiêu đề văn bản.
   - Cơ quan ban hành hoặc Người ký.
   - Nơi nhận hoặc Phòng ban.
   - Toàn văn nội dung số hóa OCR.
   - Mã xác thực sổ văn bản.

---

### 5.2 Thanh lọc theo Danh mục & Nguồn tiếp nhận

#### Hướng dẫn Người dùng
1. **Thanh Chip lọc Danh mục (Category Chips Bar)**:
   - Hiển thị danh sách các loại văn bản thực tế đang có trong kho dữ liệu (Quyết định, Công văn, Hợp đồng...).
   - Mỗi chip hiển thị số lượng văn bản hiện có bên trong.
   - Bấm vào tên loại văn bản để chỉ xem các văn bản thuộc loại đó; bấm **"Tất cả"** để xem toàn bộ.
   - Sử dụng 2 nút mũi tên trái/phải (`ChevronLeft` / `ChevronRight`) ở 2 đầu thanh nếu danh mục dài vượt chiều ngang màn hình.
2. **Bộ lọc Nguồn tiếp nhận (Intake Source Filter)**:
   - Nằm ở cuối thanh danh mục, gồm: `Tất cả nguồn`, `Tải tệp`, `Chụp ảnh`, `Email`.
   - Giúp cán bộ hành chính lọc nhanh các văn bản được nạp từ nguồn cụ thể.

#### Kịch bản Chụp ảnh cho AI (Chỉ chụp khối thanh tìm kiếm và bộ lọc)
```yaml
ai_automation_step:
  step_id: "ARCHIVE_01_SEARCH_AND_FILTER"
  route_or_view: "Kho lưu trữ - Thanh tìm kiếm và bộ lọc"
  
  # Cấu hình chụp định vị
  capture_mode: "COMPONENT_CROP"
  crop_selector: ".bg-white.rounded-2xl.p-4"
  clip_bounding_box_hint: { x: 80, y: 88, width: 1280, height: 160 }
  visual_boundary: "Chỉ chụp khối card màu trắng chứa ô tìm kiếm, các nút xem và dải chip danh mục"
  ai_execution_code: "await page.locator('.bg-white.rounded-2xl.p-4').first().screenshot({ path: 'docs/images/06_archive_search_filter_bar.png' })"
  
  actions:
    - action: "CLICK"
      selector: "#btn-nav-archive"
    - action: "WAIT_FOR"
      selector: "#input-search-documents"
  screenshot:
    file_name: "06_archive_search_filter_bar.png"
    viewport: { width: 1440, height: 900 }
    target: "ELEMENT"
    selector: ".bg-white.rounded-2xl.p-4"
    annotations:
      - selector: "#input-search-documents"
        label: "1"
        title: "Ô tìm kiếm tức thời đa trường (Nơi dán số hiệu hoặc trích yếu)"
      - selector: ".category-filter-scrollbar"
        label: "2"
        title: "Thanh chip lọc nhanh theo từng loại văn bản"
      - selector: "#btn-view-mode-table"
        label: "3"
        title: "Nút chuyển chế độ xem Dạng bảng chi tiết"
      - selector: "#btn-view-mode-grid"
        label: "4"
        title: "Nút chuyển chế độ xem Dạng lưới thẻ ảnh"
      - selector: "#btn-export-excel-csv"
        label: "5"
        title: "Nút Xuất Sổ đăng ký văn bản ra file CSV / Excel"
    caption_vn: "Thanh công cụ tra cứu, tìm kiếm đa trường và dải chip lọc phân loại văn bản"
```

---

### 5.3 Chuyển đổi hiển thị & Sao chép nhanh số hiệu từ danh sách

#### Hướng dẫn Người dùng & Thao tác Copy - Dán
Hệ thống cung cấp 2 chế độ hiển thị tối ưu cho các thói quen nghiệp vụ khác nhau:

1. **Dạng Bảng Chi Tiết (Table View - `#btn-view-mode-table`)**:
   - Phù hợp với công tác văn thư truyền thống tương tự Sổ đăng ký văn bản trên giấy.
   - Các cột thông tin gồm: *Số văn bản, Loại văn bản, Trích yếu, Cơ quan & Người ký, Ngày cấp số, Nguồn tiếp nhận*.
   - 📋 **Hành động Copy Số văn bản gửi đồng nghiệp**:
     - Bấm biểu tượng **Copy** (`Copy` icon) tại cột *Số văn bản* hoặc cột *Thao tác* trên dòng văn bản mong muốn. Biểu tượng chuyển sang dấu tích xanh lá `✓`.
     - Chuyển sang Zalo, Microsoft Teams hoặc Email của người hỏi -> Bấm `Ctrl + V` để gửi ngay số hiệu văn bản cho đồng nghiệp.
   - Cột hành động chứa các nút: **Xem chi tiết**, **In ấn**, **Mở trên Google Drive**.

2. **Dạng Lưới Thẻ Ảnh (Grid View - `#btn-view-mode-grid`)**:
   - Phù hợp kiểm tra nhanh tài liệu scan và ảnh gốc.
   - Mỗi thẻ hiển thị ảnh bìa trang 1 của văn bản với con dấu số hiệu điện tử kẹp nổi trên góc trái.
   - Bấm vào biểu tượng Copy ở chân thẻ để chép số hiệu, hoặc bấm vào thân thẻ để mở cửa sổ xem chi tiết.

#### Kịch bản Chụp ảnh cho AI (Chỉ chụp khối lưới thẻ ảnh)
```yaml
ai_automation_step:
  step_id: "ARCHIVE_02_GRID_VIEW"
  route_or_view: "Kho lưu trữ - Chế độ xem dạng lưới hình ảnh"
  
  capture_mode: "COMPONENT_CROP"
  crop_selector: ".grid.grid-cols-1.sm\\:grid-cols-2"
  clip_bounding_box_hint: { x: 80, y: 260, width: 1280, height: 600 }
  visual_boundary: "Chỉ chụp khu vực các thẻ văn bản dạng lưới, không chụp toàn trang"
  ai_execution_code: "await page.locator('.grid.grid-cols-1.sm\\:grid-cols-2').first().screenshot({ path: 'docs/images/07_archive_grid_view.png' })"
  
  actions:
    - action: "CLICK"
      selector: "#btn-view-mode-grid"
    - action: "WAIT_FOR"
      selector: ".grid.grid-cols-1.sm\\:grid-cols-2"
  screenshot:
    file_name: "07_archive_grid_view.png"
    viewport: { width: 1440, height: 900 }
    target: "ELEMENT"
    selector: ".grid.grid-cols-1.sm\\:grid-cols-2"
    annotations:
      - selector: ".aspect-16\\/10"
        label: "1"
        title: "Ảnh thu nhỏ trang 1 văn bản số hóa"
      - selector: ".absolute.top-2\\.5.left-2\\.5"
        label: "2"
        title: "Nhãn số hiệu văn bản chính thức kẹp trên ảnh"
      - selector: "button[title='Sao chép số văn bản']"
        label: "3"
        title: "Nút Sao chép nhanh số hiệu gửi đồng nghiệp"
    caption_vn: "Giao diện Kho lưu trữ dạng Lưới thẻ ảnh có dấu số điện tử trực quan"
```

---

### 5.4 Xuất Sổ đăng ký văn bản ra file CSV / Excel

#### Hướng dẫn Người dùng
1. Lọc hoặc tìm kiếm tập hợp văn bản cần kết xuất (hoặc để mặc định nếu muốn xuất toàn bộ sổ).
2. Bấm nút **"Xuất Sổ CSV"** (`#btn-export-excel-csv`) cạnh nút chế độ xem.
3. Trình duyệt sẽ tự động tải về file có định dạng: `So_Dang_Ky_Van_Ban_YYYY-MM-DD.csv`.
4. File được mã hóa UTF-8 chuẩn kèm BOM (`\uFEFF`), đảm bảo mở trực tiếp bằng Microsoft Excel không bao giờ bị lỗi font tiếng Việt.
5. Cấu trúc file bao gồm 13 cột: *Số văn bản, Loại văn bản, Trích yếu, Cơ quan ban hành, Người ký, Nơi nhận, Ngày văn bản, Ngày cấp số, Phòng ban, Nguồn tiếp nhận, Mức độ khẩn, Mức độ mật, Mã xác thực*.

---

## 6. QUY TRÌNH 3: XEM CHI TIẾT VĂN BẢN & KHAI THÁC OCR

### 6.1 Xem tài liệu số hóa độ phân giải cao & Dấu điện tử

#### Hướng dẫn Người dùng
1. Tại bảng hoặc lưới văn bản, bấm vào dòng văn bản hoặc nút **Xem & In**.
2. Cửa sổ **DocumentDetailModal** (`#document-detail-modal-card`) xuất hiện gồm 2 phân vùng:
   - **Vùng xem ảnh tài liệu bên trái**:
     - Hiển thị bản scan tài liệu sắc nét.
     - Thanh công cụ ảnh: **Phóng to (`ZoomIn`)**, **Thu nhỏ (`ZoomOut`)**, **Xoay 90 độ (`RotateCw`)**.
     - Thanh chọn trang nếu tài liệu có nhiều trang (`Trang 1 / Trang 2...`).
     - Tùy chọn **"Dấu điện tử"**: Tự động chèn con dấu số hiệu hành chính màu xanh chuẩn thể thức vào góc trên văn bản để người dùng kiểm tra thể thức phát hành.
   - **Vùng bảng thông tin bên phải**:
     - Xem đầy đủ trích yếu, số ký hiệu, ngày ký, nơi nhận, mã bảo mật.
     - Bấm nút **"Sao chép"** (`#btn-copy-detail-doc-number`) để copy số hiệu bất cứ lúc nào.

#### Kịch bản Chụp ảnh cho AI (Chỉ chụp hộp thoại Chi tiết, không chụp nền mờ)
```yaml
ai_automation_step:
  step_id: "DETAIL_01_VIEWER"
  route_or_view: "Modal Chi tiết Văn bản - Trình xem tài liệu số hóa"
  
  capture_mode: "MODAL_CARD_ONLY"
  crop_selector: "#document-detail-modal-card"
  clip_bounding_box_hint: { x: 140, y: 30, width: 1160, height: 840 }
  visual_boundary: "Chỉ chụp hộp thoại modal #document-detail-modal-card, không lấy nền tối mờ"
  ai_execution_code: "await page.locator('#document-detail-modal-card').screenshot({ path: 'docs/images/08_document_detail_viewer.png' })"
  
  actions:
    - action: "CLICK"
      selector: "button:has-text('Xem & In'), tr.group"
    - action: "WAIT_FOR"
      selector: "#document-detail-modal-card"
  screenshot:
    file_name: "08_document_detail_viewer.png"
    viewport: { width: 1440, height: 900 }
    target: "MODAL"
    selector: "#document-detail-modal-card"
    annotations:
      - selector: ".font-mono.text-emerald-400"
        label: "1"
        title: "Số ký hiệu chính thức của văn bản"
      - selector: "#btn-copy-detail-doc-number"
        label: "2"
        title: "Nút sao chép số hiệu văn bản"
      - selector: ".p-2.rounded-xl.bg-slate-900\\/90"
        label: "3"
        title: "Thanh công cụ thu phóng và xoay ảnh scan"
      - selector: "button:has-text('In văn bản / Phiếu')"
        label: "4"
        title: "Nút chuyển nhanh sang cửa sổ In ấn"
    caption_vn: "Cửa sổ Chi tiết Văn bản với trình xem ảnh số hóa cao cấp và thông tin pháp lý"
```

---

### 6.2 Khai thác toàn văn OCR (Copy chữ bóc tách dán vào Word/Email)

#### Hướng dẫn Người dùng & Thao tác Copy - Dán
Ở cột bên phải của cửa sổ Chi tiết, người dùng chuyển đổi giữa các tab:
1. **Tab Thông tin (`info`)**: Toàn bộ thuộc tính hành chính của văn bản.
2. 📋 **Tab Nội dung OCR (`ocr`) - Khai thác chữ bóc tách tự động**:
   - Bấm vào tab **"Nội dung OCR"**. Toàn văn nội dung chữ do hệ thống AI trích xuất từ hình ảnh scan sẽ xuất hiện trong khung màu đen xám.
   - **Copy cái gì**: Toàn bộ chữ nội dung của văn bản giấy đã scan.
   - **Copy ở đâu**: Bấm vào nút màu xanh dương **"Sao chép toàn văn"** (`#btn-copy-detail-ocr-text`) ở góc trên bên phải khung OCR. Nút sẽ chuyển sang nhãn **"Đã sao chép"**.
   - **Dán vào đâu**: Mở phần mềm Microsoft Word hoặc ứng dụng Email (Outlook, Gmail) -> Bấm `Ctrl + V` để dán toàn bộ văn bản vào làm tài liệu soạn thảo hoặc phúc đáp mà không cần phải gõ lại thủ công từng chữ!
3. **Tab Lịch sử (`history`)**: Dòng thời gian ghi nhận vết thao tác: Thời điểm tiếp nhận, ai cấp số, lưu trữ Google Drive, in ấn phiếu tiếp nhận...

---

## 7. QUY TRÌNH 4: IN ẤN PHIẾU CẤP SỐ & VĂN BẢN ĐÓNG DẤU

### 7.1 Mẫu in Phiếu Tiếp nhận & Cấp số hành chính A4

#### Hướng dẫn Người dùng
1. Từ danh sách văn bản (bấm nút Máy in) hoặc từ cửa sổ chi tiết (bấm nút **In văn bản / Phiếu**), cửa sổ **PrintDocumentModal** (`#print-modal-card`) sẽ mở ra.
2. Chọn bố cục **"Phiếu cấp số"** trên thanh tiêu đề.
3. Bản xem trước khổ giấy A4 chuẩn xuất hiện với các nội dung chuẩn hóa:
   - Quốc hiệu: *CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM - Độc lập - Tự do - Hạnh phúc*.
   - Cơ quan chủ quản: *CÔNG TY CỔ PHẦN VCCORP - VĂN PHÒNG TIẾP NHẬN & LƯU TRỮ*.
   - Tiêu đề nổi bật: **PHIẾU TIẾP NHẬN & CẤP SỐ VĂN BẢN HÀNH CHÍNH**.
   - Khung số hiệu chính thức và bảng kê 8 thuộc tính (Trích yếu, Loại, Nơi nhận, Ngày ký, Mức độ khẩn...).
   - Khung chữ ký xác nhận của Văn thư tiếp nhận và Người nộp/Cán bộ phát hành.
   - Mã vạch tra cứu điện tử.
4. Bấm nút màu xanh lá **"In ngay"** để mở hộp thoại in của Windows/Mac (`window.print()`). Người dùng có thể in ra máy in vật lý hoặc chọn **"Save as PDF"** để lưu file tài liệu.

#### Kịch bản Chụp ảnh cho AI (Chỉ chụp hộp thoại In ấn)
```yaml
ai_automation_step:
  step_id: "PRINT_01_SLIP"
  route_or_view: "Modal In ấn - Mẫu Phiếu cấp số hành chính A4"
  
  capture_mode: "MODAL_CARD_ONLY"
  crop_selector: "#print-modal-card"
  clip_bounding_box_hint: { x: 270, y: 25, width: 900, height: 850 }
  visual_boundary: "Chỉ chụp hộp thoại modal in ấn #print-modal-card, không chụp nền mờ"
  ai_execution_code: "await page.locator('#print-modal-card').screenshot({ path: 'docs/images/09_print_modal_slip_preview.png' })"
  
  actions:
    - action: "CLICK"
      selector: "button[title='In phiếu hoặc văn bản có dấu']"
    - action: "WAIT_FOR"
      selector: "#print-modal-card"
    - action: "CLICK"
      selector: "button:has-text('Phiếu cấp số')"
  screenshot:
    file_name: "09_print_modal_slip_preview.png"
    viewport: { width: 1440, height: 900 }
    target: "MODAL"
    selector: "#print-modal-card"
    annotations:
      - selector: "button:has-text('Phiếu cấp số')"
        label: "1"
        title: "Tùy chọn in Phiếu cấp số hành chính"
      - selector: "button:has-text('Văn bản có dấu')"
        label: "2"
        title: "Tùy chọn in Bản scan kèm con dấu số"
      - selector: "#printable-a4-document"
        label: "3"
        title: "Trang A4 Phiếu Tiếp nhận & Cấp số chuẩn quy thức"
      - selector: "button:has-text('In ngay')"
        label: "4"
        title: "Nút gửi lệnh in tới máy in hoặc xuất PDF"
    caption_vn: "Mẫu Phiếu Tiếp nhận & Cấp số Văn bản hành chính khổ A4 chuẩn bị in"
```

---

### 7.2 Mẫu in Văn bản Scan có đóng dấu số hiệu điện tử

#### Hướng dẫn Người dùng
1. Tại cửa sổ In ấn, bấm chuyển sang tab **"Văn bản có dấu"**.
2. Hệ thống tải trực tiếp bản scan văn bản gốc, đồng thời tự động lồng ghép con dấu số hiệu hành chính điện tử vào góc trên bên trái văn bản.
3. Người dùng kiểm tra tổng thể và bấm nút **"In ngay"** để in bản lưu văn thư.

---

## 8. QUY TRÌNH 5: CẤU HÌNH TIỀN TỐ, HẬU TỐ & MẪU SỐ

### 8.1 Quản lý Danh mục chuẩn Nghị định 30

#### Hướng dẫn Người dùng
1. Trên thanh điều hướng Navbar, bấm nút **"Cấu hình Tiền/Hậu tố"** (`#btn-open-category-config`).
2. Cửa sổ cấu hình (`#category-config-modal-card`) hiển thị danh sách các loại văn bản đang áp dụng:
   - *Quyết định (`QĐ`), Công văn (`CV`), Tờ trình (`TTr`), Hợp đồng (`HĐ`), Biên bản (`BB`), Thông báo (`TB`), Kế hoạch (`KH`), Báo cáo (`BC`), Quy chế (`QC`), Đề xuất (`ĐX`)...*
3. Cán bộ quản trị có thể:
   - Bấm **"Thêm loại văn bản mới"** (`#btn-add-new-category`): Bổ sung danh mục đặc thù của doanh nghiệp.
   - Bấm nút **"Khôi phục mặc định"** (`#btn-reset-default-categories`): Đưa toàn bộ cấu hình về chuẩn hành chính Việt Nam theo NĐ 30/2020/NĐ-CP nếu có sự xáo trộn ngoài ý muốn.

#### Kịch bản Chụp ảnh cho AI (Chỉ chụp hộp thoại Cấu hình)
```yaml
ai_automation_step:
  step_id: "CONFIG_01_CATEGORIES"
  route_or_view: "Modal Cấu hình Danh mục, Tiền tố & Hậu tố"
  
  capture_mode: "MODAL_CARD_ONLY"
  crop_selector: "#category-config-modal-card"
  clip_bounding_box_hint: { x: 210, y: 35, width: 1020, height: 830 }
  visual_boundary: "Chỉ chụp hộp thoại modal #category-config-modal-card, không chụp nền mờ"
  ai_execution_code: "await page.locator('#category-config-modal-card').screenshot({ path: 'docs/images/10_category_config_modal.png' })"
  
  actions:
    - action: "CLICK"
      selector: "#btn-open-category-config"
    - action: "WAIT_FOR"
      selector: "#category-config-modal-card"
  screenshot:
    file_name: "10_category_config_modal.png"
    viewport: { width: 1440, height: 900 }
    target: "MODAL"
    selector: "#category-config-modal-card"
    annotations:
      - selector: "#btn-add-new-category"
        label: "1"
        title: "Nút tạo mới danh mục văn bản tùy chỉnh"
      - selector: "#btn-reset-default-categories"
        label: "2"
        title: "Khôi phục quy chuẩn Nghị định 30/2020"
      - selector: ".font-mono.text-emerald-400"
        label: "3"
        title: "Khung xem trước số hiệu áp dụng quy tắc thực tế"
    caption_vn: "Cửa sổ quản trị Danh mục văn bản và quy tắc sinh số tiền tố, hậu tố"
```

---

### 8.2 Tùy biến mẫu số định dạng (Copy - Dán chuỗi token `{NUM}/{CODE}-{DEPT}`)

#### Hướng dẫn Người dùng & Thao tác Copy - Dán
Khi chọn hoặc chỉnh sửa một loại văn bản ở cột bên phải cửa sổ cấu hình:

1. 📋 **Hành động Copy - Dán Mẫu định dạng sinh số (`formatTemplate`)**:
   - **Copy cái gì**: Các chuỗi token biến số động chuẩn thể thức:
     - Mẫu chuẩn Nghị định 30: `{NUM}/{CODE}-{DEPT}` (Ví dụ sinh số: `01/QĐ-VP`)
     - Mẫu có năm ban hành: `{NUM}/{CODE}-{DEPT}/{YEAR}` (Ví dụ: `15/CV-KD/2026`)
     - Mẫu hợp đồng kinh tế: `{NUM}/{YEAR}/{CODE}-{DEPT}` (Ví dụ: `08/2026/HĐ-KD`)
   - **Copy ở đâu**: Copy trực tiếp từ các huy hiệu gợi ý nhanh bên dưới ô nhập hoặc từ bảng gợi ý mẫu số.
   - **Dán vào đâu**: Dán vào ô input **"Mẫu định dạng sinh số"** (`#input-category-format-template`).
2. **Số đếm hiện tại & Đệm số không (Padding)**:
   - Điều chỉnh số thứ tự bắt đầu nếu doanh nghiệp chuyển đổi từ sổ giấy sang phần mềm giữa năm.
   - Cấu hình số chữ số đệm số 0 (ví dụ padding = 3 thì số 1 sẽ hiển thị là `001`).
3. **Quy tắc Reset hàng năm (`resetYearly`)**:
   - Tự động trở về số 1 khi bước sang ngày đầu năm mới (01/01).
4. Bấm **"Lưu cấu hình"** (`#btn-save-category-changes`) để áp dụng ngay lập tức cho toàn bộ các lần cấp số tiếp theo.

---

## 9. QUY TRÌNH 6: KẾT NỐI & ĐỒNG BỘ GOOGLE DRIVE DÙNG CHUNG

### 9.1 Đăng nhập ủy quyền & Cấu hình Thư mục (Copy URL/ID thư mục Drive)

#### Hướng dẫn Người dùng & Thao tác Copy - Dán
Mô hình lưu trữ của hệ thống là **BYOS (Bring Your Own Storage)** - Bản scan và dữ liệu sổ văn bản được lưu trữ trực tiếp trên tài khoản Google Drive của cơ quan hoặc cá nhân, hoàn toàn riêng tư:
1. Bấm vào nút **Google Drive** trên thanh Navbar (`#btn-open-google-drive`). Cửa sổ `#google-drive-modal-card` xuất hiện.
2. Bấm **"Đăng nhập với Google"** và cấp quyền lưu file trên Google Drive.
3. 📋 **Hành động Copy - Dán Đường dẫn Thư mục Google Drive**:
   - **Copy cái gì**: Toàn bộ đường dẫn URL của thư mục Google Drive (hoặc riêng chuỗi ký tự Folder ID).  
     *Ví dụ URL*: `https://drive.google.com/drive/folders/1e87__irSwgeEH07gOvCo5ZU6WU2sIMCr`  
     *Ví dụ ID*: `1e87__irSwgeEH07gOvCo5ZU6WU2sIMCr`
   - **Copy ở đâu**: Mở tab mới trên trình duyệt Web -> Đăng nhập vào Google Drive của bạn -> Mở thư mục muốn dùng làm nơi lưu văn bản -> Nhấp chuột vào thanh địa chỉ trình duyệt (Address bar) bôi đen toàn bộ đường link -> Bấm `Ctrl + C`.
   - **Dán vào đâu**: Quay lại phần mềm -> Bấm chuột vào ô input **"Folder ID hoặc Đường dẫn (URL) thư mục Google Drive"** (`#input-drive-folder-url`) -> Bấm `Ctrl + V`. Hệ thống sẽ tự động bóc tách và nhận diện Folder ID.
4. Bấm nút màu xanh **"Lưu cấu hình"** (`#btn-save-drive-settings`).
5. Đèn trạng thái trên thanh Navbar sẽ chuyển sang **Màu xanh lục nhấp nháy**, báo hiệu kết nối ổn định.

#### Kịch bản Chụp ảnh cho AI (Chỉ chụp hộp thoại Google Drive)
```yaml
ai_automation_step:
  step_id: "DRIVE_01_CONFIG"
  route_or_view: "Modal Cấu hình Google Drive BYOS"
  
  capture_mode: "MODAL_CARD_ONLY"
  crop_selector: "#google-drive-modal-card"
  clip_bounding_box_hint: { x: 430, y: 150, width: 580, height: 600 }
  visual_boundary: "Chỉ chụp hộp thoại modal #google-drive-modal-card, không chụp nền mờ"
  ai_execution_code: "await page.locator('#google-drive-modal-card').screenshot({ path: 'docs/images/11_google_drive_config_modal.png' })"
  
  clipboard_actions:
    copy_from: "Thanh địa chỉ URL trình duyệt khi mở Google Drive (https://drive.google.com/drive/folders/...)"
    paste_to: "#input-drive-folder-url"
  
  actions:
    - action: "CLICK"
      selector: "#btn-open-google-drive"
    - action: "WAIT_FOR"
      selector: "#google-drive-modal-card"
  screenshot:
    file_name: "11_google_drive_config_modal.png"
    viewport: { width: 1440, height: 900 }
    target: "MODAL"
    selector: "#google-drive-modal-card"
    annotations:
      - selector: "button:has-text('Đăng nhập với Google')"
        label: "1"
        title: "Nút ủy quyền tài khoản Google Drive cá nhân/doanh nghiệp"
      - selector: "#input-drive-folder-url"
        label: "2"
        title: "Ô dán URL hoặc ID thư mục Google Drive dùng chung"
      - selector: "#btn-save-drive-settings"
        label: "3"
        title: "Nút Lưu cấu hình kết nối"
    caption_vn: "Cửa sổ kết nối tài khoản Google Drive để đồng bộ dữ liệu đa thiết bị"
```

---

### 9.2 Trạng thái đồng bộ đa thiết bị

#### Hướng dẫn Người dùng
- Khi cấp số trên bất kỳ thiết bị nào (máy tính để bàn, laptop hay điện thoại), cơ sở dữ liệu sổ văn bản và toàn bộ file scan sẽ được đẩy lên file database trung tâm trên Google Drive.
- Khi mở máy tính khác, hệ thống tự động tải dữ liệu mới nhất về.
- Người dùng có thể chủ động bấm biểu tượng mũi tên xoay tròn **"Đồng bộ ngay"** (`#btn-sync-google-drive`) trên thanh Navbar để cập nhật tức thì.
- **Nếu phiên làm việc hết hạn**: Đèn Google Drive chuyển sang màu cam kẹp nhãn *"Hết hạn"*, người dùng chỉ cần bấm vào nút Drive và xác nhận lại tài khoản trong 3 giây.

---

## 10. BẢNG PHÂN TÍCH THỐNG KÊ SỐ LIỆU (DASHBOARD STATS)

### Hướng dẫn Người dùng
1. Bấm vào tab **"Thống kê số liệu"** trên thanh Navbar (`#btn-nav-stats`).
2. Màn hình cung cấp 4 thẻ chỉ số KPI quan trọng:
   - **Tổng văn bản đã cấp**: Tổng quy mô văn bản phát hành trong năm.
   - **Tải tệp trực tiếp**: Tỷ lệ phần trăm và số lượng văn bản nạp từ file máy tính.
   - **Quét qua Camera**: Tỷ lệ văn bản số hóa nhanh từ camera/webcam.
   - **Tiếp nhận từ Email**: Số văn bản công văn đến qua kênh điện thư.
3. **Biểu đồ phân bổ theo loại văn bản**:
   - Hiển thị danh sách các loại văn bản cùng thanh tiến độ tỷ lệ, số lượng văn bản đã phát sinh và công thức mẫu số áp dụng.
4. **Văn bản cấp gần đây**:
   - Danh sách các quyết định, công văn vừa được sinh số kèm nút xem nhanh và in ấn tức thì.

### Kịch bản Chụp ảnh cho AI (Chụp vùng nội dung Dashboard)
```yaml
ai_automation_step:
  step_id: "STATS_01_DASHBOARD"
  route_or_view: "Tab Thống kê số liệu"
  
  # Cấu hình chụp định vị
  capture_mode: "COMPONENT_CROP"
  crop_selector: "main"
  clip_bounding_box_hint: { x: 80, y: 88, width: 1280, height: 750 }
  visual_boundary: "Chỉ chụp vùng nội dung chính của Dashboard Thống kê (main), không chụp thừa viền"
  ai_execution_code: "await page.locator('main').screenshot({ path: 'docs/images/12_dashboard_stats_kpi.png' })"
  
  actions:
    - action: "CLICK"
      selector: "#btn-nav-stats"
    - action: "WAIT_FOR"
      selector: ".grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4"
  screenshot:
    file_name: "12_dashboard_stats_kpi.png"
    viewport: { width: 1440, height: 900 }
    target: "ELEMENT"
    selector: "main"
    annotations:
      - selector: ".grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4"
        label: "1"
        title: "Bộ 4 thẻ chỉ số KPI phân bổ lưu lượng văn bản"
      - selector: ".lg\\:col-span-6:first-child"
        label: "2"
        title: "Bảng phân bổ tỷ lệ cấp số theo danh mục"
      - selector: ".lg\\:col-span-6:last-child"
        label: "3"
        title: "Bảng theo dõi văn bản vừa được cấp gần đây"
    caption_vn: "Bảng điều khiển Thống kê Số liệu và Phân tích lưu lượng cấp số văn bản"
```

---

## 11. BẢNG TỔNG HỢP 12 ẢNH CHỤP MÀN HÌNH AI CẦN THỰC HIỆN

Dưới đây là bảng tổng hợp chi tiết cho AI Agent với **đúng Selector cần chụp** để không bao giờ bị chụp cả màn hình:

| STT | Mã bước | Tên file ảnh đầu ra | Chế độ chụp (`capture_mode`) | Selector phần tử chụp (`crop_selector`) | Lệnh Playwright thực thi chính xác |
|:---:|:---|:---|:---:|:---|:---|
| **01** | `NAV_01_OVERVIEW` | `01_navbar_tong_quan.png` | `ELEMENT_ONLY` | `header` | `await page.locator('header').screenshot({ path: '...' })` |
| **02** | `INTAKE_01_UPLOAD_FILE` | `02_intake_modal_upload_tab.png` | `MODAL_CARD_ONLY` | `#intake-modal-card` | `await page.locator('#intake-modal-card').screenshot({ path: '...' })` |
| **03** | `INTAKE_02_CAMERA_SCAN` | `03_intake_camera_tab.png` | `MODAL_CARD_ONLY` | `#intake-modal-card` | `await page.locator('#intake-modal-card').screenshot({ path: '...' })` |
| **04** | `INTAKE_03_FORM_FILL` | `04_intake_form_details.png` | `MODAL_CARD_ONLY` | `#intake-modal-card` | `await page.locator('#intake-modal-card').screenshot({ path: '...' })` |
| **05** | `INTAKE_04_SUCCESS_SCREEN` | `05_intake_success_result.png` | `MODAL_CARD_ONLY` | `#intake-modal-card` | `await page.locator('#intake-modal-card').screenshot({ path: '...' })` |
| **06** | `ARCHIVE_01_SEARCH_AND_FILTER` | `06_archive_search_filter_bar.png` | `COMPONENT_CROP` | `.bg-white.rounded-2xl.p-4` | `await page.locator('.bg-white.rounded-2xl.p-4').first().screenshot({ path: '...' })` |
| **07** | `ARCHIVE_02_GRID_VIEW` | `07_archive_grid_view.png` | `COMPONENT_CROP` | `.grid.grid-cols-1.sm\\:grid-cols-2` | `await page.locator('.grid.grid-cols-1.sm\\:grid-cols-2').first().screenshot({ path: '...' })` |
| **08** | `DETAIL_01_VIEWER` | `08_document_detail_viewer.png` | `MODAL_CARD_ONLY` | `#document-detail-modal-card` | `await page.locator('#document-detail-modal-card').screenshot({ path: '...' })` |
| **09** | `PRINT_01_SLIP` | `09_print_modal_slip_preview.png` | `MODAL_CARD_ONLY` | `#print-modal-card` | `await page.locator('#print-modal-card').screenshot({ path: '...' })` |
| **10** | `CONFIG_01_CATEGORIES` | `10_category_config_modal.png` | `MODAL_CARD_ONLY` | `#category-config-modal-card` | `await page.locator('#category-config-modal-card').screenshot({ path: '...' })` |
| **11** | `DRIVE_01_CONFIG` | `11_google_drive_config_modal.png` | `MODAL_CARD_ONLY` | `#google-drive-modal-card` | `await page.locator('#google-drive-modal-card').screenshot({ path: '...' })` |
| **12** | `STATS_01_DASHBOARD` | `12_dashboard_stats_kpi.png` | `COMPONENT_CROP` | `main` | `await page.locator('main').screenshot({ path: '...' })` |

---
*Tài liệu được cập nhật và tối ưu hóa toàn diện cho Antigravity AI Agent & Cán bộ Văn thư Hành chính.*
