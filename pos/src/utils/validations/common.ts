import { z } from "zod";
import libphonenumber from "google-libphonenumber";

const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();
export const phoneNumberSchema = z
  .string({ error: "Mobile number is required" })
  .nonempty({ message: "Mobile number is required" })
  .refine((number) => number.startsWith("+"), {
    message: "Number must start with + (international format)",
  })
  .refine(
    (number) => {
      try {
        const parsed = phoneUtil.parse(number);
        const countryCode = parsed.getCountryCode();
        const nationalNumberRaw = parsed.getNationalNumber();
        const nationalNumber = nationalNumberRaw?.toString() || "";

        // For Sri Lankan numbers (country code 94), ensure no leading 0 after country code
        if (countryCode === 94) {
          // Check if the part after +94 starts with 0
          if (number.startsWith("+940")) {
            return false;
          }
          // Also verify the national number doesn't start with 0
          if (nationalNumber.startsWith("0")) {
            return false;
          }
        }

        return phoneUtil.isValidNumber(parsed);
      } catch {
        return false;
      }
    },
    {
      message: "Invalid mobile number - Use 7XXXXXXXX",
    }
  );

export const MAX_FILE_SIZE = 1024 * 1024; // 1 MB
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  // "application/pdf",
];

export const fileSchema = z
  .union([
    z
      .instanceof(File)
      .refine((file) => file.size > 0, {
        message: "Image is required.",
      })
      .refine((file) => file.size <= MAX_FILE_SIZE, {
        message: "File size must be less than 1 MB.",
      })
      .refine((file) => ACCEPTED_IMAGE_TYPES.includes(file.type), {
        message: "Only .jpg, .jpeg, .png or .webp, files are supported.",
      }),
    z.string().url().optional(), // For edit mode with URL
  ])
  .refine((val) => val !== undefined && val !== null && val !== "", {
    message: "Image is required.",
  });

export const multiInputSchema = (
  type: "text" | "textarea" | "number" | "mobile"
) => {
  switch (type) {
    case "number":
      return z.array(
        z.object({
          value: z.number(),
        })
      );
    // .min(1, "Add at least one value");

    case "mobile":
      return z.array(
        z.object({
          value: phoneNumberSchema,
        })
      );
    // .min(1, "Add at least one mobile number");

    default: // text | textarea
      return z.array(
        z.object({
          value: z.string(),
        })
      );
    // .min(1, "Add at least one value");
  }
};
