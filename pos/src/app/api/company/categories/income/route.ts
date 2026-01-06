import prisma from "@/prisma/client";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const GET = async function GET(req: NextRequest) {
  try {
    const business = await prisma.businessMeta.findFirst({});
    console.log(business);
    const categories = business?.incomeCategories ?? [];

    console.log(categories);

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
