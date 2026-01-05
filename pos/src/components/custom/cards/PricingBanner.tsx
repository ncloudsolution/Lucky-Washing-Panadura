"use client";
import { Button } from "@/components/ui/button";
import { IDue } from "@/data";
import { BasicDataFetch } from "@/utils/common";
import { useQuery } from "@tanstack/react-query";
import { HandCoins } from "lucide-react";
import { AddNewDialog } from "../dialogs/AddNewDialog";
import FormPayment from "../forms/FormPayment";

const PricingBanner = () => {
  const { data: pricingDue } = useQuery({
    queryKey: ["pricing-due"],
    queryFn: async () => {
      const response = await BasicDataFetch({
        method: "GET",
        endpoint: `/api/pricing/due`,
      });
      return response?.data as IDue;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Determine if banner should show
  const showBanner = Number(pricingDue?.dueCycles) > 0;

  return (
    <div
      className={`
        px-4
        overflow-hidden
        rounded-sm
        bg-[#ff00004d]
        border
        border-[#ff00007a]
        transition-all
        duration-300
        ease-out
        flex
        items-center
        justify-between
        gap-5
        ${
          showBanner
            ? "max-h-[100px] py-2 opacity-100"
            : "max-h-0 py-0 opacity-0"
        }
      `}
    >
      <div className="flex flex-col">
        <span className="font-semibold lg:text-xl text-base">
          Payment Reminder !
        </span>
        <span className="lg:text-sm text-xs">
          Dear valued customer, we noticed an outstanding payment of{" "}
          <b>
            LKR{" "}
            {new Intl.NumberFormat("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(Number(pricingDue?.dueAmount))}
          </b>{" "}
          in total for {pricingDue?.dueCycles} billing cycles of your{" "}
          {pricingDue?.plan} ({pricingDue?.planCycle}) plan. Please complete
          your payment at your convenience to keep your service running
          smoothly.
        </span>
      </div>
      <AddNewDialog
        form={
          <FormPayment amount={Number(pricingDue?.dueAmount)} currency="LKR" />
        }
        triggerText="Pay"
        triggerBtn={
          <Button className="bg-superbase/90 hover:bg-superbase cursor-pointer">
            <HandCoins /> Pay Now
          </Button>
        }
      />
    </div>
  );
};

export default PricingBanner;
