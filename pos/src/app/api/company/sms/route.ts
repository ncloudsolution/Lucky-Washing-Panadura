import { auth } from "@/auth";
import { hasPermission, T_Role } from "@/data/permissions";
import prisma from "@/prisma/client";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const POST = auth(async function POST(req) {
  const data = await req.json();
  const status = data.status;

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
      permission: "set:sms",
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
    const business = await prisma.businessMeta.findFirst({});

    await prisma.businessMeta.update({
      where: {
        id: business!.id,
      },
      data: {
        sms: status,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `SMS alert ${status ? "enabled" : "disabled"} successsfully`,
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

export const GET = async function GET(req: NextRequest) {
  try {
    const business = await prisma.businessMeta.findFirst({});
    const sms = business?.sms;

    return NextResponse.json(
      {
        success: true,
        message: "SMS status fetched successfully",
        data: sms,
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
};
