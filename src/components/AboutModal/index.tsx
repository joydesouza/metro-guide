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
            <span className="about-modal__close-icon">×</span>
          </button>
          <div className="about-modal__content">
            <h2 className="about-modal__title">Why I Built This</h2>
            <p className="about-modal__text">
              Maga this Bangalore Metro keeps getting bigger and more confusing
              with every new line they add. Half the time I’m standing on the
              platform thinking, “Ayyo, which side now da?!” and figuring out
              interchanges feels like walking through KR Market on a Sunday
              morning with zero clue where anything is. All I wanted was a
              simple ride, not a full brain workout before my morning kesari
              bath. After one too many wrong platforms and unnecessary train
              rides, I finally gave up and built this little helper. Now the
              whole metro journey is easy peasy, no more guessing, no more
              running around like a headless chicken, just smooth, swalpa
              tension free travel.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
