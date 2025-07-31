import React, { useRef } from "react";
import Draggable from "react-draggable";

const DraggableAiButton = ({ onClick }) => {
  const nodeRef = useRef(null);

  // This component will now be rendered inside the main layout,
  // so we don't need fixed positioning here. Draggable handles it.
  return (
    // The Draggable component now controls the position.
    // We give it a high z-index to ensure it's on top of other content.
    <Draggable
      nodeRef={nodeRef}
      // The bounds are now the 'body' so it doesn't get stuck on other elements.
      // Using a class name for the handle makes the grab cursor more reliable.
      handle=".handle"
      defaultPosition={{
        x: window.innerWidth - 120,
        y: window.innerHeight - 200,
      }} // Start near bottom-right
    >
      <div
        ref={nodeRef}
        className="absolute top-0 left-0 z-30" // Use absolute positioning within the layout
      >
        <button
          onClick={onClick}
          className="handle w-16 h-16 rounded-full shadow-lg hover:scale-110 transition-transform flex items-center justify-center cursor-grab active:cursor-grabbing"
          aria-label="Open AI Assistant"
        >
          <img
            src="/happybot.png"
            alt="AI Bot"
            className="w-14 h-14 pointer-events-none"
          />
        </button>
      </div>
    </Draggable>
  );
};

export default DraggableAiButton;
