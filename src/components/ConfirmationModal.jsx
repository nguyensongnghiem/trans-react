import React, { useEffect, useRef } from "react";
import { XMarkIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import Button from "./Button";

/**
 * ConfirmationModal - Reusable Modal Component
 * Sử dụng Tailwind thuần, không phụ thuộc thư viện UI ngoài.
 */
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Xác nhận",
  message = "Bạn có chắc chắn muốn thực hiện hành động này?",
  confirmText = "Xác nhận",
  cancelText = "Hủy bỏ",
  variant = "danger", // danger | primary | info
  isLoading = false,
}) => {
  const modalRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Icon & Color mapping based on variant
  const config = {
    danger: {
      icon: ExclamationTriangleIcon,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      btnVariant: "danger"
    },
    primary: {
      icon: ExclamationTriangleIcon, // Hoặc icon khác tùy ý
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      btnVariant: "primary"
    }
  };

  const currentConfig = config[variant] || config.danger;
  const Icon = currentConfig.icon;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-0">
      {/* Backdrop with blur */}
      <div 
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal Panel */}
      <div 
        ref={modalRef}
        className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md border border-gray-100"
      >
        {/* Close Button Absolute */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
            <XMarkIcon className="h-5 w-5" />
        </button>

        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${currentConfig.iconBg} sm:h-10 sm:w-10`}>
              <Icon className={`h-6 w-6 ${currentConfig.iconColor}`} aria-hidden="true" />
            </div>
            <div className="mt-0.5">
              <h3 className="text-lg font-semibold leading-6 text-gray-900" id="modal-title">{title}</h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex flex-row-reverse gap-3 border-t border-gray-100">
          <Button 
            variant={currentConfig.btnVariant} 
            onClick={onConfirm} 
            isLoading={isLoading}
            className="w-full sm:w-auto"
          >
            {confirmText}
          </Button>
          <Button 
            variant="ghost" 
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {cancelText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;