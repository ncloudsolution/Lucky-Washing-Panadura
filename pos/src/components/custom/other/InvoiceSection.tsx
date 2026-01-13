"use client";

import { BasicDataFetch } from "@/utils/common";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useRef } from "react";

import {
  ChevronsLeft,
  CircleQuestionMark,
  Printer,
  TrafficCone,
} from "lucide-react";
import SuperCenterWrapper from "@/components/custom/wrapper/SuperCenterWrapper";
import { Card } from "@/components/ui/card";
import StaticMatrix from "@/components/custom/other/StaticMatrix";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { TipWrapper } from "@/components/custom/wrapper/TipWrapper";
import InvoiceSkeleton from "@/components/custom/skeleton/InvoiceSkeleton";
import NewInvoice from "../cards/NewInvoice";

const InvoiceSection = () => {
  const searchParam = useSearchParams();
  const id = searchParam.get("id");

  const router = useRouter();

  const { data: session, status } = useSession();
  const role = session?.user.role.toLowerCase();

  // Fetch order only when id is ready
  const {
    data: invoiceData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["invoice", id],
    queryFn: () =>
      BasicDataFetch({
        method: "GET",
        endpoint: `/api/orders?id=${id}`,
      }),
    select: (response) => response?.data,
    staleTime: 1000 * 60 * 5,
    enabled: !!id,
  });

  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: "New Invoice",
  });

  // const missingAudio = new Audio("/sounds/notfound.mp3");
  // missingAudio.autoplay;
  // missingAudio.play();

  if (!id || id === "")
    return (
      <SuperCenterWrapper>
        <Card className="flex flex-col gap-3 items-center justify-center h-[350px] xs:h-[400px] relative border-amber-500 xs:p-6 p-4 shadow-xl">
          <div className="absolute right-5 top-5 rounded-full size-[20px] bg-amber-500 shadow-md" />
          <CircleQuestionMark
            className="size-[120px] xs:size-[150px]"
            strokeWidth={0.8}
          />
          <h2 className="flex gap-2 items-center text-2xl font-semibold text-gray-800">
            Query <span className="text-amber-500">Missing</span>
          </h2>
          <div className="flex flex-col xs:gap-1 text-center text-xs xs:text-base">
            <p className="text-gray-500 leading-[18px]">
              It looks like no order Id was in your request.
            </p>
            <p className="text-gray-500  leading-[18px]">
              Provide a valid Id to proceed.
            </p>
          </div>
        </Card>
      </SuperCenterWrapper>
    );

  if (isLoading) {
    return <InvoiceSkeleton />;
  }

  if (!isLoading && !invoiceData) {
    return (
      <SuperCenterWrapper>
        <Card className="flex flex-col gap-3 items-center justify-center h-[350px] xs:h-[400px] relative border-amber-500 xs:p-6 p-4 shadow-xl">
          <div className="absolute right-5 top-5 rounded-full size-[20px] bg-amber-500 shadow-md" />
          <TrafficCone
            className="size-[120px] xs:size-[150px]"
            strokeWidth={0.6}
          />
          <h2 className="flex gap-2 items-center text-2xl font-semibold text-gray-800">
            Invoice <span className="text-amber-500">Not Found</span>
          </h2>
          <div className="flex flex-col xs:gap-1 text-center text-xs xs:text-base">
            <p className="text-gray-500 leading-[18px]">
              We couldn’t find the invoice you’re looking for.
            </p>
            <p className="text-gray-500  leading-[18px]">
              It may have been removed or doesn’t exist.
            </p>
          </div>
        </Card>
      </SuperCenterWrapper>
    );
  }

  return (
    <SuperCenterWrapper>
      <StaticMatrix />
      {(role === "uniter" || role === "cashier") && (
        <TipWrapper triggerText="Back">
          <Button
            className="size-10 rounded-sm xs:text-base text-xs absolute left-5 top-5"
            onClick={() => router.back()}
          >
            <ChevronsLeft className="xs:size-[18px] size-[14px]" />
          </Button>
        </TipWrapper>
      )}

      <TipWrapper triggerText="Print">
        <Button
          className="size-10 rounded-sm xs:text-base text-xs absolute right-5 bottom-5"
          onClick={handlePrint}
        >
          <Printer className="xs:size-[18px] size-[14px]" />
        </Button>
      </TipWrapper>

      <div className="relative">
        <div className="z-20 absolute right-5 top-5 rounded-full size-[20px] bg-superbase shadow-md" />
        <div ref={contentRef}>
          <NewInvoice data={invoiceData} />
        </div>
      </div>
    </SuperCenterWrapper>
  );
};

export default InvoiceSection;
