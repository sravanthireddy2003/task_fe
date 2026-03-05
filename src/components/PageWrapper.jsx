import React from "react";
import clsx from "clsx";

// Global page wrapper: enforces shared spacing, background, and layout
const PageWrapper = ({ children, className = "" }) => {
  return (
    <div
      className={clsx(
        "tm-page min-h-full w-full max-w-full mx-auto p-6 lg:p-8 xl:p-10",
        "bg-gray-50", // single global content background
        className,
      )}
    >
      {children}
    </div>
  );
};

export default PageWrapper;
