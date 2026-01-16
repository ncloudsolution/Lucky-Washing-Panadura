import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { IStaff } from "@/components/custom/forms/FormStaff";
import prisma from "@/prisma/client";
import { StaffSchema } from "@/utils/validations/company";
import { backendDataValidation } from "@/utils/common";
import { hasPermission, T_Role } from "@/data/permissions";
import { forwardHashing } from "@/utils/hashing";

async function getNextCounterNo() {
  const highestCounter = await prisma.staff.findFirst({
    where: {
      counterNo: { not: null },
    },
    orderBy: { counterNo: "desc" },
    select: { counterNo: true },
  });

  const nextNumber = Number(highestCounter?.counterNo ?? "0") + 1;

  if (nextNumber > 99) {
    throw new Error("Counter limit exceeded (01–99 only)");
  }

  return String(nextNumber).padStart(2, "0");
}

//create staff
export const POST = auth(async function POST(req: any) {
  try {
    const data: IStaff & { confirmPin: string } = await req.json();
    const { confirmPin, counterNo, ...rest } = data;

    // Backend validation
    const { validationStatus, validationResponse } = backendDataValidation({
      schema: StaffSchema,
      data,
    });

    if (!validationStatus) {
      return validationResponse;
    }

    // take this from authjs
    // authentication & permission check
    // if (!req.auth) {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       message: "you are not authenticated",
    //       error: "UNAUTHORIZED",
    //     },
    //     { status: 401 }
    //   );
    // }

    // const authRole = (req.auth?.user?.role?.toLowerCase() ||
    //   "system") as T_Role;
    // const authBranch = req.auth?.user?.branch.toLowerCase() || "homagama";

    // // const authRole = "system" as T_Role;
    // // const authBranch = "homagama";

    // const resourceBranch = data.branch.toLowerCase();

    // if (
    //   !hasPermission({
    //     userRole: authRole,
    //     permission: "create:staff",
    //     resourceBranch,
    //     userBranch: authBranch,
    //   })
    // ) {
    //   return NextResponse.json(
    //     { success: false, message: "Not authorized" },
    //     { status: 403 }
    //   );
    // }

    //check duplications
    const existingStaff = await prisma.staff.findFirst({
      where: {
        OR: [{ email: data.email }, { mobile: data.mobile }],
      },
    });

    if (existingStaff) {
      return NextResponse.json(
        { success: false, message: "Email or mobile already exists" },
        { status: 409 }
      );
    }

    //hash the password
    const hashedPin = await forwardHashing(data.pin);

    const baseMaster = {
      ...rest,
      pin: hashedPin,
    };

    const role = data.role;

    switch (role) {
      case "Uniter": {
        const existingUniter = await prisma.staff.findFirst({
          where: { role: "Uniter" },
        });

        if (existingUniter) {
          return NextResponse.json(
            { success: false, message: "System can have only one Uniter" },
            { status: 409 }
          );
        }

        const counterNo = await getNextCounterNo();

        await prisma.staff.create({
          data: {
            ...baseMaster,
            counterNo,
          },
        });

        break;
      }

      case "Cashier": {
        const counterNo = await getNextCounterNo();

        await prisma.staff.create({
          data: {
            ...baseMaster,
            counterNo,
          },
        });

        break;
      }

      default: {
        // All other roles
        await prisma.staff.create({ data: baseMaster });
        break;
      }
    }

    return NextResponse.json(
      { success: true, message: "User added successfully" },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}) as (req: Request) => Promise<Response>;

export const GET = auth(async function GET(req: any) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const value = searchParams.get("value");

  const authRole = req.auth?.user?.role?.toLowerCase() as T_Role;
  const authId = req.auth?.user?.id;
  const authBranch = req.auth?.user?.branch;

  //testing purpose
  // const authRole = "uniter" as T_Role;

  try {
    switch (type) {
      //############## GET PARTICULAR MEMBER ONLY LIMITED DATA - ALL HAVE ACCESS #################
      case "single-limited": {
        if (!value) {
          return NextResponse.json(
            {
              success: false,
              message: "Staff Id missing",
              data: null,
              error: "INVALID OPERATION",
            },
            { status: 400 }
          );
        }
        const member = await prisma.staff.findFirst({
          where: {
            id: value,
          },
          select: {
            name: true,
            branch: true,
            counterNo: true,
            role: true,
            mobile: true,
          },
        });

        return NextResponse.json(
          {
            success: true,
            message: "Staff Member Limited Data fetch successfully!",
            data: member,
          },
          { status: 200 }
        );
      }
      case "single-rich": {
        //############## GET PARTICULAR MEMBER ONLY RICH DATA #################

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
            permission: "view:stock", //view:staff-single-rich
          })
        ) {
          return NextResponse.json(
            { success: false, message: "Not authorized" },
            { status: 403 }
          );
        }
      }
      // case "all-rich":
      case "all-limited":

      //############## GET ALL MEMBERS LIMITED DATA #################
      default: {
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
      }
    }
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
});
