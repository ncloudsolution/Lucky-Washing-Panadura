import { generateServerHash } from "@/utils/payments/hash";
import { NextRequest, NextResponse } from "next/server";

// POST handler for payment notification
export async function POST(req: NextRequest) {
  try {
    const body = await req.json(); // Parse the incoming JSON body
    const { order_id, amount, currency } = body;

    const merchant_id = process.env.PAYHERE_MERCHANT_ID;
    const merchant_secret = process.env.PAYHERE_MERCHANT_SECRET;

    if (!merchant_id || !merchant_secret) {
      return NextResponse.json(
        { message: "Missing PayHere credentials" },
        { status: 500 }
      );
    }

    const data = generateServerHash(
      merchant_id,
      order_id,
      amount,
      currency,
      merchant_secret
    );

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
