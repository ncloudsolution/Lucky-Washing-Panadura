import { SoftwareOwner } from "@/data";
import React from "react";

export const SingleRow = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => {
  return (
    <div className="flex text-[14px]">
      <div className="w-[100px] font-semibold">{label}</div>
      <div className="pr-3">:</div>
      <div>{value}</div>
    </div>
  );
};

export const BankDetailsCard = () => {
  return (
    <div className="w-full flex flex-col items-center p-5 rounded-md bg-secondary shadow-2xl border-[1px] border-white  mt-2">
      <div>
        <SingleRow
          label="Payee Name"
          value={SoftwareOwner.bankDetails.payeeName}
        />
        <SingleRow
          label="Account No"
          value={SoftwareOwner.bankDetails.AccountNo}
        />
        <SingleRow label="Bank" value={SoftwareOwner.bankDetails.Bank} />
        <SingleRow label="Branch" value={SoftwareOwner.bankDetails.Branch} />
      </div>
    </div>
  );
};
