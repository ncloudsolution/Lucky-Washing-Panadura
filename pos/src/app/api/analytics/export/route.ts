import { auth } from "@/auth";
import { hasPermission, T_Role } from "@/data/permissions";
import prisma from "@/prisma/client";
import { getNewDateRange } from "@/utils/common";
import { NextResponse } from "next/server";

export const GET = auth(async function GET(req) {
  if (!req.auth) {
    return NextResponse.json(
      {
        success: false,
        message: "you are not authenticated",
        error: "UNAUTHORIZED",
      },
      { status: 401 },
    );
  }

  const authRole = (req.auth?.user?.role?.toLowerCase() || "system") as T_Role;
  const authBranch = req.auth?.user?.branch;
  const authId = req.auth?.user?.id;

  // const authRole = "system" as T_Role;

  if (
    !hasPermission({
      userRole: authRole,
      permission: "create:order",
      // resourceBranch,
      // userBranch: authBranch,
    })
  ) {
    return NextResponse.json(
      { success: false, message: "Not authorized" },
      { status: 403 },
    );
  }
  const { searchParams } = new URL(req.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const branchParam = searchParams.get("branch");

  console.log(branchParam);

  const dateRange = {
    from: fromParam ? new Date(fromParam) : undefined,
    to: toParam ? new Date(toParam) : undefined,
  };

  try {
    const incomes = await prisma.income.findMany({
      where: {
        createdAt: getNewDateRange(dateRange),
        ...(branchParam !== "All Branches" && {
          order: {
            branch: branchParam as string,
          },
        }),
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    console.log(incomes);
    const expenses = await prisma.expense.findMany({
      where: {
        createdAt: getNewDateRange(dateRange),
        ...(branchParam !== "All Branches"
          ? { branch: branchParam as string }
          : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    console.log(expenses, "exp");
    const orderMetas = await prisma.orderMeta.findMany({
      where: {
        createdAt: getNewDateRange(dateRange),
        ...(authRole === "cashier"
          ? { operator: authId }
          : authRole === "manager"
            ? branchParam === "All Branches"
              ? {}
              : { branch: branchParam as string }
            : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        incomes: {
          select: {
            amount: true,
          },
        },
      },
    });
    console.log(orderMetas, "od");
    const ordersWithIncomeSum = orderMetas.map((order) => {
      const totalIncome = order.incomes.reduce(
        (sum, inc) => sum + Number(inc.amount),
        0,
      );

      return {
        ...order,
        paymentAmount: totalIncome,
      };
    });

    const allData = {
      orderRecords: ordersWithIncomeSum,
      incomeRecords: incomes,
      expenseRecords: expenses,
    };

    return NextResponse.json(
      {
        success: true,
        message: "Financila data found successfully!",
        data: allData,
      },
      { status: 200 },
    );
  } catch (e) {
    return NextResponse.json(
      {
        suceess: false,
        message: "An error occurred while processing your request",
        error: e instanceof Error ? e.message : String(e),
      },
      { status: 500 },
    );
  }
});
