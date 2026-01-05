"use client";

import { useEffect, useRef } from "react";

export default function Rain({ component }: { component: React.ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      // const dpr = window.devicePixelRatio || 1;
      const dpr = 5;

      // Set the display size (CSS pixels)
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;

      // Set the internal pixel resolution (real pixels)
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;

      // Scale the context to ensure crisp drawing
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();

    const fontSize = 14;
    const columns = Math.floor(window.innerWidth / fontSize);
    const characters = "0123456789";
    const drops: number[] = Array(columns)
      .fill(0)
      .map(() => Math.floor(Math.random() * -20));

    const draw = () => {
      ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

      ctx.fillStyle = "#0031cb";
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = characters.charAt(
          Math.floor(Math.random() * characters.length)
        );
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        ctx.fillText(text, x, y);

        if (y > window.innerHeight && Math.random() > 0.8) {
          drops[i] = 0;
        }

        drops[i]++;
      }
    };

    const intervalId = setInterval(draw, 25);
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center">
      {/* Mask container */}
      <div className="relative w-[250px] xs:w-[300px] md:w-[500px] h-[45dvh]  overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-screen h-screen"
        />
      </div>
      <div className="w-[250px] xs:w-[300px] md:w-[500px] flex flex-1">
        {component}
      </div>
    </div>
  );
}
