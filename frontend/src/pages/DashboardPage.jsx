import React, { useState, useEffect } from "react";
import clsx from "clsx";
import { useSettings } from "../context/SettingsContext";
import api from "../services/api";
import toast from "react-hot-toast";
import StatCard from "../components/dashboard/StatCard";
import { Eye, EyeOff } from "lucide-react";
import { statsMapping } from "../data/statsMapping";

const DashboardPage = () => {
  // State for layout, data, and visibility
  const { layoutWidth } = useSettings();
  const [stats, setStats] = useState(null);
  const [areNumbersVisible, setAreNumbersVisible] = useState(true);

  // Fetch stats data from the backend
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/core/dashboard-stats/");
        setStats(response.data);
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
        toast.error("Statistika yuklanmadi.");
      }
    };
    fetchStats();
  }, []);

  return (
    // The main container that respects the "Chegaralangan" setting
    <div
      className={clsx("w-full", {
        "max-w-screen-2xl mx-auto": layoutWidth === "contained",
      })}
    >
      <div className="space-y-8">
        {/* Top button to hide/show numbers */}
        <div className="flex items-center justify-end">
          <button
            onClick={() => setAreNumbersVisible((prev) => !prev)}
            className="bg-white dark:bg-gray-700 border dark:border-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center space-x-2"
          >
            {areNumbersVisible ? <EyeOff size={18} /> : <Eye size={18} />}
            <span>
              {areNumbersVisible
                ? "Raqamlarni yopish"
                : "Raqamlarni ko'rsatish"}
            </span>
          </button>
        </div>

        {/* --- THE DEFINITIVE RESPONSIVE GRID FIX --- */}
        {/* This grid now works because the cards have a fixed height and won't stretch. */}
        {/* Default (Mobile < 640px): 2 columns */}
        {/* Small screens (sm >= 640px): 3 columns */}
        {/* Large screens (lg >= 1024px): 9 columns (which creates a single row) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-4">
          {stats
            ? // No extra wrapper div is needed here
              statsMapping.map((stat) => (
                <StatCard
                  key={stat.key}
                  title={stat.title}
                  value={stats[stat.key]}
                  icon={stat.icon}
                  color={stat.color}
                  tooltip={stat.tooltip}
                  areNumbersVisible={areNumbersVisible}
                />
              ))
            : // Show skeleton loaders while data is fetching
              Array.from({ length: 9 }).map((_, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm h-32 animate-pulse"
                ></div>
              ))}
        </div>

        {/* Timetable Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">
            Harakatlar jadvali
          </h2>
          <div className="h-96 w-full flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-md">
            <p className="text-gray-400">Timetable Placeholder</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
