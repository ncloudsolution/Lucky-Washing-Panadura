import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

const ListSkeleton = ({
  length = 8,
  height = 82,
}: {
  length?: number;
  height?: number;
}) => {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: length }, (_, index) => (
        <Skeleton
          key={index}
          style={{ height: height }}
          className={`w-full rounded-md bg-gray-200`}
        />
      ))}
    </div>
  );
};

export default ListSkeleton;
