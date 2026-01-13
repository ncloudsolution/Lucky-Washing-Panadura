import { ZodSchema } from "zod";
import { NextResponse } from "next/server";
import { Control } from "react-hook-form";
import axios from "axios";
import { BaseUrl, TPaymentStatus, TPeriod } from "@/data";
import { ICacheProduct } from "@/app/(screens)/core/pos/page";

//func 1 (common form interface)
export interface CentralHKInterface {
  control: Control<any>;
  fieldName: string;
  labelName: string;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
}

// func 2 -----------------
export function backendDataValidation({
  schema,
  data,
}: {
  schema: ZodSchema;
  data: object;
}) {
  const { success, error } = schema.safeParse(data);
  if (!success) {
    return {
      validationStatus: false,
      validationResponse: NextResponse.json(
        {
          message: "Invalid input. Please check the the inputs again.",
          data: null,
          extraPayload: null,
          error: error?.issues,
        },
        { status: 400 }
      ),
    };
  }

  return { validationStatus: true, validationResponse: NextResponse.json({}) };
}

// func 2 -----------------
export async function BasicDataFetch({
  endpoint,
  method,
  data,
}: {
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  data?: object;
}) {
  try {
    const response = await fetch(endpoint, {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      ...(method !== "GET" && data ? { body: JSON.stringify(data) } : {}),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Something went wrong");
    }

    return { ...result, status: response.status };
  } catch (error) {
    throw error;
  }
}

// func 3  -----------------------
export const getVariationName = (variation: any) => {
  if (!variation) return "Default";
  return variation.Name;
  // return Object.entries(variation)
  //   .map(([key, value]) => `${key}: ${value}`)
  //   .join(", ");
};

//func 4 ---------------
export const formatDate = (isoDate: string): string[] => {
  const date = new Date(isoDate);
  const dateLine =
    date.getFullYear() +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getDate()).padStart(2, "0");
  const time =
    String(date.getHours()).padStart(2, "0") +
    ":" +
    String(date.getMinutes()).padStart(2, "0");
  //+
  // ":" +
  // String(date.getSeconds()).padStart(2, "0");
  return [dateLine, time]; // 4 spaces
};

//func 5
export function playMusic(x: string) {
  const audio = new Audio(x);
  audio.volume = 0.2; // Set volume to 50%
  audio.play();
}

//func 6
export interface IEbill {
  customerName: string;
  customerMobile: string;
  businessName: string;
  ebillLink: string;
}

export async function EbillMsg(data: IEbill) {
  await axios.post(`${BaseUrl}/api/messages/e-bill`, data);
}

//func 7
export function focusBarcode() {
  if (typeof document === "undefined") return; // ✅ skip in server
  setTimeout(() => {
    document.getElementById("barcode-input")?.focus();
  }, 300);
}

//fucnc 8

export const getProductVariantFullNameByVarientId = (
  productMetas: ICacheProduct[],
  variantId: string
) => {
  const product = productMetas.find((pr) =>
    pr.varients.some((vr) => vr.id === variantId)
  );

  if (!product) return null;

  const variant = product.varients.find((v) => v.id === variantId);

  if (!variant) return null;

  return variant.variation?.Name
    ? `${product.name} - ${variant.variation.Name}`
    : product.name;
};

export const getProductMetricByVarientId = (
  productMetas: ICacheProduct[],
  variantId: string
) => {
  const product = productMetas.find((pr) =>
    pr.varients.some((vr) => vr.id === variantId)
  );

  if (!product) return null;

  return product.metric;
};

export function getDateRange(filter: string | null) {
  const now = new Date();
  const start = new Date();

  switch (filter) {
    case "today":
      start.setHours(0, 0, 0, 0);
      return start;

    case "lastweek":
      start.setDate(now.getDate() - 7);
      return start;

    case "lastmonth":
      start.setDate(now.getDate() - 30);
      return start;

    case "lastyear":
      start.setDate(now.getDate() - 365);
      return start;

    default:
      // ⭐ All Time → return very old date
      return new Date(0); // 1970-01-01
  }
}

export function CategoryWrapper(
  FinalCategoryItems: { id: string; name: string }[]
) {
  return FinalCategoryItems.filter((i) => i.id !== "0" && i.id !== "temporary");
}

export function IncomeCategoryWrapper(FinalCategoryItems: string[]) {
  return FinalCategoryItems.filter(
    (i) =>
      i !== "Full Payment" &&
      i !== "Advance Payment" &&
      i !== "Partial Payment" &&
      i !== "Balance Payment" &&
      i !== "Credit Payment"
  );
}

export function nextMonth(date: Date) {
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + 1);
  if (d.getDate() < day) d.setDate(0);
  return d;
}

export function nextYear(date: Date) {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + 1);
  return d;
}

export function getMissedCyclesFromExpiry(
  expiresAt: Date,
  planCycle: TPeriod,
  status: TPaymentStatus
) {
  const now = new Date();
  let cyclesMissed = 0;
  let dueDate = new Date(expiresAt);

  // Treat non-approved payments like "unverified"
  let isApproved = status === "Approved";

  // If not approved, count one missed cycle immediately
  if (!isApproved) {
    cyclesMissed = 1;
  }

  if (planCycle === "Monthly") {
    while (dueDate <= now) {
      if (!isApproved) {
        // skip first loop iteration (already counted above)
        isApproved = true;
      } else {
        cyclesMissed++;
      }
      dueDate = nextMonth(dueDate);
    }
  } else {
    while (dueDate <= now) {
      if (!isApproved) {
        isApproved = true;
      } else {
        cyclesMissed++;
      }
      dueDate = nextYear(dueDate);
    }
  }

  return {
    cyclesMissed,
    dueDate, // next payable cycle date
  };
}

export function capitalizeFirstLetter(word: string) {
  if (!word) return ""; // handle empty strings
  return word.charAt(0).toUpperCase() + word.slice(1);
}
