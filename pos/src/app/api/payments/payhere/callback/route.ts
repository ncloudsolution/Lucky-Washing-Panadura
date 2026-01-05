import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Function to verify MD5 signature
function verifySignature(
  params: Record<string, string>,
  merchant_secret: string
): boolean {
  const {
    merchant_id,
    order_id,
    payment_id,
    payhere_amount,
    payhere_currency,
    status_code,
    md5sig,
  } = params;

  if (!md5sig) return false;

  const secretHashed = crypto
    .createHash("md5")
    .update(merchant_secret)
    .digest("hex")
    .toUpperCase();
  const hashString = `${merchant_id}${order_id}${payment_id}${payhere_amount}${payhere_currency}${status_code}${secretHashed}`;

  const calculatedSignature = crypto
    .createHash("md5")
    .update(hashString)
    .digest("hex")
    .toUpperCase();

  return calculatedSignature === md5sig;
}

// ✅ Handle PayHere Notification Request
export async function POST(req: NextRequest) {
  try {
    // ✅ Parse form data
    const data = await req.formData();
    const params = Object.fromEntries(data.entries()) as Record<string, string>;

    // Extract required fields
    const { order_id, status_code } = params;
    const merchant_secret = process.env.PAYHERE_MERCHANT_SECRET;

    if (!order_id || !status_code || !merchant_secret) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify payment signature
    if (!verifySignature(params, merchant_secret)) {
      return NextResponse.json(
        { message: "Invalid signature" },
        { status: 403 }
      );
    }

    // Determine payment status
    const statusMap: Record<string, string> = {
      "2": "success",
      "0": "pending",
      "-1": "canceled",
      "-2": "failed",
      "-3": "chargedback",
    };

    const paymentStatus = statusMap[status_code] || "unknown";

    // ✅ Update database with payment status (implement this)
    // await updateOrderStatus(order_id, paymentStatus);

    return NextResponse.json(
      { message: `Payment notification received: ${paymentStatus}` },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing payment notification:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
