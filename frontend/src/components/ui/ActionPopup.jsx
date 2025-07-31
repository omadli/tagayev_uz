import React, { useEffect } from "react";
import { X } from "lucide-react";
import clsx from "clsx";
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useClick,
  useDismiss,
  useInteractions,
  useRole,
} from "@floating-ui/react-dom-interactions";

const ActionPopup = ({
  title,
  actions = [],
  isOpen,
  onClose,
  referenceElement,
}) => {
  // --- THIS IS THE DEFINITIVE FIX ---
  // The useFloating hook now gets its 'open' state directly from the props.
  // The onOpenChange function is now linked directly to the onClose prop.
  const { x, y, reference, floating, strategy, context } = useFloating({
    open: isOpen,
    onOpenChange: (open) => {
      if (!open) onClose();
    }, // Call onClose when the hook wants to close
    strategy: "fixed",
    whileElementsMounted: autoUpdate,
    middleware: [offset(10), flip(), shift({ padding: 2 })],
  });

  // Interaction hooks (no changes needed here)
  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);

  // Connect the reference prop to the button element from the parent
  useEffect(() => {
    if (referenceElement) {
      reference(referenceElement);
    }
  }, [reference, referenceElement]);

  const handleActionClick = (actionFunc) => {
    if (actionFunc) actionFunc();
    onClose(); // Call the onClose prop after an action
  };

  // --- The JSX ---
  return (
    <>
      {/* The invisible trigger element that opens the popup */}
      {referenceElement && (
        <div
          ref={reference}
          className="fixed"
          style={{
            top: referenceElement.getBoundingClientRect().top,
            left: referenceElement.getBoundingClientRect().left,
            width: referenceElement.getBoundingClientRect().width,
            height: referenceElement.getBoundingClientRect().height,
          }}
          {...getReferenceProps()}
        ></div>
      )}

      {/* The actual floating popup window, rendered based on the isOpen prop */}
      {isOpen && (
        <div
          ref={floating}
          style={{ position: strategy, top: y ?? "", left: x ?? "" }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl z-50 border dark:border-gray-700 w-64 animate-fade-in-down"
          {...getFloatingProps()}
        >
          <div className="flex items-center justify-between p-3 border-b dark:border-gray-700">
            <p className="font-bold text-sm truncate">{title}</p>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X size={18} />
            </button>
          </div>
          <div className="p-2">
            {actions.map((action, index) => {
              if (action.isSeparator) {
                return <hr key={index} className="my-1 dark:border-gray-700" />;
              }
              return (
                <button
                  key={action.label}
                  onClick={() => handleActionClick(action.onClick)}
                  disabled={action.disabled}
                  className={clsx(
                    "flex items-center w-full px-3 py-2 text-sm text-left rounded-md",
                    action.className,
                    "hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                >
                  {action.icon && (
                    <action.icon size={16} className="mr-3 flex-shrink-0" />
                  )}
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default ActionPopup;
