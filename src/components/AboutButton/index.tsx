import { useState } from "react";

import { AboutModal } from "../AboutModal";
import "./AboutButton.css";

export function AboutButton(): JSX.Element {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        className="about-button"
        onClick={() => setIsModalOpen(true)}
        aria-label="About this app"
        type="button"
      >
        <span className="about-button__icon">?</span>
        <span className="about-button__text">Why I built this</span>
      </button>
      <AboutModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
