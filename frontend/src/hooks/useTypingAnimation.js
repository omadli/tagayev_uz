import { useState, useEffect } from "react";

const useTypingAnimation = (contentScript = [], options = {}) => {
  const { speed = 80, isPaused = false } = options;
  const [visibleContent, setVisibleContent] = useState([]);
  const [isAnimationDone, setIsAnimationDone] = useState(false);

  useEffect(() => {
    // Reset if the script is empty or animation is paused
    if (isPaused || contentScript.length === 0) {
      return;
    }

    // Start with a clean slate
    setVisibleContent([]);
    setIsAnimationDone(false);

    let index = 0;
    const interval = setInterval(() => {
      if (index < contentScript.length) {
        // Add the next piece of content to the visible array
        setVisibleContent((prev) => [...prev, contentScript[index]]);
        index++;
      } else {
        // We're done, clear the interval and set the flag
        clearInterval(interval);
        setIsAnimationDone(true);
      }
    }, speed); // Use the speed from options

    // Cleanup function to clear interval on unmount
    return () => clearInterval(interval);
  }, [contentScript, speed, isPaused]); // Re-run effect if the script or speed changes

  return { visibleContent, isAnimationDone };
};

export default useTypingAnimation;
