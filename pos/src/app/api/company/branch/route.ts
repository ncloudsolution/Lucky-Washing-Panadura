import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { IBranch } from "@/components/custom/forms/FormBranch";
import prisma from "@/prisma/client";
import { hasPermission, T_Role } from "@/data/permissions";
import { backendDataValidation } from "@/utils/common";
import { BranchSchema } from "@/utils/validations/company";

//create staff
type BranchRequest = Omit<IBranch, "hotlines"> & {
  hotlines: { value: string }[];
};

export const POST = auth(async function POST(req: any) {
  try {
    const data: BranchRequest = await req.json();

    // Backend validation
    const { validationStatus, validationResponse } = backendDataValidation({
      schema: BranchSchema,
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

    const authRole = (req.auth?.user?.role?.toLowerCase() ||
      "system") as T_Role;

    // const authRole = "system" as T_Role;

    if (
      !hasPermission({
        userRole: authRole,
        permission: "create:core",
        // resourceBranch,
        // userBranch: authBranch,
      })
    ) {
      return NextResponse.json(
        { success: false, message: "Not authorized" },
        { status: 403 }
      );
    }

    //organize data
    const { hotlines, ...rest } = data;
    const modHotlines = hotlines.map((i) => i.value);

    const baseBranch = {
      ...rest,
      hotlines: modHotlines,
    };

    //check duplications
    const existingBranch = await prisma.branchMeta.findFirst({
      where: {
        OR: [
          { branch: data.branch },
          { address: data.address },
          { hotlines: { hasSome: modHotlines } },
        ],
      },
    });

    if (existingBranch) {
      return NextResponse.json(
        {
          success: false,
          message: "City or address or hotline already exists",
        },
        { status: 409 }
      );
    }
    await prisma.branchMeta.create({ data: baseBranch });

    return NextResponse.json(
      { success: true, message: "Branch added successfully" },
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

//get all branch data (any one can access this data) ---------------------------
export const GET = async function GET(req: NextRequest) {
  try {
    const data = await prisma.branchMeta.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Branches retrieved successfully!",
        data: data,
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
};
