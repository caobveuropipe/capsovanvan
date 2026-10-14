import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Plus, X, Check } from "lucide-react";

export interface SearchableComboboxProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
  uppercase?: boolean;
  onAddNewOption: (newOption: string) => void;
  modalTitle?: string;
  modalPlaceholder?: string;
  modalDescription?: string;
  required?: boolean;
}

export const SearchableCombobox: React.FC<SearchableComboboxProps> = ({
  id,
  label,
  value,
  onChange,
  options = [],
  placeholder = "Chọn hoặc gõ tự do...",
  className = "",
  uppercase = false,
  onAddNewOption,
  modalTitle = "Thêm mục mới",
  modalPlaceholder = "Nhập nội dung mới...",
  modalDescription,
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newOptionValue, setNewOptionValue] = useState("");
  const [addError, setAddError] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalInputRef = useRef<HTMLInputElement>(null);

  // Lọc options dựa trên giá trị người dùng đang gõ
  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes((value || "").trim().toLowerCase())
  );

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Autofocus input khi mở modal thêm mới
  useEffect(() => {
    if (isAddModalOpen) {
      setNewOptionValue("");
      setAddError("");
      setTimeout(() => {
        modalInputRef.current?.focus();
      }, 100);
    }
  }, [isAddModalOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (uppercase) val = val.toUpperCase();
    onChange(val);
    if (!isOpen) setIsOpen(true);
  };

  const handleSelectOption = (opt: string) => {
    onChange(opt);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleOpenAddModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
    setIsAddModalOpen(true);
  };

  const handleSaveNewOption = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = (uppercase ? newOptionValue.toUpperCase() : newOptionValue).trim();
    if (!trimmed) {
      setAddError("Vui lòng nhập nội dung.");
      modalInputRef.current?.focus();
      return;
    }

    // Thêm vào danh sách và tự động gán giá trị
    onAddNewOption(trimmed);
    onChange(trimmed);
    setIsAddModalOpen(false);
    setNewOptionValue("");
    inputRef.current?.focus();
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setNewOptionValue("");
    setAddError("");
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 mb-1">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="flex items-center gap-1.5">
        {/* Input box với dropdown trigger */}
        <div className="relative flex-1">
          <input
            id={id}
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className={`w-full pl-3 pr-8 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all ${
              uppercase ? "font-mono" : ""
            }`}
          />

          {/* Icon mở dropdown */}
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setIsOpen((prev) => !prev)}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
            title="Xem danh sách gợi ý"
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isOpen ? "rotate-180 text-blue-600" : ""
              }`}
            />
          </button>

          {/* Menu dropdown gợi ý */}
          {isOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt, idx) => {
                  const isSelected = opt.toLowerCase() === (value || "").trim().toLowerCase();
                  return (
                    <button
                      key={idx}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault(); // Tránh làm mất focus input trước khi select
                        handleSelectOption(opt);
                      }}
                      className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-blue-50 hover:text-blue-700 transition-colors ${
                        isSelected ? "bg-blue-50/80 font-bold text-blue-700" : "text-slate-700"
                      }`}
                    >
                      <span className="truncate pr-2">{opt}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-2 text-center text-xs text-slate-400">
                  {options.length === 0 ? (
                    <div>
                      <span>Chưa có mục nào trong danh sách.</span>
                      <div className="mt-1">
                        <button
                          type="button"
                          onMouseDown={handleOpenAddModal}
                          className="text-blue-600 hover:underline font-semibold"
                        >
                          + Bấm vào đây để thêm mới
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <span>Không có kết quả khớp với &ldquo;{value}&rdquo;</span>
                      <div className="mt-1 text-[11px] text-slate-500">
                        (Bạn vẫn có thể dùng giá trị này hoặc bấm nút &ldquo;+&rdquo; để lưu vào danh sách)
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Nút dấu + thêm nhanh mục mới */}
        <button
          type="button"
          onClick={handleOpenAddModal}
          title={`Thêm mới vào danh sách ${label || ""}`}
          className="shrink-0 p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-blue-50 hover:border-blue-400 text-slate-600 hover:text-blue-600 transition-colors shadow-xs active:scale-95"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Popup / Modal thêm mục mới */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-800">{modalTitle}</h3>
              </div>
              <button
                type="button"
                onClick={handleCloseAddModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSaveNewOption} className="p-5 space-y-3">
              {modalDescription && (
                <p className="text-xs text-slate-500">{modalDescription}</p>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Giá trị mới <span className="text-rose-500">*</span>
                </label>
                <input
                  ref={modalInputRef}
                  type="text"
                  value={newOptionValue}
                  onChange={(e) => {
                    setNewOptionValue(e.target.value);
                    if (addError) setAddError("");
                  }}
                  placeholder={modalPlaceholder}
                  className={`w-full px-3 py-2 text-xs rounded-xl border ${
                    addError ? "border-rose-400 ring-1 ring-rose-300" : "border-slate-300"
                  } focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all ${
                    uppercase ? "font-mono" : ""
                  }`}
                />
                {addError && <p className="text-[11px] text-rose-500 mt-1">{addError}</p>}
              </div>

              {/* Footer */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseAddModal}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Hủy (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow transition-all active:scale-95"
                >
                  Lưu & Áp dụng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
