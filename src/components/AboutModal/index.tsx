import { useEffect } from "react";
import "./AboutModal.css";

export interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps): JSX.Element {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return <></>;
  }

  return (
    <>
      <div className="about-modal__overlay" onClick={onClose}>
        <div className="about-modal" onClick={(e) => e.stopPropagation()}>
          <button
            className="about-modal__close"
            onClick={onClose}
            aria-label="Close"
            type="button"
          >
            ×
          </button>
          <div className="about-modal__content">
            <h2 className="about-modal__title">Why I Built This</h2>
            <p className="about-modal__text">
              Bangalore Metro keeps getting bigger and more confusing with every
              new line they add! Figuring out where to change trains and which
              direction to go started feeling like a puzzle I didn’t sign up
              for. So, I built this little helper to make navigating the metro
              way easier (and save myself a few headaches along the way).
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
