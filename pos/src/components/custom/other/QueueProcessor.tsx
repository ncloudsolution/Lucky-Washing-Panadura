"use client";

import { useEffect } from "react";
import { processOrderQueue } from "@/data/queue";

export default function QueueProcessor() {
  useEffect(() => {
    // run once on load
    processOrderQueue();

    // run when back online
    const handleOnline = () => {
      processOrderQueue();
    };

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return null; // 👈 no UI
}
