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
  removeBusinessCategory,
  saveBusinessCategories,
} from "@/data/dbcache";
import { BasicDataFetch, CategoryWrapper } from "@/utils/common";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
          endpoint: "/api/company/categories",
        });

        const apiCategories: string[] = response.data ?? [];

        // 3️⃣ Save ordered categories to cache
        await saveBusinessCategories(apiCategories);

        return ["All", ...apiCategories, "Temporary"];
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
                                  endpoint: "/api/company/categories",
                                  data: { category: cat.name },
                                });

                                await ensureClientInit();
                                await removeBusinessCategory(cat.name);

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
              form={<FormCategory />}
              triggerText="Add New Category"
            />
          }
          skeleton={
            <Skeleton className="size-[40px] rounded-sm bg-gray-300 border-slate-400" />
          }
        />
      </div>

      <div className="text-2xl font-semibold mt-4">Income Categories</div>
      <div className="flex w-full justify-between gap-10 "></div>

      <div className="flex gap-10 mt-6">
        <div className="flex flex-col">
          <div className="text-2xl font-semibold">SMS Alert</div>
          <span className="text-xs">{sms ? "Enabled" : "Disabled"}</span>
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
          className="mt-3 data-[state=checked]:bg-superbase data-[state=unchecked]:bg-destructive"
        />
      </div>
    </div>
  );
};

export default Category;
