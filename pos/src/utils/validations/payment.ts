import { z } from "zod";

import { CONST_paymentObjectList } from "@/data";
import { fileSchema } from "./common";

// 1. First get the enabled gateway values with proper typing

type PaymentMethods = Extract<
  (typeof CONST_paymentObjectList)[number],
  { enable: true }
>;
export type EnabledGateway = PaymentMethods["value"]; // "onepay" | "payhere" etc.

const enabledGateways = CONST_paymentObjectList.filter(
  (m): m is PaymentMethods => m.enable
).map((m) => m.value);

// 2. Create a tuple type for zod.enum()
const gatewayValues = enabledGateways as [EnabledGateway, ...EnabledGateway[]];

// 3. Create the schema
export const PaymentSchema = z
  .object({
    amount: z
      .number({
        message: "Amount is required",
      })
      .gt(0, { message: "ammount cannot be 0" }),
    gateway: z.enum(gatewayValues),
    currency: z.enum(["LKR", "USD"]),
    paymentRecipt: z.optional(fileSchema),

    //---- hard coded way
    // gateway: z.union([z.literal("payhere"), z.literal("onepay")]),
    // gateway: z.enum(["payhere", "onepay",]),
  })
  .superRefine((data, ctx) => {
    if (data.gateway === "bankTransfer" && !data.paymentRecipt) {
      ctx.addIssue({
        path: ["paymentRecipt"],
        message: "Payment receipt is required for Bank Transfers",
        code: "custom",
      });
    }
  });

//------------- this also work
// .refine(
//   (data) => {
//     // Check if `gateway` is 'bankTransfer' and if `paymentRecipt` is not provided
//     if (data.gateway === "bankTransfer" && !data.paymentRecipt) {
//       return false; // If the condition is true, the validation should fail
//     }
//     return true; // Otherwise, the validation passes
//   },
//   {
//     message: "Payment receipt is required for Bank Transfers",
//     path: ["paymentRecipt"], // Specify the path of the error field
//   }
// );
// -------------------

// export type TCurrency = typeof PaymentSchema.shape.currency;  //way of taker as zod enum type
export type TCurrency = z.infer<typeof PaymentSchema>["currency"];

//test purpose
// export const apparelLocation = ["HEAD", "TORSO", "ARMS", "LEGS"] as const
// export type TypeApparelLocation = typeof apparelLocation[number]
