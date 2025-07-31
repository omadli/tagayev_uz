import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
} from "react";
import { toast } from "react-hot-toast";
import api from "../services/api";

const SettingsContext = createContext();
export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const getInitialState = (key, defaultValue) => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch (error) {
      console.warn(
        `Error parsing localStorage key "${key}". Corrupted data will be removed.`,
        error
      );
      localStorage.removeItem(key);
      return defaultValue;
    }
  };

  const [theme, setTheme] = useState(() => getInitialState("theme", "light"));
  const [menuPosition, setMenuPosition] = useState(() =>
    getInitialState("menuPosition", "vertical")
  );
  const [layoutWidth, setLayoutWidth] = useState(() =>
    getInitialState("layoutWidth", "full")
  );
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(() =>
    getInitialState("selectedBranchId", null)
  );
  const [branchesLoading, setBranchesLoading] = useState(true);

  const hasFetchedBranches = useRef(false);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark", "aralash");
    root.classList.add(theme);
    localStorage.setItem("theme", JSON.stringify(theme));
  }, [theme]);

  useEffect(() => {
    if (hasFetchedBranches.current) {
      return;
    }

    api
      .get("/core/branches/")
      .then((res) => {
        const fetchedBranches = res.data;
        setBranches(fetchedBranches);
        const currentBranchIsValid = fetchedBranches.some(
          (b) => b.id === selectedBranchId
        );
        if (
          (!selectedBranchId || !currentBranchIsValid) &&
          fetchedBranches.length > 0
        ) {
          const defaultBranchId = fetchedBranches[0].id;
          setSelectedBranchId(defaultBranchId);
        }
        hasFetchedBranches.current = true;
      })
      .catch((error) => {
        console.error("Failed to fetch branches for context", error);
        toast.error("Filiallarni yuklab bo'lmadi.");
      })
      .finally(() => {
        setBranchesLoading(false);
      });
  }, [selectedBranchId]);

  useEffect(() => {
    if (selectedBranchId) {
      localStorage.setItem(
        "selectedBranchId",
        JSON.stringify(selectedBranchId)
      );
    }
  }, [selectedBranchId]);

  useEffect(() => {
    localStorage.setItem("menuPosition", JSON.stringify(menuPosition));
  }, [menuPosition]);

  useEffect(() => {
    localStorage.setItem("layoutWidth", JSON.stringify(layoutWidth));
  }, [layoutWidth]);

  const value = {
    theme,
    setTheme,
    menuPosition,
    setMenuPosition,
    layoutWidth,
    setLayoutWidth,
    branches,
    selectedBranchId,
    setSelectedBranchId,
    branchesLoading,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
