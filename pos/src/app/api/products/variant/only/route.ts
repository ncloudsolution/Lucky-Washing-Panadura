import prisma from "@/prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const POST = async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const data = await req.json();

  // Decide which action to take
  let mode: string;
  if (searchParams.has("new-price-set")) mode = "new-price-set";
  //   else if (searchParams.has("search")) mode = "search";
  else mode = "list";

  switch (mode) {
    //############## ADD NEW PRICE SET #################
    case "new-price-set": {
      const { id, prices } = data;

      if (!id) {
        return NextResponse.json(
          {
            success: false,
            message: "Varient Id missing",
            data: null,
          },
          { status: 400 }
        );
      }

      const newPrice = prices[0];

      try {
        // Fetch existing prices
        const productVariation = await prisma.productVarient.findUnique({
          where: { id },
        });

        if (!productVariation) throw new Error("Variant not found");

        // Ensure existing prices is an array
        const existingPrices: any[] = Array.isArray(productVariation.prices)
          ? productVariation.prices
          : [];

        // Merge with the new price
        const updatedPrices = [...existingPrices, newPrice];

        // Update
        await prisma.productVarient.update({
          where: { id },
          data: { prices: updatedPrices },
        });

        return NextResponse.json(
          {
            success: true,
            message: "New Price set added successfully!",
            data: null,
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
    }
  }
};
