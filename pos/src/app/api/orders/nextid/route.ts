import { auth } from "@/auth";
import { hasPermission, T_Role } from "@/data/permissions";
import prisma from "@/prisma/client";
import { NextResponse } from "next/server";

export const GET = auth(async function GET(req: any) {
  const { searchParams } = new URL(req.url);
  const operator = searchParams.get("operator");

  const authRole = req.auth?.user?.role?.toLowerCase() as T_Role;

  //testing purpose
  // const authRole = "uniter" as T_Role;

  if (!req.auth) {
    return NextResponse.json(
      {
        success: false,
        message: "You are not authenticated",
        error: "UNAUTHORIZED",
      },
      { status: 401 }
    );
  }

  if (
    !hasPermission({
      userRole: authRole,
      permission: "create:order",
    })
  ) {
    return NextResponse.json(
      { success: false, message: "Not authorized" },
      { status: 403 }
    );
  }

  if (!operator) {
    return NextResponse.json(
      {
        success: false,
        message: "Operator Id missing",
        data: null,
        error: "INVALID OPERATION",
      },
      { status: 400 }
    );
  }
  try {
    const lastOrder = await prisma.orderMeta.findFirst({
      where: {
        operator: operator,
      },
      select: {
        invoiceId: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!lastOrder) {
      return NextResponse.json(
        {
          success: true,
          message: "Invoice suffix retrieved successfully!",
          data: "0",
        },
        { status: 200 }
      );
    }

    const lastId = lastOrder?.invoiceId.slice(2);
    const nextId = Number(lastId) + 1;
    return NextResponse.json(
      {
        success: true,
        message: "Invoice suffix retrieved successfully!",
        data: nextId.toString(),
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
});
