"use client";

import { TrendingUp } from "lucide-react";
import { Pie, PieChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { IPieChartData } from "@/data";
import NoRecordsCard from "../cards/NoRecordsCard";
import TextSkeleton from "../skeleton/TextSkeleton";
import { DataDialog } from "../dialogs/DataDialog";

export function ChartPieLabel({
  title,
  description,
  chartData,
  isLoading,
  extraDataArray,
}: {
  title: string;
  description: string;
  chartData: IPieChartData[] | undefined;
  isLoading: boolean;
  extraDataArray?: Record<string, any>[];
}) {
  const chartConfig: Record<string, any> = {
    values: { label: "Values" },
  };
  console.log(extraDataArray, "ex");
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-2 relative">
        <div className="flex items-center">
          <CardTitle>{title}</CardTitle>
          <div className="absolute right-0 top-0">
            <DataDialog
              content={
                <>
                  {extraDataArray?.map((pay, index) => (
                    <div key={index} className="flex flex-col">
                      <span
                        className={`${
                          pay.branch === "All Branches" &&
                          "border-t-2 border-dashed border-superbase pt-1"
                        } font-semibold text-lg pb-0.5 w-full flex justify-between items-center`}
                      >
                        {pay.branch}
                        <span className="text-base">
                          {new Intl.NumberFormat("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }).format(
                            pay.breakdown?.reduce(
                              (sum, item) => sum + item.amount,
                              0
                            ) ?? 0
                          )}
                        </span>
                      </span>
                      {pay?.breakdown?.map((b, ind) => (
                        <div className="flex flex-col" key={ind}>
                          <div className="flex justify-between text-sm">
                            <div className="flex w-[80px] justify-between">
                              <span>{b.type}</span>
                              <span>( {b.count} )</span>
                            </div>
                            <span>
                              {new Intl.NumberFormat("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }).format(b.amount)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </>
              }
              title="Payments Breakdown"
              description="Breakdown of each payment method by transaction count and value."
              isLoading={isLoading}
            />
          </div>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {isLoading ? (
          <div className="h-[308px]">
            <SkeletonPieChart />
          </div>
        ) : (
          (() => {
            const totalCount =
              chartData?.reduce((sum, order) => {
                return sum + order.value;
              }, 0) ?? 0;

            if (totalCount === 0)
              return (
                <div className="size-[308px] place-content-center">
                  <NoRecordsCard mini />
                </div>
              );

            chartData?.forEach((item, index) => {
              chartConfig[item.label] = {
                label: item.label,
                //   color:
                //     item.label === "Cash"
                //       ? "var(--color-superbase)"
                //       : item.label === "Credit"
                //       ? "var(--color-destructive)"
                //       : `var(--chart-${index + 1})`,
              };
            });
            return (
              <ChartContainer
                config={chartConfig}
                className="[&_.recharts-pie-label-text]:fill-foreground mx-auto aspect-square h-full pb-0"
              >
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie data={chartData} dataKey="value" label nameKey="label" />
                  <ChartLegend
                    content={<ChartLegendContent nameKey="label" />}
                  />
                </PieChart>
              </ChartContainer>
            );
          })()
        )}
      </CardContent>
      {/* <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Showing total value for the last 6 months
        </div>
      </CardFooter> */}
    </Card>
  );
}

function SkeletonPieLegend() {
  return (
    <div className="flex gap-5">
      {Array.from({ length: 4 }, (_, index) => (
        <div className="flex items-center gap-2" key={index}>
          <span className="size-3 bg-black rounded-[3px] animate-pulse" />
          <TextSkeleton length={4} type="muted" textSize="text-sm" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonPieChart() {
  const skeletonChartData = [
    { label: "chrome", value: 275, fill: "var(--color-chrome)" },
    { label: "safari", value: 200, fill: "var(--color-safari)" },
    { label: "firefox", value: 187, fill: "var(--color-firefox)" },
    { label: "edge", value: 173, fill: "var(--color-edge)" },
  ];
  const skeletonChartConfig: Record<string, any> = {
    values: {
      label: "value",
    },
    chrome: {
      label: "Chrome",
      color: "var(--color-gray-300)",
    },
    safari: {
      label: "Safari",
      color: "var(--color-gray-400)",
    },
    firefox: {
      label: "Firefox",
      color: "var(--color-gray-500)",
    },
    edge: {
      label: "Edge",
      color: "var(--color-gray-600)",
    },
  };
  return (
    <ChartContainer
      config={skeletonChartConfig}
      className="[&_.recharts-pie-label-text]:fill-foreground mx-auto aspect-square h-full pb-0"
    >
      <PieChart>
        <Pie data={skeletonChartData} dataKey="value" nameKey="label" />
        <ChartLegend content={<SkeletonPieLegend />} />
      </PieChart>
    </ChartContainer>
  );
}
