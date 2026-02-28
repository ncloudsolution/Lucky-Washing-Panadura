"use client";
import { Button } from "@/components/ui/button";
import {
  CircleDollarSign,
  CircleQuestionMark,
  Coins,
  CreditCard,
  FileText,
  Hand,
  Landmark,
  MapPin,
  MousePointer2,
  Printer,
  Receipt,
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  cachedb,
  clearCurrentCustomer,
  clientPrimaryKey,
  clientReset,
  ensureBranchesInit,
  ensureBusinessInit,
  ensureClientInit,
  getBranchesMeta,
  getBusinessMeta,
  getCurrentCustomer,
  getExportReadyCacheCart,
  getLastEbillId,
  getOrderType,
  getReverseExportFormat,
  getTotalFromCacheCart,
  removeAllFromCacheCart,
  setClientEditMode,
  setCurrentCustomer,
  transformCartData,
  updateLastEbillId,
} from "@/data/dbcache";
import CartProduct from "./CartProduct";
import CartTopBar from "./CartTopBar";
import CartProductSkeleton from "../skeleton/CartProductSkeleton";
import { AddNewDialog } from "../dialogs/AddNewDialog";
import FormHoldCart from "../forms/FormHoldCart";
import { DebounceSearchInput } from "../inputs/DebounceSearchInput";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { BasicDataFetch, playMusic } from "@/utils/common";
import { toast } from "sonner";
import { LoaderBtn } from "../buttons/LoaderBtn";
import Link from "next/link";
import {
  BaseUrl,
  defaultPrint,
  globalDefaultCustomer,
  IOrderMeta,
  TOrderStatus,
  TPaymentMethod,
} from "@/data";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TipWrapper } from "../wrapper/TipWrapper";
import { nanoid } from "nanoid";

import { useReactToPrint } from "react-to-print";
import NewInvoice, { IInvoice } from "./NewInvoice";
import { addToQueue } from "@/data/queue";
import ModInvoice from "./ModInvoice";

const CartCard = () => {
  const queryClient = useQueryClient();
  const products = useLiveQuery(() => cachedb.cartItem.toArray(), []);
  const structuredProducts = transformCartData(products ?? []);
  const [activeOption, setActiveOption] = useState<TPaymentMethod>("Cash");
  const [paymentPortion, setPaymentPortion] = useState("Full Payment");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invoiceData, setInvoiceData] = useState<IInvoice>();

  const { data: session, status } = useSession();

  /* ----------------------Next InvoiceId ------------------------*/

  const { data: nextInvoiceIdSuffix, isLoading } = useQuery({
    queryKey: ["next-invoice-id"],
    queryFn: async () => {
      await ensureClientInit();

      // 1️⃣ Try cache
      const exists = await cachedb.client.get(clientPrimaryKey);

      if (
        exists?.nextInvoiceIdSuffix &&
        exists.nextInvoiceIdSuffix !== "notset"
      ) {
        return exists.nextInvoiceIdSuffix; // ✅ always string
      }

      // 2️⃣ Fetch API
      const response = await BasicDataFetch({
        method: "GET",
        endpoint: `/api/orders/nextid?operator=${session?.user.id}`,
      });

      const apiId: string = response.data;

      // 3️⃣ Save to cache (safe even if exists is undefined)
      await cachedb.client.update(clientPrimaryKey, {
        nextInvoiceIdSuffix: apiId,
      });

      return apiId; // ✅ ALWAYS return
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!session?.user.id,
  });
  const finalNextInvoiceId: string =
    session?.user.counterNo + nextInvoiceIdSuffix;

  useEffect(() => {
    async function Cli() {
      const companyMetaCli = await ensureBusinessInit();
      const allBranchesCli = await ensureBranchesInit();
      const branchDetails = allBranchesCli.find(
        (i) => i.branch === session?.user.branch,
      );

      const data = {
        id: "x",
        invoiceId: finalNextInvoiceId,
        createdAt: Date.now(),
        saleValue: total,
        deliveryfee: deliveryfee,
        status: "Processing",

        paymentMethod: activeOption,
        incomeCategory: paymentPortion,
        paymentAmount:
          paymentPortion === "Advance Payment" ||
          paymentPortion === "Credit Payment"
            ? paymentPortionAmount
            : total + deliveryfee,

        business: companyMetaCli.businessName,
        branch: session?.user.branch,
        address: branchDetails?.address,
        hotlines: branchDetails?.hotlines,
        operator: session?.user.id,
        counterNo: session?.user.counterNo,

        //this data get only for sheet not the invoice
        customer: "x",
        customerMobile: "x",
        customerCreatedAt: Date.now(),
      };
    }
  });

  const orderType = useLiveQuery(async () => {
    return getOrderType();
  }, []);

  // compute total price live
  // const total = (products ?? []).reduce((sum, item) => {
  //   return sum + item.unitPrice * item.quantity;
  // }, 0);

  const [lastEbillId, setLastEbillId] = useState<string | null>(null);
  const queue = useLiveQuery(() => cachedb.queue.toArray(), []);
  // Fetch once on mount and whenever we manually trigger refresh
  useEffect(() => {
    const fetchLastEbill = async () => {
      const id = await getLastEbillId();
      setLastEbillId(id ?? null);
    };
    fetchLastEbill();
  }, [queue]);

  useEffect(() => {
    if (invoiceData && contentRef.current) {
      setTimeout(() => {
        handlePrint();
      }, 500);
    }
  }, [invoiceData]);

  useEffect(() => {
    const fetchDeliveryAndOption = async () => {
      const id = await getLastEbillId();
      setActiveOption(orderType?.edCustomerPaymentMethod ?? "Cash");
      setPaymentPortion(orderType?.edPaymentPortion ?? "Full Payment");
      setPaymentPortionAmount(orderType?.edPaymentPortionAmount ?? 0);
      //here should change fgor edits
      setDeliveryfee(orderType?.edDeliveryfee ?? 0);
      setRemoteOrder(Number(orderType?.edDeliveryfee) > 0);
    };
    fetchDeliveryAndOption();
  }, [orderType]);

  const total = useLiveQuery(() => getTotalFromCacheCart(), [], 0);

  const [remoteOrder, setRemoteOrder] = useState(false);
  const [deliveryfee, setDeliveryfee] = useState(0);
  const [paymentPortionAmount, setPaymentPortionAmount] = useState(0);
  const initialErrorState = {
    customerError: false,
    deliveryfeeError: false,
    paymentPortionAmountError: false,
    queueError: false,
  };
  const [error, setError] = useState(initialErrorState);

  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: "New Invoice",
  });

  const payOptions = [
    { name: "Cash", icon: <CircleDollarSign /> },
    { name: "Card", icon: <CreditCard /> },
    { name: "Bank", icon: <Landmark /> },
    { name: "Credit", icon: <CircleQuestionMark /> },
  ];

  const paymentPortionOptions = [
    { name: "Full Payment", icon: <Receipt /> },
    { name: "Advance Payment", icon: <Coins /> },
  ];

  const currentCustomer = useLiveQuery(() => getCurrentCustomer(), []);

  const quelen = queue?.length as number;

  const handlePayNow = async () => {
    const start = performance.now();
    setIsSubmitting(true);

    const newErrorState = { ...initialErrorState };

    // 1️⃣ Delivery fee validation
    if (deliveryfee === 0 && remoteOrder) {
      newErrorState.deliveryfeeError = true;
    }

    // 2️⃣ Advance payment validation
    if (paymentPortion === "Advance Payment" && paymentPortionAmount === 0) {
      newErrorState.paymentPortionAmountError = true;
    }

    if (
      paymentPortion === "Advance Payment" &&
      paymentPortionAmount === total
    ) {
      newErrorState.paymentPortionAmountError = true;
    }

    // 3️⃣ Customer validation
    if (!currentCustomer?.name || !currentCustomer?.mobile) {
      newErrorState.customerError = true;
    }

    if (quelen > 10) {
      newErrorState.queueError = true;
    }

    // 🚨 If ANY error exists
    if (
      newErrorState.deliveryfeeError ||
      newErrorState.paymentPortionAmountError ||
      newErrorState.customerError ||
      newErrorState.queueError
    ) {
      setError(newErrorState);
      setIsSubmitting(false);

      if (newErrorState.customerError) {
        toast.error("Customer Required for Order");
      } else if (newErrorState.paymentPortionAmountError) {
        toast.error("Advance payment cannot be 0 or total.");
      } else if (newErrorState.deliveryfeeError) {
        toast.error("Delivery fee should include the order");
      } else if (newErrorState.queueError) {
        toast.error("Queue full. Submit after it drops below 10.");
      }

      return;
    }

    // ✅ Clear errors if all good
    setError({ ...initialErrorState });
    const products = await getExportReadyCacheCart();

    if (!products || products.length === 0) {
      setIsSubmitting(false);
      return toast.error("No products in cart to order");
    }

    const data = {
      customerMobile: currentCustomer?.mobile,
      orderMeta: {
        //id,customerId, -- should include
        ...(orderType?.editMode ? { id: orderType.lastOrderId } : {}), //get user id:currentOrderId via dexie func
        operator: session?.user.id,
        invoiceId: finalNextInvoiceId,
        branch: session?.user.branch,
        paymentMethod: activeOption,
        paymentPortion: paymentPortion,
        paymentPortionAmount:
          paymentPortion === "Advance Payment" ||
          paymentPortion === "Credit Payment"
            ? paymentPortionAmount
            : total + deliveryfee,
        saleValue: total,
        ...(remoteOrder ? { deliveryfee } : {}),
        //invoiceId - auto increament -- should include
        //customerIp,additionalMobile,ShippingAddress
        status: "Processing",
        //createdAt - auto created -- should include
      },
      orderItems: products, //array
      //id, - auto created
      //customerId, -- should include --loop through id from mobile
    };

    //full clent side billing data process start ----------------------
    const revItems = await getReverseExportFormat();
    const companyMetaCli = await getBusinessMeta();
    const allBranchesCli = await getBranchesMeta();
    const branchDetails = allBranchesCli.find(
      (i) => i.branch === session?.user.branch,
    );

    const dataCli = {
      baseData: {
        id: "x",
        invoiceId: finalNextInvoiceId,
        createdAt: new Date().toISOString(),
        saleValue: total,
        deliveryfee: deliveryfee,
        status: "Processing" as TOrderStatus,

        paymentMethod: activeOption,
        incomeCategory: paymentPortion,
        paymentAmount:
          paymentPortion === "Advance Payment" ||
          paymentPortion === "Credit Payment"
            ? paymentPortionAmount
            : total + deliveryfee,

        business: companyMetaCli?.businessName as string,
        branch: session?.user.branch,
        address: branchDetails?.address as string,
        hotlines: branchDetails?.hotlines as string[],
        operator: session?.user.id,
        counterNo: session?.user.counterNo,

        //this data get only for sheet not the invoice
        customer: "x",
        customerMobile: "x",
        customerCreatedAt: new Date().toISOString(),
      },
      items: revItems,
    };

    await addToQueue({
      id: nanoid(),
      edit: orderType?.editMode as boolean,
      payload: data,
      createdAt: new Date().toISOString(),
    });

    // full clent side billing data process end ------------------------

    try {
      // const res = await BasicDataFetch({
      //   // Added await here
      //   method: orderType?.editMode ? "PUT" : "POST",
      //   endpoint: "/api/orders",
      //   data: data,
      // });

      const end = performance.now();
      const responseTimeMs = end - start;

      if (!globalDefaultCustomer.enable) {
        await clearCurrentCustomer();
      }

      //update lastest orders
      if (orderType?.editMode) {
        await queryClient.invalidateQueries({
          queryKey: ["latest-order-metas"],
        });

        await queryClient.invalidateQueries({
          queryKey: ["invoice", orderType.lastOrderId],
        });
      } else {
        //update cache
        const next = Number(nextInvoiceIdSuffix) + 1;
        const finalNext = next.toString();
        await cachedb.client.update(clientPrimaryKey, {
          nextInvoiceIdSuffix: finalNext,
        });

        //update state of nextid
        queryClient.setQueryData(["next-invoice-id"], finalNext);

        //  const ebillData = defaultPrint ? dataCli.baseData : dataCli;
        // const ebillData = defaultPrint ? res.data.baseData : res.data;
        // await updateLastEbillId(ebillData.id);

        const ebillId = dataCli.baseData.id;
        //handle with queue cache
        // await updateLastEbillId(ebillId);

        // await refreshLastEbill();

        if (defaultPrint) {
          setInvoiceData(dataCli);
          //...
        }

        await queryClient.invalidateQueries({
          queryKey: ["latest-order-metas"],
        });
      }

      await removeAllFromCacheCart();
      // await setClientEditMode(false);
      await clientReset();
      // setDeliveryfee(0);
      // setRemoteOrder(false);
      // setActiveOption("Cash");
      // setPaymentPortion("Full Payment");
      // setPaymentPortionAmount(0);
      // res already contains parsed JSON from BasicDataFetch

      // toast.success(`${res.message} in ${(responseTimeMs / 1000).toFixed(2)}s`);
      toast.success(`Order filled in ${(responseTimeMs / 1000).toFixed(2)}s`);

      playMusic("/sounds/paid.mp3");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      toast.error(errorMessage);
    }

    setIsSubmitting(false);
  };

  // useEffect(() => {
  //   if (globalDefaultCustomer.enable && !orderType?.editMode) {
  //     setCurrentCustomer("Default", "+94777777777");
  //   }
  // }, [orderType]);

  return (
    <div className="overflow-hidden w-[450px] flex flex-col border-2 border-superbase shadow-xl rounded-md ">
      {/* Scrollable product area */}
      <CartTopBar />
      <div className="flex-1 overflow-y-auto no-scrollbar relative">
        {structuredProducts === undefined ? (
          <div className="w-full px-2 gap-2 flex flex-col">
            {Array.from({ length: 12 }).map((_, index) => (
              <CartProductSkeleton key={index} />
            ))}
          </div>
        ) : structuredProducts.length > 0 ? (
          <>
            {structuredProducts.map((pro, index) => (
              <CartProduct {...pro} key={pro.name} />
            ))}
          </>
        ) : lastEbillId ? (
          <div className="w-full h-full flex justify-center items-center">
            <Link
              href={`${BaseUrl}/invoice?id=${lastEbillId}`}
              className="flex p-2 text-superbase font-semibold items-center justify-center cursor-pointer gap-1 flex-col border-superbase border-1 shadow-lg size-[100px] aspect-square rounded-sm xs:text-base text-xs"
            >
              <FileText
                className="size-[50px] text-superbase"
                strokeWidth={1.2}
              />
              Last E-Bill
            </Link>
          </div>
        ) : null}

        <AddNewDialog
          triggerText="Hold Cart"
          form={<FormHoldCart />}
          triggerBtn={
            <Button className="shadow-lg flex absolute bottom-3 right-3 justify-center items-center rounded-sm px-4 py-1 gap-2">
              <Hand className="size-[20px]" />
            </Button>
          }
        />
      </div>

      {/* Fixed button at bottom */}

      <div className="w-full text-lg bg-superbase rounded-none flex flex-col p-3 gap-2">
        <DebounceSearchInput
          error={error.customerError}
          isSubmitting={isSubmitting}
        />

        <div className="flex w-full gap-3 justify-between">
          {payOptions.map((opt, index) => (
            <Button
              onClick={() => {
                if (activeOption !== opt.name)
                  setActiveOption(opt.name as TPaymentMethod);
                if (opt.name === "Credit") {
                  setPaymentPortionAmount(0);
                  setPaymentPortion("Credit Payment");
                }
              }}
              key={index}
              className={`flex flex-1 rounded-sm text-white border-2 border-transparent ${
                activeOption === opt.name &&
                "bg-subbase border-white hover:bg-subbase hover:text-white"
              }`}
              variant={"ghost"}
            >
              {opt.icon} {opt.name}
            </Button>
          ))}
        </div>
        {activeOption !== "Credit" && (
          <div className="flex w-full gap-3 justify-between">
            {paymentPortionOptions.map((opt, index) => (
              <Button
                onClick={() => {
                  if (paymentPortion !== opt.name) setPaymentPortion(opt.name);
                }}
                key={index}
                className={`flex flex-1 rounded-sm text-white border-2 border-transparent ${
                  paymentPortion === opt.name &&
                  "bg-subbase border-white hover:bg-subbase hover:text-white"
                }`}
                variant={"ghost"}
              >
                {opt.icon} {opt.name}
              </Button>
            ))}

            <>
              {paymentPortion === "Advance Payment" && (
                <Input
                  className={`${
                    error.paymentPortionAmountError && !paymentPortionAmount
                      ? "border-destructive focus:border-destructive bg-white text-black"
                      : "border-white focus:border-white bg-subbase text-white"
                  } w-[80px] border-2  font-semibold `}
                  value={paymentPortionAmount === 0 ? "" : paymentPortionAmount}
                  inputMode="decimal"
                  onChange={(e) => {
                    const value = e.target.value;
                    setPaymentPortionAmount(
                      value === "" ? 0 : parseFloat(value),
                    );
                  }}
                />
              )}
            </>
          </div>
        )}

        <div className="flex gap-3 rounded-sm w-full">
          <Button
            variant={"ghost"}
            className={`shadow-lg flex justify-center items-center rounded-sm bg-transparent border-transparent hover:bg-white hover:text-black px-4 py-1 gap-2 text-white border-2 ${
              (remoteOrder || deliveryfee) && "bg-subbase  border-white"
            }`}
            onClick={() => setRemoteOrder(!remoteOrder)}
          >
            <MapPin className="size-[20px]" />
          </Button>

          {remoteOrder && (
            <Input
              className={`${
                error.deliveryfeeError && !deliveryfee
                  ? "border-destructive focus:border-destructive bg-white text-black"
                  : "border-white focus:border-white bg-subbase text-white"
              } w-[80px] border-2 font-semibold `}
              value={deliveryfee === 0 ? "" : deliveryfee}
              inputMode="decimal"
              onChange={(e) => {
                const value = e.target.value;
                setDeliveryfee(value === "" ? 0 : parseFloat(value));
              }}
            />
          )}

          <div className="bg-white text-base w-full rounded-sm px-2 py-1 gap-2 flex justify-between items-center">
            <div> Total :</div>
            <div className="font-semibold">
              Rs. {(total + deliveryfee).toFixed(2)}
            </div>
          </div>
        </div>
        <Button
          disabled={isSubmitting}
          className={` ${
            orderType?.editMode
              ? "bg-white hover:bg-white text-subbase border-superbase"
              : "bg-subbase hover:bg-subbase text-white"
          } shadow-lg border-2 flex justify-center items-center rounded-sm px-4 py-1 gap-2`}
          onClick={handlePayNow}
        >
          {isSubmitting ? (
            <LoaderBtn loadertext="Processing ..." />
          ) : (
            <>
              <MousePointer2 className="size-[20px] rotate-90" />
              {orderType?.editMode ? "Edit Now" : " Pay Now"}
            </>
          )}
        </Button>
      </div>
      {invoiceData && (
        <div className="hidden">
          <TipWrapper triggerText="Print">
            <Button
              className="size-10 rounded-sm xs:text-base text-xs absolute right-5 bottom-5"
              onClick={handlePrint}
            >
              <Printer className="xs:size-[18px] size-[14px]" />
            </Button>
          </TipWrapper>

          <div className="relative">
            <div className="z-20 absolute right-5 top-5 rounded-full size-[20px] bg-superbase shadow-md" />
            <div ref={contentRef}>
              <ModInvoice data={invoiceData} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartCard;
