import { auth } from "@/auth";
import { IProductCore } from "@/components/custom/forms/FormCoreProduct";

import { IProductVariant } from "@/components/custom/forms/FormVariation";
import { hasPermission, T_Role } from "@/data/permissions";
import prisma from "@/prisma/client";
import { backendDataValidation } from "@/utils/common";
import {
  MiniTempTransferSchema,
  ProductCoreSchema,
  ProductVariantSchema,
} from "@/utils/validations/product";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

//new temporary
export const POST = auth(async function POST(req: any) {
  try {
    const data: IProductVariant = await req.json();

    // Backend validation
    const { validationStatus, validationResponse } = backendDataValidation({
      schema: ProductVariantSchema,
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

    console.log(authRole, "auth role");

    if (
      !hasPermission({
        userRole: authRole,
        permission: "create:temporary-product",
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
    const barcodeExists = await prisma.productVarient.findFirst({
      where: { barcode: data.barcode },
      select: { id: true },
    });

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

    const temporaryMeta = await prisma.productMeta.findFirst({
      where: { name: "TEMPORARY PRODUCTS" },
    });

    let newMetaProduct;

    if (!temporaryMeta) {
      const baseCoreData = {
        name: "TEMPORARY PRODUCTS",
        metric: "None",
        searchQuery: "",
        brand: null,
        description: null,
        shortDescription: null,
        categories: ["Temporary"],
      };
      newMetaProduct = await prisma.productMeta.create({
        data: baseCoreData,
      });
    }

    const variationData = {
      metaId: temporaryMeta?.id || newMetaProduct?.id,
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

    const createdVarient = await prisma.productVarient.create({
      data: variationData,
    });

    const result = await prisma.productMeta.findFirst({
      where: { name: "TEMPORARY PRODUCTS" },
      select: {
        _count: {
          select: { variants: true },
        },
      },
    });

    const temporaryCount = result?._count.variants;

    if (temporaryCount === 0) {
      await prisma.productMeta.deleteMany({
        where: { name: "TEMPORARY PRODUCTS" },
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Temporary product created successfully",
        data: {
          productMetaData: temporaryMeta || newMetaProduct,
          productVarientData: createdVarient,
          clearTemp: temporaryCount === 0 ? true : false,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      {
        success: false,
        message: "Temporary product creation failed, Try again",
      },
      { status: 500 }
    );
  }
}) as (req: Request) => Promise<Response>;

export const PUT = auth(async function POST(req: any) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

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

  console.log(authRole, "auth role");

  if (
    !hasPermission({
      userRole: authRole,
      permission: "move:temporary-product",
      // resourceBranch,
      // userBranch: authBranch,
    })
  ) {
    return NextResponse.json(
      { success: false, message: "Not authorized" },
      { status: 403 }
    );
  }
  try {
    switch (type) {
      case "min": {
        const data: { metaId: string; varientId: string } = await req.json();
        console.log(data);
        // Backend validation
        const { validationStatus, validationResponse } = backendDataValidation({
          schema: MiniTempTransferSchema,
          data,
        });

        if (!validationStatus) {
          return validationResponse;
        }

        // ✅ Update only specific fields
        await prisma.productVarient.update({
          where: { id: data.varientId! },
          data: {
            metaId: data.metaId,
          },
        });

        const result = await prisma.productMeta.findFirst({
          where: { name: "TEMPORARY PRODUCTS" },
          select: {
            _count: {
              select: { variants: true },
            },
          },
        });

        const temporaryCount = result?._count.variants;

        if (temporaryCount === 0) {
          await prisma.productMeta.deleteMany({
            where: { name: "TEMPORARY PRODUCTS" },
          });
        }

        return NextResponse.json(
          {
            success: true,
            message: "Temporary product moved sucessfully",
            data: { clearTemp: temporaryCount === 0 ? true : false },
          },
          { status: 200 }
        );
      }
      case "max": {
        const data: IProductCore & { id: string } = await req.json();

        // Backend validation
        const { validationStatus, validationResponse } = backendDataValidation({
          schema: ProductCoreSchema,
          data,
        });

        if (!validationStatus) {
          return validationResponse;
        }

        // Check for product name duplication in parallel
        const productNameExists = await prisma.productMeta.findFirst({
          where: { name: data.name },
          select: { id: true },
        });

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

            const createdVarient = await tx.productVarient.update({
              where: { id: data.id! },
              data: {
                metaId: createdProductMeta.id!,
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
              },
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
      }
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
});
