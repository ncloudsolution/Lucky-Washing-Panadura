import React, { useState } from "react";

import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { BaseDialogBox } from "./BaseDailogBox";

const PaymentDailogBox = ({ gatwayLink }: { gatwayLink: string }) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <BaseDialogBox
      extraStateSetter={setIsLoading}
      paddingLess
      content={
        <div className="w-full h-[580px] rounded-md overflow-hidden">
          {isLoading && (
            // <Loader2 className="animate-spin size-6 text-gray-500" />
            <div className="p-6 w-full h-full flex flex-col gap-2">
              <Skeleton className="w-full h-[450px] rounded-md relative flex items-center justify-center">
                <div className="flex flex-col text-gray-500 items-center gap-3">
                  <Loader2 className="animate-spin size-6 " />
                  <div className="font-semibold text-[30px] leading-3">
                    IPG Loading
                  </div>
                  <div>Please Wait</div>
                </div>
              </Skeleton>

              <Skeleton className="relative w-full h-20 flex justify-center items-center rounded-md">
                <Image
                  fill
                  src={"/payments/payment-banner-gray.png"}
                  className="opacity-50 object-contain p-2"
                  alt=""
                />
              </Skeleton>
            </div>
          )}
          <iframe
            src={gatwayLink}
            className="size-full"
            onLoad={() => setIsLoading(false)}
          />
        </div>
      }
    />
  );
};

export default PaymentDailogBox;
