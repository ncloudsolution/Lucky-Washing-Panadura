import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  productData,
  sinhalaBill,
  SoftwareOwner,
  TMetric,
  TOrderStatus,
  TPaymentMethod,
} from "@/data";
import { formatDate } from "@/utils/common";
import React from "react";
import { singlishToUnicode } from "sinhala-unicode-coverter";

export interface IInvoice {
  baseData: {
    id: string;
    invoiceId: string;
    createdAt: string;
    saleValue: number;
    deliveryfee: number | null;
    paymentMethod: TPaymentMethod;
    paymentAmount: number;
    incomeCategory: string;
    status: TOrderStatus;
    business: string;
    branch: string;
    address: string;
    hotlines: string[];
    operator: string;
    counterNo: number;
    customer: string;
    customerMobile: string;
    customerCreatedAt: string;
  };
  items: {
    metaId: string;
    name: string;
    metric: TMetric;
    variations: {
      id: string;
      variation: Record<string, string | number> | null;
      regularPrice: number;
      sellingPrice: number;
      quantity: number;
    }[];
  }[];
}

const ModInvoice = ({
  data,
  mini = false,
}: {
  data: IInvoice;
  mini?: boolean;
}) => {
  const headings = {
    BRANCH: sinhalaBill ? singlishToUnicode("shaKaawa") : "Branch",
    COUNTER: sinhalaBill ? singlishToUnicode("kawuLuwa") : "Counter",
    INVOICE_NO: sinhalaBill
      ? singlishToUnicode("bilpath a\\nkaya")
      : "Invoice No",
    QUANTITY: sinhalaBill ? singlishToUnicode("pramaaNaya") : "Quantity",
    MARKED_PRICE: sinhalaBill
      ? singlishToUnicode("sanndhahan mila")
      : "Marked Price",
    SELLING_PRICE: sinhalaBill ? singlishToUnicode("apea mila") : "Our Price",
    UNIT_SUM_PRICE: sinhalaBill ? singlishToUnicode("ekathuwa") : "Total",
    TOTAL_SUM_PRICE: sinhalaBill ? singlishToUnicode("muLu ekathuwa") : "Total",
    DISCOUNT: sinhalaBill
      ? singlishToUnicode("obea laabhaya")
      : "Discount Received",
    DELIVERY: sinhalaBill
      ? singlishToUnicode("prawaahana gaasthu")
      : "Delivery Charge",
    INITIAL_PAYMENT_MODE: sinhalaBill
      ? singlishToUnicode("praThama gewum maaDhYa")
      : "Initial Payment Mode",
    PAYMENT_TYPE: sinhalaBill
      ? singlishToUnicode("gewiim wargaya")
      : "Payment Type",
    PAID_AMOUNT: sinhalaBill
      ? singlishToUnicode("gewuu mudhala")
      : "Paid Amount",
    PAYMENT_BALANCE: sinhalaBill
      ? singlishToUnicode("hinnga mudhala")
      : "Balance Payment",
    STATUS: sinhalaBill
      ? singlishToUnicode("ANawumea thathwaya")
      : "Order Status",
    DATE_TIME: sinhalaBill
      ? singlishToUnicode("dhinaya haa wealaawa")
      : "Date & Time",
  };

  const paymentModValue = (x: TPaymentMethod) => {
    switch (x) {
      case "Cash":
        return sinhalaBill ? singlishToUnicode("mudhal") : x;
      case "Card":
        return sinhalaBill ? singlishToUnicode("kaadpath") : x;
      case "Bank":
        return sinhalaBill ? singlishToUnicode("bAnku") : x;
      case "Credit":
        return sinhalaBill ? singlishToUnicode("Naya") : x;
    }
  };
  const statusModValue = (x: TOrderStatus) => {
    switch (x) {
      case "Delivered":
        return sinhalaBill ? singlishToUnicode("baara dhi Atha") : x;
      case "Processing":
        return sinhalaBill ? singlishToUnicode("sakas karamin pawathii") : x;
      case "Shipped":
        return sinhalaBill ? singlishToUnicode("yawaa Atha") : x;
      case "Cancelled":
        return sinhalaBill ? singlishToUnicode("awala\\nguyi") : x;
      case "Returned":
        return sinhalaBill ? singlishToUnicode("aapasu lAbi Atha") : x;
    }
  };

  const total =
    (Number(data.baseData.saleValue) || 0) +
    (Number(data.baseData.deliveryfee) || 0);

  const totalRegularPriceing = data.items.reduce((total, item) => {
    const itemTotal = item.variations.reduce((sum, v) => {
      return sum + v.regularPrice * v.quantity;
    }, 0);
    return total + itemTotal;
  }, 0);

  const [date, time] = formatDate(data.baseData.createdAt);
  return (
    <Card
      className={`z-10 flex flex-col border-superbase shadow-xl print:border-primary print:shadow-none print:rounded-none items-center print:px-2 ${
        !mini && "xs:min-w-[400px] xs:p-6"
      } xxxs:w-[320px] min-w-full relative xs:p-4 p-4`}
    >
      <div className="flex flex-col gap-[2px] items-center mb-4">
        <CardTitle className="text-5xl leading-[40px]">
          {data.baseData.invoiceId}
        </CardTitle>
        <span className="text-[10px]">{headings.INVOICE_NO}</span>
        {/* <CardDescription className="print:text-primary print:text-xs text-center">
          {data.baseData.address}
        </CardDescription>
        {data.baseData.hotlines && (
          <CardDescription className="text-primary">
            {data.baseData.hotlines.join(", ")}
          </CardDescription>
        )} */}
      </div>
      {/* <div className="w-full h-[2px] bg-primary" /> */}

      {/* <div
        className={`flex w-full justify-between ${
          mini ? "xs:text-[10px]" : "xs:text-xs"
        } text-[10px] py-2`}
      >
        <div className="flex gap-2">
          <div className="flex flex-col">
            <div>{headings.BRANCH}</div>
            <div className="font-semibold">{data.baseData.branch}</div>
          </div>
          <div className="h-full w-[1px] bg-primary" />
          <div className="flex flex-col items-center">
            <div>{headings.COUNTER}</div>
            <div className="font-semibold">{data.baseData.counterNo}</div>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="h-full w-[1px] bg-primary border-dashed" />
          <div className="flex flex-col items-center">
            {headings.INVOICE_NO}
            <span className="font-semibold">{data.baseData.invoiceId}</span>
          </div>
        </div>
      </div> */}

      {/* <div className="w-full h-[2px] bg-primary" /> */}
      <div
        className={`flex flex-col w-full ${
          mini ? "xs:text-[10px]" : "xs:text-[13px]"
        } text-[10px] pt-0 pb-2`}
      >
        {/* Header */}
        <div className="flex flex-1 font-medium pb-1 border-dashed border-black border-b-2 gap-1">
          <div className="w-full text-left">{headings.QUANTITY}</div>
          <div className="w-full text-center">{headings.MARKED_PRICE}</div>
          <div className={`w-full text-center`}>{headings.SELLING_PRICE}</div>
          <div className={`w-full text-right`}>{headings.UNIT_SUM_PRICE}</div>
        </div>

        {/* Rows */}
        <div className="gap-1 pt-2 pb-2 flex flex-col">
          {data.items.map((it, in1) =>
            it.variations.map((v, in2) => (
              <div key={`${in1}-${in2}`} className="flex flex-col text-center ">
                <div className="flex-1 text-left text-[13px] font-sinhalaNato font-bold">
                  {it.name !== "TEMPORARY PRODUCTS" && it.name}
                  {it.name !== "TEMPORARY PRODUCTS" &&
                    v.variation &&
                    v.variation.Name &&
                    " - "}
                  {v.variation && v.variation.Name && ` ${v.variation.Name}`}
                </div>
                <div className="flex flex-1 gap-1 text-[13px]">
                  <div
                    className={`text-center w-full text-[18px] leading-[18px] font-medium`}
                  >
                    {v.quantity} {it.metric !== "None" && it.metric}
                  </div>

                  <div className={`text-center w-full`}>
                    {new Intl.NumberFormat("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(v.regularPrice)}
                  </div>

                  <div className={`text-center w-full`}>
                    {new Intl.NumberFormat("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(v.sellingPrice)}
                  </div>

                  <div className={`w-full text-right`}>
                    {new Intl.NumberFormat("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(v.sellingPrice * v.quantity)}
                  </div>
                </div>
              </div>
            )),
          )}

          {data.baseData.deliveryfee && (
            <div className="flex justify-between font-semibold text-[13px]">
              <div>{headings.DELIVERY}</div>
              <div>
                {new Intl.NumberFormat("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(data.baseData.deliveryfee)}
              </div>
            </div>
          )}
        </div>

        <div className="w-full h-[2px] bg-primary mb-2" />
        <div className="flex justify-between font-semibold text-lg font-saira">
          <div className="text-lg">{headings.TOTAL_SUM_PRICE}</div>
          <div>
            {new Intl.NumberFormat("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(total)}
          </div>
        </div>

        <div className="flex justify-between font-saira text-sm leading-[16px] font-semibold">
          <div>{headings.DISCOUNT}</div>
          <div>
            {new Intl.NumberFormat("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(totalRegularPriceing - data.baseData.saleValue)}
          </div>
        </div>

        <div className="flex flex-col py-4 border-b-1 border-dashed border-primary text-[12px]">
          <div className="flex justify-between leading-[17px]">
            {headings.INITIAL_PAYMENT_MODE}
            <span>{paymentModValue(data.baseData.paymentMethod)}</span>
          </div>
          <div className="flex justify-between leading-[17px]">
            {headings.PAYMENT_TYPE}
            <span>{data.baseData.incomeCategory}</span>
          </div>
          <div className="text-sm font-saira flex justify-between leading-[17px] font-semibold">
            {headings.PAID_AMOUNT}
            <span>
              {new Intl.NumberFormat("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(data.baseData.paymentAmount)}
            </span>
          </div>
          <div className="text-sm font-saira flex justify-between leading-[17px] font-semibold">
            {headings.PAYMENT_BALANCE}
            <span>
              {new Intl.NumberFormat("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(
                Number(data.baseData.saleValue) +
                  Number(data.baseData.deliveryfee ?? 0) -
                  Number(data.baseData.paymentAmount),
              )}
            </span>
          </div>
          <div className="flex justify-between leading-[17px] mt-4">
            {headings.STATUS}{" "}
            <span>{statusModValue(data.baseData.status)}</span>
          </div>
          <div className="flex justify-between leading-[17px]">
            {headings.DATE_TIME}
            <span className="flex gap-2">
              <span>{date}</span>
              <span>{time}</span>
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center pt-3">
          <div>
            {data.baseData.business} - {data.baseData.branch}
          </div>
          {/* <div>Thank you come again</div> */}
          <div className="flex gap-1.5">
            Powerd by
            <span className="font-semibold">{SoftwareOwner.businessName}</span>
            {productData.contact.shortweb}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ModInvoice;
