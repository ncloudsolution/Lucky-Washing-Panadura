"use client";

import { useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { processOrderQueue } from "@/data/queue";
import { cachedb } from "@/data/dbcache";

export default function QueueProcessor() {
  // live query on queue items
  const queue = useLiveQuery(() => cachedb.queue.toArray(), []);

  useEffect(() => {
    // only run if queue exists and has at least one item
    if (queue && queue.length > 0) {
      processOrderQueue();
    }
  }, [queue]); // ✅ runs automatically when queue changes

  useEffect(() => {
    // run when back online
    const handleOnline = () => {
      if (queue && queue.length > 0) processOrderQueue();
    };

    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [queue]);

  return null;
}
