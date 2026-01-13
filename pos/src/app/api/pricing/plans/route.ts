import prisma from "@/prisma/client";
import { NextRequest, NextResponse } from "next/server";

//get all plans ---------------------------
export const GET = async function GET(req: NextRequest) {
  try {
    const data = await prisma.plan.findMany();
    return NextResponse.json(
      {
        success: true,
        message: "Plans retrieved successfully!",
        data: data,
      },
      { status: 200 }
    );
  } catch (e) {
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
