import React from "react";
import { Link } from "react-router-dom";
import CountUp from "react-countup";

const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  link,
  tooltip,
  areNumbersVisible,
}) => {
  return (
    // The main card container with defined sizing and layout
    <Link to={link}>
      <div
        className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm flex flex-col items-center justify-center text-center h-32" // Fixed height
        data-tooltip-id="stat-card-tooltip"
        data-tooltip-content={tooltip}
      >
        {/* The colored circle containing the icon */}
        {Icon && (
          <div
            className={`w-12 h-12 flex items-center justify-center rounded-full mb-2 flex-shrink-0 ${
              color || "bg-gray-200"
            }`}
          >
            <Icon className="text-white" size={24} strokeWidth={1.5} />
          </div>
        )}

        {/* The title text */}
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </p>

        {/* The number value (or '***') */}
        <p className="text-xl font-bold text-gray-900 dark:text-white mt-1 whitespace-nowrap">
          {areNumbersVisible ? (
            // 2. Use the CountUp component instead of just rendering the value
            <CountUp
              end={value || 0} // The number to count up to
              duration={1.5} // Animation duration in seconds
              separator=" "
            />
          ) : (
            "***"
          )}
        </p>
      </div>
    </Link>
  );
};

export default StatCard;
