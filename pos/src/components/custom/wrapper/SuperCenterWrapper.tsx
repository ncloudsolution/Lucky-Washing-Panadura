import React from "react";

const SuperCenterWrapper = ({ children }: { children: React.ReactNode }) => {
  //bg-red-400
  return (
    <div className="flex flex-col min-h-dvh w-full justify-center items-center xs:p-10 p-4">
      {children}
    </div>
  );
};

export default SuperCenterWrapper;
