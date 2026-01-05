"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

interface FullscreenContextProps {
  isFullscreen: boolean;
}

const FullscreenContext = createContext<FullscreenContextProps>({
  isFullscreen: false,
});

export const useFullscreen = () => useContext(FullscreenContext);

export const FullscreenProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  return (
    <FullscreenContext.Provider value={{ isFullscreen }}>
      {children}
    </FullscreenContext.Provider>
  );
};
