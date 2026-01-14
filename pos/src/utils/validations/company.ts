import { z } from "zod";
import { multiInputSchema, phoneNumberSchema } from "./common";
import { ENUMPaymentMethodArray, ENUMStaffRolesArray } from "@/data";

export const StaffSchema = z
  .object({
    name: z
      .string()
      .nonempty({ message: "Name is required" })
      .min(2, { message: "Name at least 2 characters" })
      .max(100, "Must be less than 100 characters"),
    branch: z
      .string()
      .nonempty({ message: "Branch is required" })
      .min(2, { message: "Branch at least 2 characters" })
      .max(100, "Must be less than 100 characters"),
    role: z.enum(ENUMStaffRolesArray, {
      error: () => ({ message: "Role is required" }),
    }),
    counterNo: z
      .int()
      .gt(0, { message: "Counter no should greater than 0" })
      .optional(),
    email: z.string().nonempty({ message: "Email is required" }).email(),
    mobile: phoneNumberSchema,

    pin: z
      .string()
      .nonempty({ message: "Pin is required" })
      .length(4, { message: "Pin must be 4 charactors" }),
    confirmPin: z.string().nonempty({ message: "Confirmation is required" }),
  })
  .refine((data) => data.pin === data.confirmPin, {
    message: "Pins do not match",
    path: ["confirmPin"],
  });

export const StaffLoginSchema = z.object({
  mobile: phoneNumberSchema,
  pin: z
    .string()
    .nonempty({ message: "Pin is required" })
    .length(4, { message: "Pin must be 4 charactors" }),
});

export const BranchSchema = z.object({
  branch: z
    .string()
    .nonempty({ message: "City is required" })
    .min(2, { message: "Name at least 2 characters" })
    .max(60, "Must be less than 60 characters"),
  address: z
    .string()
    .nonempty({ message: "Address is required" })
    .min(2, { message: "Address at least 2 characters" })
    .max(200, "Must be less than 200 characters"),
  hotlines: multiInputSchema("mobile"),
});

export const CategorySchema = z.object({
  categories: z.array(
    z.object({
      value: z
        .string()
        .nonempty({ message: "Category is required" })
        .min(2, { message: "Category at least 2 characters" })
        .max(50, "Must be less than 50 characters"),
    })
  ),
});

export const ExpenseSchema = z.object({
  id: z.string().nullable().optional(),
  branch: z
    .string()
    .nonempty({ message: "Branch is required" })
    .min(2, { message: "Branch at least 2 characters" })
    .max(100, "Must be less than 100 characters"),
  category: z.string().nonempty({ message: "Category is required" }),
  paymentMethod: z.enum(ENUMPaymentMethodArray, {
    error: () => ({ message: "Payment method is required" }),
  }),
  amount: z.union([
    z.number().gt(0, { message: "Amount must be greater than 0" }),
    z.string().nonempty({ message: "Amount is required" }),
  ]),
  remarks: z.string().max(1000, "Must be less than 1000 charactors"),
});

export const IncomeSchema = (due: number) =>
  z.object({
    id: z.string().nullable().optional(),
    orderId: z.string().nonempty({ message: "Order Id is required" }),
    category: z.string().nonempty({ message: "Category is required" }),
    paymentMethod: z.enum(ENUMPaymentMethodArray, {
      error: () => ({ message: "Payment method is required" }),
    }),
    amount: z
      .union([
        z.number().gt(0, { message: "Amount must be greater than 0" }),
        z.string().nonempty({ message: "Amount is required" }),
      ])
      .refine((val) => Number(val) <= due, {
        message: "Amount cannot exceed the due amount",
      }),
  });
