import React, { useState, useEffect } from "react";
import { FiArrowUp } from "react-icons/fi";
import clsx from "clsx";

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  return (
    <button
      onClick={scrollToTop}
      className={clsx(
        "bg-indigo-500 text-white p-3 rounded-full shadow-lg hover:bg-indigo-600 transition-all fixed bottom-20 right-6 z-40",
        { "opacity-100 translate-y-0": isVisible },
        { "opacity-0 translate-y-5": !isVisible }
      )}
      aria-label="Scroll to top"
    >
      <FiArrowUp size={20} />
    </button>
  );
};

export default ScrollToTopButton;
