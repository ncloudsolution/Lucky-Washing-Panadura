import { auth } from "@/auth";
import { hasPermission, T_Role } from "@/data/permissions";
import prisma from "@/prisma/client";
import { backendDataValidation } from "@/utils/common";
import { CategorySchema } from "@/utils/validations/company";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

// to create new categories
export const POST = auth(async function POST(req) {
  const data = await req.json();
  const categories: { value: string }[] = data.categories;

  // Backend validation
  const { validationStatus, validationResponse } = backendDataValidation({
    schema: CategorySchema,
    data,
  });

  if (!validationStatus) {
    return validationResponse;
  }

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
    const business = await prisma.businessMeta.findFirst({});

    //later first letetr capital adjustments ########################
    const newCategories: string[] = categories.map((cat) => cat.value.trim());
    const currentCategories = business?.categories || [];
    const updatedCategories: string[] = [...currentCategories];

    for (const newCat of newCategories) {
      const exists = currentCategories.some(
        (c) => c.trim().toLowerCase() === newCat.toLowerCase()
      );
      if (!exists) {
        updatedCategories.unshift(newCat);
      }
    }

    await prisma.businessMeta.update({
      where: {
        id: business!.id,
      },
      data: {
        categories: updatedCategories,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `${
          newCategories.length > 1 ? "Categories" : "Category"
        } created successsfully`,
        data: null,
      },
      { status: 201 }
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
    const categories = business?.categories ?? [];

    return NextResponse.json(
      {
        success: true,
        message:
          categories.length > 1
            ? "Categories fetched successfully"
            : "Category fetched successfully",
        data: categories,
      },
      { status: 200 }
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
      { status: 500 }
    );
  }
};

export const DELETE = auth(async function DELETE(req) {
  try {
    const data = await req.json();
    const category = data.category;

    const business = await prisma.businessMeta.findFirst({});
    const categories = business?.categories ?? [];

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

    if (!categories.includes(category)) {
      return NextResponse.json(
        {
          success: false,
          message: "There is no such category on server to delete",
          data: null,
        },
        { status: 400 }
      );
    }

    const categoryInUse = await prisma.productMeta.findFirst({
      where: {
        categories: {
          has: category,
        },
      },
      select: { id: true },
    });

    if (categoryInUse) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This Category is already used by products and cannot be deleted",
        },
        { status: 409 }
      );
    }

    const newCategories = categories.filter((i) => i !== category);

    await prisma.businessMeta.update({
      where: { id: business?.id },
      data: {
        categories: newCategories,
      },
    });

    //write the logic chekc the if product in

    return NextResponse.json(
      {
        success: true,
        message: `Category ${category} deleted sucessfully`,
        data: null,
      },
      { status: 200 }
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
      { status: 500 }
    );
  }
});
