import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const Portal = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // This is the cleanup function that will be called when the component is unmounted
    return () => setMounted(false);
  }, []);

  // Only render the portal if the component is mounted on the client side
  // This prevents errors during server-side rendering (if you ever add it)
  return mounted
    ? createPortal(children, document.querySelector("#modal-root"))
    : null;
};

export default Portal;
