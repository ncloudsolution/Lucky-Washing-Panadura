"use client";
import { BasicHoverCard } from "@/components/custom/cards/BasicHoverCard";
import NoRecordsCard from "@/components/custom/cards/NoRecordsCard";
import { ExportDialog } from "@/components/custom/dialogs/ExportDialog";
import { DatePickerWithRange } from "@/components/custom/inputs/DatePickerWithRange";
import { SelectOnSearch } from "@/components/custom/inputs/SelectOnSearch";
import ListSkeleton from "@/components/custom/skeleton/ListSkeleton";
import TextSkeleton from "@/components/custom/skeleton/TextSkeleton";
import { TipWrapper } from "@/components/custom/wrapper/TipWrapper";
import { FieldLabel } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ensureClientInit,
  getBusinessMeta,
  saveCategory,
} from "@/data/dbcache";
import { BasicDataFetch, formatDate } from "@/utils/common";
import { Coins, NotepadText, TextAlignJustify } from "lucide-react";
import React, { useState } from "react";
import { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { getTodayRange } from "../(orders)/orders-all/page";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { IExpense } from "@/components/custom/forms/FormExpense";
import { PaymentMethod, TPaymentMethod } from "@/data";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { IIncome } from "@/components/custom/forms/FormIncome";
import { OrderSheet } from "@/components/custom/other/OrderSheet";

const Income = () => {
  const [dates, setDates] = React.useState<DateRange | undefined>(
    getTodayRange(new Date()),
  );

  const queryClient = useQueryClient();
  const [inCategory, setInCategory] = useState("All");
  const [paymentmode, setPaymentMode] = useState("All");
  const { data: session, status } = useSession();
  const role = session?.user.role.toLowerCase();
  const counterNo = session?.user?.counter ? `${session.user.counter}-` : "01-";
  const [query, setQuery] = useState(counterNo);
  const [open, setOpen] = useState(false);

  const debouncedQuery = useDebounce(query.replace(/-/g, ""));
  const disableDefaultFilters = debouncedQuery.length > 2;

  const {
    data: expenses,
    isLoading,
    error,
  } = useQuery({
    // queryKey: ["recent-expenses"],
    queryKey: ["income", dates],
    queryFn: () =>
      BasicDataFetch({
        method: "GET",
        endpoint: `/api/company/income?from=${dates?.from}&to=${dates?.to}`,
      }),
    select: (response) => response?.data as (IIncome & { invoiceId: string })[],
    staleTime: 1000 * 60 * 5,
  });

  const { data: incomeMetasDebounce, isLoading: isLoadingDebounce } = useQuery({
    queryKey: ["income-debounce", debouncedQuery],
    queryFn: () =>
      BasicDataFetch({
        method: "GET",
        endpoint: `/api/company/income?debounce=${debouncedQuery}`,
      }),
    select: (response) => response?.data as (IIncome & { invoiceId: string })[],
    staleTime: 1000 * 60 * 5,
    enabled: disableDefaultFilters, // Only fetch when 'search' is truthy
  });

  const filteredExpenses = React.useMemo(() => {
    // When searching (>=3 chars)
    if (disableDefaultFilters) {
      return incomeMetasDebounce ?? [];
    }
    // Default filtering
    if (!expenses) return [];

    return expenses.filter((i) => {
      const categoryMatch = inCategory === "All" || inCategory === i.category;
      const paymentModeMatch =
        paymentmode === "All" || paymentmode === i.paymentMethod;

      return categoryMatch && paymentModeMatch;
    });
  }, [
    expenses,
    inCategory,
    paymentmode,
    incomeMetasDebounce,
    disableDefaultFilters,
  ]);
  console.log(filteredExpenses);
  function getTotalIncome() {
    return filteredExpenses.reduce((total, item) => {
      return total + Number(item.amount);
    }, 0);
  }

  return (
    <div className="flex relative w-full text-sm">
      <div className="flex flex-col h-full w-full">
        <div className="flex text-[30px] font-semibold justify-between items-center w-full mb-5 pb-2">
          {/**filters**/}
          <div className="flex gap-8 items-end">
            <DatePickerWithRange
              date={dates}
              setDate={setDates}
              isLoading={
                isLoading || disableDefaultFilters || isLoadingDebounce
              }
            />

            <div className="flex min-w-[200px] flex-col gap-1.5">
              <FieldLabel htmlFor="date-picker-range">
                Search By Payment Type
              </FieldLabel>

              <SelectOnSearch
                isLoading={
                  isLoading || disableDefaultFilters || isLoadingDebounce
                }
                icon={<TextAlignJustify className="text-white" size={18} />}
                selections={[
                  "All",
                  "Full Payment",
                  "Advance Payment",
                  "Partial Payment",
                  "Balance Payment",
                  "Credit Payment",
                ]}
                value={inCategory}
                onValueChange={(value) => {
                  setInCategory(value);
                  // setSearch("");
                }}
              />
            </div>

            <div className="flex min-w-[200px] flex-col gap-1.5">
              <FieldLabel htmlFor="date-picker-range">
                Search By Payment Mode
              </FieldLabel>

              <SelectOnSearch
                isLoading={
                  isLoading || disableDefaultFilters || isLoadingDebounce
                }
                icon={<Coins className="text-white" size={18} />}
                selections={["All", ...PaymentMethod]}
                value={paymentmode}
                onValueChange={(value) => {
                  setPaymentMode(value);
                  // setSearch("");
                }}
              />
            </div>

            <div className="flex w-full flex-col gap-1.5">
              <FieldLabel htmlFor="date-picker-range">
                Search By Invoice No
              </FieldLabel>
              <Input
                value={query}
                disabled={isLoading || isLoadingDebounce}
                className="bg-superbase disabled:bg-gray-500 text-white"
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {/*<TipWrapper triggerText="Export as Excel">
                 <ExportDialog
                  open={open}
                  setOpen={setOpen}
                  noofRecords={filteredExpenses.length}
                  title="Export the Expense Data"
                  description={`Records ready to export as selected filtered`}
                  loading={isLoading || isExpenseArray}
                  handleExport={handleExport}
                  content={
                    <div className="flex flex-col gap-2 py-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex w-full justify-between">
                          <div className="font-semibold">Date Range</div>
                          <div className="text-muted-foreground">
                            {dates?.from ? format(dates.from, "LLL dd, y") : ""}{" "}
                            - {dates?.to ? format(dates.to, "LLL dd, y") : ""}
                          </div>
                        </div>
                        <div className="flex w-full justify-between">
                          <div className="font-semibold">Expense Category</div>
                          <div className="text-muted-foreground">
                            {expCategory}
                          </div>
                        </div>
                        <div className="flex w-full justify-between">
                          <div className="font-semibold">Payment Mode</div>
                          <div className="text-muted-foreground">
                            {paymentmode}
                          </div>
                        </div>
                      </div>

                      <div className="flex w-full justify-between text-green-700">
                        <div className="font-semibold">No of Records</div>
                        <div>{filteredExpenses.length}</div>
                      </div>

                      <div className="text-muted-foreground text-sm">
                        If your selected filters won’t meet your export needs,
                        please cancel, adjust the filters on the Orders main
                        screen, and try exporting again
                      </div>
                    </div>
                  }
                /> 
              </TipWrapper>*/}
          </div>

          <div className="flex items-center gap-5 text-sm font-normal">
            {filteredExpenses && !isLoading && !isLoadingDebounce ? (
              <div className="flex gap-5">
                <div className="flex flex-col gap-1.5">
                  <FieldLabel htmlFor="date-picker-range">
                    Total Income
                  </FieldLabel>
                  <span className="text-base font-medium flex items-center border-2 rounded-sm px-3 w-fit border-superbase h-10 text-superbase">
                    Rs.{" "}
                    {new Intl.NumberFormat("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(Number(getTotalIncome()))}
                  </span>
                </div>
                <div className="flex flex-col justify-center items-center text-superbase">
                  <span className="text-5xl font-semibold">
                    {filteredExpenses?.length}
                  </span>
                  <span>Records Found</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col justify-center items-center text-muted-foreground">
                <TextSkeleton
                  length={2}
                  numeric
                  type="muted"
                  textSize="text-5xl font-semibold"
                />
                <span>Records Found</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex font-semibold text-muted-foreground mb-2 px-4 justify-between gap-5">
          <div className="flex-1">Invoice Id</div>
          <div className="flex-1 text-center">Payment Type</div>
          <div className="flex-1 text-center">Payment Mode</div>
          <div className="flex-1 text-center">Amount</div>
          <div className="flex-1">CreatedAt</div>
          <div className="w-[30px]" />
        </div>

        {isLoading || isLoadingDebounce ? (
          <ListSkeleton height={60} length={10} />
        ) : filteredExpenses && filteredExpenses?.length > 0 ? (
          <div className="flex flex-col h-full justify-between gap-2 ">
            <div className="flex flex-col gap-2 flex-1 py-2">
              {filteredExpenses.map((ex, index) => {
                const createdAt = ex.createdAt ? new Date(ex.createdAt) : null;

                if (!createdAt) return null;

                const [date, time] = formatDate(createdAt.toLocaleString());
                const invoice = ex.invoiceId;

                const counterId = invoice.slice(0, 2);
                const invoiceIdOnly = invoice.slice(2);

                return (
                  <div
                    key={index}
                    className={`flex justify-between items-center gap-5 py-3 px-4 group hover:bg-muted bg-background shadow rounded-md border border-transparent hover:border-gray-400`}
                  >
                    <div className="flex flex-1 font-medium">
                      {counterId}-{invoiceIdOnly}
                    </div>
                    <div className="flex-1 text-center">{ex.category}</div>
                    <div className="flex-1 text-center">{ex.paymentMethod}</div>
                    <div className="flex-1 text-center">
                      {new Intl.NumberFormat("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(ex.amount)}
                    </div>

                    <div className="flex flex-1 gap-2 text-muted-foreground">
                      <span className="font-medium">{date}</span>
                      <span>{time}</span>
                    </div>
                    <OrderSheet id={ex.orderId!} />
                  </div>
                );
              })}
            </div>
            <div className="w-full text-center pt-0">
              --- {filteredExpenses.length} Records Founded ---
            </div>
          </div>
        ) : (
          <NoRecordsCard />
        )}
      </div>

      {/* <OrderUI isLoading={isLoading} orderMetas={orderMetas ?? []} /> */}
    </div>
  );
};

export default Income;
