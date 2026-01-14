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
import { useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Coins, List, NotepadText, Pencil } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReactToPrint } from "react-to-print";
import { BasicDataFetch, formatDate } from "@/utils/common";
import OrderSheetSkeleton from "../skeleton/OrderSheetSkeleton";
import NewInvoice from "../cards/NewInvoice";
import { TPaymentMethod } from "@/data";
import FormIncome, { IIncome } from "../forms/FormIncome";
import { AddNewDialog } from "../dialogs/AddNewDialog";
import ViewAccessChecker from "./AccessChecker";
import { useSession } from "next-auth/react";
import { DeleteDialog } from "../dialogs/DeleteDialog";
import { toast } from "sonner";
import { BasicHoverCard } from "../cards/BasicHoverCard";

export function OrderSheet({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const { data: session, status } = useSession();
  const role = session?.user.role.toLowerCase();

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: "New Invoice",
  });

  // Fetch order only when id is ready
  const { data: invoiceData, isLoading } = useQuery({
    queryKey: ["invoice", id],
    queryFn: () =>
      BasicDataFetch({
        method: "GET",
        endpoint: `/api/orders?id=${id}`,
      }),
    select: (response) => response?.data,
    staleTime: 1000 * 60 * 5,
    enabled: !!id && open,
  });

  function DueAmount() {
    const x =
      Number(invoiceData?.baseData?.saleValue ?? 0) +
      Number(invoiceData?.baseData?.deliveryfee ?? 0) -
      Number(invoiceData?.baseData?.paymentAmount ?? 0);

    return x;
  }

  const { data: paymentBreakdown = [], isLoading: isLoadingPaymentBreakdown } =
    useQuery({
      queryKey: ["order-payment-breakdown", id],
      queryFn: () =>
        BasicDataFetch({
          method: "GET",
          endpoint: `/api/orders?payment-breakdown=${id}`,
        }),
      select: (response) =>
        response?.data as {
          id: string;
          orderId: string;
          amount: number;
          paymentMethod: TPaymentMethod;
          category: string;
          createdAt: Date | string;
        }[],
      staleTime: 1000 * 60 * 5,
      enabled: !!id && open,
    });

  const queryClient = useQueryClient();

  console.log(session?.user.role);

  const [date, time] = formatDate(invoiceData?.baseData.customerCreatedAt);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild className="size-[30px] p-[6px]">
        <List size={16} className="text-[16px]" />
      </SheetTrigger>
      <SheetContent className="gap-0 overflow-y-auto no-scrollbar">
        <SheetHeader className=" gap-0">
          <SheetTitle className="hidden">Order Summary</SheetTitle>
          {!isLoading && !isLoadingPaymentBreakdown ? (
            <>
              <SheetTitle className="text-[18px] flex flex-col">
                Order Summary
              </SheetTitle>
              <SheetDescription>
                View full order details and payment summary.
              </SheetDescription>
            </>
          ) : (
            <div className="flex flex-col gap-1 w-full">
              <Skeleton className="h-8 w-full rounded-sm" />
              <Skeleton className="h-5 w-[80%] rounded-sm" />
            </div>
          )}
        </SheetHeader>

        {!isLoading && !isLoadingPaymentBreakdown ? (
          <div className="flex flex-col px-4">
            <SheetTitle className="text-[18px] flex flex-col border-b pb-1">
              Customer Details
            </SheetTitle>
            <div className="flex flex-col w-full text-sm mt-2">
              <div className="flex justify-between">
                <span className="font-medium">Name</span>
                <span>{invoiceData?.baseData.customer}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Mobile</span>
                <span>{invoiceData?.baseData.customerMobile}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">CreatedAt</span>
                <div className="flex gap-2 text-muted-foreground">
                  <span className="font-medium">{date}</span>
                  <span>{time}</span>
                </div>
              </div>
            </div>

            <SheetTitle className="text-[18px] flex flex-col border-b pb-1 mt-4">
              Payment History
            </SheetTitle>
            <div className="flex flex-col w-full text-sm mt-2 gap-1">
              {paymentBreakdown.map((pay, index) => {
                if (!pay?.createdAt) return null;

                const [date, time] = formatDate(
                  new Date(pay.createdAt).toLocaleString()
                );

                return (
                  <div key={index} className="flex w-full justify-between">
                    <div className="flex gap-5">
                      <div className="font-semibold w-[60px]">
                        {pay.paymentMethod}
                      </div>
                      <div className="flex gap-3 text-sm">
                        {date} {time}
                      </div>
                    </div>

                    <div className="flex gap-2 items-center">
                      {new Intl.NumberFormat("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(pay.amount)}
                      {index === 0 ? (
                        <div
                          className={`
                          } size-[25px] rounded-sm flex justify-center items-center bg-input`}
                        >
                          <BasicHoverCard
                            title="Note"
                            description={
                              "Initial payment changes can only adjust with the order edit section"
                            }
                            triggerBtn={<NotepadText className="size-[18px]" />}
                          />
                        </div>
                      ) : (
                        <ViewAccessChecker
                          permission="create:order"
                          userRole={role}
                          component={
                            <DeleteDialog
                              mini
                              triggerText="Delete Payment"
                              data={`Affected payment : ${pay.id}`}
                              onClick={async () => {
                                try {
                                  const res = await BasicDataFetch({
                                    method: "DELETE",
                                    endpoint: "/api/company/income",
                                    data: { id: pay.id },
                                  });

                                  queryClient.setQueryData(
                                    ["order-payment-breakdown", pay.orderId],
                                    (oldData: any) => {
                                      const oldArray: IIncome[] =
                                        oldData?.data ?? [];

                                      const filterd = oldArray.filter(
                                        (i) => i.id !== pay.id
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
                      )}
                    </div>
                  </div>
                );
              })}

              {DueAmount() > 0 && (
                <ViewAccessChecker
                  permission="create:order"
                  userRole={role}
                  component={
                    <AddNewDialog
                      form={<FormIncome due={DueAmount()} orderId={id} />}
                      triggerText="New Payment"
                      mini
                      triggerBtn={
                        <Button className="w-full rounded-sm xs:text-base text-xs mt-2 bg-superbase/90 hover:bg-superbase">
                          <Coins className="xs:size-[18px] size-[14px]" />
                          New Payment
                        </Button>
                      }
                    />
                  }
                  skeleton={
                    <Skeleton className="size-[25px] rounded-sm bg-gray-300 border-slate-400" />
                  }
                />
              )}
            </div>

            <SheetTitle className="text-[20px] flex flex-col py-4">
              Invoice
            </SheetTitle>

            <div ref={contentRef} className="flex flex-col gap-4">
              <NewInvoice data={invoiceData} mini />
            </div>
          </div>
        ) : (
          <OrderSheetSkeleton />
        )}

        {/* <SheetFooter>
          <SheetClose asChild>
            <Button type="submit">Save changes</Button>
          </SheetClose>
        </SheetFooter> */}
        <SheetFooter className="w-full flex items-end ">
          {!isLoading ? (
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
