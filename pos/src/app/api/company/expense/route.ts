import { auth } from "@/auth";
import { IExpense } from "@/components/custom/forms/FormExpense";
import { hasPermission, T_Role } from "@/data/permissions";
import prisma from "@/prisma/client";
import { backendDataValidation } from "@/utils/common";
import { ExpenseSchema } from "@/utils/validations/company";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

export const POST = auth(async function POST(req) {
  const data = await req.json();
  const { remarks, id, ...rest } = data;
  const modData = { ...rest, remarks: remarks || null };

  const { validationStatus, validationResponse } = backendDataValidation({
    schema: ExpenseSchema,
    data,
  });

  if (!validationStatus) {
    return validationResponse;
  }

  console.log(data);

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

  const authRole = (req.auth?.user?.role?.toLowerCase() || "system") as T_Role;

  // const authRole = "system" as T_Role;

  if (
    !hasPermission({
      userRole: authRole,
      permission: "create:categories",
      // resourceBranch,
      // userBranch: authBranch,
    })
  ) {
    return NextResponse.json(
      { success: false, message: "Not authorized" },
      { status: 403 }
    );
  }

  //need here the auth check ###############################
  try {
    const exp = await prisma.expense.create({
      data: modData,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Expense recorded successsfully`,
        data: exp.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.log(error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.log(error);
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
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { message: "An unknown error occurred." },
        { status: 500 }
      );
    }
  }
});

export const GET = auth(async function GET(req: any) {
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

  const authRole = req.auth?.user?.role?.toLowerCase() as T_Role;

  // const authRole = "system" as T_Role;

  if (
    !hasPermission({
      userRole: authRole,
      permission: "create:categories",
      // resourceBranch,
      // userBranch: authBranch,
    })
  ) {
    return NextResponse.json(
      { success: false, message: "Not authorized" },
      { status: 403 }
    );
  }

  try {
    const orderMetas = await prisma.expense.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Recent expenses fetch successfully!",
        data: orderMetas,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.log(error);
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
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { message: "An unknown error occurred." },
        { status: 500 }
      );
    }
  }
});

export const PUT = auth(async function POST(req: any) {
  const data: IExpense = await req.json();
  const { remarks, ...rest } = data;
  const modData = {
    ...rest,
    remarks: remarks || null,
  };
  try {
    // Backend validation
    const { validationStatus, validationResponse } = backendDataValidation({
      schema: ExpenseSchema,
      data,
    });

    if (!validationStatus) {
      return validationResponse;
    }

    // authentication & permission check
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

    const authRole = req.auth?.user?.role?.toLowerCase() as T_Role;

    //testing purpose
    // const authRole = "uniter" as T_Role;

    console.log(authRole, "auth role");

    if (
      !hasPermission({
        userRole: authRole,
        permission: "create:categories",
        // resourceBranch,
        // userBranch: authBranch,
      })
    ) {
      return NextResponse.json(
        { success: false, message: "Not authorized" },
        { status: 403 }
      );
    }

    // ✅ Update only specific fields
    const updatedProduct = await prisma.expense.update({
      where: { id: data.id! },
      data: modData,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Expense updated successfully",
        data: updatedProduct,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
});

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
        { status: 401 }
      );
    }

    const authRole = (req.auth?.user?.role?.toLowerCase() ||
      "system") as T_Role;

    // const authRole = "system" as T_Role;

    if (
      !hasPermission({
        userRole: authRole,
        permission: "create:categories",
        // resourceBranch,
        // userBranch: authBranch,
      })
    ) {
      return NextResponse.json(
        { success: false, message: "Not authorized" },
        { status: 403 }
      );
    }

    await prisma.expense.delete({
      where: { id: id },
    });

    //write the logic chekc the if product in

    return NextResponse.json(
      {
        success: true,
        message: `  Expense deleted sucessfully`,
        data: null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);

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
      { status: 500 }
    );
  }
});
