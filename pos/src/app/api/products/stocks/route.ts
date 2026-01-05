// import { auth } from "@/auth";
// import { IProductStock } from "@/data";

// import { hasPermission, T_Role } from "@/data/permissions";
// import prisma from "@/prisma/client";
// import { backendDataValidation } from "@/utils/common";
// import { ProductStockSchema } from "@/utils/validations/product";
// import { NextResponse } from "next/server";

// export const POST = auth(async function POST(req: any) {
//   const { searchParams } = new URL(req.url);
//   const type = searchParams.get("type");

//   try {
//     switch (type) {
//       case "logs": {
//         const data: IProductStock = await req.json();

//         // Backend validation
//         const { validationStatus, validationResponse } = backendDataValidation({
//           schema: ProductStockSchema,
//           data,
//         });

//         if (!validationStatus) {
//           return validationResponse;
//         }

//         // authentication & permission check
//         if (!req.auth) {
//           return NextResponse.json(
//             {
//               success: false,
//               message: "You are not authenticated",
//               error: "UNAUTHORIZED",
//             },
//             { status: 401 }
//           );
//         }

//         const authRole = req.auth?.user?.role?.toLowerCase() as T_Role;

//         //testing purpose
//         // const authRole = "uniter" as T_Role;

//         console.log(authRole, "auth role");

//         if (
//           !hasPermission({
//             userRole: authRole,
//             permission: "create:stock",
//             // resourceBranch,
//             // userBranch: authBranch,
//           })
//         ) {
//           return NextResponse.json(
//             { success: false, message: "Not authorized" },
//             { status: 403 }
//           );
//         }

//         const createdStock = await prisma.productStock.create({
//           data: data,
//         });

//         return NextResponse.json(
//           {
//             success: true,
//             message: "Stock log created successfully",
//             data: createdStock,
//           },
//           { status: 201 }
//         );
//       }
//       //   case "xx": {
//       //     console.log("hi");
//       //     return NextResponse.json({ success: true, message: "Type xx" });
//       //     break;
//       //   }
//       default: {
//         console.log("default");
//         return NextResponse.json({
//           success: false,
//           message: `Unknown type: ${type}`,
//         });
//         break;
//       }
//     }
//   } catch (err) {
//     console.error(err);
//     return NextResponse.json(
//       { success: false, message: "Internal Server Error" },
//       { status: 500 }
//     );
//   }
// });

// export const GET = auth(async function GET(req: any) {
//   const { searchParams } = new URL(req.url);
//   const type = searchParams.get("type");

//   const authRole = req.auth?.user?.role?.toLowerCase() as T_Role;
//   const authId = req.auth?.user?.id;
//   const authBranch = req.auth?.user?.branch;

//   //testing purpose
//   // const authRole = "uniter" as T_Role;

//   console.log(authRole, "auth role");
//   console.log(authBranch, "auth branch");

//   try {
//     switch (type) {
//       //############## SEARCH STOCK ID AND BRANCH #################
//       case "stock-product-branch": {
//         const varientId = searchParams.get("id");
//         const branch = searchParams.get("branch");

//         if (!varientId || !branch) {
//           return NextResponse.json(
//             {
//               success: false,
//               message: "Varient Id missing or branch missing",
//               data: null,
//               error: "INVALID OPERATION",
//             },
//             { status: 400 }
//           );
//         }

//         if (
//           !hasPermission({
//             userRole: authRole,
//             resourceBranch: branch,
//             userBranch: authBranch,
//             permission: "view:stock:branch-only",
//           })
//         ) {
//           return NextResponse.json(
//             { success: false, message: "Not authorized" },
//             { status: 403 }
//           );
//         }
//         const stockEntries = await prisma.productStock.findMany({
//           where: { varientId: varientId, branch: branch },
//           orderBy: {
//             createdAt: "desc",
//           },
//         });

//         const sold = await prisma.orderItem.aggregate({
//           where: { productVarientId: varientId },
//           _sum: { quantity: true },
//         });

//         const totalSoldQty = sold._sum.quantity || 0;

//         const data = {
//           entries: stockEntries,
//           stockInCount: stockEntries
//             .filter((en) => en.in === true)
//             .reduce((sum, en) => sum + Number(en.quantity), 0),
//           stockOutCount: stockEntries
//             .filter((en) => en.in === false)
//             .reduce((sum, en) => sum + Number(en.quantity), 0),
//           soldCount: totalSoldQty,
//         };

//         return NextResponse.json(
//           {
//             success: true,
//             message: "Stock counting data fetch successfully",
//             data: data,
//           },
//           { status: 201 }
//         );
//       }
//       case "search": {
//         //############## SEARCH ALL RELATED TO QUERY - ONLY META #################
//         const searchQuery = searchParams.get("search")!;
//         if (!req.auth) {
//           return NextResponse.json(
//             {
//               success: false,
//               message: "You are not authenticated",
//               error: "UNAUTHORIZED",
//             },
//             { status: 401 }
//           );
//         }

//         if (
//           !hasPermission({
//             userRole: authRole,
//             permission: "view:stock:branch-only",
//           })
//         ) {
//           return NextResponse.json(
//             { success: false, message: "Not authorized" },
//             { status: 403 }
//           );
//         } //try catch
//       }

//       case "list":
//       //############## SEARCH RECENT 10 - ONLY META #################
//       default: {
//         if (!req.auth) {
//           return NextResponse.json(
//             {
//               success: false,
//               message: "You are not authenticated",
//               error: "UNAUTHORIZED",
//             },
//             { status: 401 }
//           );
//         }

//         if (
//           !hasPermission({
//             userRole: authRole,
//             permission: "view:stock",
//           })
//         ) {
//           return NextResponse.json(
//             { success: false, message: "Not authorized" },
//             { status: 403 }
//           );
//         }

//         const stockMetas = await prisma.productStock.findMany({
//           where:
//             authRole === "manager" || authRole === "uniter"
//               ? { branch: authBranch } // 👈 only show their own orders
//               : {}, // 👈 for other roles, no filter
//           orderBy: {
//             createdAt: "desc",
//           },
//           take: 10,
//         });

//         return NextResponse.json(
//           {
//             success: true,
//             message: "Recent orders fetch successfully!",
//             data: stockMetas,
//           },
//           { status: 200 }
//         );
//       }
//     }
//   } catch (err) {
//     console.error(err);
//     return NextResponse.json(
//       { success: false, message: "Internal Server Error" },
//       { status: 500 }
//     );
//   }
// });
