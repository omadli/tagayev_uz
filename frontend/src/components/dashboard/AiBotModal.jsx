import React, { useState, useMemo, useEffect, useRef } from "react";
import clsx from "clsx";
import { X, ChevronDown } from "lucide-react";
import api from "../../services/api";
import useTypingAnimation from "../../hooks/useTypingAnimation";

// A custom dropdown component (this code is correct and needs no changes)
const CustomDropdown = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const options = [
    { value: "yesterday", label: "Kechagi kun" },
    { value: "today", label: "Bugungi kun" },
  ];
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = options.find((opt) => opt.value === value)?.label;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-40 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span>{selectedLabel}</span>
        <ChevronDown
          size={16}
          className={clsx("transition-transform", { "rotate-180": isOpen })}
        />
      </button>
      {isOpen && (
        <div className="absolute top-full mt-1 w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl z-10 border dark:border-gray-700">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// The main modal component with the full-content animation
const AiBotModal = ({ isOpen, onClose }) => {
  // State for data and UI control
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [day, setDay] = useState("yesterday");

  // A helper sub-component to render each styled stat line
  const StatLine = ({
    emoji,
    title,
    value,
    valueColor = "text-red-500",
    children,
  }) => (
    <div className="flex items-start animate-fade-in">
      <span className="mr-3 mt-1 text-xl">{emoji}</span>
      <div>
        <p className="text-gray-800 dark:text-gray-200 font-semibold">
          {title}:
          {value && (
            <span className={clsx("font-bold ml-2", valueColor)}>{value}</span>
          )}
        </p>
        {children && <div className="text-sm mt-1">{children}</div>}
      </div>
    </div>
  );

  // --- ANIMATION SCRIPT ---
  // useMemo ensures this script is only rebuilt when the stats or day change
  const contentScript = useMemo(() => {
    if (!stats) return [];

    const script = [
      <div key="title" className="flex items-center space-x-2">
        <span className="text-xl">📊</span>
        <h3 className="font-bold text-xl text-gray-800 dark:text-white">
          O'quv markazingizning {day === "yesterday" ? "kechagi" : "bugungi"}{" "}
          statistikasi
        </h3>
      </div>,
      <StatLine
        key="income"
        emoji="💰"
        title="Kirimlar"
        value={stats.income}
        valueColor="text-green-500"
      />,
      <StatLine
        key="expenses"
        emoji="💸"
        title="Chiqimlar"
        value={stats.expenses}
        valueColor="text-orange-500"
      />,
      <StatLine
        key="absent"
        emoji="👥"
        title="Kelmagan o'quvchilar"
        value={`${stats.absent_students_total} ta`}
      />,
      <StatLine
        key="attendance"
        emoji="🟣"
        title="Davomat qilinmagan"
        value={`${stats.absent_by_group.reduce(
          (acc, g) => acc + g.count,
          0
        )} ta`}
      >
        {stats.absent_by_group.map((g) => (
          <p key={g.group_name} className="text-blue-600 dark:text-blue-400">
            . {g.group_name}: {g.count} ta o'quvchi
          </p>
        ))}
      </StatLine>,
      <StatLine
        key="new_leads"
        emoji="✨"
        title="Yangi lidlar"
        value={`${stats.new_leads} ta`}
        valueColor="text-yellow-500"
      />,
      <StatLine
        key="uncontacted"
        emoji="❌"
        title="Bog'lanilmagan lidlar"
        value={`${stats.uncontacted_leads} ta`}
      />,
      <StatLine
        key="new_students"
        emoji="📥"
        title="Yangi kelgan o'quvchilar"
        value={`${stats.newly_joined_students} ta`}
        valueColor="text-blue-500"
      />,
      <StatLine
        key="left_students"
        emoji="📤"
        title="Ketgan o'quvchilar"
        value={`${stats.students_left} ta`}
        valueColor="text-gray-500"
      />,
      <div
        key="summary"
        className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg space-y-2 !mt-6"
      >
        <h4 className="font-semibold text-gray-800 dark:text-white">
          📋 Xulosa
        </h4>
        <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1 whitespace-pre-line">
          <p>{stats.summary.income_summary}</p>
          <p>{stats.summary.lead_summary}</p>
          <p>{stats.summary.admin_summary}</p>
        </div>
      </div>,
    ];
    return script;
  }, [stats, day]);

  // Use our custom hook to drive the animation
  const { visibleContent, isAnimationDone } = useTypingAnimation(
    contentScript,
    {
      speed: 180, // Slower, more deliberate speed
      isPaused: loading,
    }
  );

  // Effect to fetch data
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api
        .get(`/core/ai-daily-stats/?day=${day}`)
        .then((response) => {
          setStats(response.data);
        })
        .catch((error) => {
          console.error("Failed to fetch AI stats:", error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, day]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md md:max-w-2xl transform transition-all duration-300 flex flex-col"
      >
        <div className="p-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold dark:text-white">
            {loading ? "Yuklanmoqda..." : `Hurmatli ${stats?.greeting_name}`}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-red-500"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 pt-0 space-y-6 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <CustomDropdown value={day} onChange={setDay} />
            <img src="/happybot.png" alt="AI Bot" className="w-16 h-16" />
          </div>

          {loading ? (
            <p className="text-center py-8 text-gray-500">
              Statistika hisoblanmoqda...
            </p>
          ) : (
            // Render the animated content from our custom hook
            <div className="space-y-4 text-base">{visibleContent}</div>
          )}
        </div>

        {isAnimationDone && !loading && (
          <div className="p-4 border-t dark:border-gray-700 flex justify-end animate-fade-in">
            <button
              onClick={onClose}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold"
            >
              Tushunarli
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiBotModal;
