import FormBarcodePrint from "@/components/custom/forms/FormBarcodePrint";
import React from "react";

const page = () => {
  return (
    <div className="flex w-full h-full justify-center items-center">
      <div className="w-[350px]">
        <FormBarcodePrint />
      </div>
    </div>
  );
};

export default page;
