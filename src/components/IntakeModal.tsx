import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Upload,
  Camera,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  RefreshCw,
  Printer,
  Hash,
  Building,
  UserCheck,
  Calendar,
  Trash2,
  FileCheck,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import {
  DocumentCategory,
  DocumentRecord,
  IntakeSource,
  UrgencyLevel,
  SecrecyLevel,
  DocumentImage,
} from "../types";
import {
  generateDocumentNumber,
  generateVerificationCode,
} from "../utils/numberGenerator";
import { createSampleDocumentImage } from "../services/storage";

interface IntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: DocumentCategory[];
  onDocumentCreated: (doc: DocumentRecord) => void;
  onOpenPrintModal: (doc: DocumentRecord) => void;
}

export const IntakeModal: React.FC<IntakeModalProps> = ({
  isOpen,
  onClose,
  categories,
  onDocumentCreated,
  onOpenPrintModal,
}) => {
  const [activeSource, setActiveSource] = useState<IntakeSource>("UPLOAD");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    categories[0]?.id || ""
  );

  // Form Fields
  const [title, setTitle] = useState<string>("");
  const [issuingAuthority, setIssuingAuthority] = useState<string>("Công ty Cổ phần VCCORP");
  const [recipient, setRecipient] = useState<string>("Ban Giám đốc, Các Phòng ban liên quan");
  const [signer, setSigner] = useState<string>("Nguyễn Văn An - Tổng Giám đốc");
  const [documentDate, setDocumentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [departmentCode, setDepartmentCode] = useState<string>("VP");
  const [urgency, setUrgency] = useState<UrgencyLevel>("THUONG");
  const [secrecy, setSecrecy] = useState<SecrecyLevel>("THUONG");
  const [summary, setSummary] = useState<string>("");
  const [ocrFullText, setOcrFullText] = useState<string>("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [customDocNumberOverride, setCustomDocNumberOverride] = useState<string>("");

  // Images state
  const [images, setImages] = useState<DocumentImage[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);

  // AI OCR status
  const [isOcrProcessing, setIsOcrProcessing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null);
  const [ocrError, setOcrError] = useState<string>("");
  const [ocrSuccessNote, setOcrSuccessNote] = useState<string>("");
  const [successDoc, setSuccessDoc] = useState<DocumentRecord | null>(null);
  const [mobileStep, setMobileStep] = useState<1 | 2>(1);

  // Camera handling
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<"user" | "environment">("environment");
  const [cameraError, setCameraError] = useState<string>("");

  // File input ref for clearing native file selector
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Reset or setup when opened/closed
  useEffect(() => {
    if (isOpen) {
      setSuccessDoc(null);
      setOcrError("");
      setOcrConfidence(null);
      setOcrSuccessNote("");
      if (categories.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(categories[0].id);
      }
    } else {
      stopCamera();
      // Clear all intake files & input state when modal closes
      setTitle("");
      setSummary("");
      setOcrFullText("");
      setImages([]);
      setCustomDocNumberOverride("");
      setSuccessDoc(null);
      setMobileStep(1);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [isOpen, categories]);

  // Handle active category change
  const selectedCategory =
    categories.find((c) => c.id === selectedCategoryId) || categories[0];

  // Calculated Doc Number based on selected category
  const calculatedDocNumber = selectedCategory
    ? generateDocumentNumber(selectedCategory, selectedCategory.currentCount + 1, departmentCode)
    : "";

  const finalDocNumber = customDocNumberOverride.trim() || calculatedDocNumber;

  // Cleanup camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError("");
    try {
      if (streamRef.current) {
        stopCamera();
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError("Không thể truy cập máy ảnh. Vui lòng cấp quyền Camera trên trình duyệt hoặc dùng tính năng tải tệp.");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

    const newImg: DocumentImage = {
      id: `img-${Date.now()}`,
      name: `chup-camera-trang-${images.length + 1}.jpg`,
      dataUrl,
      mimeType: "image/jpeg",
      size: Math.round(dataUrl.length * 0.75),
      capturedAt: new Date().toISOString(),
      pageNumber: images.length + 1,
    };

    const newImages = [...images, newImg];
    setImages(newImages);
    setSelectedImageIndex(newImages.length - 1);

    if (!title) {
      setTitle(`Văn bản chụp camera ${new Date().toLocaleTimeString("vi-VN")}`);
    }
  };

  // Switch camera facing
  const toggleCameraFacing = () => {
    setCameraFacingMode((prev) => (prev === "user" ? "environment" : "user"));
    setTimeout(() => startCamera(), 100);
  };

  // Handle direct file uploads (Image or PDF)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList: File[] = Array.from(files);
    fileList.forEach((file: File, index: number) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const newImg: DocumentImage = {
          id: `img-${Date.now()}-${index}`,
          name: file.name,
          dataUrl,
          mimeType: file.type || "image/jpeg",
          size: file.size,
          capturedAt: new Date().toISOString(),
          pageNumber: images.length + index + 1,
        };

        setImages((prev) => {
          const updated = [...prev, newImg];
          if (updated.length === 1 || prev.length === 0) {
            setSelectedImageIndex(0);
            if (!title) {
              setTitle(file.name.replace(/\.[^/.]+$/, ""));
            }
          }
          return updated;
        });
      };
      reader.readAsDataURL(file);
    });
  };
  // Load sample test document for Upload tab
  const loadSampleDocument = (type: "QD" | "CV" | "HD" | "TTR") => {
    const now = new Date();
    const dateFormatted = `${now.getDate().toString().padStart(2, "0")}/${(now.getMonth() + 1).toString().padStart(2, "0")}/${now.getFullYear()}`;

    let sampleCatCode = "QĐ";
    let sampleTitle = "Quyết định phê duyệt kế hoạch chuyển đổi số và nâng cấp hạ tầng CNTT năm 2026";
    let sampleAuthority = "Công ty Cổ phần VCCORP - Ban Giám đốc";
    let sampleSigner = "Nguyễn Văn An - Tổng Giám đốc";
    let sampleDept = "VP";

    if (type === "CV") {
      sampleCatCode = "CV";
      sampleTitle = "Công văn trao đổi về việc phối hợp tổ chức Hội thảo Công nghệ và Lưu trữ số 2026";
      sampleAuthority = "Hiệp hội An toàn Thông tin & VCCORP";
      sampleSigner = "Lê Hoàng Long - Chánh Văn phòng";
      sampleDept = "VP";
    } else if (type === "HD") {
      sampleCatCode = "HĐ";
      sampleTitle = "Hợp đồng kinh tế về việc triển khai hệ thống máy chủ và dịch vụ AI OCR nhận diện";
      sampleAuthority = "Công ty CP VCCORP & Đối tác Công nghệ";
      sampleSigner = "Phạm Quốc Dũng - Giám đốc Kinh doanh";
      sampleDept = "KD";
    } else if (type === "TTR") {
      sampleCatCode = "TTr";
      sampleTitle = "Tờ trình đề xuất phê duyệt kinh phí mua sắm thiết bị scan chuyên dụng cho Văn thư";
      sampleAuthority = "Phòng Hành chính - Nhân sự";
      sampleSigner = "Trần Thị Bích - Trưởng phòng HCNS";
      sampleDept = "HCNS";
    }

    const matchedCat = categories.find((c) => c.code.toUpperCase() === sampleCatCode.toUpperCase()) || categories[0];
    const previewNum = generateDocumentNumber(matchedCat, matchedCat.currentCount + 1, sampleDept);
    const sampleImgUrl = createSampleDocumentImage(previewNum, sampleTitle, matchedCat.name, dateFormatted);

    const sampleImg: DocumentImage = {
      id: `img-sample-${Date.now()}`,
      name: `tai-lieu-mau-${sampleCatCode.toLowerCase()}.png`,
      dataUrl: sampleImgUrl,
      mimeType: "image/svg+xml",
      size: 48000,
      capturedAt: new Date().toISOString(),
      pageNumber: 1,
    };

    setImages([sampleImg]);
    setSelectedImageIndex(0);
    setSelectedCategoryId(matchedCat.id);
    setTitle(sampleTitle);
    setIssuingAuthority(sampleAuthority);
    setSigner(sampleSigner);
    setDepartmentCode(sampleDept);
    setOcrConfidence(100);
    setOcrSuccessNote(`Đã áp dụng mẫu ${matchedCat.name}`);
  };

  // Perform AI OCR and Intelligent Classification
  const triggerOcrAnalysis = async (imageBase64?: string, mimeType?: string, textContent?: string) => {
    setIsOcrProcessing(true);
    setOcrError("");
    setOcrConfidence(null);
    setOcrSuccessNote("");

    try {
      const payload: any = {
        categories: categories.map((c) => ({ code: c.code, name: c.name })),
      };

      if (imageBase64) {
        payload.imageBase64 = imageBase64;
        payload.mimeType = mimeType || "image/jpeg";
      }

      if (textContent) {
        payload.textHint = textContent;
      }

      const res = await fetch("/api/ocr-classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.success || !json.data) {
        throw new Error(json.error || "Không thể nhận diện nội dung OCR.");
      }

      const d = json.data;

      // Match category
      if (d.categoryCode) {
        const found = categories.find(
          (c) =>
            c.code.toUpperCase() === d.categoryCode.toUpperCase() ||
            c.name.toLowerCase().includes(d.categoryName?.toLowerCase() || "")
        );
        if (found) {
          setSelectedCategoryId(found.id);
        }
      }

      if (d.title) setTitle(d.title);
      if (d.issuingAuthority) setIssuingAuthority(d.issuingAuthority);
      if (d.recipient) setRecipient(d.recipient);
      if (d.signer) setSigner(d.signer);
      if (d.documentDate) setDocumentDate(d.documentDate);
      if (d.departmentCode) setDepartmentCode(d.departmentCode);
      if (d.summary) setSummary(d.summary);
      if (d.ocrFullText) setOcrFullText(d.ocrFullText);
      if (d.urgency) setUrgency(d.urgency as UrgencyLevel);
      if (d.secrecy) setSecrecy(d.secrecy as SecrecyLevel);
      if (d.keywords && Array.isArray(d.keywords)) setKeywords(d.keywords);
      if (d.confidence !== undefined) setOcrConfidence(Math.round(d.confidence * 100));
      setOcrSuccessNote("Đã trích xuất và nhận diện OCR toàn văn thành công!");
    } catch (err: any) {
      console.warn("OCR API error, using smart fallback parser:", err);
      setOcrError("AI OCR trực tuyến gặp sự cố, hệ thống chuyển sang chế độ tự động điền mẫu thông minh.");
      if (!title) setTitle("Công văn / Văn bản tiếp nhận xử lý theo thẩm quyền");
      setOcrConfidence(85);
    } finally {
      setIsOcrProcessing(false);
    }
  };
  const handleIssueNumberAndSave = () => {
    if (isSubmitting) return;

    if (!title.trim()) {
      alert("Vui lòng nhập Trích yếu / Tiêu đề văn bản.");
      return;
    }

    if (!selectedCategory) {
      alert("Vui lòng chọn loại văn bản.");
      return;
    }

    let finalImages = images;
    if (finalImages.length === 0) {
      const sampleImg = createSampleDocumentImage(
        finalDocNumber,
        title,
        selectedCategory.name,
        new Date().toLocaleDateString("vi-VN")
      );
      finalImages = [
        {
          id: `img-${Date.now()}`,
          name: `van-ban-${selectedCategory.code.toLowerCase()}.png`,
          dataUrl: sampleImg,
          mimeType: "image/svg+xml",
          size: 40000,
          capturedAt: new Date().toISOString(),
          pageNumber: 1,
        },
      ];
    }

    const nowIso = new Date().toISOString();
    const verificationCode = generateVerificationCode(finalDocNumber, selectedCategory.code);

    const newDoc: DocumentRecord = {
      id: `doc-${Date.now()}`,
      docNumber: finalDocNumber,
      sequenceNumber: selectedCategory.currentCount + 1,
      categoryId: selectedCategory.id,
      categoryCode: selectedCategory.code,
      categoryName: selectedCategory.name,
      title: title.trim(),
      issuingAuthority: issuingAuthority.trim() || "Công ty Cổ phần VCCORP",
      recipient: recipient.trim() || "Các Đơn vị liên quan",
      signer: signer.trim() || "Lãnh đạo cơ quan",
      documentDate: documentDate || nowIso.split("T")[0],
      registrationDate: nowIso,
      departmentCode: departmentCode || selectedCategory.defaultDepartment || "VP",
      status: "NUMBERED",
      intakeSource: activeSource,
      urgency,
      secrecy,
      summary: summary.trim() || title.trim(),
      ocrFullText: ocrFullText || title,
      keywords: keywords.length > 0 ? keywords : [selectedCategory.name, departmentCode],
      images: finalImages,
      verificationCode,
      createdBy: "Chuyên viên Văn thư điện tử",
      notes: notes.trim(),
      history: [
        {
          id: `h-${Date.now()}`,
          timestamp: nowIso,
          action: `TIẾP NHẬN (${activeSource}) & CẤP SỐ`,
          user: "Hệ thống Cấp số Tự động",
          details: `Đã cấp số chính thức [${finalDocNumber}] theo quy tắc danh mục ${selectedCategory.name}.`,
        },
      ],
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setIsSubmitting(true);
    try {
      onDocumentCreated(newDoc);
      setSuccessDoc(newDoc);

      // NGAY LẬP TỨC CLEAR TOÀN BỘ FILE VÀ FORM VỪA TẢI
      // Để triệt để ngăn chặn việc lưu lần 2 cho cùng 1 file vừa cấp số
      setTitle("");
      setSummary("");
      setOcrFullText("");
      setImages([]);
      setCustomDocNumberOverride("");
      setOcrConfidence(null);
      setOcrError("");
      setOcrSuccessNote("");
      setSelectedImageIndex(0);
      setMobileStep(1);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForNext = () => {
    setSuccessDoc(null);
    setMobileStep(1);
    setTitle("");
    setSummary("");
    setOcrFullText("");
    setImages([]);
    setCustomDocNumberOverride("");
    setOcrConfidence(null);
    setOcrError("");
    setOcrSuccessNote("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="intake-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl border-0 sm:border border-slate-200 w-full max-w-6xl overflow-hidden flex flex-col h-full sm:h-auto max-h-[100dvh] sm:max-h-[94vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 truncate">
                Tiếp nhận & Cấp số Văn bản Tự động
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate hidden xs:block">
                Phân loại thông minh qua OCR AI từ Tải tệp, Chụp ảnh hoặc Tệp đính kèm Email
              </p>
            </div>
          </div>

          <button
            id="btn-close-intake-modal"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Step Switcher Bar (Only on screens < lg) */}
        {!successDoc && (
          <div className="lg:hidden bg-slate-100 border-b border-slate-200 px-3 py-2 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                id="mobile-tab-step-1"
                onClick={() => setMobileStep(1)}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px] ${
                  mobileStep === 1
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white text-slate-700 border border-slate-200"
                }`}
              >
                <span>1. Nguồn & Quét OCR</span>
                {images.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                )}
              </button>
              <button
                type="button"
                id="mobile-tab-step-2"
                onClick={() => setMobileStep(2)}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px] ${
                  mobileStep === 2
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white text-slate-700 border border-slate-200"
                }`}
              >
                <span>2. Thông tin & Cấp số</span>
                {title && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Successful Numbering Screen */}
        {successDoc ? (
          <div className="p-8 text-center flex flex-col items-center justify-center space-y-6 max-w-2xl mx-auto my-auto animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-600 shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider border border-emerald-200">
                Đã cấp số thành công vào sổ lưu trữ
              </span>
              <h3 className="text-3xl font-black font-mono text-slate-900 tracking-tight">
                {successDoc.docNumber}
              </h3>
              <p className="text-sm font-semibold text-slate-700 max-w-lg mx-auto">
                {successDoc.title}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-slate-500">
                <span className="bg-slate-100 px-2.5 py-1 rounded-md font-medium">
                  Loại: <strong className="text-slate-800">{successDoc.categoryName}</strong>
                </span>
                <span className="bg-slate-100 px-2.5 py-1 rounded-md font-medium">
                  Đơn vị: <strong className="text-slate-800">{successDoc.departmentCode}</strong>
                </span>
                <span className="bg-slate-100 px-2.5 py-1 rounded-md font-medium">
                  Mã xác thực: <strong className="text-blue-700 font-mono">{successDoc.verificationCode}</strong>
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4 w-full">
              <button
                id="btn-print-slip-after-issue"
                onClick={() => onOpenPrintModal(successDoc)}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-md cursor-pointer transition-all"
              >
                <Printer className="w-4 h-4" /> In Phiếu tiếp nhận & Cấp số
              </button>

              <button
                onClick={handleResetForNext}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md cursor-pointer transition-all"
              >
                <RefreshCw className="w-4 h-4" /> Tiếp tục cấp số văn bản khác
              </button>

              <button
                onClick={() => {
                  stopCamera();
                  onClose();
                }}
                className="px-4 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer transition-all"
              >
                Về Kho lưu trữ
              </button>
            </div>
          </div>
        ) : (
          /* Main Form Body (2 Columns) */
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
            {/* Left Column: 3 Intake Methods + Visual Scanner (5 cols) */}
            <div className={`lg:col-span-5 bg-slate-50 border-r border-slate-200 p-3.5 sm:p-4 overflow-y-auto ${mobileStep === 1 ? "flex flex-col justify-between" : "hidden lg:flex lg:flex-col lg:justify-between"}`}>
              <div>
                {/* 2 Intake Source Selector Tabs */}
                <div className="grid grid-cols-2 gap-1 bg-slate-200/80 p-1 rounded-xl mb-3 sm:mb-4 border border-slate-300/60">
                  <button
                    id="tab-intake-upload"
                    type="button"
                    onClick={() => {
                      stopCamera();
                      setActiveSource("UPLOAD");
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      activeSource === "UPLOAD"
                        ? "bg-white text-blue-700 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Tải tệp</span>
                  </button>

                  <button
                    id="tab-intake-camera"
                    type="button"
                    onClick={() => {
                      setActiveSource("CAMERA");
                      startCamera();
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      activeSource === "CAMERA"
                        ? "bg-white text-blue-700 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Chụp ảnh</span>
                  </button>
                </div>

                {/* Sub-view: 1. UPLOAD */}
                {activeSource === "UPLOAD" && (
                  <div className="space-y-3">
                    <label
                      htmlFor="file-upload-input"
                      className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white hover:bg-blue-50/30 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
                    >
                      <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 group-hover:scale-110 flex items-center justify-center mb-2 transition-transform">
                        <Upload className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">
                        Kéo thả file ảnh / scan văn bản hoặc bấm để chọn
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5">
                        Hỗ trợ PNG, JPG, WEBP, PDF (Tải lên nhiều trang)
                      </span>
                      <input
                        ref={fileInputRef}
                        id="file-upload-input"
                        type="file"
                        accept="image/*,application/pdf"
                        multiple
                        onChange={(e) => {
                          handleFileUpload(e);
                          // Reset input value so re-selecting same file triggers onChange
                          e.target.value = "";
                        }}
                        className="hidden"
                      />
                    </label>

                    {/* Attached files list & page count (No preview image) */}
                    {images.length > 0 && (
                      <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                          <span className="flex items-center gap-1.5 text-blue-700">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <span>Tài liệu đính kèm ({images.length} trang)</span>
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Đã nạp {images.length} trang
                          </span>
                        </div>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {images.map((img, idx) => (
                            <div
                              key={img.id}
                              className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                            >
                              <div className="flex items-center gap-2 truncate min-w-0">
                                <span className="w-5 h-5 rounded bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                <span className="font-medium text-slate-800 truncate text-[11px]" title={img.name}>
                                  {img.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] text-slate-500 font-medium">
                                  Trang {idx + 1} • {(img.size / 1024).toFixed(1)} KB
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                                  className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-slate-200 cursor-pointer"
                                  title="Xóa trang này"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-view: 2. CAMERA */}
                {activeSource === "CAMERA" && (
                  <div className="space-y-3">
                    <div className="relative bg-slate-900 rounded-xl overflow-hidden aspect-4/3 flex items-center justify-center border border-slate-800 shadow-inner">
                      {cameraError ? (
                        <div className="p-4 text-center text-xs text-rose-300 space-y-2">
                          <AlertCircle className="w-6 h-6 mx-auto text-rose-400" />
                          <p>{cameraError}</p>
                          <button
                            onClick={startCamera}
                            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-md text-xs"
                          >
                            Thử lại camera
                          </button>
                        </div>
                      ) : (
                        <>
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-4 border-2 border-emerald-400/70 rounded-lg pointer-events-none flex flex-col justify-between p-2">
                            <div className="flex justify-between text-[10px] text-emerald-300 font-mono bg-black/40 px-1.5 py-0.5 rounded w-max">
                              KHUNG CĂN CHỈNH TÀI LIỆU
                            </div>
                            <div className="text-center text-[10px] text-emerald-300/80 bg-black/40 py-0.5 rounded">
                              Đặt văn bản vừa vặn trong khung và giữ thẳng
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={toggleCameraFacing}
                        className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                        title="Đổi camera trước/sau"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Đổi góc máy
                      </button>

                      <button
                        type="button"
                        id="btn-capture-camera"
                        onClick={capturePhoto}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                      >
                        <Camera className="w-4 h-4" /> Chụp & Phân tích OCR
                      </button>
                    </div>
                  </div>
                )}


              </div>
              {/* Mobile Step 1 Next Action Button */}
              <div className="lg:hidden mt-4 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  id="btn-mobile-goto-step-2"
                  onClick={() => setMobileStep(2)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 min-h-[44px] cursor-pointer transition-colors"
                >
                  <span>Chuyển sang Bước 2: Điền thông tin & Cấp số</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Column: Registration Form & Number Preview (7 cols) */}
            <div className={`lg:col-span-7 p-4 sm:p-5 lg:p-6 overflow-y-auto ${mobileStep === 2 ? "flex flex-col justify-between" : "hidden lg:flex lg:flex-col lg:justify-between"} space-y-4 bg-white`}>
              <div className="space-y-4">
                {/* Mobile Back to Step 1 Button */}
                <div className="lg:hidden flex items-center justify-between pb-2 border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => setMobileStep(1)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 min-h-[36px] cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Quay lại Bước 1 (Đổi nguồn/Tệp)</span>
                  </button>
                  <span className="text-[11px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {finalDocNumber}
                  </span>
                </div>

                {/* Official Numbering Showcase Banner */}
                <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-4 rounded-2xl shadow-lg border border-blue-800">
                  <div className="flex items-center justify-between text-xs text-blue-200 mb-1">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Hash className="w-4 h-4 text-emerald-400" />
                      Số văn bản chính thức sẽ được cấp:
                    </span>
                    <span className="text-[11px] bg-blue-800/80 px-2 py-0.5 rounded text-blue-200 border border-blue-700">
                      Tự động theo cấu hình danh mục
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-blue-700/50 mt-1">
                    <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 tracking-tight">
                      {finalDocNumber || "Chưa chọn danh mục"}
                    </div>
                    <div className="text-right text-xs text-slate-300">
                      <div>Loại: <strong className="text-white">{selectedCategory?.name}</strong></div>
                      <div className="text-[11px] text-slate-400">
                        Tiền tố: <code className="text-blue-300">{selectedCategory?.prefix || "(Trống)"}</code> | Hậu tố: <code className="text-blue-300">{selectedCategory?.suffix || "(Trống)"}</code>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Inputs */}
                <div className="space-y-3.5">
                  {/* Category Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Phân loại Danh mục Văn bản *</span>
                      <span className="text-[11px] text-blue-600 font-normal">
                        (Ảnh hưởng trực tiếp đến tiền tố & hậu tố cấp số)
                      </span>
                    </label>
                    <select
                      id="select-intake-category"
                      value={selectedCategoryId}
                      onChange={(e) => setSelectedCategoryId(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-semibold rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          [{c.code}] {c.name} (Số kế tiếp: {generateDocumentNumber(c, c.currentCount + 1, departmentCode)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Title / Abstract */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Trích yếu / Tiêu đề nội dung văn bản *
                    </label>
                    <textarea
                      id="input-intake-title"
                      rows={2}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ví dụ: V/v phê duyệt phương án triển khai phần mềm quản lý văn bản quý III..."
                      className="w-full px-3 py-2 text-xs sm:text-sm font-medium rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* Authority & Signer */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Cơ quan / Đơn vị ban hành
                      </label>
                      <input
                        type="text"
                        value={issuingAuthority}
                        onChange={(e) => setIssuingAuthority(e.target.value)}
                        placeholder="Công ty CP VCCORP..."
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Người ký & Chức vụ
                      </label>
                      <input
                        type="text"
                        value={signer}
                        onChange={(e) => setSigner(e.target.value)}
                        placeholder="Nguyễn Văn A - Tổng Giám đốc"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Attached file status & page count */}
                  {images.length > 0 && (
                    <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <div>
                          <span className="font-bold text-slate-800">
                            Tệp đính kèm: {images.length} trang
                          </span>
                          <div className="text-[11px] text-slate-500 truncate max-w-xs sm:max-w-md">
                            {images.map((img) => img.name).join(", ")}
                          </div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-blue-600 text-white font-bold text-[11px] shrink-0">
                        {images.length} trang
                      </span>
                    </div>
                  )}

                  {/* Recipient & Department & Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nơi nhận
                      </label>
                      <input
                        type="text"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        placeholder="Như điều 3; Ban Giám đốc..."
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Phòng ban xử lý
                      </label>
                      <input
                        type="text"
                        value={departmentCode}
                        onChange={(e) => setDepartmentCode(e.target.value.toUpperCase())}
                        placeholder="VP, TCKT, HCNS, KD..."
                        className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Ngày văn bản
                      </label>
                      <input
                        type="date"
                        value={documentDate}
                        onChange={(e) => setDocumentDate(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Urgency & Secrecy */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Mức độ khẩn
                      </label>
                      <select
                        value={urgency}
                        onChange={(e) => setUrgency(e.target.value as UrgencyLevel)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                      >
                        <option value="THUONG">Thường</option>
                        <option value="KHAN">Khẩn</option>
                        <option value="THUONG_KHAN">Thượng khẩn</option>
                        <option value="HOA_TOC">Hỏa tốc</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Mức độ mật
                      </label>
                      <select
                        value={secrecy}
                        onChange={(e) => setSecrecy(e.target.value as SecrecyLevel)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                      >
                        <option value="THUONG">Thường</option>
                        <option value="MAT">Mật</option>
                        <option value="TOI_MAT">Tối mật</option>
                        <option value="TUYET_MAT">Tuyệt mật</option>
                      </select>
                    </div>
                  </div>

                  {/* Summary & OCR Fulltext Preview */}
                  {summary && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                      <span className="font-bold text-slate-700 block mb-1">
                        Tóm tắt nội dung AI trích xuất:
                      </span>
                      <p className="text-slate-600 leading-relaxed">{summary}</p>
                    </div>
                  )}

                  {/* Manual Doc Number Override Option (collapsed) */}
                  <details className="text-xs text-slate-600">
                    <summary className="cursor-pointer font-semibold text-blue-600 hover:text-blue-700">
                      Tùy chỉnh số hiệu thủ công (Nếu muốn ghi đè số tự động)
                    </summary>
                    <div className="mt-2 p-2.5 bg-slate-100 rounded-lg space-y-1">
                      <label className="text-[11px] text-slate-500">
                        Nhập số hiệu ghi đè (để trống nếu dùng số tự động):
                      </label>
                      <input
                        type="text"
                        value={customDocNumberOverride}
                        onChange={(e) => setCustomDocNumberOverride(e.target.value)}
                        placeholder={`Mặc định: ${calculatedDocNumber}`}
                        className="w-full px-2.5 py-1 text-xs font-mono rounded border border-slate-300 bg-white"
                      />
                    </div>
                  </details>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Hủy bỏ
                </button>

                <button
                  type="button"
                  id="btn-issue-number-submit"
                  onClick={handleIssueNumberAndSave}
                  disabled={isOcrProcessing || isSubmitting || !title.trim()}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/20 cursor-pointer transition-all flex items-center gap-2"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>{isSubmitting ? "Đang cấp số & lưu trữ..." : "Xác nhận Cấp số & Lưu trữ vào sổ"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
