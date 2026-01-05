import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

const OrderSheetSkeleton = () => {
  return (
    <div className="flex flex-col px-4 gap-5">
      <Skeleton className="h-15 w-[150px] rounded-sm mt-2" />

      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-[100px] rounded-sm" />
        <Skeleton className="h-6 w-[150px] rounded-sm" />
      </div>

      <div className="flex flex-col">
        {Array.from({ length: 3 }, (_, index) => (
          <div className="flex flex-col gap-2 py-4" key={index}>
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton className="h-5 w-full rounded-sm" key={index} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderSheetSkeleton;
