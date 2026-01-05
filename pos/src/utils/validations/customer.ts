import z from "zod";
import { phoneNumberSchema } from "./common";

export const CustomerSchema = z.object({
  name: z
    .string()
    .nonempty({ message: "Name is required" })
    .min(2, { message: "Name at least 2 characters" })
    .max(100, "Must be less than 100 characters"),
  mobile: phoneNumberSchema,
});
