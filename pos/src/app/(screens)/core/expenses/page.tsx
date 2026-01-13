"use client";
import { BasicHoverCard } from "@/components/custom/cards/BasicHoverCard";
import NoRecordsCard from "@/components/custom/cards/NoRecordsCard";
import { AddNewDialog } from "@/components/custom/dialogs/AddNewDialog";
import { DeleteDialog } from "@/components/custom/dialogs/DeleteDialog";
import FormExpense, { IExpense } from "@/components/custom/forms/FormExpense";
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
import { NotepadText, Pencil } from "lucide-react";
import { useSession } from "next-auth/react";
import React, { useState } from "react";
import { toast } from "sonner";

const Expenses = () => {
  const [search, setSearch] = useState(""); // Actual trigger key
  const [hasSearched, setHasSearched] = useState(false);
  const queryClient = useQueryClient();

  const { data: session, status } = useSession();
  const role = session?.user.role.toLowerCase();

  const {
    data: recentExpenses,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["recent-expenses"],
    queryFn: () =>
      BasicDataFetch({
        method: "GET",
        endpoint: `/api/company/expense`,
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

  const finalArray = recentExpenses;

  return (
    <div className="flex relative w-full">
      <div className="flex flex-col h-full w-full">
        <div className="flex text-[30px] font-semibold justify-between items-center w-full mb-5 pb-2 border-b-2 italic">
          Latest Expenses
          <ViewAccessChecker
            permission="create:categories"
            userRole={role}
            component={
              <AddNewDialog
                form={<FormExpense expenseArray={expenseArray} />}
                triggerText="Add Expense"
              />
            }
            skeleton={
              <Skeleton className="size-[40px] rounded-sm bg-gray-300 border-slate-400" />
            }
          />
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
        ) : finalArray && finalArray?.length > 0 ? (
          <div className="flex flex-col h-full justify-between gap-2 ">
            <div className="flex flex-col gap-2 flex-1">
              {finalArray.map((ex, index) => {
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
                                    (i) => i.id !== ex.id
                                  );

                                  return {
                                    ...oldData,
                                    data: filterd,
                                  };
                                }
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
              --- {finalArray.length} Records Founded ---
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
