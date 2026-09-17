import { DocumentCategory, DocumentRecord } from "../types";

const DB_NAME = "DocNumberingDB";
const DB_VERSION = 1;
const STORE_DOCS = "documents";
const LOCAL_STORAGE_CATEGORIES_KEY = "doc_categories_v2";

export const INITIAL_CATEGORIES: DocumentCategory[] = [
  {
    id: "cat-qd",
    code: "QĐ",
    name: "Quyết định",
    prefix: "",
    suffix: "/QĐ-VCCORP",
    formatTemplate: "{NUM}/QĐ-VCCORP",
    currentCount: 0,
    paddingDigits: 0,
    resetYearly: true,
    defaultDepartment: "VP",
    description: "Văn bản định đoạt, quyết định thành lập, bổ nhiệm, ban hành quy chế của tổ chức.",
    color: "emerald",
    icon: "FileCheck",
    isActive: true,
  },
  {
    id: "cat-cv",
    code: "CV",
    name: "Công văn",
    prefix: "",
    suffix: "/CV-VP",
    formatTemplate: "{NUM}/CV-{DEPT}",
    currentCount: 0,
    paddingDigits: 0,
    resetYearly: true,
    defaultDepartment: "VP",
    description: "Văn bản trao đổi thông tin, giao dịch công việc giữa cơ quan, doanh nghiệp với đối tác.",
    color: "blue",
    icon: "Send",
    isActive: true,
  },
  {
    id: "cat-ttr",
    code: "TTr",
    name: "Tờ trình",
    prefix: "",
    suffix: "/TTr-BGD",
    formatTemplate: "{NUM}/TTr-{DEPT}",
    currentCount: 0,
    paddingDigits: 0,
    resetYearly: true,
    defaultDepartment: "TCKT",
    description: "Văn bản đề xuất cấp trên phê duyệt dự án, kế hoạch hoặc chủ trương mới.",
    color: "indigo",
    icon: "FileText",
    isActive: true,
  },
  {
    id: "cat-hd",
    code: "HĐ",
    name: "Hợp đồng kinh tế",
    prefix: "HĐ-",
    suffix: "/2026/VCC",
    formatTemplate: "HĐ-{NUM_PAD3}/{YEAR}/VCC",
    currentCount: 0,
    paddingDigits: 3,
    resetYearly: true,
    defaultDepartment: "KD",
    description: "Văn bản thỏa thuận hợp tác thương mại, cung ứng dịch vụ, mua bán hàng hóa.",
    color: "amber",
    icon: "Handshake",
    isActive: true,
  },
  {
    id: "cat-tb",
    code: "TB",
    name: "Thông báo",
    prefix: "",
    suffix: "/TB-VP",
    formatTemplate: "{NUM}/TB-{DEPT}",
    currentCount: 0,
    paddingDigits: 0,
    resetYearly: true,
    defaultDepartment: "VP",
    description: "Văn bản truyền đạt thông tin, lịch nghỉ lễ, hướng dẫn nghiệp vụ tới toàn thể nhân viên.",
    color: "cyan",
    icon: "Bell",
    isActive: true,
  },
  {
    id: "cat-bb",
    code: "BB",
    name: "Biên bản",
    prefix: "",
    suffix: "/BB-HC",
    formatTemplate: "{NUM}/BB-{DEPT}",
    currentCount: 0,
    paddingDigits: 0,
    resetYearly: true,
    defaultDepartment: "HCNS",
    description: "Văn bản ghi nhận lại diễn biến sự việc, cuộc họp, bàn giao tài sản, nghiệm thu.",
    color: "violet",
    icon: "ClipboardCheck",
    isActive: true,
  },
  {
    id: "cat-kh",
    code: "KH",
    name: "Kế hoạch",
    prefix: "",
    suffix: "/KH-VCC",
    formatTemplate: "{NUM}/KH-{YEAR}",
    currentCount: 0,
    paddingDigits: 0,
    resetYearly: true,
    defaultDepartment: "VP",
    description: "Văn bản xác định mục tiêu, tiến độ thực hiện nhiệm vụ trong giai đoạn xác định.",
    color: "teal",
    icon: "Calendar",
    isActive: true,
  },
  {
    id: "cat-bc",
    code: "BC",
    name: "Báo cáo",
    prefix: "",
    suffix: "/BC-TCKT",
    formatTemplate: "{NUM}/BC-{DEPT}",
    currentCount: 0,
    paddingDigits: 0,
    resetYearly: true,
    defaultDepartment: "TCKT",
    description: "Văn bản tổng kết tình hình thực hiện công việc, tài chính định kỳ hoặc đột xuất.",
    color: "rose",
    icon: "BarChart3",
    isActive: true,
  },
  {
    id: "cat-gm",
    code: "GM",
    name: "Giấy mời",
    prefix: "",
    suffix: "/GM-VP",
    formatTemplate: "{NUM}/GM-VP",
    currentCount: 0,
    paddingDigits: 0,
    resetYearly: true,
    defaultDepartment: "VP",
    description: "Văn bản mời đại biểu, đối tác tham dự hội nghị, sự kiện, cuộc họp quan trọng.",
    color: "sky",
    icon: "Mail",
    isActive: true,
  },
  {
    id: "cat-ct",
    code: "CT",
    name: "Chỉ thị",
    prefix: "",
    suffix: "/CT-TGĐ",
    formatTemplate: "{NUM}/CT-TGĐ",
    currentCount: 0,
    paddingDigits: 0,
    resetYearly: true,
    defaultDepartment: "BGD",
    description: "Văn bản chỉ đạo cấp bách của Ban Giám đốc triển khai nhiệm vụ trọng tâm.",
    color: "red",
    icon: "ShieldAlert",
    isActive: true,
  },
  {
    id: "cat-dx",
    code: "ĐX",
    name: "Đề xuất / Phiếu trình",
    prefix: "ĐX-",
    suffix: "",
    formatTemplate: "ĐX-{NUM_PAD3}/{YEAR}",
    currentCount: 0,
    paddingDigits: 3,
    resetYearly: true,
    defaultDepartment: "HCNS",
    description: "Phiếu đề xuất mua sắm trang thiết bị, tuyển dụng nhân sự, phê duyệt chi phí.",
    color: "purple",
    icon: "Sparkles",
    isActive: true,
  },
];

// Open or create IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_DOCS)) {
        const store = db.createObjectStore(STORE_DOCS, { keyPath: "id" });
        store.createIndex("docNumber", "docNumber", { unique: false });
        store.createIndex("categoryId", "categoryId", { unique: false });
        store.createIndex("registrationDate", "registrationDate", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Categories Management (stored in localStorage for instantaneous sync)
export function getCategories(): DocumentCategory[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_CATEGORIES_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to read categories from localStorage", e);
  }
  saveCategories(INITIAL_CATEGORIES);
  return INITIAL_CATEGORIES;
}

export function saveCategories(categories: DocumentCategory[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_CATEGORIES_KEY, JSON.stringify(categories));
  } catch (e) {
    console.error("Failed to save categories to localStorage", e);
  }
}

export function incrementCategoryCount(categoryId: string): DocumentCategory | null {
  const categories = getCategories();
  const index = categories.findIndex((c) => c.id === categoryId);
  if (index !== -1) {
    categories[index].currentCount += 1;
    saveCategories(categories);
    return categories[index];
  }
  return null;
}

// IndexedDB Document Records Management
export async function getAllDocuments(): Promise<DocumentRecord[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_DOCS], "readonly");
      const store = transaction.objectStore(STORE_DOCS);
      const request = store.getAll();

      request.onsuccess = () => {
        const docs: DocumentRecord[] = request.result || [];
        // Sort descending by registration date
        docs.sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime());
        resolve(docs);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("IndexedDB error getting documents:", error);
    return [];
  }
}

export async function getDocumentById(id: string): Promise<DocumentRecord | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_DOCS], "readonly");
      const store = transaction.objectStore(STORE_DOCS);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("IndexedDB error getting document by ID:", error);
    return null;
  }
}

export async function saveDocument(doc: DocumentRecord): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_DOCS], "readwrite");
    const store = transaction.objectStore(STORE_DOCS);
    const request = store.put(doc);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteDocument(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_DOCS], "readwrite");
    const store = transaction.objectStore(STORE_DOCS);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Generate sample SVG document placeholder images
export function createSampleDocumentImage(docNumber: string, title: string, categoryName: string, date: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1130" width="800" height="1130">
    <defs>
      <filter id="paper-shadow" x="-5%" y="-5%" width="110%" height="110%">
        <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000000" flood-opacity="0.1"/>
      </filter>
    </defs>
    <rect width="800" height="1130" fill="#fcfcfc" />
    <rect x="40" y="40" width="720" height="1050" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" filter="url(#paper-shadow)" rx="4"/>
    
    <!-- Quốc hiệu Tiêu ngữ -->
    <text x="560" y="90" font-family="'Times New Roman', serif" font-size="13" font-weight="bold" text-anchor="middle" fill="#0f172a">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</text>
    <text x="560" y="110" font-family="'Times New Roman', serif" font-size="14" font-weight="bold" text-anchor="middle" fill="#0f172a">Độc lập - Tự do - Hạnh phúc</text>
    <line x1="480" y1="120" x2="640" y2="120" stroke="#0f172a" stroke-width="1"/>

    <!-- Cơ quan ban hành -->
    <text x="200" y="90" font-family="'Times New Roman', serif" font-size="13" text-anchor="middle" fill="#334155">CÔNG TY CỔ PHẦN VCCORP</text>
    <text x="200" y="110" font-family="'Times New Roman', serif" font-size="13" font-weight="bold" text-anchor="middle" fill="#0f172a">VĂN PHÒNG TỔNG HỢP</text>
    <line x1="140" y1="120" x2="260" y2="120" stroke="#0f172a" stroke-width="0.8"/>

    <!-- Số văn bản & Ngày tháng -->
    <text x="200" y="150" font-family="'Times New Roman', serif" font-size="13" text-anchor="middle" fill="#0f172a">Số: <tspan font-weight="bold" fill="#0369a1">${docNumber}</tspan></text>
    <text x="560" y="150" font-family="'Times New Roman', serif" font-size="13" font-style="italic" text-anchor="middle" fill="#475569">Hà Nội, ngày ${date}</text>

    <!-- Tên loại & Trích yếu -->
    <text x="400" y="220" font-family="'Times New Roman', serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#0f172a">${categoryName.toUpperCase()}</text>
    <text x="400" y="250" font-family="'Times New Roman', serif" font-size="14" font-weight="bold" text-anchor="middle" fill="#334155" max-width="600">${title}</text>

    <!-- Dấu số điện tử & QR Code Stamp -->
    <g transform="translate(60, 180)">
      <rect width="180" height="70" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.5" rx="4"/>
      <rect x="2" y="2" width="176" height="18" fill="#16a34a" rx="2"/>
      <text x="90" y="15" font-family="sans-serif" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">ĐÃ CẤP SỐ VĂN BẢN</text>
      <text x="10" y="36" font-family="monospace" font-size="11" font-weight="bold" fill="#166534">Số: ${docNumber}</text>
      <text x="10" y="52" font-family="sans-serif" font-size="9" fill="#15803d">Ngày: ${date}</text>
      <text x="10" y="64" font-family="sans-serif" font-size="8" fill="#4b5563">Xác thực số: VN-DOC-VERIFIED</text>
    </g>

    <!-- Nội dung mô phỏng -->
    <g transform="translate(100, 310)" fill="#1e293b" font-family="'Times New Roman', serif" font-size="14">
      <text x="0" y="0" font-weight="bold">Kính gửi: Các Phòng/Ban và Đơn vị trực thuộc liên quan</text>
      
      <text x="0" y="40">Căn cứ Điều lệ tổ chức và hoạt động của Công ty Cổ phần VCCORP;</text>
      <text x="0" y="65">Căn cứ yêu cầu thực tiễn trong công tác điều hành và tiếp nhận văn bản tự động;</text>
      <text x="0" y="90">Xét đề nghị của Trưởng phòng Hành chính và Tổng hợp,</text>
      
      <text x="200" y="140" font-size="16" font-weight="bold" text-anchor="middle">QUYẾT NGHỊ / THÔNG BÁO NỘI DUNG:</text>
      
      <text x="0" y="180"><tspan font-weight="bold">Điều 1.</tspan> Tiếp nhận và ban hành chính thức văn bản số <tspan font-weight="bold" fill="#0369a1">${docNumber}</tspan> về việc ${title}.</text>
      <text x="0" y="210"><tspan font-weight="bold">Điều 2.</tspan> Toàn bộ nội dung và dữ liệu quét (OCR) đã được đồng bộ vào kho lưu trữ số hóa.</text>
      <text x="0" y="240"><tspan font-weight="bold">Điều 3.</tspan> Quyết định này có hiệu lực kể từ ngày ký. Các đơn vị chịu trách nhiệm thi hành.</text>
      
      <!-- Lines simulation -->
      <line x1="0" y1="280" x2="600" y2="280" stroke="#cbd5e1" stroke-dasharray="4"/>
      <line x1="0" y1="310" x2="580" y2="310" stroke="#cbd5e1" stroke-dasharray="4"/>
      <line x1="0" y1="340" x2="520" y2="340" stroke="#cbd5e1" stroke-dasharray="4"/>
    </g>

    <!-- Chữ ký & Con dấu -->
    <g transform="translate(480, 780)">
      <text x="100" y="0" font-family="'Times New Roman', serif" font-size="13" font-weight="bold" text-anchor="middle" fill="#0f172a">TỔNG GIÁM ĐỐC</text>
      <text x="100" y="20" font-family="'Times New Roman', serif" font-size="12" font-style="italic" text-anchor="middle" fill="#64748b">(Ký, ghi rõ họ tên và đóng dấu)</text>
      
      <!-- Con dấu đỏ mô phỏng -->
      <circle cx="100" cy="90" r="50" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="1 0" opacity="0.85"/>
      <circle cx="100" cy="90" r="45" fill="none" stroke="#dc2626" stroke-width="1" opacity="0.85"/>
      <text x="100" y="80" font-family="sans-serif" font-size="8" font-weight="bold" text-anchor="middle" fill="#dc2626" opacity="0.9">CÔNG TY CỔ PHẦN</text>
      <text x="100" y="95" font-family="sans-serif" font-size="10" font-weight="bold" text-anchor="middle" fill="#dc2626" opacity="0.9">VCCORP</text>
      <text x="100" y="110" font-family="sans-serif" font-size="7" text-anchor="middle" fill="#dc2626" opacity="0.9">★ VIỆT NAM ★</text>

      <text x="100" y="170" font-family="'Times New Roman', serif" font-size="14" font-weight="bold" text-anchor="middle" fill="#0f172a">Nguyễn Văn An</text>
    </g>

    <!-- Nơi nhận -->
    <g transform="translate(80, 800)" font-family="'Times New Roman', serif" font-size="11" fill="#334155">
      <text x="0" y="0" font-weight="bold" font-style="italic">Nơi nhận:</text>
      <text x="0" y="18">- Như Điều 3;</text>
      <text x="0" y="34">- Ban Giám đốc (để b/c);</text>
      <text x="0" y="50">- Lưu: VT, VP, HC.</text>
    </g>

    <!-- Footer Barcode & QR code simulation -->
    <g transform="translate(60, 990)">
      <rect width="680" height="60" fill="#f8fafc" stroke="#e2e8f0" rx="4"/>
      <text x="20" y="24" font-family="monospace" font-size="11" font-weight="bold" fill="#0f172a">DOC ID: ${docNumber} | MÃ XÁC THỰC: VN-DOC-${Math.floor(100000 + Math.random() * 900000)}</text>
      <text x="20" y="44" font-family="sans-serif" font-size="10" fill="#64748b">Hệ thống cấp số tự động AI OCR - Công nghệ lưu trữ &amp; tra cứu văn bản điện tử VCCORP</text>
      
      <!-- Barcode simulation lines -->
      <g transform="translate(560, 12)">
        <rect x="0" y="0" width="3" height="35" fill="#1e293b"/>
        <rect x="5" y="0" width="1.5" height="35" fill="#1e293b"/>
        <rect x="9" y="0" width="4" height="35" fill="#1e293b"/>
        <rect x="16" y="0" width="2" height="35" fill="#1e293b"/>
        <rect x="20" y="0" width="5" height="35" fill="#1e293b"/>
        <rect x="28" y="0" width="1.5" height="35" fill="#1e293b"/>
        <rect x="32" y="0" width="3.5" height="35" fill="#1e293b"/>
        <rect x="38" y="0" width="2" height="35" fill="#1e293b"/>
        <rect x="43" y="0" width="4" height="35" fill="#1e293b"/>
        <rect x="50" y="0" width="2" height="35" fill="#1e293b"/>
        <rect x="55" y="0" width="5" height="35" fill="#1e293b"/>
        <rect x="63" y="0" width="2" height="35" fill="#1e293b"/>
        <rect x="68" y="0" width="3" height="35" fill="#1e293b"/>
        <rect x="74" y="0" width="1.5" height="35" fill="#1e293b"/>
        <rect x="78" y="0" width="4" height="35" fill="#1e293b"/>
        <rect x="85" y="0" width="2" height="35" fill="#1e293b"/>
      </g>
    </g>
  </svg>`;

  try {
    const base64 = btoa(unescape(encodeURIComponent(svg)));
    return `data:image/svg+xml;base64,${base64}`;
  } catch (e) {
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }
}

// Seed initial documents if database is empty (Disabled - starts clean)
export async function seedInitialDocumentsIfEmpty(): Promise<void> {
  // Purge any legacy sample docs
  await purgeMockDocumentsIfPresent();
  return;
  const sampleDocs: DocumentRecord[] = [
    {
      id: "doc-sample-1",
      docNumber: "124/QĐ-VCCORP",
      sequenceNumber: 124,
      categoryId: "cat-qd",
      categoryCode: "QĐ",
      categoryName: "Quyết định",
      title: "Quyết định ban hành Quy chế bảo mật thông tin và quản lý tiếp nhận văn bản tự động",
      issuingAuthority: "Công ty Cổ phần VCCORP",
      recipient: "Ban Giám đốc, Các Khối/Phòng ban trực thuộc",
      signer: "Nguyễn Văn An - Tổng Giám đốc",
      documentDate: "2026-08-25",
      registrationDate: d1,
      departmentCode: "VP",
      status: "NUMBERED",
      intakeSource: "UPLOAD",
      urgency: "THUONG",
      secrecy: "THUONG",
      summary: "Ban hành quy định chi tiết về quy trình số hóa, phân loại OCR và tự động cấp số văn bản lưu trữ toàn hệ thống.",
      ocrFullText: `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n\nCÔNG TY CP VCCORP - VĂN PHÒNG TỔNG HỢP\nSố: 124/QĐ-VCCORP\n\nQUYẾT ĐỊNH\nVề việc ban hành Quy chế bảo mật thông tin và quản lý tiếp nhận văn bản tự động\n\nTỔNG GIÁM ĐỐC CÔNG TY CP VCCORP\nCăn cứ Điều lệ tổ chức...\nQUYẾT ĐỊNH:\nĐiều 1. Ban hành kèm theo Quyết định này Quy chế quản lý văn bản số hóa.\nĐiều 2. Quyết định có hiệu lực từ ngày ký.\nNgười ký: Nguyễn Văn An - Tổng Giám đốc`,
      keywords: ["Quy chế", "Bảo mật", "Cấp số tự động", "OCR", "Văn bản"],
      images: [
        {
          id: "img-1",
          name: "quyet-dinh-124-qd.png",
          dataUrl: createSampleDocumentImage("124/QĐ-VCCORP", "Ban hành Quy chế bảo mật thông tin và quản lý văn bản tự động", "Quyết định", "25/08/2026"),
          mimeType: "image/svg+xml",
          size: 45200,
          capturedAt: d1,
          pageNumber: 1,
        },
      ],
      verificationCode: "VN-QD-8F21-A934",
      createdBy: "Trần Mai Phương (Văn thư)",
      notes: "Đã scan bản gốc đóng dấu đỏ và ban hành đến tất cả các phòng ban.",
      history: [
        {
          id: "h1",
          timestamp: d1,
          action: "TIẾP NHẬN & CẤP SỐ",
          user: "Trần Mai Phương",
          details: "Tự động phân loại OCR và cấp số chính thức 124/QĐ-VCCORP",
        },
      ],
      createdAt: d1,
      updatedAt: d1,
    },
    {
      id: "doc-sample-2",
      docNumber: "432/CV-VP",
      sequenceNumber: 432,
      categoryId: "cat-cv",
      categoryCode: "CV",
      categoryName: "Công văn",
      title: "V/v Triển khai kiểm tra định kỳ an toàn thông tin và sao lưu dữ liệu điện tử quý III/2026",
      issuingAuthority: "Văn phòng Tổng hợp VCCORP",
      recipient: "Khối Công nghệ & Trung tâm Dữ liệu",
      signer: "Lê Hoàng Long - Chánh Văn phòng",
      documentDate: "2026-08-24",
      registrationDate: d2,
      departmentCode: "VP",
      status: "NUMBERED",
      intakeSource: "CAMERA",
      urgency: "KHAN",
      secrecy: "THUONG",
      summary: "Yêu cầu các bộ phận rà soát hạ tầng lưu trữ văn bản số, kiểm tra chứng thư số và báo cáo kết quả trước ngày 30/08/2026.",
      ocrFullText: `CÔNG VĂN TRIỂN KHAI\nSố: 432/CV-VP\nKính gửi: Khối Công nghệ & Trung tâm Dữ liệu\nThực hiện chỉ đạo của Ban Giám đốc về công tác đảm bảo an toàn thông tin văn thư lưu trữ...`,
      keywords: ["Công văn", "An toàn thông tin", "Sao lưu dữ liệu", "Khẩn"],
      images: [
        {
          id: "img-2",
          name: "cong-van-432-cv.png",
          dataUrl: createSampleDocumentImage("432/CV-VP", "Triển khai kiểm tra định kỳ an toàn thông tin quý III", "Công văn", "24/08/2026"),
          mimeType: "image/svg+xml",
          size: 42100,
          capturedAt: d2,
          pageNumber: 1,
        },
      ],
      verificationCode: "VN-CV-31B7-99E2",
      createdBy: "Nguyễn Thu Hà (Chuyên viên)",
      notes: "Chụp trực tiếp qua camera quét nhanh tại quầy văn thư.",
      history: [
        {
          id: "h2",
          timestamp: d2,
          action: "CHỤP ẢNH CAMERA & CẤP SỐ",
          user: "Nguyễn Thu Hà",
          details: "Chụp ảnh tài liệu qua camera máy tính bảng, OCR nhận diện và cấp số 432/CV-VP",
        },
      ],
      createdAt: d2,
      updatedAt: d2,
    },
    {
      id: "doc-sample-3",
      docNumber: "HĐ-056/2026/VCC",
      sequenceNumber: 56,
      categoryId: "cat-hd",
      categoryCode: "HĐ",
      categoryName: "Hợp đồng kinh tế",
      title: "Hợp đồng cung cấp dịch vụ hạ tầng Cloud & Trí tuệ nhân tạo nhận diện văn bản OCR",
      issuingAuthority: "Công ty CP VCCORP & Đối tác Công nghệ Google Cloud",
      recipient: "Khối Kế toán - Tài chính, Ban Pháp chế",
      signer: "Phạm Quốc Dũng - Giám đốc Kinh doanh",
      documentDate: "2026-08-23",
      registrationDate: d3,
      departmentCode: "KD",
      status: "NUMBERED",
      intakeSource: "EMAIL",
      urgency: "THUONG",
      secrecy: "MAT",
      summary: "Hợp đồng đối tác nguyên tắc cung cấp tài nguyên điện toán đám mây phục vụ phân loại thông minh và lưu trữ tài liệu doanh nghiệp.",
      ocrFullText: `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nHỢP ĐỒNG KINH TẾ\nSố: HĐ-056/2026/VCC\nBên A: Công ty CP VCCORP\nBên B: Nhà cung cấp dịch vụ giải pháp Cloud\nThời hạn: 12 tháng kể từ ngày ký kết.`,
      keywords: ["Hợp đồng", "Cloud", "OCR", "Pháp chế", "Kinh tế"],
      images: [
        {
          id: "img-3",
          name: "hop-dong-056-hd.png",
          dataUrl: createSampleDocumentImage("HĐ-056/2026/VCC", "Hợp đồng cung cấp dịch vụ hạ tầng Cloud & Trí tuệ nhân tạo OCR", "Hợp đồng kinh tế", "23/08/2026"),
          mimeType: "image/svg+xml",
          size: 48900,
          capturedAt: d3,
          pageNumber: 1,
        },
      ],
      emailMetadata: {
        senderEmail: "phapche@doitac-partner.vn",
        senderName: "Bộ phận Pháp chế Đối tác",
        subject: "[Hoàn tất ký số] Hợp đồng nguyên tắc dịch vụ Cloud AI 2026",
        receivedDate: "2026-08-23 14:30",
        rawBody: "Kính gửi quý công ty, chúng tôi xin gửi bản scan hợp đồng đã ký hoàn tất để quý công ty vào sổ cấp số văn bản lưu trữ.",
      },
      verificationCode: "VN-HD-54AA-18F0",
      createdBy: "Hệ thống Email Gateway",
      notes: "Tiếp nhận tự động từ hòm thư vanban@vccorp.vn",
      history: [
        {
          id: "h3",
          timestamp: d3,
          action: "TIẾP NHẬN EMAIL & CẤP SỐ",
          user: "Hệ thống Email Gateway",
          details: "Tự động trích xuất nội dung thư điện tử, phân loại Hợp đồng và cấp số HĐ-056/2026/VCC",
        },
      ],
      createdAt: d3,
      updatedAt: d3,
    },
  ];

  for (const doc of sampleDocs) {
    await saveDocument(doc);
  }
}

// Purge legacy mock documents if found
export async function purgeMockDocumentsIfPresent(): Promise<void> {
  const mockIds = ["doc-sample-1", "doc-sample-2", "doc-sample-3"];
  for (const id of mockIds) {
    try {
      await deleteDocument(id);
    } catch (e) {
      // ignore
    }
  }

  // Check if categories still have high default numbers from legacy mock data
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_CATEGORIES_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // If currentCount is still the old mock numbers (124, 432, etc.) and no user docs exist
        const allDocs = await getAllDocuments();
        if (allDocs.length === 0) {
          const reset = parsed.map((cat: DocumentCategory) => ({
            ...cat,
            currentCount: 0,
          }));
          saveCategories(reset);
        }
      }
    }
  } catch (e) {
    // ignore
  }
}

// Clear all documents from IndexedDB
export async function clearAllDocuments(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_DOCS], "readwrite");
    const store = transaction.objectStore(STORE_DOCS);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Reset system to clean state: clear documents and reset category counters to 0
export async function resetSystemToCleanState(): Promise<void> {
  await clearAllDocuments();
  const resetCats = INITIAL_CATEGORIES.map((cat) => ({
    ...cat,
    currentCount: 0,
  }));
  saveCategories(resetCats);
}

