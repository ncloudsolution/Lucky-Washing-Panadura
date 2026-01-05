import z, { nullable } from "zod";
import { fileSchema, multiInputSchema } from "./common";
import { validateHeaderValue } from "http";
import { ENUMMetricArray } from "@/data";

const VariationItemSchema = z
  .object({
    key: z.string(),
    value: z.string(),
  })
  .superRefine((data, ctx) => {
    const key = data.key.trim();
    const value = data.value.trim();

    if (!key) {
      ctx.addIssue({
        path: ["key"],
        code: z.ZodIssueCode.custom,
        message: "Attribute name is required",
      });
      return;
    }

    if (key.length < 2) {
      ctx.addIssue({
        path: ["key"],
        code: z.ZodIssueCode.custom,
        message: "Name must be at least 2 characters",
      });
    } else if (key.length > 100) {
      ctx.addIssue({
        path: ["key"],
        code: z.ZodIssueCode.custom,
        message: "Name must be less than 100 characters",
      });
    }

    if (!value) {
      ctx.addIssue({
        path: ["value"],
        code: z.ZodIssueCode.custom,
        message: "Attribute value is required",
      });
    }
  });

const VariationSchema = z.array(VariationItemSchema).nullable().optional();

const PriceItemSchema = z
  .object({
    set: z.number().int().positive(),
    reg: z.union([z.number(), z.string()]).optional(),
    sel: z.union([z.number(), z.string()]).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.reg || Number(data.reg) <= 0) {
      ctx.addIssue({
        path: ["reg"],
        code: z.ZodIssueCode.custom,
        message: "Regular price must be greater than 0",
      });
      return;
    }

    if (!data.sel || Number(data.sel) <= 0) {
      ctx.addIssue({
        path: ["sel"],
        code: z.ZodIssueCode.custom,
        message: "Selling price must be greater than 0",
      });
    }

    if (Number(data.reg) < Number(data.sel)) {
      ctx.addIssue({
        path: ["sel"],
        code: z.ZodIssueCode.custom,
        message: "Selling price must be equal or less than Regular Price",
      });
    }
  });

const PricesSchema = z
  .array(PriceItemSchema)
  .min(1, "At least one price entry is required");

//--------------------------------------------------

export const ProductCoreSchema = z.object({
  id: z.string().optional().nullable(),
  complex: z.boolean(),
  sinhalaMode: z.boolean(),
  searchQuery: z.string().nullable(),
  name: z
    .string()
    .nonempty({ message: "Name is required" })
    .min(2, { message: "Name at least 2 characters" })
    .max(100, "Must be less than 100 characters"),
  metric: z.enum(ENUMMetricArray, {
    error: () => ({ message: "Metric is required" }),
  }),
  brand: z.string().max(50, "Must be less than 50 characters").optional(),
  description: z
    .string()
    .max(10000, "Must be less than 10000 characters")
    .optional(),
  shortDescription: z
    .string()
    .max(1000, "Must be less than 1000 characters")
    .optional(),
  categories: z
    .array(z.object({ value: z.string() }))
    .min(1, "At least one category is required"),
  images: fileSchema.optional(),
  tags: multiInputSchema("text").optional(),
  barcode: z.string().optional(),
  // variation: z.record(z.string(), z.string()).optional(), // ✅ allows any string key and string value
  variation: VariationSchema,
  prices: PricesSchema,
});

export const ProductVariantSchema = z.object({
  sinhalaMode: z.boolean(),
  metaId: z.string().nullable().optional(),
  id: z.string().nullable().optional(),
  barcode: z.string().nullable().optional(),
  // variation: z.record(z.string(), z.string()).optional(), // ✅ allows any string key and string value
  variation: VariationSchema,
  prices: PricesSchema,
});

//---------------------------------------------------------------
export const ProductBaseSchema = z.object({
  sinhalaMode: z.boolean(),
  searchQuery: z.string().nullable(),
  name: z
    .string()
    .nonempty({ message: "Name is required" })
    .min(2, { message: "Name at least 2 characters" })
    .max(100, "Must be less than 100 characters"),
  metric: z.enum(ENUMMetricArray, {
    error: () => ({ message: "Metric is required" }),
  }),
  brand: z.string().max(50, "Must be less than 50 characters").optional(),
  categories: z
    .array(z.object({ value: z.string() }))
    .min(1, "At least one category is required"),
});

export const ProductStockSchema = z
  .object({
    in: z.boolean(),
    varientId: z.string().nonempty({ message: "VarientId is required" }),
    branch: z.string().nonempty({ message: "Branch is required" }),
    operator: z.string().nonempty({ message: "Operator is required" }),
    quantity: z.union([
      z.number().gt(0, { message: "Quantity must be greater than 0" }),
      z.string(),
    ]),
    remarks: z.string().max(1000, "Must be less than 1000 charactors"),
    unitPrice: z
      .union([
        z.number().gt(0, { message: "Unit Price must be greater than 0" }),
        z.string(),
      ])
      .nullable()
      .optional(),
    discount: z.union([z.number(), z.string()]).nullable().optional(),
    supplier: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      // If in is true, unitPrice is required and must be > 0
      if (data.in) {
        if (data.unitPrice === null || data.unitPrice === undefined) {
          return false;
        }
        const price =
          typeof data.unitPrice === "string"
            ? parseFloat(data.unitPrice)
            : data.unitPrice;
        return !isNaN(price) && price > 0;
      }
      // If in is false, unitPrice is optional (can be null/undefined)
      return true;
    },
    {
      message: "Unit Price is required and must be greater than 0 for stock in",
      path: ["unitPrice"],
    }
  );

export const MonoBarcodeSchema = z.object({
  barcode: z
    .string()
    .nonempty({ message: "Barcode text is required" })
    .min(2, { message: "Text need at least 2 characters" })
    .max(40, "Must be less than 40 characters"),
  quantity: z.union([
    z.number().gt(0, { message: "Quantity must be greater than 0" }),
    z.string().nonempty({ message: "Quantity is required" }),
  ]),
});

export const MiniTempTransferSchema = z.object({
  metaId: z.string().nonempty({ message: "metaId is required" }),
  varientId: z.string().nonempty({ message: "VarientId is required" }),
});
