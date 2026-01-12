import { auth } from "@/auth";
import { hasPermission, T_Role } from "@/data/permissions";
import prisma from "@/prisma/client";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

export const POST = auth(async function POST(req) {
  const data = await req.json();
  const { remarks, id, ...rest } = data;
  const modData = { ...rest, remarks: remarks || null };

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
    await prisma.expense.create({
      data: modData,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Expense recorded successsfully`,
        data: null,
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
