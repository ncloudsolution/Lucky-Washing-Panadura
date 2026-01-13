import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const POST = async function POST(req: NextRequest) {
  try {
    const { amount, currency } = await req.json();

    const merchant_app_id = process.env.ONEPAY_APP_ID;
    const merchant_salt = process.env.ONEPAY_HASH_SALT;
    const merchant_app_token = process.env.ONEPAY_APP_TOKEN;

    if (!merchant_app_id || !merchant_salt) {
      return NextResponse.json(
        { message: "Missing Onepay credentials" },
        { status: 500 }
      );
    }

    const hashString = `${merchant_app_id}${currency}${amount}${merchant_salt}`;
    const hashValue = crypto
      .createHash("sha256")
      .update(hashString)
      .digest("hex");

    return NextResponse.json(
      { hash: hashValue, appId: merchant_app_id, appToken: merchant_app_token },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
};
