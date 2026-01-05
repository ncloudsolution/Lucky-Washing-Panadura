import prisma from "@/prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const GET = async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Decide which action to take
  let mode: string;
  if (searchParams.has("barcode")) mode = "barcode";
  //   else if (searchParams.has("search")) mode = "search";
  else mode = "list";

  switch (mode) {
    //############## SEARCH BY BARCODE #################
    case "barcode": {
      const barcode = searchParams.get("barcode")?.trim();
      if (!barcode) {
        return NextResponse.json(
          {
            success: false,
            message: "Barcode missing",
            data: null,
          },
          { status: 400 }
        );
      }

      try {
        const productVariation = await prisma.productVarient.findFirst({
          where: {
            barcode: barcode,
          },
          omit: { metaId: true }, //remove duplication
          include: {
            productMeta: true, // This will include all ProductMeta fields
          },
        });

        // Check for null first

        if (!productVariation) {
          return NextResponse.json(
            {
              success: false,
              message: "No variation found with this barcode",
              data: null,
            },
            { status: 404 }
          );
        }

        const { productMeta, ...rest } = productVariation;
        const restructuredData = {
          ...productMeta,
          variants: [rest], // Wrap the object in an array
        };

        return NextResponse.json(
          {
            success: true,
            message: "Variation found successfully!",
            data: restructuredData,
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
      // const page = parseInt(searchParams.get("page") || "1", 10);
      // const limit = parseInt(searchParams.get("limit") || "20", 10);
      // const category = searchParams.get("category") || "all";
      // query DB for latest or paginated listing

      console.log("hi");

      // const products = await prisma.productMeta.findMany({
      //   include: { variants: true },
      // });

      const productsMeta = await prisma.productMeta.findMany();
      const productsVarients = await prisma.productVarient.findMany();

      const data = { productsMeta, productsVarients };

      return NextResponse.json(
        {
          success: true,
          message: "Products found successfully!",
          data: data,
        },
        { status: 200 }
      );
    }
  }

  //   try {
  //     const data = await prisma.branchMeta.findMany({
  //       orderBy: { createdAt: "desc" },
  //     });

  //     return NextResponse.json(
  //       {
  //         success: true,
  //         message: "Branches retrieved successfully!",
  //         data: data,
  //       },
  //       { status: 200 }
  //     );
  //   } catch (e) {
  //     console.error("Error:", e);
  //     return NextResponse.json(
  //       {
  //         suceess: false,
  //         message: "An error occurred while processing your request",
  //         error: e instanceof Error ? e.message : String(e),
  //       },
  //       { status: 500 }
  //     );
  //   }
};
