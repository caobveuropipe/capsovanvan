import { DocumentCategory } from "../types";

/**
 * Generate formatted document number based on category settings, count, department, and custom template
 */
export function generateDocumentNumber(
  category: DocumentCategory,
  countOverride?: number,
  departmentOverride?: string,
  dateOverride?: Date
): string {
  const count = countOverride !== undefined ? countOverride : category.currentCount + 1;
  const date = dateOverride || new Date();
  const year = date.getFullYear().toString();
  const yy = year.slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const dept = departmentOverride || category.defaultDepartment || "VP";
  const code = category.code;
  const prefix = category.prefix || "";
  const suffix = category.suffix || "";

  // Apply padding
  let numStr = count.toString();
  if (category.paddingDigits && category.paddingDigits > 0) {
    numStr = numStr.padStart(category.paddingDigits, "0");
  }

  // Format template
  let template = category.formatTemplate;
  if (!template || template.trim() === "") {
    // Default standard Vietnamese document format: [PREFIX][NUMBER][SUFFIX]
    template = `${prefix}{NUM}${suffix}`;
  }

  const pad2 = count.toString().padStart(2, "0");
  const pad3 = count.toString().padStart(3, "0");
  const pad4 = count.toString().padStart(4, "0");

  let result = template
    .replace(/\{PREFIX\}/g, prefix)
    .replace(/\{SUFFIX\}/g, suffix)
    .replace(/\{NUM_PAD4\}/g, pad4)
    .replace(/\{NUM_PAD3\}/g, pad3)
    .replace(/\{NUM_PAD2\}/g, pad2)
    .replace(/\{NUM\}/g, numStr)
    .replace(/\{YEAR\}/g, year)
    .replace(/\{YY\}/g, yy)
    .replace(/\{MONTH\}/g, month)
    .replace(/\{DEPT\}/g, dept)
    .replace(/\{CODE\}/g, code);

  return result.trim();
}

/**
 * Generate a short verification hash code for QR & Stamping
 */
export function generateVerificationCode(docNumber: string, categoryCode: string): string {
  const salt = "VN-DOC-VERIFY-2026";
  const str = `${docNumber}-${categoryCode}-${salt}-${Date.now().toString(36)}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, "0");
  return `VN-${categoryCode}-${hex.substring(0, 4)}-${hex.substring(4, 8)}`;
}

/**
 * Format date in standard Vietnamese format
 */
export function formatVietnameseDate(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  if (isNaN(d.getTime())) return dateStr || "";
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatVietnameseDateTime(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  if (isNaN(d.getTime())) return dateStr || "";
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  return `${hours}:${minutes} ngày ${day}/${month}/${year}`;
}
