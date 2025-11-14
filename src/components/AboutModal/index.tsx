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

  const handleOverlayKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <>
      <div
        className="about-modal__overlay"
        onClick={onClose}
        onKeyDown={handleOverlayKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Close modal"
      >
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events */}
        <div
          className="about-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="about-modal-title"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <button
            className="about-modal__close"
            onClick={onClose}
            aria-label="Close"
            type="button"
          >
            <span className="about-modal__close-icon">×</span>
          </button>
          <div className="about-modal__content">
            <h2 id="about-modal-title" className="about-modal__title">
              Why I Built This
            </h2>
            <p className="about-modal__text">
              Bangalore Metro keeps getting bigger and more confusing with every
              new line they add. Half the time I’m standing on the platform
              thinking, “Ayyo, which side now da?!” and figuring out
              interchanges feels like getting lost in KR Market on a Sunday
              morning. All I wanted was a simple ride, not a full brain workout.
              After one too many wrong platforms and unnecessary train rides, I
              finally gave up and built this little helper. Now the whole metro
              journey is easy peasy, no more guessing, no more running around
              like a headless chicken. Happy commuting!
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
