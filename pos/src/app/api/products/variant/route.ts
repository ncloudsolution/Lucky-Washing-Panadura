import { auth } from "@/auth";
import { IProductVariant } from "@/components/custom/forms/FormVariation";
import { hasPermission, T_Role } from "@/data/permissions";
import prisma from "@/prisma/client";
import { backendDataValidation } from "@/utils/common";
import { ProductVariantSchema } from "@/utils/validations/product";
import { NextResponse } from "next/server";

//new variant
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

    const variationData = {
      metaId: data.metaId!,
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

    return NextResponse.json(
      {
        success: true,
        message: "Variant created successfully",
        data: createdVarient,
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

//edit variant
export const PUT = auth(async function POST(req: any) {
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
    const productExists = await prisma.productVarient.findFirst({
      where: { id: data.id! },
    });

    if (!productExists) {
      return NextResponse.json(
        {
          success: false,
          message: "The selected product variant could not be found.",
          error: "NOT FOUND",
        },
        { status: 404 }
      );
    }

    // --- Check for duplicate barcode (if changed) ---
    if (data.barcode && data.barcode !== productExists.barcode) {
      const duplicateBarcode = await prisma.productVarient.findFirst({
        where: {
          barcode: data.barcode,
          NOT: { id: data.id! }, // exclude current variant
        },
        select: { id: true },
      });

      if (duplicateBarcode) {
        return NextResponse.json(
          {
            success: false,
            message: "Barcode already exists in system",
            error: "DUPLICATION",
          },
          { status: 409 }
        );
      }
    }

    const variationObject =
      data.variation && data.variation.length > 0
        ? data.variation.reduce((acc: Record<string, string>, item) => {
            acc[item.key] = item.value;
            return acc;
          }, {})
        : null;

    // ✅ Update only specific fields
    const updatedVarient = await prisma.productVarient.update({
      where: { id: data.id! },
      data: {
        barcode: data.barcode || null,
        variation: variationObject!,
        prices: data.prices,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Variant updated successfully",
        data: updatedVarient,
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

//DELETE variant
export const DELETE = auth(async function POST(req: any) {
  try {
    const { id, metaId } = await req.json();

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

    const productVariations = await prisma.productVarient.findMany({
      where: {
        metaId: metaId,
      },
    });

    // if (productVariations.length <= 1) {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       message: "Need at least two variations to delete one.",
    //       error: "INVALID OPERATION",
    //     },
    //     { status: 400 } //bad request
    //   );
    // }

    if (productVariations.length <= 1) {
      await prisma.productMeta.delete({ where: { id: metaId } });

      return NextResponse.json(
        {
          success: true,
          message: "Product deleted successfully",
          data: null,
        },
        { status: 200 }
      );
    }

    await prisma.productVarient.delete({ where: { id: id } });
    return NextResponse.json(
      {
        success: true,
        message: "Variant deleted successfully",
        data: null,
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
