import { TPaymentMethod, TPaymentStatus, TPeriod } from "@/data";
import prisma from "@/prisma/client";
import { getMissedCyclesFromExpiry } from "@/utils/common";
import { NextRequest, NextResponse } from "next/server";

//get all due ---------------------------
export const GET = async function GET(req: NextRequest) {
  try {
    const bizDetails = await prisma.businessMeta.findFirst({
      select: { plan: true, planCycle: true, createdAt: true },
    });

    const data = {
      plan: bizDetails?.plan,
      planCycle: bizDetails?.planCycle,
      dueAmount: 0,
      dueCycles: 0,
      lastPaymentDate: null,
      lastPaymentStatus: false,
      paidThroughDate: null,
      nextDueDate: null,
    };

    if (bizDetails?.plan === "Free") {
      return NextResponse.json(
        {
          success: true,
          message: "Due retrieved successfully!",
          data: data,
        },
        { status: 200 }
      );
    }

    const lastPayment = await prisma.payments.findFirst({
      orderBy: { createdAt: "desc" },
      take: 1,
    });

    const { cyclesMissed, dueDate } = getMissedCyclesFromExpiry(
      lastPayment!.expiredAt,
      bizDetails!.planCycle as TPeriod,
      lastPayment!.status as TPaymentStatus
    );
    // Get plan price
    const plan = await prisma.plan.findFirst({
      where: { name: bizDetails?.plan },
      select: { monthlyPrice: true, yearlyDiscountPercentage: true },
    });

    const monthlyPrice = plan!.monthlyPrice.toNumber();
    const yearlyDiscount = plan!.yearlyDiscountPercentage.toNumber();

    const price =
      bizDetails?.planCycle === "Monthly"
        ? monthlyPrice * cyclesMissed
        : monthlyPrice * 12 * cyclesMissed * (1 - yearlyDiscount / 100);

    return NextResponse.json(
      {
        success: true,
        message: "Due retrieved successfully!",
        data: {
          ...data,
          dueAmount: price,
          dueCycles: cyclesMissed,
          lastPaymentDate: lastPayment?.createdAt,
          lastPaymentStatus: lastPayment?.status,
          paidThroughDate: lastPayment?.expiredAt,
          nextDueDate: dueDate,
        },
      },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json(
      {
        suceess: false,
        message: "An error occurred while processing your request",
        error: e instanceof Error ? e.message : String(e),
      },
      { status: 500 }
    );
  }
};
