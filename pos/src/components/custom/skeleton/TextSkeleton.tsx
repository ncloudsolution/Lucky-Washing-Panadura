"use client";
import React, { useState, useEffect } from "react";

export default function TextSkeleton({
  length = 10,
  textSize = "text-sm",
  numeric = false,
  type = "muted",
}: {
  length?: number;
  textSize?: string;
  numeric?: boolean;
  type: "win" | "lost" | "muted";
}) {
  const [text, setText] = useState("");
  const chars = numeric ? "0123456789" : "abcdefghijklmnopqrstuvwxyz";
  const getRandomChar = () => {
    return chars[Math.floor(Math.random() * (numeric ? 10 : 26))];
  };

  const scrambleText = (currentText) => {
    const textArray = currentText.split("");
    const randomIndex = Math.floor(Math.random() * textArray.length);
    textArray[randomIndex] = getRandomChar();
    return textArray.join("");
  };

  useEffect(() => {
    // Initialize text based on length prop
    let initialText = "";
    for (let i = 0; i < length; i++) {
      initialText += getRandomChar();
    }
    setText(initialText);
  }, [length]);

  useEffect(() => {
    if (!text) return;

    const interval = setInterval(() => {
      setText((prevText) => scrambleText(prevText));
    }, 10);

    return () => clearInterval(interval);
  }, [text]);

  return (
    <p
      className={`${textSize} ${
        type === "muted"
          ? "text-muted-foreground"
          : type === "lost"
          ? "text-destructive"
          : "text-superbase"
      } tracking-wider break-all`}
    >
      {text ? text : numeric ? 0 : chars.slice(length)}
    </p>
  );
}
