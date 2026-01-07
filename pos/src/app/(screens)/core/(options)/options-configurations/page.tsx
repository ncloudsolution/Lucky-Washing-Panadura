"use client";
import { AddNewDialog } from "@/components/custom/dialogs/AddNewDialog";
import { DeleteDialog } from "@/components/custom/dialogs/DeleteDialog";
import FormCategory from "@/components/custom/forms/FormCategory";
import ViewAccessChecker from "@/components/custom/other/AccessChecker";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  ensureClientInit,
  getBusinessMeta,
  removeCategory,
  saveCategory,
} from "@/data/dbcache";
import {
  BasicDataFetch,
  CategoryWrapper,
  IncomeCategoryWrapper,
} from "@/utils/common";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoveRight } from "lucide-react";
import { useSession } from "next-auth/react";
import React, { useMemo } from "react";
import { toast } from "sonner";

const Category = () => {
  const { data: session, status } = useSession();
  const role = session?.user.role.toLowerCase();
  const branch = session?.user.branch;
  const operator = session?.user.id;

  const queryClient = useQueryClient();

  const { data: sms = false, isLoading: isLoadingSms } = useQuery({
    queryKey: ["sms"],
    queryFn: async () => {
      const response = await BasicDataFetch({
        method: "GET",
        endpoint: "/api/company/sms",
      });
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (status: boolean) => {
      return BasicDataFetch({
        method: "POST",
        endpoint: "/api/company/sms",
        data: { status },
      });
    },
    onSuccess: (_res, newStatus) => {
      queryClient.setQueryData(["sms"], newStatus);
    },
  });

  console.log(sms);

  const { data: CategoryArray = [], isLoading: isLoadingCatagoryArray } =
    useQuery({
      queryKey: ["categories"],
      queryFn: async () => {
        await ensureClientInit();

        // 1️⃣ Try cache
        const meta = await getBusinessMeta();
        if (meta?.categories?.length) {
          return meta.categories;
        }

        // 2️⃣ Fetch API
        const response = await BasicDataFetch({
          method: "GET",
          endpoint: "/api/company/categories/product",
        });

        const apiCategories: string[] = response.data ?? [];

        // 3️⃣ Save ordered categories to cache
        await saveCategory(apiCategories, "product");

        return ["All", ...apiCategories, "Temporary"];
      },
      staleTime: 1000 * 60 * 5,
    });

  const { data: incomeArray = [], isLoading: isIncomeArray } = useQuery({
    queryKey: ["income-categories"],
    queryFn: async (): Promise<string[]> => {
      await ensureClientInit();

      // 1️⃣ Try cache (correct field)
      const meta = await getBusinessMeta();

      if (meta?.incomeCategories?.length) {
        return [...meta.incomeCategories];
      }

      // 2️⃣ Fetch API
      const response = await BasicDataFetch({
        method: "GET",
        endpoint: "/api/company/categories/income",
      });

      const apiCategories: string[] = response?.data ?? [];

      // 3️⃣ Save to cache
      await saveCategory(apiCategories, "income");

      return apiCategories;
    },
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

  /* ---------------- Category Objects ---------------- */
  const FinalCategoryItems = useMemo(() => {
    return CategoryArray.map((name, index) => ({
      id: index === 0 ? "0" : name.toLowerCase().replace(/\s+/g, "-"),
      name,
    }));
  }, [CategoryArray]);

  return (
    <div className="flex flex-col relative">
      <div className="text-2xl font-semibold">Product Categories</div>
      <div className="flex w-full justify-between gap-10 mt-4">
        <div className="flex flex-wrap gap-x-5 gap-y-4">
          {isLoadingCatagoryArray ? (
            <>
              {Array.from({ length: 12 }, (_, index) => (
                <Skeleton
                  key={index}
                  className="h-[40px] w-[100px] rounded-sm"
                />
              ))}
            </>
          ) : (
            <>
              {FinalCategoryItems.map((cat, index) => (
                <div
                  key={index}
                  className={
                    " h-[40px] min-w-[100px] flex justify-between gap-5 items-center px-2 text-xs text-primary hover:bg-superbase/70 hover:text-white bg-secondary rounded-sm shadow"
                  }
                >
                  {cat.name}

                  <>
                    {CategoryWrapper(FinalCategoryItems).includes(cat) && (
                      <ViewAccessChecker
                        permission="delete:product"
                        userBranch={branch}
                        userRole={role}
                        component={
                          <DeleteDialog
                            mini
                            triggerText="Delete Category"
                            data={`Affected Category - ${cat.name}`}
                            onClick={async () => {
                              try {
                                const res = await BasicDataFetch({
                                  method: "DELETE",
                                  endpoint: "/api/company/categories/product",
                                  data: { category: cat.name },
                                });

                                await ensureClientInit();
                                await removeCategory(cat.name, "product");

                                // ✅ refresh react-query UI
                                queryClient.invalidateQueries({
                                  queryKey: ["categories"],
                                });

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
                    )}
                  </>
                </div>
              ))}
            </>
          )}
        </div>

        <ViewAccessChecker
          permission="create:categories"
          userRole={role}
          component={
            <AddNewDialog
              form={<FormCategory type="product" />}
              triggerText="Add New Category"
            />
          }
          skeleton={
            <Skeleton className="size-[40px] rounded-sm bg-gray-300 border-slate-400" />
          }
        />
      </div>

      <div className="text-2xl font-semibold mt-4">Income Categories</div>
      <div className="flex w-full justify-between gap-10 mt-4">
        <div className="flex flex-wrap gap-x-5 gap-y-4">
          {isIncomeArray ? (
            <>
              {Array.from({ length: 12 }, (_, index) => (
                <Skeleton
                  key={index}
                  className="h-[40px] w-[100px] rounded-sm"
                />
              ))}
            </>
          ) : (
            <>
              {incomeArray.map((inc, index) => (
                <div
                  key={index}
                  className={
                    " h-[40px] min-w-[100px] flex justify-between gap-5 items-center px-2 text-xs text-primary hover:bg-superbase/70 hover:text-white bg-secondary rounded-sm shadow"
                  }
                >
                  {inc}

                  <>
                    {IncomeCategoryWrapper(incomeArray).includes(inc) && (
                      <ViewAccessChecker
                        permission="delete:product"
                        userBranch={branch}
                        userRole={role}
                        component={
                          <DeleteDialog
                            mini
                            triggerText="Delete Income Category"
                            data={`Affected Income Category - ${inc}`}
                            onClick={async () => {
                              try {
                                const res = await BasicDataFetch({
                                  method: "DELETE",
                                  endpoint: "/api/company/categories/income",
                                  data: { category: inc },
                                });

                                await ensureClientInit();
                                await removeCategory(inc, "income");

                                // ✅ refresh react-query UI
                                queryClient.invalidateQueries({
                                  queryKey: ["income-categories"],
                                });

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
                    )}
                  </>
                </div>
              ))}
            </>
          )}
        </div>

        <ViewAccessChecker
          permission="create:categories"
          userRole={role}
          component={
            <AddNewDialog
              form={<FormCategory type="income" />}
              triggerText="Add New Income Category"
            />
          }
          skeleton={
            <Skeleton className="size-[40px] rounded-sm bg-gray-300 border-slate-400" />
          }
        />
      </div>

      <div className="text-2xl font-semibold mt-4">Expense Categories</div>
      <div className="flex w-full justify-between gap-10 mt-4">
        <div className="flex flex-wrap gap-x-5 gap-y-4">
          {isExpenseArray ? (
            <>
              {Array.from({ length: 12 }, (_, index) => (
                <Skeleton
                  key={index}
                  className="h-[40px] w-[100px] rounded-sm"
                />
              ))}
            </>
          ) : (
            <>
              {expenseArray.length > 0 ? (
                expenseArray.map((inc, index) => (
                  <div
                    key={index}
                    className={
                      " h-[40px] min-w-[100px] flex justify-between gap-5 items-center px-2 text-xs text-primary hover:bg-superbase/70 hover:text-white bg-secondary rounded-sm shadow"
                    }
                  >
                    {inc}

                    <>
                      <ViewAccessChecker
                        permission="delete:product"
                        userBranch={branch}
                        userRole={role}
                        component={
                          <DeleteDialog
                            mini
                            triggerText="Delete Expense Category"
                            data={`Affected Expense Category - ${inc}`}
                            onClick={async () => {
                              try {
                                const res = await BasicDataFetch({
                                  method: "DELETE",
                                  endpoint: "/api/company/categories/expense",
                                  data: { category: inc },
                                });

                                await ensureClientInit();
                                await removeCategory(inc, "expense");

                                // ✅ refresh react-query UI
                                queryClient.invalidateQueries({
                                  queryKey: ["expense-categories"],
                                });

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
                    </>
                  </div>
                ))
              ) : (
                <div className="flex justify-center items-center gap-3">
                  Add Expense Categories <MoveRight />
                </div>
              )}
            </>
          )}
        </div>

        <ViewAccessChecker
          permission="create:categories"
          userRole={role}
          component={
            <AddNewDialog
              form={<FormCategory type="expense" />}
              triggerText="Add New Expense Category"
            />
          }
          skeleton={
            <Skeleton className="size-[40px] rounded-sm bg-gray-300 border-slate-400" />
          }
        />
      </div>

      <div className="flex gap-10 mt-6">
        <div className="flex flex-col">
          <div className="text-2xl font-semibold">SMS Alert</div>
          <span className="text-xs">
            {isLoadingSms || isPending
              ? "Loading..."
              : sms
              ? "Enabled"
              : "Disabled"}
          </span>
        </div>

        <Switch
          disabled={isLoadingSms || isPending}
          checked={sms}
          onCheckedChange={async () => {
            try {
              await mutateAsync(!sms);
              toast.success("SMS setting updated");
            } catch (err) {
              toast.error("Failed to update SMS setting");
            }
          }}
          className={`${
            isLoadingSms ||
            (isPending
              ? "data-[state=unchecked]:bg-secondary"
              : "data-[state=unchecked]:bg-destructive")
          } mt-3 data-[state=checked]:bg-superbase`}
        />
      </div>
    </div>
  );
};

export default Category;
