import React from "react";
import { Controller } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import clsx from "clsx";

const NumberInput = ({
  control,
  name,
  label,
  error,
  suffix = "",
  thousandSeparator = " ",
  ...props
}) => {
  return (
    <div className="relative">
      <Controller
        name={name}
        control={control}
        render={({ field: { onChange, onBlur, value, name, ref } }) => (
          <NumericFormat
            getInputRef={ref}
            id={name}
            name={name}
            value={value}
            onValueChange={(values) => {
              // We pass the numeric float value up to react-hook-form
              onChange(values.floatValue);
            }}
            onBlur={onBlur}
            // --- FORMATTING PROPS ---
            thousandSeparator={thousandSeparator}
            suffix={suffix}
            allowNegative={false}
            decimalScale={2}
            // --- STYLING (matches our Input component) ---
            className={clsx(
              "block px-3 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent rounded-lg border appearance-none dark:text-white focus:outline-none focus:ring-0 peer",
              error
                ? "border-red-600 dark:border-red-500"
                : "border-gray-300 dark:border-gray-600 focus:border-blue-600"
            )}
            placeholder=" " // For floating label
            {...props}
          />
        )}
      />
      <label
        htmlFor={name}
        className={clsx(
          "absolute text-sm duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white dark:bg-gray-800 px-2 peer-focus:px-2 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 start-1",
          error
            ? "text-red-600 dark:text-red-500"
            : "text-gray-500 peer-focus:text-blue-600"
        )}
      >
        {label}
      </label>
      {error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-500">
          {error.message}
        </p>
      )}
    </div>
  );
};

export default NumberInput;
