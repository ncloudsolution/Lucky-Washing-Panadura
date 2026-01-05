import { auth } from "@/auth";
import { T_Role } from "@/data/permissions";
import prisma from "@/prisma/client";
import { getDateRange } from "@/utils/common";
import { NextRequest, NextResponse } from "next/server";

//create job entry
export const GET = auth(async function POST(req) {
  const { searchParams } = new URL(req.url);
  const timeFrame = searchParams.get("timeframe");

  const authRole = "director" as T_Role;
  const authBranch = "Horana";

  try {
    const stockMetas = await prisma.productStock.findMany({
      where: {
        ...(authRole === "manager" || authRole === "uniter"
          ? { branch: authBranch }
          : {}),

        createdAt: {
          gte: getDateRange(timeFrame),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const totals = stockMetas.reduce(
      (acc, item) => {
        const quantity = Number(item.quantity);
        const unitPrice = Number(item.unitPrice);
        const discount = Number(item.discount ?? 0);

        const value = quantity * unitPrice;

        if (item.in) {
          acc.totalIn += value - discount;
        } else {
          acc.totalOut += value;
        }

        return acc;
      },
      { totalIn: 0, totalOut: 0 }
    );

    return NextResponse.json(
      {
        data: { stockInValue: totals.totalIn, stockOutValue: totals.totalOut },
        success: true,
        message: "Data saved successfully!",
      },
      { status: 201 }
    );
  } catch (e) {
    console.error("Error:", e);
    return NextResponse.json(
      {
        suceess: false,
        message: "An error occurred while processing your request",
        error: e instanceof Error ? e.message : String(e),
      },
      { status: 500 }
    );
  }
});
