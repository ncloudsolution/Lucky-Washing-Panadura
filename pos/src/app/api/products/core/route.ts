import { auth } from "@/auth";
import { IProductCore } from "@/components/custom/forms/FormCoreProduct";
import { IProductMeta } from "@/data";
import { hasPermission, T_Role } from "@/data/permissions";
import prisma from "@/prisma/client";
import { backendDataValidation } from "@/utils/common";
import {
  ProductBaseSchema,
  ProductCoreSchema,
} from "@/utils/validations/product";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

//add product
export const POST = auth(async function POST(req: any) {
  try {
    const data: IProductCore = await req.json();

    // Backend validation
    const { validationStatus, validationResponse } = backendDataValidation({
      schema: ProductCoreSchema,
      data,
    });

    if (!validationStatus) {
      return validationResponse;
    }

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

    //testing purpose
    // const authRole = "uniter" as T_Role;

    if (
      !hasPermission({
        userRole: authRole,
        permission: "create:product",
        // resourceBranch,
        // userBranch: authBranch,
      })
    ) {
      return NextResponse.json(
        { success: false, message: "Not authorized" },
        { status: 403 }
      );
    }

    // Check for barcode and product name duplication in parallel
    const [barcodeExists, productNameExists] = await Promise.all([
      prisma.productVarient.findFirst({
        where: { barcode: data.barcode },
        select: { id: true },
      }),
      prisma.productMeta.findFirst({
        where: { name: data.name },
        select: { id: true },
      }),
    ]);

    if (barcodeExists) {
      return NextResponse.json(
        {
          success: false,
          message: "Barcode already exists in system",
          error: "DUPLICATION",
        },
        { status: 409 }
      );
    }

    if (productNameExists) {
      return NextResponse.json(
        {
          success: false,
          message: "Product name already exists in system",
          error: "DUPLICATION",
        },
        { status: 409 }
      );
    }

    const baseCoreData = {
      name: data.name,
      metric: data.metric,
      searchQuery: data.searchQuery,
      brand: data.brand || null,
      description: data.description || null,
      shortDescription: data.shortDescription || null,
      categories: data.categories.map((it) => it.value),
      ...(data.tags &&
        data.tags.length > 0 && { tags: data.tags.map((it) => it.value) }),
      ...(data.images && { images: [data.images] }),
    };

    const newProduct = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const createdProductMeta = await tx.productMeta.create({
          data: baseCoreData,
          // select: { id: true }, // Only need the id
        });

        const variationData = {
          metaId: createdProductMeta.id!,
          barcode: data.barcode || null,
          ...(data.variation &&
            data.variation.length > 0 && {
              variation: data.variation.reduce(
                (acc: Record<string, string>, item) => {
                  acc[item.key] = item.value;
                  return acc;
                },
                {}
              ),
            }),
          prices: data.prices,
        };

        const createdVarient = await tx.productVarient.create({
          data: variationData,
        });

        return { createdProductMeta, createdVarient };
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: "Product created successfully",
        data: newProduct,
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}) as (req: Request) => Promise<Response>;

//edit product base
export const PUT = auth(async function POST(req: any) {
  try {
    const data: IProductCore & { id: string } = await req.json();

    // Backend validation
    const { validationStatus, validationResponse } = backendDataValidation({
      schema: ProductBaseSchema,
      data,
    });

    if (!validationStatus) {
      return validationResponse;
    }

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

    //testing purpose
    // const authRole = "uniter" as T_Role;

    if (
      !hasPermission({
        userRole: authRole,
        permission: "edit:product",
        // resourceBranch,
        // userBranch: authBranch,
      })
    ) {
      return NextResponse.json(
        { success: false, message: "Not authorized" },
        { status: 403 }
      );
    }

    // Check for barcode and product name duplication in parallel
    const productExists = await prisma.productMeta.findFirst({
      where: { id: data.id! },
    });

    if (!productExists) {
      return NextResponse.json(
        {
          success: false,
          message: "The selected product could not be found.",
          error: "NOT FOUND",
        },
        { status: 404 }
      );
    }

    // ✅ Update only specific fields
    const updatedProduct = await prisma.productMeta.update({
      where: { id: data.id! },
      data: {
        name: data.name,
        metric: data.metric,
        searchQuery: data.searchQuery,
        brand: data.brand || null,
        categories: data.categories.map((it) => it.value),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Variant updated successfully",
        data: updatedProduct,
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
});
