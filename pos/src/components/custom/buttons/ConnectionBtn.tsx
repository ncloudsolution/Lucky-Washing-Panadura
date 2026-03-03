"use client";
import { getSyncStatus } from "@/data/queue";
import { useEffect, useState } from "react";
import { QueueBtn } from "../other/QueueBtn";

export function ConnectionBtn() {
  const [status, setStatus] = useState(getSyncStatus());

  useEffect(() => {
    const handler = (e: any) => setStatus(e.detail);
    window.addEventListener("sync-status", handler);
    return () => window.removeEventListener("sync-status", handler);
  }, []);

  function getQueueBorder() {
    if (status === "idle") return "border-superbase";
    if (status === "syncing") return "border-amber-500";
    if (status === "offline") return "border-amber-500";
    // if (status === "offline") return "border-red-500";
  }

  return (
    <div
      className={`${getQueueBorder()} flex justify-center items-center size-[44px]  md:size-[56px] aspect-square rounded-full bg-secondary border-dashed border-[3px]`}
    >
      <QueueBtn status={status} />
      {/* {status === "offline"
        ? "You’re offline. Orders will sync automatically when you’re back online."
        : "Sync paused due to network issues. Retrying shortly."} */}
    </div>
  );
}
