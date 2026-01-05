import { auth } from "@/auth";
import { ICustomer } from "@/components/custom/forms/FormCustomer";
import { hasPermission, T_Role } from "@/data/permissions";
import prisma from "@/prisma/client";
import { backendDataValidation } from "@/utils/common";
import { CustomerSchema } from "@/utils/validations/customer";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const GET = async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  let mode: string;
  if (searchParams.has("mobile")) mode = "mobile";
  //   else if (searchParams.has("search")) mode = "search";
  else mode = "list";

  switch (mode) {
    //############## SEARCH BY MOBILE #################
    case "mobile": {
      const mobile = searchParams.get("mobile")?.trim();
      const modMobile = "+" + mobile;

      if (!mobile) {
        return NextResponse.json(
          {
            success: false,
            message: "Mobile missing",
            data: null,
          },
          { status: 400 }
        );
      }

      try {
        const customers = await prisma.customerMeta.findMany({
          where: {
            mobile: { startsWith: modMobile },
          },
        });

        return NextResponse.json(
          {
            success: true,
            message: "Customers found successfully!",
            data: customers,
          },
          { status: 200 }
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
    }

    // case "search": {
    //   const keyword = searchParams.get("search")!;
    //   const page  = parseInt(searchParams.get("page")  || "1", 10);
    //   const limit = parseInt(searchParams.get("limit") || "20", 10);
    //   // query DB for name search with pagination
    //   return NextResponse.json({ type: "search", keyword, page, limit });
    // }

    case "list":
    default: {
      const customers = await prisma.customerMeta.findMany({
        orderBy: { createdAt: "desc" },
      });
      console.log("ji");
      return NextResponse.json(
        {
          success: true,
          message: "Customers found successfully!",
          data: customers,
        },
        { status: 200 }
      );
    }
  }
};

//add customer
export const POST = auth(async function POST(req: any) {
  try {
    const data: ICustomer = await req.json();

    // Backend validation
    const { validationStatus, validationResponse } = backendDataValidation({
      schema: CustomerSchema,
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
        permission: "create:customer",
        // resourceBranch,
        // userBranch: authBranch,
      })
    ) {
      return NextResponse.json(
        { success: false, message: "Not authorized" },
        { status: 403 }
      );
    }

    //check duplications
    const existingCustomer = await prisma.customerMeta.findFirst({
      where: {
        mobile: data.mobile,
      },
    });

    if (existingCustomer) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer already exists",
        },
        { status: 409 }
      );
    }
    await prisma.customerMeta.create({ data: data });

    return NextResponse.json(
      { success: true, message: "Customer created successfully" },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}) as (req: Request) => Promise<Response>;

export const DELETE = auth(async function DELETE(req) {
  try {
    const data = await req.json();
    const mobile = data.mobile;

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
        permission: "create:customer",
        // resourceBranch,
        // userBranch: authBranch,
      })
    ) {
      return NextResponse.json(
        { success: false, message: "Not authorized" },
        { status: 403 }
      );
    }

    const customer = await prisma.customerMeta.findFirst({
      where: { mobile: mobile },
    });

    if (customer?.name === "Default") {
      return NextResponse.json(
        {
          success: false,
          message: "The default customer cannot be deleted",
        },
        { status: 409 }
      );
    }

    const customerInUse = await prisma.orderMeta.findFirst({
      where: {
        customerId: customer?.id,
      },
      select: { id: true },
    });

    if (customerInUse) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer deletion failed due to existing orders.",
        },
        { status: 409 }
      );
    }

    await prisma.customerMeta.delete({
      where: { id: customer?.id },
    });

    //write the logic chekc the if product in

    return NextResponse.json(
      {
        success: true,
        message: `Customer deleted sucessfully`,
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

//edit customer
export const PUT = auth(async function PUT(req: any) {
  try {
    const data = await req.json();
    const mobile = data.mobile;

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
    const authId = req.auth?.user?.id;

    if (
      !hasPermission({
        userRole: authRole,
        permission: "create:customer",
        // resourceBranch,
        // userBranch: authBranch,
      })
    ) {
      return NextResponse.json(
        { success: false, message: "Not authorized" },
        { status: 403 }
      );
    }

    const existingCustomer = await prisma.customerMeta.findFirst({
      where: {
        mobile: mobile,
      },
    });

    if (existingCustomer) {
      return NextResponse.json(
        {
          success: false,
          message: "Duplicate number. Update failed.",
        },
        { status: 409 }
      );
    }

    await prisma.customerMeta.update({
      where: {
        mobile: data.oldMobile,
      },
      data: {
        mobile: mobile,
        name: data.name,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Customer updated successfully",
        data: null,
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
