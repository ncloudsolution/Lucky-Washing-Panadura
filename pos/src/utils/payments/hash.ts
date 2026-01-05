import crypto from "crypto";
import "server-only";

export const generateServerHash = (
  merchant_id: string,
  order_id: string,
  amount: string,
  currency: string,
  merchant_secret: string
) => {
  // Generate MD5 hash of merchant_secret
  const secretHash = crypto
    .createHash("md5")
    .update(merchant_secret)
    .digest("hex")
    .toUpperCase();

  // Concatenate required values
  const stringToHash = merchant_id + order_id + amount + currency + secretHash;

  // Generate final MD5 hash
  const hash = crypto
    .createHash("md5")
    .update(stringToHash)
    .digest("hex")
    .toUpperCase();

  return { hash, merchant_id };
};
