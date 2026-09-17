import React, { useState } from "react";
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Save,
  RotateCcw,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Hash,
  Layers,
  ArrowRight,
} from "lucide-react";
import { DocumentCategory } from "../types";
import { generateDocumentNumber } from "../utils/numberGenerator";
import { INITIAL_CATEGORIES } from "../services/storage";

interface CategoryConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: DocumentCategory[];
  onSaveCategories: (updated: DocumentCategory[]) => void;
}

export const CategoryConfigModal: React.FC<CategoryConfigModalProps> = ({
  isOpen,
  onClose,
  categories,
  onSaveCategories,
}) => {
  const [catList, setCatList] = useState<DocumentCategory[]>(categories);
  const [selectedCatId, setSelectedCatId] = useState<string>(
    categories[0]?.id || ""
  );
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingForm, setEditingForm] = useState<Partial<DocumentCategory>>({});
  const [showTokenHelp, setShowTokenHelp] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>("");
  const [mobileTab, setMobileTab] = useState<"list" | "edit">("list");

  if (!isOpen) return null;

  const currentSelectedCat =
    catList.find((c) => c.id === selectedCatId) || catList[0];

  const handleSelectCategory = (cat: DocumentCategory) => {
    setSelectedCatId(cat.id);
    setIsEditing(false);
    setEditingForm(cat);
    setMobileTab("edit");
  };

  const handleStartEdit = (cat: DocumentCategory) => {
    setSelectedCatId(cat.id);
    setEditingForm({ ...cat });
    setIsEditing(true);
    setMobileTab("edit");
  };

  const handleStartAddNew = () => {
    const newId = `cat-custom-${Date.now()}`;
    const newCat: DocumentCategory = {
      id: newId,
      code: "VB",
      name: "Văn bản mới",
      prefix: "",
      suffix: "/VB-VP",
      formatTemplate: "{NUM}/VB-{DEPT}",
      currentCount: 0,
      paddingDigits: 0,
      resetYearly: true,
      defaultDepartment: "VP",
      description: "Danh mục văn bản tùy chỉnh",
      color: "blue",
      icon: "FileText",
      isActive: true,
    };
    setEditingForm(newCat);
    setSelectedCatId(newId);
    setIsEditing(true);
    setMobileTab("edit");
  };

  const handleSaveCurrentEdit = () => {
    if (!editingForm.code || !editingForm.name) {
      alert("Vui lòng nhập Tên loại văn bản và Mã phân loại.");
      return;
    }

    let updated: DocumentCategory[];
    const exists = catList.some((c) => c.id === editingForm.id);

    if (exists) {
      updated = catList.map((c) =>
        c.id === editingForm.id ? ({ ...c, ...editingForm } as DocumentCategory) : c
      );
    } else {
      updated = [...catList, editingForm as DocumentCategory];
    }

    setCatList(updated);
    onSaveCategories(updated);
    setIsEditing(false);
    setSaveSuccessMsg("Đã lưu cấu hình danh mục thành công!");
    setTimeout(() => setSaveSuccessMsg(""), 3000);
  };

  const handleDeleteCategory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (catList.length <= 1) {
      alert("Hệ thống phải có ít nhất 1 loại văn bản.");
      return;
    }
    if (
      confirm(
        "Bạn có chắc chắn muốn xóa danh mục này? Các văn bản đã cấp số sẽ vẫn giữ nguyên số hiệu."
      )
    ) {
      const updated = catList.filter((c) => c.id !== id);
      setCatList(updated);
      onSaveCategories(updated);
      if (selectedCatId === id) {
        setSelectedCatId(updated[0].id);
        setIsEditing(false);
      }
    }
  };

  const handleResetToDefault = () => {
    if (
      confirm(
        "Khôi phục danh mục mẫu chuẩn hành chính Việt Nam (Quyết định, Công văn, Tờ trình, Hợp đồng,...)? Các số đếm tùy chỉnh sẽ được cập nhật."
      )
    ) {
      setCatList(INITIAL_CATEGORIES);
      onSaveCategories(INITIAL_CATEGORIES);
      setSelectedCatId(INITIAL_CATEGORIES[0].id);
      setIsEditing(false);
      setSaveSuccessMsg("Đã khôi phục danh mục mặc định!");
      setTimeout(() => setSaveSuccessMsg(""), 3000);
    }
  };

  // Insert token into template
  const insertToken = (token: string) => {
    const current = editingForm.formatTemplate || "";
    setEditingForm({ ...editingForm, formatTemplate: current + token });
  };

  // Preview numbers for currently active form or selected category
  const targetCatForPreview: DocumentCategory = isEditing
    ? ({
        ...currentSelectedCat,
        ...editingForm,
      } as DocumentCategory)
    : currentSelectedCat;

  const currentPreview = targetCatForPreview
    ? generateDocumentNumber(
        targetCatForPreview,
        targetCatForPreview.currentCount
      )
    : "";
  const nextPreview = targetCatForPreview
    ? generateDocumentNumber(
        targetCatForPreview,
        targetCatForPreview.currentCount + 1
      )
    : "";
  const nextNextPreview = targetCatForPreview
    ? generateDocumentNumber(
        targetCatForPreview,
        targetCatForPreview.currentCount + 2
      )
    : "";

  return (
    <div
      id="category-config-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl border-0 sm:border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col h-full sm:h-auto max-h-[100dvh] sm:max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-3.5 sm:px-6 py-3 sm:py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
              <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-lg font-bold text-white flex items-center gap-2 truncate">
                Cấu hình Phân loại & Tiền/Hậu tố
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate hidden xs:block">
                Tùy chỉnh quy tắc sinh số tự động cho từng danh mục văn bản
              </p>
            </div>
          </div>
          <button
            id="btn-close-config-modal"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile View Switcher (md:hidden) */}
        <div className="md:hidden bg-slate-800 border-b border-slate-700 px-3 py-2 flex items-center justify-between gap-2 shrink-0">
          <div className="grid grid-cols-2 gap-2 w-full">
            <button
              type="button"
              onClick={() => setMobileTab("list")}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer min-h-[36px] ${
                mobileTab === "list"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200"
              }`}
            >
              Danh sách loại ({catList.length})
            </button>
            <button
              type="button"
              onClick={() => setMobileTab("edit")}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer min-h-[36px] ${
                mobileTab === "edit"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200"
              }`}
            >
              Cấu hình: {targetCatForPreview?.code || "Chi tiết"}
            </button>
          </div>
        </div>

        {/* Notification banner */}
        {saveSuccessMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 sm:px-6 py-2.5 text-xs text-emerald-800 font-medium flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate">{saveSuccessMsg}</span>
          </div>
        )}

        {/* Content Body: Two columns layout */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden min-h-[420px]">
          {/* Left Column: Category List (5 cols) */}
          <div className={`md:col-span-4 lg:col-span-5 border-r border-slate-200 bg-slate-50/70 p-3.5 sm:p-4 overflow-y-auto ${mobileTab === "list" ? "flex flex-col justify-between" : "hidden md:flex md:flex-col md:justify-between"}`}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Danh mục loại văn bản ({catList.length})
                </span>
                <button
                  id="btn-add-new-category"
                  onClick={handleStartAddNew}
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm loại mới
                </button>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {catList.map((cat) => {
                  const isSelected = cat.id === selectedCatId;
                  const previewStr = generateDocumentNumber(cat, cat.currentCount + 1);

                  return (
                    <div
                      key={cat.id}
                      onClick={() => handleSelectCategory(cat)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                        isSelected
                          ? "bg-white border-blue-500 shadow-sm ring-2 ring-blue-500/10"
                          : "bg-white/80 hover:bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-900 text-white tracking-wide">
                            {cat.code}
                          </span>
                          <span className="text-sm font-semibold text-slate-800 truncate">
                            {cat.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>Số tiếp theo:</span>
                          <span className="font-mono font-bold text-blue-600 truncate">
                            {previewStr}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(cat);
                          }}
                          title="Sửa cấu hình"
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-100"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteCategory(cat.id, e)}
                          title="Xóa danh mục"
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reset to system presets */}
            <div className="pt-4 mt-4 border-t border-slate-200">
              <button
                id="btn-reset-default-categories"
                onClick={handleResetToDefault}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 bg-white border border-slate-200 hover:border-slate-300 py-2 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Khôi phục danh mục mẫu chuẩn
              </button>
            </div>
          </div>

          {/* Right Column: Edit / Detail Form (7 cols) */}
          <div className={`md:col-span-8 lg:col-span-7 p-4 sm:p-5 lg:p-6 overflow-y-auto ${mobileTab === "edit" ? "flex flex-col justify-between" : "hidden md:flex md:flex-col md:justify-between"} bg-white`}>
            {targetCatForPreview ? (
              <div className="space-y-5">
                {/* Section title */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      {isEditing ? "Chỉnh sửa Cấu hình Cấp số" : "Chi tiết Quy tắc Cấp số"}
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-bold font-mono">
                        {targetCatForPreview.code}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Cấu hình tiền tố, hậu tố và công thức sinh mã số tự động
                    </p>
                  </div>

                  {!isEditing && (
                    <button
                      onClick={() => handleStartEdit(currentSelectedCat)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer shadow-sm"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Sửa cấu hình này
                    </button>
                  )}
                </div>

                {/* Live Number Output Box */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-xl shadow-md border border-slate-700">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-semibold flex items-center gap-1 text-slate-300">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Mẫu số thực tế sẽ được cấp tự động:
                    </span>
                    <span className="font-mono text-[11px] bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      Công thức: {targetCatForPreview.formatTemplate || "{NUM}{SUFFIX}"}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                    <div className="flex-1">
                      <div className="text-[11px] text-slate-400">Số tiếp theo:</div>
                      <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 tracking-tight">
                        {nextPreview}
                      </div>
                    </div>
                    <div className="hidden sm:block border-l border-slate-800 pl-4 text-xs text-slate-400">
                      <div>Số hiện tại đã cấp: <span className="font-mono text-slate-300">{currentPreview}</span></div>
                      <div>Số kế tiếp: <span className="font-mono text-slate-300">{nextNextPreview}</span></div>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tên loại văn bản *
                      </label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={isEditing ? editingForm.name || "" : targetCatForPreview.name}
                        onChange={(e) =>
                          setEditingForm({ ...editingForm, name: e.target.value })
                        }
                        placeholder="Ví dụ: Quyết định, Công văn..."
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Mã phân loại (Viết tắt) *
                      </label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={isEditing ? editingForm.code || "" : targetCatForPreview.code}
                        onChange={(e) =>
                          setEditingForm({ ...editingForm, code: e.target.value.toUpperCase() })
                        }
                        placeholder="Ví dụ: QĐ, CV, HĐ, TTr..."
                        className="w-full px-3 py-2 text-sm font-mono font-semibold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-600"
                      />
                    </div>
                  </div>

                  {/* Prefix & Suffix Settings (Core Requirement) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-blue-50/50 rounded-xl border border-blue-200/80">
                    <div>
                      <label className="block text-xs font-bold text-blue-950 mb-1 flex items-center justify-between">
                        <span>Tiền tố mặc định (Prefix)</span>
                        <span className="text-[10px] text-blue-700 font-normal">Đứng trước số</span>
                      </label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={isEditing ? editingForm.prefix || "" : targetCatForPreview.prefix}
                        onChange={(e) =>
                          setEditingForm({ ...editingForm, prefix: e.target.value })
                        }
                        placeholder="Ví dụ: HĐ-, ĐX-, CV/ (hoặc để trống)"
                        className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-blue-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        Ví dụ: <code className="text-blue-700 font-semibold">HĐ-</code> thì sinh ra <code className="text-slate-700 font-semibold">HĐ-056</code>
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-blue-950 mb-1 flex items-center justify-between">
                        <span>Hậu tố mặc định (Suffix)</span>
                        <span className="text-[10px] text-blue-700 font-normal">Đứng sau số</span>
                      </label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={isEditing ? editingForm.suffix || "" : targetCatForPreview.suffix}
                        onChange={(e) =>
                          setEditingForm({ ...editingForm, suffix: e.target.value })
                        }
                        placeholder="Ví dụ: /QĐ-UBND, /CV-VP, /2026/VCC"
                        className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-blue-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        Ví dụ: <code className="text-blue-700 font-semibold">/QĐ-VCCORP</code> thì sinh ra <code className="text-slate-700 font-semibold">125/QĐ-VCCORP</code>
                      </p>
                    </div>
                  </div>

                  {/* Format Template */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">
                        Cấu trúc mẫu sinh số (Format Template)
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowTokenHelp(!showTokenHelp)}
                        className="text-[11px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5" /> Hướng dẫn biến số
                      </button>
                    </div>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={
                        isEditing
                          ? editingForm.formatTemplate || ""
                          : targetCatForPreview.formatTemplate
                      }
                      onChange={(e) =>
                        setEditingForm({
                          ...editingForm,
                          formatTemplate: e.target.value,
                        })
                      }
                      placeholder="{PREFIX}{NUM}{SUFFIX} hoặc {NUM}/{CODE}-{DEPT}"
                      className="w-full px-3 py-2 text-sm font-mono font-semibold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                    />

                    {/* Quick Token Helper Badges */}
                    {isEditing && (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-slate-500 font-medium mr-1">
                          Chèn nhanh:
                        </span>
                        {[
                          { token: "{NUM}", label: "Số thứ tự" },
                          { token: "{NUM_PAD3}", label: "Số 3 chữ số (001)" },
                          { token: "{PREFIX}", label: "Tiền tố" },
                          { token: "{SUFFIX}", label: "Hậu tố" },
                          { token: "{YEAR}", label: "Năm (2026)" },
                          { token: "{DEPT}", label: "Mã phòng ban" },
                          { token: "{CODE}", label: "Mã loại" },
                        ].map((t) => (
                          <button
                            key={t.token}
                            type="button"
                            onClick={() => insertToken(t.token)}
                            className="px-2 py-0.5 bg-slate-200 hover:bg-blue-100 text-slate-700 hover:text-blue-700 text-[11px] font-mono rounded cursor-pointer transition-colors"
                          >
                            + {t.token}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Token Reference Documentation */}
                  {showTokenHelp && (
                    <div className="bg-slate-100 p-3 rounded-lg text-xs text-slate-700 space-y-1.5 border border-slate-200">
                      <div className="font-bold text-slate-900">Các biến động hỗ trợ:</div>
                      <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px]">
                        <li><code className="font-mono font-bold text-blue-600">{`{NUM}`}</code>: Số thứ tự tăng dần (ví dụ: 1, 2, 125).</li>
                        <li><code className="font-mono font-bold text-blue-600">{`{NUM_PAD2}`}</code>, <code className="font-mono font-bold text-blue-600">{`{NUM_PAD3}`}</code>, <code className="font-mono font-bold text-blue-600">{`{NUM_PAD4}`}</code>: Số đệm 0 (ví dụ: 01, 001, 0001).</li>
                        <li><code className="font-mono font-bold text-blue-600">{`{YEAR}`}</code> / <code className="font-mono font-bold text-blue-600">{`{YY}`}</code>: Năm 4 chữ số (2026) hoặc 2 chữ số (26).</li>
                        <li><code className="font-mono font-bold text-blue-600">{`{DEPT}`}</code>: Mã đơn vị/phòng ban xử lý (VP, TCKT, HCNS, KD,...).</li>
                        <li><code className="font-mono font-bold text-blue-600">{`{CODE}`}</code>: Mã loại văn bản (QĐ, CV, HĐ).</li>
                        <li><code className="font-mono font-bold text-blue-600">{`{PREFIX}`}</code> / <code className="font-mono font-bold text-blue-600">{`{SUFFIX}`}</code>: Tiền tố và hậu tố đã cấu hình.</li>
                      </ul>
                    </div>
                  )}

                  {/* Counter & Department Config */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Số đếm hiện tại
                      </label>
                      <input
                        type="number"
                        min="0"
                        disabled={!isEditing}
                        value={
                          isEditing
                            ? editingForm.currentCount !== undefined
                              ? editingForm.currentCount
                              : 0
                            : targetCatForPreview.currentCount
                        }
                        onChange={(e) =>
                          setEditingForm({
                            ...editingForm,
                            currentCount: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Phòng ban mặc định
                      </label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={
                          isEditing
                            ? editingForm.defaultDepartment || ""
                            : targetCatForPreview.defaultDepartment
                        }
                        onChange={(e) =>
                          setEditingForm({
                            ...editingForm,
                            defaultDepartment: e.target.value.toUpperCase(),
                          })
                        }
                        placeholder="VP, TCKT, HCNS..."
                        className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Đệm 0 (Zero Padding)
                      </label>
                      <select
                        disabled={!isEditing}
                        value={
                          isEditing
                            ? editingForm.paddingDigits || 0
                            : targetCatForPreview.paddingDigits
                        }
                        onChange={(e) =>
                          setEditingForm({
                            ...editingForm,
                            paddingDigits: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 cursor-pointer"
                      >
                        <option value={0}>Không đệm (1, 2, 3...)</option>
                        <option value={2}>2 chữ số (01, 02...)</option>
                        <option value={3}>3 chữ số (001, 002...)</option>
                        <option value={4}>4 chữ số (0001, 0002...)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mô tả danh mục
                    </label>
                    <textarea
                      rows={2}
                      disabled={!isEditing}
                      value={
                        isEditing
                          ? editingForm.description || ""
                          : targetCatForPreview.description
                      }
                      onChange={(e) =>
                        setEditingForm({
                          ...editingForm,
                          description: e.target.value,
                        })
                      }
                      placeholder="Mục đích sử dụng của loại văn bản này..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                    />
                  </div>
                </div>

                {/* Save Buttons */}
                {isEditing && (
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="button"
                      id="btn-save-category-changes"
                      onClick={handleSaveCurrentEdit}
                      className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-4 h-4" /> Lưu cấu hình
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                Chọn một danh mục bên trái để xem và chỉnh sửa cấu hình.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Hệ thống cấp số văn bản tuân thủ chuẩn Thể thức văn bản hành chính Việt Nam.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
