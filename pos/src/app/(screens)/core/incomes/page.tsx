"use client";
import { BasicHoverCard } from "@/components/custom/cards/BasicHoverCard";
import NoRecordsCard from "@/components/custom/cards/NoRecordsCard";
import { ExportDialog } from "@/components/custom/dialogs/ExportDialog";
import { DatePickerWithRange } from "@/components/custom/inputs/DatePickerWithRange";
import { SelectOnSearch } from "@/components/custom/inputs/SelectOnSearch";
import ListSkeleton from "@/components/custom/skeleton/ListSkeleton";
import TextSkeleton from "@/components/custom/skeleton/TextSkeleton";
import { TipWrapper } from "@/components/custom/wrapper/TipWrapper";
import { FieldLabel } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ensureClientInit,
  getBusinessMeta,
  saveCategory,
} from "@/data/dbcache";
import { BasicDataFetch, formatDate } from "@/utils/common";
import { Coins, NotepadText, TextAlignJustify } from "lucide-react";
import React, { useState } from "react";
import { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { getTodayRange } from "../(orders)/orders-all/page";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { IExpense } from "@/components/custom/forms/FormExpense";
import { PaymentMethod, TPaymentMethod } from "@/data";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { IIncome } from "@/components/custom/forms/FormIncome";
import { OrderSheet } from "@/components/custom/other/OrderSheet";
import { format } from "date-fns";
import * as XLSX from "xlsx-js-style";

const Income = () => {
  const [dates, setDates] = React.useState<DateRange | undefined>(
    getTodayRange(new Date()),
  );

  const queryClient = useQueryClient();

  const [paymentmode, setPaymentMode] = useState("All");
  const [paymentType, setPaymentType] = useState("All");
  const { data: session, status } = useSession();
  const role = session?.user.role.toLowerCase();
  const counterNo = session?.user?.counter ? `${session.user.counter}-` : "01-";
  const [query, setQuery] = useState(counterNo);
  const [open, setOpen] = useState(false);

  const debouncedQuery = useDebounce(query.replace(/-/g, ""));
  const disableDefaultFilters = debouncedQuery.length > 2;

  const {
    data: expenses,
    isLoading,
    error,
  } = useQuery({
    // queryKey: ["recent-expenses"],
    queryKey: ["income", dates],
    queryFn: () =>
      BasicDataFetch({
        method: "GET",
        endpoint: `/api/company/income?from=${dates?.from}&to=${dates?.to}`,
      }),
    select: (response) => response?.data as (IIncome & { invoiceId: string })[],
    staleTime: 1000 * 60 * 5,
  });

  const { data: incomeMetasDebounce, isLoading: isLoadingDebounce } = useQuery({
    queryKey: ["income-debounce", debouncedQuery],
    queryFn: () =>
      BasicDataFetch({
        method: "GET",
        endpoint: `/api/company/income?debounce=${debouncedQuery}`,
      }),
    select: (response) => response?.data as (IIncome & { invoiceId: string })[],
    staleTime: 1000 * 60 * 5,
    enabled: disableDefaultFilters, // Only fetch when 'search' is truthy
  });

  const filteredExpenses = React.useMemo(() => {
    // When searching (>=3 chars)
    if (disableDefaultFilters) {
      return incomeMetasDebounce ?? [];
    }
    // Default filtering
    if (!expenses) return [];

    return expenses.filter((i) => {
      const categoryMatch = paymentType === "All" || paymentType === i.category;
      const paymentModeMatch =
        paymentmode === "All" || paymentmode === i.paymentMethod;

      return categoryMatch && paymentModeMatch;
    });
  }, [
    expenses,
    paymentType,
    paymentmode,
    incomeMetasDebounce,
    disableDefaultFilters,
  ]);
  console.log(filteredExpenses);
  function getTotalIncome() {
    return filteredExpenses.reduce((total, item) => {
      return total + Number(item.amount);
    }, 0);
  }

  const handleExport = () => {
    if (filteredExpenses.length === 0) {
      return toast.error("No data to export");
    }

    const purifiedData = filteredExpenses.map((i) => {
      const dateObj = new Date(i.createdAt);
      const date = dateObj.toLocaleDateString("en-CA");
      const time = dateObj.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const counterId = i.invoiceId.toString().slice(0, 2);
      const invoiceIdOnly = i.invoiceId.toString().slice(2);

      return {
        invoiceId: `${counterId}-${invoiceIdOnly}`,
        paymentType: i.category,
        amount: Number(i.amount),
        paymentMethod: i.paymentMethod,
        date: date,
        time: time,
      };
    });

    const PAYMENT_METHOD_STYLES: Record<
      string,
      { bg: string; whiteText: boolean }
    > = {
      Cash: { bg: "1A54DA", whiteText: true },
      Card: { bg: "104E64", whiteText: true },
      Bank: { bg: "F4C430", whiteText: false },
      Credit: { bg: "E34A2F", whiteText: true },
    };

    const formatDate = (date: Date) => date.toISOString().split("T")[0];
    const from = formatDate(dates?.from as Date);
    const to = formatDate(dates?.to as Date);

    const workBook = XLSX.utils.book_new();
    const workSheet: XLSX.WorkSheet = {};

    const expensesStartRow = 8;

    // ------------------- Breakdown Table FIRST -------------------
    const excelDataStartRow = expensesStartRow + 2; // 10 (1-based)
    const excelDataEndRow = excelDataStartRow + purifiedData.length - 1;

    const makeFormula = (method: string) =>
      `SUMPRODUCT((D${excelDataStartRow}:D${excelDataEndRow}="${method}")*(C${excelDataStartRow}:C${excelDataEndRow})*SUBTOTAL(103,OFFSET(D${excelDataStartRow},ROW(D${excelDataStartRow}:D${excelDataEndRow})-ROW(D${excelDataStartRow}),0)))`;

    const breakdownRows = [
      { "Payment Method": "Cash", Amount: { f: makeFormula("Cash") } },
      { "Payment Method": "Card", Amount: { f: makeFormula("Card") } },
      { "Payment Method": "Bank", Amount: { f: makeFormula("Bank") } },
      { "Payment Method": "Credit", Amount: { f: makeFormula("Credit") } },
      { "Payment Method": "TOTAL", Amount: { f: "SUM(B2:B5)" } },
    ];

    XLSX.utils.sheet_add_json(workSheet, breakdownRows, { origin: "A1" });

    // Style Breakdown header (row 0)
    ["Payment Method", "Amount"].forEach((_, i) => {
      const cell = XLSX.utils.encode_cell({ r: 0, c: i });
      if (workSheet[cell]) {
        workSheet[cell].s = {
          fill: { patternType: "solid", fgColor: { rgb: "1E1E2D" } },
          font: { bold: true, color: { rgb: "FFFFFF" } },
          alignment: { horizontal: "center" },
        };
      }
    });

    // Payment method colors for breakdown rows
    PaymentMethod.forEach((method, i) => {
      const row = i + 1;
      const cell = XLSX.utils.encode_cell({ r: row, c: 0 });
      const style = PAYMENT_METHOD_STYLES[method];
      if (style && workSheet[cell]) {
        workSheet[cell].s = {
          fill: { patternType: "solid", fgColor: { rgb: style.bg } },
          font: {
            bold: true,
            ...(style.whiteText && { color: { rgb: "FFFFFF" } }),
          },
          alignment: { horizontal: "center" },
        };
      }
    });

    // TOTAL row style (black) — row 5
    const totalRow = XLSX.utils.encode_cell({ r: 5, c: 0 });
    if (workSheet[totalRow]) {
      workSheet[totalRow].s = {
        fill: { patternType: "solid", fgColor: { rgb: "e3dddc" } },
        font: { bold: true, color: { rgb: "000000" } },
        alignment: { horizontal: "center" },
      };
    }

    // ------------------- Expenses Table BELOW (gap of 1 row) -------------------
    // Breakdown: rows 0–5 (header + 4 methods + total) → gap row 6 → expenses start row 7

    XLSX.utils.sheet_add_json(workSheet, purifiedData, {
      origin: XLSX.utils.encode_cell({ r: expensesStartRow, c: 0 }),
      skipHeader: false,
    });

    const headers = Object.keys(purifiedData[0]);

    // Style expenses header row
    headers.forEach((_, colIndex) => {
      const headerCell = XLSX.utils.encode_cell({
        r: expensesStartRow,
        c: colIndex,
      });
      if (workSheet[headerCell]) {
        workSheet[headerCell].s = {
          fill: { patternType: "solid", fgColor: { rgb: "1E1E2D" } },
          font: { bold: true, color: { rgb: "FFFFFF" } },
          alignment: { horizontal: "center" },
        };
      }
    });

    // Style expenses data rows
    const expensesRange = XLSX.utils.decode_range(workSheet["!ref"]!);
    for (let R = expensesStartRow + 1; R <= expensesRange.e.r; ++R) {
      for (let C = 0; C <= headers.length - 1; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!workSheet[cellAddress]) continue;
        workSheet[cellAddress].s = { alignment: { horizontal: "center" } };
      }
    }

    // Payment method colors for expenses rows
    const paymentMethodColIndex = headers.indexOf("paymentMethod");
    if (paymentMethodColIndex !== -1) {
      const statusColLetter = XLSX.utils.encode_col(paymentMethodColIndex);
      purifiedData.forEach((expense, rowIndex) => {
        const cellAddress = `${statusColLetter}${expensesStartRow + rowIndex + 2}`;
        const method = expense.paymentMethod as TPaymentMethod;
        const style = PAYMENT_METHOD_STYLES[method];
        if (style && workSheet[cellAddress]) {
          workSheet[cellAddress].s = {
            fill: { patternType: "solid", fgColor: { rgb: style.bg } },
            font: {
              bold: true,
              ...(style.whiteText && { color: { rgb: "FFFFFF" } }),
            },
            alignment: { horizontal: "center" },
          };
        }
      });
    }

    // Column widths
    workSheet["!cols"] = headers.map(() => ({ wch: 20 }));

    // Autofilter on expenses table only
    const expensesHeaderRef = XLSX.utils.encode_cell({
      r: expensesStartRow,
      c: 0,
    });
    const expensesEndRef = XLSX.utils.encode_cell({
      r: expensesRange.e.r,
      c: headers.length - 1,
    });
    workSheet["!autofilter"] = {
      ref: `${expensesHeaderRef}:${expensesEndRef}`,
    };

    const breakdownRef = "A1:B6";
    const expensesRef = `${expensesHeaderRef}:${expensesEndRef}`;

    workSheet["!tables"] = [
      {
        ref: breakdownRef,
        name: "BreakdownTable",
        displayName: "BreakdownTable",
        headerRowCount: 1,
        tableStyleInfo: { name: "TableStyleMedium2", showRowStripes: true },
      },
      {
        ref: expensesRef,
        name: "IncomesTable",
        displayName: "IncomesTable",
        headerRowCount: 1,
        totalsRowCount: 0,
        tableStyleInfo: {
          name: "TableStyleMedium2",
          showFirstColumn: false,
          showLastColumn: false,
          showRowStripes: true,
          showColumnStripes: false,
        },
      },
    ];

    XLSX.utils.book_append_sheet(workBook, workSheet, "Incomes Sheet");
    XLSX.writeFile(workBook, `Incomes---${from}---${to}.xlsx`);

    toast.success("Data exported successfully");
  };

  return (
    <div className="flex relative w-full text-sm">
      <div className="flex flex-col h-full w-full">
        <div className="flex text-[30px] font-semibold justify-between items-center w-full mb-5 pb-2">
          {/**filters**/}
          <div className="flex gap-8 items-end">
            <DatePickerWithRange
              date={dates}
              setDate={setDates}
              isLoading={
                isLoading || disableDefaultFilters || isLoadingDebounce
              }
            />

            <div className="flex min-w-[200px] flex-col gap-1.5">
              <FieldLabel htmlFor="date-picker-range">
                Search By Payment Type
              </FieldLabel>

              <SelectOnSearch
                isLoading={
                  isLoading || disableDefaultFilters || isLoadingDebounce
                }
                icon={<TextAlignJustify className="text-white" size={18} />}
                selections={[
                  "All",
                  "Full Payment",
                  "Advance Payment",
                  "Partial Payment",
                  "Balance Payment",
                  "Credit Payment",
                ]}
                value={paymentType}
                onValueChange={(value) => {
                  setPaymentType(value);
                  // setSearch("");
                }}
              />
            </div>

            <div className="flex min-w-[200px] flex-col gap-1.5">
              <FieldLabel htmlFor="date-picker-range">
                Search By Payment Mode
              </FieldLabel>

              <SelectOnSearch
                isLoading={
                  isLoading || disableDefaultFilters || isLoadingDebounce
                }
                icon={<Coins className="text-white" size={18} />}
                selections={["All", ...PaymentMethod]}
                value={paymentmode}
                onValueChange={(value) => {
                  setPaymentMode(value);
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
                open={open}
                setOpen={setOpen}
                noofRecords={filteredExpenses.length}
                title="Export the Income Data"
                description={`Records ready to export as selected filtered`}
                loading={isLoading || isLoadingDebounce}
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
                        <div className="font-semibold">Payment Type</div>
                        <div className="text-muted-foreground">
                          {paymentType}
                        </div>
                      </div>
                      <div className="flex w-full justify-between">
                        <div className="font-semibold">Payment Mode</div>
                        <div className="text-muted-foreground">
                          {paymentmode}
                        </div>
                      </div>
                    </div>

                    <div className="flex w-full justify-between text-green-700">
                      <div className="font-semibold">No of Records</div>
                      <div>{filteredExpenses.length}</div>
                    </div>

                    <div className="text-muted-foreground text-sm">
                      If your selected filters won’t meet your export needs,
                      please cancel, adjust the filters on the Orders main
                      screen, and try exporting again
                    </div>
                  </div>
                }
              />
            </TipWrapper>
          </div>

          <div className="flex items-center gap-5 text-sm font-normal">
            {filteredExpenses && !isLoading && !isLoadingDebounce ? (
              <div className="flex gap-5">
                <div className="flex flex-col gap-1.5">
                  <FieldLabel htmlFor="date-picker-range">
                    Total Income
                  </FieldLabel>
                  <span className="text-base font-medium flex items-center border-2 rounded-sm px-3 w-fit border-superbase h-10 text-superbase">
                    Rs.{" "}
                    {new Intl.NumberFormat("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(Number(getTotalIncome()))}
                  </span>
                </div>
                <div className="flex flex-col justify-center items-center text-superbase">
                  <span className="text-5xl font-semibold">
                    {filteredExpenses?.length}
                  </span>
                  <span>Records Found</span>
                </div>
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
        </div>

        <div className="flex font-semibold text-muted-foreground mb-2 px-4 justify-between gap-5">
          <div className="flex-1">Invoice Id</div>
          <div className="flex-1 text-center">Payment Type</div>
          <div className="flex-1 text-center">Payment Mode</div>
          <div className="flex-1 text-center">Amount</div>
          <div className="flex-1">CreatedAt</div>
          <div className="w-[30px]" />
        </div>

        {isLoading || isLoadingDebounce ? (
          <ListSkeleton height={60} length={10} />
        ) : filteredExpenses && filteredExpenses?.length > 0 ? (
          <div className="flex flex-col h-full justify-between gap-2 ">
            <div className="flex flex-col gap-2 flex-1 py-2">
              {filteredExpenses.map((ex, index) => {
                const createdAt = ex.createdAt ? new Date(ex.createdAt) : null;

                if (!createdAt) return null;

                const [date, time] = formatDate(createdAt.toLocaleString());
                const invoice = ex.invoiceId;

                const counterId = invoice.slice(0, 2);
                const invoiceIdOnly = invoice.slice(2);

                return (
                  <div
                    key={index}
                    className={`flex justify-between items-center gap-5 py-3 px-4 group hover:bg-muted bg-background shadow rounded-md border border-transparent hover:border-gray-400`}
                  >
                    <div className="flex flex-1 font-medium">
                      {counterId}-{invoiceIdOnly}
                    </div>
                    <div className="flex-1 text-center">{ex.category}</div>
                    <div className="flex-1 text-center">{ex.paymentMethod}</div>
                    <div className="flex-1 text-center">
                      {new Intl.NumberFormat("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(ex.amount)}
                    </div>

                    <div className="flex flex-1 gap-2 text-muted-foreground">
                      <span className="font-medium">{date}</span>
                      <span>{time}</span>
                    </div>
                    <OrderSheet id={ex.orderId!} />
                  </div>
                );
              })}
            </div>
            <div className="w-full text-center pt-0">
              --- {filteredExpenses.length} Records Founded ---
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

export default Income;
