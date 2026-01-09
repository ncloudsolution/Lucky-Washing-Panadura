"use client";
import NoRecordsCard from "@/components/custom/cards/NoRecordsCard";
import { ChartPieLabel } from "@/components/custom/charts/ChartPieLabel";
import { SelectOnSearch } from "@/components/custom/inputs/SelectOnSearch";
import TextSkeleton from "@/components/custom/skeleton/TextSkeleton";
import { Card } from "@/components/ui/card";
import { IAnalytics } from "@/data";
import {
  getCacheProductsWithVariants,
  saveAllProductWithVariants,
} from "@/data/dbcache";
import {
  BasicDataFetch,
  getProductVariantFullNameByVarientId,
} from "@/utils/common";
import { useQuery } from "@tanstack/react-query";
import { Building2, Calendar } from "lucide-react";
import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";

const Dashboard = () => {
  const { data: session, status } = useSession();
  console.log(session);

  const [timeFrame, setTimeFrame] = useState("All Time");
  const [branch, setBranch] = useState("All Branches");

  useEffect(() => {
    if (
      session?.user?.branch &&
      (branch === "All Branches" || branch === "") &&
      session?.user.role.toLowerCase() !== "director"
    ) {
      setBranch(session.user.branch);
    }
  }, [session, branch]);

  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { products: cachedProducts, expired } =
        await getCacheProductsWithVariants();

      if (cachedProducts.length > 0 && !expired) {
        console.log("Cache is fresh");
        return cachedProducts;
      }

      const response = await BasicDataFetch({
        method: "GET",
        endpoint: "/api/products/common",
      });

      const apiData = response.data;

      await saveAllProductWithVariants({
        data: apiData,
        lastProductFetch: Date.now(),
      });

      const { products: refreshed } = await getCacheProductsWithVariants();
      return refreshed;
    },
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: analytics,
    isLoading: isLoadingAnalytics,
    error,
  } = useQuery({
    queryKey: ["analytics", timeFrame],
    queryFn: async () => {
      const query = timeFrame.toLocaleLowerCase().split(" ").join("");
      console.log(query);
      const response = await BasicDataFetch({
        method: "GET",
        endpoint: `/api/analytics?timeframe=${query}`,
      });
      // Return only the data array - this is what gets cached
      return response?.data as IAnalytics;
    },

    staleTime: 1000 * 60 * 5,
  });

  function getTotalValue(type: "count" | "saleValue"): number {
    const order = finalOrders.find((i) => i.branch === branch);
    console.log(branch);
    if (!order) return 0; // fallback if branch not found
    return type === "count" ? order.totalCount : order.totalSaleValue;
  }

  function getIncome(type: "collected" | "remains"): number {
    const breakdown = analytics?.incomes.find(
      (inc) => inc.branch === branch
    )?.breakdown;
    const totalAmount =
      breakdown?.reduce((sum, item) => sum + item.amount, 0) ?? 0;

    if (type === "collected") return totalAmount;
    return getTotalValue("saleValue") - totalAmount;
  }

  function getChartData() {
    const breakdown =
      analytics?.incomes
        .find((inc) => inc.branch === branch)
        ?.breakdown.map((item, index) => ({
          label: item.type,
          value: item.count,
          fill:
            item.type === "Cash"
              ? "var(--color-superbase)"
              : item.type === "Credit"
              ? "var(--color-destructive)"
              : `var(--chart-${index + 1})`,
        })) ?? [];

    return breakdown;
  }

  console.log(analytics);
  console.log(timeFrame, "tm");

  const branches = analytics?.orders.map((i) => i.branch) ?? [];
  const allBranches = [
    ...branches,
    ...(session?.user.role.toLowerCase() === "director"
      ? ["All Branches"]
      : []),
  ];

  const allBranchesObj =
    analytics?.orders && analytics.orders.length > 1
      ? analytics.orders.reduce(
          (acc, order) => {
            acc.totalCount += order.totalCount;
            acc.totalSaleValue += order.totalSaleValue;

            // order.breakdown.forEach((item) => {
            //   const existing = acc.breakdown.find((b) => b.type === item.type);

            //   if (existing) {
            //     existing.count += item.count;
            //     existing.saleValue += item.saleValue;
            //   }
            // });

            return acc;
          },
          {
            branch: "All Branches",
            totalCount: 0,
            totalSaleValue: 0,
            // breakdown: [
            //   { type: "Cash", count: 0, saleValue: 0 },
            //   { type: "Card", count: 0, saleValue: 0 },
            //   { type: "Bank", count: 0, saleValue: 0 },
            //   { type: "Credit", count: 0, saleValue: 0 },
            // ],
          }
        )
      : null;

  console.log(allBranchesObj);

  const finalOrders = [
    ...(analytics?.orders ?? []),
    ...(allBranchesObj ? [allBranchesObj] : []),
  ];

  // const chartData =
  //   finalOrders
  //     ?.find((i) => i.branch === branch)
  //     ?.breakdown?.map((item, index) => ({
  //       label: item.type,
  //       value: item.count,
  //       fill:
  //         item.type === "Cash"
  //           ? "var(--color-superbase)"
  //           : item.type === "Credit"
  //           ? "var(--color-destructive)"
  //           : `var(--chart-${index + 1})`,
  //     })) ?? [];

  return (
    // border-2 border-red-700
    <div className="flex flex-col gap-5">
      <div className="flex gap-5 h-fit">
        <div className="flex flex-col gap-5">
          <div className="flex gap-5">
            <SelectOnSearch
              isLoading={isLoadingAnalytics || isLoadingProducts}
              icon={<Building2 className="text-white" size={18} />}
              selections={allBranches}
              value={branch}
              onValueChange={(value) => {
                setBranch(value);
                // setSearch("");
              }}
            />
            <SelectOnSearch
              isLoading={isLoadingAnalytics || isLoadingProducts}
              icon={<Calendar className="text-white" size={18} />}
              selections={[
                "Today",
                "Last Week",
                "Last Month",
                "Last Year",
                "All Time",
              ]}
              value={timeFrame}
              onValueChange={(value) => {
                setTimeFrame(value);
                // setSearch("");
              }}
            />
          </div>

          <div className="flex gap-5 w-full">
            <Card className="flex items-center font-semibold flex-col text-muted-foreground min-w-[250px]">
              Sales Count
              {isLoadingAnalytics ? (
                <TextSkeleton
                  length={3}
                  numeric
                  type="muted"
                  textSize="text-6xl"
                />
              ) : (
                <span className="text-primary text-6xl">
                  {getTotalValue("count")}
                </span>
              )}
            </Card>
            <Card className="flex items-center flex-col text-muted-foreground min-w-[350px] h-fit font-semibold">
              Sales Revenue ( Rs )
              {isLoadingAnalytics ? (
                <span className="flex text-6xl">
                  <TextSkeleton
                    length={5}
                    numeric
                    type="muted"
                    textSize="text-6xl"
                  />
                  .00
                </span>
              ) : (
                <span className="text-primary text-6xl">
                  {new Intl.NumberFormat("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(getTotalValue("saleValue"))}
                </span>
              )}
            </Card>
            <Card className="flex items-center shadow-special-success flex-col text-muted-foreground min-w-[350px] h-fit font-semibold">
              Sales Revenue Collected ( Rs )
              {isLoadingAnalytics ? (
                <span className="flex text-6xl">
                  <TextSkeleton
                    length={5}
                    numeric
                    type="muted"
                    textSize="text-6xl"
                  />
                  .00
                </span>
              ) : (
                <span className="text-primary text-6xl">
                  {new Intl.NumberFormat("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(getIncome("collected"))}
                </span>
              )}
            </Card>
          </div>
          <div className="flex w-full gap-5">
            <Card className="flex flex-1 flex-col min-h-[200px] text-muted-foreground font-semibold">
              Trending Products
              {isLoadingProducts || isLoadingAnalytics ? (
                <div className="flex flex-col mt-2 text-primary font-normal">
                  {Array.from({ length: 5 }, (_, index) => (
                    <div key={index} className="flex justify-between gap-5">
                      <TextSkeleton
                        length={15}
                        type="muted"
                        textSize="text-base"
                      />
                      <TextSkeleton
                        length={5}
                        numeric
                        type="muted"
                        textSize="text-base"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col mt-2 text-primary font-normal">
                  {analytics && analytics.products.length > 0 ? (
                    (() => {
                      const branchData = analytics.products.find(
                        (i) => i.branch === branch
                      );
                      if (
                        !branchData ||
                        !branchData.items ||
                        branchData.items.length === 0
                      ) {
                        return <NoRecordsCard mini />;
                      }

                      return branchData.items.map((it, index) => (
                        <div
                          className="flex w-full justify-between gap-5"
                          key={index}
                        >
                          <span className="line-clamp-1">
                            {getProductVariantFullNameByVarientId(
                              products!,
                              it.productVarientId
                            )}
                          </span>
                          <span>{it.count}</span>
                        </div>
                      ));
                    })()
                  ) : (
                    <NoRecordsCard mini />
                  )}
                </div>
              )}
            </Card>
            <Card className="flex items-center flex-col justify-center shadow-special-warning text-muted-foreground min-w-[350px] font-semibold">
              Sales Revenue Receivables ( Rs )
              {isLoadingAnalytics ? (
                <span className="flex text-6xl">
                  <TextSkeleton
                    length={5}
                    numeric
                    type="muted"
                    textSize="text-6xl"
                  />
                  .00
                </span>
              ) : (
                <span className="text-primary text-6xl">
                  {new Intl.NumberFormat("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(getIncome("remains"))}
                </span>
              )}
            </Card>
          </div>
        </div>
        <ChartPieLabel
          title="Payment Methods"
          description={timeFrame}
          chartData={getChartData()}
          isLoading={isLoadingAnalytics}
          extraDataArray={analytics?.incomes}
        />
      </div>
      {/* <Card className="flex items-center font-semibold  text-muted-foreground">
        <div className="flex flex-col flex-1 items-center">
          <div className="flex gap-2 items-center">
            Account Balance
            <span className="text-xs">( {timeFrame} )</span>
          </div>

          {isLoadingAnalytics ? (
            <span className="flex text-7xl">
              <TextSkeleton
                length={5}
                numeric
                type="muted"
                textSize="text-7xl"
              />
              .00
            </span>
          ) : (
            <span className="text-primary text-7xl">
              {new Intl.NumberFormat("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(
                getTotalValue("saleValue") -
                  Number(analytics?.stocks.stockInValue) +
                  Number(analytics?.stocks.stockOutValue)
              )}
            </span>
          )}
        </div>

        <div className="flex flex-col justify-center min-w-[300px]">
          <span className="text-primary">Breakdown</span>
          <div className="flex justify-between">
            <span>Sales Revenue</span>
            <span className="text-superbase">
              {isLoadingAnalytics ? (
                <TextSkeleton
                  length={3}
                  numeric
                  type="muted"
                  textSize="text-base"
                />
              ) : (
                <>
                  {new Intl.NumberFormat("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(getTotalValue("saleValue"))}
                </>
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Cost of Purchases</span>
            <span className="text-destructive">
              {isLoadingAnalytics ? (
                <TextSkeleton
                  length={3}
                  numeric
                  type="muted"
                  textSize="text-base"
                />
              ) : (
                <>
                  {new Intl.NumberFormat("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(Number(analytics?.stocks.stockInValue))}
                </>
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Purchase Returns</span>
            <span className="text-superbase">
              {isLoadingAnalytics ? (
                <TextSkeleton
                  length={3}
                  numeric
                  type="muted"
                  textSize="text-base"
                />
              ) : (
                <>
                  {new Intl.NumberFormat("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(Number(analytics?.stocks.stockOutValue))}
                </>
              )}
            </span>
          </div>
        </div>
      </Card> */}
    </div>
  );
};

export default Dashboard;
