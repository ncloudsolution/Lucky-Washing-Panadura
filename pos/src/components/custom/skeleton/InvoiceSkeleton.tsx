import React from "react";
import Rain from "@/components/custom/other/Rain";

const InvoiceSkeleton = ({
  title = "Invoice Processing...",
}: {
  title?: string;
}) => {
  return (
    <Rain
      component={
        <div className="w-full flex justify-center pt-8">
          <div className="flex flex-col ">
            <div className="flex font-saira text-superbase text-[60px] xs:text-[80px] xs:leading-[60px] leading-[50px]">
              <span className="text-subbase font-semibold">U</span>POS
            </div>
            <div className="text-[18px] xs:text-[24px] xs:leading-[24px] leading-[18px] ml-1">
              {title}
            </div>
            <div className="text-muted-foreground ml-1 xs:text-sm text-[11px] xs:leading-[16px] leading-[14px]">
              Please wait a moment
            </div>
          </div>
        </div>
      }
    />
  );
};

export default InvoiceSkeleton;
