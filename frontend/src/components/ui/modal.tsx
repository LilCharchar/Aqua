import React from "react";

type ModalProps = {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    width?: string;
};

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    width = "max-w-2xl",
}) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className={`bg-[var(--secondary)] text-[var(--text-primary)] rounded-3xl shadow-lg w-[90%] ${width} relative p-8 animate-fadeIn`}>
                {/*Headder*/}
                <div className="flex justify-center items-center mb-6">
                    <h2 className="text-2xl manrope-bold">{title}</h2>
                </div>
                {/*Contenido del modal*/}
                <div className="max-h-[70vh] overflow-y-auto">{children}</div>
            </div>
        </div>
    );
};

export default Modal;