import React from "react";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: string;
  closeOnBackdrop?: boolean;
  contentClassName?: string;
};

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  width = "max-w-2xl",
  closeOnBackdrop = true,
  contentClassName = "",
}) => {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={closeOnBackdrop ? onClose : undefined}
      role="presentation"
    >
      <div
        className={`bg-[var(--secondary)] text-[var(--text-primary)] rounded-3xl shadow-lg w-[90%] ${width} relative p-8 animate-fadeIn`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex justify-center items-center mb-6">
          <h2 className="text-2xl manrope-bold">{title}</h2>
        </div>
        <div className={`max-h-[70vh] overflow-y-auto ${contentClassName}`}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
