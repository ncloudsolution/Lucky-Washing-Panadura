import { Skeleton } from "@/components/ui/skeleton";

const CartProductSkeleton = () => {
  return (
    <Skeleton className="w-full h-[60px] shadow flex flex-col p-2 border">
      <div className="flex gap-3 h-full">
        <div className="h-full aspect-square  rounded-sm bg-gray-300"></div>
        <div className="flex flex-col gap-1 w-full">
          <div className="w-full bg-gray-300 h-[25px] rounded-xs" />
          <div className="w-[50%] bg-gray-300 h-[15px] rounded-xs" />
        </div>
      </div>
    </Skeleton>
  );
};

export default CartProductSkeleton;
