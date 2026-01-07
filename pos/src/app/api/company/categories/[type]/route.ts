import { auth } from "@/auth";
import prisma from "@/prisma/client";
import { hasPermission, T_Role } from "@/data/permissions";
import { NextRequest, NextResponse } from "next/server";
import { CATEGORY_CONFIG, CategoryType } from "@/data";
import { backendDataValidation } from "@/utils/common";
import { CategorySchema } from "@/utils/validations/company";

// ---------------------- GET CATEGORIES ----------------------
export const GET = async (req: NextRequest, ctx: any) => {
  const params = await ctx.params;
  if (!params || !params.type) {
    return NextResponse.json(
      { success: false, message: "Category type is missing" },
      { status: 400 }
    );
  }

  const type: CategoryType = params.type;
  const config = CATEGORY_CONFIG[type];

  if (!config) {
    return NextResponse.json(
      { success: false, message: "Invalid category type" },
      { status: 400 }
    );
  }

  const business = await prisma.businessMeta.findFirst();
  const categories: string[] = (business as any)?.[config.field] ?? [];

  return NextResponse.json({
    success: true,
    message:
      categories.length > 1
        ? "Categories fetched successfully"
        : "Category fetched successfully",
    data: categories,
  });
};

// ---------------------- DELETE CATEGORY ----------------------
export const DELETE = auth(async function DELETE(req, ctx: any) {
  const params = await ctx.params;
  if (!params || !params.type) {
    return NextResponse.json(
      { success: false, message: "Category type is missing" },
      { status: 400 }
    );
  }

  const type: CategoryType = params.type;
  const { category } = await req.json();
  const config = CATEGORY_CONFIG[type];

  if (!req.auth) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const authRole = (req.auth.user?.role?.toLowerCase() || "system") as T_Role;
  if (!hasPermission({ userRole: authRole, permission: "create:categories" })) {
    return NextResponse.json(
      { success: false, message: "Not authorized" },
      { status: 403 }
    );
  }

  const business = await prisma.businessMeta.findFirst();
  if (!business) {
    return NextResponse.json(
      { success: false, message: "Business not found" },
      { status: 404 }
    );
  }

  const categories: string[] = (business as any)?.[config.field] ?? [];
  if (!categories.includes(category)) {
    return NextResponse.json(
      { success: false, message: "Category does not exist" },
      { status: 400 }
    );
  }

  const inUse = await config.inUseCheck(category, prisma);
  if (inUse) {
    return NextResponse.json(
      {
        success: false,
        message: "Category is already in use and cannot be deleted",
      },
      { status: 409 }
    );
  }

  const updatedCategories = categories.filter((c) => c !== category);
  await prisma.businessMeta.update({
    where: { id: business.id },
    data: { [config.field]: updatedCategories },
  });

  return NextResponse.json({
    success: true,
    message: `Category ${category} deleted successfully`,
  });
});

// ---------------------- CREATE / UPDATE CATEGORIES ----------------------
export const POST = auth(async function POST(req, ctx: any) {
  const params = await ctx.params;
  if (!params || !params.type) {
    return NextResponse.json(
      { success: false, message: "Category type is missing" },
      { status: 400 }
    );
  }

  const type: CategoryType = params.type;
  const data = await req.json(); // expect: { data: [{ value: string }, ...] }
  const config = CATEGORY_CONFIG[type];

  // Backend validation
  const { validationStatus, validationResponse } = backendDataValidation({
    schema: CategorySchema,
    data,
  });

  if (!validationStatus) return validationResponse;

  if (!req.auth) {
    return NextResponse.json(
      { success: false, message: "You are not authenticated" },
      { status: 401 }
    );
  }

  const authRole = (req.auth.user?.role?.toLowerCase() || "system") as T_Role;
  if (!hasPermission({ userRole: authRole, permission: "create:categories" })) {
    return NextResponse.json(
      { success: false, message: "Not authorized" },
      { status: 403 }
    );
  }

  const business = await prisma.businessMeta.findFirst();
  if (!business) {
    return NextResponse.json(
      { success: false, message: "Business not found" },
      { status: 404 }
    );
  }

  const newCategories: string[] = data.categories.map((c: any) =>
    c.value.trim()
  );
  const currentCategories: string[] = (business as any)[config.field] ?? [];
  const updatedCategories = [...currentCategories];

  for (const newCat of newCategories) {
    const exists = currentCategories.some(
      (c) => c.trim().toLowerCase() === newCat.toLowerCase()
    );
    if (!exists) updatedCategories.unshift(newCat);
  }

  await prisma.businessMeta.update({
    where: { id: business.id },
    data: { [config.field]: updatedCategories },
  });

  return NextResponse.json(
    {
      success: true,
      message:
        newCategories.length > 1
          ? "Categories created successfully"
          : "Category created successfully",
    },
    { status: 201 }
  );
});
