import { auth } from "@/auth";
import { BranchSummary } from "@/data";
import { hasPermission, T_Role } from "@/data/permissions";
import prisma from "@/prisma/client";
import { getDateRange } from "@/utils/common";
import { NextResponse } from "next/server";

export const GET = auth(async function GET(req: any) {
  const { searchParams } = new URL(req.url);
  const timeFrame = searchParams.get("timeframe");

  const authRole = req.auth?.user?.role?.toLowerCase() as T_Role;
  const authBranch = req.auth?.user?.branch;

  // const authRole = "director" as T_Role;
  // const authBranch = "Bentota";

  if (!req.auth) {
    return NextResponse.json(
      {
        success: false,
        message: "you are not authenticated",
        error: "UNAUTHORIZED",
      },
      { status: 401 }
    );
  }

  try {
    if (
      !hasPermission({
        userRole: authRole,
        userBranch: authBranch,
        permission: "view:analytics",
      })
    ) {
      return NextResponse.json(
        { success: false, message: "Not authorized" },
        { status: 403 }
      );
    }

    const branches = (
      await prisma.branchMeta.findMany({
        select: { branch: true },
      })
    ).map((b) => b.branch);

    const orders = await prisma.orderMeta.findMany({
      where: {
        createdAt: { gte: getDateRange(timeFrame) },
        ...(authRole !== "director" && { branch: authBranch }),
      },
      select: {
        id: true,
        branch: true,
        saleValue: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const income = await prisma.income.findMany({
      where: {
        createdAt: { gte: getDateRange(timeFrame) },
      },
      select: {
        paymentMethod: true,
        amount: true,
        order: {
          where: { ...(authRole !== "director" && { branch: authBranch }) },
          select: {
            branch: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedIncome = income
      .filter((i) => i.order) // remove nulls
      .map((i) => ({
        branch: i.order!.branch, // ! tells TS this is definitely not null
        paymentMethod: i.paymentMethod,
        amount: Number(i.amount),
      }));

    const groupedByBranch = formattedIncome.reduce((acc, curr) => {
      const branchName = curr.branch;
      if (!acc[branchName]) {
        acc[branchName] = {};
      }

      const pm = curr.paymentMethod;
      if (!acc[branchName][pm]) {
        acc[branchName][pm] = { count: 0, amount: 0 };
      }

      acc[branchName][pm].count += 1;
      acc[branchName][pm].amount += curr.amount;

      return acc;
    }, {} as Record<string, Record<string, { count: number; amount: number }>>);

    // Step 4: Convert to your desired array format
    const incomeResult = Object.entries(groupedByBranch).map(
      ([branch, payments]) => ({
        branch,
        breakdown: Object.entries(payments).map(([type, data]) => ({
          type,
          count: data.count,
          amount: data.amount,
        })),
      })
    );

    // Step 5: Add "All Branches" summary
    const allBranchTotals: Record<string, { count: number; amount: number }> =
      {};

    incomeResult.forEach((branchObj) => {
      branchObj.breakdown.forEach(({ type, count, amount }) => {
        if (!allBranchTotals[type])
          allBranchTotals[type] = { count: 0, amount: 0 };
        allBranchTotals[type].count += count;
        allBranchTotals[type].amount += amount;
      });
    });

    incomeResult.push({
      branch: "All Branches",
      breakdown: Object.entries(allBranchTotals).map(([type, data]) => ({
        type,
        count: data.count,
        amount: data.amount,
      })),
    });

    //--------------income-over------------------------------

    const expense = await prisma.expense.findMany({
      where: {
        createdAt: { gte: getDateRange(timeFrame) },
        ...(authRole !== "director" && { branch: authBranch }),
      },
      select: {
        branch: true,
        paymentMethod: true,
        amount: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedExpense = expense
      .filter((i) => i.branch) // remove nulls
      .map((i) => ({
        branch: i.branch, // ! tells TS this is definitely not null
        paymentMethod: i.paymentMethod,
        amount: Number(i.amount),
      }));

    const groupedByBranchExp = formattedExpense.reduce((acc, curr) => {
      const branchName = curr.branch;
      if (!acc[branchName]) {
        acc[branchName] = {};
      }

      const pm = curr.paymentMethod;
      if (!acc[branchName][pm]) {
        acc[branchName][pm] = { count: 0, amount: 0 };
      }

      acc[branchName][pm].count += 1;
      acc[branchName][pm].amount += curr.amount;

      return acc;
    }, {} as Record<string, Record<string, { count: number; amount: number }>>);

    // Step 4: Convert to your desired array format
    const expenseResult = Object.entries(groupedByBranchExp).map(
      ([branch, payments]) => ({
        branch,
        breakdown: Object.entries(payments).map(([type, data]) => ({
          type,
          count: data.count,
          amount: data.amount,
        })),
      })
    );

    // Step 5: Add "All Branches" summary
    const allBranchTotalsExp: Record<
      string,
      { count: number; amount: number }
    > = {};

    expenseResult.forEach((branchObj) => {
      branchObj.breakdown.forEach(({ type, count, amount }) => {
        if (!allBranchTotals[type])
          allBranchTotals[type] = { count: 0, amount: 0 };
        allBranchTotals[type].count += count;
        allBranchTotals[type].amount += amount;
      });
    });

    expenseResult.push({
      branch: "All Branches",
      breakdown: Object.entries(allBranchTotalsExp).map(([type, data]) => ({
        type,
        count: data.count,
        amount: data.amount,
      })),
    });

    //--------------expense-over------------------------

    const initialObj: BranchSummary = {
      branch: "xx",
      totalCount: 0,
      totalSaleValue: 0,
    };

    const initialArray: BranchSummary[] = [];
    const orderIdArray: string[] = [];

    for (let i = 0; i < branches.length; i++) {
      if (authRole !== "director") {
        initialArray.push({
          ...initialObj,
          branch: authBranch,
        });
        break;
      }

      initialArray.push({
        ...initialObj,
        branch: branches[i],
      });
    }

    for (let i = 0; i < orders.length; i++) {
      const branchObj = initialArray.find(
        (x) => x.branch === orders[i].branch
      )!;
      branchObj.totalCount += 1;
      branchObj.totalSaleValue += Number(orders[i].saleValue);

      if (!orderIdArray.includes(orders[i].id)) {
        orderIdArray.push(orders[i].id);
      }
    }

    const itemsWithBranch = await prisma.orderItem.findMany({
      where: {
        orderId: { in: orderIdArray },
      },
      include: {
        order: {
          select: { branch: true }, // get branch from related order
        },
      },
    });

    const grouped = itemsWithBranch.reduce((acc, item) => {
      const branch = item.order.branch;

      if (!acc[branch]) acc[branch] = [];

      const existing = acc[branch].find(
        (i) => i.productVarientId === item.productVarientId
      );

      if (existing) {
        existing.count += Number(item.quantity);
      } else {
        acc[branch].push({
          productVarientId: item.productVarientId,
          count: Number(item.quantity),
        });
      }

      return acc;
    }, {} as Record<string, { productVarientId: string; count: number }[]>);

    const top5PerBranch = Object.entries(grouped).map(([branch, items]) => ({
      branch,
      items: items
        .sort((a, b) => b.count - a.count) // descending
        .slice(0, 5), // top 5
    }));

    const items = await prisma.orderItem.groupBy({
      by: ["productVarientId"],
      where: {
        orderId: { in: orderIdArray },
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 5,
    });

    const itemsFinalArray = items.map((i) => ({
      productVarientId: i.productVarientId,
      count: i._sum.quantity ? Number(i._sum.quantity) : 0,
    }));

    const allBranchesItems = { branch: "All Branches", items: itemsFinalArray };
    top5PerBranch.push(allBranchesItems);

    const finalData = {
      orders: initialArray,
      products: top5PerBranch,
      incomes: incomeResult,
      expenses: expenseResult,
      // stocks: { stockInValue: totals.totalIn, stockOutValue: totals.totalOut },
    };

    return NextResponse.json(
      {
        success: true,
        message: "Analytical data fetch successfully!",
        data: finalData,
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
});

// {
//     "orders": [
//       {
//         "branch": "Bentota",
//         "totalCount": 4,
//         "totalSaleValue": 525,
//         "breakdown": [
//           {
//             "type": "Cash",
//             "count": 3,
//             "saleValue": 465
//           },
//           {
//             "type": "Card",
//             "count": 1,
//             "saleValue": 60
//           },
//           {
//             "type": "Bank",
//             "count": 0,
//             "saleValue": 0
//           },
//           {
//             "type": "Credit",
//             "count": 0,
//             "saleValue": 0
//           }
//         ]
//       }
//     ],
//     "items": [
//       {
//         "productVarientId": "cmiofhl0m0002ue50aygfldiy",
//         "quantity": "4"
//       },
//       {
//         "productVarientId": "cmiofx1q7000due50oduykr42",
//         "quantity": "2"
//       },
//       {
//         "productVarientId": "cmiofjeic0004ue5009ou3wtg",
//         "quantity": "2"
//       },
//       {
//         "productVarientId": "cmiq2yz0o000iue3gy2kplcfd",
//         "quantity": "1"
//       },
//       {
//         "productVarientId": "cmiog2zel000gue50wnhznpfe",
//         "quantity": "1"
//       },
//       {
//         "productVarientId": "cmiq2yjdd000gue3ga9sntmm4",
//         "quantity": "1"
//       }
//     ]
//   }

//date come from params
// Today,last 7 Days, Last Month, last Year , all time

//if manger or uniter request only come that particulat barnch only array
// first reacd the branch tabel and get all branches
//  "Cancelled", //Order cancelled by customer or seller.
//   "Returned", ignore
