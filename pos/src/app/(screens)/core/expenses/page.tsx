"use client";
import NoRecordsCard from "@/components/custom/cards/NoRecordsCard";
import { AddNewDialog } from "@/components/custom/dialogs/AddNewDialog";
import { DeleteDialog } from "@/components/custom/dialogs/DeleteDialog";
import FormCustomer, {
  ICustomer,
} from "@/components/custom/forms/FormCustomer";
import ViewAccessChecker from "@/components/custom/other/AccessChecker";
import ListSkeleton from "@/components/custom/skeleton/ListSkeleton";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { BasicDataFetch, formatDate } from "@/utils/common";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { includes } from "lodash";
import { Pencil, Search } from "lucide-react";
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
    data: customers,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["customers"],
    queryFn: () =>
      BasicDataFetch({
        method: "GET",
        endpoint: `/api/customer`,
      }),
    select: (response) => response?.data as ICustomer[],
    staleTime: 1000 * 60 * 5,
  });

  console.log(customers);

  // Handle settled state with useEffect
  React.useEffect(() => {
    if (!isLoading && hasSearched) {
      setHasSearched(false);
    }
  }, [isLoading, hasSearched]);

  const finalArray = customers?.filter(
    (cus) =>
      cus.name.toLowerCase().includes(search.toLowerCase()) ||
      cus.mobile.includes(search)
  );

  return (
    <div className="flex relative w-full">
      <div className="flex flex-col h-full w-full">
        <div className="flex text-[30px] font-semibold justify-between items-center w-full mb-5 pb-2 border-b-2 italic">
          Latest Expenses
          <ViewAccessChecker
            permission="create:customer"
            userRole={role}
            component={
              <AddNewDialog
                form={<FormCustomer />}
                triggerText="Add Customer"
              />
            }
            skeleton={
              <Skeleton className="size-[40px] rounded-sm bg-gray-300 border-slate-400" />
            }
          />
        </div>

        <div className="flex font-semibold text-muted-foreground mb-2 px-4 justify-between gap-5">
          <div className="flex-1">Mobile</div>
          <div className="flex-1">Name</div>
          <div className="flex-1">CreatedAt</div>
          <div className="flex justify-end">
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
              {finalArray.map((cus, index) => {
                console.log(cus.createdAt);
                const createdAt = cus.createdAt
                  ? new Date(cus.createdAt)
                  : null;

                if (!createdAt) return null;

                const [date, time] = formatDate(createdAt.toLocaleString());

                return (
                  <div
                    key={index}
                    className={` flex justify-between items-center gap-5 py-3 px-4 group hover:bg-muted bg-background shadow rounded-md border border-transparent hover:border-gray-400`}
                  >
                    <div className="flex-1">{cus.mobile}</div>
                    <div className="flex-1">{cus.name}</div>
                    <div className="flex flex-1 gap-2 text-muted-foreground">
                      <span className="font-medium">{date}</span>
                      <span>{time}</span>
                    </div>
                    <div
                      className={`flex ${
                        cus.name === "Default" ? "gap-0" : "gap-3"
                      } justify-end h-[30px]`}
                    >
                      {cus.name !== "Default" ? (
                        <ViewAccessChecker
                          permission="create:customer"
                          userRole={role}
                          component={
                            <AddNewDialog
                              form={<FormCustomer type="edit" data={cus} />}
                              triggerText="Edit Customer"
                              mini
                              triggerBtn={<Pencil className="p-1" />}
                            />
                          }
                          skeleton={
                            <Skeleton className="size-[25px] rounded-sm bg-gray-300 border-slate-400" />
                          }
                        />
                      ) : (
                        <div className="w-[30px]" />
                      )}

                      {cus.name !== "Default" ? (
                        <ViewAccessChecker
                          permission="create:customer"
                          userRole={role}
                          component={
                            <DeleteDialog
                              mini
                              triggerText="Delete Customer"
                              data={`Affected Customer : ${cus.name} - ${cus.mobile} `}
                              onClick={async () => {
                                try {
                                  const res = await BasicDataFetch({
                                    method: "DELETE",
                                    endpoint: "/api/customer",
                                    data: { mobile: cus.mobile },
                                  });

                                  queryClient.setQueryData(
                                    ["customers"],
                                    (oldData: any) => {
                                      const oldArray: ICustomer[] =
                                        oldData?.data ?? [];

                                      const filterd = oldArray.filter(
                                        (i) => i.mobile !== cus.mobile
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
                      ) : (
                        <div className="w-[30px]" />
                      )}
                    </div>
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
