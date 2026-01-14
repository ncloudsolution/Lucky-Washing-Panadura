"use client";
import { LoaderBtn } from "@/components/custom/buttons/LoaderBtn";
import NoRecordsCard from "@/components/custom/cards/NoRecordsCard";
import { CustomDialog } from "@/components/custom/dialogs/CustomDialog";
import { OrderSheet } from "@/components/custom/other/OrderSheet";
import ListSkeleton from "@/components/custom/skeleton/ListSkeleton";
import { Button } from "@/components/ui/button";
import { IOrderMeta } from "@/data";
import {
  cachedb,
  clientPrimaryKey,
  editInvoice,
  setClientEditMode,
  setCurrentCustomer,
} from "@/data/dbcache";
import { posFrontend } from "@/data/frontendRoutes";
import { BasicDataFetch, formatDate } from "@/utils/common";
import { AlertDialogAction } from "@radix-ui/react-alert-dialog";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  Coins,
  HandCoins,
  Home,
  MapPin,
  Pencil,
  Repeat,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

const OrdersLatest = () => {
  const {
    data: orderMetas,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["latest-order-metas"],
    queryFn: async () => {
      const response = await BasicDataFetch({
        method: "GET",
        endpoint: `/api/orders`,
      });
      // Return only the data array - this is what gets cached
      return response?.data as IOrderMeta[];
    },

    staleTime: 1000 * 60 * 5,
  });

  return <OrderUI isLoading={isLoading} orderMetas={orderMetas ?? []} />;
};

export default OrdersLatest;

const HeaderLabel = () => {
  return (
    <div className="flex font-semibold text-muted-foreground mb-2 px-4 justify-between gap-5">
      <div className="flex-1">Invoice Id</div>
      <div className="flex-1 text-center">Branch</div>
      <div className="flex-1 text-center">Status</div>
      <div className="flex-1 text-center">Sale Value</div>
      {/* <div className="flex-1 text-center">Payment Method</div> */}
      <div className="flex-1">Order CreatedAt</div>
      <div className="flex justify-end gap-3">
        <div className="w-[30px]" />
        <div className="w-[30px]" />
        {/* <div className="w-[30px]" /> */}
      </div>
    </div>
  );
};

export const OrderUI = ({
  isLoading,
  orderMetas,
}: {
  isLoading: boolean;
  orderMetas: IOrderMeta[];
}) => {
  const router = useRouter();
  const editInvoiceMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await BasicDataFetch({
        method: "GET",
        endpoint: `/api/orders?id=${orderId}`,
      });
      return res?.data;
    },
  });
  const [dialogLoading, setDialogLoading] = React.useState(false);

  return (
    <>
      <HeaderLabel />
      <div className="w-full h-[70vh] py-2 overflow-y-scroll no-scrollbar">
        {isLoading ? (
          <ListSkeleton height={60} length={10} />
        ) : orderMetas && orderMetas.length > 0 ? (
          <div className="flex flex-col h-full justify-between gap-2 ">
            <div className="flex flex-col gap-2 flex-1">
              {orderMetas
                .filter(Boolean) // 🔥 removes undefined / null
                .map((or, index) => {
                  const createdAt = or.createdAt
                    ? new Date(or.createdAt)
                    : null;

                  if (!createdAt) return null;

                  const [date, time] = formatDate(createdAt.toLocaleString());

                  return (
                    <div
                      key={index}
                      className={` flex justify-between items-center gap-5 py-3 px-4 group hover:bg-muted bg-background shadow rounded-md border border-transparent hover:border-gray-400`}
                    >
                      <div className="flex flex-1 items-center gap-2 font-medium">
                        <>
                          <div
                            className={`${
                              or.deliveryfee ? "bg-superbase" : "bg-input"
                            } size-[25px] rounded-full flex justify-center items-center`}
                          >
                            {or.deliveryfee ? (
                              <MapPin className="size-[14px] text-white" />
                            ) : (
                              <Home className="size-[14px]" />
                            )}
                          </div>
                        </>
                        {or.invoiceId}
                      </div>
                      <div className="flex-1 text-center">{or.branch}</div>
                      <div className="flex-1 text-center">{or.status}</div>
                      <div className="flex flex-1 justify-center items-center font-medium gap-2">
                        <>
                          <div
                            className={`${
                              or.deliveryfee
                                ? "bg-input text-primary"
                                : "bg-superbase text-white"
                            } size-[25px] rounded-full flex justify-center items-center`}
                          >
                            {or.deliveryfee ? (
                              <BadgeCheck className="size-[14px]" />
                            ) : (
                              <Coins className="size-[14px]" />
                            )}
                          </div>
                        </>
                        {new Intl.NumberFormat("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }).format(Number(or.saleValue))}
                      </div>
                      {/* <div className="flex-1 text-center">{or.paymentMethod}</div> */}
                      <div className="flex flex-1 gap-2 text-muted-foreground">
                        <span className="font-medium">{date}</span>
                        <span>{time}</span>
                      </div>
                      <div className="flex gap-3 justify-end h-[30px]">
                        <CustomDialog
                          loading={dialogLoading}
                          title="Edit Order Confirmation"
                          description={`This action will replace your current cart with the Invoice No ${or.invoiceId}. Any items currently in the cart will be removed and replaced by this order.`}
                          specialText={`Are you sure you want to continue?`}
                          triggerBtn={
                            <Button className="size-[30px]" variant={"ghost"}>
                              <Pencil size={16} className="text-[16px]" />
                            </Button>
                          }
                          finalFireBtn={
                            <Button
                              className="bg-black text-white flex items-center justify-center w-fit rounded-sm gap-2"
                              onClick={async () => {
                                try {
                                  await cachedb.client.update(
                                    clientPrimaryKey,
                                    {
                                      lastOrderId: String(or.id),
                                    }
                                  );

                                  await setClientEditMode(true);
                                  setDialogLoading(true); // show loading in dialog
                                  const invoiceData =
                                    await editInvoiceMutation.mutateAsync(
                                      or.id!
                                    );
                                  await editInvoice(invoiceData);
                                  router.push(posFrontend.pos);
                                } catch (err) {
                                } finally {
                                  setDialogLoading(false); // hide loading after done
                                }
                              }}
                              disabled={
                                dialogLoading || editInvoiceMutation.isPending
                              }
                            >
                              {dialogLoading ? (
                                <LoaderBtn loadertext="Moving..." />
                              ) : (
                                <>
                                  Edit
                                  <Repeat
                                    size={16}
                                    className="size-[16px] text-secondary"
                                  />
                                </>
                              )}
                            </Button>
                          }
                        />
                        <OrderSheet id={or.id!} />
                        {/* <div className="w-[30px]" /> */}
                        {/* <div className="w-[30px]" /> */}
                      </div>
                    </div>
                  );
                })}
            </div>
            <div className="w-full text-center pt-0">
              --- {orderMetas.length} Records Founded ---
            </div>
          </div>
        ) : (
          <NoRecordsCard />
        )}
      </div>
    </>
  );
};
