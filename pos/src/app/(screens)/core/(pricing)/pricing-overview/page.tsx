"use client";
import { Skeleton } from "@/components/ui/skeleton";
import { IDue, IOrderMeta, IPlan } from "@/data";
import { BasicDataFetch, formatDate } from "@/utils/common";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Clock, ShieldX } from "lucide-react";
import React from "react";

const Pricing = () => {
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

  const {
    data: pricingPlans,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["pricing-plans"],
    queryFn: async () => {
      const response = await BasicDataFetch({
        method: "GET",
        endpoint: `/api/pricing/plans`,
      });
      // Return only the data array - this is what gets cached
      return response?.data as IPlan[];
    },
    staleTime: 1000 * 60 * 5,
  });

  return (
    <div className="flex flex-col">
      <div className="text-2xl font-semibold mb-3">Plan Status</div>
      <div className="flex gap-8 text-2xl font-semibold">
        {pricingDue ? (
          <>
            <div className="flex flex-col items-center p-4 bg-slate-100 rounded-sm shadow">
              <div>
                {pricingDue?.plan}{" "}
                {pricingDue?.plan !== "Free" && (
                  <span>({pricingDue?.planCycle})</span>
                )}
              </div>
              <div className="text-xs font-normal">Current Plan</div>
            </div>

            <div
              className={`flex flex-col items-center p-4 bg-slate-100 rounded-sm shadow  ${
                Number(pricingDue?.dueAmount) > 0
                  ? "text-destructive"
                  : "text-black"
              }`}
            >
              <div>
                LKR{" "}
                {new Intl.NumberFormat("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(Number(pricingDue?.dueAmount))}
              </div>

              <div className="text-xs font-normal">Due Amount</div>
            </div>

            {pricingDue?.plan !== "Free" && (
              <>
                {" "}
                <div className="flex flex-col items-center p-4 bg-slate-100 rounded-sm shadow">
                  <div>{pricingDue?.dueCycles}</div>
                  <div className="text-xs font-normal">Due Cycles</div>
                </div>
                <div className="flex flex-col items-center p-4 bg-slate-100 rounded-sm shadow">
                  <div>
                    {formatDate(pricingDue.lastPaymentDate.toLocaleString())[0]}
                  </div>
                  <div className="text-xs font-normal">Last Payment Date</div>
                </div>
                <div className="flex flex-col items-center p-4 bg-slate-100 rounded-sm shadow">
                  <div>
                    {pricingDue.lastPaymentStatus === "Approved" ? (
                      <span className="flex justify-between items-center gap-3 text-superbase">
                        Approved <BadgeCheck />
                      </span>
                    ) : pricingDue.lastPaymentStatus === "Pending" ? (
                      <span className="flex justify-between items-center gap-3 text-amber-600">
                        Pending <Clock />
                      </span>
                    ) : (
                      <span className="flex justify-between items-center gap-3 text-destructive">
                        Rejected <ShieldX />
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-normal">
                    Last Payment Verification
                  </div>
                </div>
                <div className="flex flex-col items-center p-4 bg-slate-100 rounded-sm shadow">
                  <div>
                    {formatDate(pricingDue.nextDueDate.toLocaleString())[0]}
                  </div>
                  <div className="text-xs font-normal">Next Due Cycle</div>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="w-[150px] h-20 rounded-xs" />
            ))}
          </>
        )}
      </div>

      <div className="text-2xl font-semibold mt-5 mb-3">All Plans</div>

      <div className="flex gap-5">
        {pricingPlans ? (
          <>
            {pricingPlans.map((i, index) => (
              <div
                key={index}
                className={`${
                  pricingDue?.plan === i.name
                    ? "border-superbase"
                    : "border-transparent"
                }  border-2 size-[300px] rounded-sm flex items-center justify-center bg-slate-100 `}
              >
                <div className={`flex flex-col items-center w-full`}>
                  <div
                    className={`${
                      pricingDue?.plan === i.name && "text-superbase"
                    } text-5xl flex flex-col items-center font-semibold`}
                  >
                    {i.name}{" "}
                    <span className="text-xs font-normal mb-5">(LKR)</span>
                  </div>
                  <div className="flex flex-col">
                    {i.name === "Free" ? (
                      <div
                        className={`text-[172px] leading-[148px] text-center ${
                          pricingDue?.plan === "Free" && "text-superbase"
                        }`}
                      >
                        0
                      </div>
                    ) : (
                      <div
                        className={`flex flex-col gap-3  text-center ${
                          pricingDue?.planCycle === "Monthly" &&
                          pricingDue.plan !== "Free"
                            ? "text-superbase"
                            : "text-black"
                        }`}
                      >
                        <div>
                          <div className="text-4xl font-semibold">
                            {new Intl.NumberFormat("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(Number(i.monthlyPrice))}
                          </div>
                          <div>Monthly</div>
                        </div>

                        <div
                          className={`flex flex-col ${
                            pricingDue?.planCycle === "Yearly" &&
                            pricingDue.plan !== "Free"
                              ? "text-superbase"
                              : "text-black"
                          }`}
                        >
                          {i.yearlyDiscountPercentage && (
                            <div className="text-sm text-muted-foreground text-right translate-y-1 line-through">
                              {new Intl.NumberFormat("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }).format(Number(i.monthlyPrice) * 12)}
                            </div>
                          )}
                          <div className="text-4xl font-semibold">
                            {new Intl.NumberFormat("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(
                              Number(i.monthlyPrice) *
                                12 *
                                (1 - Number(i.yearlyDiscountPercentage) / 100)
                            )}
                          </div>
                          <div>Yearly</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            {Array.from({ length: 2 }, (_, index) => (
              <Skeleton key={index} className="size-[300px] rounded-sm" />
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default Pricing;
