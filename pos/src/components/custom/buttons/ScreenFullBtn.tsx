"use client";
import { Maximize, Minimize } from "lucide-react";
import React, { useEffect, useState } from "react";
import { TipWrapper } from "../wrapper/TipWrapper";

const ScreenFullBtn = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const root = document.getElementById("root");
    if (!root) return;

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullScreen = () => {
    const root = document.getElementById("root");
    if (!root) return;

    if (!document.fullscreenElement) {
      root.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <TipWrapper triggerText={`Fullscreen ${isFullscreen ? "Off" : "On"}`}>
      {isFullscreen ? (
        <Minimize
          onClick={toggleFullScreen}
          className="bg-superbase text-white p-2 rounded-sm size-8 md:size-9 cursor-pointer"
        />
      ) : (
        <Maximize
          onClick={toggleFullScreen}
          className="bg-superbase text-white p-2 rounded-sm size-8 md:size-9 cursor-pointer"
        />
      )}
    </TipWrapper>
  );
};

export default ScreenFullBtn;
