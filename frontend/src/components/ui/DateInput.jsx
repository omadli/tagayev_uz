import React, { useState, forwardRef } from "react";
import { Controller } from "react-hook-form";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar } from "lucide-react";
import clsx from "clsx";

// A custom input component specifically for the DatePicker
// We use forwardRef to pass the ref from DatePicker down to our button
const CustomDateInput = forwardRef(({ value, onClick, error, label }, ref) => (
  <button
    type="button"
    onClick={onClick}
    ref={ref}
    className="relative w-full text-left"
  >
    {/* --- THIS IS THE HEIGHT FIX --- */}
    {/* We add h-[50px] to match the height of our standard Input component */}
    <div
      className={clsx(
        "h-[50px] flex items-center px-3 pt-2 w-full text-sm text-gray-900 bg-transparent rounded-lg border appearance-none dark:text-white focus:outline-none focus:ring-0",
        error
          ? "border-red-600 dark:border-red-500"
          : "border-gray-300 dark:border-gray-600"
      )}
    >
      {/* The value is now inside a span for better control */}
      <span>{value || ""}</span>
    </div>

    {/* The floating label logic needs a slight adjustment for the new structure */}
    <label
      className={clsx(
        "absolute text-sm duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white dark:bg-gray-800 px-2 start-1",
        error
          ? "text-red-600 dark:text-red-500"
          : "text-gray-500 dark:text-gray-400",
        // If there's a value, always float the label up
        value
          ? "scale-75 -translate-y-4 top-2"
          : "scale-100 -translate-y-1/2 top-1/2"
      )}
    >
      {label}
    </label>
    <Calendar
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      size={20}
    />
  </button>
));

const DateInput = ({ control, name, label, error }) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  return (
    // The z-index logic for the popup remains the same
    <div className={clsx("relative w-full", isCalendarOpen ? "z-20" : "z-0")}>
      <Controller
        name={name}
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <DatePicker
            selected={value}
            onChange={onChange}
            onBlur={onBlur}
            dateFormat="dd/MM/yyyy"
            locale="uz"
            onCalendarOpen={() => setIsCalendarOpen(true)}
            onCalendarClose={() => setIsCalendarOpen(false)}
            showYearDropdown
            scrollableYearDropdown
            yearDropdownItemNumber={15}
            wrapperClassName="w-full"
            // Pass the formatted date value to our custom input
            customInput={
              <CustomDateInput
                value={value ? value.toLocaleDateString("en-GB") : ""}
                error={error}
                label={label}
              />
            }
          />
        )}
      />
      {error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-500">
          {error.message}
        </p>
      )}
    </div>
  );
};

export default DateInput;
