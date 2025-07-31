import React from "react";
import { useSettings } from "../../context/SettingsContext";
import useWindowSize from "../../hooks/useWindowSize"; // Import the hook
import clsx from "clsx";
import { X, Sun, Moon, Rows } from "lucide-react";

const SettingsSidebar = ({ isOpen, onClose }) => {
  const {
    theme,
    setTheme,
    menuPosition,
    setMenuPosition,
    layoutWidth,
    setLayoutWidth,
  } = useSettings();
  const { width } = useWindowSize(); // Use the hook to get screen width
  const isMobile = width < 1024;

  const OptionButton = ({ label, value, state, setState, icon: Icon }) => (
    <button
      onClick={() => setState(value)}
      className={clsx(
        "px-4 py-2 rounded-lg w-full transition-colors flex items-center justify-center space-x-2",
        state === value
          ? "bg-blue-600 text-white"
          : "bg-gray-100 dark:bg-gray-700"
      )}
    >
      {Icon && <Icon size={16} />}
      <span>{label}</span>
    </button>
  );

  return (
    <>
      <div
        className={clsx(
          "fixed inset-0 bg-black bg-opacity-40 z-40",
          isOpen ? "visible" : "invisible"
        )}
        onClick={onClose}
      ></div>
      <div
        className={clsx(
          "fixed top-0 right-0 h-full w-72 bg-white dark:bg-gray-800 shadow-xl z-50 transform transition-transform",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="p-4 flex justify-between items-center border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold dark:text-white">
            Sayt Sozlamalari
          </h2>
          <button onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <div className="p-6">
          <div>
            <h3 className="font-medium mb-2 dark:text-gray-300">Rejim</h3>
            <div className="grid grid-cols-1 gap-2">
              <OptionButton
                label="Yorqin"
                value="light"
                state={theme}
                setState={setTheme}
                icon={Sun}
              />
              <OptionButton
                label="Tungi"
                value="dark"
                state={theme}
                setState={setTheme}
                icon={Moon}
              />
              <OptionButton
                label="Aralash"
                value="aralash"
                state={theme}
                setState={setTheme}
                icon={Rows}
              />
            </div>
          </div>

          {/* --- MOBILE FIX: Hide these sections on mobile --- */}
          {!isMobile && (
            <>
              <div>
                <h3 className="font-medium mb-2 dark:text-gray-300">
                  Menyu joylashuvi
                </h3>
                <div className="flex space-x-2">
                  <OptionButton
                    label="Vertikal"
                    value="vertical"
                    state={menuPosition}
                    setState={setMenuPosition}
                  />
                  <OptionButton
                    label="Gorizontal"
                    value="horizontal"
                    state={menuPosition}
                    setState={setMenuPosition}
                  />
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2 dark:text-gray-300">
                  Sahifa o'lchami
                </h3>
                <div className="flex space-x-2">
                  <OptionButton
                    label="To'liq"
                    value="full"
                    state={layoutWidth}
                    setState={setLayoutWidth}
                  />
                  <OptionButton
                    label="Chegaralangan"
                    value="contained"
                    state={layoutWidth}
                    setState={setLayoutWidth}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default SettingsSidebar;
