"use client";
import { LoaderBtn } from "@/components/custom/buttons/LoaderBtn";
import NoRecordsCard from "@/components/custom/cards/NoRecordsCard";
import { AddNewDialog } from "@/components/custom/dialogs/AddNewDialog";
import { CustomDialog } from "@/components/custom/dialogs/CustomDialog";
import { ExportDialog } from "@/components/custom/dialogs/ExportDialog";
import FormStateChange from "@/components/custom/forms/FormStateChange";
import { DatePickerWithRange } from "@/components/custom/inputs/DatePickerWithRange";
import { SelectOnSearch } from "@/components/custom/inputs/SelectOnSearch";
import ViewAccessChecker from "@/components/custom/other/AccessChecker";
import { OrderSheet } from "@/components/custom/other/OrderSheet";
import ListSkeleton from "@/components/custom/skeleton/ListSkeleton";
import TextSkeleton from "@/components/custom/skeleton/TextSkeleton";
import { TipWrapper } from "@/components/custom/wrapper/TipWrapper";
import { Button } from "@/components/ui/button";
import { FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { orderStatus, PaymentMethod } from "@/data";
import { IOrderMeta } from "@/data";
import {
  cachedb,
  clientPrimaryKey,
  editInvoice,
  setClientEditMode,
  setCurrentCustomer,
} from "@/data/dbcache";
import { posFrontend } from "@/data/frontendRoutes";
import { T_Role } from "@/data/permissions";
import { useDebounce } from "@/hooks/useDebounce";
import { BasicDataFetch, formatDate } from "@/utils/common";
import { AlertDialogAction } from "@radix-ui/react-alert-dialog";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  BadgeCheck,
  Check,
  CheckCheck,
  CircleCheck,
  CircleX,
  Coins,
  HandCoins,
  Home,
  MapPin,
  NotebookPen,
  Pencil,
  RefreshCw,
  Repeat,
  Sheet,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { DateRange } from "react-day-picker";
import { toast } from "sonner";
import * as XLSX from "xlsx-js-style";

export function getTodayRange(date: Date) {
  const from = new Date(date);
  from.setHours(0, 0, 0, 0);

  const to = new Date(date);
  to.setHours(23, 59, 59, 999);

  return { from, to };
}

const AllOrders = () => {
  const [dates, setDates] = React.useState<DateRange | undefined>(
    //     {
    //     //  from: new Date(new Date().getFullYear(), 0, 1),
    //     from: new Date(),
    //     to: new Date(),
    //     // to: addDays(new Date(new Date().getFullYear(), 0, 20), 20),  //(Jan 20 + 20 days)
    //   }
    getTodayRange(new Date()),
  );
  console.log(dates);
  const [paymentStatus, setPaymentStatus] = useState("All");
  const [odStatus, setOdStatus] = useState("All");
  const { data: session } = useSession();
  const role = session?.user.role.toLowerCase();
  const [query, setQuery] = useState(session?.user.counterNo ?? "01");

  const debouncedQuery = useDebounce(query);
  const disableDefaultFilters = debouncedQuery.length > 2;

  const {
    data: orderMetas,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["all-orders", dates],
    queryFn: async () => {
      const response = await BasicDataFetch({
        method: "GET",
        endpoint: `/api/orders?from=${dates?.from}&to=${dates?.to}`,
      });
      // Return only the data array - this is what gets cached
      return response?.data as IOrderMeta[];
    },

    staleTime: 1000 * 60 * 5,
  });

  const { data: orderMetasDebounce, isLoading: isLoadingDebounce } = useQuery({
    queryKey: ["order-debounce", debouncedQuery],
    queryFn: () =>
      BasicDataFetch({
        method: "GET",
        endpoint: `/api/orders?debounce=${debouncedQuery}`,
      }),
    select: (response) => response?.data as IOrderMeta[],
    staleTime: 1000 * 60 * 5,
    enabled: disableDefaultFilters, // Only fetch when 'search' is truthy
  });

  console.log(error);
  const filteredOrders = React.useMemo(() => {
    // When searching (>=3 chars)
    if (disableDefaultFilters) {
      return orderMetasDebounce ?? [];
    }

    // Default filtering
    if (!orderMetas) return [];

    return orderMetas.filter((i) => {
      const due =
        Number(i?.saleValue ?? 0) +
        Number(i?.deliveryfee ?? 0) -
        Number(i?.paymentAmount ?? 0);

      const paymentMatch =
        paymentStatus === "All" ||
        (paymentStatus === "Settled" && due === 0) ||
        (paymentStatus === "Outstanding" && due > 0);

      const statusMatch = odStatus === "All" || odStatus === i.status;

      return paymentMatch && statusMatch;
    });
  }, [
    orderMetas,
    orderMetasDebounce,
    paymentStatus,
    odStatus,
    disableDefaultFilters,
  ]);

  const handleExport = () => {
    if (filteredOrders.length === 0) {
      return toast.error("No data to export");
    }

    const purifiedData = filteredOrders.map((i) => {
      const dateObj = new Date(i.createdAt); // make sure it's a Date
      const date = dateObj.toLocaleDateString("en-CA"); // YYYY-MM-DD
      const time = dateObj.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }); // HH:MM

      return {
        invoiceId: i.invoiceId,
        branch: i.branch,
        status: i.status,
        saleValue: Number(i.saleValue),
        outstanding:
          Number(i.saleValue) +
          Number(i.deliveryfee ?? 0) -
          Number(i.paymentAmount),
        deliveryfee: Number(i.deliveryfee),
        createdAt: `${date} ${time}`,
      };
    });

    const STATUS_STYLES: Record<string, { bg: string; whiteText: boolean }> = {
      Delivered: { bg: "1A54DA", whiteText: true },
      Packed: { bg: "2F8F5A", whiteText: false },
      Processing: { bg: "F4C430", whiteText: false },
      Shipped: { bg: "FFA500", whiteText: false },
      Cancelled: { bg: "E34A2F", whiteText: true },
      Returned: { bg: "D3D3D3", whiteText: false },
    };

    const SALEVALUE_STYLES: Record<string, { bg: string; whiteText: boolean }> =
      {
        true: { bg: "1A54DA", whiteText: true },
        false: { bg: "E34A2F", whiteText: true },
      };

    const OUTSTANDING_STYLES: Record<
      string,
      { bg: string; whiteText: boolean }
    > = {
      true: { bg: "FFB3B3", whiteText: false },
    };

    const formatDate = (date: Date) => date.toISOString().split("T")[0];
    const from = formatDate(dates?.from as Date);
    const to = formatDate(dates?.to as Date);

    const workBook = XLSX.utils.book_new();
    const workSheet = XLSX.utils.json_to_sheet(purifiedData);
    const range = XLSX.utils.decode_range(workSheet["!ref"]!);

    for (let R = 1; R <= range.e.r; ++R) {
      for (let C = 0; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });

        if (!workSheet[cellAddress]) continue;

        workSheet[cellAddress].s = {
          alignment: { horizontal: "center" },
        };
      }
    }

    const headers = Object.keys(purifiedData[0]);
    const statusColIndex = headers.indexOf("status");
    const saleValueColIndex = headers.indexOf("saleValue");
    const outstandingColIndex = headers.indexOf("outstanding");

    if (statusColIndex !== -1) {
      const statusColLetter = XLSX.utils.encode_col(statusColIndex);

      purifiedData.forEach((order, rowIndex) => {
        const cellAddress = `${statusColLetter}${rowIndex + 2}`;
        const status = order.status as string;
        const style = STATUS_STYLES[status];

        if (style && workSheet[cellAddress]) {
          workSheet[cellAddress].s = {
            fill: {
              patternType: "solid",
              fgColor: { rgb: style.bg },
            },
            font: {
              bold: true,
              ...(style.whiteText && { color: { rgb: "FFFFFF" } }),
            },
            alignment: {
              horizontal: "center",
            },
          };
        }
      });

      // const headerCell = `${statusColLetter}1`;
      // if (workSheet[headerCell]) {
      //   workSheet[headerCell].s = {
      //     font: { bold: true },
      //     alignment: { horizontal: "center" },
      //   };
      // }
    }

    if (saleValueColIndex !== -1) {
      const saleValueColLetter = XLSX.utils.encode_col(saleValueColIndex);

      purifiedData.forEach((order, rowIndex) => {
        const cellAddress = `${saleValueColLetter}${rowIndex + 2}`;
        const outstanding = order.outstanding as number;
        const style = SALEVALUE_STYLES[String(outstanding === 0)];

        if (style && workSheet[cellAddress]) {
          workSheet[cellAddress].s = {
            fill: {
              patternType: "solid",
              fgColor: { rgb: style.bg },
            },
            font: {
              bold: true,
              ...(style.whiteText && { color: { rgb: "FFFFFF" } }),
            },
            alignment: {
              horizontal: "center",
            },
          };
        }
      });

      // const headerCell = `${saleValueColLetter}1`;
      // if (workSheet[headerCell]) {
      //   workSheet[headerCell].s = {
      //     font: { bold: true },
      //     alignment: { horizontal: "center" },
      //   };
      // }
    }

    if (outstandingColIndex !== -1) {
      const outstandingColLetter = XLSX.utils.encode_col(outstandingColIndex);

      purifiedData.forEach((order, rowIndex) => {
        const cellAddress = `${outstandingColLetter}${rowIndex + 2}`;
        const outstanding = order.outstanding as number;

        if (outstanding <= 0) return; // ✅ skip coloring if no outstanding

        const style = OUTSTANDING_STYLES[String(outstanding > 0)];
        if (style && workSheet[cellAddress]) {
          workSheet[cellAddress].s = {
            fill: {
              patternType: "solid",
              fgColor: { rgb: style.bg },
            },
            font: {
              bold: true,
              ...(style.whiteText && { color: { rgb: "FFFFFF" } }),
            },
            alignment: {
              horizontal: "center",
            },
          };
        }
      });

      // const headerCell = `${statusColLetter}1`;
      // if (workSheet[headerCell]) {
      //   workSheet[headerCell].s = {
      //     font: { bold: true },
      //     alignment: { horizontal: "center" },
      //   };
      // }
    }

    //column width
    workSheet["!cols"] = headers.map(() => ({ wch: 20 }));

    // Convert to Excel Table
    workSheet["!autofilter"] = { ref: workSheet["!ref"]! };

    const tableRef = workSheet["!ref"]!;
    workSheet["!tables"] = [
      {
        ref: tableRef,
        name: "OrdersTable",
        displayName: "OrdersTable",
        headerRowCount: 1,
        totalsRowCount: 0,
        tableStyleInfo: {
          name: "TableStyleMedium2", // Excel built-in table style
          showFirstColumn: false,
          showLastColumn: false,
          showRowStripes: true,
          showColumnStripes: false,
        },
      },
    ];

    // Style header row
    headers.forEach((_, colIndex) => {
      const headerCell = XLSX.utils.encode_cell({ r: 0, c: colIndex });
      if (workSheet[headerCell]) {
        workSheet[headerCell].s = {
          fill: { patternType: "solid", fgColor: { rgb: "1E1E2D" } },
          font: { bold: true, color: { rgb: "FFFFFF" } },
          alignment: { horizontal: "center" },
        };
      }
    });

    XLSX.utils.book_append_sheet(workBook, workSheet, "Orders Sheet");
    XLSX.writeFile(workBook, `Orders---${from}---${to}.xlsx`);

    toast.success("Data exported successfully");
  };

  return (
    <div className="flex flex-col h-full w-full min-w-7xl text-sm overflow-x-auto no-scrollbar">
      <div className="w-full flex justify-between">
        <div className="flex w-fit gap-8 mb-5 items-end">
          <DatePickerWithRange
            date={dates}
            setDate={setDates}
            isLoading={isLoading || isLoadingDebounce || disableDefaultFilters}
          />

          <div className="flex w-full flex-col gap-1.5">
            <FieldLabel htmlFor="date-picker-range">
              Search By Payment Status
            </FieldLabel>

            <SelectOnSearch
              isLoading={
                isLoading || isLoadingDebounce || disableDefaultFilters
              }
              icon={<Coins className="text-white" size={18} />}
              selections={["All", "Settled", "Outstanding"]}
              value={paymentStatus}
              onValueChange={(value) => {
                setPaymentStatus(value);
                // setSearch("");
              }}
            />
          </div>

          <div className="flex w-full flex-col gap-1.5">
            <FieldLabel htmlFor="date-picker-range">
              Search By Order Status
            </FieldLabel>

            <SelectOnSearch
              isLoading={
                isLoading || isLoadingDebounce || disableDefaultFilters
              }
              icon={<NotebookPen className="text-white" size={18} />}
              selections={["All", ...orderStatus]}
              value={odStatus}
              onValueChange={(value) => {
                setOdStatus(value);
                // setSearch("");
              }}
            />
          </div>

          <div className="flex w-full flex-col gap-1.5">
            <FieldLabel htmlFor="date-picker-range">
              Search By Invoice No
            </FieldLabel>
            <Input
              value={query}
              disabled={isLoading || isLoadingDebounce}
              className="bg-superbase disabled:bg-gray-500 text-white"
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <TipWrapper triggerText="Export as Excel">
            <ExportDialog
              noofRecords={filteredOrders.length}
              title="Export the Order Data"
              description={`Records ready to export as selected filtered`}
              loading={isLoading || isLoadingDebounce || disableDefaultFilters}
              handleExport={handleExport}
              content={
                <div className="flex flex-col gap-2 py-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex w-full justify-between">
                      <div className="font-semibold">Date Range</div>
                      <div className="text-muted-foreground">
                        {dates?.from ? format(dates.from, "LLL dd, y") : ""} -{" "}
                        {dates?.to ? format(dates.to, "LLL dd, y") : ""}
                      </div>
                    </div>
                    <div className="flex w-full justify-between">
                      <div className="font-semibold">Payment Status</div>
                      <div className="text-muted-foreground">
                        {paymentStatus}
                      </div>
                    </div>
                    <div className="flex w-full justify-between">
                      <div className="font-semibold">Order Status</div>
                      <div className="text-muted-foreground">{odStatus}</div>
                    </div>
                    <div className="flex w-full justify-between">
                      <div className="font-semibold">
                        Invoice No Starting from
                      </div>
                      <div className="text-muted-foreground">
                        {debouncedQuery}
                      </div>
                    </div>
                  </div>

                  <div className="flex w-full justify-between text-green-700">
                    <div className="font-semibold">No of Records</div>
                    <div>{filteredOrders.length}</div>
                  </div>

                  <div className="text-muted-foreground text-sm">
                    If your selected filters won’t meet your export needs,
                    please cancel, adjust the filters on the Orders main screen,
                    and try exporting again
                  </div>
                </div>
              }
            />
          </TipWrapper>
        </div>
        {filteredOrders && !isLoading && !isLoadingDebounce ? (
          <div className="flex flex-col justify-center items-center text-superbase">
            <span className="text-5xl font-semibold">
              {filteredOrders?.length}
            </span>
            <span>Records Found</span>
          </div>
        ) : (
          <div className="flex flex-col justify-center items-center text-muted-foreground">
            <TextSkeleton
              length={2}
              numeric
              type="muted"
              textSize="text-5xl font-semibold"
            />
            <span>Records Found</span>
          </div>
        )}
      </div>

      <OrderUI
        dates={dates}
        role={role}
        isLoading={isLoading || isLoadingDebounce}
        orderMetas={filteredOrders ?? []}
      />
    </div>
  );
};

export default AllOrders;

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
  role,
  dates,
}: {
  dates: DateRange | undefined;
  role: T_Role;
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
      <div className="w-full h-[67.5vh] py-2 overflow-y-scroll no-scrollbar">
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

                  function DueAmount() {
                    const x =
                      Number(or?.saleValue ?? 0) +
                      Number(or.deliveryfee ?? 0) -
                      Number(or.paymentAmount ?? 0);

                    return x;
                  }

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

                      <ViewAccessChecker
                        key={index}
                        permission="create:order"
                        userRole={role}
                        component={
                          <AddNewDialog
                            width={"min-w-xl"}
                            form={<FormStateChange data={or} dates={dates} />}
                            triggerBtn={
                              <div className="flex flex-1 justify-center text-center gap-2 cursor-pointer">
                                {or.status === "Delivered" ? (
                                  <div className="bg-superbase size-[25px] rounded-full flex justify-center items-center">
                                    <CheckCheck
                                      size={14}
                                      className="text-white"
                                    />
                                  </div>
                                ) : or.status === "Packed" ? (
                                  <div className="bg-green-700 size-[25px] rounded-full flex justify-center items-center">
                                    <Check size={14} className="text-white" />
                                  </div>
                                ) : or.status === "Processing" ? (
                                  <div className="bg-yellow-500 size-[25px] rounded-full flex justify-center items-center">
                                    <RefreshCw
                                      size={14}
                                      className="text-black"
                                    />
                                  </div>
                                ) : (
                                  <div className="bg-destructive size-[25px] rounded-full flex justify-center items-center">
                                    <CircleX size={14} className="text-white" />
                                  </div>
                                )}
                                {or.status}
                              </div>
                            }
                            triggerText="Change Status"
                          />
                        }
                        skeleton={
                          <Skeleton className="size-[40px] rounded-sm bg-gray-300 border-slate-400" />
                        }
                      />
                      <div className="flex flex-1 justify-center items-center font-medium gap-2">
                        <>
                          <div
                            className={`${
                              DueAmount() === 0
                                ? "bg-superbase"
                                : "bg-destructive text-primary"
                            } size-[25px] rounded-full flex justify-center items-center text-white`}
                          >
                            {DueAmount() === 0 ? (
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
                                    },
                                  );

                                  await setClientEditMode(true);
                                  setDialogLoading(true); // show loading in dialog
                                  const invoiceData =
                                    await editInvoiceMutation.mutateAsync(
                                      or.id!,
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
