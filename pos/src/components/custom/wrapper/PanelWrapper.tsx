"use client";
import React from "react";

const PanelWrapper = ({ children }: { children: React.ReactNode }) => {
  // const { open } = useSidebar();
  return (
    <div
      className={`w-full bg-sidebar border border-sidebar-border flex flex-1 h-full rounded-md shadow-2xs p-4`}
    >
      {children}
    </div>
  );
};

export default PanelWrapper;
