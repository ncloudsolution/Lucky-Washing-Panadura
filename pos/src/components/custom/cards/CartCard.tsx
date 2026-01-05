"use client";
import { Button } from "@/components/ui/button";
import {
  CircleDollarSign,
  CircleQuestionMark,
  CreditCard,
  FileText,
  Hand,
  Landmark,
  MapPin,
  MousePointer2,
  Printer,
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  cachedb,
  clearCurrentCustomer,
  clientPrimaryKey,
  getCurrentCustomer,
  getExportReadyCacheCart,
  getLastEbillId,
  getOrderType,
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
} from "@/data";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TipWrapper } from "../wrapper/TipWrapper";
import { IInvoice } from "./Invoice";
import { useReactToPrint } from "react-to-print";
import NewInvoice from "./NewInvoice";

const CartCard = () => {
  const queryClient = useQueryClient();
  const products = useLiveQuery(() => cachedb.cartItem.toArray(), []);
  const structuredProducts = transformCartData(products ?? []);
  const [activeOption, setActiveOption] = useState("Cash");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invoiceData, setInvoiceData] = useState<IInvoice>();

  const orderType = useLiveQuery(async () => {
    return getOrderType();
  }, []);

  console.log(orderType);

  // compute total price live
  // const total = (products ?? []).reduce((sum, item) => {
  //   return sum + item.unitPrice * item.quantity;
  // }, 0);

  const [lastEbillId, setLastEbillId] = useState<string | null>(null);

  // Fetch once on mount and whenever we manually trigger refresh
  useEffect(() => {
    const fetchLastEbill = async () => {
      const id = await getLastEbillId();
      setLastEbillId(id ?? null);
    };
    fetchLastEbill();
  }, []);

  useEffect(() => {
    if (invoiceData && contentRef.current) {
      console.log(invoiceData, "data inside effect");
      setTimeout(() => {
        handlePrint();
      }, 500);
    }
  }, [invoiceData]);

  useEffect(() => {
    const fetchDeliveryAndOption = async () => {
      const id = await getLastEbillId();
      setActiveOption(orderType?.edCustomerPaymentMethod ?? "Cash");
      setDeliveryfee(orderType?.edDeliveryfee ?? 0);
      setRemoteOrder(Number(orderType?.edDeliveryfee) > 0);
    };
    fetchDeliveryAndOption();
  }, [orderType]);

  // Helper to refresh the value after submit
  const refreshLastEbill = async () => {
    const id = await getLastEbillId();
    setLastEbillId(id ?? null);
  };

  const total = useLiveQuery(() => getTotalFromCacheCart(), [], 0);

  const [remoteOrder, setRemoteOrder] = useState(false);
  const [deliveryfee, setDeliveryfee] = useState(0);
  const initialErrorState = {
    customerError: false,
    deliveryfeeError: false,
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

  const { data: session, status } = useSession();
  const currentCustomer = useLiveQuery(() => getCurrentCustomer(), []);
  console.log(currentCustomer);

  const handlePayNow = async () => {
    const start = performance.now();
    setIsSubmitting(true);

    const newErrorState = { ...initialErrorState };

    if (deliveryfee === 0 && remoteOrder) {
      newErrorState.deliveryfeeError = true;
    }

    if (!currentCustomer) {
      newErrorState.customerError = true;
      toast.error("Customer Required for Order");
    }

    if (newErrorState.deliveryfeeError || newErrorState.customerError) {
      setError(newErrorState);
      setIsSubmitting(false);
      toast.error("Delivery fee should include the order");
      return;
    }

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
        branch: session?.user.branch,
        paymentMethod: activeOption,
        saleValue: total,
        ...(remoteOrder ? { deliveryfee } : {}),
        //invoiceId - auto increament -- should include
        //customerIp,additionalMobile,ShippingAddress
        status: remoteOrder ? "Processing" : "Delivered",
        //createdAt - auto created -- should include
      },
      orderItems: products, //array
      //id, - auto created
      //customerId, -- should include --loop through id from mobile
    };

    try {
      const res = await BasicDataFetch({
        // Added await here
        method: orderType?.editMode ? "PUT" : "POST",
        endpoint: "/api/orders",
        data: data,
      });

      const end = performance.now();
      const responseTimeMs = end - start;

      // res already contains parsed JSON from BasicDataFetch
      toast.success(`${res.message} in ${(responseTimeMs / 1000).toFixed(2)}s`);

      await removeAllFromCacheCart();
      await setClientEditMode(false);
      setDeliveryfee(0);
      setRemoteOrder(false);
      setActiveOption("Cash");

      if (!globalDefaultCustomer.enable) {
        await clearCurrentCustomer();
      }

      //update lastest orders
      if (orderType?.editMode) {
        queryClient.invalidateQueries({
          queryKey: ["latest-order-metas"],
        });
      } else {
        const ebillData = defaultPrint ? res.data.baseData : res.data;
        console.log(ebillData.id, "bill id");
        await updateLastEbillId(ebillData.id);
        await refreshLastEbill();

        if (defaultPrint) {
          console.log(res.data, "order back data");
          setInvoiceData(res.data);
          //...
        }

        queryClient.setQueryData(
          ["latest-order-metas"],
          (oldData?: IOrderMeta[]) => {
            const oldArray = oldData ?? [];
            console.log(oldArray, "old array");
            console.log(res.data.newOrder, "new resp");
            const updated = [res.data.newOrder, ...oldArray];
            console.log(updated, "updated array");
            return updated.slice(0, 10); // limit list if needed
          }
        );
      }

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
                if (activeOption !== opt.name) setActiveOption(opt.name);
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

        <div className="flex gap-3 rounded-sm w-full">
          <Button
            variant={"ghost"}
            className={`shadow-lg flex justify-center items-center rounded-sm bg-transparent border-transparent hover:bg-subbase hover:text-white px-4 py-1 gap-2 text-white border-2 ${
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
                  ? "border-destructive focus:border-destructive"
                  : "border-white focus:border-white bg-subbase"
              } w-[80px] border-2 text-white font-semibold `}
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
              <NewInvoice data={invoiceData} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartCard;
