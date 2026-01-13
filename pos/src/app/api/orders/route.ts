import { auth } from "@/auth";
import {
  BaseUrl,
  defaultPrint,
  globalDefaultCustomer,
  IOrderItem,
  IOrderMeta,
  TMetric,
} from "@/data";
import { hasPermission, T_Role } from "@/data/permissions";
import prisma from "@/prisma/client";
import { BasicDataFetch, EbillMsg } from "@/utils/common";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

//add order
export const POST = auth(async function POST(req: any) {
  try {
    const data = await req.json();
    const orderItems = data.orderItems;

    /* ---------------- Validation ---------------- */
    if (!orderItems || orderItems.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No order items found on this order",
          error: "NOT FOUND",
        },
        { status: 404 }
      );
    }

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

    const authRole = req.auth.user.role.toLowerCase() as T_Role;

    if (
      !hasPermission({
        userRole: authRole,
        permission: "create:order",
      })
    ) {
      return NextResponse.json(
        { success: false, message: "Not authorized" },
        { status: 403 }
      );
    }

    /* ---------------- Customer lookup (OUTSIDE transaction) ---------------- */
    const customer = await prisma.customerMeta.findFirst({
      where: { mobile: data.customerMobile },
      select: { id: true },
    });

    if (!customer?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot find customer related to this order",
        },
        { status: 404 }
      );
    }

    const { paymentPortion, paymentPortionAmount, paymentMethod, ...rest } =
      data.orderMeta;

    const orderMetaData = {
      ...rest,
      customerId: customer.id,
    };

    /* ---------------- TRANSACTION (DB ONLY) ---------------- */
    const newOrder = await prisma.$transaction(
      async (tx) => {
        const createdOrder = await tx.orderMeta.create({
          data: orderMetaData,
        });

        await tx.income.create({
          data: {
            orderId: createdOrder.id,
            amount: paymentPortionAmount,
            paymentMethod: paymentMethod,
            category: paymentPortion,
          },
        });

        await tx.orderItem.createMany({
          data: orderItems.map((item: IOrderItem) => ({
            ...item,
            orderId: createdOrder.id,
          })),
        });

        return createdOrder;
      },
      {
        timeout: 5000, // 🔐 VERY IMPORTANT
      }
    );

    /* ---------------- AFTER TRANSACTION ---------------- */
    const customerDetails = await prisma.customerMeta.findUnique({
      where: { id: customer.id },
    });

    const bizDetails = await prisma.businessMeta.findFirst({
      select: { businessName: true, sms: true },
    });

    const paymentDetails = await prisma.income.findMany({
      where: { orderId: newOrder.id },
      orderBy: { createdAt: "asc" },
    });

    /* ---------------- SMS ---------------- */
    if (
      bizDetails?.sms &&
      customerDetails?.mobile !== globalDefaultCustomer.mobile
    ) {
      EbillMsg({
        customerName: customerDetails?.name ?? "",
        customerMobile: customerDetails?.mobile ?? "",
        businessName: bizDetails?.businessName ?? "",
        ebillLink: `${BaseUrl}/invoice?id=${newOrder.id}`,
      });
    }

    /* ---------------- Invoice (optional) ---------------- */
    let invoiceData: any = null;

    if (defaultPrint) {
      const orderOperator = await prisma.staff.findUnique({
        where: { id: orderMetaData.operator },
      });

      const branchMeta = await prisma.branchMeta.findFirst({
        where: { branch: orderOperator?.branch },
      });

      const variantIds = orderItems.map((i: any) => i.productVarientId);

      const productVariants = await prisma.productVarient.findMany({
        where: { id: { in: variantIds } },
        select: {
          id: true,
          metaId: true,
          variation: true,
          prices: true,
          productMeta: {
            select: { name: true, metric: true },
          },
        },
      });

      const groupedItems = productVariants.reduce((acc: any[], v: any) => {
        const orderItem = orderItems.find(
          (o: any) => o.productVarientId === v.id
        );
        if (!orderItem) return acc;

        const price = v.prices?.find(
          (p: any) => p.sel === Number(orderItem.unitPrice)
        );

        const variation = {
          id: v.id,
          variation: v.variation,
          regularPrice: price?.reg ?? null,
          sellingPrice: price?.sel ?? Number(orderItem.unitPrice),
          quantity: Number(orderItem.quantity),
        };

        const group = acc.find((g) => g.metaId === v.metaId);
        if (group) group.variations.push(variation);
        else {
          acc.push({
            metaId: v.metaId,
            name: v.productMeta?.name,
            metric: v.productMeta?.metric,
            variations: [variation],
          });
        }

        return acc;
      }, []);

      invoiceData = {
        baseData: {
          id: newOrder.id,
          invoiceId: newOrder.invoiceId,
          createdAt: newOrder.createdAt,
          saleValue: newOrder.saleValue,
          deliveryfee: newOrder.deliveryfee,
          status: newOrder.status,

          paymentAmount: paymentDetails?.reduce(
            (sum, item) => sum.plus(item.amount),
            new Prisma.Decimal(0)
          ),
          //catergory and method always in ebill and printed show the first time payment mode and catgory but the amount get the total of all related orer id
          incomeCategory: paymentDetails[0]?.category,
          paymentMethod: paymentDetails[0]?.paymentMethod,

          business: bizDetails?.businessName,
          branch: orderOperator?.branch,
          address: branchMeta?.address,
          hotlines: branchMeta?.hotlines,
          operator: orderOperator?.name,
          counterNo: orderOperator?.counterNo,
          customer: customerDetails?.name,
          customerMobile: customerDetails?.mobile,
        },
        items: groupedItems,
      };
    }

    return NextResponse.json(
      {
        success: true,
        message: "Order created successfully",
        data: defaultPrint ? invoiceData : newOrder,
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Check your connection and try again" },
      { status: 500 }
    );
  }
}) as (req: Request) => Promise<Response>;

//edit order
export const PUT = auth(async function PUT(req: any) {
  try {
    const data = await req.json();
    const orderId = data.orderMeta.id;

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
    const authId = req.auth?.user?.id;

    if (
      !hasPermission({
        userRole: authRole,
        permission: "edit:orders:own-only",
        // resourceBranch,
        // userBranch: authBranch,
      })
    ) {
      return NextResponse.json(
        { success: false, message: "Not authorized" },
        { status: 403 }
      );
    }

    const currentOrder = await prisma.orderMeta.findFirst({
      where: {
        id: orderId,
      },
    });

    if (currentOrder?.operator !== authId) {
      return NextResponse.json(
        { success: false, message: "Not authorized" },
        { status: 403 }
      );
    }

    const customerMeta = await prisma.customerMeta.findFirst({
      where: { mobile: data.customerMobile },
      select: { id: true },
    });

    const oldOrderItems = await prisma.orderItem.findMany({
      where: {
        orderId: currentOrder?.id,
      },
    });

    const oldItems = oldOrderItems;
    const newItems = data.orderItems;

    // Common productVariantIds
    const commonItems = newItems.filter((newItem) =>
      oldItems.some(
        (oldItem) => oldItem.productVarientId === newItem.productVarientId
      )
    );

    // Newly added items
    const newOnlyItems = newItems.filter(
      (newItem) =>
        !oldItems.some(
          (oldItem) => oldItem.productVarientId === newItem.productVarientId
        )
    );

    // Removed items
    const removedItems = oldItems.filter(
      (oldItem) =>
        !newItems.some(
          (newItem) => newItem.productVarientId === oldItem.productVarientId
        )
    );

    // return NextResponse.json(
    //   { success: true, data: { commonItems, newOnlyItems, removedItems } },
    //   { status: 200 }
    // );

    const newOrder = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        await tx.orderMeta.update({
          where: { id: orderId },
          data: {
            ...(currentOrder?.customerId !== customerMeta?.id &&
              customerMeta?.id && {
                customerId: customerMeta.id,
              }),

            //update this from other table
            // ...(currentOrder?.paymentMethod !==
            //   data.orderMeta.paymentMethod && {
            //   paymentMethod: data.orderMeta.paymentMethod,
            // }),

            ...(currentOrder?.saleValue !== data.orderMeta.saleValue && {
              saleValue: data.orderMeta.saleValue,
            }),

            ...(currentOrder?.deliveryfee !== data.orderMeta.deliveryfee && {
              deliveryfee: data.orderMeta.deliveryfee,
            }),
          },
        });

        //removed ones
        if (removedItems.length > 0) {
          const idSet = removedItems.map((i) => i.id);
          await prisma.orderItem.deleteMany({
            where: {
              id: {
                in: idSet,
              },
            },
          });
        }

        //barndnew ones
        if (newOnlyItems.length > 0) {
          const newData = newOnlyItems.map((i) => {
            return {
              orderId: orderId,
              ...i,
            };
          });
          await tx.orderItem.createMany({ data: newData });
        }

        if (commonItems.length > 0) {
          await Promise.all(
            commonItems.map((item) =>
              tx.orderItem.updateMany({
                where: {
                  orderId: orderId,
                  productVarientId: item.productVarientId,
                },
                data: {
                  quantity: item.quantity,
                },
              })
            )
          );
        }

        const { paymentPortion, paymentPortionAmount, paymentMethod } =
          data.orderMeta;

        const firstIncome = await tx.income.findFirst({
          where: { orderId },
          orderBy: { createdAt: "desc" },
        });

        if (!firstIncome) return;

        // check what actually changed
        const updateData: {
          amount?: number;
          paymentMethod?: string;
          category?: string;
        } = {};

        if (firstIncome.amount !== paymentPortionAmount) {
          updateData.amount = paymentPortionAmount;
        }

        if (firstIncome.paymentMethod !== paymentMethod) {
          updateData.paymentMethod = paymentMethod;
        }

        if (firstIncome.category !== paymentPortion) {
          updateData.category = paymentPortion;
        }

        // only update if something changed
        if (Object.keys(updateData).length > 0) {
          await tx.income.update({
            where: { id: firstIncome.id },
            data: updateData,
          });
        }
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: "Order updated successfully",
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

export const GET = auth(async function GET(req: any) {
  const { searchParams } = new URL(req.url);

  const authRole = req.auth?.user?.role?.toLowerCase() as T_Role;
  const authId = req.auth?.user?.id;
  const authBranch = req.auth?.user?.branch;

  //testing purpose
  // const authRole = "uniter" as T_Role;

  let mode: string;
  if (searchParams.has("id")) mode = "id";
  else if (searchParams.has("payment-breakdown")) mode = "payment-breakdown";
  else if (searchParams.has("search")) mode = "search";
  else mode = "list";

  switch (mode) {
    case "payment-breakdown": {
      const id = searchParams.get("payment-breakdown")?.trim();

      if (!id) {
        return NextResponse.json(
          {
            success: false,
            message: "Order Id missing",
            data: null,
            error: "INVALID OPERATION",
          },
          { status: 400 }
        );
      }
      try {
        const breakdowns = await prisma.income.findMany({
          where: {
            orderId: id,
          },
          select: {
            amount: true,
            paymentMethod: true,
            category: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        });

        if (!breakdowns) {
          return NextResponse.json(
            {
              success: false,
              message: "This order does not exist",
              error: "NOT FOUND",
            },
            { status: 404 }
          );
        }
        return NextResponse.json(
          {
            success: true,
            message: "Order Payment Breakdown fetched successfully!",
            data: breakdowns,
          },
          { status: 200 }
        );
      } catch (e) {
        return NextResponse.json(
          {
            data: null,
            suceess: false,
            message: "An error occurred while processing your request",
            error: e instanceof Error ? e.message : String(e),
          },
          { status: 500 }
        );
      }
    }
    //############## SEARCH BY ID #################
    case "id": {
      const id = searchParams.get("id")?.trim();

      if (!id) {
        return NextResponse.json(
          {
            success: false,
            message: "Order Id missing",
            data: null,
            error: "INVALID OPERATION",
          },
          { status: 400 }
        );
      }

      try {
        const orderMeta = await prisma.orderMeta.findFirst({
          where: {
            id: id,
          },
        });

        if (!orderMeta) {
          return NextResponse.json(
            {
              success: false,
              message: "This order does not exist",
              error: "NOT FOUND",
            },
            { status: 404 }
          );
        }

        const orderItems = await prisma.orderItem.findMany({
          where: { orderId: orderMeta.id },
          omit: { orderId: true, id: true }, //orderid get from orderMeta.id and id dont need here
        });

        if (!orderItems || orderItems.length === 0) {
          return NextResponse.json(
            {
              success: false,
              message: "This order does not exist",
              error: "NOT FOUND",
            },
            { status: 404 }
          );
        }

        const orderOperator = await prisma.staff.findFirst({
          where: { id: orderMeta.operator },
        });

        const bizBranchMeta = await prisma.branchMeta.findFirst({
          where: { branch: orderOperator?.branch },
        });

        const bizDetails = await prisma.businessMeta.findFirst({
          select: { businessName: true },
        });

        const customerDetails = await prisma.customerMeta.findFirst({
          where: { id: orderMeta.customerId },
        });

        const paymentDetails = await prisma.income.findMany({
          where: { orderId: orderMeta.id },
          orderBy: { createdAt: "asc" },
        });

        const allVarientIds = orderItems.map((or: any) => or.productVarientId);

        const productVarients = await prisma.productVarient.findMany({
          where: {
            id: {
              in: allVarientIds,
            },
          },
          select: {
            id: true,
            metaId: true,
            variation: true,
            prices: true,
            productMeta: {
              select: {
                name: true, // only get this field from productMeta
                metric: true,
              },
            },
          },
        });

        const groupedData = productVarients.reduce(
          (
            acc: any,
            {
              productMeta,
              ...variant
            }: { productMeta: any; [key: string]: any }
          ) => {
            const orderItem = orderItems.find(
              (item: any) => item.productVarientId === variant.id
            );

            if (!orderItem) return acc; // skip if no matching order item

            // Assert prices is array
            const prices =
              (variant.prices as { reg: number; sel: number; set: number }[]) ??
              [];
            const matchingPrice = prices.find(
              (p) => p.sel === Number(orderItem.unitPrice)
            );

            const variationItem = {
              id: variant.id,
              variation: variant.variation,
              regularPrice: matchingPrice ? matchingPrice.reg : null,
              sellingPrice: matchingPrice
                ? matchingPrice.sel
                : Number(orderItem.unitPrice),
              quantity: Number(orderItem.quantity),
            };

            // Check if group already exists
            const existingGroup = acc.find(
              (g: any) => g.metaId === variant.metaId
            );
            if (existingGroup) {
              existingGroup.variations.push(variationItem);
            } else {
              acc.push({
                metaId: variant.metaId,
                name: productMeta?.name,
                metric: productMeta?.metric,
                variations: [variationItem],
              });
            }

            return acc;
          },
          [] as {
            metaId: string;
            name: string | undefined;
            metric: TMetric;
            variations: {
              id: string;
              variation: any;
              regularPrice: number | null;
              sellingPrice: number;
              quantity: number;
            }[];
          }[]
        );

        const orderData = {
          baseData: {
            id: orderMeta.id,
            invoiceId: orderMeta.invoiceId,
            createdAt: orderMeta.createdAt,
            saleValue: orderMeta.saleValue,
            deliveryfee: orderMeta.deliveryfee,
            status: orderMeta.status,

            paymentAmount: paymentDetails?.reduce(
              (sum, item) => sum.plus(item.amount),
              new Prisma.Decimal(0)
            ),
            //catergory and method always in ebill and printed show the first time payment mode and catgory but the amount get the total of all related orer id
            incomeCategory: paymentDetails[0]?.category,
            paymentMethod: paymentDetails[0]?.paymentMethod,

            business: bizDetails?.businessName,
            branch: orderOperator?.branch,
            address: bizBranchMeta?.address,
            hotlines: bizBranchMeta?.hotlines,
            operator: orderOperator?.name,
            counterNo: orderOperator?.counterNo,

            customer: customerDetails?.name,
            customerMobile: customerDetails?.mobile,
            customerCreatedAt: customerDetails?.createdAt,
          },
          items: groupedData,
        };

        return NextResponse.json(
          {
            success: true,
            message: "Order fetched successfully!",
            data: orderData,
          },
          { status: 200 }
        );
      } catch (e) {
        return NextResponse.json(
          {
            data: null,
            suceess: false,
            message: "An error occurred while processing your request",
            error: e instanceof Error ? e.message : String(e),
          },
          { status: 500 }
        );
      }
    }

    case "search": {
      //############## SEARCH ALL RELATED TO QUERY - ONLY META #################
      const searchQuery = searchParams.get("search")!;
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

      if (
        !hasPermission({
          userRole: authRole,
          permission: "view:orders",
        })
      ) {
        return NextResponse.json(
          { success: false, message: "Not authorized" },
          { status: 403 }
        );
      }

      // Clean the search query
      const cleanSearch = searchQuery.replace(/[+\s]/g, "");
      let orderMetas: any[] = [];

      // Step 1: First try searching by invoiceId
      const isNumeric = !isNaN(Number(cleanSearch));

      if (isNumeric) {
        try {
          // Use BigInt for invoiceId to handle large numbers
          const invoiceId = Number(cleanSearch);

          // Search by invoiceId first
          orderMetas = await prisma.orderMeta.findMany({
            where: { invoiceId: invoiceId },
            orderBy: { createdAt: "desc" },
          });
        } catch (error) {
          // If BigInt conversion fails, it's not a valid number for invoiceId
        }
      }

      // Step 2: If no results from invoiceId search, try customer mobile
      if (orderMetas.length === 0) {
        const mobileClean = searchQuery.replace(/\D/g, "");

        // 🛑 Stop if no valid digits found
        if (mobileClean.length === 0) {
          return NextResponse.json(
            {
              success: true,
              message: "Invalid search input — no digits found",
              data: [],
            },
            { status: 200 }
          );
        }

        const customer = await prisma.customerMeta.findFirst({
          where: {
            mobile: {
              contains: mobileClean,
            },
          },
        });

        if (customer) {
          // Search orders by customerId
          orderMetas = await prisma.orderMeta.findMany({
            where: { customerId: customer.id },
            orderBy: { createdAt: "desc" },
          });
        }
      }

      return NextResponse.json(
        {
          success: true,
          message: "Order history fetch successfully!",
          data: orderMetas,
        },
        { status: 200 }
      );
    }

    case "list":
    //############## SEARCH RECENT 10 - ONLY META #################
    default: {
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

      if (
        !hasPermission({
          userRole: authRole,
          permission: "view:orders",
        })
      ) {
        return NextResponse.json(
          { success: false, message: "Not authorized" },
          { status: 403 }
        );
      }

      const orderMetas = await prisma.orderMeta.findMany({
        where:
          authRole === "cashier"
            ? { operator: authId } // 👈 only show their own orders
            : authRole === "manager"
            ? { branch: authBranch }
            : {}, // 👈 for other roles, no filter
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      });

      return NextResponse.json(
        {
          success: true,
          message: "Recent orders fetch successfully!",
          data: orderMetas,
        },
        { status: 200 }
      );
    }
  }
});
