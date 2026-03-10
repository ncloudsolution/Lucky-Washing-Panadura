"use client";
import NoRecordsCard from "@/components/custom/cards/NoRecordsCard";
import { ChartPieLabel } from "@/components/custom/charts/ChartPieLabel";
import { ExportDialog } from "@/components/custom/dialogs/ExportDialog";
import { DatePickerWithRange } from "@/components/custom/inputs/DatePickerWithRange";
import { SelectOnSearch } from "@/components/custom/inputs/SelectOnSearch";
import TextSkeleton from "@/components/custom/skeleton/TextSkeleton";
import { TipWrapper } from "@/components/custom/wrapper/TipWrapper";
import { Card } from "@/components/ui/card";
import {
  ENUMPaymentMethodArray,
  IAllData,
  IAnalytics,
  PaymentMethod,
  TPaymentMethod,
} from "@/data";
import {
  getCacheProductsWithVariants,
  saveAllProductWithVariants,
} from "@/data/dbcache";
import {
  BasicDataFetch,
  getProductVariantFullNameByVarientId,
} from "@/utils/common";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Building2, Calendar, Check, LoaderCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { setSourceMapsEnabled } from "process";
import React, { useEffect, useState } from "react";
import { DateRange } from "react-day-picker";
import { toast } from "sonner";
import * as XLSX from "xlsx-js-style";

const Dashboard = () => {
  const [dates, setDates] = React.useState<DateRange | undefined>({
    //  from: new Date(new Date().getFullYear(), 0, 1),
    from: new Date(),
    to: new Date(),
    // to: addDays(new Date(new Date().getFullYear(), 0, 20), 20),  //(Jan 20 + 20 days)
  });
  const { data: session, status } = useSession();

  // const [timeFrame, setTimeFrame] = useState("All Time");
  const [branch, setBranch] = useState("All Branches");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (
      session?.user?.branch &&
      (branch === "All Branches" || branch === "") &&
      session?.user.role.toLowerCase() !== "director"
    ) {
      setBranch(session.user.branch);
    }
  }, [session, branch]);

  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { products: cachedProducts, expired } =
        await getCacheProductsWithVariants();

      if (cachedProducts.length > 0 && !expired) {
        return cachedProducts;
      }

      const response = await BasicDataFetch({
        method: "GET",
        endpoint: "/api/products/common",
      });

      const apiData = response.data;

      await saveAllProductWithVariants({
        data: apiData,
        lastProductFetch: Date.now(),
      });

      const { products: refreshed } = await getCacheProductsWithVariants();
      return refreshed;
    },
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: analytics,
    isLoading: isLoadingAnalytics,
    error,
  } = useQuery({
    queryKey: ["analytics", dates],
    queryFn: async () => {
      // const query = timeFrame.toLocaleLowerCase().split(" ").join("");

      const response = await BasicDataFetch({
        method: "GET",
        endpoint: `/api/analytics?from=${dates?.from}&to=${dates?.to}`,
      });
      // Return only the data array - this is what gets cached
      return response?.data as IAnalytics;
    },

    staleTime: 0, // 👈 data becomes stale immediately
    refetchOnMount: "always", // 👈 ALWAYS fetch when route is entered
  });

  const { data: allData, isLoading: isLoadingAllData } = useQuery({
    queryKey: ["all-data", dates],
    queryFn: async () => {
      const response = await BasicDataFetch({
        method: "GET",
        endpoint: `/api/analytics/export?from=${dates?.from}&to=${dates?.to}&branch=${branch}`,
      });
      // Return only the data array - this is what gets cached
      return response?.data as IAllData;
    },
    // enabled:open,
    staleTime: 1000 * 60 * 5,
  });

  function getTotalValue(type: "count" | "saleValue"): number {
    const order = finalOrders.find((i) => i.branch === branch);

    if (!order) return 0; // fallback if branch not found
    return type === "count" ? order.totalCount : order.totalSaleValue;
  }

  function getIncome(type: "collected" | "remains"): number {
    const breakdown = analytics?.incomes.find(
      (inc) => inc.branch === branch,
    )?.breakdown;
    const totalAmount =
      breakdown?.reduce((sum, item) => sum + item.amount, 0) ?? 0;

    if (type === "collected") return totalAmount;
    return getTotalValue("saleValue") - totalAmount;
  }

  function getExpense(): number {
    const breakdown = analytics?.expenses.find(
      (inc) => inc.branch === branch,
    )?.breakdown;
    const totalAmount =
      breakdown?.reduce((sum, item) => sum + item.amount, 0) ?? 0;
    return totalAmount;
  }

  type BreakdownItem = {
    type: TPaymentMethod;
    count: number;
    amount: number;
  };

  function getAmountByType(
    breakdown: BreakdownItem[] | undefined,
    type: TPaymentMethod,
  ): number {
    return breakdown?.find((b) => b.type === type)?.amount ?? 0;
  }

  function getNetCashflowBreakdown() {
    const expenseBreakdown = analytics?.expenses.find(
      (e) => e.branch === branch,
    )?.breakdown;

    const incomeBreakdown = analytics?.incomes.find(
      (i) => i.branch === branch,
    )?.breakdown;

    return ENUMPaymentMethodArray.reduce<Record<TPaymentMethod, number>>(
      (acc, method) => {
        acc[method] =
          getAmountByType(incomeBreakdown, method) -
          getAmountByType(expenseBreakdown, method);
        return acc;
      },
      {
        Cash: 0,
        Card: 0,
        Bank: 0,
        Credit: 0,
      },
    );
  }

  function getChartData() {
    const breakdown =
      analytics?.incomes
        .find((inc) => inc.branch === branch)
        ?.breakdown.map((item, index) => ({
          label: item.type,
          value: item.count,
          fill:
            item.type === "Cash"
              ? "var(--color-superbase)"
              : item.type === "Credit"
                ? "var(--color-destructive)"
                : item.type === "Card"
                  ? `var(--chart-4)`
                  : `var(--chart-3)`,
        })) ?? [];

    return breakdown;
  }

  const branches = analytics?.orders.map((i) => i.branch) ?? [];
  const allBranches = [
    ...branches,
    ...(session?.user.role.toLowerCase() === "director"
      ? ["All Branches"]
      : []),
  ];

  const allBranchesObj =
    analytics?.orders && analytics.orders.length > 1
      ? analytics.orders.reduce(
          (acc, order) => {
            acc.totalCount += order.totalCount;
            acc.totalSaleValue += order.totalSaleValue;

            // order.breakdown.forEach((item) => {
            //   const existing = acc.breakdown.find((b) => b.type === item.type);

            //   if (existing) {
            //     existing.count += item.count;
            //     existing.saleValue += item.saleValue;
            //   }
            // });

            return acc;
          },
          {
            branch: "All Branches",
            totalCount: 0,
            totalSaleValue: 0,
            // breakdown: [
            //   { type: "Cash", count: 0, saleValue: 0 },
            //   { type: "Card", count: 0, saleValue: 0 },
            //   { type: "Bank", count: 0, saleValue: 0 },
            //   { type: "Credit", count: 0, saleValue: 0 },
            // ],
          },
        )
      : null;

  const finalOrders = [
    ...(analytics?.orders ?? []),
    ...(allBranchesObj ? [allBranchesObj] : []),
  ];

  // const chartData =
  //   finalOrders
  //     ?.find((i) => i.branch === branch)
  //     ?.breakdown?.map((item, index) => ({
  //       label: item.type,
  //       value: item.count,
  //       fill:
  //         item.type === "Cash"
  //           ? "var(--color-superbase)"
  //           : item.type === "Credit"
  //           ? "var(--color-destructive)"
  //           : `var(--chart-${index + 1})`,
  //     })) ?? [];
  const handleExport = () => {
    if (isLoadingAllData) {
      return toast.error("Please wait a moment. Data is still Loading");
    }

    if (!allData) {
      return toast.error("No data to export");
    }

    if (
      allData?.expenseRecords.length === 0 ||
      allData?.incomeRecords.length === 0 ||
      allData?.orderRecords.length === 0
    ) {
      return toast.error("No data to export");
    }

    const purifiedExpenses = allData.expenseRecords.map((i) => {
      const dateObj = new Date(i.createdAt);
      const date = dateObj.toLocaleDateString("en-CA");
      const time = dateObj.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return {
        branch: i.branch,
        category: i.category,
        amount: Number(i.amount),
        paymentMethod: i.paymentMethod,
        remarks: i.remarks,
        date: date,
        time: time,
      };
    });

    const purifiedIncome = allData.incomeRecords.map((i) => {
      const dateObj = new Date(i.createdAt);
      const date = dateObj.toLocaleDateString("en-CA");
      const time = dateObj.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return {
        category: i.category,
        amount: Number(i.amount),
        paymentMethod: i.paymentMethod,
        date: date,
        time: time,
      };
    });

    const purifiedOrders = allData.orderRecords.map((i) => {
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
        branch: i.branch,
        status: i.status,
        saleValue: Number(i.saleValue),
        receivables:
          Number(i.saleValue) +
          Number(i.deliveryfee ?? 0) -
          Number(i.paymentAmount),
        deliveryfee: Number(i.deliveryfee),
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

    // Pre-calculate Orders column letters (needed in Breakdown sheet formulas)
    const ordKeys = Object.keys(purifiedOrders[0]);
    const ordHeaderRow = 2; // row index (0-based), Excel row 3
    const ordDataStartExcel = ordHeaderRow + 2; // Excel row where data begins (1-indexed) = 4
    const ordDataEndExcel = ordHeaderRow + purifiedOrders.length + 1;
    const receivablesColLetter = XLSX.utils.encode_col(
      ordKeys.indexOf("receivables"),
    );
    const invoiceColLetter = XLSX.utils.encode_col(
      ordKeys.indexOf("invoiceId"),
    );

    const workBook = XLSX.utils.book_new();

    // ─────────────────────────────────────────────
    // SHEET 1 — Breakdown
    // ─────────────────────────────────────────────
    const breakdownSheet: XLSX.WorkSheet = {};

    // Income sheet: header at row index 2 (Excel row 3), data from Excel row 4
    // incomeHeaderRow = 2 → data starts at incomeHeaderRow + 2 = Excel row 4...
    // but we kept incomeHeaderRow=2 below which means Excel row 3 header, data row 4
    const incomeDataStart = 4;
    const incomeDataEnd = incomeDataStart + purifiedIncome.length - 1;

    // Expenses sheet: same structure
    const expDataStart = 4;
    const expDataEnd = expDataStart + purifiedExpenses.length - 1;

    // paymentMethod col in Collected Revenue sheet = column C (index 2), amount = column B (index 1)
    // paymentMethod col in Expenses sheet = column D (index 3), amount = column C (index 2)
    const makeIncomeFormula = (method: string) =>
      `SUMPRODUCT(('Collected Revenue'!C${incomeDataStart}:C${incomeDataEnd}="${method}")*('Collected Revenue'!B${incomeDataStart}:B${incomeDataEnd})*SUBTOTAL(103,OFFSET('Collected Revenue'!C${incomeDataStart},ROW('Collected Revenue'!C${incomeDataStart}:C${incomeDataEnd})-ROW('Collected Revenue'!C${incomeDataStart}),0)))`;

    const makeExpenseFormula = (method: string) =>
      `SUMPRODUCT((Expenses!D${expDataStart}:D${expDataEnd}="${method}")*(Expenses!C${expDataStart}:C${expDataEnd})*SUBTOTAL(103,OFFSET(Expenses!D${expDataStart},ROW(Expenses!D${expDataStart}:D${expDataEnd})-ROW(Expenses!D${expDataStart}),0)))`;

    const makeNetFormula = (row: number) => `B${row}-C${row}`;

    // Purple title at A1, merged across all 4 columns
    XLSX.utils.sheet_add_aoa(
      breakdownSheet,
      [["Collected Net Operating Cash Flow ( Rs )"]],
      { origin: "A1" },
    );
    if (breakdownSheet["A1"]) {
      breakdownSheet["A1"].s = {
        fill: { patternType: "solid", fgColor: { rgb: "7030A0" } },
        font: { bold: true, color: { rgb: "FFFFFF" } },
        alignment: { horizontal: "center" },
      };
    }

    breakdownSheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // A1:D1
    ];

    // 1 gap row (row 2), dark header at row 3
    XLSX.utils.sheet_add_aoa(
      breakdownSheet,
      [["Payment Method", "Revenue Collected", "Expenses", "Net Cash Flow"]],
      { origin: "A3" },
    );
    ["A3", "B3", "C3", "D3"].forEach((addr) => {
      if (breakdownSheet[addr]) {
        breakdownSheet[addr].s = {
          fill: { patternType: "solid", fgColor: { rgb: "1E1E2D" } },
          font: { bold: true, color: { rgb: "FFFFFF" } },
          alignment: { horizontal: "center" },
        };
      }
    });

    // Data rows: Cash/Card/Bank/Credit at Excel rows 4–7, TOTAL at row 8
    const methods = ["Cash", "Card", "Bank", "Credit"];
    const dataRows = [
      ...methods.map((method, i) => {
        const excelRow = i + 4;
        return [
          method,
          { f: makeIncomeFormula(method) },
          { f: makeExpenseFormula(method) },
          { f: makeNetFormula(excelRow) },
        ];
      }),
      ["TOTAL", { f: "SUM(B4:B7)" }, { f: "SUM(C4:C7)" }, { f: "SUM(D4:D7)" }],
    ];

    XLSX.utils.sheet_add_aoa(breakdownSheet, dataRows, { origin: "A4" });

    // Payment method label colors (rows 4–7)
    methods.forEach((method, i) => {
      const excelRow = i + 4;
      const style = PAYMENT_METHOD_STYLES[method];

      const labelCell = `A${excelRow}`;
      if (style && breakdownSheet[labelCell]) {
        breakdownSheet[labelCell].s = {
          fill: { patternType: "solid", fgColor: { rgb: style.bg } },
          font: {
            bold: true,
            ...(style.whiteText && { color: { rgb: "FFFFFF" } }),
          },
          alignment: { horizontal: "center" },
        };
      }

      [`B${excelRow}`, `C${excelRow}`, `D${excelRow}`].forEach((addr) => {
        if (breakdownSheet[addr]) {
          breakdownSheet[addr].s = { alignment: { horizontal: "center" } };
        }
      });
    });

    // TOTAL row style (row 8)
    ["A8", "B8", "C8", "D8"].forEach((addr) => {
      if (breakdownSheet[addr]) {
        breakdownSheet[addr].s = {
          fill: { patternType: "solid", fgColor: { rgb: "e3dddc" } },
          font: { bold: true, color: { rgb: "000000" } },
          alignment: { horizontal: "center" },
        };
      }
    });

    // Row 9 gap, Row 10 gap

    // A11: Sales Count label | B11: filter-reactive COUNTA from Orders sheet
    XLSX.utils.sheet_add_aoa(
      breakdownSheet,
      [
        [
          "Sales Count",
          {
            f: `SUBTOTAL(103,Orders!${invoiceColLetter}${ordDataStartExcel}:${invoiceColLetter}${ordDataEndExcel})`,
          },
        ],
      ],
      { origin: "A11" },
    );
    if (breakdownSheet["A11"]) {
      breakdownSheet["A11"].s = {
        fill: { patternType: "solid", fgColor: { rgb: "000000" } },
        font: { bold: true, color: { rgb: "FFFFFF" } },
        alignment: { horizontal: "center" },
      };
    }
    if (breakdownSheet["B11"]) {
      breakdownSheet["B11"].s = {
        fill: { patternType: "solid", fgColor: { rgb: "000000" } },
        font: { bold: true, color: { rgb: "FFFFFF" } },
        alignment: { horizontal: "center" },
      };
    }

    // A12: Receivables label | B12: filter-reactive SUM from Orders sheet
    XLSX.utils.sheet_add_aoa(
      breakdownSheet,
      [
        [
          "Receivables",
          {
            f: `SUBTOTAL(109,Orders!${receivablesColLetter}${ordDataStartExcel}:${receivablesColLetter}${ordDataEndExcel})`,
          },
        ],
      ],
      { origin: "A12" },
    );
    if (breakdownSheet["A12"]) {
      breakdownSheet["A12"].s = {
        fill: { patternType: "solid", fgColor: { rgb: "E34A2F" } },
        font: { bold: true, color: { rgb: "FFFFFF" } },
        alignment: { horizontal: "center" },
      };
    }
    if (breakdownSheet["B12"]) {
      breakdownSheet["B12"].s = {
        fill: { patternType: "solid", fgColor: { rgb: "E34A2F" } },
        font: { bold: true, color: { rgb: "FFFFFF" } },
        alignment: { horizontal: "center" },
      };
    }

    breakdownSheet["!cols"] = [
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
    ];
    breakdownSheet["!tables"] = [
      {
        ref: "A3:D8",
        name: "BreakdownTable",
        displayName: "BreakdownTable",
        headerRowCount: 1,
        tableStyleInfo: { name: "TableStyleMedium2", showRowStripes: true },
      },
    ];

    XLSX.utils.book_append_sheet(workBook, breakdownSheet, "Breakdown");

    // ─────────────────────────────────────────────
    // SHEET 2 — Collected Revenue (with filter)
    // ─────────────────────────────────────────────
    const incomeSheet: XLSX.WorkSheet = {};

    XLSX.utils.sheet_add_aoa(
      incomeSheet,
      [["Sales Revenue Collected ( Rs )"]],
      { origin: "A1" },
    );
    if (incomeSheet["A1"]) {
      incomeSheet["A1"].s = {
        fill: { patternType: "solid", fgColor: { rgb: "7030A0" } },
        font: { bold: true, color: { rgb: "FFFFFF" } },
        alignment: { horizontal: "center" },
      };
    }

    incomeSheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];

    const incomeHeaderRow = 2; // row index (0-based), Excel row 3
    XLSX.utils.sheet_add_json(incomeSheet, purifiedIncome, {
      origin: XLSX.utils.encode_cell({ r: incomeHeaderRow, c: 0 }),
      skipHeader: false,
    });

    const incomeHeaders = Object.keys(purifiedIncome[0]);

    // Fix merge now that we know incomeHeaders length
    incomeSheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: incomeHeaders.length - 1 } },
    ];

    // Dark header style
    incomeHeaders.forEach((_, c) => {
      const cell = XLSX.utils.encode_cell({ r: incomeHeaderRow, c });
      if (incomeSheet[cell]) {
        incomeSheet[cell].s = {
          fill: { patternType: "solid", fgColor: { rgb: "1E1E2D" } },
          font: { bold: true, color: { rgb: "FFFFFF" } },
          alignment: { horizontal: "center" },
        };
      }
    });

    // Data row styles
    for (
      let R = incomeHeaderRow + 1;
      R <= incomeHeaderRow + purifiedIncome.length;
      R++
    ) {
      for (let C = 0; C < incomeHeaders.length; C++) {
        const cell = XLSX.utils.encode_cell({ r: R, c: C });
        if (!incomeSheet[cell]) continue;
        incomeSheet[cell].s = { alignment: { horizontal: "center" } };
      }
    }

    // Payment method colors
    const incomePayColIdx = incomeHeaders.indexOf("paymentMethod");
    if (incomePayColIdx !== -1) {
      const col = XLSX.utils.encode_col(incomePayColIdx);
      purifiedIncome.forEach((income, rowIdx) => {
        const cell = `${col}${incomeHeaderRow + rowIdx + 2}`;
        const style =
          PAYMENT_METHOD_STYLES[income.paymentMethod as TPaymentMethod];
        if (style && incomeSheet[cell]) {
          incomeSheet[cell].s = {
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

    incomeSheet["!cols"] = incomeHeaders.map(() => ({ wch: 20 }));

    const incomeHeaderRef = XLSX.utils.encode_cell({
      r: incomeHeaderRow,
      c: 0,
    });
    const incomeEndRef = XLSX.utils.encode_cell({
      r: incomeHeaderRow + purifiedIncome.length,
      c: incomeHeaders.length - 1,
    });
    incomeSheet["!autofilter"] = { ref: `${incomeHeaderRef}:${incomeEndRef}` };
    incomeSheet["!tables"] = [
      {
        ref: `${incomeHeaderRef}:${incomeEndRef}`,
        name: "IncomeTable",
        displayName: "IncomeTable",
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

    XLSX.utils.book_append_sheet(workBook, incomeSheet, "Collected Revenue");

    // ─────────────────────────────────────────────
    // SHEET 3 — Expenses (with filter)
    // ─────────────────────────────────────────────
    const expensesSheet: XLSX.WorkSheet = {};

    XLSX.utils.sheet_add_aoa(expensesSheet, [["Expenses ( Rs )"]], {
      origin: "A1",
    });
    if (expensesSheet["A1"]) {
      expensesSheet["A1"].s = {
        fill: { patternType: "solid", fgColor: { rgb: "7030A0" } },
        font: { bold: true, color: { rgb: "FFFFFF" } },
        alignment: { horizontal: "center" },
      };
    }

    const expHeaderRow = 2; // row index (0-based), Excel row 3
    XLSX.utils.sheet_add_json(expensesSheet, purifiedExpenses, {
      origin: XLSX.utils.encode_cell({ r: expHeaderRow, c: 0 }),
      skipHeader: false,
    });

    const expHeaders = Object.keys(purifiedExpenses[0]);

    expensesSheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: expHeaders.length - 1 } },
    ];

    // Dark header style
    expHeaders.forEach((_, c) => {
      const cell = XLSX.utils.encode_cell({ r: expHeaderRow, c });
      if (expensesSheet[cell]) {
        expensesSheet[cell].s = {
          fill: { patternType: "solid", fgColor: { rgb: "1E1E2D" } },
          font: { bold: true, color: { rgb: "FFFFFF" } },
          alignment: { horizontal: "center" },
        };
      }
    });

    // Data row styles
    for (
      let R = expHeaderRow + 1;
      R <= expHeaderRow + purifiedExpenses.length;
      R++
    ) {
      for (let C = 0; C < expHeaders.length; C++) {
        const cell = XLSX.utils.encode_cell({ r: R, c: C });
        if (!expensesSheet[cell]) continue;
        expensesSheet[cell].s = { alignment: { horizontal: "center" } };
      }
    }

    // Payment method colors
    const expPayColIdx = expHeaders.indexOf("paymentMethod");
    if (expPayColIdx !== -1) {
      const col = XLSX.utils.encode_col(expPayColIdx);
      purifiedExpenses.forEach((expense, rowIdx) => {
        const cell = `${col}${expHeaderRow + rowIdx + 2}`;
        const style =
          PAYMENT_METHOD_STYLES[expense.paymentMethod as TPaymentMethod];
        if (expensesSheet[cell] && style) {
          expensesSheet[cell].s = {
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

    expensesSheet["!cols"] = expHeaders.map(() => ({ wch: 20 }));

    const expHeaderRef = XLSX.utils.encode_cell({ r: expHeaderRow, c: 0 });
    const expEndRef = XLSX.utils.encode_cell({
      r: expHeaderRow + purifiedExpenses.length,
      c: expHeaders.length - 1,
    });
    expensesSheet["!autofilter"] = { ref: `${expHeaderRef}:${expEndRef}` };
    expensesSheet["!tables"] = [
      {
        ref: `${expHeaderRef}:${expEndRef}`,
        name: "ExpensesTable",
        displayName: "ExpensesTable",
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

    XLSX.utils.book_append_sheet(workBook, expensesSheet, "Expenses");

    // ─────────────────────────────────────────────
    // SHEET 4 — Orders (with filter)
    // ─────────────────────────────────────────────
    const ordersSheet: XLSX.WorkSheet = {};

    XLSX.utils.sheet_add_aoa(ordersSheet, [["Orders"]], { origin: "A1" });
    if (ordersSheet["A1"]) {
      ordersSheet["A1"].s = {
        fill: { patternType: "solid", fgColor: { rgb: "7030A0" } },
        font: { bold: true, color: { rgb: "FFFFFF" } },
        alignment: { horizontal: "center" },
      };
    }

    // ordHeaderRow = 2 already defined above
    XLSX.utils.sheet_add_json(ordersSheet, purifiedOrders, {
      origin: XLSX.utils.encode_cell({ r: ordHeaderRow, c: 0 }),
      skipHeader: false,
    });

    const ordHeaders = ordKeys; // already defined above

    ordersSheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: ordHeaders.length - 1 } },
    ];

    // Dark header style
    ordHeaders.forEach((_, c) => {
      const cell = XLSX.utils.encode_cell({ r: ordHeaderRow, c });
      if (ordersSheet[cell]) {
        ordersSheet[cell].s = {
          fill: { patternType: "solid", fgColor: { rgb: "1E1E2D" } },
          font: { bold: true, color: { rgb: "FFFFFF" } },
          alignment: { horizontal: "center" },
        };
      }
    });

    // Center-align all data rows
    for (
      let R = ordHeaderRow + 1;
      R <= ordHeaderRow + purifiedOrders.length;
      R++
    ) {
      for (let C = 0; C < ordHeaders.length; C++) {
        const cell = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ordersSheet[cell]) continue;
        ordersSheet[cell].s = { alignment: { horizontal: "center" } };
      }
    }

    // Status column colors
    const statusColIndex = ordHeaders.indexOf("status");
    if (statusColIndex !== -1) {
      const col = XLSX.utils.encode_col(statusColIndex);
      purifiedOrders.forEach((order, rowIdx) => {
        const cell = `${col}${ordHeaderRow + rowIdx + 2}`;
        const style = STATUS_STYLES[order.status as string];
        if (style && ordersSheet[cell]) {
          ordersSheet[cell].s = {
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

    // SaleValue column colors (blue = fully paid, red = has receivables)
    const saleValueColIdx = ordHeaders.indexOf("saleValue");
    if (saleValueColIdx !== -1) {
      const col = XLSX.utils.encode_col(saleValueColIdx);
      purifiedOrders.forEach((order, rowIdx) => {
        const cell = `${col}${ordHeaderRow + rowIdx + 2}`;
        const style = SALEVALUE_STYLES[String(order.receivables === 0)];
        if (style && ordersSheet[cell]) {
          ordersSheet[cell].s = {
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

    // Receivables column colors (pink if > 0)
    const receivablesIdx = ordHeaders.indexOf("receivables");
    if (receivablesIdx !== -1) {
      const col = XLSX.utils.encode_col(receivablesIdx);
      purifiedOrders.forEach((order, rowIdx) => {
        if (order.receivables <= 0) return;
        const cell = `${col}${ordHeaderRow + rowIdx + 2}`;
        const style = OUTSTANDING_STYLES[String(order.receivables > 0)];
        if (style && ordersSheet[cell]) {
          ordersSheet[cell].s = {
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

    ordersSheet["!cols"] = ordHeaders.map(() => ({ wch: 20 }));

    const ordHeaderRef = XLSX.utils.encode_cell({ r: ordHeaderRow, c: 0 });
    const ordEndRef = XLSX.utils.encode_cell({
      r: ordHeaderRow + purifiedOrders.length,
      c: ordHeaders.length - 1,
    });
    ordersSheet["!autofilter"] = { ref: `${ordHeaderRef}:${ordEndRef}` };
    ordersSheet["!tables"] = [
      {
        ref: `${ordHeaderRef}:${ordEndRef}`,
        name: "OrdersTable",
        displayName: "OrdersTable",
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

    XLSX.utils.book_append_sheet(workBook, ordersSheet, "Orders");

    // ─────────────────────────────────────────────
    // Export
    // ─────────────────────────────────────────────
    XLSX.writeFile(workBook, `Summary---${from}---${to}.xlsx`);
    toast.success("Data exported successfully");
  };
  return (
    // border-2 border-red-700
    <div className="flex flex-col gap-5">
      <div className="flex gap-5">
        <div className="flex flex-col gap-5">
          <div className="flex gap-5">
            <SelectOnSearch
              isLoading={
                isLoadingAnalytics || isLoadingProducts || isLoadingAllData
              }
              icon={<Building2 className="text-white" size={18} />}
              selections={allBranches}
              value={branch}
              onValueChange={(value) => {
                setBranch(value);
                // setSearch("");
              }}
            />
            {/* <SelectOnSearch
              isLoading={isLoadingAnalytics || isLoadingProducts}
              icon={<Calendar className="text-white" size={18} />}
              selections={[
                "Today",
                "Last Week",
                "Last Month",
                "Last Year",
                "All Time",
              ]}
              value={timeFrame}
              onValueChange={(value) => {
                setTimeFrame(value);
                // setSearch("");
              }}
            /> */}
            <DatePickerWithRange
              date={dates}
              setDate={setDates}
              isLoading={
                isLoadingAnalytics || isLoadingProducts || isLoadingAllData
              }
              label={false}
            />

            <TipWrapper triggerText="Export as Excel">
              <ExportDialog
                open={open}
                setOpen={setOpen}
                noofRecords={1}
                title="Export the Dashbaord Data"
                description={`Records ready to export as selected filtered`}
                loading={
                  isLoadingAnalytics || isLoadingProducts || isLoadingAllData
                }
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
                        <div className="font-semibold">Branch</div>
                        <div className="text-muted-foreground">{branch}</div>
                      </div>
                      {/*  <div className="flex w-full justify-between">
                        <div className="font-semibold">Payment Mode</div>
                        <div className="text-muted-foreground">
                          {paymentmode}
                        </div>
                      </div> */}
                    </div>

                    {/* <div className="flex w-full justify-between text-green-700">
                      <div className="font-semibold">No of Records</div>
                      <div>{filteredExpenses.length}</div>
                    </div> */}

                    <div className="text-muted-foreground text-sm">
                      If your selected filters won’t meet your export needs,
                      please cancel, adjust the filters on the Orders main
                      screen, and try exporting again
                    </div>

                    {/* {isLoadingAllData ? (
                      <div className="flex items-center gap-3 text-destructive">
                        <div>Please Wait. Data loading...</div>
                        <LoaderCircle className="animate-spin" />
                      </div>
                    ) : (
                      <div className="flex gap-3 items-center text-green-700">
                        Ready to Export <Check />
                      </div>
                    )} */}
                  </div>
                }
              />
            </TipWrapper>
          </div>

          <div className="flex gap-5 w-full">
            <Card className="flex items-center font-semibold flex-col text-muted-foreground min-w-[250px]">
              Sales Count
              {isLoadingAnalytics ? (
                <TextSkeleton
                  length={3}
                  numeric
                  type="muted"
                  textSize="text-6xl"
                />
              ) : (
                <span className="text-primary text-6xl">
                  {getTotalValue("count")}
                </span>
              )}
            </Card>
            <Card className="flex items-center flex-col text-muted-foreground min-w-[350px] h-fit font-semibold">
              Sales Revenue ( Rs )
              {isLoadingAnalytics ? (
                <span className="flex text-6xl">
                  <TextSkeleton
                    length={5}
                    numeric
                    type="muted"
                    textSize="text-6xl"
                  />
                  .00
                </span>
              ) : (
                <span className="text-primary text-6xl">
                  {new Intl.NumberFormat("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(getTotalValue("saleValue"))}
                </span>
              )}
            </Card>
            <Card className="flex items-center shadow-special-success flex-col text-muted-foreground min-w-[350px] h-fit font-semibold">
              Sales Revenue Collected ( Rs )
              {isLoadingAnalytics ? (
                <span className="flex text-6xl">
                  <TextSkeleton
                    length={5}
                    numeric
                    type="muted"
                    textSize="text-6xl"
                  />
                  .00
                </span>
              ) : (
                <span className="text-primary text-6xl">
                  {new Intl.NumberFormat("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(getIncome("collected"))}
                </span>
              )}
            </Card>
          </div>
          <div className="flex w-full gap-5">
            <Card className="flex flex-1 flex-col min-h-[200px] text-muted-foreground font-semibold">
              Trending Products
              {isLoadingProducts || isLoadingAnalytics ? (
                <div className="flex flex-col mt-2 text-primary font-normal">
                  {Array.from({ length: 5 }, (_, index) => (
                    <div key={index} className="flex justify-between gap-5">
                      <TextSkeleton
                        length={15}
                        type="muted"
                        textSize="text-base"
                      />
                      <TextSkeleton
                        length={5}
                        numeric
                        type="muted"
                        textSize="text-base"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col mt-2 text-primary font-normal">
                  {analytics && analytics.products.length > 0 ? (
                    (() => {
                      const branchData = analytics.products.find(
                        (i) => i.branch === branch,
                      );
                      if (
                        !branchData ||
                        !branchData.items ||
                        branchData.items.length === 0
                      ) {
                        return <NoRecordsCard mini />;
                      }

                      return branchData.items.map((it, index) => (
                        <div
                          className="flex w-full justify-between gap-5"
                          key={index}
                        >
                          <span className="line-clamp-1">
                            {getProductVariantFullNameByVarientId(
                              products!,
                              it.productVarientId,
                            )}
                          </span>
                          <span>{it.count}</span>
                        </div>
                      ));
                    })()
                  ) : (
                    <NoRecordsCard mini />
                  )}
                </div>
              )}
            </Card>
            <Card className="flex items-center flex-col justify-center shadow-special-warning text-muted-foreground min-w-[350px] font-semibold">
              Sales Revenue Receivables ( Rs )
              {isLoadingAnalytics ? (
                <span className="flex text-6xl">
                  <TextSkeleton
                    length={5}
                    numeric
                    type="muted"
                    textSize="text-6xl"
                  />
                  .00
                </span>
              ) : (
                <span className="text-primary text-6xl">
                  {new Intl.NumberFormat("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(getIncome("remains"))}
                </span>
              )}
            </Card>
          </div>
          <div className="flex w-full gap-5">
            <Card className="shadow-special-success flex flex-1 flex-col min-h-[200px] text-muted-foreground font-semibold">
              Collected Net Operating Cash Flow ( Rs )
              {isLoadingProducts || isLoadingAnalytics ? (
                <div className="flex w-full justify-between items-center">
                  <span className="flex text-6xl">
                    <TextSkeleton
                      length={5}
                      numeric
                      type="muted"
                      textSize="text-6xl"
                    />
                    .00
                  </span>{" "}
                  <div className="flex flex-col mt-2 text-primary font-normal">
                    {Array.from({ length: 5 }, (_, index) => (
                      <div key={index} className="flex justify-between gap-5">
                        <TextSkeleton
                          length={15}
                          type="muted"
                          textSize="text-base"
                        />
                        <TextSkeleton
                          length={5}
                          numeric
                          type="muted"
                          textSize="text-base"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex justify-around h-full">
                  <div className="flex flex-col h-full text-primary font-normal">
                    {analytics && analytics.incomes ? (
                      <div className="flex flex-col w-fit h-full justify-center">
                        <span className="text-primary text-6xl font-semibold w-fit">
                          {new Intl.NumberFormat("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }).format(getIncome("collected") - getExpense())}
                        </span>
                        <div className="text-muted-foreground text-right">
                          <span className="text-primary text-sm">
                            {new Intl.NumberFormat("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(getIncome("collected"))}
                          </span>
                          <span>-</span>
                          <span className="text-primary text-sm">
                            {new Intl.NumberFormat("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(getExpense())}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <NoRecordsCard mini />
                    )}
                  </div>
                  <div className="flex flex-col justify-center">
                    {Object.entries(getNetCashflowBreakdown()).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className={`${
                            value === 0
                              ? "text-muted-foreground"
                              : value > 0
                                ? "text-green-700"
                                : "text-destructive"
                          } flex text-base justify-between gap-x-5`}
                        >
                          <span className="w-[50px]">{key}</span>
                          <span>
                            {new Intl.NumberFormat("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(value)}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}
            </Card>
            <Card className="flex items-center flex-col justify-center shadow-special-error text-muted-foreground min-w-[350px] font-semibold">
              Expenses ( Rs )
              {isLoadingAnalytics ? (
                <span className="flex text-6xl">
                  <TextSkeleton
                    length={5}
                    numeric
                    type="muted"
                    textSize="text-6xl"
                  />
                  .00
                </span>
              ) : (
                <span className="text-primary text-6xl">
                  {new Intl.NumberFormat("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(getExpense())}
                </span>
              )}
            </Card>
          </div>
        </div>
        <ChartPieLabel
          title="Payment Methods"
          description={`${dates?.from?.toLocaleDateString() ?? ""} ${
            dates?.to ? `- ${dates.to.toLocaleDateString()}` : ""
          }`}
          chartData={getChartData()}
          isLoading={isLoadingAnalytics}
          extraDataArray={analytics?.incomes}
        />
      </div>
    </div>
  );
};

export default Dashboard;
