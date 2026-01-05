import React from "react";
import { TriangleAlert } from "lucide-react";

const UnderDevelopment = ({ mini }: { mini?: boolean }) => {
  return (
    <div
      className={`${
        mini
          ? "text-[20px] leading-[20px]"
          : "xs:text-[40px] text-[24px] xs:leading-[40px] leading-[24px]"
      }  font-semibold size-full flex flex-col gap-2 justify-center items-center text-superbase`}
    >
      <TriangleAlert className={`${mini ? "size-[30px]" : "size-[60px]"}`} />
      <div>UNDER DEVELOPMENT</div>
      <div className="text-xs text-center font-normal text-muted-foreground max-w-[500px] w-full pt-2">
        This section is currently under development. We’re working hard to bring
        this feature to you very soon. Our team is focused on ensuring
        everything functions smoothly and meets the highest quality standards.
        Please check back later for updates and new improvements.
      </div>
    </div>
  );
};

export default UnderDevelopment;
