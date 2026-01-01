"use client";

import { ReactNode } from "react";

type ModalProps = {
  isOpen: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
};

export function Modal({ isOpen, title, onClose, children }: ModalProps) {
  if (!isOpen) return null;

  const handleBackdropClick = () => {
    onClose();
  };

  const stopPropagation: React.MouseEventHandler<HTMLDivElement> = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      className="modalBackdrop"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        className="modalPanel"
        role="dialog"
        aria-modal="true"
        aria-label={title ?? "Modal"}
        onClick={stopPropagation}
      >
        {title && <div className="modalTitle">{title}</div>}
        <div className="modalBody">{children}</div>
      </div>
    </div>
  );
}
