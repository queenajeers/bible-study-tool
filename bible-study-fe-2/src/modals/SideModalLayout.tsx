// components/SideModal.tsx
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type SideModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export const SideModalLayout: React.FC<SideModalProps> = ({
  isOpen,
  onClose,
  children,
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const timer = setTimeout(() => setIsAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      document.body.style.overflow = "unset";
      setIsAnimating(false);
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalRoot = document.getElementById("modals");
  if (!modalRoot) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/10 transition-opacity duration-300 z-40 ${
          isAnimating ? "bg-opacity-50" : "bg-opacity-0"
        } ${isMobile ? "" : "md:bg-opacity-20"}`}
        onClick={onClose}
      />

      {/* Side Panel */}
      <div
        className={`fixed z-50 bg-white shadow-2xl ${
          isMobile
            ? `top-0 bottom-0 left-0 right-0 rounded-none h-screen transition-all duration-300 ease-out ${
                isAnimating
                  ? "translate-y-0 opacity-100 scale-100"
                  : "translate-y-8 opacity-0 scale-95"
              }`
            : `top-0 right-0 h-full w-full max-w-md transition-all duration-300 ease-out ${
                isAnimating
                  ? "translate-x-0 opacity-100 scale-100"
                  : "translate-x-4 opacity-0 scale-95"
              }`
        }
`}
        style={{
          transformOrigin: isMobile ? "center bottom" : "right center",
        }}
      >
        {children}
      </div>
    </>,
    modalRoot
  );
};
