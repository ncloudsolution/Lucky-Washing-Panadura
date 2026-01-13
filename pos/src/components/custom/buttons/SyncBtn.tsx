"use client";
import React, { useState } from "react";
import { TipWrapper } from "../wrapper/TipWrapper";
import { RefreshCcw } from "lucide-react";
import { syncCacheProducts } from "@/data/dbcache";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

const SyncBtn = () => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const sync = async () => {
    setLoading(true);

    // Wait for both the sync process and a 1-second delay
    await Promise.all([
      syncCacheProducts(queryClient),
      new Promise((resolve) => setTimeout(resolve, 1000)), // 👈 ensures at least 1s visible
    ]);

    setLoading(false);
  };

  return (
    <TipWrapper triggerText="Products Sync">
      <Button
        onClick={sync}
        disabled={loading}
        className="bg-superbase hover:bg-superbase text-white rounded-sm size-8 md:size-9 cursor-pointer"
      >
        <RefreshCcw
          className={`${
            loading && "pointer-events-none opacity-50 animate-spin"
          } size-4 md:size-5`}
        />
      </Button>
    </TipWrapper>
  );
};

export default SyncBtn;
