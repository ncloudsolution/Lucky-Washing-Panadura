"use client";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { TipWrapper } from "../wrapper/TipWrapper";
import { useLiveQuery } from "dexie-react-hooks";
import { cachedb } from "@/data/dbcache";
import { formatDate } from "@/utils/common";
import { toast } from "sonner";

export function QueueBtn() {
  const [popoverOpen, setPopoverOpen] = useState(false);

  const queue = useLiveQuery(() => cachedb.queue.toArray(), []);
  const len = queue?.length as number;
  //   const len: number = 10;

  //   function getQueueToast(len: number) {
  //     if (len <= 3) {
  //       return { message: "Connection stable", type: "success" };
  //     }
  //     if (len <= 7) {
  //       return { message: "Connection weak, please monitor", type: "warning" };
  //     }
  //     return {
  //       message: "Connection unstable, please take action",
  //       type: "error",
  //     };
  //   }

  function getQueueBorder(len: number) {
    if (len === 0) return "border-superbase";
    if (len === 1) return "border-gray-300";
    if (len === 2) return "border-gray-500";
    if (len === 3) return "border-gray-800";

    if (len === 4) return "border-amber-300";
    if (len === 5) return "border-amber-500";
    if (len === 6) return "border-amber-600";
    if (len === 7) return "border-amber-700";

    if (len === 8) return "border-red-400";
    if (len === 9) return "border-red-500";
    return "border-red-600";
  }

  //   useEffect(() => {
  //     const toastInfo = queue ? getQueueToast(len) : null;

  //     if (toastInfo) {
  //       toast[toastInfo.type](toastInfo.message);
  //       // toast.success / toast.warning / toast.error
  //     }
  //   }, [queue]);

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <TipWrapper triggerText="Queue">
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={` ${getQueueBorder(len)} cursor-pointer text-lg font-semibold flex items-center justify-center leading-none size-[34px] md:size-[42px] rounded-full bg-secondary border-dashed border-[3px] shadow-md`}
          >
            {len}
          </Button>
        </PopoverTrigger>
      </TipWrapper>
      <PopoverContent className="xs:w-80 w-70" align="center">
        <div className="grid gap-3">
          <div className="space-y-1">
            <h4 className="font-medium text-[18px] leading-none">
              Queue Details
            </h4>
            <p className="text-sm text-muted-foreground">
              Populated from your last update.
            </p>
          </div>

          <div className="flex flex-col w-full">
            {queue && len > 0 ? (
              <>
                {queue?.map((q, index) => {
                  const [date, time] = formatDate(q.createdAt.toLocaleString());
                  const edit = q.edit;
                  return (
                    <div key={index} className="flex justify-between">
                      <div
                        className={edit ? "text-amber-600" : "text-superbase"}
                      >
                        {edit ? "EDIT" : "CREATE"}
                      </div>
                      <div className="flex gap-3 text-muted-foreground">
                        <span className="font-semibold">{date}</span>
                        <span>{time}</span>
                      </div>
                    </div>
                  );
                })}

                <div
                  className={`w-full text-center py-2 font-semibold text-sm ${len > 7 ? "text-destructive" : len > 3 ? "text-amber-600" : "text-superbase"} `}
                >
                  {len > 7
                    ? "Connection unstable, please take action"
                    : len > 3
                      ? "Connection weak, please monitor"
                      : "Connection stable"}
                </div>
              </>
            ) : (
              <div className="text-muted-foreground text-sm text-center py-4">
                ------ Queue is empty ------
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
