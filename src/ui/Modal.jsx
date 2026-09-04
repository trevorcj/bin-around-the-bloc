import { useEffect } from "react";
import { X } from "lucide-react";

function Modal({ isOpen, onClose, children, title }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[999] bg-black/50"
        onClick={onClose}
        role="presentation"
      />

      {/* Modal */}
      <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[1000] flex items-center justify-center p-4">
        <div
          className="w-full max-w-2xl rounded-lg bg-white shadow-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="sticky top-0 flex items-center justify-between border-b border-brand-accent/10 bg-white px-6 py-4">
            <h2 className="text-xl font-semibold text-brand-accent">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-sm text-brand-accent/55 transition-colors hover:bg-brand-accent/4 hover:text-brand-accent"
              aria-label="Close modal">
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">{children}</div>
        </div>
      </div>
    </>
  );
}

export default Modal;
