import React, { forwardRef } from "react";
import clsx from "clsx";

const Input = forwardRef(({ label, id, error, className, ...props }, ref) => {
  return (
    <div className="relative ">
      <input
        ref={ref}
        id={id}
        className={clsx(
          "block px-3 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent rounded-lg border appearance-none dark:text-white focus:outline-none focus:ring-0 peer",
          error
            ? "border-red-600 dark:border-red-500 focus:border-red-600 dark:focus:border-red-500"
            : "border-gray-300 dark:border-gray-600 focus:border-blue-600 dark:focus:border-blue-500",
          className
        )}
        placeholder=" " // This space is crucial for the floating label effect
        {...props}
      />
      <label
        htmlFor={id}
        className={clsx(
          "absolute text-sm duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white dark:bg-gray-800 px-2 peer-focus:px-2 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1",
          error
            ? "text-red-600 dark:text-red-500"
            : "text-gray-500 dark:text-gray-400 peer-focus:text-blue-600 peer-focus:dark:text-blue-500"
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
});

export default Input;
