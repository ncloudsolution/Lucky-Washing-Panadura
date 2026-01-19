import prisma from "@/prisma/client";
import { NextResponse } from "next/server";

export const GET = async function GET(req) {
  try {
    const biz = await prisma.businessMeta.findFirst();

    return NextResponse.json(
      {
        success: true,
        message: "Business meta found successfully!",
        data: biz,
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
