import { auth } from "@/auth";
import { hasPermission, T_Role } from "@/data/permissions";
import prisma from "@/prisma/client";
import { backendDataValidation } from "@/utils/common";
import { StatusSchema } from "@/utils/validations/company";
import { NextResponse } from "next/server";

export const PUT = auth(async function PUT(req: any) {
  try {
    const data = await req.json();

    // Backend validation
    const { validationStatus, validationResponse } = backendDataValidation({
      schema: StatusSchema,
      data,
    });

    if (!validationStatus) {
      return validationResponse;
    }

    console.log(
      data,
      "----------------------data------------------------------",
    );

    // authentication & permission check
    if (!req.auth) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authenticated",
          error: "UNAUTHORIZED",
        },
        { status: 401 },
      );
    }

    const authRole = req.auth?.user?.role?.toLowerCase() as T_Role;

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

    if (!data.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot find related order",
        },
        { status: 404 },
      );
    }

    await prisma.orderMeta.update({
      where: {
        id: data.id,
      },
      data: {
        status: data.status,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Status updated successfully",
        data: null,
      },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
});
