export interface DocumentCategory {
  id: string;
  code: string; // e.g. "QD", "CV", "TTR", "HD", "TB", "BB", "KH", "BC", "GM", "CT", "DX"
  name: string; // e.g. "Quyết định", "Công văn", "Tờ trình", "Hợp đồng kinh tế"
  prefix: string; // e.g. "QĐ-", "CV-", ""
  suffix: string; // e.g. "/QĐ-UBND", "/CV-VP", "/2026/VCC"
  formatTemplate: string; // e.g. "{NUM}{SUFFIX}" or "{PREFIX}{NUM_PAD3}/{YEAR}{SUFFIX}"
  currentCount: number; // e.g. 142
  paddingDigits: number; // e.g. 0 for no padding, 2 for '01', 3 for '001', 4 for '0001'
  resetYearly: boolean;
  defaultDepartment: string; // e.g. "VP", "TCKT", "HCNS", "KD"
  description: string;
  color: string; // badge color theme
  icon: string;
  isActive: boolean;
}

export type UrgencyLevel = "THUONG" | "KHAN" | "THUONG_KHAN" | "HOA_TOC";
export type SecrecyLevel = "THUONG" | "MAT" | "TOI_MAT" | "TUYET_MAT";
export type IntakeSource = "UPLOAD" | "CAMERA" | "EMAIL" | "MANUAL";
export type DocumentStatus = "DRAFT" | "NUMBERED" | "DISPATCHED" | "ARCHIVED" | "CANCELLED";

export interface DocumentImage {
  id: string;
  name: string;
  dataUrl: string;
  mimeType: string;
  size: number;
  capturedAt: string;
  pageNumber: number;
  rotation?: number;
}

export interface EmailAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  dataUrl: string;
  extractedText?: string;
  isMainDocument?: boolean;
}

export interface EmailMetadata {
  senderEmail: string;
  senderName: string;
  subject: string;
  receivedDate: string;
  rawBody?: string;
  attachments?: EmailAttachment[];
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  details: string;
}

export interface DocumentRecord {
  id: string;
  docNumber: string; // e.g. "128/QĐ-VCCORP"
  sequenceNumber: number;
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  title: string; // Trích yếu
  issuingAuthority: string; // Cơ quan ban hành / Nơi gửi
  recipient: string; // Nơi nhận
  signer: string; // Người ký & chức danh
  documentDate: string; // Ngày văn bản
  registrationDate: string; // Ngày cấp số vào sổ
  departmentCode: string; // Phòng ban
  status: DocumentStatus;
  intakeSource: IntakeSource;
  urgency: UrgencyLevel;
  secrecy: SecrecyLevel;
  summary: string;
  ocrFullText: string;
  keywords: string[];
  images: DocumentImage[];
  emailMetadata?: EmailMetadata;
  driveFileId?: string;
  driveWebViewLink?: string;
  driveThumbnailLink?: string;
  verificationCode: string;
  createdBy: string;
  notes: string;
  history: HistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OCRClassificationResult {
  categoryCode: string;
  categoryName: string;
  confidence: number;
  title: string;
  issuingAuthority: string;
  recipient: string;
  signer: string;
  documentDate: string;
  departmentCode: string;
  summary: string;
  ocrFullText: string;
  urgency?: UrgencyLevel;
  secrecy?: SecrecyLevel;
  keywords?: string[];
}
