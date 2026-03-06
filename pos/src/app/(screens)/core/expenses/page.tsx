"use client";
import { BasicHoverCard } from "@/components/custom/cards/BasicHoverCard";
import NoRecordsCard from "@/components/custom/cards/NoRecordsCard";
import { AddNewDialog } from "@/components/custom/dialogs/AddNewDialog";
import { DeleteDialog } from "@/components/custom/dialogs/DeleteDialog";
import FormExpense, { IExpense } from "@/components/custom/forms/FormExpense";
import { DatePickerWithRange } from "@/components/custom/inputs/DatePickerWithRange";
import ViewAccessChecker from "@/components/custom/other/AccessChecker";
import ListSkeleton from "@/components/custom/skeleton/ListSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ensureClientInit,
  getBusinessMeta,
  saveCategory,
} from "@/data/dbcache";
import { BasicDataFetch, formatDate } from "@/utils/common";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Coins, NotepadText, Pencil, TextAlignJustify } from "lucide-react";
import { useSession } from "next-auth/react";
import React, { useState } from "react";
import { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { getTodayRange } from "../(orders)/orders-all/page";
import { SelectOnSearch } from "@/components/custom/inputs/SelectOnSearch";
import { FieldLabel } from "@/components/ui/field";
import { TipWrapper } from "@/components/custom/wrapper/TipWrapper";
import { ExportDialog } from "@/components/custom/dialogs/ExportDialog";
import { format } from "date-fns";
import { PaymentMethod } from "@/data";
import TextSkeleton from "@/components/custom/skeleton/TextSkeleton";

const Expenses = () => {
  const [dates, setDates] = React.useState<DateRange | undefined>(
    getTodayRange(new Date()),
  );

  const [hasSearched, setHasSearched] = useState(false);
  const queryClient = useQueryClient();
  const [expCategory, setExpCategory] = useState("All");
  const [paymentmode, setPaymentMode] = useState("All");
  const { data: session, status } = useSession();
  const role = session?.user.role.toLowerCase();

  const {
    data: expenses,
    isLoading,
    error,
  } = useQuery({
    // queryKey: ["recent-expenses"],
    queryKey: ["expenses", dates],
    queryFn: () =>
      BasicDataFetch({
        method: "GET",
        endpoint: `/api/company/expense?from=${dates?.from}&to=${dates?.to}`,
      }),
    select: (response) => response?.data as IExpense[],
    staleTime: 1000 * 60 * 5,
  });

  const { data: expenseArray = [], isLoading: isExpenseArray } = useQuery({
    queryKey: ["expense-categories"],
    queryFn: async (): Promise<string[]> => {
      await ensureClientInit();

      // 1️⃣ Try cache (correct field)
      const meta = await getBusinessMeta();

      if (meta?.incomeCategories?.length) {
        return [...meta.expenseCategories];
      }

      // 2️⃣ Fetch API
      const response = await BasicDataFetch({
        method: "GET",
        endpoint: "/api/company/categories/expense",
      });

      const apiCategories: string[] = response?.data ?? [];

      // 3️⃣ Save to cache
      await saveCategory(apiCategories, "expense");

      return apiCategories;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Handle settled state with useEffect
  React.useEffect(() => {
    if (!isLoading && hasSearched) {
      setHasSearched(false);
    }
  }, [isLoading, hasSearched]);

  // const finalArray = recentExpenses?.filter(
  //   (ex) =>
  //     ex.name.toLowerCase().includes(search.toLowerCase()) ||
  //     ex.mobile.includes(search)
  // );

  const filteredExpenses = React.useMemo(() => {
    // Default filtering
    if (!expenses) return [];

    return expenses.filter((i) => {
      // const due =
      //   Number(i?.saleValue ?? 0) +
      //   Number(i?.deliveryfee ?? 0) -
      //   Number(i?.paymentAmount ?? 0);

      // const paymentMatch =
      //   paymentStatus === "All" ||
      //   (paymentStatus === "Settled" && due === 0) ||
      //   (paymentStatus === "Outstanding" && due > 0);

      const categoryMatch = expCategory === "All" || expCategory === i.category;
      const paymentModeMatch =
        paymentmode === "All" || paymentmode === i.paymentMethod;

      return categoryMatch && paymentModeMatch;
    });
  }, [expenses, expCategory, paymentmode]);

  const handleExport = () => {};

  return (
    <div className="flex relative w-full text-sm">
      <div className="flex flex-col h-full w-full">
        <div className="flex text-[30px] font-semibold justify-between items-center w-full mb-5 pb-2">
          {/**filters**/}
          <div className="flex gap-8 items-end">
            <DatePickerWithRange
              date={dates}
              setDate={setDates}
              isLoading={isLoading || isExpenseArray}
            />

            <div className="flex min-w-[200px] flex-col gap-1.5">
              <FieldLabel htmlFor="date-picker-range">
                Search By Expense Category
              </FieldLabel>

              <SelectOnSearch
                isLoading={isLoading || isExpenseArray}
                icon={<TextAlignJustify className="text-white" size={18} />}
                selections={["All", ...expenseArray]}
                value={expCategory}
                onValueChange={(value) => {
                  setExpCategory(value);
                  // setSearch("");
                }}
              />
            </div>

            <div className="flex min-w-[200px] flex-col gap-1.5">
              <FieldLabel htmlFor="date-picker-range">
                Search By Payment Mode
              </FieldLabel>

              <SelectOnSearch
                isLoading={isLoading || isExpenseArray}
                icon={<Coins className="text-white" size={18} />}
                selections={["All", ...PaymentMethod]}
                value={paymentmode}
                onValueChange={(value) => {
                  setPaymentMode(value);
                  // setSearch("");
                }}
              />
            </div>

            {/* 
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
            </div> */}

            <TipWrapper triggerText="Export as Excel">
              <ExportDialog
                noofRecords={filteredExpenses.length}
                title="Export the Order Data"
                description={`Records ready to export as selected filtered`}
                loading={isLoading || isExpenseArray}
                handleExport={handleExport}
                content={
                  <div className="flex flex-col gap-2 py-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex w-full justify-between">
                        <div className="font-semibold">Date Range</div>
                        <div className="text-muted-foreground">
                          {dates?.from ? format(dates.from, "LLL dd, y") : ""} -{" "}
                          {dates?.to ? format(dates.to, "LLL dd, y") : ""}
                        </div>
                      </div>
                      <div className="flex w-full justify-between">
                        <div className="font-semibold">Expense Category</div>
                        <div className="text-muted-foreground">
                          {expCategory}
                        </div>
                      </div>
                      {/* <div className="flex w-full justify-between">
                        <div className="font-semibold">Order Status</div>
                        <div className="text-muted-foreground">{odStatus}</div>
                      </div> */}
                      {/* <div className="flex w-full justify-between">
                        <div className="font-semibold">
                          Invoice No Starting from
                        </div>
                        <div className="text-muted-foreground">
                          {debouncedQuery}
                        </div>
                      </div> */}
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
            </TipWrapper>
          </div>

          <div className="flex items-center gap-5 text-sm font-normal">
            {filteredExpenses && !isLoading && !isExpenseArray ? (
              <div className="flex flex-col justify-center items-center text-superbase">
                <span className="text-5xl font-semibold">
                  {filteredExpenses?.length}
                </span>
                <span>Records Found</span>
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
            <ViewAccessChecker
              permission="create:categories"
              userRole={role}
              component={
                <AddNewDialog
                  form={
                    <FormExpense
                      expenseArray={expenseArray}
                      dates={dates as DateRange}
                    />
                  }
                  triggerText="Add Expense"
                />
              }
              skeleton={
                <Skeleton className="size-[40px] rounded-sm bg-gray-300 border-slate-400" />
              }
            />
          </div>
        </div>

        <div className="flex font-semibold text-muted-foreground mb-2 px-4 justify-between gap-5">
          <div className="flex-1">Category</div>
          <div className="flex-1 text-center">Amount</div>
          <div className="flex-1 text-center">Payment Mode</div>
          <div className="flex-1">CreatedAt</div>
          <div className="flex justify-end gap-2">
            <div className="w-[30px]" />
            <div className="w-[30px]" />
            {/* <div className="w-[30px]" /> */}
          </div>
        </div>

        {isLoading ? (
          <ListSkeleton height={60} length={10} />
        ) : filteredExpenses && filteredExpenses?.length > 0 ? (
          <div className="flex flex-col h-full justify-between gap-2 ">
            <div className="flex flex-col gap-2 flex-1 py-2">
              {filteredExpenses.map((ex, index) => {
                const createdAt = ex.createdAt ? new Date(ex.createdAt) : null;

                if (!createdAt) return null;

                const [date, time] = formatDate(createdAt.toLocaleString());

                return (
                  <div
                    key={index}
                    className={`flex justify-between items-center gap-5 py-3 px-4 group hover:bg-muted bg-background shadow rounded-md border border-transparent hover:border-gray-400`}
                  >
                    <div className="flex gap-2 flex-1">
                      <>
                        <div
                          className={`${
                            ex.remarks
                              ? "bg-superbase text-white hover:cursor-pointer"
                              : "bg-input pointer-events-none"
                          } size-[25px] rounded-full flex justify-center items-center`}
                        >
                          <BasicHoverCard
                            title="Remarks"
                            description={ex.remarks}
                            triggerBtn={<NotepadText className="size-[14px]" />}
                          />
                        </div>
                      </>
                      {ex.category}
                    </div>
                    <div className="flex-1 text-center">
                      {" "}
                      {new Intl.NumberFormat("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(ex.amount)}
                    </div>
                    <div className="flex-1 text-center">{ex.paymentMethod}</div>
                    <div className="flex flex-1 gap-2 text-muted-foreground">
                      <span className="font-medium">{date}</span>
                      <span>{time}</span>
                    </div>

                    <ViewAccessChecker
                      permission="create:categories"
                      userRole={role}
                      component={
                        <AddNewDialog
                          form={
                            <FormExpense
                              dates={dates as DateRange}
                              type="edit"
                              data={ex}
                              expenseArray={expenseArray}
                            />
                          }
                          triggerText="Edit expense"
                          mini
                          triggerBtn={<Pencil className="p-1" />}
                        />
                      }
                      skeleton={
                        <Skeleton className="size-[25px] rounded-sm bg-gray-300 border-slate-400" />
                      }
                    />

                    <ViewAccessChecker
                      permission="create:categories"
                      userRole={role}
                      component={
                        <DeleteDialog
                          mini
                          triggerText="Delete expense"
                          data={`Affected expense : ${ex.id}`}
                          onClick={async () => {
                            try {
                              const res = await BasicDataFetch({
                                method: "DELETE",
                                endpoint: "/api/company/expense",
                                data: { id: ex.id },
                              });

                              queryClient.setQueryData(
                                ["recent-expenses"],
                                (oldData: any) => {
                                  const oldArray: IExpense[] =
                                    oldData?.data ?? [];

                                  const filterd = oldArray.filter(
                                    (i) => i.id !== ex.id,
                                  );

                                  return {
                                    ...oldData,
                                    data: filterd,
                                  };
                                },
                              );

                              toast.success(res.message);
                            } catch (err) {
                              const errorMessage =
                                err instanceof Error
                                  ? err.message
                                  : "An error occurred";
                              toast.error(errorMessage);
                            }
                          }}
                        />
                      }
                      skeleton={
                        <Skeleton className="size-[25px] rounded-sm bg-gray-300 border-slate-400" />
                      }
                    />
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

export default Expenses;
