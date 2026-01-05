import { Skeleton } from "@/components/ui/skeleton";
import React from "react";
import { LoaderCircle } from "lucide-react";
import { LoaderBtn } from "../buttons/LoaderBtn";

const ProductTileSkeleton = () => {
  return (
    <Skeleton className="flex size-[150px] justify-center items-center rounded-md shadow-lg bg-gray-200">
      <LoaderBtn />
    </Skeleton>
  );
};

export default ProductTileSkeleton;

// flex flex-col gap-1 overflow-hidden shadow-lg size-[150px] rounded-md p-0 text-wrap
