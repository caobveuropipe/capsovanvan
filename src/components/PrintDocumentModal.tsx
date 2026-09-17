import React, { useState } from "react";
import {
  X,
  Printer,
  FileText,
  CheckCircle2,
  Sparkles,
  Layers,
  FileCheck,
  Building,
} from "lucide-react";
import { DocumentRecord } from "../types";
import {
  formatVietnameseDate,
  formatVietnameseDateTime,
} from "../utils/numberGenerator";

interface PrintDocumentModalProps {
  document: DocumentRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintDocumentModal: React.FC<PrintDocumentModalProps> = ({
  document: doc,
  isOpen,
  onClose,
}) => {
  const [printLayout, setPrintLayout] = useState<"slip" | "document">("slip");

  if (!isOpen || !doc) return null;

  const handleTriggerPrint = () => {
    window.print();
  };

  const primaryImage = doc.images && doc.images[0] ? doc.images[0] : null;

  return (
    <div
      id="print-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl border-0 sm:border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col h-full sm:h-auto max-h-[100dvh] sm:max-h-[95vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Controls Header (Hidden in Print) */}
        <div className="px-3.5 sm:px-6 py-3 sm:py-4 bg-slate-900 text-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-b border-slate-800 shrink-0 print:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
                <Printer className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 truncate">
                  In Ấn & Xuất Bản Văn Bản
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-400 truncate hidden xs:block">
                  Lựa chọn mẫu in phiếu tiếp nhận hoặc in văn bản gốc kèm dấu số điện tử
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="sm:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            {/* Layout switch */}
            <div className="bg-slate-800 p-1 rounded-lg border border-slate-700 flex items-center gap-1 text-xs flex-1 sm:flex-initial">
              <button
                type="button"
                onClick={() => setPrintLayout("slip")}
                className={`flex-1 sm:flex-initial px-2 sm:px-3 py-1 rounded-md font-semibold transition-all cursor-pointer text-center text-[11px] sm:text-xs ${
                  printLayout === "slip"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Phiếu cấp số
              </button>
              <button
                type="button"
                onClick={() => setPrintLayout("document")}
                className={`flex-1 sm:flex-initial px-2 sm:px-3 py-1 rounded-md font-semibold transition-all cursor-pointer text-center text-[11px] sm:text-xs ${
                  printLayout === "document"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Văn bản có dấu
              </button>
            </div>

            <button
              type="button"
              onClick={handleTriggerPrint}
              className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer transition-all min-h-[34px]"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In ngay</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="hidden sm:block text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer min-h-[34px] min-w-[34px]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area Preview Container */}
        <div className="flex-1 p-3 sm:p-8 bg-slate-100 overflow-y-auto flex justify-center print:p-0 print:bg-white">
          {/* A4 Sheet Container */}
          <div
            id="printable-a4-document"
            className="w-full max-w-[210mm] min-h-[297mm] bg-white p-4 sm:p-12 shadow-xl border border-slate-200 print:shadow-none print:border-none print:p-8 print:w-full print:max-w-none text-slate-900 font-serif leading-relaxed"
          >
            {/* OPTION 1: OFFICIAL REGISTRATION & NUMBERING SLIP */}
            {printLayout === "slip" && (
              <div className="space-y-6">
                {/* Header: National Motto & Authority */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                  <div className="text-center w-1/2 pr-4">
                    <div className="font-sans text-xs uppercase font-bold text-slate-700">
                      CÔNG TY CỔ PHẦN VCCORP
                    </div>
                    <div className="font-sans text-xs uppercase font-black text-slate-900">
                      VĂN PHÒNG TIẾP NHẬN &amp; LƯU TRỮ VĂN BẢN
                    </div>
                    <div className="w-24 h-0.5 bg-slate-900 mx-auto mt-1" />
                    <div className="font-sans text-[11px] font-bold text-blue-800 mt-2">
                      MÃ SỐ SỔ: <span className="font-mono">{doc.verificationCode}</span>
                    </div>
                  </div>

                  <div className="text-center w-1/2 pl-4">
                    <div className="font-bold text-xs uppercase text-slate-900">
                      CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                    </div>
                    <div className="font-bold text-xs text-slate-900">
                      Độc lập - Tự do - Hạnh phúc
                    </div>
                    <div className="w-32 h-0.5 bg-slate-900 mx-auto mt-1" />
                    <div className="text-[11px] italic text-slate-600 mt-2 font-sans">
                      Hà Nội, {formatVietnameseDate(doc.registrationDate)}
                    </div>
                  </div>
                </div>

                {/* Slip Title */}
                <div className="text-center space-y-1 py-2">
                  <h1 className="font-sans text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900">
                    PHIẾU TIẾP NHẬN VÀ CẤP SỐ VĂN BẢN
                  </h1>
                  <p className="font-sans text-xs text-slate-500 font-medium">
                    (Theo Quy chế văn thư &amp; Lưu trữ số hóa Nghị định 30/2020/NĐ-CP)
                  </p>
                </div>

                {/* Official Number Highlight Box */}
                <div className="bg-slate-50 border-2 border-slate-900 p-4 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="font-sans text-[11px] uppercase font-bold text-slate-500">
                      SỐ HIỆU VĂN BẢN CHÍNH THỨC
                    </div>
                    <div className="font-mono text-2xl sm:text-3xl font-black text-blue-900 tracking-tight">
                      {doc.docNumber}
                    </div>
                  </div>
                  <div className="text-right font-sans">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-900 text-xs font-bold rounded-md border border-emerald-300">
                      ĐÃ VÀO SỔ LƯU TRỮ
                    </span>
                    <div className="text-[10px] text-slate-500 mt-1 font-mono">
                      Thời điểm cấp: {formatVietnameseDateTime(doc.registrationDate)}
                    </div>
                  </div>
                </div>

                {/* Detailed Table */}
                <div className="border border-slate-900 rounded-sm overflow-hidden font-sans text-xs">
                  <div className="grid grid-cols-12 border-b border-slate-300 bg-slate-100 p-2.5 font-bold">
                    <div className="col-span-4 text-slate-700">Trường thông tin</div>
                    <div className="col-span-8 text-slate-900">Chi tiết dữ liệu văn bản</div>
                  </div>

                  <div className="grid grid-cols-12 border-b border-slate-200 p-2.5">
                    <div className="col-span-4 font-bold text-slate-600">Trích yếu nội dung:</div>
                    <div className="col-span-8 font-bold text-slate-900 text-sm font-serif">
                      {doc.title}
                    </div>
                  </div>

                  <div className="grid grid-cols-12 border-b border-slate-200 p-2.5">
                    <div className="col-span-4 font-bold text-slate-600">Loại văn bản:</div>
                    <div className="col-span-8 font-semibold text-slate-800">
                      {doc.categoryName} (Mã: {doc.categoryCode})
                    </div>
                  </div>

                  <div className="grid grid-cols-12 border-b border-slate-200 p-2.5">
                    <div className="col-span-4 font-bold text-slate-600">Cơ quan / Đơn vị ban hành:</div>
                    <div className="col-span-8 font-semibold text-slate-800">{doc.issuingAuthority}</div>
                  </div>

                  <div className="grid grid-cols-12 border-b border-slate-200 p-2.5">
                    <div className="col-span-4 font-bold text-slate-600">Người ký &amp; Chức vụ:</div>
                    <div className="col-span-8 font-semibold text-slate-800">{doc.signer}</div>
                  </div>

                  <div className="grid grid-cols-12 border-b border-slate-200 p-2.5">
                    <div className="col-span-4 font-bold text-slate-600">Nơi nhận văn bản:</div>
                    <div className="col-span-8 text-slate-800">{doc.recipient}</div>
                  </div>

                  <div className="grid grid-cols-12 border-b border-slate-200 p-2.5">
                    <div className="col-span-4 font-bold text-slate-600">Phòng ban phụ trách / Xử lý:</div>
                    <div className="col-span-8 font-mono font-bold text-slate-800">{doc.departmentCode}</div>
                  </div>

                  <div className="grid grid-cols-12 border-b border-slate-200 p-2.5">
                    <div className="col-span-4 font-bold text-slate-600">Ngày ký văn bản:</div>
                    <div className="col-span-8 text-slate-800">{formatVietnameseDate(doc.documentDate)}</div>
                  </div>

                  <div className="grid grid-cols-12 border-b border-slate-200 p-2.5">
                    <div className="col-span-4 font-bold text-slate-600">Phương thức tiếp nhận:</div>
                    <div className="col-span-8 font-semibold text-blue-800">
                      {doc.intakeSource === "UPLOAD"
                        ? "Tải tệp số hóa trực tiếp"
                        : doc.intakeSource === "CAMERA"
                        ? "Quét trực tiếp qua Camera ứng dụng"
                        : doc.intakeSource === "EMAIL"
                        ? "Tự động tiếp nhận từ Thư điện tử (Email Gateway)"
                        : "Nhập thủ công"}
                    </div>
                  </div>

                  <div className="grid grid-cols-12 border-b border-slate-200 p-2.5">
                    <div className="col-span-4 font-bold text-slate-600">Độ khẩn / Độ mật:</div>
                    <div className="col-span-8 text-slate-800">
                      Khẩn: <strong>{doc.urgency}</strong> | Mật: <strong>{doc.secrecy}</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-12 p-2.5">
                    <div className="col-span-4 font-bold text-slate-600">Tóm tắt nội dung AI OCR:</div>
                    <div className="col-span-8 text-slate-700 italic font-serif">
                      "{doc.summary || doc.title}"
                    </div>
                  </div>
                </div>

                {/* Signatures Section */}
                <div className="grid grid-cols-3 gap-4 pt-6 text-center font-sans text-xs">
                  <div>
                    <div className="font-bold uppercase text-slate-900">NGƯỜI LẬP PHIẾU</div>
                    <div className="italic text-[10px] text-slate-500">(Ký và ghi rõ họ tên)</div>
                    <div className="h-16" />
                    <div className="font-semibold text-slate-800">{doc.createdBy || "Văn thư số hóa"}</div>
                  </div>

                  <div>
                    <div className="font-bold uppercase text-slate-900">VĂN THƯ TIẾP NHẬN</div>
                    <div className="italic text-[10px] text-slate-500">(Ký và đóng dấu vào sổ)</div>
                    <div className="h-16" />
                    <div className="font-semibold text-slate-800">Trần Mai Phương</div>
                  </div>

                  <div>
                    <div className="font-bold uppercase text-slate-900">LÃNH ĐẠO PHÊ DUYỆT</div>
                    <div className="italic text-[10px] text-slate-500">(Ký duyệt)</div>
                    <div className="h-16" />
                    <div className="font-semibold text-slate-800">Lê Hoàng Long</div>
                  </div>
                </div>

                {/* Bottom Verification Hash & Barcode footer */}
                <div className="pt-6 border-t border-slate-300 flex items-center justify-between text-[10px] font-sans text-slate-500">
                  <div>
                    <div>Hệ thống Cấp số &amp; Quản lý Văn bản Thông minh VCCORP</div>
                    <div>Mã tra cứu bảo mật: <span className="font-mono font-bold text-slate-800">{doc.verificationCode}</span></div>
                  </div>
                  <div className="text-right">
                    <div>Trang 1/1 - Bản in điện tử có giá trị lưu chiểu</div>
                  </div>
                </div>
              </div>
            )}

            {/* OPTION 2: SCANNED DOCUMENT WITH OFFICIAL STAMP OVERLAY */}
            {printLayout === "document" && (
              <div className="space-y-4">
                {/* Stamp banner at top */}
                <div className="p-3 bg-emerald-50 border-2 border-emerald-600 rounded-lg flex items-center justify-between font-sans text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-700" />
                    <div>
                      <span className="font-bold text-emerald-900 uppercase">
                        DẤU SỐ VĂN BẢN ĐIỆN TỬ CHÍNH THỨC
                      </span>
                      <div className="font-mono font-black text-sm text-emerald-950">
                        Số: {doc.docNumber}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-emerald-800">
                    <div>Ngày cấp: {formatVietnameseDateTime(doc.registrationDate)}</div>
                    <div className="font-mono">Mã: {doc.verificationCode}</div>
                  </div>
                </div>

                {/* Scanned Image Rendering */}
                {primaryImage ? (
                  <div className="border border-slate-300 rounded-lg overflow-hidden shadow-sm flex justify-center bg-white p-2">
                    <img
                      src={primaryImage.dataUrl}
                      alt={doc.title}
                      className="w-full h-auto object-contain max-h-[850px]"
                    />
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-400 font-sans text-sm">
                    Không có hình ảnh quét đính kèm
                  </div>
                )}

                {/* Footer Notice */}
                <div className="text-center font-sans text-[10px] text-slate-400 pt-2">
                  Văn bản được số hóa và lưu trữ tại Hệ thống Quản lý Văn bản điện tử VCCORP.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
