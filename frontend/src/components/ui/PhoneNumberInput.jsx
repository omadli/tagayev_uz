import React from "react";
import { Controller } from "react-hook-form";
import { PatternFormat } from "react-number-format";
import clsx from "clsx";

const PhoneNumberInput = ({ control, name, label, error }) => {
  return (
    <div className="relative h-[50px]">
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div className="relative flex items-center">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-900 dark:text-white pb-2.5 pt-4">
              +998
            </span>
            <PatternFormat
              {...field}
              id={name}
              format="(##) ###-##-##"
              mask="_"
              allowEmptyFormatting
              className={clsx(
                // --- STYLING ---
                "pl-14 block px-3 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent rounded-lg border appearance-none dark:text-white focus:outline-none focus:ring-0 peer",
                error
                  ? "border-red-600 dark:border-red-500 focus:border-red-600"
                  : "border-gray-300 dark:border-gray-600 focus:border-blue-600"
              )}
              placeholder=" " // Crucial for floating label
            />
            <label
              htmlFor={name}
              className={clsx(
                "absolute text-sm duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white dark:bg-gray-800 px-2 peer-focus:px-2 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 start-1",
                error
                  ? "text-red-600 dark:text-red-500"
                  : "text-gray-500 dark:text-gray-400 peer-focus:text-blue-600"
              )}
            >
              {label}
            </label>
          </div>
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

export default PhoneNumberInput;
