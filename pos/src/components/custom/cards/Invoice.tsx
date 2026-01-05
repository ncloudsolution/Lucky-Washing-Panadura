import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { SoftwareOwner, TMetric, TOrderStatus, TPaymentMethod } from "@/data";
import { formatDate } from "@/utils/common";
import React from "react";

export interface IInvoice {
  baseData: {
    id: string;
    invoiceId: number;
    createdAt: string;
    saleValue: number;
    deliveryfee: number | null;
    paymentMethod: TPaymentMethod;
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

const Invoice = ({
  data,
  mini = false,
}: {
  data: IInvoice;
  mini?: boolean;
}) => {
  const total =
    (Number(data.baseData.saleValue) || 0) +
    (Number(data.baseData.deliveryfee) || 0);

  const totalRegularPriceing = data.items.reduce((total, item) => {
    const itemTotal = item.variations.reduce((sum, v) => {
      return sum + v.regularPrice * v.quantity;
    }, 0);
    return total + itemTotal;
  }, 0);

  console.log(data);

  const [date, time] = formatDate(data.baseData.createdAt);
  return (
    <Card
      className={`z-10 flex flex-col border-superbase shadow-xl print:border-primary print:shadow-none print:rounded-none items-center ${
        !mini && "xs:min-w-[400px] xs:p-6"
      }  min-w-full relative xs:p-4 p-4`}
    >
      <div className="flex flex-col gap-[2px] items-center mb-4">
        <CardTitle>{data.baseData.business}</CardTitle>
        <CardDescription className="print:text-primary print:text-xs text-center">
          {data.baseData.address}
        </CardDescription>
        <CardDescription className="text-primary">
          {data.baseData.hotlines.join(", ")}
        </CardDescription>
      </div>
      <div className="w-full h-[2px] bg-primary" />

      <div
        className={`flex w-full justify-between ${
          mini ? "xs:text-[10px]" : "xs:text-xs"
        } text-[10px] py-2`}
      >
        <div className="flex gap-2">
          <div className="flex flex-col">
            <div>Branch</div>
            <div className="font-semibold">{data.baseData.branch}</div>
          </div>
          <div className="h-full w-[1px] bg-primary" />
          <div className="flex flex-col items-center">
            <div>Counter</div>
            <div className="font-semibold">{data.baseData.counterNo}</div>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="h-full w-[1px] bg-primary border-dashed" />
          <div className="flex flex-col items-center">
            Invoice No
            <span className="font-semibold"> {data.baseData.invoiceId}</span>
          </div>
        </div>
      </div>

      <div className="w-full h-[2px] bg-primary" />
      <div
        className={`flex flex-col w-full ${
          mini ? "xs:text-[10px]" : "xs:text-[13px]"
        } text-[10px] pt-4 pb-2`}
      >
        {/* Header */}
        <div className="flex font-semibold pb-1 gap-1">
          <div className="flex-1 text-left">Product</div>
          <div className="w-[50px] xs:w-[60px] text-right">U.Price</div>
          <div
            className={`${
              mini ? "xs:w-[40px]" : "xs:w-[50px]"
            } w-[30px] text-center`}
          >
            Qty
          </div>
          <div
            className={`${
              mini ? "xs:w-[50px]" : "xs:w-[60px]"
            } w-[50px]  text-right`}
          >
            Amount
          </div>
        </div>

        {/* Rows */}
        <div className="gap-[2px] flex flex-col">
          {data.items.map((it, in1) =>
            it.variations.map((v, in2) => (
              <div key={`${in1}-${in2}`} className="flex text-center gap-1">
                <div className="flex-1 text-left">
                  {it.name}{" "}
                  {v.variation && v.variation.Name && `- ${v.variation.Name}`}
                </div>
                <div
                  className={`${
                    mini ? "xs:w-[50px]" : "xs:w-[60px]"
                  } w-[40px] relative text-right `}
                >
                  {new Intl.NumberFormat("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(v.sellingPrice)}
                  {v.sellingPrice !== v.regularPrice && (
                    <div
                      className={`text-muted-foreground print:text-primary line-through text-[7px] ${
                        mini
                          ? "xs:text-[7px] xs:top-[10px]"
                          : "xs:text-[9px] xs:top-[14px]"
                      } text-right absolute top-[10px] right-0 `}
                    >
                      {new Intl.NumberFormat("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(v.regularPrice)}
                    </div>
                  )}
                </div>

                <div
                  className={`${
                    mini ? "xs:w-[40px]" : "xs:w-[50px]"
                  } text-center w-[30px]`}
                >
                  {v.quantity} {it.metric !== "None" && it.metric}
                </div>
                <div
                  className={`w-[50px] ${
                    mini ? "xs:w-[50px]" : "xs:w-[60px]"
                  }  text-right`}
                >
                  {new Intl.NumberFormat("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(v.sellingPrice * v.quantity)}
                </div>
              </div>
            ))
          )}
        </div>

        {data.baseData.deliveryfee && (
          <div className="flex justify-between font-semibold">
            <div>Delivery Charge</div>
            <div>
              {new Intl.NumberFormat("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(data.baseData.deliveryfee)}
            </div>
          </div>
        )}

        <div className="w-full h-[2px] bg-primary my-2" />
        <div className="flex justify-between font-semibold text-lg font-saira">
          <div className="text-lg">TOTAL</div>
          <div>
            {new Intl.NumberFormat("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(total)}
          </div>
        </div>

        <div className="flex justify-between font-saira text-sm leading-[16px] font-semibold">
          <div>Discount Received</div>
          <div>
            {new Intl.NumberFormat("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(totalRegularPriceing - data.baseData.saleValue)}
          </div>
        </div>

        <div className="flex flex-col py-4 border-b-1 border-dashed border-primary">
          <div className="flex justify-between leading-[17px]">
            Payment Mode <span>{data.baseData.paymentMethod}</span>
          </div>
          <div className="flex justify-between leading-[17px]">
            Status <span>{data.baseData.status}</span>
          </div>
          <div className="flex justify-between leading-[17px]">
            Date & Time
            <span className="flex gap-2">
              <span>{date}</span>
              <span>{time}</span>
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center pt-3">
          <div>Thank you come again</div>
          <div className="flex gap-1.5">
            Powerd by
            <span className="font-semibold">{SoftwareOwner.businessName}</span>
            {SoftwareOwner.websitite}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default Invoice;
