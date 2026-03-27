import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/prisma/client";

import { backendDataValidation, getNewDateRange } from "@/utils/common";
import { hasPermission, T_Role } from "@/data/permissions";
import { IncomeSchema } from "@/utils/validations/company";
import { Prisma } from "@prisma/client";

//create staff
export const POST = auth(async function POST(req: any) {
  try {
    const data = await req.json();

    const { id, due, ...rest } = data;

    // Backend validation
    const { validationStatus, validationResponse } = backendDataValidation({
      schema: IncomeSchema(due),
      data,
    });

    if (!validationStatus) {
      return validationResponse;
    }

    // take this from authjs
    // authentication & permission check
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

    const authRole = (req.auth?.user?.role?.toLowerCase() ||
      "system") as T_Role;
    const authBranch = req.auth?.user?.branch.toLowerCase() || "homagama";

    // const authRole = "system" as T_Role;
    // const authBranch = "homagama";

    if (
      !hasPermission({
        userRole: authRole,
        permission: "create:order",
        userBranch: authBranch,
      })
    ) {
      return NextResponse.json(
        { success: false, message: "Not authorized" },
        { status: 403 },
      );
    }

    const x = await prisma.income.create({ data: rest });

    return NextResponse.json(
      { success: true, message: "Payment added successfully", data: x.id },
      { status: 201 },
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}) as (req: Request) => Promise<Response>;

export const DELETE = auth(async function DELETE(req) {
  try {
    const data = await req.json();
    const id = data.id;

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

    const authRole = (req.auth?.user?.role?.toLowerCase() ||
      "system") as T_Role;

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

    await prisma.income.delete({
      where: { id: id },
    });

    //write the logic chekc the if product in

    return NextResponse.json(
      {
        success: true,
        message: `  Payment deleted sucessfully`,
        data: null,
      },
      { status: 200 },
    );
  } catch (error) {
    let message = "Internal server error";

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P1001") {
        message = "Database is unavailable. Please try again shortly.";
      }
    }

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 },
    );
  }
});

export const GET = auth(async function GET(req: any) {
  const { searchParams } = new URL(req.url);
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

  const authRole = req.auth?.user?.role?.toLowerCase() as T_Role;

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
  try {
    if (searchParams.has("debounce")) {
      const invoiceIdParam = searchParams.get("debounce") as string;
      const incomeMetas = await prisma.income.findMany({
        where: {
          order: {
            is: {
              invoiceId: {
                startsWith: invoiceIdParam,
                mode: "insensitive", // optional (case-insensitive)
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          order: {
            select: {
              invoiceId: true,
            },
          },
        },
      });

      // ✅ Flatten here
      const flatData = incomeMetas.map((i) => ({
        id: i.id,
        orderId: i.orderId,
        category: i.category,
        amount: i.amount, // or Number(i.amount)
        paymentMethod: i.paymentMethod,
        createdAt: i.createdAt,
        invoiceId: i.order?.invoiceId ?? null,
      }));

      return NextResponse.json(
        {
          success: true,
          message: "Recent expenses fetch successfully!",
          data: flatData,
        },
        { status: 200 },
      );
    }

    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    const dateRange = {
      from: fromParam ? new Date(fromParam) : undefined,
      to: toParam ? new Date(toParam) : undefined,
    };

    const incomeMetas = await prisma.income.findMany({
      where: {
        createdAt: getNewDateRange(dateRange),
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        order: {
          select: {
            invoiceId: true,
          },
        },
      },
    });

    // ✅ Flatten here
    const flatData = incomeMetas.map((i) => ({
      id: i.id,
      orderId: i.orderId,
      category: i.category,
      amount: i.amount, // or Number(i.amount)
      paymentMethod: i.paymentMethod,
      createdAt: i.createdAt,
      invoiceId: i.order?.invoiceId ?? null,
    }));

    return NextResponse.json(
      {
        success: true,
        message: "Recent expenses fetch successfully!",
        data: flatData,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      let message = "Something wrong with your connection";

      if (error.code === "P1001") {
        message = "Service is waking up. Please try again in a moment.";
      }

      return NextResponse.json(
        {
          success: false,
          message: message,
          error:
            error instanceof Prisma.PrismaClientKnownRequestError
              ? error
              : String(error),
        },
        { status: 500 },
      );
    } else {
      return NextResponse.json(
        { message: "An unknown error occurred." },
        { status: 500 },
      );
    }
  }
});
