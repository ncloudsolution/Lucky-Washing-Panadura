"use client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUp, List } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IProductStock, IStockValueEntry, TMetric } from "@/data";
import { BasicDataFetch, formatDate } from "@/utils/common";
import TextSkeleton from "../skeleton/TextSkeleton";
import { useReactToPrint } from "react-to-print";

export interface IExtra {
  productName: string;
  productMetric: TMetric;
  dateAndTime: { date: string; time: string };
}

export function StockSheet({
  data,
  extra,
}: {
  data: IProductStock;
  extra: IExtra;
}) {
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: "Product Stock Summary",
  });

  const { data: operatorData, isLoading } = useQuery({
    queryKey: ["staff-limited", data.operator],
    queryFn: () =>
      BasicDataFetch({
        method: "GET",
        endpoint: `/api/company/staff?type=single-limited&value=${data.operator}`,
      }),
    select: (response) => response?.data,
    staleTime: 1000 * 60 * 5,
    enabled: !!data.operator && open,
  });

  const { data: stockMetric, isLoading: isStockMetricLoading } = useQuery({
    queryKey: ["stock-product-branch", `${data.varientId}-${data.branch}`],
    queryFn: async () => {
      const res = await BasicDataFetch({
        method: "GET",
        endpoint: `/api/products/stocks?type=stock-product-branch&id=${data.varientId}&branch=${data.branch}`,
      });
      console.log(res.data);
      return res.data; // return only the actual IStockValueEntry
    },

    staleTime: 1000 * 60 * 5, // 5 minutes cache
    refetchInterval: 1000 * 60 * 10, // 10 minutes auto refetch
    enabled: !!data.varientId && open,
  });

  console.log(stockMetric);

  // const [date, time] = formatDate(invoiceData?.baseData.customerCreatedAt);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild className="size-[30px] p-[6px]">
        <List size={16} className="text-[16px]" />
      </SheetTrigger>
      <SheetContent className="gap-0 overflow-y-auto no-scrollbar">
        <SheetHeader className=" gap-0">
          <SheetTitle className="text-[18px] flex flex-col">
            Stock Log and Product Summary
          </SheetTitle>
          <SheetDescription>
            View stock details and payment summary.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col px-4">
          <SheetTitle className="text-[18px] flex flex-col border-b-2 border-black pb-1">
            Log details
          </SheetTitle>
          <div className="flex flex-col py-3 text-sm">
            <DataRow label="Product Name" value={extra.productName} />
            <DataRow label="Branch" value={data.branch} />

            <DataRow
              label="Operator"
              value={
                !isLoading && operatorData?.name ? (
                  operatorData.name
                ) : (
                  <TextSkeleton length={15} type="muted" />
                )
              }
            />

            <DataRow
              label="Quantity"
              value={
                <div className="flex gap-1 items-center">
                  <span>{data.quantity.toString()}</span>
                  {extra.productMetric !== "None" && (
                    <span>{extra.productMetric}</span>
                  )}
                  <span
                    className={`${
                      data.in ? "bg-superbase" : "bg-destructive rotate-180"
                    } size-[18px] rounded-full flex justify-center items-center`}
                  >
                    <ArrowUp
                      strokeWidth={3}
                      className="size-[12px] text-white"
                    />
                  </span>
                </div>
              }
            />
            {data.in && (
              <DataRow
                label="Unit Price"
                value={new Intl.NumberFormat("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(Number(data.unitPrice))}
              />
            )}

            {data.in && (
              <div className="py-2 my-3 border-y-[1.5px] border-dashed border-black">
                <DataRow
                  label="Gross Total"
                  value={new Intl.NumberFormat("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(Number(data.quantity) * Number(data.unitPrice))}
                />

                <DataRow
                  label="Total Discount"
                  value={new Intl.NumberFormat("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(Number(data.discount))}
                />

                <DataRow
                  label="Net Total"
                  value={new Intl.NumberFormat("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(
                    Number(data.quantity) * Number(data.unitPrice) -
                      Number(data.discount)
                  )}
                />
              </div>
            )}

            {data.in && data.supplier && (
              <DataRow label="Supplier" value={data.supplier} />
            )}
            <DataRow
              label="Created At"
              value={
                <div className="flex gap-1">
                  <span className="font-semibold">
                    {extra.dateAndTime.date}
                  </span>
                  <span>{extra.dateAndTime.time}</span>
                </div>
              }
            />
          </div>

          <SheetTitle className="pt-4 text-[18px] flex gap-2 border-b-2 border-black pb-1">
            Product Summary
            <span className="text-muted-foreground">({data.branch})</span>
          </SheetTitle>
          <div className="flex flex-col py-3 text-sm">
            <StockSummaryData
              isStockMetricLoading={isStockMetricLoading}
              stockMetric={stockMetric}
              extra={extra}
            />
          </div>

          <SheetTitle className="text-[18px] flex gap-2 border-b-2 border-black pb-1">
            Stock History
            <span className="text-muted-foreground">({data.branch})</span>
          </SheetTitle>
          <div className="flex flex-col py-3 text-sm">
            <StockHistoryData
              extra={extra}
              stockMetric={stockMetric}
              print={false}
            />
          </div>
        </div>

        {/* //product report */}
        <div ref={contentRef} className="print:flex flex-col px-4 py-6 hidden">
          <div className="w-full text-center text-lg font-semibold">
            Product Summary
          </div>
          <div className="w-full leading-[14px] text-muted-foreground text-center text-sm font-semibold">
            {data.branch} Branch
          </div>

          <div className="flex flex-col mt-3 text-sm">
            <DataRow label="Product" value={extra.productName} />
            <div className="flex flex-col pb-3 text-sm">
              <StockSummaryData
                isStockMetricLoading={isStockMetricLoading}
                stockMetric={stockMetric}
                extra={extra}
              />
            </div>
            <div className="w-full border-b-2 border-black text-lg font-semibold pb-1">
              Stock History
            </div>
            <div className="flex flex-col text-sm py-3">
              <StockHistoryData
                extra={extra}
                stockMetric={stockMetric}
                print={false}
              />
            </div>
          </div>
        </div>
        {/* <OrderSheetSkeleton /> */}
        {/* <SheetFooter>
          <SheetClose asChild>
            <Button type="submit">Save changes</Button>
          </SheetClose>
        </SheetFooter> */}
        <SheetFooter className="w-full flex items-end ">
          {!isLoading && !isStockMetricLoading ? (
            <div className="flex gap-3 w-full">
              <Button
                className="w-full rounded-sm xs:text-base text-xs"
                onClick={handlePrint}
              >
                <Printer className="xs:size-[18px] size-[14px]" />
                Print
              </Button>
            </div>
          ) : (
            <Skeleton className="h-10 w-full" />
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

const DataRow = ({ label, value }: { label: any; value: any }) => {
  return (
    <div className="flex justify-between">
      <span className="font-semibold">{label}</span>
      <span className="text-muted-foreground">{value}</span>
    </div>
  );
};

const StockSummaryData = ({
  isStockMetricLoading,
  stockMetric,
  extra,
}: {
  isStockMetricLoading: boolean;
  stockMetric: IStockValueEntry;
  extra: IExtra;
}) => {
  return (
    <>
      <DataRow
        label="Total Stock In"
        value={
          !isStockMetricLoading && stockMetric ? (
            <span className="text-superbase">
              {stockMetric.stockInCount}{" "}
              {extra.productMetric !== "None" && (
                <span>{extra.productMetric}</span>
              )}
            </span>
          ) : (
            <TextSkeleton length={15} numeric type="muted" />
          )
        }
      />
      <DataRow
        label="Total Stock Out"
        value={
          !isStockMetricLoading && stockMetric ? (
            <span className="text-destructive">
              {stockMetric.stockOutCount}{" "}
              {extra.productMetric !== "None" && (
                <span>{extra.productMetric}</span>
              )}
            </span>
          ) : (
            <TextSkeleton length={15} numeric type="muted" />
          )
        }
      />
      <DataRow
        label="Total Sales"
        value={
          !isStockMetricLoading && stockMetric ? (
            <span className="text-destructive">
              {stockMetric.soldCount.toString()}{" "}
              {extra.productMetric !== "None" && (
                <span>{extra.productMetric}</span>
              )}
            </span>
          ) : (
            <TextSkeleton length={15} numeric type="muted" />
          )
        }
      />
      <div className="w-full flex pt-3 flex-col justify-center items-center text-lg font-semibold">
        <div>Available Stocks</div>

        {!isStockMetricLoading && stockMetric ? (
          <div className="flex text-superbase sm:text-[100px] text-[80px] sm:leading-[90px] leading-[70px] pt-2 pb-5">
            {Number(stockMetric.stockInCount) -
              Number(stockMetric.stockOutCount) -
              Number(stockMetric.soldCount)}

            {extra.productMetric !== "None" && (
              <span className="text-[20px] flex justify-end">
                {extra.productMetric}
              </span>
            )}
          </div>
        ) : (
          <TextSkeleton
            type="muted"
            length={5}
            numeric
            textSize="sm:text-[100px] text-[80px] sm:leading-[90px] leading-[70px] pt-2 pb-5"
          />
        )}
      </div>
    </>
  );
};

const StockHistoryData = ({
  stockMetric,
  extra,
  print = false,
}: {
  stockMetric: IStockValueEntry;
  extra: IExtra;
  print: boolean;
}) => {
  const [showAll, setShowAll] = useState(false);
  const sliceCount = showAll ? stockMetric.entries.length : 5;

  const displayedEntries =
    stockMetric && stockMetric.entries
      ? showAll
        ? stockMetric.entries
        : stockMetric.entries.slice(0, sliceCount)
      : [];

  return (
    <>
      {stockMetric
        ? displayedEntries.map((st) => {
            const [date, time] = formatDate(st.createdAt.toLocaleString());
            return (
              <DataRow
                key={st.id}
                label={
                  <div className="flex gap-1 font-normal text-muted-foreground">
                    <span className="font-semibold">{date}</span> {time}
                  </div>
                }
                value={
                  <div className="flex gap-1 items-center">
                    <span>{st.quantity.toString()}</span>
                    {extra.productMetric !== "None" && (
                      <span>{extra.productMetric}</span>
                    )}
                    <span
                      className={`${
                        st.in ? "bg-superbase" : "bg-destructive rotate-180"
                      } size-[18px] rounded-full flex justify-center items-center`}
                    >
                      <ArrowUp
                        strokeWidth={3}
                        className="size-[12px] text-white"
                      />
                    </span>
                  </div>
                }
              />
            );
          })
        : Array.from({ length: sliceCount }, (_, index) => (
            <TextSkeleton length={15} key={index} type="muted" />
          ))}
      {stockMetric?.entries.length > sliceCount && (
        <div className="flex mt-1">
          <button
            className="text-sm text-superbase"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "Show Less" : "Show All"}
          </button>
        </div>
      )}
    </>
  );
};
